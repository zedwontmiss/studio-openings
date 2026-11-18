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
export function officialAPI(provider,token){
 if(!providers.has(provider)||!(/^[a-z0-9][a-z0-9_-]{1,75}$/).test(token))throw Error('Unsupported official board.');
 if(provider==='greenhouse')return 'https://boards-api.greenhouse.io/v1/boards/'+token+'/jobs?content=false';
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
export async function fetchOfficialJobs(source,fetcher=fetch){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
 try {
  const response=await fetcher(officialAPI(source.provider,source.board_token),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Official board unavailable (HTTP '+response.status+').');
  const payload=await response.json();
  let records=[];
  if(source.provider==='greenhouse'){
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.map(j=>({title:txt(j.title),location:txt(j.location?.name,140),url:j.absolute_url,uid:String(j.id||''),posted:j.first_published||j.updated_at||''}));
  }else if(source.provider==='lever'||source.provider==='lever_eu'){
   if(!Array.isArray(payload))throw Error('Official board returned an unexpected response.');
   records=payload.map(j=>({title:txt(j.text),location:txt(j.categories?.location,140),url:j.hostedUrl||j.applyUrl,uid:String(j.id||''),posted:j.createdAt&&Number.isFinite(new Date(j.createdAt).getTime())?new Date(j.createdAt).toISOString():''}));
  }else{
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.filter(j=>j.isListed!==false).map(j=>({title:txt(j.title),location:txt(j.location,140),url:j.jobUrl||j.applyUrl,uid:String(j.id||''),posted:j.publishedAt||''}));
  }
  return records.slice(0,800).filter(r=>r.title&&r.location&&safeJobURL(r.url,source));
 }finally{clearTimeout(timeout);}
}
const reject=/\b(?:retail|store associate|sales associate|store manager|cashier|account manager|sales representative|sales manager|marketing manager|recruiter|talent acquisition|hr manager|human resources|accountant|finance|payroll|legal counsel|software engineer|backend engineer|frontend engineer|data engineer|solutions architect|cloud architect|devops|customer success|business development|internally posted|talent pool|open application)\b/i;
export function classifyCreative(title){
 title=String(title||'');if(reject.test(title))return '';
 if(/\b(?:curator|registrar|conservator|exhibition designer|exhibit designer|collection manager|collections specialist|museum technician)\b/i.test(title))return 'museum';
 if(/\b(?:exhibition producer|arts producer|gallery coordinator|cultural producer|exhibition coordinator|art handler)\b/i.test(title))return 'culture';
 if(/\b(?:fashion designer|apparel designer|textile designer|pattern maker|technical designer.*apparel|garment designer)\b/i.test(title))return 'fashion';
 if(/\b(?:photographer|retoucher|photo editor|photo producer|photo stylist|image editor)\b/i.test(title))return 'visual';
 if(/\b(?:vfx|motion designer|motion graphic|3d artist|animator|game artist|character artist|cinematic artist|video editor|compositor)\b/i.test(title))return 'motion';
 if(/\b(?:interior|spatial designer|workplace designer|furniture designer|millwork designer|joinery designer)\b/i.test(title))return 'interior';
 if(/\b(?:landscape architect|architectural|architect\b|bim|revit|urban designer|urban planner|draftsperson)\b/i.test(title))return 'architecture';
 if(/\b(?:industrial designer|industrial design|physical product design|product design engineer)\b/i.test(title))return 'industrial';
 if(/\b(?:ux designer|ui designer|web designer|interaction designer|digital experience designer)\b/i.test(title))return 'web';
 if(/\b(?:brand designer|graphic designer|visual designer|illustrator|art director|creative director|graphic artist)\b/i.test(title))return 'visual';
 if(/\b(?:product designer|product design lead|design systems designer)\b/i.test(title))return 'product';
 return '';
}
export function validLocationString(raw){
 const v=locationKey(raw);
 return !!v&&v.length<=140&&!/\b(?:remote|worldwide|everywhere|multiple location|various locations|location flexible|global|anywhere in|flexible location|hybrid worksite|multiple sites)\b/.test(v)&&!/^(?:usa|us|united states|canada|europe|uk|united kingdom|asia|onsite|on site|hybrid)$/.test(v);
}
