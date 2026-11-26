import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {onRequest as distribution} from '../functions/api/distribution.js';
import {onRequestPost as traffic} from '../functions/api/traffic.js';
import {onRequestPost as operator} from '../functions/api/operator.js';
import {onRequestGet as sitemap} from '../functions/sitemap.xml.js';
import {onRequestGet as employerPage} from '../functions/jobs/[id].js';
import {onRequestGet as sourcePage} from '../functions/openings/[id].js';
import {onRequest as middleware} from '../functions/_middleware.js';
import {onRequestGet as feed} from '../functions/api/approved-jobs.js';
import {onRequestGet as indexed} from '../functions/api/indexed-jobs.js';
import {sync} from '../functions/api/ingest-sources.js';
import {timestamp,activeUntil,DAY} from '../lib/job-lifecycle.js';

const sql=new DatabaseSync(':memory:');
for(let pass=0;pass<2;pass++)for(const name of readdirSync('migrations').sort())sql.exec(readFileSync('migrations/'+name,'utf8'));
class Statement {
  constructor(query,args=[]){this.query=query;this.args=args;}
  bind(...args){return new Statement(this.query,args);}
  all(){return {results:sql.prepare(this.query).all(...this.args),success:true};}
  first(){return sql.prepare(this.query).get(...this.args);}
  run(){return {meta:sql.prepare(this.query).run(...this.args),success:true};}
}
const db={prepare:s=>new Statement(s),batch(stmts){
  sql.exec('BEGIN');
  try{const results=stmts.map(s=>/^\s*SELECT/i.test(s.query)?s.all():s.run());sql.exec('COMMIT');return results;}
  catch(e){sql.exec('ROLLBACK');throw e;}
}};
const token='unit-test-key-'.repeat(3),host='https://development.studio-openings.pages.dev';
const env={JOBS_DB:db,OPERATOR_ACCESS_TOKEN:token,PREVIEW_D1_ISOLATED:'true',SOURCE_SEO_ENABLED:'true',TRAFFIC_ENABLED:'true',INDEXED_FEED_ENABLED:'true'};
function request(path,body,extra={},origin=host){
  return new Request(origin+path,{method:body?'POST':'GET',headers:{origin,authorization:'Bearer '+token,'content-type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});
}
const queue=(body,headers,overrides={})=>distribution({request:request('/api/distribution',body,headers),env:{...env,...overrides}});
const assets={async fetch(req){
  assert.equal(new URL(req.url).pathname,'/migrations/0002_review_and_metrics.sql');
  return new Response(readFileSync('migrations/0002_review_and_metrics.sql','utf8'));
}};
for(let i=0;i<2;i++)assert.equal((await queue({action:'initialize',confirmed:true},{},{ASSETS:assets})).status,200);
const list=async()=>{const r=await queue();assert.equal(r.status,200);return r.json();};
const employerId='SO-TEST-MVP123',secondId='SO-TEST-MVP234';
const data={title:'Product Designer',company:'Fixture Studio',location:'Worldwide',role:'product',mode:'remote',type:'Full-time',
  locationReference:{kind:'worldwide'},url:'https://example.com/jobs/3',description:'Design tools for a small creative team. '.repeat(12),applicationMethod:'external'};
function addEmployer(id,url){
  sql.prepare("INSERT INTO job_submissions(id,status,job_title,company,contact_email,job_data,reviewed_at) VALUES(?,'approved',?,?,?, ?,CURRENT_TIMESTAMP)").run(id,data.title,data.company,'fixture@example.net',JSON.stringify({...data,url}));
  sql.prepare("INSERT INTO job_orders(submission_id,tier,price_usd,status,published_at) VALUES(?,'standard',149,'paid',CURRENT_TIMESTAMP)").run(id);
}
addEmployer(employerId,data.url);addEmployer(secondId,data.url+'/different');
const page=(handler,id)=>handler({params:{id},request:request('/test'),env});
const map=async()=> (await sitemap({request:request('/sitemap.xml'),env})).text();
assert.ok((await map()).includes('/jobs/'+employerId));
assert.equal((await page(employerPage,employerId)).status,200);
assert.equal((await (await feed({env})).json()).jobs.length,2);
const noindex=async (url,status=200)=>middleware({request:new Request(url),env:{PUBLIC_CANONICAL_HOST:'bad.example'},next:async()=>new Response('page',{status})});
for(const path of ['/about','/disciplines/architecture','/jobs/'+employerId,'/openings/registry-12345678']){
  assert.equal((await noindex('https://s-o.app'+path)).headers.get('x-robots-tag'),null);
  assert.match((await noindex(host+path)).headers.get('x-robots-tag'),/noindex/);
  assert.match((await noindex('https://s-o.app'+path,404)).headers.get('x-robots-tag'),/noindex/);
}
let injected='';
globalThis.HTMLRewriter=class {
  on(selector,handler){if(selector==='head')handler.element({append(value){if(value.includes('/assets/traffic.js'))injected=value;},setInnerContent(){}});else if(selector==='a[href]')handler.element({getAttribute(){return '/scene';},remove(){},setAttribute(){}});else if(selector==='.studio-careers')handler.element({remove(){}});else if(selector==='[data-signal-contact]')handler.element({remove(){}});else if(selector==='body')handler.element({append(){}});else if(selector==='#job-list')handler.element({setInnerContent(){}});else assert.fail('Unexpected selector: '+selector);return this;}
  transform(response){return response;}
};
for(const [settings,headers,enabled] of [[env,{},true],[{...env,TRAFFIC_ENABLED:'false'},{},false],[{...env,PREVIEW_D1_ISOLATED:'false'},{},false],[env,{DNT:'1'},false]]){
  injected='';await middleware({env:settings,request:new Request(host+'/',{headers}),next:async()=>new Response('<head></head>',{headers:{'content-type':'text/html'}})});
  assert.equal(injected.includes('/assets/traffic.js'),enabled);
}
delete globalThis.HTMLRewriter;
assert.equal(timestamp('2026-02-30'),NaN);
const reviewTime=Date.now(),reviewISO=new Date(reviewTime).toISOString();
const live={status:'approved',submission_type:'employer',order_status:'paid',order_tier:'standard',reviewed_at:reviewISO,order_published_at:reviewISO};
assert.equal(activeUntil(live,{},reviewTime+30*DAY),NaN);
assert.equal(activeUntil(live,{closesOn:'invalid'},reviewTime),NaN);
assert.equal(activeUntil(live,{},reviewTime-1000),NaN);

assert.equal((await queue(null,{authorization:''})).status,401);
assert.equal((await queue(null,{}, {PREVIEW_D1_ISOLATED:'false'})).status,403);
assert.equal((await queue({id:employerId,action:'draft',channel:'x'},{origin:'https://other.example'})).status,403);
assert.equal((await distribution({env,request:request('/api/distribution',null,{},'https://s-o.app')})).status,403);
const act=(action,id=employerId,ch='reddit',version='')=>queue({action,id,channel:ch,version});
assert.equal((await act('draft')).status,200);
assert.equal((await act('draft')).status,200);
let state=await list();assert.equal(state.audit.length,1);assert.equal(state.queue.length,1);
let version=state.queue[0].fingerprint;
assert.equal((await act('export',employerId,'reddit',version)).status,409);
assert.equal((await act('approve',employerId,'reddit','wrong')).status,409);
assert.equal((await act('approve',employerId,'reddit',version)).status,200);
assert.match((await (await act('export',employerId,'reddit',version)).json()).body,/utm_source=reddit/);
assert.equal((await act('export',employerId,'reddit',version)).status,200);
assert.equal((await list()).audit.length,3);
await act('draft',secondId);const other=(await list()).queue.find(q=>q.job_id===secondId);
await act('approve',secondId,'reddit',other.fingerprint);
assert.equal((await act('export',secondId,'reddit',other.fingerprint)).status,409);
assert.equal((await operator({env,request:request('/api/operator',{action:'close',id:employerId,reviewConfirmed:true})})).status,200);
assert.equal((await page(employerPage,employerId)).status,404);assert.ok(!(await map()).includes(employerId));
assert.equal((await act('export',employerId,'reddit',version)).status,409);
assert.equal((await list()).queue.find(q=>q.job_id===employerId).status,'withdrawn');

const src={id:'src-official123456789',provider:'lever',board_token:'studio',employer_name:'Fixture Studio',qualification:'verified_firm'};
sql.prepare("INSERT INTO creative_sources(id,employer_name,official_url,provider,board_token,focus,qualification,status) VALUES(?,?,'https://example.com/careers','lever','studio','product','verified_firm','approved')").run(src.id,src.employer_name);
sql.prepare("INSERT INTO source_location_maps(source_id,location_key,raw_location,country_code,city_name,country_name) VALUES(?,'boston','Boston','US','Boston','United States')").run(src.id);
const rawJob={id:'role-12345',text:'Senior Product Designer',hostedUrl:'https://jobs.lever.co/studio/role-12345',categories:{location:'Boston'},descriptionPlain:data.description};
const pull=rows=>async()=>Response.json(rows);
const id='registry-'+src.id+'-'+rawJob.id;
assert.equal((await sync(db,src,pull([rawJob,rawJob]))).indexed,1);
assert.equal((await (await indexed({env})).json()).jobs.length,1);
const untrusted=JSON.parse(sql.prepare('SELECT job_json FROM source_job_snapshots WHERE id=?').get(id).job_json);
sql.prepare('UPDATE source_job_snapshots SET job_json=? WHERE id=?').run(JSON.stringify({...untrusted,seoVerified:true,seoVerifiedAt:reviewISO,seoPermission:'approved',descriptionKind:'official-full'}),id);
assert.equal((await page(sourcePage,id)).status,404);
assert.equal((await act('draft',id,'x')).status,409);
const item=(await list()).candidates.find(x=>x.id===id);
const rights={id,action:'review',version:item.version,evidence:'Recorded fixture permission',description:data.description,confirmed:true};
assert.equal((await queue({...rights,version:'superseded'})).status,409);
assert.equal((await queue(rights)).status,200);
assert.equal((await page(sourcePage,id)).status,200);assert.ok((await map()).includes('/openings/'+id));
assert.equal((await (await indexed({env})).json()).jobs[0].detailUrl,'/openings/'+id);
assert.equal((await act('draft',id,'x')).status,200);
const sourceDraft=(await list()).queue.find(q=>q.job_id===id);
assert.equal((await act('approve',id,'x',sourceDraft.fingerprint)).status,200);
assert.equal((await sync(db,src,async()=>{throw Error('upstream');})).ok,false);
assert.equal((await page(sourcePage,id)).status,200);
await sync(db,src,pull([]));
assert.equal((await act('export',id,'x',sourceDraft.fingerprint)).status,409);
assert.equal((await page(sourcePage,id)).status,404);
assert.equal((await (await indexed({env})).json()).jobs.length,0);
await sync(db,src,pull([]));
assert.equal(sql.prepare('SELECT state FROM source_job_snapshots WHERE id=?').get(id).state,'retired');
assert.ok(!(await map()).includes(id));
await sync(db,src,pull([rawJob]));
assert.equal((await page(sourcePage,id)).status,404,'reappearing job needs independent review again');

const count=(v,h={})=>traffic({env,request:request('/api/traffic',v,h)});
const event={event:'view',entry:true,referral:'reddit',job:secondId};
assert.equal((await count(event)).status,204);
await count({...event,event:'apply'});await count({...event,event:'apply'});await count(event,{DNT:'1'});await count(event,{'Sec-GPC':'1'});
assert.equal((await count(event,{origin:'https://other.example'})).status,403);
assert.equal((await count({...event,referral:'person@example.com'})).status,422);
assert.deepEqual(sql.prepare('SELECT event,total FROM traffic_daily ORDER BY event').all().map(r=>[r.event,r.total]),[['apply',2],['listing',1],['view',1],['visit',1]]);
assert.equal(sql.prepare('SELECT count(*) AS n FROM traffic_daily WHERE job_key=?').get(secondId).n,4);
await count({...event,entry:false,job:'person@example.com'});
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM traffic_daily WHERE job_key LIKE '%@%'").get().n,0);

// Exercise real operator endpoints against disposable SQLite only; no money or email.
const pilotId='SO-TEST-PAYMENT01';
sql.prepare("INSERT INTO job_submissions(id,status,submission_type,job_title,company,contact_email,job_data) VALUES(?,'pending','employer',?,?,?,?)").run(pilotId,data.title,data.company,'fixture@example.net',JSON.stringify({...data,url:'https://example.com/jobs/payment-pilot'}));
sql.prepare("INSERT INTO job_orders(submission_id,tier,price_usd,status) VALUES(?,'standard',149,'pending_review')").run(pilotId);
const paymentAct=(action,extra={})=>operator({env,request:request('/api/operator',{id:pilotId,action,...extra})});
const visible=async()=> (await (await feed({env})).json()).jobs.some(j=>j.id==='direct-'+pilotId.toLowerCase());
assert.equal(await visible(),false);
assert.equal((await paymentAct('publish',{reviewConfirmed:true})).status,409);
assert.equal((await paymentAct('mark_paid',{paymentConfirmed:true,paymentReference:'FIXTURE-ONLY'})).status,409);
assert.equal((await paymentAct('review')).status,422);
assert.equal((await paymentAct('review',{reviewConfirmed:true})).status,200);
assert.equal((await paymentAct('invoice_sent')).status,422);
assert.equal((await paymentAct('invoice_sent',{invoiceSentConfirmed:true})).status,200);
assert.equal((await paymentAct('publish',{reviewConfirmed:true})).status,409);
assert.equal((await paymentAct('mark_paid',{paymentReference:'FIXTURE-ONLY'})).status,422);
assert.equal((await paymentAct('mark_paid',{paymentConfirmed:true,paymentReference:'FIXTURE-ONLY'})).status,200);
assert.equal(await visible(),false);
assert.equal((await paymentAct('publish',{reviewConfirmed:true})).status,200);
assert.equal(await visible(),true);
assert.equal((await paymentAct('publish',{reviewConfirmed:true})).status,409);
assert.equal((await paymentAct('close',{reviewConfirmed:true})).status,200);
assert.equal(await visible(),false);
assert.equal((await page(employerPage,pilotId)).status,404);
console.log('Manual payment lifecycle fixture passed; no external payment or email.');

sql.close();
console.log('SQLite integration passed: idempotent migrations, review, operator closure, sitemap, source sync, queue cadence, retry, revocation and coarse analytics.');
