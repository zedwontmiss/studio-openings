import {officeLocation,geoMeta,POLICY_VERSION} from '../../lib/geo-policy.js';
import {sourceExcerpt,employmentTypeOf} from '../../lib/source-registry-core.js';
/**
 * Studio Openings v0.8 — official-firm pilot, GET /api/firm-jobs
 * Only five explicitly reviewed employer-owned public Greenhouse boards.
 * No generic webpage scraping and no user-supplied URL/token parameters.
 * Short metadata and editorial summaries only; apply at the official vacancy.
 * This is a preview pilot. Recheck sources' use conditions before production.
 */
const FIRMS = Object.freeze([
  {token:'apparatus',name:'APPARATUS'},
  {token:'rvi',name:'RVi Planning + Landscape Architecture'},
  {token:'unispace',name:'Unispace'},
  {token:'woolpert',name:'Woolpert'},
  {token:'dlrgroup',name:'DLR Group'}
]);
const CACHE_SECONDS=21600;
const MAX_PER_FIRM=20;
const MAX_JOBS=100;
// Gate by title before processing full descriptions. Relevant architectural, interior,
// landscape, exhibition, furniture, and architectural-production roles only.
const CANDIDATE=/(?:\barchitect\b|architectur|landscape|interior|spatial|furniture|workplace designer|industrial designer|bim|revit|draft(?:er|ing|sperson)?|cadd?\b|urban (?:design|plan)|site plan|exhibition design|exhibit design|\bdesigner\b|\bdesign lead\b|\bdesign assistant\b)/i;
const HARD_REJECT=/(?:\b(?:software|sap|salesforce|servicenow|enterprise|solution(?:s)?|cloud|data|network|security|devops|integration|platform|systems?)\s+architect\b|\barchitect\s+(?:of\s+)?(?:solutions?|cloud|data|systems?|software|enterprise)\b|\b(?:sales|marketing|account|business development|recruitment|human resources|finance|operations|administrative|customer service|product manager|project manager|construction manager)\b)/i;
const SOFT_REJECT=/(?:\b(?:civil|structural|electrical|mechanical|geotechnical|transportation|environmental|chemical|software|data)\s+engineer\b|\b(?:estimator|sales director|client manager|recruiter|assembly associate|finishing associate)\b)/i;
const BUILT_PROOF=/(?:\b(?:architectural|architecture|architect|landscape architecture|interior design|interiors|building design|construction drawings?|floor plans?|revit|rhino|autocad|bim|cad|millwork|furniture design|ffe|ff&e|facade|construction document|residential design|space planning|workplace design|urban design|exhibition design|site planning)\b)/i;
const SKILLS=[['Revit',/\brevit\b/i],['BIM',/\bbim\b/i],['AutoCAD',/\bautocad\b/i],['Rhino',/\brhino(?:ceros)?\b/i],['SketchUp',/\bsketchup\b/i],['CAD',/\bcadd?\b/i]];
const DETAIL_RE=/\b(?:full[\s-]?time|part[\s-]?time|internship|contract)\b/i;
function plain(s,max=2300){
  return String(s||'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/&amp;/gi,'&')
    .replace(/&(?:quot|#34);/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim().slice(0,max);
}
// Publication typography: normalize all-uppercase vacancy titles, not company names.
// Preserve common design / technical acronyms and already-mixed-case titles.
function displayTitle(value){
  const title=String(value||'').trim();
  if(!/[A-Z]/.test(title)||/[a-z]/.test(title))return title;
  const acronyms=new Set(['BIM','CAD','CADD','UX','UI','UX/UI','UI/UX','3D','2D','VFX','CGI',
    'AI','IT','HR','FF&E','LEED','AIA','RIBA','NYC','US','UK','UAE','EU','APAC','EMEA',
    'MEP','GIS','VR','AR','HVAC','R&D','ERP','SAP','USA','QA','II','III','IV']);
  const connectors=new Set(['and','or','of','for','in','to','at','the','with','on','by','a','an']);
  return title.toLowerCase().replace(/[a-z0-9]+(?:[&/+.-][a-z0-9]+)*/gi,(part,index)=>{
    const upper=part.toUpperCase();
    if(acronyms.has(upper))return upper;
    if(index>0&&connectors.has(part))return part;
    return part.slice(0,1).toUpperCase()+part.slice(1);
  });
}
function verifiedURL(raw,token){
  try{const u=new URL(raw);
    if(u.protocol!=='https:'||u.username||u.password)return '';
    if(!['job-boards.greenhouse.io','boards.greenhouse.io'].includes(u.hostname.toLowerCase()))return '';
    if(!u.pathname.startsWith('/'+token+'/jobs/'))return '';
    u.search='';u.hash='';return u.href;
  }catch(_){return '';}
}
function date(value,now){
  const ms=Date.parse(value||'');
  return Number.isFinite(ms)&&ms<=now+86400000&&ms>946684800000?new Date(ms).toISOString():'';
}
function roleFor(title,body,department){
  if(!CANDIDATE.test(title)||HARD_REJECT.test(title)||SOFT_REJECT.test(title))return '';
  const d=(body+' '+department).slice(0,2100);
  const physical=BUILT_PROOF.test(d);
  const noContext=/\b(?:generic application|future opportunities|talent community|open application)\b/i.test(title);
  if(noContext)return '';
  if(/\b(?:interior|spatial|workplace design|furniture design|millwork)\b/i.test(title))return 'interior';
  if(/\b(?:industrial design|product development designer|furniture product designer)\b/i.test(title)&&physical)return 'industrial';
  if(/\b(?:exhibition|exhibit designer|museum designer)\b/i.test(title))return 'museum';
  if(/\b(?:architectur|architect\b|landscape|urban plan|urban design|bim\b|revit\b|draft|cadd?\b)/i.test(title)&&physical)return 'architecture';
  if(/\b(?:designer|design assistant|design lead)\b/i.test(title)&&physical){
    if(/\b(?:interior|spatial|workplace|furniture|ff&e)\b/i.test(d))return 'interior';
    return 'architecture';
  }
  return '';
}
function tagsFor(role,title,body){
  const label={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',museum:'Exhibition'}[role];
  if(!label)return [];
  const tags=[];
  if(/\blandscape\b/i.test(title))tags.push('Landscape');
  if(/\bBIM\b/i.test(title))tags.push('BIM');
  if(/\barchitectural draft|\bCADD?\b|draftsperson/i.test(title))tags.push('CAD');
  if(/\bexhibit(?:ion)?\b/i.test(title))tags.push('Exhibition');
  if(!tags.includes(label))tags.push(label);
  for(const [name,re] of SKILLS){if(re.test(body)&&!tags.includes(name))tags.push(name);}
  return tags.slice(0,3);
}
function arrangement(title,body,location){
  // Do not infer onsite merely because a listing names a physical office.
  const lead=(title+' '+location+' '+body.slice(0,1200));
  if(/\b(?:hybrid (?:work|schedule|arrangement|role|position)|(?:role|position|schedule) (?:is|offers|involves) hybrid|\d[ -]day remote.*in.person)\b/i.test(lead))return 'hybrid';
  if(/\b(?:fully remote|remote (?:role|position|opportunity|work)|work remotely)\b/i.test(lead)&&!/\bnot remote\b/i.test(lead))return 'remote';
  if(/\b(?:not remote|on[ -]site (?:role|position)|in[ -]office (?:role|position)|based in .*studio and not remote)\b/i.test(lead))return 'onsite';
  return '';
}
function typeFor(title,body){
  const m=String(title).match(DETAIL_RE);
  if(m)return /full/i.test(m[0])?'Full-time':/part/i.test(m[0])?'Part-time':/intern/i.test(m[0])?'Internship':'Contract';
  // Avoid pulling generic HR 'full-time benefits' text from boilerplate.
  const sentence=body.slice(0,900);
  if(/\b(?:this|the) (?:is a |role is a |position is a )full[ -]time (?:role|position|opportunity)\b/i.test(sentence))return 'Full-time';
  return '';
}
function normalize(record,firm,now){
  const title=displayTitle(plain(record&&record.title,130));
  if(!title||!CANDIDATE.test(title))return null;
  const body=plain(record.content,2300);
  const dep=Array.isArray(record.departments)?record.departments.map(x=>plain(x.name,60)).join(' '):'';
  const role=roleFor(title,body,dep);
  if(!role)return null;
  const url=verifiedURL(record.absolute_url,firm.token);
  if(!url||!/^[1-9][0-9]{0,15}$/.test(String(record.id||''))||record.internal_job_id===null)return null;
  const place=plain(record.location&&record.location.name,110);
  const geo=officeLocation(place);if(!geo.eligible)return null;
  const tags=tagsFor(role,title,body);
  if(!tags.length)return null;
  const edited=date(record.updated_at,now);
  const published=date(record.first_published,now);
  // No copying of long external descriptions. Links retain the official application.
  const description=sourceExcerpt(record.content,1000);
  if(description.length<130)return null;
  const relevance=role==='architecture'?94:role==='interior'?93:90;
  return {id:`firm-gh-${firm.token}-${record.id}`,title,company:firm.name,location:place||'Location not stated',
    locationKind:'office',mode:arrangement(title,body,place),type:typeFor(title,body)||employmentTypeOf('',title,body),salary:'',...geoMeta(geo),
    posted:published||edited,dateKind:published?'posted':'updated',role,relevance,
    qualityScore:Math.min(100,Math.round(relevance*.7)+10+(place?5:0)+(published||edited?7:0)+(url?2:0)+(tags.length>=2?2:0)),
    tags,source:`Official careers · ${firm.name}`,sourceUrl:`https://job-boards.greenhouse.io/${firm.token}`,
    url,description,descriptionKind:'source-excerpt'};
}
async function fetchFirm(firm,now){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try{
    const url=`https://boards-api.greenhouse.io/v1/boards/${firm.token}/jobs?content=true`;
    const res=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!res.ok)throw Error(firm.token+': '+res.status);
    const data=await res.json();
    if(!Array.isArray(data.jobs))throw Error(firm.token+': invalid response');
    const jobs=[];
    for(const raw of data.jobs){
      // Avoid regex processing every full-description in a large firm's career board.
      if(!CANDIDATE.test(String(raw.title||'')))continue;
      const job=normalize(raw,firm,now);
      if(job)jobs.push(job);
      if(jobs.length>=MAX_PER_FIRM)break;
    }
    return {name:firm.name,jobs};
  }finally{clearTimeout(timer);}
}
export async function onRequestGet({request}){
  const now=Date.now(),cache=typeof caches==='undefined'?null:caches.default;
  const url=new URL(request.url),key=new Request(url.origin+'/api/firm-jobs?version=pilot-08-content-quality&geo='+POLICY_VERSION,{method:'GET'});
  try{
    if(cache){const hit=await cache.match(key);if(hit)return hit;}
    // 5 reviewed boards, <=6 simultaneous outgoing Cloudflare connections.
    const results=await Promise.allSettled(FIRMS.map(f=>fetchFirm(f,now)));
    const jobs=[],success=[],failed=[];
    results.forEach((result,i)=>{
      if(result.status==='fulfilled'){success.push(FIRMS[i].name);jobs.push(...result.value.jobs);}
      else failed.push(FIRMS[i].name);
    });
    if(!success.length)return new Response(JSON.stringify({error:'Firm sources temporarily unavailable',failed}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    const seen=new Set();const filtered=[];
    for(const job of jobs){if(seen.has(job.url))continue;seen.add(job.url);filtered.push(job);}
    const body=JSON.stringify({jobs:filtered.slice(0,MAX_JOBS),updatedAt:new Date(now).toISOString(),sources:success.map(x=>'Official careers · '+x),failed,geoPolicy:POLICY_VERSION});
    const out=new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':`public, max-age=600, s-maxage=${CACHE_SECONDS}`}});
    if(cache)try{await cache.put(key,out.clone());}catch(_){/* no cache in tests */}
    return out;
  }catch(_){return new Response(JSON.stringify({error:'Firm feed error'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
}
export {FIRMS,normalize,roleFor,arrangement,tagsFor,verifiedURL,displayTitle};
