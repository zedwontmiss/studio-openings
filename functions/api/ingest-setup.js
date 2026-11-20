/**
 * Preview-only D1 bootstrap and readiness check.
 * Writes only idempotent CREATE TABLE/INDEX and INSERT OR IGNORE statements.
 * Never drop tables or alter Production data. Requires operator bearer token.
 */
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
function preview(request){try{return new URL(request.url).hostname==='development.studio-openings.pages.dev';}catch{return false;}}
function sameOrigin(request){try{return new URL(request.headers.get('origin')).origin===new URL(request.url).origin;}catch{return false;}}
function equal(a,b){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);return d===0;}
function operator(request,env){const s=env?.OPERATOR_ACCESS_TOKEN;return typeof s==='string'&&s.length>=32&&equal(request.headers.get('authorization')||'','Bearer '+s);}
const TABLES=['creative_sources','source_location_maps','source_job_snapshots','source_ingest_health','source_ingest_cursor'];
const SQL=[
 "CREATE TABLE IF NOT EXISTS creative_sources (id TEXT PRIMARY KEY,employer_name TEXT NOT NULL,official_url TEXT NOT NULL,provider TEXT NOT NULL,board_token TEXT NOT NULL,focus TEXT NOT NULL,qualification TEXT NOT NULL DEFAULT 'city_first',status TEXT NOT NULL DEFAULT 'pending',reviewed_at TEXT,checked_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(provider,board_token))",
 "CREATE TABLE IF NOT EXISTS source_location_maps (source_id TEXT NOT NULL,location_key TEXT NOT NULL,raw_location TEXT NOT NULL,country_code TEXT NOT NULL,region_id TEXT,city_id TEXT,city_name TEXT NOT NULL,region_name TEXT,country_name TEXT NOT NULL,verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(source_id,location_key))",
 "CREATE TABLE IF NOT EXISTS source_job_snapshots (id TEXT PRIMARY KEY,source_id TEXT NOT NULL,job_json TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','retired')),scan_token TEXT NOT NULL,last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,miss_count INTEGER NOT NULL DEFAULT 0)",
 "CREATE INDEX IF NOT EXISTS idx_snapshots_active ON source_job_snapshots(state,last_seen_at)",
 "CREATE INDEX IF NOT EXISTS idx_snapshots_source ON source_job_snapshots(source_id,state)",
 "CREATE TABLE IF NOT EXISTS source_ingest_health (source_id TEXT PRIMARY KEY,last_attempt_at TEXT,last_success_at TEXT,status TEXT NOT NULL DEFAULT 'never',source_count INTEGER NOT NULL DEFAULT 0,matched_count INTEGER NOT NULL DEFAULT 0,failure_streak INTEGER NOT NULL DEFAULT 0)",
 "CREATE TABLE IF NOT EXISTS source_ingest_cursor (name TEXT PRIMARY KEY,last_source_id TEXT NOT NULL DEFAULT '')",
 "INSERT OR IGNORE INTO source_ingest_cursor(name,last_source_id) VALUES('rotation','')"
];
async function inspect(db){
 const q=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?,?,?,?,?)").bind(...TABLES).all();
 const found=new Set((q.results||[]).map(r=>r.name));
 const missing=TABLES.filter(t=>!found.has(t));
 return {ready:missing.length===0,registryReady:found.has('creative_sources')&&found.has('source_location_maps'),missing};
}
export async function onRequestGet({request,env}){
 if(!operator(request,env))return reply({ok:false,error:'Operator authorization required.'},401);
 if(!preview(request))return reply({ok:false,error:'This setup is restricted to the development Preview hostname.'},403);
 if(!env?.JOBS_DB)return reply({ok:false,error:'JOBS_DB is not bound in the Preview environment.'},503);
 try{return reply({ok:true,...await inspect(env.JOBS_DB),environment:'preview',publicFeedEnabled:env.INDEXED_FEED_ENABLED==='true',scheduledEnabled:env.SOURCE_INGEST_ENABLED==='true'});}
 catch{return reply({ok:false,error:'Unable to inspect Preview D1. Check the binding.'},503);}
}
export async function onRequestPost({request,env}){
 if(!operator(request,env))return reply({ok:false,error:'Operator authorization required.'},401);
 if(!preview(request))return reply({ok:false,error:'Preview only; Production setup is forbidden.'},403);
 if(!sameOrigin(request))return reply({ok:false,error:'Invalid origin.'},403);
 if(!env?.JOBS_DB)return reply({ok:false,error:'Preview JOBS_DB binding is missing.'},503);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return reply({ok:false,error:'JSON required.'},415);
 let input;try{const raw=await request.text();if(raw.length>250)throw Error();input=JSON.parse(raw);}catch{return reply({ok:false,error:'Invalid request.'},400);}
 if(!input||input.confirm!=='initialize-preview-only')return reply({ok:false,error:'Explicit Preview initialization confirmation required.'},422);
 try{
  for(const statement of SQL)await env.JOBS_DB.prepare(statement).run();
  const state=await inspect(env.JOBS_DB);
  return reply({ok:state.ready,...state,environment:'preview',message:'Preview source registry and D1 job index initialized; no jobs published.',publicFeedEnabled:false},state.ready?200:503);
 }catch{return reply({ok:false,error:'Preview schema setup failed. Check the binding and database permissions; no tables were dropped.'},503);}
}
export {SQL,TABLES};
