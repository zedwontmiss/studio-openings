import {onRequestGet as approved} from '../functions/api/approved-jobs.js';
import {onRequestGet as indexed} from '../functions/api/indexed-jobs.js';
import {onRequestGet as editorial} from '../functions/api/editorial-jobs.js';
import {outreachHeld} from './outreach-policy.js';
import {esc} from './seo-jobs.js';
const roles=new Set(['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture']);
export const INVENTORY_SOURCES=Object.freeze(['approved','indexed','editorial']);
export function publicURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:'';}catch{return '';}}
function valid(j,now){return j&&typeof j.id==='string'&&j.title&&j.company&&j.location&&roles.has(j.role)&&(!j.expiresAt||Date.parse(j.expiresAt)>now)&&(j.applicationMethod==='native'||j.applicationMethod==='email'||publicURL(j.url));}
export async function readInventory(context){
 const calls=[approved,indexed,editorial];
 const results=await Promise.all(calls.map(async(fn,i)=>{try{const response=await fn(context);if(!response.ok)throw Error('Unavailable');const data=await response.json();if(!Array.isArray(data.jobs))throw Error('Invalid feed');return {source:INVENTORY_SOURCES[i],jobs:data.jobs.filter(j=>valid(j,Date.now())&&(i===0||!outreachHeld(j.company,j.url)))};}catch{return {source:INVENTORY_SOURCES[i],failed:true,jobs:[]};}}));
 // Preserve separate source batches so the browser can retain its existing precedence and deduplication.
 return {version:1,generatedAt:new Date().toISOString(),sources:results};
}
export function initialRows(inventory,now=Date.now()){
 const seen=new Set(),rows=[];
 for(const source of inventory.sources){
  for(const j of source.jobs){
   // Only external public links or previously authorized canonical detail routes.
   // Do not publish email addresses, raw descriptions or native application forms here.
   if(!valid(j,now)||seen.has(j.id))continue;
   const detail=typeof j.detailUrl==='string'&&/^\/(?:jobs\/SO-[A-Z0-9-]{6,45}|openings\/[a-z0-9-]{8,160})$/i.test(j.detailUrl)?j.detailUrl:'';
   const href=detail||(j.applicationMethod==='external'||!j.applicationMethod?publicURL(j.url):'');
   if(!href)continue;
   seen.add(j.id);
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
