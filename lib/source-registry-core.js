/** Studio Openings v0.14.2 — official creative career-source registry and classification.
 * Never guess city from company headquarters; all vacancy locations must be mapped.
 * No generic HTML scraping, credentials, or untrusted target hosts.
 */
const providers=new Set(['greenhouse','lever','lever_eu','ashby']);
export const FOCI=['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture'];
export function locationKey(raw){return String(raw||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
export function cleanSourceInput(x){
 if(!x||typeof x!=='object')throw Error('Invalid source data.');
 const name=String(x.employerName||'').trim().slice(0,100),token=String(x.boardToken||'').trim().toLowerCase();
 const provider=String(x.provider||''),focus=String(x.focus||'');
 const qualification=x.qualification==='verified_firm'?'verified_firm':'city_first';
 if(name.length<3||!providers.has(provider)||!FOCI.includes(focus)||!(/^[a-z0-9][a-z0-9_-]{1,75}$/).test(token))throw Error('Enter a company, supported ATS, board token and creative discipline.');
 let url;try{url=new URL(String(x.officialURL||''));}catch{throw Error('Use the verified official HTTPS careers URL.');}
 if(url.protocol!=='https:'||url.username||url.password||url.hostname.length>150||!url.hostname.includes('.')||url.hostname.endsWith('.local'))throw Error('Use a valid official HTTPS careers URL.');
 if(url.href.length>400)throw Error('Official URL too long.');
 return {name,provider,token,focus,qualification,officialURL:url.href};
}
export function officialAPI(provider,token,options={}){
 if(!providers.has(provider)||!(/^[a-z0-9][a-z0-9_-]{1,75}$/).test(token))throw Error('Unsupported official board.');
 if(provider==='greenhouse')return 'https://boards-api.greenhouse.io/v1/boards/'+token+'/jobs?content='+(options.includeDescription?'true':'false');
 if(provider==='lever')return 'https://api.lever.co/v0/postings/'+token+'?mode=json';
 if(provider==='lever_eu')return 'https://api.eu.lever.co/v0/postings/'+token+'?mode=json';
 return 'https://api.ashbyhq.com/posting-api/job-board/'+token+'?includeCompensation=false';
}
function txt(x,max=130){return typeof x==='string'?x.replace(/\s+/g,' ').trim().slice(0,max):'';}
export function safeJobURL(raw,source){
 let u;try{u=new URL(raw);}catch{return '';}
 if(u.protocol!=='https:'||u.username||u.password)return '';
 let path;try{path=decodeURIComponent(u.pathname).toLowerCase();}catch{return '';}
 const h=u.hostname.toLowerCase(),token=source.board_token.toLowerCase();
 if(source.provider==='greenhouse' && ['job-boards.greenhouse.io','boards.greenhouse.io'].includes(h) && path.startsWith('/'+token+'/jobs/'))return u.href;
 if(source.provider==='lever'&&h==='jobs.lever.co'&&path.startsWith('/'+token+'/'))return u.href;
 if(source.provider==='lever_eu'&&h==='jobs.eu.lever.co'&&path.startsWith('/'+token+'/'))return u.href;
 if(source.provider==='ashby'&&h==='jobs.ashbyhq.com'&&path.startsWith('/'+token+'/'))return u.href;
 return '';
}
export async function fetchOfficialJobs(source,fetcher=fetch,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
 try {
  const response=await fetcher(officialAPI(source.provider,source.board_token,options),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Official board unavailable (HTTP '+response.status+').');
  const payload=await response.json();
  let records=[];
  if(source.provider==='greenhouse'){
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.map(j=>({title:txt(j.title),location:txt(j.location?.name,140),url:j.absolute_url,uid:String(j.id||''),posted:j.first_published||j.updated_at||'',description:options.includeDescription?String(j.content||'').slice(0,18000):'',employmentType:''}));
  }else if(source.provider==='lever'||source.provider==='lever_eu'){
   if(!Array.isArray(payload))throw Error('Official board returned an unexpected response.');
   records=payload.map(j=>({title:txt(j.text),location:txt(j.categories?.location,140),url:j.hostedUrl||j.applyUrl,uid:String(j.id||''),posted:j.createdAt&&Number.isFinite(new Date(j.createdAt).getTime())?new Date(j.createdAt).toISOString():'',description:options.includeDescription?[String(j.descriptionPlain||j.openingPlain||''),...(Array.isArray(j.lists)?j.lists.map(k=>String(k.text||'')+' '+String(k.content||'')):[])].join('\n').slice(0,18000):'',employmentType:txt(j.categories?.commitment,60)}));
  }else{
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.filter(j=>j.isListed!==false).map(j=>({title:txt(j.title),location:txt(j.location,140),url:j.jobUrl||j.applyUrl,uid:String(j.id||''),posted:j.publishedAt||'',description:options.includeDescription?String(j.descriptionPlain||j.descriptionHtml||'').slice(0,18000):'',employmentType:txt(j.employmentType,60)}));
  }
  return records.slice(0,800).filter(r=>r.title&&r.location&&safeJobURL(r.url,source));
 }finally{clearTimeout(timeout);}
}

/** A short, faithful excerpt from the real official vacancy, never a generated template.
 * Text-only output is safe for textContent, not for innerHTML.
 */
export function sourceExcerpt(raw,max=1050){
 let text=String(raw||'').slice(0,22000)
   .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ')
   .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,' ')
   .replace(/<br\b[^>]*\/?>/gi,'\n')
   .replace(/<\/?(?:p|div|li|section|h[1-6]|ul|ol)\b[^>]*>/gi,'\n')
   .replace(/<[^>]*>/g,' ')
   .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39|mdash|ndash|bull);/gi,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&mdash;':'—','&ndash;':'–','&bull;':'•'}[m.toLowerCase()]||' '))
   .replace(/&#(x[0-9a-f]+|\d+);/gi,(_m,n)=>{let v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return v>=32&&v<=0x10ffff?String.fromCodePoint(v):' ';})
   .replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 if(text.length<130)return '';
 // Prefer a job-specific section if the first screen is generic employer boilerplate.
 let relevant=/(?:about (?:the|this) role|what you(?:'|’)?ll do|your impact|responsibilities|in this role|what you will do|the opportunity)\s*:?/ig, match;
 while((match=relevant.exec(text))!==null){
   if(match.index>110&&match.index<1800&&text.length-match.index>=250){text=text.slice(match.index);break;}
 }
 if(text.length<=max)return text;
 const part=text.slice(0,max+1),cut=part.lastIndexOf(' ');
 return part.slice(0,cut>=max*.75?cut:max).trimEnd().replace(/[,:;\-–—]+$/,'')+'…';
}
/** Confirmed employer commitment only: never infer Full-time from company benefits. */
export function employmentTypeOf(raw,title='',description=''){
 const explicit=String(raw||'').trim(),heading=String(title||'').trim();
 function detect(s){
   if(/\b(?:contract|contractor|freelanc(?:e|er)|hourly|temporary|temp(?:orary)? position|fixed[ -]?term)\b/i.test(s))return 'Contract';
   if(/\b(?:part[ -]?time|parttime)\b/i.test(s))return 'Part-time';
   if(/\b(?:internship|intern|trainee)\b/i.test(s))return 'Internship';
   if(/\b(?:full[ -]?time|fulltime|permanent)\b/i.test(s))return 'Full-time';
   return '';
 }
 const exact=detect(explicit);if(exact)return exact;
 const fromTitle=detect(heading);if(fromTitle)return fromTitle;
 const text=String(description||'').slice(0,5000).replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ');
 const header=text.match(/\b(?:employment type|employment status|job type|work arrangement|position type)\s*[:\-]\s*(full[ -]?time|fulltime|part[ -]?time|parttime|contract|temporary|intern(?:ship)?|permanent)\b/i);
 if(header)return detect(header[1])||'Not specified';
 const statement=text.match(/\b(?:this is a|this role is a|this position is a)\s+(full[ -]?time|part[ -]?time|contract)\s+(?:role|position|job|opportunity)\b/i);
 return statement?detect(statement[1]):'Not specified';
}

const reject=/\b(?:retail|store associate|sales associate|store manager|cashier|account manager|sales representative|sales manager|marketing manager|recruiter|talent acquisition|hr manager|human resources|accountant|finance|payroll|legal counsel|software engineer|backend engineer|frontend engineer|data engineer|solutions architect|cloud architect|devops|customer success|business development|internally posted|talent pool|open application)\b/i;
export function classifyCreative(title,description=''){
 title=String(title||'');if(reject.test(title))return '';
 // "Architect" in an AI/technology position is not building architecture.
 const architectural=/\barchitect(?:s|ure|ural)?\b/i.test(title);
 const tech=/\b(?:ai|artificial intelligence|gen(?:erative)?[ -]?ai|llms?|ml|machine learning|software|cloud|solutions?|enterprise|data|database|security|systems?|network|infrastructure|platform|technical|technology|digital|api|sap|aws|azure|salesforce|information|application)\b/i;
 if(architectural&&tech.test(title))return '';
 // Generic Architect/Principal Architect needs positive building-design evidence.
 const built=/\b(?:architectural|architecture firm|landscape architecture|building design|construction drawings?|revit|bim|autocad|building codes?|residential design|interior architecture|floor plans?|urban planning|site plans?)\b/i;
 const explicitPhysical=/\b(?:landscape architect|interior architect|residential architect|building architect|project architect|design architect|architectural designer|architectural technologist|preservation architect|restoration architect)\b/i;
 if(/\barchitect\b/i.test(title)&&!explicitPhysical.test(title)&&!built.test(title)&&!built.test(String(description||'')))return '';

 if(/\b(?:curator|registrar|conservator|exhibition designer|exhibit designer|collection manager|collections specialist|museum technician)\b/i.test(title))return 'museum';
 if(/\b(?:exhibition producer|arts producer|gallery coordinator|cultural producer|exhibition coordinator|art handler)\b/i.test(title))return 'culture';
 if(/\b(?:fashion designer|apparel designer|textile designer|pattern maker|technical designer.*apparel|garment designer)\b/i.test(title))return 'fashion';
 if(/\b(?:photographer|retoucher|photo editor|photo producer|photo stylist|image editor)\b/i.test(title))return 'visual';
 if(/\b(?:vfx|motion designer|motion graphic|3d artist|animator|game artist|character artist|cinematic artist|video editor|compositor)\b/i.test(title))return 'motion';
 if(/\b(?:interior|spatial designer|workplace designer|furniture designer|millwork designer|joinery designer)\b/i.test(title))return 'interior';
 if(/\b(?:landscape architect|architectural|architect\b|bim|revit|urban designer|urban planner|draftsperson)\b/i.test(title))return 'architecture';
 if(/\b(?:industrial designer|industrial design|physical product design|product design engineer)\b/i.test(title))return 'industrial';
 if(/\b(?:ux designer|ui designer|interaction designer|user experience designer|user interface designer)\b/i.test(title))return 'product';
 if(/\b(?:web designer|digital experience designer)\b/i.test(title))return 'web';
 if(/\b(?:brand designer|graphic designer|visual designer|illustrator|art director|creative director|graphic artist)\b/i.test(title))return 'visual';
 if(/\b(?:product designer|product design lead|design systems designer)\b/i.test(title))return 'product';
 return '';
}
export function validLocationString(raw){
 const v=locationKey(raw);
 return !!v&&v.length<=140&&!/\b(?:remote|worldwide|everywhere|multiple location|various locations|location flexible|global|anywhere in|flexible location|hybrid worksite|multiple sites)\b/.test(v)&&!/^(?:usa|us|united states|canada|europe|uk|united kingdom|asia|onsite|on site|hybrid)$/.test(v);
}
