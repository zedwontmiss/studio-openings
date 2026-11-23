import {DIRECT_SOURCES,scanDirect} from '../../lib/direct-careers.js';
const HEAD={'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
export async function onRequestGet({request}){
  const url=new URL(request.url),shard=Number(url.searchParams.get('shard')||'0');
  if(!Number.isInteger(shard)||shard<0||shard>=DIRECT_SOURCES.length)return new Response(JSON.stringify({error:'Invalid source shard'}),{status:400,headers:HEAD});
  const cache=typeof caches==='undefined'?null:caches.default;
  const key=new Request(url.origin+'/api/direct-jobs?shard='+shard+'&v=1');
  if(cache){const hit=await cache.match(key);if(hit)return hit;}
  try{
    const source=DIRECT_SOURCES[shard],data=await scanDirect(source);
    const response=new Response(JSON.stringify({...data,sources:[source.name],updatedAt:new Date().toISOString()}),{headers:{...HEAD,'cache-control':data.failed.length?'public, max-age=60, s-maxage=300':'public, max-age=300, s-maxage=14400'}});
    if(cache)await cache.put(key,response.clone());return response;
  }catch{return new Response(JSON.stringify({error:'Official career page temporarily unavailable',failed:[DIRECT_SOURCES[shard].name]}),{status:503,headers:{...HEAD,'cache-control':'no-store'}});}
}
