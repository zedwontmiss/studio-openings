import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIRECT_SOURCES,scanDirect} from '../lib/direct-careers.js';
import {discoverSpecialist,normalizeSpecialist,fetchSpecialist,specialistUrl} from '../lib/specialist-careers.js';
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
DIRECT_SOURCES.forEach((source,i)=>assert.ok(app.includes('/api/direct-jobs?shard='+i),source.name+' wired to client'));
const [whitney,gagosian,ps1,co]=DIRECT_SOURCES.slice(5),now=Date.parse('2026-11-24T12:00:00Z');
const prose='You will support exhibitions and work with the team to deliver accessible creative projects. Responsibilities include technical production, stage management, photography and retouching. You will document work carefully and collaborate with artists.';
const wurl='https://jobs.whitney.org/apply/abc123/Web-Operations-Producer';
const wi='<a href="'+wurl+'">Web Operations Producer</a><a href="https://jobs.whitney.org/apply/no/Porter">Porter</a>';
const wr=discoverSpecialist(wi+wi,whitney)[0];assert.equal(discoverSpecialist(wi+wi,whitney).length,1);
const wrecord={title:wr.title,url:wurl,'@type':'JobPosting',hiringOrganization:{name:whitney.name,sameAs:'https://whitney.org'},jobLocation:{address:{addressLocality:'New york',addressRegion:'NY'}},datePosted:'2026-10-14',validThrough:'2027-01-12',employmentType:'FULL_TIME'};
const wh=(r=wrecord)=>'<script type="application/ld+json">'+JSON.stringify(r)+'</script><h1>'+wr.title+'</h1><span id="resumator-job-location">New york, NY</span><div id="resumator-job-description"><div>'+prose+'</div></div><form id="form_submit_new_resume"></form>';
const wjob=normalizeSpecialist(wh(),wr,whitney,now);assert.equal(wjob.role,'web');assert.equal(wjob.type,'Full-time');assert.equal(wjob.geoCountry,'US');assert.equal(wjob.mode,'');
assert.equal(Date.parse(wjob.expiresAt),now+6*3600000);assert.equal(wjob.posted,'2026-10-14T00:00:00.000Z');
for(const patch of [{validThrough:'2026-11-23'},{validThrough:'invalid'},{url:'https://evil.example/'},{title:'Porter'},{jobLocation:{address:{addressLocality:'New York',addressRegion:'NJ'}}},{hiringOrganization:{name:'Other',sameAs:'https://whitney.org'}}])assert.equal(normalizeSpecialist(wh({...wrecord,...patch}),wr,whitney,now),null);
assert.equal(normalizeSpecialist(wh().replace('form_submit_new_resume','closed'),wr,whitney,now),null);
assert.equal(normalizeSpecialist(wh().replace('New york, NY</span>','Remote</span>'),wr,whitney,now),null);
assert.equal(normalizeSpecialist(wh({...wrecord,validThrough:'2026-11-24T13:00:00Z'}),wr,whitney,now).expiresAt,'2026-11-24T13:00:00.000Z');
assert.equal(normalizeSpecialist(wh({...wrecord,datePosted:'2027-02-01'}),wr,whitney,now).posted,'');

const gpath='/jobs/beverly-hills-ca-image-archivist/',gi='<a href="'+gpath+'"><p>Beverly Hills, CA</p><h3>Image Archivist</h3></a>';
const gr=discoverSpecialist(gi,gagosian)[0],gh='<p>Beverly Hills, CA</p><h1>Image Archivist</h1><div class="type-m-md prose"><p>'+prose+'</p><p>Location: Beverly Hills, California</p><p>Employment Type: Full Time</p><p>Work Arrangement: 100% On-Site</p></div><a href="https://gagosian.pinpointhq.com/postings/01ee04f3-87f3-418c-8000-ad42107be797">Apply</a>';
const gjob=normalizeSpecialist(gh,gr,gagosian,now);assert.equal(gjob.role,'fashion');assert.equal(gjob.mode,'onsite');assert.equal(gjob.posted,'');
for(const html of [gh.replace('retouching','filing'),gh.replace('Beverly Hills, California','London'),gh.replace('gagosian.pinpointhq.com','evil.example'),gh.replace('<h1>Image Archivist','<h1>Closed')])assert.equal(normalizeSpecialist(html,gr,gagosian,now),null);

const board='9dbfa465-a36a-46c3-b31e-4929830ab266',pid='ccd11d6c-dc4f-492f-a2fc-c1068382f88f';
const purl='https://recruiting.ultipro.com/MUS1002MOMA/JobBoard/'+board+'/Opportunity/OpportunityDetail?opportunityId='+pid;
const pi='<div class="accordion accordion--closed js-accordion"><h3><div><span>Production Assistant</span></div></h3><div>'+prose+'<a href="'+purl+'">here</a></div></div>';
const pr=discoverSpecialist(pi,ps1)[0];assert.ok(!pr.url.includes('/Opportunity/'));
const prec={Id:pid,Title:'Production Assistant',OpportunityIsClosed:false,FullTime:false,JobBoardMemberships:[{JobBoardId:board,PublishedExternal:true,ExternalPostedDate:'2026-11-03T20:00:48.903Z'}],Locations:[{Address:{City:'Long Island City',State:{Code:'NY'},Country:{Code:'USA'}}}],Description:prose+' Text containing ); and {braces}, and "quotes".'};
const ph=(r=prec)=>'<script>var opportunity = new US.Opportunity.CandidateOpportunityDetail('+JSON.stringify(r)+');</script>';
const pjob=normalizeSpecialist(ph(),pr,ps1,now);assert.equal(pjob.role,'culture');assert.equal(pjob.type,'Part-time');assert.equal(pjob.location,'Long Island City, New York, United States');assert.ok(pjob.description.includes(');'));
for(const patch of [{OpportunityIsClosed:true},{OpportunityIsClosed:undefined},{Id:'wrong'},{Title:'Security Officer'},{Locations:[]},{JobBoardMemberships:[{JobBoardId:board,PublishedExternal:false}]}])assert.equal(normalizeSpecialist(ph({...prec,...patch}),pr,ps1,now),null);
assert.equal(normalizeSpecialist(ph().replace('stage management','office management').replace('technical production','office duties'),pr,ps1,now),null);
const registrar={...prec,Title:'Senior Registrar, Exhibitions',FullTime:true};
assert.equal(normalizeSpecialist(ph(registrar),{...pr,title:'Senior Registrar',role:'museum'},ps1,now).title,registrar.Title);

