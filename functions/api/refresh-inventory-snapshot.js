import {isolated,SOURCE_KEYS,sourcePath,validateSnapshot,MAX_AGE} from '../../lib/feed-snapshot.js';
import {onRequestGet as ai} from './ai-jobs.js';
import {onRequestGet as direct} from './direct-jobs.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'private, no-store'}});
function authorized(request,env){
 const key=env.INVENTORY_SNAPSHOT_SECRET;if(typeof key!=='string'||key.length<32||key===env.OPERATOR_ACCESS_TOKEN||key===env.SOURCING_INGEST_SECRET)return false;
 const a=new TextEncoder().encode(request.headers.get('authorization')||''),b=new TextEncoder().encode('Bearer '+key);
 let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0;
}
export async function onRequestPost(context){
 if(!isolated(context))return reply({ok:false,error:'Isolated Preview snapshot feature disabled'},403);
 if(!authorized(context.request,context.env))return reply({ok:false,error:'Unauthorized'},401);
 // Fixed server-side source allowlist. Never accept an arbitrary URL.
 const now=Date.now();
 // Select the least recently attempted shard, not a wall-clock modulo that can
 // permanently skip a shard when Cron runs late. Persist attempts separately.
 let key;
 try{
  const health=await context.env.JOBS_DB.prepare('SELECT source_key,last_attempt_at FROM public_feed_sync_health').all();
  const attempts=new Map((health.results||[]).map(r=>[r.source_key,Number(r.last_attempt_at)||0]));
  key=SOURCE_KEYS.slice().sort((a,b)=>(attempts.get(a)||0)-(attempts.get(b)||0))[0];
  const lease=await context.env.JOBS_DB.prepare('INSERT INTO public_feed_sync_health(source_key,last_attempt_at,status) VALUES(?,?,?) ON CONFLICT(source_key) DO UPDATE SET last_attempt_at=excluded.last_attempt_at,status=excluded.status WHERE public_feed_sync_health.last_attempt_at<=?').bind(key,now,'attempting',now-60000).run();
  if(!lease.meta?.changes)return reply({ok:false,error:'Refresh already attempted'},409);
 }catch{return reply({ok:false,error:'Sync health schema unavailable'},503);}
 const path=sourcePath(key);
 async function finish(status,count=null){try{await context.env.JOBS_DB.prepare('UPDATE public_feed_sync_health SET status=?,job_count=? WHERE source_key=? AND last_attempt_at=?').bind(status,count,key,now).run();}catch{/* Snapshot remains independently readable. */}}
 try{
  const request=new Request(new URL(path,context.request.url),{method:'GET'});
  const response=await (key.startsWith('ai-')?ai:direct)({...context,request});
  if(!response.ok){await finish('unavailable');return reply({ok:false,error:'Source unavailable',source:key},503);}
  const data=await response.json();
  // Preserve real upstream timestamp, not the time a cached response was read.
  const timestamp=Date.parse(data.updatedAt);
  if(!Number.isFinite(timestamp)||Date.now()-timestamp>=MAX_AGE){await finish('stale');return reply({ok:false,error:'Source cache too old for snapshot',source:key},409);}
  const row={source_key:key,generated_at:timestamp,payload_json:JSON.stringify(data)};
  if(row.payload_json.length>400000){await finish('oversized');return reply({ok:false,error:'Source too large',source:key},422);}
  const valid=validateSnapshot(row);if(!valid){await finish('partial');return reply({ok:false,error:'Incomplete or invalid source',source:key},409);}
  await context.env.JOBS_DB.prepare('INSERT INTO public_feed_snapshots(source_key,generated_at,payload_json) VALUES(?,?,?) ON CONFLICT(source_key) DO UPDATE SET generated_at=excluded.generated_at,payload_json=excluded.payload_json WHERE excluded.generated_at>=public_feed_snapshots.generated_at').bind(key,timestamp,JSON.stringify(valid)).run();
  await finish('ok',valid.jobs.length);
  return reply({ok:true,source:key,count:valid.jobs.length});
 }catch{await finish('unavailable');return reply({ok:false,error:'Snapshot refresh unavailable',source:key},503);}
}
