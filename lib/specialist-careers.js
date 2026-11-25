import {elementAt} from './career-html.js';
import {vacancyExcerpt,employmentTypeOf} from './source-registry-core.js';
import {POLICY_VERSION} from './coverage-policy.js';

// Individually reviewed official career sites. No arbitrary domains or crawl URLs.
const BOARD='9dbfa465-a36a-46c3-b31e-4929830ab266';
const UKG='https://recruiting.ultipro.com/MUS1002MOMA/JobBoard/'+BOARD+'/';
const ROLES={whitney:{'Registrar, Exhibitions':'museum','Web Operations Producer':'web'},
  gagosian:{'Image Archivist':'fashion'},momaps1:{'Production Assistant':'culture','Senior Registrar':'museum'},
  cocreativ:{'Photographer / Videographer / Editor - Beauty':'fashion','Freelance Retoucher - Industrial Color':'fashion'}};
const TAGS={museum:['Museum'],web:['Web Design'],fashion:['Photography'],culture:['Arts & Culture']};
// Decode entities once, after removing markup. This is text extraction, not HTML sanitization.
const entities={'&amp;':'&','&nbsp;':' ','&#39;':"'",'&#x27;':"'"};
const plain=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|nbsp|#39|#x27);/gi,entity=>entities[entity.toLowerCase()]).replace(/\s+/g,' ').trim();
// Keep script/style contents out of the discovery parser without joining fragments
// into a new tag. Input and output are never rendered as trusted HTML.
const visible=value=>value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ');
function embeddedObject(tail){
  let depth=0,string=false,escape=false;
  for(let i=0;i<tail.length;i++){
    const c=tail[i];
    if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;continue;}
    if(c==='"')string=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(tail.slice(0,i+1));
  }
  throw Error('Incomplete embedded record');
}
export function specialistUrl(url,source){
  if(url===source.url)return true;
  if(source.id==='whitney')return /^https:\/\/jobs\.whitney\.org\/apply\/[a-zA-Z0-9]+\/[a-zA-Z0-9-]+$/.test(url);
  if(source.id==='gagosian')return /^https:\/\/gagosian\.com\/jobs\/[a-z0-9-]+\/$/.test(url);
  if(source.id==='momaps1')return url.startsWith(UKG)&&/^(?:Opportunity\/)?OpportunityDetail\?opportunityId=[a-f0-9-]{36}$/.test(url.slice(UKG.length));
  if(source.id==='cocreativ')return /^https:\/\/apply\.workable\.com\/cocreativ\/jobs\/view\/[A-F0-9]{10}\.md$/.test(url);
  return false;
}
export function discoverSpecialist(input,source){
  const rows=new Map(),roles=ROLES[source.id];
  if(!roles)throw Error('Unreviewed source');
  if(source.id==='cocreativ'){
    const payload=JSON.parse(input);
    if(payload.name!=='CoCreativ'||!Array.isArray(payload.jobs)||payload.jobs.length>500)throw Error('Board changed');
    for(const job of payload.jobs){
      if(!roles[job.title]||!/^[A-F0-9]{10}$/.test(job.shortcode||''))continue;
      const url='https://apply.workable.com/cocreativ/jobs/view/'+job.shortcode+'.md';
      rows.set(url,{url,title:job.title,role:roles[job.title],record:job});
    }
    return [...rows.values()];
  }
  const html=visible(input);let recognized=false;
  if(source.id==='momaps1'){
    for(const m of html.matchAll(/<div\b[^>]*class="accordion accordion--[^" >]+[^\"]*"[^>]*>/g)){
      const block=elementAt(html,m.index),title=plain(block.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||'');
      for(const link of block.matchAll(/href="(https:\/\/recruiting[^\"]+)"/g)){
        // Official legacy links redirect to the same board's canonical detail path.
        const url=link[1].replace(/&amp;/g,'&').replace('/Opportunity/OpportunityDetail?','/OpportunityDetail?');if(!specialistUrl(url,source))continue;
        recognized=true;if(roles[title])rows.set(url,{url,title,role:roles[title]});
      }
    }
  }else{
    for(const m of html.matchAll(/<a\b[^>]*href="([^\"]+)"[^>]*>([\s\S]*?)<\/a>/g)){
      let url;try{url=new URL(m[1],source.url).href;}catch{continue;}
      if(!specialistUrl(url,source)||url===source.url)continue;
      const title=source.id==='gagosian'?plain(m[2].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''):plain(m[2]);
      if(!title)continue;recognized=true;
      if(roles[title])rows.set(url,{url,title,role:roles[title]});
    }
  }
  if(!recognized&&!/no (?:current |open )?(?:vacancies|openings|positions)/i.test(plain(html)))throw Error('Career layout changed');
  return [...rows.values()];
}
export function normalizeSpecialist(input,row,source,now=Date.now()){
  if(!specialistUrl(row.url,source)||ROLES[source.id]?.[row.title]!==row.role)return null;
  let body='',location='',type='',mode='',posted='',expires=now+6*3600000,url=row.url,id='',title=row.title;
  if(source.id==='whitney'){
    const records=[];
    for(const m of input.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){
      try{const record=JSON.parse(m[1]);if(record['@type']==='JobPosting')records.push(record);}catch{/* Not a verified record. */}
    }
    const record=records.find(j=>j.url===row.url&&j.title===row.title);
    if(!record||record.hiringOrganization?.name!==source.name||record.hiringOrganization?.sameAs!=='https://whitney.org')return null;
    const html=visible(input),address=record.jobLocation?.address;
    if(!/^new york$/i.test(address?.addressLocality||'')||address.addressRegion!=='NY')return null;
    if(plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'')!==row.title||
      !/id="form_submit_new_resume"/.test(html)||!/<span id="resumator-job-location">New york, NY<\/span>/i.test(html))return null;
    const end=Date.parse(record.validThrough);if(!Number.isFinite(end)||end<=now)return null;
    expires=Math.min(expires,end);posted=record.datePosted||'';type=String(record.employmentType||'').replace(/_/g,'-');
    body=elementAt(html,html.search(/<div\b[^>]*id="resumator-job-description"/));
    if(!body)return null;
    location='New York, New York, United States';id=new URL(row.url).pathname.split('/')[2];
  }else if(source.id==='gagosian'){
    const html=visible(input),head=plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
    if(head!==row.title||!/<p\b[^>]*>Beverly Hills, CA<\/p>/.test(html)||
      !/href="https:\/\/gagosian\.pinpointhq\.com\/postings\/[a-f0-9-]{36}"/.test(html))return null;
    body=elementAt(html,html.search(/<div\b[^>]*class="type-m-md prose"/));
    const text=plain(body);
    // Image Archivist here is a photography/retouching role, not inferred from the title alone.
    if(!/photograph/i.test(text)||!/retouch|color correction/i.test(text)||!/Location: Beverly Hills, California/.test(text))return null;
    location='Beverly Hills, California, United States';type=/Employment Type: Full Time/.test(text)?'Full-time':'';
    mode=/Work Arrangement: 100% On-Site/.test(text)?'onsite':'';id=new URL(row.url).pathname.split('/')[2];
  }else if(source.id==='momaps1'){
    // Public UKG detail embeds JSON as an argument. Parse the JSON, never execute source scripts.
    const marker='new US.Opportunity.CandidateOpportunityDetail(',start=input.indexOf(marker);
    if(start<0)return null;
    let record;
    try{record=embeddedObject(input.slice(start+marker.length));}catch{return null;}
    if(record.Id!==new URL(row.url).searchParams.get('opportunityId')||record.OpportunityIsClosed!==false||
      !record.JobBoardMemberships?.some(m=>m.JobBoardId===BOARD&&m.PublishedExternal===true))return null;
    if(record.Title!==row.title&&!(row.title==='Senior Registrar'&&record.Title==='Senior Registrar, Exhibitions'))return null;
    const address=record.Locations?.length===1?record.Locations[0].Address:null;
    if(address?.City!=='Long Island City'||address.State?.Code!=='NY'||address.Country?.Code!=='USA')return null;
    body=record.Description||'';
    if(row.role==='culture'&&!/stage management|technical production/i.test(plain(body)))return null;
    title=record.Title;id=record.Id;location='Long Island City, New York, United States';
    const membership=record.JobBoardMemberships.find(m=>m.JobBoardId===BOARD);
    posted=membership.ExternalPostedDate||'';type=typeof record.FullTime==='boolean'?(record.FullTime?'Full-time':'Part-time'):'';
  }else if(source.id==='cocreativ'){
    const record=row.record,code=record.shortcode,loc=record.locations?.length===1?record.locations[0]:null;
    if(record.telecommuting!==false||loc?.hidden!==false||loc.countryCode!=='US'||loc.city!=='New York'||loc.region!=='New York'||
      record.city!=='New York'||record.country!=='United States'||record.url!=='https://apply.workable.com/j/'+code||
      record.application_url!==record.url+'/apply')return null;
    if(input.split('\n')[0]!=='# '+row.title||!input.includes('> CoCreativ · New York, United States (Hybrid) · '+record.employment_type+' · Posted '+record.published_on)||
      !input.includes('](https://apply.workable.com/cocreativ/j/'+code+'/apply)'))return null;
    const start=input.indexOf('\n## Description\n'),end=input.indexOf('\n## Apply\n');if(start<0||end<=start)return null;
    body=input.slice(start+16,end).replace(/^#{1,6}\s+/gm,'').replace(/\*\*/g,'');
    if(!/photograph|retouch/i.test(body)||/talent pool|register your interest|future opportunities/i.test(body))return null;
    id=code;location='New York, New York, United States';type=record.employment_type;posted=record.published_on;
    mode=input.includes('**Workplace:** hybrid')?'hybrid':'';url='https://apply.workable.com/cocreativ/j/'+code;
    // Advertised salary metadata (e.g. USD 100–130 without a period) is ambiguous. Omit it.
  }
  const description=vacancyExcerpt(body,950);if(!id||description.length<130)return null;
  const date=Date.parse(posted);posted=Number.isFinite(date)&&date<=now?new Date(date).toISOString():'';
  return {id:'direct-'+source.id+'-'+id,title,company:source.name,role:row.role,tags:TAGS[row.role],relevance:93,
    location,geoCountry:'US',geoPolicy:POLICY_VERSION,locationKind:'office',mode,type:employmentTypeOf(type,title),salary:'',
    posted,dateKind:posted?'posted':'added',description,descriptionKind:'source-excerpt',url,
    source:'Official careers · '+source.name,sourceUrl:source.id==='cocreativ'?'https://industrialcolor.com/about/':source.url,
    verifiedAt:new Date(now).toISOString(),expiresAt:new Date(expires).toISOString()};
}
export async function fetchSpecialist(url,source,fetcher=fetch,timeout=7500){
  if(!specialistUrl(url,source))throw Error('Unreviewed URL');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const res=await fetcher(url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html, application/json, text/markdown, text/plain','User-Agent':'StudioOpenings/1.0 (+https://s-o.app)'}});
    const mime=res.headers.get('content-type')||'';
    if(!res.ok||!(source.id==='cocreativ'?(url===source.url?/application\/json/:/text\/(?:markdown|plain)/):/text\/html/).test(mime))throw Error('Career page unavailable');
    const reader=res.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();throw Error('Career page too large');}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder().decode(bytes);
  }finally{clearTimeout(timer);}
}
export async function scanSpecialist(source,fetcher=fetch,now=Date.now()){
  const deadline=Date.now()+8000,rows=discoverSpecialist(await fetchSpecialist(source.url,source,fetcher),source),jobs=[],failed=[];
  for(let i=0;i<Math.min(rows.length,36);i+=6){
    const results=await Promise.allSettled(rows.slice(i,Math.min(i+6,36)).map(async row=>{
      const remaining=deadline-Date.now();if(remaining<=0)throw Error('Scan deadline');
      const job=normalizeSpecialist(await fetchSpecialist(row.url,source,fetcher,remaining),row,source,now);
      if(!job)throw Error('Detail changed or unavailable');return job;
    }));
    results.forEach((r,n)=>r.status==='fulfilled'?jobs.push(r.value):failed.push(rows[i+n].url));
  }
  if(rows.length&&failed.length===Math.min(rows.length,36))throw Error('All vacancy details unavailable');
  return {jobs,failed,discovered:rows.length,truncated:rows.length>36};
}
