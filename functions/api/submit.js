import {PAID_PLANS,planOf} from '../../lib/paid-plans.js';
import {resolveReference,standardizeJobLocation} from '../../lib/location-reference.js';
import {verifyCityReference} from '../../lib/place-provider.js';
/** Studio Openings v0.6.1 — protected public job submission, Cloudflare Pages Function.
 * Required existing bindings: JOBS_DB (D1), TURNSTILE_SECRET_KEY (Secret).
 * No file uploads or unmoderated public publication are accepted here.
 */
const ROLES = new Set(['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture']);
const MODES = new Set(['remote','hybrid','onsite']);
const METHODS = new Set(['external','email','native']);
const TYPES = new Set(['','Full-time','Part-time','Contract','Internship']);
const MAX_BODY_BYTES = 17000;
const json = (obj, status=200, extra={}) => new Response(JSON.stringify(obj),{
  status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}
});
const fail = (status, code, message) => json({ok:false,code,message},status);
const str = (x,max)=>typeof x==='string'?x.trim().slice(0,max+1):'';
function allowedURL(value){
  try {
    const u=new URL(value);const h=u.hostname.toLowerCase();
    if(u.protocol!=='https:'||u.username||u.password||!h.includes('.')||h.endsWith('.local')||
       /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h))return null;
    return u.href;
  }catch{return null;}
}
function checkField(x,max,required=false){return typeof x==='string'&&x.length<=max&&(!required||x.trim().length>0);}
function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return [null,'Invalid submission'];
  const o={};
  for(const [name,length,required] of [['title',120,true],['company',100,true],['location',90,true],['url',600,false],['applicationEmail',150,false],['contactEmail',150,true],['salary',75,false],['eligibility',170,false],['description',1800,false],['closesOn',10,false]]){
    if(!checkField(input[name]??'',length,required))return [null,`Invalid ${name}`];
    o[name]=str(input[name]??'',length);
  }
  const loc=standardizeJobLocation(input);
  if(loc.error)return [null,loc.error];
  if(!loc.display)return [null,'Choose a valid location'];
  o.location=loc.display;
  o.locationReference=loc.reference;
  o.locationCity=loc.city;
  o.locationVerified=loc.verified;
  const eligibilityRegion=String(input.applicantLocation||'').trim();
  if(eligibilityRegion.length>100)return [null,'Eligible applicant location is too long'];
  if(input.applicantLocationReference && !resolveReference(input.applicantLocationReference))return [null,'Choose an eligible region from the suggestions'];
  let eligibleRef=resolveReference(input.applicantLocationReference);
  if(eligibilityRegion && !eligibleRef)return [null,'Choose an eligible region from the suggestions'];
  o.applicantLocation=eligibleRef?eligibleRef.label:'';
  o.applicantLocationReference=eligibleRef;
  o.workAuthorization=input.workAuthorization||'unspecified';
  o.visaSponsorship=input.visaSponsorship||'unspecified';
  if(!['unspecified','required','not_required'].includes(o.workAuthorization)||!['unspecified','available','unavailable'].includes(o.visaSponsorship))return [null,'Invalid eligibility setting'];
  if(input.mode==='remote' && loc.reference?.kind==='worldwide' && eligibleRef && eligibleRef.kind!=='worldwide'){
    // Clear misleading worldwide workplace geography when applicant scope is restricted.
    o.location='Remote · '+eligibleRef.label;
  }
  if(o.title.length<3||o.company.length<2)return [null,'Provide a real job title and company'];
  if(!/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(o.contactEmail))return [null,'Enter a valid contact email'];
  o.contactEmail=o.contactEmail.toLowerCase();
  if(!ROLES.has(input.role)||!MODES.has(input.mode)||!TYPES.has(input.type||''))return [null,'Choose a supported discipline and job type'];
  if(!['employer','suggest'].includes(input.kind))return [null,'Invalid submission type'];
  o.applicationMethod=input.applicationMethod||'external';
  if(!METHODS.has(o.applicationMethod))return [null,'Unsupported application method'];
  // A visitor suggestion cannot authorize collection of candidate data or publish an application email.
  if(input.kind==='suggest'&&o.applicationMethod!=='external')return [null,'Suggestions require an original application URL'];
  if(input.kind==='employer'&&!planOf(input.postingPackage))return [null,'Select a paid posting package: Standard or Featured'];
  o.postingPackage=input.kind==='employer'?input.postingPackage:'';
  if(o.applicationMethod==='email'){
    if(!/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(o.applicationEmail))return [null,'Valid application email required'];
    o.applicationEmail=o.applicationEmail.toLowerCase();
  }else{o.applicationEmail='';}

  if(input.permissionChecked!==true)return [null,'Confirm that the job may be submitted for review'];
  if(o.applicationMethod==='external'){
    const url=allowedURL(o.url);if(!url)return [null,'Provide a public HTTPS application URL'];o.url=url;
  }else{o.url='';}
  if(o.closesOn){
    if(!/^\d{4}-\d\d-\d\d$/.test(o.closesOn)||Number.isNaN(Date.parse(o.closesOn+'T00:00:00Z'))||
       new Date(o.closesOn+'T00:00:00Z').toISOString().slice(0,10)!==o.closesOn||o.closesOn<new Date().toISOString().slice(0,10))return [null,'Closing date is invalid or in the past'];
  }
  if(input.companyWebsite){
    if(!checkField(input.companyWebsite,350))return [null,'Company website is too long'];
    o.companyWebsite=allowedURL(input.companyWebsite);
    if(!o.companyWebsite)return [null,'Company website must use HTTPS'];
  }else{o.companyWebsite='';}
  // User can only REQUEST featured placement. No self-reported payment or approval is accepted.
  if(input.featuredInterest!==undefined && typeof input.featuredInterest!=='boolean')return [null,'Invalid featured placement request'];
  if(input.kind!=='employer' && input.featuredInterest===true)return [null,'Only employers can request featured placement'];
  // The server determines featured status from the purchased plan, never a checkbox.
  o.featuredInterest=input.kind==='employer'&&o.postingPackage==='featured';
  o.kind=input.kind;o.role=input.role;o.mode=input.mode;o.type=input.type||'';
  // Deliberately discard unrecognized fields, Turnstile token, raw files, and client timestamps.
  return [o,null];
}
async function verifyTurnstile(token, secret, hostname, ip){
  const form=new FormData();form.set('secret',secret);form.set('response',token);
  if(ip)form.set('remoteip',ip);
  const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),8000);
  try {
    const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:form,signal:ctrl.signal
    });
    if(!res.ok)return false;
    const data=await res.json();
    // Accept only the configured site's tokens, not unrelated hostnames.
    return data.success===true && data.hostname===hostname && data.action==='submit_job';
  }catch{return false;}finally{clearTimeout(timer);}
}
export async function onRequestPost({request,env}){
  if(!env?.JOBS_DB||!env?.TURNSTILE_SECRET_KEY||!(/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(String(env?.SUPPORT_EMAIL||''))))return fail(503,'not_configured','Submissions are not enabled yet.');
  const host=new URL(request.url).hostname;
  const origin=request.headers.get('origin');
  if(origin){
    let originHost;try{originHost=new URL(origin).hostname;}catch{return fail(403,'origin','Invalid request origin');}
    if(originHost!==host||!origin.startsWith('https://'))return fail(403,'origin','Invalid request origin');
  }
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return fail(415,'content_type','JSON required');
  if(Number(request.headers.get('content-length'))>MAX_BODY_BYTES)return fail(413,'too_large','Submission too large');
  let raw,body;
  try{
    raw=await request.text();
    if(new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES)return fail(413,'too_large','Submission too large');
    body=JSON.parse(raw);
  }catch{return fail(400,'json','Invalid JSON');}
  const [data,error]=normalize(body);
  if(error)return fail(422,'invalid',error);
  if(data.applicationMethod==='native'&&env.NATIVE_APPLY_ENABLED!=='true')return fail(503,'native_disabled','On-site applications are not enabled yet. Choose email or company website.');
  if(typeof body.turnstileToken!=='string'||body.turnstileToken.length<10||body.turnstileToken.length>2048)return fail(400,'turnstile','Verification required');
  const ip=request.headers.get('CF-Connecting-IP')||'';
  const verified=await verifyTurnstile(body.turnstileToken,env.TURNSTILE_SECRET_KEY,host,ip);
  if(!verified)return fail(403,'turnstile','Verification failed or expired. Try again.');
  // v0.14.1: verify the selected geographic IDs against the reference service,
  // not just the client-supplied place names. Fail closed during outages.
  if(data.locationReference?.kind==='city'){
    let checked;
    try{checked=await verifyCityReference(data.locationReference);}catch{
      return fail(503,'geographic_reference','City verification is temporarily unavailable. Please try again later.');
    }
    if(!checked.ok)return fail(422,'geography',checked.error);
    const {city,region,country}=checked;
    data.locationReference={kind:'city',countryCode:country.code,regionCode:region.code.replace(country.code+'-',''),regionId:region.id,cityId:city.id,cityName:city.name,regionName:region.name,label:city.name+', '+region.name+', '+country.name};
    data.locationCity=city.name;data.location=data.locationReference.label;
  }

  try{
    // Per-email submission limit and duplicate URL prevention. No IP stored.
    const recent=await env.JOBS_DB.prepare("SELECT count(*) AS n FROM job_submissions WHERE contact_email = ? AND created_at >= datetime('now','-1 day')").bind(data.contactEmail).first();
    if(Number(recent?.n||0)>=5)return fail(429,'rate_limit','Too many submissions today. Try again tomorrow.');
    const duplicate=data.applicationMethod==='external'
      ?await env.JOBS_DB.prepare("SELECT id FROM job_submissions WHERE application_url = ? AND status IN ('pending','approved') LIMIT 1").bind(data.url).first()
      :await env.JOBS_DB.prepare("SELECT id FROM job_submissions WHERE lower(job_title) = lower(?) AND lower(company) = lower(?) AND contact_email = ? AND status IN ('pending','approved') LIMIT 1").bind(data.title,data.company,data.contactEmail).first();
    if(duplicate)return fail(409,'duplicate','This application URL is already awaiting review or listed.');
    const id='SO-'+crypto.randomUUID().slice(0,8).toUpperCase();
    const jobData={schema:'studio-openings-submission-v1',...data};
    delete jobData.contactEmail; // contact email stored separately, not in public listing JSON.
    const submission=env.JOBS_DB.prepare(
      "INSERT INTO job_submissions (id,status,submission_type,job_title,company,application_url,contact_email,job_data) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)"
    ).bind(id,data.kind,data.title,data.company,data.url,data.contactEmail,JSON.stringify(jobData));
    let result;
    if(data.kind==='employer'){
      const plan=PAID_PLANS[data.postingPackage];
      const order=env.JOBS_DB.prepare("INSERT INTO job_orders (submission_id,tier,price_usd,status) VALUES (?,?,?,'pending_review')").bind(id,data.postingPackage,plan.priceUSD);
      const saved=await env.JOBS_DB.batch([submission,order]);
      if(!saved.every(x=>x?.success===true))return fail(503,'storage','Order could not be saved.');
      return json({ok:true,status:'pending',reference:id,postingPackage:data.postingPackage,priceUSD:plan.priceUSD,currency:'USD',paymentStatus:'pending_review',message:'Request received. Editorial review comes first. If accepted, you will be contacted with an invoice. No payment has been collected or job published.'},201);
    }
    result=await submission.run();
    if(result?.success!==true)return fail(503,'storage','Unable to save this submission now.');
    return json({ok:true,status:'pending',reference:id,message:'Your public vacancy suggestion was received for editorial review. Nothing has been published.'},201);
  }catch{return fail(503,'storage','Unable to save this submission now. Try again later.');}
}
export async function onRequestGet(){return fail(405,'method','POST only');}
