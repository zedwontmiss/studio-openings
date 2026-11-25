import {fetchOfficialJobs,classifyCreative,specialistTag,vacancyExcerpt,employmentTypeOf} from '../../lib/source-registry-core.js';
import {POLICY_VERSION,canUseCountry,cityCovered,US_REGIONS} from '../../lib/coverage-policy.js';
import {outreachHeld} from '../../lib/outreach-policy.js';
/** Studio Openings v1.0.1 — editorially selected, official AI/creative employer ATS feeds.
 * No generic scraping, user-provided URLs or fabricated job availability.
 * Eight independent shards, six sources maximum per request, four-hour edge cache.
 */
const SOURCES=Object.freeze([
 ['greenhouse','anthropic','Anthropic'],['greenhouse','figma','Figma'],
 ['greenhouse','snorkelai','Snorkel AI'],['greenhouse','gusto','Gusto'],
 ['greenhouse','warp','Warp'],
 ['greenhouse','brightai','BrightAI'],['greenhouse','gatherai','Gather AI'],
 ['greenhouse','checkr','Checkr'],['greenhouse','customerio','Customer.io'],
 ['greenhouse','inmarket','InMarket'],['greenhouse','codepath','CodePath'],
 ['ashby','runway-ml','Runway'],['ashby','midjourney','Midjourney'],
 ['ashby','synthesia','Synthesia'],['ashby','lumaai','Luma'],
 ['ashby','recraft','Recraft'],['ashby','gamma','Gamma'],
 ['ashby','openai','OpenAI'],['ashby','dust','Dust'],
 ['ashby','hightouch-inc','Hightouch'],['ashby','typesafe-ai','TypeSafe AI'],
 ['ashby','pencil','Pencil'],['ashby','highbeam','Highbeam'],
 ['ashby','reducto','Reducto'],['ashby','baseten','Baseten'],
 ['ashby','lovable','Lovable'],['ashby','basis-ai','Basis AI'],
 ['ashby','merciv','Merciv'],['ashby','haut-ai','Haut.AI'],
 ['ashby','strella','Strella'],['ashby','peec','Peec AI'],
 ['ashby','profound','Profound'],['ashby','read-ai','Read AI'],
 ['ashby','edra','Edra'],['ashby','traversal','Traversal'],
 ['ashby','mazehq','Maze'],
 ['greenhouse','jazzx-ai','JazzX AI'],['lever','agtonomy','Agtonomy'],
 ['greenhouse','fashionnova','Fashion Nova','fashion'],['greenhouse','dept','DEPT®','web'],
 ['lever','sfmoma','San Francisco Museum of Modern Art','museum'],
 ['greenhouse','davidzwirnergallery','David Zwirner','culture'],
 ['greenhouse','sharkninjaoperatingllc','SharkNinja','industrial'],
 ['ashby','linear','Linear'],['ashby','granola','Granola','',{'London':'London, United Kingdom'}],
 ['ashby','sierra','Sierra']
].map(([provider,board_token,name,focus,locations])=>({provider,board_token,name,focus,locations})));
const REJECT=/\b(?:software architect|solutions architect|cloud architect|data architect|sales|account manager|business development|recruiter|operations manager|finance|project manager|product manager|customer success|marketing manager|talent acquisition|open application|general application|talent pool|industrial design opportunities at)\b/i;
const US_CITIES=['San Francisco','New York','Los Angeles','Seattle','Boston','Austin','Chicago','Miami','Denver','Raleigh','San Diego','San Jose','Mountain View','Palo Alto','Menlo Park','Redwood City','Washington DC','Washington, DC','Portland','Philadelphia','Atlanta','Salt Lake City','Charlotte','Brooklyn','Irvine','Santa Monica'];
const OTHER=[
 ['GB',['London','Manchester','Edinburgh','Bristol','Cambridge','Oxford'],/\b(?:UK|United Kingdom|England|Scotland)\b/i],
 ['CA',['Toronto','Vancouver','Montreal','Ottawa','Calgary'],/\bCanada\b|\b(?:ON|BC|QC)\b/],
 ['DE',['Berlin','Munich','Hamburg'],/\bGermany\b/i],['FR',['Paris','Lyon'],/\bFrance\b/i],
 ['NL',['Amsterdam','Rotterdam'],/\bNetherlands\b/i],['CH',['Zurich','Geneva'],/\bSwitzerland\b/i],
 ['DK',['Copenhagen'],/\bDenmark\b/i],['IE',['Dublin'],/\bIreland\b/i],
 ['AU',['Sydney','Melbourne','Brisbane'],/\bAustralia\b|\b(?:NSW|VIC|QLD)\b/],
 ['SG',['Singapore'],/\bSingapore\b/i],['JP',['Tokyo'],/\bJapan\b/i]
];
const TAGS={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',product:'Product Design',visual:'Graphic Design',motion:'Motion Design',fashion:'Fashion',web:'Web Design',museum:'Exhibition',culture:'Creative Arts'};
const clean=(value,max=130)=>String(value||'').replace(/\s+/g,' ').trim().slice(0,max);
function mentions(text,city){
 const s=text.toLowerCase(),c=city.toLowerCase(),i=s.indexOf(c);
 return i>=0&&(!i||/[^a-z]/.test(s[i-1]))&&(!s[i+c.length]||/[^a-z]/.test(s[i+c.length]));
}
export function locationOf(raw){
 const s=clean(raw,140);
 if(!s||/[;|]/.test(s)||/\b(?:multiple locations|various locations|location flexible)\b/i.test(s))return null;
 if(/\bremote\b/i.test(s)){
   if(/\b(?:worldwide|anywhere in the world|global remote)\b/i.test(s))return {country:'',kind:'eligibility',mode:'remote'};
   if(/\b(?:United States|USA|U\.S\.|US only|US-based)\b/i.test(s))return {country:'US',kind:'eligibility',mode:'remote'};
   if(/\b(?:United Kingdom|UK only|UK-based)\b/i.test(s))return {country:'GB',kind:'eligibility',mode:'remote'};
   if(/\b(?:Canada|Canadian)\b/i.test(s))return {country:'CA',kind:'eligibility',mode:'remote'};
   if(/\b(?:Europe|European Union|EMEA|APAC|LATAM)\b/i.test(s))return {country:'',kind:'eligibility',mode:'remote'};
   return null; // Remote alone does not establish applicant eligibility.
 }
 if(/^(?:North America|Europe)$/i.test(s))return {country:'',kind:'eligibility',mode:''};
 const mode=/\bhybrid\b/i.test(s)?'hybrid':'';
 const usPlace=s.match(/^([\p{L}][\p{L} .'-]+),\s*([A-Z]{2}),\s*(?:USA|United States(?: of America)?)$/u);
 if(usPlace&&Object.hasOwn(US_REGIONS,usPlace[2]))return {country:'US',kind:'office',mode};
 if(/^Queens,\s*NY$/i.test(s))return {country:'US',kind:'office',mode};
 if(/^Beverly Hills,\s*(?:CA|California)(?:,\s*(?:USA|United States))?$/i.test(s))return {country:'US',kind:'office',mode};
 if(!/\b(?:United Kingdom|Canada|Australia)\b/i.test(s)&&US_CITIES.some(c=>mentions(s,c)))return {country:'US',kind:'office',mode};
 for(const [country,cities,hint] of OTHER){
   if(canUseCountry(country)&&hint.test(s)&&cities.some(c=>mentions(s,c)&&cityCovered(country,c)))return {country,kind:'office',mode};
 }
 return null; // No headquarters-based geography guessing.
}
export function creativeRole(title,description=''){
 if(REJECT.test(title))return '';
 const role=classifyCreative(title,description);
 if(role)return role;
 if(/\b(?:creative designer|performance creative designer|growth designer|marketing designer|designer,?\s+growth marketing)\b/i.test(title))return 'visual';
 if(/\b(?:motion editor|creative editor|motion graphics designer)\b/i.test(title))return 'motion';
 return '';
}
export function normalize(row,source,now){
 const title=clean(row.title,125),role=creativeRole(title,row.description);
 const location=source.locations?.[row.location]||row.location,loc=locationOf(location);
 if(!role||(source.focus&&source.focus!==role)||!loc||!row.uid||!/^https:\/\//.test(String(row.url||'')))return null;
 const description=vacancyExcerpt(row.description,950);
 if(description.length<130)return null;
 const n=Date.parse(row.posted||''),posted=Number.isFinite(n)&&n>946684800000&&n<=now+86400000?new Date(n).toISOString():'';
 const name=source.name,tags=[specialistTag(title,role)||TAGS[role]];
 const leadership=role==='visual'?(function(){
   const t=title.toLowerCase(),creative=/\bcreative[\s/-]+director\b|\bdirector[\s,-]+(?:of[\s-]+)?creative\b/.test(t),art=!creative&&(/\bart[\s/-]+director\b|\bdirector[\s,-]+of[\s-]+art\b/.test(t));
   if(creative)return ['Creative','Creative Direction',/\b(?:chief|executive|c-level)\b/.test(t)?'Executive':'Director'];
   if(art)return ['Design','Art Direction',/\bsenior\b|\bsr[.]?\b/.test(t)?'Senior':'Lead'];
   return null;
 })():null;
 if(leadership){tags.length=0;tags.push(...leadership);}
 if(role==='product'&&/\b(?:UX|UI|user experience|interaction)\b/i.test(title))tags.push('UX/UI');
 if(role==='visual'&&!leadership&&/\bbrand\b/i.test(title))tags.push('Branding');
 if(role==='motion'&&/\b3D\b/i.test(title))tags.push('3D');
 return {id:'ai-'+source.provider+'-'+source.board_token+'-'+String(row.uid).slice(0,60),
   title,company:name,location:clean(location,140),locationKind:loc.kind,mode:loc.mode,
   type:employmentTypeOf(row.employmentType,title,row.description),role,geoCountry:loc.country,geoPolicy:POLICY_VERSION,
   salary:'',posted,dateKind:posted?'posted':'added',relevance:92,tags,
   source:'Official careers · '+name,
   sourceUrl:row.url,
   url:row.url,description,descriptionKind:'source-excerpt'};
}
async function loadBoard(source,now){
 if(outreachHeld(source.name))return [];
 const records=await fetchOfficialJobs(source,fetch,{includeDescription:true}),result=[];
 for(const row of records){const job=normalize(row,source,now);if(job)result.push(job);if(result.length===20)break;}
 return result;
}
const HEAD={'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
export async function onRequestGet({request}){
 const u=new URL(request.url),shard=Number(u.searchParams.get('shard'));
 if(!Number.isInteger(shard)||shard<0||shard>=Math.ceil(SOURCES.length/6))return new Response(JSON.stringify({error:'Invalid source shard'}),{status:400,headers:{...HEAD,'cache-control':'no-store'}});
 const key=new Request(u.origin+'/api/ai-jobs?shard='+shard+'&v=9-role-excerpts&geo='+POLICY_VERSION),cache=typeof caches!=='undefined'?caches.default:null;
 if(cache)try{const hit=await cache.match(key);if(hit)return hit;}catch(_){}
 const sources=SOURCES.slice(shard*6,shard*6+6),now=Date.now();
 const outcomes=await Promise.allSettled(sources.map(s=>loadBoard(s,now)));
 const jobs=[],ok=[],failed=[],seen=new Set();
 outcomes.forEach((o,i)=>{
   if(o.status!=='fulfilled'){failed.push(sources[i].name);return;}
   ok.push(sources[i].name);
   for(const job of o.value)if(!seen.has(job.url)){seen.add(job.url);jobs.push(job);}
 });
 if(!ok.length)return new Response(JSON.stringify({error:'Official sources unavailable',failed}),{status:503,headers:{...HEAD,'cache-control':'no-store'}});
 const response=new Response(JSON.stringify({jobs:jobs.slice(0,100),truncated:jobs.length>100,sources:ok,failed,updatedAt:new Date(now).toISOString(),geoPolicy:POLICY_VERSION}),{headers:{...HEAD,'cache-control':failed.length||jobs.length>100?'public, max-age=60, s-maxage=300':'public, max-age=300, s-maxage=14400'}});
 if(cache)try{await cache.put(key,response.clone());}catch(_){}
 return response;
}
export {SOURCES};
