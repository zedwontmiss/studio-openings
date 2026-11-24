import {DIRECT_SOURCES,scanDirect} from '../../lib/direct-careers.js';
import {outreachHeld} from '../../lib/outreach-policy.js';
const HEAD={'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
export async function onRequestGet({request}){
  const url=new URL(request.url),shard=Number(url.searchParams.get('shard')||'0');
  if(!Number.isInteger(shard)||shard<0||shard>=DIRECT_SOURCES.length)return new Response(JSON.stringify({error:'Invalid source shard'}),{status:400,headers:HEAD});
  if(outreachHeld(DIRECT_SOURCES[shard].name))return new Response(JSON.stringify({jobs:[],sources:[],failed:[]}),{headers:{...HEAD,'cache-control':'no-store'}});
  const cache=typeof caches==='undefined'?null:caches.default;
  const key=new Request(url.origin+'/api/direct-jobs?shard='+shard+'&v=3');
  if(cache)try{const hit=await cache.match(key);if(hit)return hit;}catch{/* Cache unavailable; scan the official source. */}
  try{
    const source=DIRECT_SOURCES[shard],started=Date.now(),data=await scanDirect(source);
    const health={status:data.failed.length||data.truncated?'partial':'ok',durationMs:Date.now()-started,verifiedJobs:data.jobs.length};
    const response=new Response(JSON.stringify({...data,health,sources:[source.name],updatedAt:new Date().toISOString()}),{headers:{...HEAD,'cache-control':health.status==='partial'?'public, max-age=60, s-maxage=300':'public, max-age=300, s-maxage=14400'}});
    if(cache)try{await cache.put(key,response.clone());}catch{/* Feed remains usable without edge cache. */}return response;
  }catch{return new Response(JSON.stringify({error:'Official career page temporarily unavailable',failed:[DIRECT_SOURCES[shard].name]}),{status:503,headers:{...HEAD,'cache-control':'no-store'}});}
}
