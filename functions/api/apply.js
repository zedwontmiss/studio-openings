import {EMPLOYER_ROWS,activeUntil} from '../../lib/job-lifecycle.js';
/** Studio Openings: on-site candidate application. No public applicant read endpoint. */
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const error=(status,code,message)=>respond({ok:false,code,message},status);
const emailOK=s=>typeof s==='string'&&s.length<=150&&/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(s);
const safeHTTPS=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname);}catch{return false;}};
async function verify(token,secret,hostname,ip){
 const body=new FormData();body.set('secret',secret);body.set('response',token);if(ip)body.set('remoteip',ip);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try {const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:controller.signal});
   if(!res.ok)return false;
   const result=await res.json();return result.success===true&&result.hostname===hostname&&result.action==='apply_job';
 }catch{return false;}finally{clearTimeout(timer);}
}
export async function onRequestPost({request,env}){
 if(!env?.JOBS_DB||!env?.TURNSTILE_SECRET_KEY||!(/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(String(env?.SUPPORT_EMAIL||''))))return error(503,'disabled','Applications are not enabled.');
 if(env.NATIVE_APPLY_ENABLED!=='true')return error(503,'disabled','On-site applications are not enabled yet.');
 const host=new URL(request.url).hostname,origin=request.headers.get('origin');
 if(origin){try{const o=new URL(origin);if(o.protocol!=='https:'||o.hostname!==host)return error(403,'origin','Invalid origin');}catch{return error(403,'origin','Invalid origin');}}
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return error(415,'type','JSON required');
 if(Number(request.headers.get('content-length'))>9000)return error(413,'large','Request too large');
 let input;
 try{const txt=await request.text();if(new TextEncoder().encode(txt).byteLength>9000)return error(413,'large','Request too large');input=JSON.parse(txt);}catch{return error(400,'json','Invalid JSON');}
 if(!input||typeof input!=='object'||Array.isArray(input))return error(422,'fields','Invalid application');
 const id=String(input.jobId||''),name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),portfolio=String(input.portfolio||'').trim(),intro=String(input.introduction||'').trim();
 if(!/^direct-so-[a-z0-9-]{8,50}$/i.test(id))return error(422,'id','Choose a direct Studio Openings vacancy');
 if(name.length<2||name.length>90||!emailOK(email)||intro.length>1500||portfolio.length>500||!input.consent)return error(422,'fields','Check name, email, introduction and consent');
 if(portfolio&&!safeHTTPS(portfolio))return error(422,'portfolio','Use a public HTTPS portfolio link');
 if(typeof input.turnstileToken!=='string'||input.turnstileToken.length<10||input.turnstileToken.length>2048)return error(400,'turnstile','Verification required');
 const verified=await verify(input.turnstileToken,env.TURNSTILE_SECRET_KEY,host,request.headers.get('CF-Connecting-IP')||'');
 if(!verified)return error(403,'turnstile','Verification failed. Try again.');
 try{
  const rawId=id.slice('direct-'.length).toUpperCase();
  const job=await env.JOBS_DB.prepare(EMPLOYER_ROWS+" WHERE s.id = ? AND s.status = 'approved' LIMIT 1").bind(rawId).first();
  if(!job)return error(404,'unavailable','The vacancy is no longer accepting applications');
  let info;try{info=JSON.parse(job.job_data);}catch{return error(503,'job','Job record unavailable');}
  if(info.applicationMethod!=='native'||!Number.isFinite(activeUntil(job,info)))return error(410,'closed','This vacancy is not accepting applications');
  const daily=await env.JOBS_DB.prepare("SELECT count(*) AS n FROM job_applications WHERE applicant_email=? AND created_at>=datetime('now','-1 day')").bind(email).first();
  if(Number(daily?.n||0)>=5)return error(429,'limit','Daily application limit reached');
  const prior=await env.JOBS_DB.prepare("SELECT id FROM job_applications WHERE job_id=? AND applicant_email=? AND status != 'deleted' LIMIT 1").bind(rawId,email).first();
  if(prior)return error(409,'duplicate','You already applied to this vacancy');
  const applicationId='APP-'+crypto.randomUUID().slice(0,12).toUpperCase();
  const saved=await env.JOBS_DB.prepare("INSERT INTO job_applications (id,job_id,applicant_name,applicant_email,portfolio_url,introduction,status) VALUES (?,?,?,?,?,?,'received')").bind(applicationId,rawId,name,email,portfolio,intro).run();
  if(saved?.success!==true)return error(503,'database','Application could not be stored');
  return respond({ok:true,reference:applicationId,status:'received',message:'Stored privately by Studio Openings for manual forwarding to the hiring team.'},201);
 }catch{return error(503,'database','Application unavailable. Try again later.');}
}
export function onRequestGet(){return error(405,'method','POST only');}
