/**
 * Studio Openings: GET /api/jobs
 * Relevance-first, attributable creative job feed. No new paid APIs, no AI calls.
 * Upstreams: Jobicy + Himalayas, served with a three-hour edge cache.
 * Ranking is explicitly heuristic; borderline roles are not guaranteed correct.
 */
const CACHE_SECONDS = 10800;
const SOURCES = [
  ['Jobicy', 'https://jobicy.com/api/jobs?count=100&industry=design-multimedia'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=designer&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=ux&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=graphic%20designer&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=motion%20designer&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=creative%20director&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=interior%20designer&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=landscape%20architect&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=bim&sort=recent&page=1'],
  ['Himalayas', 'https://himalayas.app/jobs/api/search?q=architectural%20designer&sort=recent&page=1']
];

const techArchitectTitle = /\b(?:sap|s\/4hana|s4hana|salesforce|servicenow|oracle|netsuite|workday|erp|aws|azure|gcp|cloud|software|solution(?:s)?|enterprise|data|database|systems?|network|cybersecurity|security|platform|infrastructure|devops|api|applications?|integration|technical|technology|information|microservices?|ai|ml|it)\b/i;
const architectureWords = /\b(?:architect|architects|architecture|architectural|bim|revit|autocad|cadd?|cad drafter|drafting|draftsperson|urban planning|urban planner|city planner|landscape design|building design|site planning)\b/i;
const strongPhysical = /\b(?:architectural|architecture|interior architect|landscape architect|residential architect|building architect|project architect|preservation architect|restoration architect|urban planner|urban planning|architectural technologist|bim|revit|cadd?|autocad|draftsperson|architectural designer|architectural design|building design)\b/i;
const builtEnvironmentEvidence = /\b(?:building(?:s)?|built environment|residential|construction|floor plans?|site plans?|architectural drawings?|building permits?|building codes?|revit|bim|facades?|floor plans?|sketchup|autocad|architectural documentation|planning applications?|historic preservation|commercial interiors?|building projects?|construction documents?|urban design|landscape architecture|architecture firm)\b/i;
const strongTechEvidence = /\b(?:enterprise software|sap|s\/4hana|salesforce|aws|azure|cloud computing|software development|cloud architecture|microservices|ci\/cd|kubernetes|devops|erp|data warehouse|network security|cloud infrastructure)\b/i;
const nonCreativeTitle = /\b(?:account manager|sales manager|product manager|project manager|business development|human resources|recruiter|customer support|finance manager|marketing manager|social media manager|software engineer|backend engineer|devops engineer|frontend engineer|data engineer|design engineer|qa engineer|security engineer)\b/i;

function plainText(value, limit = 1800) {
  return String(value || '').replace(/<\/?[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/\s+/g,' ').trim().slice(0, limit);
}
function contains(re, title, body) {return re.test(title) || re.test(body);}

/** Return a standardized role and a relevance score, or null to reject. */
function classify(job) {
  const title=String(job.title||'').trim();
  const t=title.toLowerCase();
  const description=plainText(job.description,2500).toLowerCase();
  const cats=Array.isArray(job.categories)?job.categories.join(' ').toLowerCase():String(job.categories||'').toLowerCase();
  const hasTitle=(re)=>re.test(t);
  const hasContext=(re)=>re.test(description+' '+cats);
  if(!t || nonCreativeTitle.test(t)) return null;

  // Architecture is an especially ambiguous term. Rule out IT even if the
  // word "architect" is preceded by another qualifier (e.g. "SAP Lead Architect").
  if (architectureWords.test(t)) {
    if (/\barchitect(?:s|ure|ural)?\b/.test(t) && techArchitectTitle.test(t)) return null;
    // Reject architecture labels in clearly software-related job descriptions,
    // unless the role has convincing building-design evidence.
    const physicalTitle=strongPhysical.test(t);
    const physicalContext=builtEnvironmentEvidence.test(description+' '+cats);
    const techContext=strongTechEvidence.test(description+' '+cats);
    if (techContext && !physicalContext) return null;
    // Bare 'Architect' or 'Principal Architect' needs additional evidence.
    if (!physicalTitle && !physicalContext) return null;
    return {role:'architecture',relevance:physicalTitle?92:80};
  }
  if (hasTitle(/\b(?:interior design(?:er)?|spatial design(?:er)?|furniture design(?:er)?|set designer|retail design(?:er)?)\b/))
    return {role:'interior',relevance:92};
  if (hasTitle(/\b(?:industrial design(?:er)?|physical product design(?:er)?|furniture product design(?:er)?)\b/))
    return {role:'industrial',relevance:92};
  if (hasTitle(/\b(?:museum|exhibition design(?:er)?|exhibit design(?:er)?|curator|gallery curator)\b/))
    return {role:'museum',relevance:92};
  if (hasTitle(/\b(?:ux(?:\/?ui)?|ui(?:\/?ux)?|user experience|user interface|product design(?:er)?|interaction design(?:er)?|service design(?:er)?|design systems? designer|ux researcher)\b/))
    return {role:'product',relevance:92};
  if (hasTitle(/\b(?:motion design(?:er)?|motion graphics|animat(?:ion|or)|3d (?:artist|designer|modeler)|video editor|vfx|game artist|concept artist|video creator)\b/))
    return {role:'motion',relevance:92};
  if (hasTitle(/\b(?:graphic design(?:er)?|visual design(?:er)?|brand(?:ing)? design(?:er)?|illustrat(?:or|ion)|typograph(?:y|er)|art director|creative director|print designer|editorial designer|logo designer)\b/))
    return {role:'visual',relevance:92};
  if (hasTitle(/\b(?:photograph(?:er|y)|fashion design(?:er)?|textile design(?:er)?)\b/))
    return {role:'fashion',relevance:92};
  if (hasTitle(/\b(?:web designer|webflow designer|creative technolog(?:ist|y)|interactive designer|creative developer)\b/))
    return {role:'web',relevance:92};
  if (hasTitle(/\b(?:sound design(?:er)?|audio design(?:er)?|sound editor|audio editor)\b/))
    return {role:'culture',relevance:90};
  if (hasTitle(/\b(?:arts producer|cultural producer|arts coordinator|museum educator)\b/))
    return {role:'culture',relevance:90};

  // Ambiguous titles ("Designer", "Design Lead") must be corroborated by
  // their job description or supplied category; never trust the word alone.
  if (/\bdesigner\b|\bdesign lead\b|\bhead of design\b/i.test(t)) {
    if (hasContext(/\b(?:ux|ui|user experience|figma|product design|design system|interface prototyp(?:e|ing))\b/))return {role:'product',relevance:77};
    if (hasContext(/\b(?:brand identity|graphic design|visual design|illustrator|adobe creative|photoshop|indesign|print design|typography)\b/))return {role:'visual',relevance:77};
    if (hasContext(/\b(?:interior|furniture|spatial|architectural)\b/))return {role:'interior',relevance:75};
    if (hasContext(/\b(?:motion graphics|animation|vfx|3d art)\b/))return {role:'motion',relevance:75};
    if (/\bdesign\b/i.test(cats)&&!strongTechEvidence.test(description))return {role:'visual',relevance:67};
  }
  return null;
}

// Explicit skill detection only. A role category is the guaranteed first tag.
const ROLE_TAG={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',product:'Product Design',visual:'Graphic Design',motion:'Motion Design',fashion:'Fashion',web:'Web Design',museum:'Exhibition',culture:'Creative Arts'};
function tagsFor(title,description,role){
  const tag=ROLE_TAG[role];if(!tag)return [];
  const titleText=String(title||'').toLowerCase(),text=(titleText+' '+String(description||'')).toLowerCase().slice(0,12000);
  const tags=[];
  function add(label,ok){if(ok&&!tags.includes(label))tags.push(label);}
  add('Preservation',/\b(?:preservation|historic preservation|heritage)\b/.test(titleText));
  add('Urban Planning',/\b(?:urban|regional|city|town)\s+plann?|\bplanning coordinator\b/.test(titleText));
  add('Landscape',/\blandscape\b/.test(titleText));
  add('CAD',/\bcadd?\b|\bdraft(?:er|ing|sperson)?\b/.test(titleText));
  add('UX/UI',/\bux\b|\bui\b|user experience|user interface|interaction design/.test(titleText));
  add('Branding',/\bbrand(?:ing)?\b|identity design/.test(titleText));
  add('Illustration',/illustrat/.test(titleText));
  add('3D',/\b3d\b|visuali[sz]ation|\bvfx\b/.test(titleText));
  add('Photography',/photograph/.test(titleText));
  add('Sound',/sound design|audio design/.test(titleText));
  add(tag,true);
  add('Revit',/\brevit\b/.test(text));add('AutoCAD',/\bautocad\b/.test(text));
  add('BIM',/\bbim\b/.test(text));add('Figma',/\bfigma\b/.test(text));
  add('Rhino',/\brhino\b/.test(text));add('SketchUp',/\bsketchup\b/.test(text));
  add('Adobe',/adobe (?:creative|illustrator|photoshop|indesign)/.test(text));
  return tags.slice(0,3);
}

function published(value){
  if(value===null||value===undefined||value==='')return '';
  const n=Number(value);
  const d=typeof value==='number'||(typeof value==='string'&&/^\d+$/.test(value))?new Date(n<100000000000?n*1000:n):new Date(value);
  return Number.isNaN(d.getTime())?'':d.toISOString();
}
function salary(min,max,currency,period){
  const a=Number(min),b=Number(max);
  if((!a&&!b)||(!Number.isFinite(a)&&!Number.isFinite(b)))return '';
  const code=String(currency||'USD').slice(0,3),p=String(period||'annual').toLowerCase();
  const interval=/hour/.test(p)?'/hr':/month/.test(p)?'/mo':/week/.test(p)?'/wk':/day/.test(p)?'/day':'/yr';
  const pretty=n=>n>=1000?`${Math.round(n/1000)}k`:String(Math.round(n));
  return `${code} ${a&&b?pretty(a)+'–'+pretty(b):pretty(a||b)} ${interval}`;
}
function safeLink(value,source){
  try{const u=new URL(value);if(u.protocol!=='https:')return '';
    if(source==='Jobicy'&&(u.hostname==='jobicy.com'||u.hostname.endsWith('.jobicy.com')))return u.href;
    if(source==='Himalayas'&&(u.hostname==='himalayas.app'||u.hostname.endsWith('.himalayas.app')))return u.href;
  }catch(_){}return '';
}
function normJobicy(j){
  const title=String(j.jobTitle||'').trim();
  const description=plainText(j.jobDescription||j.jobExcerpt);
  const decision=classify({title,description,categories:j.jobIndustry});if(!decision)return null;
  const url=safeLink(j.url,'Jobicy');if(!url)return null;
  return {id:'jobicy-'+String(j.id||j.jobSlug||url),title,company:String(j.companyName||'Undisclosed').trim(),
    location:String(j.jobGeo||'Not specified').trim(),type:Array.isArray(j.jobType)?j.jobType.join(' / '):String(j.jobType||'Not specified'),
    salary:salary(j.salaryMin??j.annualSalaryMin,j.salaryMax??j.annualSalaryMax,j.salaryCurrency,j.salaryPeriod),
    posted:published(j.pubDate),role:decision.role,relevance:decision.relevance,tags:tagsFor(title,description,decision.role),source:'Jobicy',url,
    description,seniority:String(j.jobLevel||'').slice(0,55)};
}
function normHimalayas(j,now){
  const title=String(j.title||'').trim();
  const description=plainText(j.description||j.excerpt);
  const decision=classify({title,description,categories:[...(j.categories||[]),...(j.parentCategories||[])]});if(!decision)return null;
  const url=safeLink(j.applicationLink,'Himalayas');if(!url)return null;
  if(j.expiryDate&&String(j.expiryDate)!=='0'){const x=Number(j.expiryDate);const expiry=Number.isFinite(x)&&x>0?(x<1e12?x*1000:x):Date.parse(j.expiryDate);if(Number.isFinite(expiry)&&expiry<now)return null;}
  const locs=Array.isArray(j.locationRestrictions)?j.locationRestrictions:[];
  const location=locs.length?locs.slice(0,3).map(x=>x&&x.name||x&&x.alpha2||'').filter(Boolean).join(', ')+(locs.length>3?' +'+(locs.length-3):''):'Worldwide';
  const seniority=Array.isArray(j.seniority)?j.seniority.join(' / '):String(j.seniority||'');
  return {id:'himalayas-'+String(j.guid||url),title,company:String(j.companyName||'Undisclosed').trim(),
    location,type:String(j.employmentType||'Not specified'),salary:salary(j.minSalary,j.maxSalary,j.currency,j.salaryPeriod),
    posted:published(j.pubDate),role:decision.role,relevance:decision.relevance,tags:tagsFor(title,description,decision.role),source:'Himalayas',url,description,seniority:seniority.slice(0,55)};
}
function jobKey(j){return [j.company,j.title,j.location].map(x=>String(x||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).join('|');}
function quality(j){return j.relevance+(j.description.length>=70?2:0)+(j.salary?1:0);}
async function getSource([name,url]){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const res=await fetch(url,{headers:{Accept:'application/json','User-Agent':'studio-openings/0.6 (+creative design job board)'},signal:controller.signal});if(!res.ok)throw new Error(name+' '+res.status);const data=await res.json();return {name,jobs:Array.isArray(data.jobs)?data.jobs:[]};}
  finally{clearTimeout(timer);}
}
export async function onRequestGet({request}){
  const cache=typeof caches==='undefined'?null:caches.default;
  // v2 key prevents an old 3-hour cached response reappearing after the update.
  const cacheKey=new Request(new URL('/api/jobs?classifier=v3-tags',request.url).toString(),{method:'GET'});
  try {
    if(cache){const hit=await cache.match(cacheKey);if(hit)return hit;}
    const responses=await Promise.allSettled(SOURCES.map(getSource));
    const now=Date.now(),unique=new Map(),loaded=[];
    responses.forEach((res,i)=>{
      if(res.status!=='fulfilled')return;
      loaded.push(SOURCES[i][0]);
      res.value.jobs.forEach(raw=>{
        const job=SOURCES[i][0]==='Jobicy'?normJobicy(raw):normHimalayas(raw,now);
        if(!job||!job.tags.length)return;
        const key=jobKey(job),old=unique.get(key);
        if(!old||quality(job)>quality(old))unique.set(key,job);
      });
    });
    if(!loaded.length)return new Response(JSON.stringify({error:'All upstream job feeds unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    const jobs=Array.from(unique.values()).sort((a,b)=>{
      if(b.relevance!==a.relevance)return b.relevance-a.relevance;
      return (Date.parse(b.posted)||0)-(Date.parse(a.posted)||0);
    }).slice(0,180);
    const body=JSON.stringify({jobs,updatedAt:new Date(now).toISOString(),sources:Array.from(new Set(loaded))});
    const out=new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=600, s-maxage=${CACHE_SECONDS}`,'X-Content-Type-Options':'nosniff'}});
    if(cache){try{await cache.put(cacheKey,out.clone());}catch(_) {}}
    return out;
  }catch(_){return new Response(JSON.stringify({error:'Feed error'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
}
