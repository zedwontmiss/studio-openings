import {EMPLOYER_ROWS,activeUntil} from '../../lib/job-lifecycle.js';
import {eligibleJob} from '../../lib/seo-jobs.js';
import {remoteEligibility,officeLocation,geoMeta,POLICY_VERSION} from '../../lib/geo-policy.js';
import {outreachHeld} from '../../lib/outreach-policy.js';
/** Public read-only, APPROVED-only job feed from D1. Never exposes submitter email. */
const ROLES=new Set(['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture']);
function validHTTPS(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname);}
 catch{return false;}
}
function publicJob(row,now,nativeEnabled){
 let data;
 try{data=JSON.parse(row.job_data);}catch{return null;}
 if(row.submission_type!=='employer'&&outreachHeld(data?.company,data?.url))return null;
 if(!data||typeof data!=='object'||!ROLES.has(data.role)||!data.title||!data.company||!data.location)return null;
 const applicationMethod=data.applicationMethod||'external';
 if(!['external','native','email'].includes(applicationMethod))return null;
 if(applicationMethod==='external'&&!validHTTPS(data.url))return null;
 if(applicationMethod==='email'&&!/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(data.applicationEmail||''))return null;
 const verified=row.reviewed_at;
 const end=activeUntil(row,data,now);
 if(!Number.isFinite(end))return null;
 const geo=(data.locationVerified && data.locationReference?.countryCode)?
   {eligible:true,countryCode:data.locationReference.countryCode,raw:data.location}:
   (String(data.mode||'').toLowerCase()==='remote'?remoteEligibility(data.location):officeLocation(data.location));
 if(!geo.eligible)return null;
 const short=(x,n)=>String(x||'').trim().slice(0,n);
 return {
  id:'direct-'+String(row.id).toLowerCase(),title:short(data.title,120),company:short(data.company,100),
  location:short(data.location,90),mode:short(data.mode,12),type:short(data.type,50)||'Not specified',...geoMeta(geo),
  role:data.role,url:applicationMethod==='external'?data.url:'',applicationMethod,
  applicationEmail:applicationMethod==='email'?short(data.applicationEmail,150):'',salary:short(data.salary,75),eligibility:short(data.eligibility,170),applicantLocation:short(data.applicantLocation,100),locationReference:data.locationReference||null,applicantLocationReference:data.applicantLocationReference||null,workAuthorization:data.workAuthorization||'unspecified',visaSponsorship:data.visaSponsorship||'unspecified',
  description:String(data.description||'').trim(),expiresAt:new Date(end).toISOString(),posted:String(row.created_at||'').slice(0,10),source:'Direct / curated',
  verifiedAt:String(verified||'').slice(0,10),descriptionKind:row.submission_type==='employer'?'employer-description':'editorial-summary',detailUrl:eligibleJob(row,now,nativeEnabled)?'/jobs/'+encodeURIComponent(row.id):''
 };
}
export async function onRequestGet({env}){
 if(!env?.JOBS_DB)return new Response(JSON.stringify({jobs:[],error:'not-configured'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});
 try{
  const query=await env.JOBS_DB.prepare(EMPLOYER_ROWS+" WHERE s.status='approved' ORDER BY s.reviewed_at DESC LIMIT 150").all();
  const now=Date.now(),jobs=(query.results||[]).map(row=>publicJob(row,now,env.NATIVE_APPLY_ENABLED==='true')).filter(Boolean).filter(j=>j.applicationMethod!=='native'||env.NATIVE_APPLY_ENABLED==='true');
  return new Response(JSON.stringify({jobs,updatedAt:new Date(now).toISOString(),geoPolicy:POLICY_VERSION}),{
    status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
  });
 }catch{return new Response(JSON.stringify({jobs:[],error:'database-unavailable'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});}
}
