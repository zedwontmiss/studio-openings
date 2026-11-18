/** Public SEO pages apply only to current, verified, sufficiently detailed employer-created jobs. */
import {resolveReference,locateRaw} from './location-reference.js';
const DAY=86400000;
const TYPES={'Full-time':'FULL_TIME','Part-time':'PART_TIME','Contract':'CONTRACTOR','Internship':'INTERN'};
const safe=(s,n=2000)=>String(s||'').trim().slice(0,n);
export function parseReviewedDate(s){const value=String(s||'').trim();if(!/^\d{4}-\d\d-\d\d/.test(value))return NaN;return Date.parse(value.slice(0,10)+'T00:00:00Z');}
function https(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/(^localhost$|\.local$)/.test(u.hostname)&&u.href;}catch{return false;}}
export function eligibleJob(row,now=Date.now()){
 if(!row||row.status!=='approved'||row.submission_type!=='employer')return null;
 let d;try{d=JSON.parse(row.job_data||'{}');}catch{return null;}
 if(!d || typeof d!=='object')return null;
 const title=safe(d.title,120),company=safe(d.company,100),description=safe(d.description,1800);
 if(title.length<4||company.length<2||description.length<240||/\b(test only|do not publish|qa test)\b/i.test(title+' '+company+' '+description))return null;
 const checked=parseReviewedDate(row.reviewed_at);if(!Number.isFinite(checked)||checked>now||now-checked>31*DAY)return null;
 const ref=resolveReference(d.locationReference)||locateRaw(d.location);
 // Full, accurately structured geography is essential for JobPosting schema.
 if(!ref)return null;
 const method=d.applicationMethod||'external';
 const applyURL=method==='external'?https(d.url):method==='email'&&/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(d.applicationEmail||'')?'mailto:'+d.applicationEmail:'';
 if(!applyURL)return null;
 let expiration=checked+30*DAY;
 if(d.closesOn&&/^\d{4}-\d\d-\d\d$/.test(d.closesOn)){
   const close=Date.parse(d.closesOn+'T23:59:59Z');if(Number.isFinite(close))expiration=Math.min(expiration,close);
 }
 if(expiration<now)return null;
 const applicantRef=resolveReference(d.applicantLocationReference)||locateRaw(d.applicantLocation);
 // For remote positions, do not invent eligible jurisdictions.
 if(d.mode==='remote'&&!applicantRef && ref.kind!=='worldwide')return null;
 const id=safe(row.id,50);if(!/^SO-[A-Z0-9-]{6,45}$/i.test(id))return null;
 return {id,title,company,description,applicationMethod:method,applyURL,mode:d.mode,ref,applicantRef,
  city:safe(d.locationCity,70),location:safe(d.location,120),eligibility:safe(d.eligibility,170),
  type:d.type||'',datePosted:new Date(checked).toISOString().slice(0,10),validThrough:new Date(expiration).toISOString().slice(0,10),
  companyWebsite:https(d.companyWebsite)||'',closesOn:safe(d.closesOn,10),workAuthorization:d.workAuthorization||'unspecified',visaSponsorship:d.visaSponsorship||'unspecified'};
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export {esc};
export function toSchema(job,origin){
 const jobURL=origin+'/jobs/'+encodeURIComponent(job.id);
 const html=job.description.split(/\n\n+/).map(x=>'<p>'+esc(x).replace(/\n/g,'<br>')+'</p>').join('');
 const schema={'@context':'https://schema.org','@type':'JobPosting',title:job.title,description:html,
    identifier:{'@type':'PropertyValue',name:job.company,value:job.id},datePosted:job.datePosted,
    validThrough:job.validThrough+'T23:59:59Z',hiringOrganization:{'@type':'Organization',name:job.company},url:jobURL};
 if(job.companyWebsite)schema.hiringOrganization.sameAs=job.companyWebsite;
 if(TYPES[job.type])schema.employmentType=TYPES[job.type];
 if(job.mode==='remote'){
   schema.jobLocationType='TELECOMMUTE';
   const j=job.applicantRef||job.ref;
   if(j.kind!=='worldwide')schema.applicantLocationRequirements={ '@type':j.regionCode?'AdministrativeArea':'Country',name:j.regionCode?j.label.split(',')[0]:j.label};
 }else if(job.ref.kind!=='worldwide'){
   schema.jobLocation={'@type':'Place',address:{'@type':'PostalAddress',addressCountry:job.ref.countryCode}};
   if(job.ref.regionCode)schema.jobLocation.address.addressRegion=job.ref.regionCode;
   if(job.city)schema.jobLocation.address.addressLocality=job.city;
 }
 return schema;
}
