import {operator, preview, sameOrigin} from './ingest-setup.js';
import {EMPLOYER_ROWS, activeUntil, timestamp, DAY} from '../../lib/job-lifecycle.js';
import {eligibleJob} from '../../lib/seo-jobs.js';
import {sourceSeoJob} from '../../lib/source-seo-policy.js';
import {draftDistributionPost} from '../../lib/distribution-drafts.js';
import {safeJobURL} from '../../lib/source-registry-core.js';

const reply = (value,status=200) => Response.json(value,{status,headers:{'cache-control':'private, no-store'}});
const fail = (error,status) => reply({ok:false,error},status);
const snapshots = "SELECT j.id,j.source_id,j.job_json,j.last_seen_at,s.provider,s.board_token,s.employer_name FROM source_job_snapshots j JOIN creative_sources s ON j.source_id=s.id WHERE j.state='active' AND j.miss_count=0 AND s.status='approved' AND j.last_seen_at BETWEEN datetime('now','-72 hours') AND CURRENT_TIMESTAMP";
const fingerprint = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))), b=>b.toString(16).padStart(2,'0')).join('');
const snapshotVersion = row => fingerprint(JSON.stringify([row.id,row.job_json,row.provider,row.board_token,row.employer_name]));
function authorized({env,request}) {
  if (!preview(request) || env.PREVIEW_D1_ISOLATED !== 'true') return fail('Queue requires an isolated development Preview database.',403);
  if (!operator(request,env)) return fail('Operator authorization required.',401);
  if (!env.JOBS_DB) return fail('Preview database unavailable.',503);
}

async function initialize(context) {
  // The migration is a version-controlled static asset of this Pages deployment.
  // Splitting only before top-level CREATE preserves complete trigger bodies.
  const url=new URL('/migrations/0002_review_and_metrics.sql',context.request.url);
  const asset=await context.env.ASSETS.fetch(new Request(url));
  if(!asset.ok) return fail('Preview migration file unavailable.',503);
  const script=(await asset.text()).replace(/^--[^\n]*$/gm,'').trim();
  const statements=script.split(/;\s*(?=CREATE\s)/i);
  if(!statements.every(s=>/^CREATE (TABLE|VIEW|TRIGGER|INDEX) IF NOT EXISTS /i.test(s))) return fail('Unexpected Preview migration format.',503);
  const db=context.env.JOBS_DB;
  await db.batch(statements.map(s=>db.prepare(s)));
  return reply({ok:true});
}

async function inventory(env) {
  const db=env.JOBS_DB;
  await db.prepare("UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE status<>'withdrawn' AND (valid_until<=? OR (job_id LIKE 'registry-%' AND ?=0))").bind(Date.now(),Number(env.SOURCE_SEO_ENABLED==='true')).run();
  const [q,c,e,a,m]=await db.batch([
    db.prepare('SELECT job_id,channel,original_url,body,status,fingerprint FROM distribution_queue ORDER BY updated_at DESC,job_id LIMIT 150'),
    db.prepare(snapshots+' ORDER BY j.last_seen_at DESC LIMIT 100'),
    db.prepare(EMPLOYER_ROWS+" WHERE s.status='approved' AND s.reviewed_at>=datetime('now','-72 hours') ORDER BY s.reviewed_at DESC LIMIT 100"),
    db.prepare('SELECT job_id,channel,event,recorded_at FROM distribution_audit ORDER BY id DESC LIMIT 60'),
    db.prepare("SELECT day,event,referral,job_key,total FROM traffic_daily WHERE day>=date('now','-29 days') ORDER BY day DESC,total DESC LIMIT 100")
  ]);
  const candidates=[];
  for(const row of c.results) {
    const job=JSON.parse(row.job_json);
    if(!job || job.id!==row.id || !safeJobURL(job.url,row)) continue;
    candidates.push({id:row.id,title:job.title,company:row.employer_name,location:job.location,url:job.url,version:await snapshotVersion(row),source:true});
  }
  for(const row of e.results) {
    const job=eligibleJob(row);
    if(job && job.applicationMethod==='external') candidates.push({id:job.id,title:job.title,company:job.company,location:job.location,url:job.applyURL});
  }
  return reply({ok:true,candidates,queue:q.results,audit:a.results,metrics:m.results});
}

