import {sceneEnabled,operatorAuthorized,sameOrigin,sceneReply,readSceneInput} from '../../lib/scene-core.js';
import {retentionPlan,purgeScene} from '../../lib/scene-retention.js';
function allowed(context){return sceneEnabled(context)&&operatorAuthorized(context.request,context.env);}
export async function onRequestGet(context){
 if(!allowed(context))return sceneReply({error:'Unavailable'},403);
 try{return sceneReply({eligible:await retentionPlan(context.env.JOBS_DB),limit:{rateBuckets:500,reports:100,replies:100,topics:100}});}catch{return sceneReply({error:'Retention unavailable'},503);}
}
export async function onRequestPost(context){
 if(!allowed(context)||!sameOrigin(context.request)||context.env.SCENE_RETENTION_ENABLED!=='true')return sceneReply({error:'Cleanup disabled'},403);
 const input=await readSceneInput(context.request);
 if(input?.confirm!=='purge-expired-scene-preview')return sceneReply({error:'Explicit confirmation required'},422);
 try{return sceneReply({deleted:await purgeScene(context.env.JOBS_DB)});}catch{return sceneReply({error:'Cleanup unavailable'},503);}
}