const code='551E801456',ctitle='Photographer / Videographer / Editor - Beauty';
const crec={shortcode:code,title:ctitle,employment_type:'Full-time',published_on:'2026-11-12',telecommuting:false,city:'New York',country:'United States',url:'https://apply.workable.com/j/'+code,application_url:'https://apply.workable.com/j/'+code+'/apply',locations:[{city:'New York',region:'New York',countryCode:'US',hidden:false}]};
const ci=JSON.stringify({name:'CoCreativ',jobs:[crec,{...crec,title:'Account Director'}]});
const cr=discoverSpecialist(ci,co)[0];assert.equal(discoverSpecialist(ci,co).length,1);
const ch='# '+ctitle+'\n\n> CoCreativ · New York, United States (Hybrid) · Full-time · Posted 2026-11-12\n\n**Salary:** USD 100–130\n\n**Workplace:** hybrid\n\n## Description\n\n'+prose+'\n\n## Apply\n\n[Apply at CoCreativ](https://apply.workable.com/cocreativ/j/'+code+'/apply)';
const cjob=normalizeSpecialist(ch,cr,co,now);assert.equal(cjob.role,'fashion');assert.equal(cjob.salary,'');assert.equal(cjob.mode,'hybrid');assert.equal(cjob.url,'https://apply.workable.com/cocreativ/j/'+code);
for(const patch of [{telecommuting:true},{locations:[]},{locations:[{...crec.locations[0],hidden:true}]},{city:'London'},{application_url:'https://evil.example'}])assert.equal(normalizeSpecialist(ch,{...cr,record:{...crec,...patch}},co,now),null);
for(const html of [ch.replace('New York, United States','Anywhere'),ch.replace('/apply)','/closed)'),ch.replace(prose,'Register your interest in future opportunities. '+prose)])assert.equal(normalizeSpecialist(html,cr,co,now),null);
assert.deepEqual(discoverSpecialist(JSON.stringify({name:'CoCreativ',jobs:[]}),co),[]);
assert.throws(()=>discoverSpecialist('{"jobs":[]}',co),/changed/);

for(const source of [whitney,gagosian,ps1,co]){
  for(const url of ['https://evil.example/',source.url+'?target=evil','https://jobs.whitney.org.evil.example/apply/id/Title'])assert.equal(specialistUrl(url,source),false);
  if(source!==co){assert.throws(()=>discoverSpecialist('<h1>Access denied</h1>',source),/layout/);assert.deepEqual(discoverSpecialist('There are no current openings',source),[]);}
  await assert.rejects(fetchSpecialist('https://evil.example/',source,()=>{throw Error('Must not fetch');}),/Unreviewed/);
}
const response=(body,type='text/html')=>new Response(body,{headers:{'content-type':type}});
await assert.rejects(fetchSpecialist(whitney.url,whitney,async()=>new Response(null,{status:302,headers:{location:'https://evil.example'}})),/unavailable/);
await assert.rejects(fetchSpecialist(whitney.url,whitney,async()=>response('x'.repeat(3000001))),/too large/);
await assert.rejects(fetchSpecialist(whitney.url,whitney,async()=>response('{}','application/json')),/unavailable/);
await assert.rejects(fetchSpecialist(whitney.url,whitney,(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('Aborted')))),10),/Aborted/);
for(const [source,index,detail]of [[whitney,wi,wh()],[gagosian,gi,gh],[ps1,pi,ph()],[co,ci,ch]]){
  const data=await scanDirect(source,async url=>response(url===source.url?index:detail,source===co?(url===co.url?'application/json':'text/markdown'):'text/html'),now);
  assert.equal(data.jobs.length,1);assert.equal(data.failed.length,0);assert.equal(data.truncated,false);
}
await assert.rejects(scanDirect(whitney,async url=>response(url===whitney.url?wi:'Closed'),now),/All vacancy/);
const mixed=await scanDirect(whitney,async url=>response(url===whitney.url?wi+'<a href="https://jobs.whitney.org/apply/reg/Registrar-Exhibitions">Registrar, Exhibitions</a>':url===wurl?wh():'Closed'),now);
assert.equal(mixed.jobs.length,1);assert.equal(mixed.failed.length,1);
assert.deepEqual(discoverSpecialist(wi.replace(wurl,'https://evil.example/apply/abc123/Web-Operations-Producer')+'<a href="https://jobs.whitney.org/apply/no/Porter">Porter</a>',whitney),[]);
console.log('Specialist careers: official index/detail matching, exact geography, creative scope, closure, partial failure, expiry, salary ambiguity, redirects, URL and payload limits passed.');
