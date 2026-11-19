/** Public read-only approved official ATS jobs. A manual source+location verification
 * must exist for every emitted job; reputation is NOT inferred from the source name.
 * Up to 24 operator-approved sources in four six-source read-only shards; not a scheduled bulk crawler.
 */
import {fetchOfficialJobs,safeJobURL,classifyCreative,locationKey,sourceExcerpt,employmentTypeOf} from '../../lib/source-registry-core.js';
import {cityCovered,POLICY_VERSION} from '../../lib/coverage-policy.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=600, s-maxage=900','x-content-type-options':'nosniff'};
const reply=(obj)=>new Response(JSON.stringify(obj),{headers:H});
export async function onRequestGet({request,env}){
 const cache=typeof caches==='undefined'?null:caches.default;
 const requestedShard=new URL(request.url).searchParams.get('shard')||'0';
 const shard=Number(requestedShard);
 if(!Number.isInteger(shard)||shard<0||shard>3)return new Response(JSON.stringify({error:'Unsupported source registry shard'}),{status:400,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
 const cacheKey=new Request(new URL('/api/source-jobs?version=v13-safe-excerpt&shard='+shard,request.url).toString(),{method:'GET'});
 if(cache){try{const hit=await cache.match(cacheKey);if(hit)return hit;}catch(_){}}
 if(!env?.JOBS_DB)return reply({jobs:[],status:'unconfigured'});
 let sources,maps;
 try{
  const [a,b]=await Promise.all([
   env.JOBS_DB.prepare("SELECT id,employer_name,official_url,provider,board_token,focus,qualification,status FROM creative_sources WHERE status='approved' ORDER BY reviewed_at DESC,id DESC LIMIT 6 OFFSET ?").bind(shard*6).all(),
   env.JOBS_DB.prepare('SELECT source_id,location_key,city_name,region_name,country_name,country_code,city_id FROM source_location_maps LIMIT 700').all()
  ]);sources=a.results||[];maps=b.results||[];
 }catch{return reply({jobs:[],status:'source-registry-not-configured'});}
 const locationMap=new Map(maps.map(x=>[x.source_id+'|'+x.location_key,x]));
 const done=await Promise.allSettled(sources.map(s=>fetchOfficialJobs(s,fetch,{includeDescription:true})));
 const out=[],seen=new Set(),failed=[];
 sources.forEach((s,i)=>{
  if(done[i].status!=='fulfilled'){failed.push(s.employer_name);return;}
  for(const raw of done[i].value){
   const role=classifyCreative(raw.title,raw.description),description=sourceExcerpt(raw.description,900);if(!role||description.length<130)continue;
   const place=locationMap.get(s.id+'|'+locationKey(raw.location));if(!place)continue;
   if(s.qualification!=='verified_firm'&&!cityCovered(place.country_code,place.city_name))continue;
   const url=safeJobURL(raw.url,s);if(!url||seen.has(url))continue;
   seen.add(url);
   const title=raw.title.slice(0,120),company=s.employer_name.slice(0,100);
   const location=[place.city_name,place.region_name,place.country_name].join(', ');
   out.push({id:'registry-'+s.id+'-'+String(raw.uid).slice(0,48),title,company,location,
    mode:'',type:employmentTypeOf(raw.employmentType,title,raw.description),role,geoCountry:place.country_code,geoPolicy:POLICY_VERSION,
    url,source:'Official careers · '+company,sourceUrl:s.official_url,
    description,descriptionKind:'source-excerpt',locationKind:'office',qualification:s.qualification,
    posted:'',dateKind:'added',tags:[],relevance:94});
   if(out.length>=100)break;
  }
 });
 const result=reply({jobs:out.slice(0,100),updatedAt:new Date().toISOString(),sources:sources.length,shard,failed,geoPolicy:POLICY_VERSION});
 if(cache){try{await cache.put(cacheKey,result.clone());}catch(_){}}
 return result;
}
