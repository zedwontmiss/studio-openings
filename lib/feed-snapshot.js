import {outreachHeld} from './outreach-policy.js';
import {DISCIPLINE_SLUGS} from './discipline-pages.js';
// Upstream complete feeds are cached for four hours. Allow one full 17-minute
// rotation plus operational slack; never renew the original upstream timestamp.
export const MAX_AGE=5*60*60*1000;
export const SOURCE_KEYS=Object.freeze(Array.from({length:8},(_,i)=>'ai-'+i).concat(Array.from({length:9},(_,i)=>'direct-'+i)));
export function isolated(context){
 return new URL(context.request.url).hostname==='development.studio-openings.pages.dev'&&context.env?.PREVIEW_D1_ISOLATED==='true'&&context.env?.INVENTORY_SNAPSHOT_ENABLED==='true'&&!!context.env?.JOBS_DB;
}
export function sourcePath(key){
 if(!SOURCE_KEYS.includes(key))return '';
 const [name,shard]=key.split('-');
 return '/api/'+name+'-jobs?shard='+shard;
}
import {engineeringTitle} from './job-scope.js';
function cleanJob(job,now){
 if(engineeringTitle(job?.title))return false;
 if(!job||typeof job.id!=='string'||!job.title||!job.company||!job.location||!DISCIPLINE_SLUGS.includes(job.role)||outreachHeld(job.company,job.url))return false;
 if(job.applicationMethod&&job.applicationMethod!=='external')return false;
 if(job.expiresAt&&!(Date.parse(job.expiresAt)>now))return false;
 try{const u=new URL(job.url);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.');}catch{return false;}
}
export function validateSnapshot(row,now=Date.now()){
 if(!row||!SOURCE_KEYS.includes(row.source_key)||!Number.isSafeInteger(row.generated_at)||row.generated_at>now||now-row.generated_at>=MAX_AGE)return null;
 let data;try{data=JSON.parse(row.payload_json);}catch{return null;}
 if(!data||!Array.isArray(data.jobs)||data.jobs.length>100||data.truncated||data.failed?.length||data.health&&data.health.status!=='ok')return null;
 if(data.updatedAt&&Date.parse(data.updatedAt)!==row.generated_at)return null;
 const jobs=data.jobs.filter(j=>cleanJob(j,now));
 // Do not preserve arbitrary upstream fields, application addresses or detail rights.
 return {jobs:jobs.map(j=>{
  const out={};for(const k of ['id','title','company','location','locationKind','mode','type','role','geoCountry','geoPolicy','salary','posted','dateKind','relevance','tags','source','sourceUrl','url','description','descriptionKind','expiresAt','eligibility','notice','seniority','listingId','closesOn','verifiedAt','locationReference'])if(j[k]!==undefined)out[k]=j[k];
  return out;
 }),updatedAt:new Date(row.generated_at).toISOString()};
}
export async function readSnapshots(context){
 if(!isolated(context))return {version:1,sources:{}};
 try{
  const result=await context.env.JOBS_DB.prepare('SELECT source_key,generated_at,payload_json FROM public_feed_snapshots WHERE generated_at>? LIMIT 17').bind(Date.now()-MAX_AGE).all();
  const sources={};for(const row of result.results||[]){const value=validateSnapshot(row);if(value)sources[row.source_key]=value;}
  return {version:1,sources};
 }catch{return {version:1,sources:{}};}
}
