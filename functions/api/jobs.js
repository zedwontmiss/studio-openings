import {specialistDiscipline,specialistTag} from '../../lib/source-registry-core.js';
import {remoteEligibility,geoMeta,POLICY_VERSION} from '../../lib/geo-policy.js';
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

// Never end an excerpt in the middle of a word or leave a broken sentence fragment.
// The original vacancy remains authoritative and is linked from each listing.
function excerptText(text,limit){
  if(text.length<=limit)return text;
  const segment=text.slice(0,limit+1);
  // The source may include newlines, headings and paragraphs. Prefer a
  // complete sentence, not an arbitrarily truncated word plus ellipsis.
  const sentence=/[.!?][)"'’”\]]*(?=\s|$)/g;
  let match,lastEnd=0;
  while((match=sentence.exec(segment))!==null){
    const at=match.index+match[0].length;
    if(at<=limit && at>=Math.min(180,Math.floor(limit*.35))){
      // Common abbreviations are not the end of a sentence.
      const previous=segment.slice(Math.max(0,at-16),at);
      if(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|etc|e\.g|i\.e|U\.S|U\.K)\.$/i.test(previous))continue;
      lastEnd=at;
    }
  }
  if(lastEnd)return segment.slice(0,lastEnd).trimEnd();
  // A complete source paragraph is acceptable when no sentence boundary
  // occurs within the limit. Never invent or complete truncated job text.
  const paragraph=segment.lastIndexOf('\n');
  if(paragraph>=Math.min(180,Math.floor(limit*.35))){
    return segment.slice(0,paragraph).trimEnd();
  }
  return '';
}
function plainText(value, limit = 14000) {
  // Retain real paragraph and list boundaries from source HTML / text.
  // The browser displays plain text (textContent), NEVER source HTML.
  const clean=String(value||'')
    .replace(/\r\n?/g,'\n')
    .replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
    .replace(/<br\b[^>]*\/?\s*>/gi,'\n')
    .replace(/<hr\b[^>]*\/?\s*>/gi,'\n\n')
    .replace(/<(?:p|div|section|article|h[1-6])\b[^>]*>/gi,'\n\n')
    .replace(/<li\b[^>]*>/gi,'\n• ')
    .replace(/<\/li\s*>/gi,'\n')
    .replace(/<\/(?:p|div|section|article|h[1-6]|ul|ol|blockquote)\s*>/gi,'\n\n')
    .replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*)?\/?>/gi,' ')
    .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
    .replace(/&(?:bull|middot);/gi,'•').replace(/&(?:mdash|ndash);/gi,'—')
    .replace(/&(?:hellip);/gi,'…').replace(/&(?:rsquo|lsquo);/gi,"'")
    .replace(/&(?:ldquo|rdquo);/gi,'\"')
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(m,n)=>{
      const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);
      return code>=32&&code<=0x10ffff?String.fromCodePoint(code):' ';
    })
    .replace(/[^\S\n]+/g,' ').replace(/ *\n */g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .replace(/\n\n(?=•)/g,'\n')
    .replace(/([.!?][\"'’”)]?)([A-Z][a-z])/g,'$1\n\n$2').trim();
  return excerptText(clean,limit);
}
function stripHimalayasAttribution(text){
  return String(text||'').replace(/(?:^|\n+)\s*Originally posted on Himalayas\.?\s*$/i,'').trimEnd();
}
function contains(re, title, body) {return re.test(title) || re.test(body);}

/** Return a standardized role and a relevance score, or null to reject. */
import {engineeringTitle} from '../../lib/job-scope.js';
function classify(job) {
 if(engineeringTitle(job.title))return null;
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
  const specialty=specialistDiscipline(title);if(specialty)return {role:specialty,relevance:92};
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
    // Broad upstream design categories alone are insufficient evidence.
  }
  return null;
}

// Explicit skill detection only. A role category is the guaranteed first tag.
const ROLE_TAG={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',product:'Product Design',visual:'Graphic Design',motion:'Motion Design',fashion:'Fashion',web:'Web Design',museum:'Exhibition',culture:'Creative Arts'};
function directionTags(title,description,role){
  if(role!=='visual')return null;
  const t=String(title||'').toLowerCase(),body=String(description||'').toLowerCase().slice(0,12000);
  const creative=/\bcreative[\s/-]+director\b|\bdirector[\s,-]+(?:of[\s-]+)?creative\b/.test(t);
  const art=!creative&&(/\bart[\s/-]+director\b|\bdirector[\s,-]+of[\s-]+art\b/.test(t));
  if(!creative&&!art)return null;
  if(creative)return ['Creative','Creative Direction',/\b(?:chief|executive|c-level)\b/.test(t)?'Executive':'Director'];
  return ['Design','Art Direction',/\bsenior\b|\bsr[.]?\b/.test(t)?'Senior':'Lead'];
}
function tagsFor(title,description,role){
  const tag=specialistTag(title,role)||ROLE_TAG[role];if(!tag)return [];
  const leadership=directionTags(title,description,role);if(leadership)return leadership;
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
  return tags.slice(0,5);
}

// The date means something different depending on the upstream:
// Jobicy pubDate: source posting date. Himalayas pubDate: last update.
// Never use our feed-fetch time as an employer's posting date.
function published(value,now=Date.now()){
  if(value===null||value===undefined||value==='')return '';
  const numeric=typeof value==='number'||(typeof value==='string'&&/^\d{10,13}$/.test(value));
  const num=Number(value);
  const date=numeric?new Date(num<1e12?num*1000:num):new Date(value);
  const time=date.getTime();
  if(!Number.isFinite(time)||time>now+24*60*60*1000||time<946684800000)return '';
  return date.toISOString();
}
function employmentType(raw){
  const value=(Array.isArray(raw)?raw.join(' / '):String(raw||'')).trim();
  if(!value||/^not specified$/i.test(value))return '';
  return value.replace(/full[\s-]?time/gi,'Full-time').replace(/part[\s-]?time/gi,'Part-time')
    .replace(/\b(?:intern|internship)\b/gi,'Internship')
    .replace(/\bcontractor\b/gi,'Contract').slice(0,65);
}
function geoJobicy(value){
  const s=String(value||'').replace(/<[^>]*>/g,'').trim().slice(0,100);
  if(!s)return 'Region not stated';
  if(/^(anywhere|worldwide|global|any location)$/i.test(s))return 'Worldwide';
  return 'Eligible: '+s;
}
function geoHimalayas(restrictions){
  const list=Array.isArray(restrictions)?restrictions:[];
  if(!list.length)return 'Worldwide';
  const names=list.map(x=>String(x&&typeof x==='object'?(x.name||x.alpha2||''):x||'').trim())
    .filter(Boolean);
  return names.length?'Eligible: '+names.slice(0,3).join(', ')+(names.length>3?' +'+(names.length-3):''):'Region not stated';
}
function qualityScore(job){
  // 70% of the classification confidence + up to 30 points for actual metadata.
  // Unknown fields earn ZERO points. Salary is a small bonus, never mandatory.
  const detail=String(job.description||'').length;
  const region=String(job.location||'');
  const mode=String(job.mode||'').trim().toLowerCase();
  return Math.min(100,Math.round(Number(job.relevance||0)*0.7)+
    (detail>=160?10:detail>=70?6:0)+
    (job.posted?7:0)+
    (region&&!/^region not stated$/i.test(region)?5:0)+
    (mode==='remote'||mode==='onsite'||mode==='hybrid'?4:0)+
    (job.type?3:0)+(job.salary?4:0)+(job.url?2:0));
}
function finishJob(job){return {...job,qualityScore:qualityScore(job)};}
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
function normJobicy(j,now){
  const title=String(j.jobTitle||'').trim();
  const description=plainText(j.jobDescription||j.jobExcerpt);
  const decision=classify({title,description,categories:j.jobIndustry});if(!decision)return null;
  const url=safeLink(j.url,'Jobicy');if(!url)return null;
  const geo=remoteEligibility(j.jobGeo);if(!geo.eligible)return null;
  return finishJob({id:'jobicy-'+String(j.id||j.jobSlug||url),title,company:String(j.companyName||'Undisclosed').trim(),
    // This is a *remote eligibility region*, not a physical office address.
    location:geoJobicy(j.jobGeo),locationKind:'eligibility',mode:'remote',...geoMeta(geo),
    type:employmentType(j.jobType),
    salary:salary(j.salaryMin??j.annualSalaryMin,j.salaryMax??j.annualSalaryMax,j.salaryCurrency,j.salaryPeriod),
    posted:published(j.pubDate,now),dateKind:'posted',role:decision.role,relevance:decision.relevance,
    tags:tagsFor(title,description,decision.role),source:'Jobicy',sourceUrl:url,url,description,descriptionKind:'source-excerpt',
    seniority:String(j.jobLevel||'').slice(0,55)});
}
function normHimalayas(j,now){
  const title=String(j.title||'').trim();
  // The source API appends a redundant attribution paragraph. Studio Openings
  // already credits and links Himalayas in the drawer source footer.
  const description=stripHimalayasAttribution(plainText(j.description||j.excerpt));
  const decision=classify({title,description,categories:[...(j.categories||[]),...(j.parentCategories||[])]});if(!decision)return null;
  const url=safeLink(j.applicationLink,'Himalayas');if(!url)return null;
  const geo=remoteEligibility(j.locationRestrictions,{timezones:j.timezoneRestrictions});
  if(!geo.eligible)return null;
  let expiresAt='';
  if(j.expiryDate&&String(j.expiryDate)!=='0'){
    const x=Number(j.expiryDate),expiry=Number.isFinite(x)&&x>0?(x<1e12?x*1000:x):Date.parse(j.expiryDate);
    if(!Number.isFinite(expiry)||expiry<=now)return null;
    expiresAt=new Date(expiry).toISOString();
  }
  const seniority=Array.isArray(j.seniority)?j.seniority.join(' / '):String(j.seniority||'');
  return finishJob({id:'himalayas-'+String(j.guid||url),title,company:String(j.companyName||'Undisclosed').trim(),
    location:geoHimalayas(j.locationRestrictions),locationKind:'eligibility',mode:'remote',...geoMeta(geo),
    type:employmentType(j.employmentType),
    salary:salary(j.minSalary,j.maxSalary,j.currency,j.salaryPeriod),
    // Official Himalayas API defines pubDate as the LAST UPDATED date.
    expiresAt,posted:published(j.pubDate,now),dateKind:'updated',role:decision.role,relevance:decision.relevance,
    tags:tagsFor(title,description,decision.role),source:'Himalayas',sourceUrl:url,url,description,descriptionKind:'source-excerpt',
    seniority:seniority.slice(0,55)});
}
function jobKey(j){return [j.company,j.title,j.location].map(x=>String(x||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).join('|');}
function quality(j){return j.qualityScore||0;}
async function getSource([name,url]){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const res=await fetch(url,{headers:{Accept:'application/json','User-Agent':'studio-openings/0.6 (+creative design job board)'},signal:controller.signal});if(!res.ok)throw new Error(name+' '+res.status);const data=await res.json();return {name,jobs:Array.isArray(data.jobs)?data.jobs:[]};}
  finally{clearTimeout(timer);}
}
export async function onRequestGet({request}){
  const cache=typeof caches==='undefined'?null:caches.default;
  // Versioned key ensures the improved excerpts are not masked by an old 3-hour cached response.
  const cacheKey=new Request(new URL('/api/jobs?classifier=v1126-engineering-scope&policy='+POLICY_VERSION,request.url).toString(),{method:'GET'});
  try {
    if(cache){const hit=await cache.match(cacheKey);if(hit)return hit;}
    const responses=await Promise.allSettled(SOURCES.map(getSource));
    const now=Date.now(),unique=new Map(),loaded=[];
    responses.forEach((res,i)=>{
      if(res.status!=='fulfilled')return;
      loaded.push(SOURCES[i][0]);
      res.value.jobs.forEach(raw=>{
        const job=SOURCES[i][0]==='Jobicy'?normJobicy(raw,now):normHimalayas(raw,now);
        if(!job||!job.tags.length)return;
        const key=jobKey(job),old=unique.get(key);
        if(!old||quality(job)>quality(old))unique.set(key,job);
      });
    });
    if(!loaded.length)return new Response(JSON.stringify({error:'All upstream job feeds unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    const jobs=Array.from(unique.values()).sort((a,b)=>{
      if(b.qualityScore!==a.qualityScore)return b.qualityScore-a.qualityScore;
      return (Date.parse(b.posted)||0)-(Date.parse(a.posted)||0);
    }).slice(0,180);
    const body=JSON.stringify({jobs,updatedAt:new Date(now).toISOString(),sources:Array.from(new Set(loaded)),geoPolicy:POLICY_VERSION});
    const out=new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=600, s-maxage=${CACHE_SECONDS}`,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
    if(cache){try{await cache.put(cacheKey,out.clone());}catch(_) {}}
    return out;
  }catch(_){return new Response(JSON.stringify({error:'Feed error'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
}
