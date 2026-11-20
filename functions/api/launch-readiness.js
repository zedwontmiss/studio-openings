/** Studio Openings v1 launch readiness.
 * Private D1 schema check and STRICTLY additive missing job_orders setup.
 * Requires operator secret, a real Production hostname, same-origin POST,
 * an explicit confirmation, and a verified compatible existing schema.
 * Never deletes, changes existing columns, publishes jobs or marks payment.
 */
const H={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});
const CORE={
 job_submissions:['id','status','submission_type','job_title','company','application_url','contact_email','job_data','created_at','reviewed_at'],
 job_orders:['submission_id','tier','price_usd','status','review_confirmed_at','invoice_sent_at','payment_confirmed_at','payment_reference','published_at','updated_at'],
 premium_campaigns:['submission_id','status','tier','starts_on','ends_on','payment_confirmed_at','updated_at'],
 job_applications:['id','job_id','applicant_name','applicant_email','portfolio_url','introduction','status','created_at'],
 coverage_requests:['country_code','region_id','city_id','city_name','region_name','requests','last_requested_at'],
 creative_sources:['id','employer_name','official_url','provider','board_token','focus','qualification','status','reviewed_at','checked_at'],
 source_location_maps:['source_id','location_key','raw_location','country_code','city_name','country_name','verified_at']
};
const PROD_HOSTS=new Set(['studio-openings.pages.dev','s-o.app','www.s-o.app']);
function constantEqual(a,b){
 const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);
 let acc=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)acc|=(x[i]||0)^(y[i]||0);
 return acc===0;
}
function auth(req,env){
 const key=env?.OPERATOR_ACCESS_TOKEN;
 return typeof key==='string'&&key.length>=32&&constantEqual(req.headers.get('authorization')||'','Bearer '+key);
}
function host(req){try{return new URL(req.url).hostname.toLowerCase();}catch{return '';}}
function originOK(req){try{return new URL(req.headers.get('origin')).origin===new URL(req.url).origin;}catch{return false;}}
async function columns(db,table){
 const r=await db.prepare('PRAGMA table_info('+table+')').all();
 return (r.results||[]).map(row=>String(row.name||''));
}
async function inspect(db){
 const tables={},incompatible=[];
 for(const [name,needed] of Object.entries(CORE)){
  const available=await columns(db,name);
  const missing=needed.filter(col=>!available.includes(col));
  tables[name]={present:available.length>0,missingColumns:missing};
  if(name!=='job_orders'&&missing.length)incompatible.push(name);
 }
 const jobOrders=tables.job_orders;
 const canInitialize=!incompatible.length&&!jobOrders.present;
 const ready=!incompatible.length&&jobOrders.present&&!jobOrders.missingColumns.length;
 return {ready,canInitialize,existingTables:Object.values(tables).filter(x=>x.present).length,detail:tables,blockers:incompatible,
  message:ready?'Core Production database schema is ready. No mutation was made.':
   canInitialize?'Core tables are compatible. The missing job_orders table can be added safely.':
   'Other core tables or fields are missing. Stop: do not run an automatic migration.'};
}
async function setup(request,env,create){
 if(!PROD_HOSTS.has(host(request)))return reply({ok:false,error:'Production domain only. The Preview database cannot be modified through this endpoint.'},403);
 if(!auth(request,env))return reply({ok:false,error:'Operator secret missing or incorrect for Production.'},401);
 if(!env?.JOBS_DB)return reply({ok:false,error:'Production JOBS_DB binding is missing.'},503);
 try{
  const before=await inspect(env.JOBS_DB);
  if(!create)return reply({ok:true,environment:'production',...before});
  if(!originOK(request))return reply({ok:false,error:'Invalid origin.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return reply({ok:false,error:'JSON required.'},415);
  const text=await request.text();
  if(text.length>250)return reply({ok:false,error:'Request too long.'},413);
  let input;try{input=JSON.parse(text);}catch{return reply({ok:false,error:'Invalid confirmation.'},400);}
  if(!input||input.confirm!=='create-missing-job-orders-on-production')return reply({ok:false,error:'Explicit Production initialization confirmation required.'},422);
  if(before.ready)return reply({ok:true,environment:'production',changed:false,...before});
  if(!before.canInitialize)return reply({ok:false,error:'Existing schema must be reconciled before initialization.',...before},409);
  await env.JOBS_DB.prepare("CREATE TABLE IF NOT EXISTS job_orders (submission_id TEXT PRIMARY KEY,tier TEXT NOT NULL,price_usd INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending_review',review_confirmed_at TEXT,invoice_sent_at TEXT,payment_confirmed_at TEXT,payment_reference TEXT,published_at TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await env.JOBS_DB.prepare("CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status,updated_at)").run();
  const after=await inspect(env.JOBS_DB);
  if(!after.ready)return reply({ok:false,error:'Setup incomplete. Check Production D1.',...after},503);
  return reply({ok:true,changed:true,environment:'production',...after,message:'Missing job_orders table created and verified in Production. No existing rows, payments or job listings were modified.'});
 }catch{return reply({ok:false,error:'Unable to inspect Production D1. Verify D1 binding and operator secret. No database modification confirmed.'},503);}
}
export function onRequestGet({request,env}){return setup(request,env,false);}
export function onRequestPost({request,env}){return setup(request,env,true);}
export {CORE,inspect};
