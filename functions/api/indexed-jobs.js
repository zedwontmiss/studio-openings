import {POLICY_VERSION} from '../../lib/coverage-policy.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff'};
export async function onRequestGet({env}){
 if(env?.INDEXED_FEED_ENABLED!=='true')return new Response(JSON.stringify({jobs:[],status:'disabled'}),{headers:{...H,'cache-control':'no-store'}});
 if(!env?.JOBS_DB)return new Response(JSON.stringify({jobs:[],status:'unconfigured'}),{status:503,headers:{...H,'cache-control':'no-store'}});
 try{
  const q=await env.JOBS_DB.prepare("SELECT j.job_json FROM source_job_snapshots j JOIN creative_sources s ON s.id=j.source_id WHERE j.state='active' AND s.status='approved' AND j.last_seen_at>=datetime('now','-72 hours') ORDER BY j.last_seen_at DESC,j.id LIMIT 200").all();
  const jobs=[],seen=new Set();
  for(const row of q.results||[]){
   let j;try{j=JSON.parse(row.job_json);}catch{continue;}
   if(!j||j.geoPolicy!==POLICY_VERSION||typeof j.description!=='string'||j.description.length<130||!/^https:\/\//.test(j.url||'')||seen.has(j.id))continue;
   jobs.push(j);seen.add(j.id);
  }
  return new Response(JSON.stringify({jobs,status:'indexed',updatedAt:new Date().toISOString(),geoPolicy:POLICY_VERSION}),{headers:H});
 }catch{return new Response(JSON.stringify({jobs:[],status:'migration-required'}),{status:503,headers:{...H,'cache-control':'no-store'}});}
}
