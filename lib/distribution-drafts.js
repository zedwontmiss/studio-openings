/** Distribution draft generator: NO network calls, credentials or automatic posting.
 * Operator can review drafts before publication on an explicitly approved channel.
 */
const CHANNELS=Object.freeze(['reddit','x']);
const ROLES=Object.freeze({
 architecture:'Architecture',interior:'Interiors',industrial:'Industrial Design',product:'Product / UX',
 visual:'Graphic / Branding',motion:'Motion / 3D',fashion:'Fashion',web:'Web Design',
 museum:'Museum / Exhibition',culture:'Arts & Culture'
});
const limit=(value,size)=>String(value||'').replace(/\s+/g,' ').trim().slice(0,size);
function url(value){try{const x=new URL(value);return x.protocol==='https:'?x:null;}catch{return null;}}
export function distributionEligible(job,now=Date.now()){
 if(!job||!job.id||!Object.prototype.hasOwnProperty.call(ROLES,job.role)||job.operatorApproved!==true)return null;
 if(job.active!==true||job.sourceVerified!==true)return null;
 // A marketing post cannot imply current availability beyond the checked period.
 const checked=Date.parse(job.verifiedAt||'');
 if(!Number.isFinite(checked)||checked>now||now-checked>72*3600000)return null;
 if(job.expiresAt&&!(Date.parse(job.expiresAt)>now))return null;
 const link=url(job.detailUrl);
 if(!link||link.origin!=='https://s-o.app'||link.username||link.password||link.search||link.hash||!['/jobs/'+job.id,'/openings/'+job.id].includes(link.pathname))return null;
 if(!limit(job.title,120)||!limit(job.company,100)||!limit(job.location,160))return null;
 if(job.applicationStatus==='closed')return null;
 return {id:limit(job.id,180),title:limit(job.title,120),company:limit(job.company,100),
  location:limit(job.location,160),role:job.role,mode:limit(job.mode,50),
  salary:limit(job.salary,90),link,verifiedAt:job.verifiedAt};
}
export function draftDistributionPost(job,channel,now=Date.now()){
 if(!CHANNELS.includes(channel))return null;
 const j=distributionEligible(job,now);if(!j)return null;
 const u=new URL(j.link.href);
 u.searchParams.set('utm_source',channel);
 u.searchParams.set('utm_medium','community');
 u.searchParams.set('utm_campaign','creative_jobs');
 const title=j.title+' — '+j.company;
 const details=[j.location,j.mode,j.salary].filter(Boolean).join(' · ');
 const text=channel==='reddit'
 ? '[Hiring] '+title+'\n\n'+ROLES[j.role]+' · '+details+'\n\nSee verified details and the original application link: '+u.href
 : Array.from(title+'\n'+ROLES[j.role]+' · '+details).slice(0,Math.min(125,278-u.href.length)).join('')+'\n'+u.href;
 // The queue is never an authorization to post; live posting requires owner approval.
 return {key:channel+':'+j.id,jobId:j.id,channel,status:'draft',approved:false,
  title,body:text,targetUrl:u.href,verifiedAt:j.verifiedAt,
  requiresApproval:true,autoPublish:false};
}
export const supportedDistributionChannels=CHANNELS;
