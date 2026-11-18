/** Studio Openings — operator-only creative career-source registry.
 * No user-supplied URL is ever fetched. Only vetted ATS providers / board tokens.
 * Review and verified geographic mappings required before new jobs publish.
 */
import {cleanSourceInput,fetchOfficialJobs,locationKey,classifyCreative,validLocationString,FOCI} from '../../lib/source-registry-core.js';
import {verifyCityReference} from '../../lib/place-provider.js';
import {cityCovered} from '../../lib/coverage-policy.js';
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEAD});
const fail=(code,msg)=>reply({ok:false,error:msg},code);
function secureEq(a,b){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);return d===0;}
function auth(req,env){const t=env?.OPERATOR_ACCESS_TOKEN;return typeof t==='string'&&t.length>=32&&secureEq(req.headers.get('authorization')||'','Bearer '+t);}
function originOK(req){try{return new URL(req.headers.get('origin')||'invalid').origin===new URL(req.url).origin;}catch{return false;}}
const sourceId=x=>typeof x==='string'&&/^src-[a-z0-9-]{15,55}$/i.test(x)?x:'';
const mapped=(rows)=>rows.map(m=>({sourceId:m.source_id,rawLocation:m.raw_location,locationKey:m.location_key,cityName:m.city_name,regionName:m.region_name,countryName:m.country_name,countryCode:m.country_code,cityId:m.city_id}));
async function list(env){
 const [s,m]=await Promise.all([env.JOBS_DB.prepare('SELECT id,employer_name,official_url,provider,board_token,focus,qualification,status,reviewed_at,checked_at,created_at FROM creative_sources ORDER BY created_at DESC LIMIT 180').all(),env.JOBS_DB.prepare('SELECT source_id,raw_location,location_key,city_name,region_name,country_name,country_code,city_id FROM source_location_maps ORDER BY verified_at DESC LIMIT 900').all()]);
 return reply({ok:true,sources:(s.results||[]).map(x=>({id:x.id,employerName:x.employer_name,officialURL:x.official_url,provider:x.provider,boardToken:x.board_token,focus:x.focus,qualification:x.qualification,status:x.status,reviewedAt:x.reviewed_at,checkedAt:x.checked_at,createdAt:x.created_at})),maps:mapped(m.results||[]),policy:'Official ATS only; city-first or operator-verified firm exception.'});
}
async function mutate(env,input){
 if(!input||typeof input!=='object'||Array.isArray(input))return fail(422,'Invalid request.');
 const act=String(input.action||'');
 if(act==='add'){
  let d;try{d=cleanSourceInput(input);}catch(e){return fail(422,e.message);}
  const id='src-'+crypto.randomUUID();
  try{await env.JOBS_DB.prepare("INSERT INTO creative_sources(id,employer_name,official_url,provider,board_token,focus,qualification,status) VALUES(?,?,?,?,?,?,?,'pending')").bind(id,d.name,d.officialURL,d.provider,d.token,d.focus,d.qualification).run();}
  catch{return fail(409,'Source already registered or registry table unavailable.');}
  return reply({ok:true,message:'Career source added for private review. Not published yet.',id},201);
 }
 const id=sourceId(input.id);if(!id)return fail(422,'Invalid source ID.');
 const s=await env.JOBS_DB.prepare('SELECT * FROM creative_sources WHERE id=? LIMIT 1').bind(id).first();
 if(!s)return fail(404,'Source not found.');
 if(act==='inspect'){
  let jobs;try{jobs=await fetchOfficialJobs(s);}catch(e){return fail(502,e.message||'Official ATS unavailable.');}
  const counts=new Map();let eligible=0;
  for(const j of jobs){if(!classifyCreative(j.title))continue;eligible++;if(!validLocationString(j.location))continue;const k=locationKey(j.location);if(!counts.has(k))counts.set(k,{rawLocation:j.location,count:0,sampleTitle:j.title});counts.get(k).count++;}
  if(s.status==='approved')await env.JOBS_DB.prepare('UPDATE creative_sources SET checked_at=CURRENT_TIMESTAMP WHERE id=?').bind(id).run();
  return reply({ok:true,totalPublished:jobs.length,creativeTitles:eligible,locations:[...counts.values()].sort((a,b)=>b.count-a.count).slice(0,70),note:'Raw source locations are unverified until you map them to canonical city records.'});
 }
 if(act==='approve'){
  if(input.reviewConfirmed!==true)return fail(422,'Confirm you verified the official employer and careers source.');
  try{await fetchOfficialJobs(s);}catch(e){return fail(422,'The public ATS board could not be verified: '+e.message);}
  await env.JOBS_DB.prepare("UPDATE creative_sources SET status='approved',reviewed_at=CURRENT_TIMESTAMP,checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
  return reply({ok:true,message:'Official career source approved. Jobs publish only after their locations are individually mapped.'});
 }
 if(act==='pause'){
  await env.JOBS_DB.prepare("UPDATE creative_sources SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();return reply({ok:true,message:'Source paused. New registry jobs will stop publishing.'});
 }
 if(act==='resume'){
  if(!s.reviewed_at)return fail(422,'Approve and verify this source first.');
  await env.JOBS_DB.prepare("UPDATE creative_sources SET status='approved',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();return reply({ok:true,message:'Source resumed.'});
 }
 if(act==='map_location'){
  if(s.status!=='approved')return fail(409,'Approve the source before mapping its vacancies.');
  const raw=String(input.rawLocation||'').trim();if(!validLocationString(raw))return fail(422,'Enter a single, specific source location.');
  const ref=input.locationReference;if(!ref||ref.kind!=='city'||!ref.cityName||!ref.countryCode)return fail(422,'Select a verified geographic city.');
  let check;try{check=await verifyCityReference(ref,undefined,{allowOutsideCoverage:s.qualification==='verified_firm'});}catch{return fail(503,'Geographic reference unavailable; no mapping was saved.');}
  if(!check.ok)return fail(422,check.error);
  const {country,region,city}=check;
  if(s.qualification==='city_first'&&!cityCovered(country.code,city.name))return fail(422,'This city is not in our launch coverage. Use verified-firm review for reputable outside-city employers.');
  await env.JOBS_DB.prepare('INSERT INTO source_location_maps(source_id,location_key,raw_location,country_code,region_id,city_id,city_name,region_name,country_name) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,location_key) DO UPDATE SET raw_location=excluded.raw_location,country_code=excluded.country_code,region_id=excluded.region_id,city_id=excluded.city_id,city_name=excluded.city_name,region_name=excluded.region_name,country_name=excluded.country_name,verified_at=CURRENT_TIMESTAMP')
   .bind(id,locationKey(raw),raw,country.code,region.id,city.id,city.name,region.name,country.name).run();
  return reply({ok:true,message:'Verified mapping saved: '+raw+' → '+city.name+', '+region.name+', '+country.name+'.'});
 }
 return fail(422,'Unsupported source action.');
}
export async function onRequestGet({request,env}){
 if(!auth(request,env))return fail(401,'Operator access denied.');
 if(!env?.JOBS_DB)return fail(503,'JOBS_DB not configured.');
 try{return await list(env);}catch{return fail(503,'Source registry is not installed. Apply the v0.14.2 D1 migration.');}
}
export async function onRequestPost({request,env}){
 if(!auth(request,env))return fail(401,'Operator access denied.');
 if(!originOK(request))return fail(403,'Invalid origin.');
 if(!env?.JOBS_DB)return fail(503,'JOBS_DB not configured.');
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return fail(415,'JSON required.');
 if(Number(request.headers.get('content-length')||'0')>7000)return fail(413,'Request too large.');
 let input;try{const raw=await request.text();if(raw.length>7000)return fail(413,'Request too large.');input=JSON.parse(raw);}catch{return fail(400,'Invalid JSON.');}
 try{return await mutate(env,input);}catch{return fail(503,'Unable to complete source action. No change confirmed.');}
}
