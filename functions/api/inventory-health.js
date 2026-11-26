import {SOURCE_KEYS,MAX_AGE,validateSnapshot} from '../../lib/feed-snapshot.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {recentPosting} from '../../lib/public-inventory.js';
export async function onRequestGet(context){
 const {request,env}=context;
 if(!reviewHost(new URL(request.url).hostname)||env?.PREVIEW_D1_ISOLATED!=='true'||!env?.JOBS_DB||!operatorAuthorized(request,env))return sceneReply({error:'Authenticated isolated Preview required'},403);
 try{
  const db=env.JOBS_DB,now=Date.now();
  const [health,snapshots]=await Promise.all([db.prepare('SELECT source_key,last_attempt_at,status,job_count FROM public_feed_sync_health LIMIT 100').all(),db.prepare('SELECT source_key,generated_at,payload_json FROM public_feed_snapshots LIMIT 100').all()]);
  const h=new Map((health.results||[]).map(r=>[r.source_key,r])),s=new Map((snapshots.results||[]).map(r=>[r.source_key,r]));
  return sceneReply({enabled:env.INVENTORY_SNAPSHOT_ENABLED==='true',generatedAt:new Date(now).toISOString(),sources:SOURCE_KEYS.map(key=>{const attempt=h.get(key),row=s.get(key),stamp=row?.generated_at,age=Number.isSafeInteger(stamp)&&stamp<=now?now-stamp:null;const valid=validateSnapshot(row,now);return {source:key,lastAttemptAt:attempt?.last_attempt_at||null,status:attempt?.status||'not-attempted',jobCount:attempt?.job_count??null,snapshotAgeMs:age,fresh:!!valid,snapshotState:!row?'missing':age===null?'invalid timestamp':age>=MAX_AGE?'stale':valid?'fresh':'invalid payload',eligibleCount:valid?valid.jobs.filter(j=>recentPosting(j,now)).length:null};})});
 }catch{return sceneReply({error:'Inventory health unavailable'},503);}
}
