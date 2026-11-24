import {DIRECT_SOURCES} from '../lib/direct-careers.js';
import {outreachHeld} from '../lib/outreach-policy.js';

// Read-only checks on Preview. A failure is never interpreted as a closed job.
const base='https://development.studio-openings.pages.dev';
let failures=0;
await Promise.all(DIRECT_SOURCES.map(async (source,shard)=>{
 if(outreachHeld(source.name))return;
 let error;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(base+'/api/direct-jobs?shard='+shard,{signal:AbortSignal.timeout(12000),headers:{DNT:'1'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data.jobs)||!Array.isArray(data.failed)||data.failed.length||data.truncated||data.health?.status!=='ok')throw Error('Incomplete scan');
   if(data.jobs.some(j=>!Number.isFinite(Date.parse(j.expiresAt))||Date.parse(j.expiresAt)<=Date.now()||outreachHeld(j.company,j.url)))throw Error('Expired or held record');
   console.log(source.name+': '+data.jobs.length+' verified jobs; '+data.health.durationMs+'ms scan');return;
  }catch(e){error=e;}
 }
 console.error(source.name+': '+error.message);failures++;
}));
if(failures)process.exitCode=1;
