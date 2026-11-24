import {sceneEnabled,operatorAuthorized,sameOrigin,sceneReply,readSceneInput,sceneId} from '../../lib/scene-core.js';
function allowed(context){return sceneEnabled(context)&&operatorAuthorized(context.request,context.env);}
export async function onRequestGet(context){
 if(!allowed(context))return sceneReply({error:'Unavailable'},403);
 try{
 const db=context.env.JOBS_DB;
 const [topics,replies,reports]=await Promise.all([
 db.prepare("SELECT id,city_id,title,body,created_at FROM scene_topics WHERE status='pending' ORDER BY created_at LIMIT 100").all(),
 db.prepare("SELECT r.id,r.topic_id,r.body,r.created_at,t.city_id,t.title AS topic_title,t.body AS parent_body,t.status AS topic_status FROM scene_replies r JOIN scene_topics t ON t.id=r.topic_id WHERE r.status='pending' ORDER BY r.created_at LIMIT 100").all(),
 db.prepare("SELECT p.id,p.topic_id,p.reply_id,p.reason,p.created_at,t.city_id,t.title AS topic_title,t.body AS parent_body,t.status AS topic_status,r.body AS reply_body,r.status AS reply_status FROM scene_reports p JOIN scene_topics t ON t.id=p.topic_id LEFT JOIN scene_replies r ON r.id=p.reply_id AND r.topic_id=p.topic_id WHERE p.status='pending' ORDER BY p.created_at LIMIT 100").all()
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
