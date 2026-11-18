/** Public read-only approved official ATS jobs. A manual source+location verification
 * must exist for every emitted job; reputation is NOT inferred from the source name.
 * This is deliberately a small on-demand pilot, not a scheduled bulk crawler.
 */
import {fetchOfficialJobs,safeJobURL,classifyCreative,locationKey} from '../../lib/source-registry-core.js';
import {cityCovered,POLICY_VERSION} from '../../lib/coverage-policy.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=600, s-maxage=900','x-content-type-options':'nosniff'};
const reply=(obj)=>new Response(JSON.stringify(obj),{headers:H});
export async function onRequestGet({env}){
 if(!env?.JOBS_DB)return reply({jobs:[],status:'unconfigured'});
 let sources,maps;
 try{
  const [a,b]=await Promise.all([
   env.JOBS_DB.prepare("SELECT id,employer_name,official_url,provider,board_token,focus,qualification,status FROM creative_sources WHERE status='approved' ORDER BY reviewed_at DESC LIMIT 6").all(),
   env.JOBS_DB.prepare('SELECT source_id,location_key,city_name,region_name,country_name,country_code,city_id FROM source_location_maps LIMIT 700').all()
  ]);sources=a.results||[];maps=b.results||[];
 }catch{return reply({jobs:[],status:'source-registry-not-configured'});}
 const locationMap=new Map(maps.map(x=>[x.source_id+'|'+x.location_key,x]));
 const done=await Promise.allSettled(sources.map(s=>fetchOfficialJobs(s)));
 const out=[],seen=new Set(),failed=[];
 sources.forEach((s,i)=>{
  if(done[i].status!=='fulfilled'){failed.push(s.employer_name);return;}
  for(const raw of done[i].value){
   const role=classifyCreative(raw.title);if(!role)continue;
   const place=locationMap.get(s.id+'|'+locationKey(raw.location));if(!place)continue;
   if(s.qualification!=='verified_firm'&&!cityCovered(place.country_code,place.city_name))continue;
   const url=safeJobURL(raw.url,s);if(!url||seen.has(url))continue;
   seen.add(url);
   const title=raw.title.slice(0,120),company=s.employer_name.slice(0,100);
   const location=[place.city_name,place.region_name,place.country_name].join(', ');
   out.push({id:'registry-'+s.id+'-'+String(raw.uid).slice(0,48),title,company,location,
    mode:'',type:'Not specified',role,geoCountry:place.country_code,geoPolicy:POLICY_VERSION,
    url,source:'Official careers · '+company,sourceUrl:s.official_url,
    description:'Explore the '+title+' opening at '+company+'. Read the complete current requirements, eligibility, and application instructions on the employer’s official website.',
    descriptionKind:'editorial-summary',locationKind:'office',qualification:s.qualification,
    posted:'',dateKind:'added',tags:[],relevance:94});
   if(out.length>=100)break;
  }
 });
 return reply({jobs:out.slice(0,100),updatedAt:new Date().toISOString(),sources:sources.length,failed,geoPolicy:POLICY_VERSION});
}
