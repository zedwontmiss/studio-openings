import {vacancyExcerpt,employmentTypeOf,classifyCreative} from './source-registry-core.js';
import {displayTitle} from '../functions/api/firm-jobs.js';
import {POLICY_VERSION} from './coverage-policy.js';
import {scanFramestore} from './framestore-careers.js';

// Reviewed employer websites, not arbitrary request-supplied crawl targets.
export const DIRECT_SOURCES=Object.freeze([
  {id:'koto',name:'Koto',url:'https://koto.com/careers'},
  {id:'further',name:'Further',url:'https://www.further.group/careers'},
  {id:'raggededge',name:'Ragged Edge',url:'https://raggededge.com/join'},
  {id:'dixonbaxi',name:'DixonBaxi',url:'https://joinus.dixonbaxi.com'},
  {id:'framestore',name:'Framestore',url:'https://framestore.recruitee.com/api/offers/'}
]);
const PLACES={'Los Angeles':['Los Angeles, California, United States','US'],
  'New York':['New York, United States','US'],'London':['London, United Kingdom','GB'],
  'Berlin':['Berlin, Germany','DE'],'Sydney':['Sydney, Australia','AU']};
function text(html){return String(html||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#(?:39|x27);/gi,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
function visible(html){return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');}
function safePath(raw,source){
  try{const u=new URL(raw,source.url),base=new URL(source.url);
    const pattern=source.id==='raggededge'?/^\/join\/[a-z0-9-]+$/:source.id==='dixonbaxi'?/^\/jobs\/\d+-[a-z0-9-]+$/:/^\/careers\/[a-z0-9-]+$/;
    return u.origin===base.origin&&!u.username&&!u.password&&!u.search&&!u.hash&&pattern.test(u.pathname)?u.href:'';
  }catch{return '';}
}
export function discoverVacancies(html,source){
  html=visible(html);const found=new Map();
  for(const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)){
    const url=safePath(m[1],source);if(!url)continue;
    let title='',city='';
    if(source.id==='koto'){
      const pair=m[2].match(/<span>([^<]+)<\/span>\s*<span class="text-grey">([^<]+)<\/span>/);
      if(pair){title=text(pair[1]);city=text(pair[2]);}
    }else if(source.id==='raggededge'){
      title=text(m[2]);
      // Location is checked against this specific vacancy's detail, not HQ.
      city='London';
      if(!/^(?:Senior )?Designer$|^(?:Design|Creative) Director$/i.test(title))continue;
    }else if(source.id==='dixonbaxi'){
      title=text(m[2].match(/<span\b[^>]*class="[^"]*__title"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
      const meta=text(m[2].match(/<span\b[^>]*class="[^"]*__meta"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
      if(!/^London · (?:Hybrid|On-site)$/.test(meta))continue;
      city='London';if(!classifyCreative(title))continue;
    }else{
      const block=html.slice(m.index+m[0].length,m.index+m[0].length+1500);
      title=text(block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
      city=text(block.match(/<div\b[^>]*fs-list-field="location"[^>]*>([^<]+)<\/div>/)?.[1]);
    }
    if(!title||!PLACES[city]||/enquiries|general application|talent network|strategist|strategy director|client|talent manager|marketing manager|writer/i.test(title))continue;
    found.set(url,{url,title:displayTitle(title),city});
  }
  // A changed layout is an error, not evidence that all previous jobs closed.
  if(!found.size&&!/no (?:current |open )?(?:vacancies|openings|positions)|no jobs available/i.test(text(html)))throw Error('Career layout unrecognized');
  return [...found.values()];
}
// Balanced element extraction tolerates nested formatting without importing a DOM parser.
export function elementAt(html,start){
  const open=html.slice(start).match(/^<([a-z][\w-]*)\b[^>]*>/i);if(!open)return '';
  const tag=open[1],tokens=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');tokens.lastIndex=start;
  let depth=0,m;while((m=tokens.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(!depth)return html.slice(start,tokens.lastIndex);}
  return '';
}
export function normalizeDirect(html,row,source,now=Date.now()){
  html=visible(html);if(!safePath(row.url,source)||!PLACES[row.city])return null;
  const title=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>text(m[1])).find(t=>t.toLowerCase()===row.title.toLowerCase());
  if(!title)return null;
  let body='';
  if(source.id==='koto'){
    const start=html.search(/<div\b[^>]*class="teamtailor-body"/);
    if(start<0||!html.includes('https://careers.koto.studio/jobs/'+new URL(row.url).pathname.split('/').pop()+'/applications/new'))return null;
    body=elementAt(html,start);
  }else if(source.id==='raggededge'){
    const start=html.indexOf('<h1'),end=html.indexOf('Our hiring process',start);
    const apply=html.slice(start,end).match(/href="(https:\/\/raggededge\.teamtailor\.com\/jobs\/\d+-([a-z0-9-]+)\/applications\/new)"/);
    if(start<0||end<0||!text(html).includes('at our London studio')||apply?.[2]!==new URL(row.url).pathname.split('/').pop())return null;
    body=html.slice(start,end);
  }else if(source.id==='dixonbaxi'){
    body=elementAt(html,html.indexOf('<article'));
    const slug=new URL(row.url).pathname.split('/').pop();
    if(!body||!/<li>London<\/li>/.test(html)||!html.includes('https://connect.dixonbaxi.com/jobs/'+slug+'/applications/new'))return null;
  }else{
    const start=html.indexOf('<h1');const end=html.indexOf('class="footer"',start);
    if(start<0||end<0)return null;
    body=html.slice(start,end);
    if(!/href="mailto:join\.[a-z]+@further\.group"/.test(body)||!text(body).includes('Location: '+row.city))return null;
  }
  const plain=text(body);let role=classifyCreative(title,plain);
  if(/\bmotion\b/i.test(title))role='motion';
  if(/\bdigital design(?:er| director)\b/i.test(title)&&/\b(?:web|website|UX|UI)\b/i.test(plain))role='web';
  if(!role&&/^(?:(?:(?:senior|midweight) )?designer(?: - special projects)?|design director)$/i.test(title)&&/\bbrand(?:s|ing|[ -]led)?\b|identity systems|InDesign.*Illustrator.*Photoshop/i.test(plain))role='visual';
  if(!role)return null;
  const excerptBody=body.replace(/(<li\b[^>]*>)\s*<p\b[^>]*>/gi,'$1').replace(/<\/p>\s*(<\/li>)/gi,'$1');
  const description=vacancyExcerpt(excerptBody,950);if(!description)return null;
  const [location,geoCountry]=PLACES[row.city];
  const tags=[{motion:'Motion Design',web:'Web Design',visual:'Graphic Design'}[role]||'Design'];
  if(role==='visual'&&/creative director/i.test(title))tags.push('Creative Direction');
  if(role==='motion'&&/\b3D\b/i.test(title))tags.push('3D');
  return {id:'direct-'+source.id+'-'+new URL(row.url).pathname.split('/').pop(),title:row.title,
    company:source.name,location,geoCountry,geoPolicy:POLICY_VERSION,locationKind:'office',
    role,tags,relevance:93,mode:source.id==='dixonbaxi'&&/<li>Hybrid<\/li>/.test(html)||source.id==='raggededge'&&/Including hybrid working/.test(plain)?'hybrid':'',salary:'',posted:'',dateKind:'added',
    type:employmentTypeOf(source.id==='further'?plain.match(/Position:\s*(Permanent|Contract|Full-time|Part-time)\b/i)?.[1]:'',title,plain),description,descriptionKind:'source-excerpt',
    source:'Official careers · '+source.name,sourceUrl:source.url,url:row.url,
    verifiedAt:new Date(now).toISOString(),expiresAt:new Date(now+6*3600000).toISOString()};
}
export async function fetchPage(url,source,fetcher=fetch,timeout=7500){
  if(url!==source.url&&!safePath(url,source))throw Error('Unreviewed URL');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const res=await fetcher(url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html','User-Agent':'StudioOpenings/1.0 (+https://s-o.app)'}});
    if(!res.ok||!String(res.headers.get('content-type')).includes('text/html'))throw Error('Career page unavailable');
    const reader=res.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();throw Error('Career page too large');}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return new TextDecoder().decode(bytes);
  }finally{clearTimeout(timer);}
}
export async function scanDirect(source,fetcher=fetch,now=Date.now()){
  if(source.id==='framestore')return scanFramestore(fetcher,now);
  const deadline=Date.now()+8000;
  const rows=discoverVacancies(await fetchPage(source.url,source,fetcher),source);
  // One index + at most 36 details stays below the Pages free subrequest limit.
  const jobs=[],failed=[];let unavailable=0;
  for(let i=0;i<Math.min(rows.length,36);i+=6){
    const results=await Promise.allSettled(rows.slice(i,Math.min(i+6,36)).map(async row=>{
      try{const remaining=deadline-Date.now();if(remaining<=0)throw Error('Scan deadline');const job=normalizeDirect(await fetchPage(row.url,source,fetcher,remaining),row,source,now);if(!job)throw Error('Detail changed or unclassified');return job;}
      catch(error){failed.push(row.url);throw error;}
    }));
    for(const result of results)if(result.status==='fulfilled')jobs.push(result.value);else unavailable++;
  }
  if(rows.length&&unavailable===Math.min(rows.length,36))throw Error('All vacancy details unavailable');
  return {jobs,failed,discovered:rows.length,truncated:rows.length>36};
}
