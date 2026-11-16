/** Cloudflare Pages Function: GET /api/jobs
 * Public, attributed, remote creative and built-environment job feed. No API token, database or paid API needed.
 * The origin data belongs to Jobicy and Himalayas. Do not export this API to third parties.
 */
const CACHE_SECONDS = 10800; // 3 hours; Jobicy requires no more than one refresh per hour
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
const rolePattern=/(design|designer|ux\b|ui\b|illustrat|animat|motion|creative|art director|graphic|visual|3d\b|3-d\b|webflow|figma|video edit|editor|concept artist|game artist|architect|cad\b|bim\b|interior|landscape|spatial|furniture|urban plan)/i;
const nonDesignArchitect=/(software|solution|cloud|data|enterprise|security|network|systems?|platform|infrastructure|devops|salesforce|aws|azure|technical)\s+architect/i;
function roleOf(title) {
  const t=title.toLowerCase();
  if(/interior|spatial|furniture|exhibition|set design|industrial design|retail space/.test(t))return 'interior';
  if(/architect|bim\b|cad\b|urban plan|landscape design|revit|building design|architectural/.test(t))return 'architecture';
  if(/motion|3d\b|3-d\b|animat|video|game artist|vfx/.test(t))return 'motion';
  if(/product design|user experience|user interface|ux\b|ui\b|interface design|design system|researcher/.test(t))return 'product';
  if(/graphic|visual|brand|illustrat|art director|creative director|logo|print/.test(t))return 'visual';
  if(/web |webflow|front.?end|creative technolog|interactive|website/.test(t))return 'web';
  return 'other';
}
function published(value) {
  const n=Number(value);
  const d=typeof value==='number'||(typeof value==='string'&& /^\d+$/.test(value)) ? new Date(n<100000000000?n*1000:n): new Date(value);
  return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString();
}
function salary(min,max,currency,period) {
  const a=Number(min),b=Number(max);
  if((!a&&!b)||(!Number.isFinite(a)&&!Number.isFinite(b)))return '';
  const code=String(currency||'USD').slice(0,3);
  const p=String(period||'annual').toLowerCase();
  const interval=/hour/.test(p)?'/hr':/month/.test(p)?'/mo':/week/.test(p)?'/wk':/day/.test(p)?'/day':'/yr';
  const pretty=(n)=>n>=1000?`${Math.round(n/1000)}k`:String(Math.round(n));
  return `${code} ${a&&b?pretty(a)+'–'+pretty(b):pretty(a||b)} ${interval}`;
}
function safeLink(value,source){
  try { const u=new URL(value); if(u.protocol!=='https:')return '';
    if(source==='Jobicy' && (u.hostname==='jobicy.com'||u.hostname.endsWith('.jobicy.com')))return u.href;
    if(source==='Himalayas' && (u.hostname==='himalayas.app'||u.hostname.endsWith('.himalayas.app')))return u.href;
  } catch (_) {} return '';
}
function normJobicy(j) {
  const title=String(j.jobTitle||'').trim(); if(!rolePattern.test(title)||nonDesignArchitect.test(title))return null;
  const url=safeLink(j.url,'Jobicy');if(!url)return null;
  return {
    id:'jobicy-'+String(j.id||j.jobSlug||url),title,company:String(j.companyName||'Undisclosed').trim(),
    location:String(j.jobGeo||'Not specified').trim(),type:Array.isArray(j.jobType)?j.jobType.join(' / '):String(j.jobType||'Not specified'),
    salary:salary(j.salaryMin??j.annualSalaryMin,j.salaryMax??j.annualSalaryMax,j.salaryCurrency,j.salaryPeriod),
    posted:published(j.pubDate),role:roleOf(title),source:'Jobicy',url,seniority:String(j.jobLevel||'').slice(0,55)
  };
}
function normHimalayas(j,now) {
  const title=String(j.title||'').trim();if(!rolePattern.test(title)||nonDesignArchitect.test(title))return null;
  const url=safeLink(j.applicationLink,'Himalayas');if(!url)return null;
  if(Number(j.expiryDate)>0 && Number(j.expiryDate)*1000<now)return null;
  const locs=Array.isArray(j.locationRestrictions)?j.locationRestrictions:[];
  const location=locs.length ? locs.slice(0,3).map(x=>x&&x.name||x&&x.alpha2||'').filter(Boolean).join(', ') + (locs.length>3?' +'+(locs.length-3):'') : 'Worldwide';
  const seniority=Array.isArray(j.seniority)?j.seniority.join(' / '):String(j.seniority||'');
  return {id:'himalayas-'+String(j.guid||url),title,company:String(j.companyName||'Undisclosed').trim(),location,type:String(j.employmentType||'Not specified'),salary:salary(j.minSalary,j.maxSalary,j.currency,j.salaryPeriod),posted:published(j.pubDate),role:roleOf(title),source:'Himalayas',url,seniority:seniority.slice(0,55)};
}
async function getSource([name,url]) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try {const res=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'worklist/0.2 (+independent creative job index)'},signal:controller.signal});if(!res.ok)throw new Error(name+' '+res.status);const data=await res.json();return {name,jobs:Array.isArray(data.jobs)?data.jobs:[]};}
  finally {clearTimeout(timer);}
}
export async function onRequestGet({request}) {
  const cache=typeof caches==='undefined'?null:caches.default;
  const cacheKey=new Request(new URL('/api/jobs',request.url).toString(),{method:'GET'});
  try {
    if(cache){const hit=await cache.match(cacheKey);if(hit)return hit;}
    const responses=await Promise.allSettled(SOURCES.map(getSource));
    const now=Date.now();const unique=new Map();const loaded=[];
    responses.forEach((res,i)=>{
      if(res.status!=='fulfilled')return;
      loaded.push(SOURCES[i][0]);
      res.value.jobs.forEach(raw=>{
        const job=SOURCES[i][0]==='Jobicy'?normJobicy(raw):normHimalayas(raw,now);
        if(!job)return;
        const key=(job.title+'|'+job.company).toLowerCase().replace(/\s+/g,' ').trim();
        if(!unique.has(key) || (job.source==='Jobicy' && unique.get(key).source!=='Jobicy'))unique.set(key,job);
      });
    });
    if(!loaded.length) return new Response(JSON.stringify({error:'All upstream job feeds unavailable'}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    const jobs=Array.from(unique.values()).sort((a,b)=>new Date(b.posted)-new Date(a.posted)).slice(0,180);
    const body=JSON.stringify({jobs,updatedAt:new Date().toISOString(),sources:Array.from(new Set(loaded))});
    const out=new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=600, s-maxage=${CACHE_SECONDS}`,'X-Content-Type-Options':'nosniff'}});
    if(cache){try{await cache.put(cacheKey,out.clone());}catch(_) {}}
    return out;
  }catch(_) {return new Response(JSON.stringify({error:'Feed error'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
}
