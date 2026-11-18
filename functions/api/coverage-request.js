import {verifyRequestReference} from '../../lib/place-provider.js';
import {getCountry,cityCovered} from '../../lib/coverage-policy.js';
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
async function turnstile(token,secret,hostname){
 const f=new FormData();f.set('secret',secret);f.set('response',token);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:f,signal:controller.signal});
  if(!r.ok)return false;const j=await r.json();return j.success===true&&j.hostname===hostname&&j.action==='coverage_request';
 }catch{return false;}finally{clearTimeout(timer);}
}
export async function onRequestPost({request,env}){
 if(!env?.JOBS_DB||!env?.TURNSTILE_SECRET_KEY)return respond({error:'Request service is not configured'},503);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond({error:'JSON required'},415);
 const host=new URL(request.url).hostname,origin=request.headers.get('origin');
 if(origin){try{const u=new URL(origin);if(u.hostname!==host||u.protocol!=='https:')return respond({error:'Invalid origin'},403);}catch{return respond({error:'Invalid origin'},403);}}
 let payload;try{const raw=await request.text();if(raw.length>4096)return respond({error:'Too long'},413);payload=JSON.parse(raw);}catch{return respond({error:'Invalid JSON'},400);}
 const token=payload?.turnstileToken;if(typeof token!=='string'||token.length<10||token.length>2048)return respond({error:'Verification required'},400);
 if(!await turnstile(token,env.TURNSTILE_SECRET_KEY,host))return respond({error:'Verification failed or expired'},403);
 let place;try{place=await verifyRequestReference(payload.locationReference);}catch{return respond({error:'Geographic verification is temporarily unavailable'},503);}
 if(!place.ok)return respond({error:place.error},422);
 if(getCountry(place.countryCode)&&cityCovered(place.countryCode,place.city.name))return respond({ok:true,alreadyCovered:true,message:'This city is already covered.'});
 try{
  await env.JOBS_DB.prepare(`INSERT INTO coverage_requests
    (country_code,region_id,city_id,city_name,region_name,requests)
    VALUES(?,?,?,?,?,1)
    ON CONFLICT(country_code,city_id) DO UPDATE SET
    requests=requests+1,last_requested_at=CURRENT_TIMESTAMP`).bind(
       place.countryCode,place.region.id,place.city.id,place.city.name,place.region.name).run();
  return respond({ok:true,message:'Your city request has been recorded. Coverage is not automatically activated.'},201);
 }catch{return respond({error:'Coverage requests are not enabled yet. Please try again later.'},503);}
}
export async function onRequestGet(){return respond({error:'POST only'},405);}
