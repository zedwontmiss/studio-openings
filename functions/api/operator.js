/** Studio Openings v0.13 — authenticated owner console (Cloudflare Pages Function).
 * Config: JOBS_DB (existing D1), OPERATOR_ACCESS_TOKEN (>=32 random chars, SECRET).
 * Fail closed when missing. No public admin data or payment automation.
 */
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const error=(status,message)=>respond({ok:false,error:message},status);
const dateRe=/^\d{4}-\d{2}-\d{2}$/;
function validDate(s){if(typeof s!=='string'||!dateRe.test(s))return false;const t=Date.parse(s+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;}
function addDays(s,days){const d=new Date(Date.parse(s+'T00:00:00Z')+days*86400000);return d.toISOString().slice(0,10);}
function secureEqual(a,b){const enc=new TextEncoder(),x=enc.encode(a),y=enc.encode(b);let diff=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);return diff===0;}
function authorized(request,env){const key=env?.OPERATOR_ACCESS_TOKEN;return typeof key==='string'&&key.length>=32&&secureEqual(request.headers.get('authorization')||'','Bearer '+key);}
function verifiedOrigin(request){const u=new URL(request.url),origin=request.headers.get('origin');if(!origin)return false;try{return new URL(origin).origin===u.origin;}catch{return false;}}
function cleanSub(row){let data={};try{data=JSON.parse(row.job_data)||{};}catch{}return {
 id:row.id,status:row.status,kind:row.submission_type,title:row.job_title,company:row.company,
 email:row.contact_email,createdAt:row.created_at,reviewedAt:row.reviewed_at||'',
 featuredRequested:data.featuredInterest===true,applicationURL:row.application_url||'',
 closesOn:data.closesOn||'',location:data.location||'',role:data.role||'',mode:data.mode||'',
 companyWebsite:data.companyWebsite||'',description:data.description||''
};}
const takeId=o=>typeof o?.id==='string'&&/^SO-[A-Z0-9-]{6,45}$/i.test(o.id)?o.id:null;
async function list(env){
 const [s,c]=await Promise.all([
  env.JOBS_DB.prepare("SELECT id,status,submission_type,job_title,company,application_url,contact_email,job_data,created_at,reviewed_at FROM job_submissions WHERE status IN ('pending','approved') ORDER BY created_at DESC LIMIT 150").all(),
  env.JOBS_DB.prepare("SELECT submission_id,status,tier,starts_on,ends_on,payment_confirmed_at,updated_at FROM premium_campaigns ORDER BY updated_at DESC LIMIT 150").all()
 ]);
 return respond({ok:true,submissions:(s.results||[]).map(cleanSub),campaigns:(c.results||[]).map(x=>({submissionId:x.submission_id,status:x.status,tier:x.tier,startsOn:x.starts_on,endsOn:x.ends_on,paymentConfirmedAt:x.payment_confirmed_at,updatedAt:x.updated_at})),premiumLimit:10,source:'private D1',payments:'manual verification only'});
}
async function action(env,input){
 if(!input||typeof input!=='object'||Array.isArray(input))return error(422,'Invalid action.');
 const id=takeId(input);if(!id)return error(422,'Invalid job reference.');
 const row=await env.JOBS_DB.prepare('SELECT id,status,submission_type,job_data FROM job_submissions WHERE id = ? LIMIT 1').bind(id).first();
 if(!row)return error(404,'Submission not found.');
 if(input.action==='approve'){
   if(row.status!=='pending')return error(409,'Only pending jobs may be approved.');
   if(input.reviewConfirmed!==true)return error(422,'Confirm you independently checked the job and employer.');
   const r=await env.JOBS_DB.prepare("UPDATE job_submissions SET status='approved',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(id).run();
   if(!r.success||r.meta?.changes===0)return error(409,'Approval was not saved.');
   return respond({ok:true,message:'Approved. Job can now enter the public curated feed.'});
 }
 if(input.action==='reverify'){
   if(row.status!=='approved')return error(409,'Only approved jobs can be reverified.');
   if(input.reviewConfirmed!==true)return error(422,'Confirm the vacancy is still open at the employer source.');
   const r=await env.JOBS_DB.prepare("UPDATE job_submissions SET reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='approved'").bind(id).run();
   if(!r.success||r.meta?.changes===0)return error(409,'Re-verification was not saved.');
   return respond({ok:true,message:'Verification date refreshed. Recheck the vacancy at least every 30 days.'});
 }
 if(input.action==='activate'){
   if(env.PREMIUM_ACTIVATION_ENABLED!=='true')return error(403,'Premium activation is disabled. Enable it only after configuring and testing payments/manual verification.');
   if(row.status!=='approved'||row.submission_type!=='employer')return error(409,'A verified employer job must be approved first.');
   let data={};try{data=JSON.parse(row.job_data)||{};}catch{}
   if(data.featuredInterest!==true)return error(409,'Employer did not request featured placement.');
   if(input.paymentConfirmed!==true||input.reviewConfirmed!==true)return error(422,'You must personally verify payment and recheck the vacancy before activation.');
   const starts=input.startsOn;
   if(!validDate(starts))return error(422,'Select a valid campaign start date.');
   const today=new Date().toISOString().slice(0,10);
   if(starts<today||Date.parse(starts+'T00:00:00Z')>Date.now()+30*86400000)return error(422,'Start must be today or within the next 30 days.');
   const ends=addDays(starts,89);
   if(data.closesOn&&validDate(data.closesOn)&&data.closesOn<ends)return error(422,'The vacancy closes before the 90-day period ends. Adjust the closing date only if independently verified with the employer.');
   const existing=await env.JOBS_DB.prepare('SELECT status,ends_on FROM premium_campaigns WHERE submission_id=?').bind(id).first();
   if(existing&&(existing.status==='active'||existing.status==='paused')&&existing.ends_on>=today)return error(409,'Existing campaign must end before another can be activated.');
   const r=await env.JOBS_DB.prepare("INSERT INTO premium_campaigns (submission_id,status,tier,starts_on,ends_on,payment_confirmed_at,updated_at) VALUES (?, 'active','featured',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(submission_id) DO UPDATE SET status='active', tier='featured',starts_on=excluded.starts_on,ends_on=excluded.ends_on,payment_confirmed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP")
    .bind(id,starts,ends).run();
   if(!r.success)return error(503,'Unable to activate campaign.');
   return respond({ok:true,message:'Featured campaign active after owner attestation. Public feed visibility depends on relevance, rotation and vacancy verification.',startsOn:starts,endsOn:ends});
 }
 if(input.action==='pause'||input.action==='end'){
   const next=input.action==='pause'?'paused':'ended';
   const r=await env.JOBS_DB.prepare("UPDATE premium_campaigns SET status=?,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status IN ('active','paused')").bind(next,id).run();
   if(!r.success||r.meta?.changes===0)return error(409,'No active or paused campaign found.');
   return respond({ok:true,message:next==='paused'?'Campaign paused.':'Campaign ended.'});
 }
 if(input.action==='resume'){
   const today=new Date().toISOString().slice(0,10);
   const r=await env.JOBS_DB.prepare("UPDATE premium_campaigns SET status='active',updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='paused' AND ends_on>=? ").bind(id,today).run();
   if(!r.success||r.meta?.changes===0)return error(409,'No unexpired paused campaign found.');
   return respond({ok:true,message:'Campaign resumed.'});
 }
 return error(422,'Unsupported action.');
}
export async function onRequestGet({request,env}){
 if(!authorized(request,env))return error(401,'Operator access not configured or invalid.');
 if(!env.JOBS_DB)return error(503,'JOBS_DB not configured.');
 try{return await list(env);}catch{return error(503,'Private tables unavailable. Run the D1 migration before using the operator console.');}
}
export async function onRequestPost({request,env}){
 if(!authorized(request,env))return error(401,'Operator access not configured or invalid.');
 if(!verifiedOrigin(request))return error(403,'Invalid request origin.');
 if(!env.JOBS_DB)return error(503,'JOBS_DB not configured.');
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return error(415,'JSON required.');
 if(Number(request.headers.get('content-length')||'0')>6000)return error(413,'Too large.');
 let raw='',input;try{raw=await request.text();if(raw.length>6000)return error(413,'Too large.');input=JSON.parse(raw);}catch{return error(400,'Invalid JSON.');}
 try{return await action(env,input);}catch{return error(503,'Action could not be saved. No changes confirmed.');}
}
export async function onRequestOptions(){return error(405,'Method not allowed.');}
