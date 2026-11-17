import {remoteEligibility,officeLocation,geoMeta,POLICY_VERSION} from '../../lib/geo-policy.js';
/** Public read-only, APPROVED-only job feed from D1. Never exposes submitter email. */
const ROLES=new Set(['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture']);
function validHTTPS(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname);}
 catch{return false;}
}
function publicJob(row,now){
 let data;
 try{data=JSON.parse(row.job_data);}catch{return null;}
 if(!data||typeof data!=='object'||!ROLES.has(data.role)||!data.title||!data.company||!data.location)return null;
 const applicationMethod=data.applicationMethod||'external';
 if(!['external','native','email'].includes(applicationMethod))return null;
 if(applicationMethod==='external'&&!validHTTPS(data.url))return null;
 if(applicationMethod==='email'&&!/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(data.applicationEmail||''))return null;
 const verified=row.reviewed_at||row.created_at;
 let lastCheck=Date.parse(String(verified||'').replace(' ','T')+'Z');
 if(Number.isNaN(lastCheck))return null;
 // With no separate daily monitor, retire unverified posts after 30 days.
 if(now-lastCheck>30*86400000)return null;
 const geo=(String(data.mode||'').toLowerCase()==='remote')?
   remoteEligibility(data.location):officeLocation(data.location);
 if(!geo.eligible)return null;
 if(data.closesOn){
   const closes=Date.parse(data.closesOn+'T23:59:59Z');
   if(Number.isFinite(closes)&&closes<now)return null;
 }
 const short=(x,n)=>String(x||'').trim().slice(0,n);
 return {
  id:'direct-'+String(row.id).toLowerCase(),title:short(data.title,120),company:short(data.company,100),
  location:short(data.location,90),mode:short(data.mode,12),type:short(data.type,50)||'Not specified',...geoMeta(geo),
  role:data.role,url:applicationMethod==='external'?data.url:'',applicationMethod,
  applicationEmail:applicationMethod==='email'?short(data.applicationEmail,150):'',salary:short(data.salary,75),eligibility:short(data.eligibility,170),
  description:short(data.description,1800),posted:String(verified||'').slice(0,10),source:'Direct / curated',
  verifiedAt:String(verified||'').slice(0,10),descriptionKind:'editorial-summary'
 };
}
export async function onRequestGet({env}){
 if(!env?.JOBS_DB)return new Response(JSON.stringify({jobs:[],error:'not-configured'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});
 try{
  const query=await env.JOBS_DB.prepare("SELECT id, job_data, created_at, reviewed_at FROM job_submissions WHERE status = 'approved' ORDER BY reviewed_at DESC LIMIT 150").all();
  const now=Date.now(),jobs=(query.results||[]).map(row=>publicJob(row,now)).filter(Boolean).filter(j=>j.applicationMethod!=='native'||env.NATIVE_APPLY_ENABLED==='true');
  return new Response(JSON.stringify({jobs,updatedAt:new Date(now).toISOString(),geoPolicy:POLICY_VERSION}),{
    status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180','x-content-type-options':'nosniff'}
  });
 }catch{return new Response(JSON.stringify({jobs:[],error:'database-unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});}
}
