import {sceneEnabled,operatorAuthorized,sameOrigin,sceneReply,readSceneInput,sceneId} from '../../lib/scene-core.js';
function allowed(context){return sceneEnabled(context)&&operatorAuthorized(context.request,context.env);}
export async function onRequestGet(context){
 if(!allowed(context))return sceneReply({error:'Unavailable'},403);
 try{
 const db=context.env.JOBS_DB;
 const [topics,replies,reports]=await Promise.all([
 db.prepare("SELECT id,city_id,title,body,created_at FROM scene_topics WHERE status='pending' ORDER BY created_at LIMIT 100").all(),
 db.prepare("SELECT id,topic_id,body,created_at FROM scene_replies WHERE status='pending' ORDER BY created_at LIMIT 100").all(),
 db.prepare("SELECT id,topic_id,reply_id,reason,created_at FROM scene_reports WHERE status='pending' ORDER BY created_at LIMIT 100").all()
 ]);
 return sceneReply({topics:topics.results||[],replies:replies.results||[],reports:reports.results||[]});
 }catch{return sceneReply({error:'Moderation unavailable'},503);}
}
export async function onRequestPost(context){
 if(!allowed(context)||!sameOrigin(context.request))return sceneReply({error:'Unavailable'},403);
 const data=await readSceneInput(context.request);
 if(!data||!sceneId(data.id))return sceneReply({error:'Invalid request'},422);
 const actions={topic:'scene_topics',reply:'scene_replies',report:'scene_reports'};
 const table=Object.hasOwn(actions,data.kind)?actions[data.kind]:null;
 if(!table||!(data.kind==='report'?['reviewed']:['published','rejected','removed']).includes(data.status))return sceneReply({error:'Invalid action'},422);
 try{
 const db=context.env.JOBS_DB;
 // SQL identifiers are selected only from the constant allowlist above.
 const condition=data.kind==='report'?"status='pending'":data.status==='removed'?"status='published'":"status='pending'";
 const reviewed=data.kind==='report'?'':',reviewed_at=CURRENT_TIMESTAMP';
 const parent=data.kind==='reply'&&data.status==='published'?" AND EXISTS(SELECT 1 FROM scene_topics t WHERE t.id=scene_replies.topic_id AND t.status='published')":'';
 const result=await db.prepare('UPDATE '+table+' SET status=?'+reviewed+' WHERE id=? AND '+condition+parent).bind(data.status,data.id).run();
 return sceneReply({ok:!!result.meta?.changes},result.meta?.changes?200:409);
 }catch{return sceneReply({error:'Moderation unavailable'},503);}
}