async function review(db,input) {
  if(input.action==='revoke'){
    await db.prepare('DELETE FROM source_job_reviews WHERE job_id=?').bind(input.id).run();
    return reply({ok:true});
  }
  if(input.confirmed!==true || typeof input.description!=='string' || input.description.trim().length<240 || input.description.length>16000 ||
     typeof input.evidence!=='string' || !input.evidence.trim() || input.evidence.length>500) return fail('Record reuse permission, full authorized text and verification.',422);
  const row=await db.prepare(snapshots+' AND j.id=?').bind(input.id).first();
  if(!row || await snapshotVersion(row)!==input.version) return fail('Vacancy changed. Reload and review it again.',409);
  const job=JSON.parse(row.job_json);
  if(job.id!==row.id || !safeJobURL(job.url,row)) return fail('Official vacancy link required.',422);
  const r=await db.prepare('INSERT INTO source_job_reviews(job_id,source_id,snapshot_json,original_url,rights_evidence,full_description) SELECT id,source_id,job_json,?,?,? FROM ('+snapshots+') WHERE id=? AND job_json=? AND provider=? AND board_token=? AND employer_name=? ON CONFLICT(job_id) DO UPDATE SET snapshot_json=excluded.snapshot_json,source_id=excluded.source_id,original_url=excluded.original_url,rights_evidence=excluded.rights_evidence,full_description=excluded.full_description,verified_at=CURRENT_TIMESTAMP')
    .bind(job.url,input.evidence.trim(),input.description.trim(),row.id,row.job_json,row.provider,row.board_token,row.employer_name).run();
  return r.meta.changes ? reply({ok:true}) : fail('Vacancy changed.',409);
}

async function candidate(env,id,now) {
  const db=env.JOBS_DB;
  let job, checked, end, original, proof, args, path;
  if(id.startsWith('SO-')){
    const row=await db.prepare(EMPLOYER_ROWS+' WHERE s.id=?').bind(id).first();
    const seo=eligibleJob(row,now);
    if(!seo || seo.applicationMethod!=='external') return null;
    const data=JSON.parse(row.job_data);
    job={id,title:seo.title,company:seo.company,location:seo.location,role:data.role,mode:seo.mode,salary:data.salary};
    checked=timestamp(row.reviewed_at); end=activeUntil(row,data,now); original=seo.applyURL; path='/jobs/';
    proof=EMPLOYER_ROWS+" WHERE s.id=? AND s.status='approved' AND s.submission_type='employer' AND s.job_data=? AND s.reviewed_at=? AND o.status='paid' AND o.tier=? AND o.published_at=?";
    args=[id,row.job_data,row.reviewed_at,row.order_tier,row.order_published_at];
  }else{
    if(env.SOURCE_SEO_ENABLED!=='true') return null;
    const row=await db.prepare('SELECT * FROM reviewed_source_jobs WHERE id=?').bind(id).first();
    job=sourceSeoJob(row,now);
    if(!job) return null;
    checked=timestamp(row.verified_at); end=job.end; original=job.url; path='/openings/';
    proof='SELECT id FROM reviewed_source_jobs WHERE id=? AND job_json=? AND verified_at=? AND full_description=? AND rights_evidence=? AND last_seen_at=?';
    args=[id,row.job_json,row.verified_at,row.full_description,row.rights_evidence,row.last_seen_at];
  }
  end=Math.min(end,checked+3*DAY);
  if(!(end>now)) return null;
  return {job:{...job,operatorApproved:true,active:true,sourceVerified:true,verifiedAt:new Date(checked).toISOString(),expiresAt:new Date(end).toISOString(),detailUrl:'https://s-o.app'+path+id},original,end,proof,args};
}

