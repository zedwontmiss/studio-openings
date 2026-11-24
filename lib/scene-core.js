import {LOCAL_CITIES} from './local-cities.js';
export function sceneEnabled(context){
 try{return new URL(context.request.url).hostname==='development.studio-openings.pages.dev'&&context.env?.PREVIEW_D1_ISOLATED==='true'&&context.env?.SCENE_ENABLED==='true'&&!!context.env?.JOBS_DB;}catch{return false;}
}
export function cityFor(value){return LOCAL_CITIES.find(c=>c.slug===value)||null;}
export function sceneText(value,min,max){
 if(typeof value!=='string'||value.length>max)return null;
 const text=value.trim().replace(/\r\n/g,'\n');
 if(text.length<min||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))return null;
 return text;
}
export function sceneId(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
export function sameOrigin(request){try{return new URL(request.headers.get('origin')).origin===new URL(request.url).origin;}catch{return false;}}
export function constantEqual(a,b){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let v=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)v|=(x[i]||0)^(y[i]||0);return v===0;}
export function operatorAuthorized(request,env){const token=env?.OPERATOR_ACCESS_TOKEN;return typeof token==='string'&&token.length>=32&&constantEqual(request.headers.get('authorization')||'','Bearer '+token);}
export const sceneReply=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'}});
export async function readSceneInput(request){
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return null;
 // Bound incoming bytes even when Content-Length is missing.
 if(!request.body)return null;
 const reader=request.body.getReader();let total=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>16000){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const data=JSON.parse(new TextDecoder().decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
 }catch{return null;}
}
export async function consumeSceneRate(context,kind){
 // Never store raw addresses. HMAC bucket rotates daily and expires after two days.
 // Fail closed if the trusted edge IP header or separate secret is missing.
 const ip=context.request.headers.get('CF-Connecting-IP'),secret=context.env.SCENE_RATE_SECRET;
 if(!ip||typeof secret!=='string'||secret.length<32)return false;
 const day=Math.floor(Date.now()/86400000),encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(day+'|'+ip+'|'+kind));
 const bucket=Array.from(new Uint8Array(signature),n=>n.toString(16).padStart(2,'0')).join('');
 const cap=kind==='topic'?2:kind==='reply'?8:5;
 const db=context.env.JOBS_DB;
 const result=await db.prepare('INSERT INTO scene_rate_buckets(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<?').bind(bucket,(day+2)*86400000,cap).run();
 return !!result.meta?.changes;
}

export function sceneWritesEnabled(context){
 const env=context.env||{};
 return sceneEnabled(context)&&env.SCENE_WRITES_ENABLED==='true'&&typeof env.SCENE_RATE_SECRET==='string'&&env.SCENE_RATE_SECRET.length>=32&&typeof env.SCENE_TURNSTILE_SECRET==='string'&&env.SCENE_TURNSTILE_SECRET.length>0&&typeof env.SCENE_TURNSTILE_SITE_KEY==='string'&&/^[A-Za-z0-9_-]{5,100}$/.test(env.SCENE_TURNSTILE_SITE_KEY);
}
export async function verifySceneChallenge(context,token,kind,fetcher=fetch){
 if(!sceneWritesEnabled(context)||typeof token!=='string'||!token||token.length>2048)return false;
 try{
  const body=new URLSearchParams({secret:context.env.SCENE_TURNSTILE_SECRET,response:token});
  const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
  if(!response.ok)return false;
  const result=await response.json();
  return result.success===true&&result.hostname===new URL(context.request.url).hostname&&result.action==='scene_'+kind;
 }catch{return false;}
}
