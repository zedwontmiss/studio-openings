import {fetchOfficialJobScan,safeJobURL,locationKey,classifyCreative,sourceExcerpt,employmentTypeOf} from '../../lib/source-registry-core.js';
import {cityCovered,POLICY_VERSION} from '../../lib/coverage-policy.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store'};
const respond=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:H});
function equal(a,b){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let n=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)n|=(x[i]||0)^(y[i]||0);return n===0;}
function auth(req,env){
 const v=req.headers.get('authorization')||'';
 return ['OPERATOR_ACCESS_TOKEN','SOURCING_INGEST_SECRET'].some(k=>typeof env[k]==='string'&&env[k].length>=32&&equal(v,'Bearer '+env[k]));
}
function operator(req,env){const t=env?.OPERATOR_ACCESS_TOKEN;return typeof t==='string'&&t.length>=32&&equal(req.headers.get('authorization')||'','Bearer '+t);}
function preview(req){try{return new URL(req.url).hostname==='development.studio-openings.pages.dev';}catch{return false;}}
function originOK(req){try{return new URL(req.headers.get('origin')).origin===new URL(req.url).origin;}catch{return false;}}
const sql="SELECT id,employer_name,official_url,provider,board_token,qualification FROM creative_sources WHERE status='approved'";
async function sourceFor(db,id){
 if(id)return db.prepare(sql+' AND id=? LIMIT 1').bind(id).first();
 const c=await db.prepare("SELECT last_source_id FROM source_ingest_cursor WHERE name='rotation'").first();
 const next=await db.prepare(sql+' AND id>? ORDER BY id LIMIT 1').bind(c?.last_source_id||'').first()||await db.prepare(sql+' ORDER BY id LIMIT 1').first();
 if(next)await db.prepare("UPDATE source_ingest_cursor SET last_source_id=? WHERE name='rotation'").bind(next.id).run();
 return next;
}
export function normalized(row,source,place){
 if(!place||!row.uid)return null;
 const role=classifyCreative(row.title,row.description),description=sourceExcerpt(row.description,950),url=safeJobURL(row.url,source);
 if(!role||description.length<130||!url)return null;
 if(source.qualification!=='verified_firm'&&!cityCovered(place.country_code,place.city_name))return null;
 const uid=String(row.uid).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60);if(uid.length<4)return null;
 const title=String(row.title).slice(0,120),company=String(source.employer_name).slice(0,100);
 const timestamp=Date.parse(row.posted||''),posted=Number.isFinite(timestamp)&&timestamp>946684800000&&timestamp<=Date.now()+86400000?new Date(timestamp).toISOString():'';
 return {id:'registry-'+source.id+'-'+uid,title,company,location:[place.city_name,place.region_name,place.country_name].filter(Boolean).join(', '),locationKind:'office',mode:'',type:employmentTypeOf(row.employmentType,title,row.description),role,geoCountry:place.country_code,geoPolicy:POLICY_VERSION,url,source:'Official careers · '+company,sourceUrl:source.official_url,description,descriptionKind:'source-excerpt',posted,dateKind:posted?'posted':'added',salary:'',tags:[],relevance:94};
}
async function health(db,id,status,n,m){
 await db.prepare("INSERT INTO source_ingest_health(source_id,last_attempt_at,last_success_at,status,source_count,matched_count,failure_streak) VALUES(?,CURRENT_TIMESTAMP,CASE WHEN ?='ok' THEN CURRENT_TIMESTAMP ELSE NULL END,?,?,?,CASE WHEN ?='ok' THEN 0 ELSE 1 END) ON CONFLICT(source_id) DO UPDATE SET last_attempt_at=CURRENT_TIMESTAMP,last_success_at=CASE WHEN excluded.status='ok' THEN CURRENT_TIMESTAMP ELSE last_success_at END,status=excluded.status,source_count=excluded.source_count,matched_count=excluded.matched_count,failure_streak=CASE WHEN excluded.status='ok' THEN 0 ELSE failure_streak+1 END").bind(id,status,status,n,m,status).run();
}
export async function sync(db,source,fetcher=fetch){
 const lease='scan:'+source.id,now=Date.now(),token=(now+120000)+':'+crypto.randomUUID();
 const acquired=await db.prepare("INSERT INTO source_ingest_cursor(name,last_source_id) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET last_source_id=excluded.last_source_id WHERE CAST(last_source_id AS INTEGER)<=?").bind(lease,token,now).run();
 if(!acquired.meta.changes)return {ok:false,busy:true,error:'Source scan already in progress.'};
 try{return await scan(db,source,fetcher,lease,token);}
 finally{await db.prepare('DELETE FROM source_ingest_cursor WHERE name=? AND last_source_id=?').bind(lease,token).run();}
}
async function scan(db,source,fetcher,lease,token){
 let scan;
 try{scan=await fetchOfficialJobScan(source,fetcher,{includeDescription:true});}
 catch(_){await health(db,source.id,'fetch_failed',0,0);return {ok:false,error:'Official ATS fetch failed; snapshots retained.'};}
 const rows=scan.rows;
 const mapped=await db.prepare('SELECT location_key,city_name,region_name,country_name,country_code FROM source_location_maps WHERE source_id=? LIMIT 800').bind(source.id).all();
 const lookup=new Map((mapped.results||[]).map(r=>[r.location_key,r])),jobs=[],seen=new Set();
 for(const r of rows){
  const job=normalized(r,source,lookup.get(locationKey(r.location)));
  if(!job||seen.has(job.id))continue;
  seen.add(job.id);jobs.push(job);if(jobs.length>=100)break;
 }
 // One transaction per board. Late scans cannot overwrite a newer lease.
 const guard="EXISTS (SELECT 1 FROM source_ingest_cursor WHERE name=? AND last_source_id=?) AND EXISTS (SELECT 1 FROM creative_sources WHERE id=? AND status='approved')";
 const proof=[lease,token,source.id];
 const statements=jobs.map(j=>db.prepare("INSERT INTO source_job_snapshots(id,source_id,job_json,state,scan_token,last_seen_at,miss_count) SELECT ?,?,?,'active',?,CURRENT_TIMESTAMP,0 WHERE "+guard+" ON CONFLICT(id) DO UPDATE SET job_json=excluded.job_json,state='active',scan_token=excluded.scan_token,last_seen_at=CURRENT_TIMESTAMP,miss_count=0").bind(j.id,source.id,JSON.stringify(j),token,...proof));
 const complete=scan.complete&&jobs.length<100;
 // A job present upstream but temporarily failing normalization is not proof of closure.
 const present=new Set((scan.presentUIDs||rows.map(r=>r.uid)).map(uid=>String(uid).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60)).filter(uid=>uid.length>=4));
 const existing=complete?await db.prepare("SELECT id FROM source_job_snapshots WHERE source_id=? AND state='active'").bind(source.id).all():{results:[]};
 const missing=complete?(existing.results||[]).filter(r=>r.id.startsWith('registry-'+source.id+'-')&&!present.has(r.id.slice(('registry-'+source.id+'-').length))):[];
 for(const row of missing)statements.push(db.prepare("UPDATE source_job_snapshots SET miss_count=miss_count+1,state=CASE WHEN miss_count>=1 THEN 'retired' ELSE state END WHERE id=? AND source_id=? AND state='active' AND scan_token<>? AND "+guard).bind(row.id,source.id,token,...proof));
 if(statements.length)await db.batch(statements);
 await health(db,source.id,complete?'ok':'partial',rows.length,jobs.length);
 return {ok:true,source:source.employer_name,atsJobs:rows.length,indexed:jobs.length,verifiedLocations:lookup.size,retirement:complete?'double-confirmed':'skipped'};
}
export async function onRequestPost({request,env}){
 if(!env?.JOBS_DB)return respond({ok:false,error:'Preview D1 is not bound.'},503);
 if(!preview(request)||env.PREVIEW_D1_ISOLATED!=='true')return respond({ok:false,error:'Isolated Preview sync only.'},403);
 if(!auth(request,env))return respond({ok:false,error:'Unauthorized.'},401);
 // Manual operator sync is available after Preview bootstrap. Scheduled workers
 // require separate explicit activation and may not bypass the operator workflow.
 if(operator(request,env)){if(!originOK(request))return respond({ok:false,error:'Invalid operator origin.'},403);}
 else if(env.SOURCE_INGEST_ENABLED!=='true'||env.SOURCING_INGEST_SECRET===env.INVENTORY_SNAPSHOT_SECRET)return respond({ok:false,error:'Scheduled ingestion is disabled or credentials are not distinct.'},503);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON required.'},415);
 let payload;try{const raw=await request.text();if(raw.length>1200)throw Error('size');payload=JSON.parse(raw);}catch{return respond({ok:false,error:'Invalid JSON.'},400);}
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return respond({ok:false,error:'Invalid request.'},422);
 if(payload.sourceId!==undefined&&!/^src-[a-z0-9-]{15,55}$/i.test(payload.sourceId))return respond({ok:false,error:'Invalid source ID.'},422);
 try{const source=await sourceFor(env.JOBS_DB,payload.sourceId||'');if(!source)return respond({ok:!payload.sourceId,status:'no-approved-source'},payload.sourceId?404:200);const r=await sync(env.JOBS_DB,source);return respond(r,r.ok?200:r.busy?409:502);}
 catch{return respond({ok:false,error:'Sync failed; verify Preview D1 schema and approved source.'},503);}
}
export async function onRequestGet({request,env}){
 if(!preview(request)||!env?.JOBS_DB||!operator(request,env))return respond({ok:false,error:'Preview operator access required.'},401);
 try{
  const [a,b]=await Promise.all([
   env.JOBS_DB.prepare("SELECT h.source_id,h.last_attempt_at,h.last_success_at,h.status,h.source_count,h.matched_count,h.failure_streak FROM source_ingest_health h JOIN creative_sources s ON s.id=h.source_id WHERE s.status IN ('approved','paused') ORDER BY h.last_attempt_at DESC LIMIT 180").all(),
   env.JOBS_DB.prepare("SELECT COUNT(*) AS total FROM source_job_snapshots j JOIN creative_sources s ON s.id=j.source_id WHERE j.state='active' AND s.status='approved' AND j.last_seen_at>=datetime('now','-72 hours')").first()
  ]);
  return respond({ok:true,health:(a.results||[]).map(r=>({sourceId:r.source_id,lastAttempt:r.last_attempt_at,lastSuccess:r.last_success_at,status:r.status,sourceCount:r.source_count,matched:r.matched_count,failures:r.failure_streak})),freshCount:Number(b?.total||0)});
 }catch{return respond({ok:false,error:'Preview ingestion migration missing.'},503);}
}