async function transition(env,input) {
  const db=env.JOBS_DB, now=Date.now();
  const {id,channel,action}=input;
  if(!['reddit','x'].includes(channel)) return fail('Unknown channel.',422);
  const key=[id,channel];
  if(action==='withdraw'){
    const changed=await db.prepare("UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE job_id=? AND channel=? AND fingerprint=?").bind(...key,String(input.version||'')).run();
    return changed.meta.changes ? reply({ok:true}) : fail('Draft changed. Reload the queue.',409);
  }
  const current=await candidate(env,id,now);
  if(!current) return fail('Current verification and a publishable job page are required.',409);
  const draft=draftDistributionPost(current.job,channel,now);
  if(!draft) return fail('Job is ineligible for distribution.',422);
  const version=await fingerprint(JSON.stringify([draft.body,current.original,current.job.verifiedAt,current.args.slice(0,-1)]));
  const guard=' AND EXISTS ('+current.proof+')';
  if(action==='draft'){
    await db.prepare('INSERT INTO distribution_queue(job_id,channel,original_url,body,fingerprint,valid_until) SELECT ?,?,?,?,?,? WHERE 1'+guard+
      " ON CONFLICT(job_id,channel) DO UPDATE SET original_url=excluded.original_url,body=excluded.body,fingerprint=excluded.fingerprint,valid_until=excluded.valid_until,status='draft',updated_at=CURRENT_TIMESTAMP WHERE distribution_queue.exported_at IS NULL AND (distribution_queue.status='withdrawn' OR distribution_queue.fingerprint<>excluded.fingerprint)")
      .bind(...key,current.original,draft.body,version,current.end,...current.args).run();
  }else{
    if(input.version!==version) return fail('Draft changed. Generate and review it again.',409);
    const approve=action==='approve';
    const cadence=approve?'':" AND (SELECT count(*) FROM distribution_queue WHERE channel=? AND exported_at>?)<?";
    const window=channel==='reddit'?DAY:7*DAY;
    await db.prepare("UPDATE distribution_queue SET status=?,updated_at=CURRENT_TIMESTAMP"+(approve?'':',exported_at=?')+" WHERE job_id=? AND channel=? AND fingerprint=? AND valid_until>? AND status=?"+guard+cadence)
      .bind(approve?'approved':'exported',...(approve?[]:[now]),...key,version,now,approve?'draft':'approved',...current.args,...(approve?[]:[channel,now-window,channel==='reddit'?1:4])).run();
  }
  const saved=await db.prepare('SELECT status,body,fingerprint,valid_until FROM distribution_queue WHERE job_id=? AND channel=?').bind(...key).first();
  if(!saved || saved.valid_until<=Date.now() || saved.fingerprint!==version || saved.status==='withdrawn' || (action==='export' && saved.status!=='exported') || (action==='approve' && saved.status!=='approved')) return fail('Draft unavailable, approval missing or channel export limit reached.',409);
  return reply({ok:true,status:saved.status,...(action==='export'?{body:saved.body}:{})});
}

export async function onRequest(context) {
  const {request,env}=context;
  const denied=authorized(context); if(denied) return denied;
  try{
    if(request.method==='GET') return await inventory(env);
    if(request.method!=='POST') return fail('Method unavailable.',405);
    if(!sameOrigin(request)) return fail('Invalid origin.',403);
    if(!request.headers.get('content-type')?.startsWith('application/json')) return fail('JSON required.',415);
    const raw=await request.text(); if(raw.length>24000) return fail('Request too large.',413);
    let input; try{input=JSON.parse(raw);}catch{return fail('Invalid JSON.',400);}
    if(input?.action==='initialize' && input.confirmed===true) return await initialize(context);
    if(!input || !/^[a-z0-9-]{8,160}$/i.test(input.id||'')) return fail('Invalid vacancy ID.',422);
    if(['review','revoke'].includes(input.action)) return await review(env.JOBS_DB,input);
    if(!['draft','approve','export','withdraw'].includes(input.action)) return fail('Unknown action.',422);
    return await transition(env,input);
  }catch(err){
    if(String(err.message).includes('UNIQUE constraint'))return fail('A draft already exists for this original vacancy and channel.',409);
    return fail('Queue unavailable. Check the isolated Preview migration.',503);
  }
}
