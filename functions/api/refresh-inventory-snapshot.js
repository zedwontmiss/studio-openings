import {isolated,SOURCE_KEYS,sourcePath,validateSnapshot,MAX_AGE} from '../../lib/feed-snapshot.js';
import {onRequestGet as ai} from './ai-jobs.js';
import {onRequestGet as direct} from './direct-jobs.js';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'private, no-store'}});
function authorized(request,env){
 const key=env.INVENTORY_SNAPSHOT_SECRET;if(typeof key!=='string'||key.length<32)return false;
 const a=new TextEncoder().encode(request.headers.get('authorization')||''),b=new TextEncoder().encode('Bearer '+key);
 let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0;
}
export async function onRequestPost(context){
 if(!isolated(context))return reply({ok:false,error:'Isolated Preview snapshot feature disabled'},403);
 if(!authorized(context.request,context.env))return reply({ok:false,error:'Unauthorized'},401);
 // Fixed server-side source allowlist. Never accept an arbitrary URL.
 const key=SOURCE_KEYS[Math.floor(Date.now()/60000)%SOURCE_KEYS.length],path=sourcePath(key);
 try{
  const request=new Request(new URL(path,context.request.url),{method:'GET'});
  const response=await (key.startsWith('ai-')?ai:direct)({...context,request});
  if(!response.ok)return reply({ok:false,error:'Source unavailable'},503);
  const data=await response.json();
  // Preserve real upstream timestamp, not the time a cached response was read.
  const timestamp=Date.parse(data.updatedAt);
  if(!Number.isFinite(timestamp)||Date.now()-timestamp>=MAX_AGE)return reply({ok:false,error:'Source cache too old for snapshot'},409);
  const row={source_key:key,generated_at:timestamp,payload_json:JSON.stringify(data)};
  if(row.payload_json.length>400000)return reply({ok:false,error:'Source too large'},422);
  const valid=validateSnapshot(row);if(!valid)return reply({ok:false,error:'Incomplete or invalid source'},409);
  await context.env.JOBS_DB.prepare('INSERT INTO public_feed_snapshots(source_key,generated_at,payload_json) VALUES(?,?,?) ON CONFLICT(source_key) DO UPDATE SET generated_at=excluded.generated_at,payload_json=excluded.payload_json WHERE excluded.generated_at>=public_feed_snapshots.generated_at').bind(key,timestamp,JSON.stringify(valid)).run();
  return reply({ok:true,source:key,count:valid.jobs.length});
 }catch{return reply({ok:false,error:'Snapshot refresh unavailable'},503);}
}
