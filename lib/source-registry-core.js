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
export async function fetchOfficialJobScan(source,fetcher=fetch,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
 try {
  const response=await fetcher(officialAPI(source.provider,source.board_token,options),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Official board unavailable (HTTP '+response.status+').');
  const payload=await response.json();
  let records=[];
  if(source.provider==='greenhouse'){
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.map(j=>({title:txt(j.title),location:txt(j.location?.name,140),url:j.absolute_url,uid:String(j.id||''),posted:j.first_published||'',description:options.includeDescription?String(j.content||''):'',employmentType:''}));
  }else if(source.provider==='lever'||source.provider==='lever_eu'){
   if(!Array.isArray(payload))throw Error('Official board returned an unexpected response.');
   records=payload.map(j=>({title:txt(j.text),location:txt(j.categories?.location,140),url:j.hostedUrl||j.applyUrl,uid:String(j.id||''),posted:j.createdAt&&Number.isFinite(new Date(j.createdAt).getTime())?new Date(j.createdAt).toISOString():'',description:options.includeDescription?[String(j.descriptionPlain||j.openingPlain||''),...(Array.isArray(j.lists)?j.lists.map(k=>String(k.text||'')+' '+String(k.content||'')):[])].join('\n'):'',employmentType:txt(j.categories?.commitment,60)}));
  }else{
   if(!Array.isArray(payload?.jobs))throw Error('Official board returned an unexpected response.');
   records=payload.jobs.filter(j=>j.isListed!==false).map(j=>({title:txt(j.title),location:txt(j.location,140),url:j.jobUrl||j.applyUrl,uid:String(j.id||''),posted:j.publishedAt||'',description:options.includeDescription?String(j.descriptionPlain||j.descriptionHtml||''):'',employmentType:txt(j.employmentType,60)}));
  }
  return {complete:records.length<=800&&records.every(r=>r.uid),presentUIDs:records.slice(0,800).map(r=>r.uid),rows:records.slice(0,800).filter(r=>r.title&&r.location&&safeJobURL(r.url,source))};
 }finally{clearTimeout(timeout);}
}

export async function fetchOfficialJobs(source,fetcher=fetch,options={}){
 return (await fetchOfficialJobScan(source,fetcher,options)).rows;
}

/** A short, faithful excerpt from the real official vacancy, never a generated template.
 * Text-only output is safe for textContent, not for innerHTML.
 */
export function sourceExcerpt(raw,max=14000){
 let text=String(raw||'');
 const dict={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',bull:'•',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”'};
 const decode=s=>s.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi,(m,k)=>{
   if(k[0]==='#'){const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>=32&&n<=0x10ffff?String.fromCodePoint(n):' ';}
   return Object.prototype.hasOwnProperty.call(dict,k.toLowerCase())?dict[k.toLowerCase()]:m;
 });
 for(let i=0;i<3;i++){const next=decode(text);if(next===text)break;text=next;}
 text=text.replace(/<!--[\s\S]*?-->/g,' ')
   .replace(/<(?:script|style|iframe|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|iframe|svg)\s*>/gi,' ')
   .replace(/(<li\b[^>]*>)\s*<p\b[^>]*>/gi,'$1').replace(/<\/p>\s*(<\/li>)/gi,'$1')
   .replace(/<br\b[^>]*\/?>/gi,'\n').replace(/<li\b[^>]*>/gi,'\n• ').replace(/<\/li\s*>/gi,'\n')
   .replace(/<\/?(?:p|div|section|article|h[1-6]|ul|ol|blockquote)\b[^>]*>/gi,'\n\n')
   .replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*)?\/?>/gi,' ').replace(/\r\n?/g,'\n')
   .replace(/[^\S\n]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 if(text.length<130)return '';
 // Preserve the complete supplied introduction and all role sections.
 if(text.length<=max)return text;
 // Prefer the last complete source sentence near the excerpt limit.
 // A mid-sentence ellipsis looks like a broken vacancy description.
 // Never manufacture missing responsibilities or alter the ATS source.
 const part=text.slice(0,max+1);
 const sentence=/[.!?][”"')\]]*(?=\s|$)/g;
 let sentenceMatch,lastEnd=0;
 while((sentenceMatch=sentence.exec(part))!==null){
   const end=sentenceMatch.index+sentenceMatch[0].length;
   if(end<=max&&end>=Math.min(180,Math.floor(max*.48)))lastEnd=end;
 }
 if(lastEnd)return part.slice(0,lastEnd).trimEnd();
 // Fallback when the original ATS supplied no sentence boundary.
 const paragraph=part.lastIndexOf('\n');
 if(paragraph>=Math.floor(max*.35))return part.slice(0,paragraph).trimEnd();
 // If no complete boundary exists, do not manufacture a broken excerpt.
 // The caller can still link to the authoritative job page.
 return '';
}

// Select verbatim role/tasks/requirements passages instead of spending the
// entire short excerpt on company marketing. Never invent missing sections.
export function vacancyExcerpt(raw,max=950){
 const full=sourceExcerpt(raw);
 if(full.length<=max)return full;
 const heading=/^(?:(?:about (?:the )?|the |your )?(?:role|position)|(?:key |your )?responsibilities|in this role,? you will|what (?:you['’]ll do|you will do|you do|you['’]ll be doing)|(?:key |your |essential )?(?:requirements|qualifications|skills)|your background looks something like|design experience|essential toolkit|what (?:you['’]ll bring|you bring|we['’]re looking for|we are looking for)|who (?:you are|we['’]re looking for|we are looking for))[.:]?$/i;
 const lines=full.split('\n'),sections=[];
 for(let i=0;i<lines.length;i++){
  if(!heading.test(lines[i]))continue;
  const title=lines[i];let end=i+1;
  // Stop at another short standalone heading, including benefits/company text.
  while(end<lines.length){
   const line=lines[end];
   if(line&&line.length<90&&!/^[•*—-]/.test(line)&&(!/[.!?]$/.test(line)||heading.test(line))&&lines[end-1]===''&&lines[end+1]==='')break;
   end++;
  }
  const body=lines.slice(i+1,end).join('\n').trim();
  if(body)sections.push({title,body});
 }
 if(!sections.length)return sourceExcerpt(raw,max);
 const chosen=sections.slice(0,3),budget=Math.floor((max-(chosen.length-1)*2)/chosen.length);
 const parts=chosen.map(({title,body})=>{
  const room=budget-title.length-2;
  const excerpt=body.length<=room?body:sourceExcerpt(body,room);
  return excerpt?title+'\n\n'+excerpt:'';
 }).filter(Boolean);
 return parts.length>=2?parts.join('\n\n'):sourceExcerpt(raw,max);
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
// Use the vacancy title for discipline assignment; a client industry mentioned
// in a job description does not establish a specialist design role.
export function specialistDiscipline(title){
 if(/\b(?:photographer|retoucher|photo editor|photo producer|photo stylist|image retoucher|fashion designer|apparel designer|textile designer|pattern[ -]?maker|technical designer.*apparel|garment designer)\b/i.test(title))return 'fashion';
 if(/\bdesign engineer\s*\(web\s*&\s*brand\)/i.test(title))return 'web';
 if(/\b(?:web(?:site|flow)? designer|digital experience designer|interactive designer|creative developer|creative technologist|director[, ]+(?:of )?creative technology|brand designer,\s*web)\b/i.test(title))return 'web';
 return '';
}
export function specialistTag(title,role){
 if(role==='fashion' && /\b(?:photograph(?:er|y)|retoucher|photo (?:editor|stylist|producer))\b/i.test(title))return 'Photography';
 if(role==='web' && /\bcreative (?:developer|technologist|technology)\b/i.test(title))return 'Creative Technology';
 return '';
}
export function classifyCreative(title,description=''){
 title=String(title||'');if(reject.test(title))return '';
 // "Architect" in an AI/technology position is not building architecture.
 const architectural=/\barchitect(?:s|ure|ural)?\b/i.test(title);
 const technology=/\b(?:ai|artificial intelligence|gen(?:erative)?[ -]?ai|llms?|ml|machine learning|software|cloud|solutions?|enterprise|data|database|security|systems?|network|infrastructure|platform|technical|technology|digital|api|sap|aws|azure|salesforce|information|applications?|deployment|messaging|sms|email|implementation|integrations?|migration|sales|customer|client|crm)\b/i;
 if(architectural&&technology.test(title))return '';
 const builtTitle=/\b(?:landscape architect|interior architect|residential architect|building architect|project architect|design architect|architectural designer|architectural technologist|preservation architect|restoration architect|architectural)\b/i;
 const builtContext=/\b(?:revit|autocad|building codes?|floor plans?|facade|façade|construction drawings?|construction documents?|site planning|urban planning|architectural projects?|built environment|building design|interior architecture|architecture firm|landscape architecture|bim coordination|bim model)\b/i;
 const techBody=/\b(?:technical discovery|data flows|api integration|implementation workshops?|migration|customer onboarding|messaging infrastructure|software deployment|enterprise customers|solution architecture|systems integration|email\/sms|cloud architecture|software architecture)\b/i;
 if(architectural&&!builtTitle.test(title)&&(!builtContext.test(String(description||''))||techBody.test(String(description||''))))return '';

 if(/\b(?:curator|curatorial assistant|museum prep(?:arator)?|registrar|conservator|exhibition designer|exhibit designer|collection manager|collections specialist|museum technician)\b/i.test(title))return 'museum';
 if(/\b(?:exhibition producer|arts producer|gallery coordinator|cultural producer|exhibition coordinator|art handler)\b/i.test(title))return 'culture';
 const specialty=specialistDiscipline(title);if(specialty)return specialty;
 if(/\bimage editor\b/i.test(title))return 'visual';
 if(/\b(?:vfx|motion designer|motion graphic|3d artist|animator|game artist|character artist|cinematic artist|video editor|compositor)\b/i.test(title))return 'motion';
 if(/\b(?:interior|spatial designer|workplace designer|furniture designer|millwork designer|joinery designer)\b/i.test(title))return 'interior';
 if(/\b(?:landscape architect|architectural|architect\b|bim|revit|urban designer|urban planner|draftsperson)\b/i.test(title))return 'architecture';
 if(/\b(?:industrial designer|industrial design|physical product design|product design engineer)\b/i.test(title))return 'industrial';
 if(/\b(?:ux designer|ui designer|interaction designer|user experience designer|user interface designer)\b/i.test(title))return 'product';
 if(/\b(?:brand designer|graphic designer|visual designer|production designer|illustrator|art director|creative director|graphic artist)\b/i.test(title))return 'visual';
 if(/\b(?:product designer|product design lead|design systems designer)\b/i.test(title))return 'product';
 return '';
}
export function validLocationString(raw){
 const v=locationKey(raw);
 return !!v&&v.length<=140&&!/\b(?:remote|worldwide|everywhere|multiple location|various locations|location flexible|global|anywhere in|flexible location|hybrid worksite|multiple sites)\b/.test(v)&&!/^(?:usa|us|united states|canada|europe|uk|united kingdom|asia|onsite|on site|hybrid)$/.test(v);
}
