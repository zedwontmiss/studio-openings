/** Explicit opt-in SEO gate for indexed official ATS vacancies.
 * This never infers content-republication permission from source approval.
 * No source-based JobPosting schema until full vacancy details and a genuine
 * source posting date have been independently verified.
 */
const HTTPS=value=>{
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.includes('.')?url.href:'';}catch{return '';}
};
export function sourceSeoJob(row,now=Date.now()){
 if(!row||row.source_status!=='approved'||row.snapshot_state!=='active')return null;
 const rawSeen=String(row.last_seen_at||'').trim().replace(' ','T');
 const seen=Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(rawSeen)?rawSeen:rawSeen+'Z');
 if(!Number.isFinite(seen)||seen>now+60000||now-seen>72*3600000)return null;
 let job;try{job=JSON.parse(row.job_json||'{}');}catch{return null;}
 if(!job||job.seoPermission!=='approved'||job.seoVerified!==true)return null;
 if(!/^[a-z0-9-]{8,160}$/i.test(String(job.id||'')))return null;
 const title=String(job.title||'').trim().slice(0,150);
 const company=String(job.company||'').trim().slice(0,140);
 const description=String(job.description||'').trim().slice(0,16000);
 const location=String(job.location||'').trim().slice(0,250);
 const role=String(job.role||'');
 const url=HTTPS(job.url);
 const isExpired=job.expiresAt&&Date.parse(job.expiresAt)<=now;
 const verifiedAt=Date.parse(job.seoVerifiedAt||'');
 if(!title||!company||description.length<240||!location||!role||!url||
  isExpired||!Number.isFinite(verifiedAt)||verifiedAt>now+60000||now-verifiedAt>7*86400000)return null;
 // Do not describe an incomplete feed excerpt as a full employer description.
 if(job.descriptionKind==='source-excerpt'||job.descriptionKind==='editorial-summary')return null;
 return {id:job.id,title,company,description,location,url,role,verifiedAt:job.seoVerifiedAt,source:String(job.source||'Official careers').slice(0,120)};
}
