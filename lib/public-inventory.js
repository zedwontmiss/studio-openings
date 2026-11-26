import {vacancyLinkKey} from './vacancy-identity.js';
import {onRequestGet as approved} from '../functions/api/approved-jobs.js';
import {onRequestGet as indexed} from '../functions/api/indexed-jobs.js';
import {onRequestGet as editorial} from '../functions/api/editorial-jobs.js';
import {outreachHeld} from './outreach-policy.js';
import {esc} from './seo-jobs.js';
const roles=new Set(['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture']);
export const INVENTORY_SOURCES=Object.freeze(['approved','indexed','editorial']);
export function publicURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:'';}catch{return '';}}
import {engineeringTitle} from './job-scope.js';
function valid(j,now){return j&&!engineeringTitle(j.title)&&typeof j.id==='string'&&j.title&&j.company&&j.location&&roles.has(j.role)&&(!j.expiresAt||Date.parse(j.expiresAt)>now)&&(j.applicationMethod==='native'||j.applicationMethod==='email'||publicURL(j.url));}
export async function readLiveInventory(context){
 const calls=[approved,indexed,editorial];
 const results=await Promise.all(calls.map(async(fn,i)=>{try{const response=await fn(context);if(!response.ok)throw Error('Unavailable');const data=await response.json();if(!Array.isArray(data.jobs))throw Error('Invalid feed');return {source:INVENTORY_SOURCES[i],jobs:data.jobs.filter(j=>valid(j,Date.now())&&(i===0||!outreachHeld(j.company,j.url)))};}catch{return {source:INVENTORY_SOURCES[i],failed:true,jobs:[]};}}));
 // Preserve separate source batches so the browser can retain its existing precedence and deduplication.
 return {version:1,generatedAt:new Date().toISOString(),sources:results};
}
// Only the editorial batch is cacheable in this pilot. Approved and indexed D1
// records remain live so moderation, feature flags and revocation take effect.
export const SNAPSHOT_TTL_MS=300000;
export function freshEditorialSnapshot(data,now=Date.now()){
 if(!data||data.version!==1||data.source!=='editorial'||!Array.isArray(data.jobs))return null;
 const timestamp=Date.parse(data.generatedAt);
 if(!Number.isFinite(timestamp)||timestamp>now||now-timestamp>=SNAPSHOT_TTL_MS)return null;
 return {source:'editorial',jobs:data.jobs.filter(j=>valid(j,now)&&j.applicationMethod==='external'&&!!j.expiresAt&&!outreachHeld(j.company,j.url))};
}
async function editorialCached(context){
 const origin=new URL(context.request.url).origin;
 const cache=typeof caches==='undefined'?null:caches.default;
 const key=new Request(origin+'/api/public-inventory?internal=editorial-v1');
 if(cache)try{
  const hit=await cache.match(key);
  if(hit){const data=freshEditorialSnapshot(await hit.json());if(data)return data;}
 }catch{/* cache unavailable */}
 const response=await editorial(context);
 if(!response.ok)throw Error('Editorial unavailable');
 const payload=await response.json();
 if(!Array.isArray(payload.jobs))throw Error('Invalid editorial feed');
 const data={version:1,source:'editorial',generatedAt:new Date().toISOString(),jobs:payload.jobs.filter(j=>valid(j,Date.now())&&j.applicationMethod==='external'&&!!j.expiresAt&&!outreachHeld(j.company,j.url))};
 if(cache)try{await cache.put(key,new Response(JSON.stringify(data),{headers:{'content-type':'application/json','cache-control':'public, max-age=300'}}));}catch{/* live result remains usable */}
 return freshEditorialSnapshot(data);
}
export async function readInventory(context){
 // No request context in Node tests. No new binding needed.
 if(!context.request||typeof caches==='undefined')return readLiveInventory(context);
 const calls=[approved,indexed];
 const results=await Promise.all(calls.map(async(fn,i)=>{try{const response=await fn(context);if(!response.ok)throw Error('Unavailable');const data=await response.json();if(!Array.isArray(data.jobs))throw Error('Invalid feed');return {source:INVENTORY_SOURCES[i],jobs:data.jobs.filter(j=>valid(j,Date.now())&&(i===0||!outreachHeld(j.company,j.url)))};}catch{return {source:INVENTORY_SOURCES[i],failed:true,jobs:[]};}}).concat([editorialCached(context).then(v=>v||{source:'editorial',failed:true,jobs:[]},()=>({source:'editorial',failed:true,jobs:[]}))]));
 return {version:1,generatedAt:new Date().toISOString(),sources:results};
}
export function initialRows(inventory,now=Date.now()){
 const seen=new Set(),links=new Set(),rows=[];
 for(const source of inventory.sources){
  for(const j of source.jobs){
   // Only external public links or previously authorized canonical detail routes.
   // Do not publish email addresses, raw descriptions or native application forms here.
   if(!valid(j,now)||seen.has(j.id))continue;
   const detail=typeof j.detailUrl==='string'&&/^\/(?:jobs\/SO-[A-Z0-9-]{6,45}|openings\/[a-z0-9-]{8,160})$/i.test(j.detailUrl)?j.detailUrl:'';
   const href=detail||(j.applicationMethod==='external'||!j.applicationMethod?publicURL(j.url):'');
   if(!href)continue;
   const key=vacancyLinkKey(j);if(key&&links.has(key))continue;
   seen.add(j.id);if(key)links.add(key);
   const meta=[j.location,j.mode,j.type].filter(Boolean).map(esc).join(' | ');
   rows.push('<article class="job-row"><div class="job-head"><a class="job-open-head" href="'+esc(href)+'"><span class="job-title">'+esc(j.title)+'</span></a><span class="job-open-company"><span class="job-company">'+esc(j.company)+'</span></span></div><div class="job-meta">'+meta+'</div>'+(j.salary?'<div class="job-salary">'+esc(j.salary)+'</div>':'')+'</article>');
   if(rows.length===10)return rows.join('');
  }
 }
 return rows.join('');
}
export async function seedHomepage(response,context){
 if(typeof HTMLRewriter==='undefined'||response.status!==200||!response.headers.get('content-type')?.startsWith('text/html'))return response;
 try{
  const inventory=await readInventory(context),html=initialRows(inventory);
  if(!html)return response;
  const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('etag');headers.set('cache-control','no-store');
  return new HTMLRewriter().on('#job-list',{element(el){el.setInnerContent(html,{html:true});}}).transform(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
 }catch{return response;}
}
