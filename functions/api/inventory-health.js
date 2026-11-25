import {isolated,SOURCE_KEYS,MAX_AGE} from '../../lib/feed-snapshot.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
export async function onRequestGet(context){
 if(!isolated(context)||!operatorAuthorized(context.request,context.env))return sceneReply({error:'Unavailable'},403);
 try{
  const db=context.env.JOBS_DB,now=Date.now();
  const [health,snapshots]=await Promise.all([db.prepare('SELECT source_key,last_attempt_at,status,job_count FROM public_feed_sync_health').all(),db.prepare('SELECT source_key,generated_at FROM public_feed_snapshots').all()]);
  const h=new Map((health.results||[]).map(r=>[r.source_key,r])),s=new Map((snapshots.results||[]).map(r=>[r.source_key,r]));
  return sceneReply({sources:SOURCE_KEYS.map(key=>{const attempt=h.get(key),stamp=s.get(key)?.generated_at,age=Number.isSafeInteger(stamp)&&stamp<=now?now-stamp:null;return {source:key,lastAttemptAt:attempt?.last_attempt_at||null,status:attempt?.status||'not-attempted',jobCount:attempt?.job_count??null,snapshotAgeMs:age,fresh:age!==null&&age<MAX_AGE};})});
 }catch{return sceneReply({error:'Inventory health unavailable'},503);}
}
