import {sceneEnabled,cityFor,sceneId,sceneText,sameOrigin,sceneReply,readSceneInput,consumeSceneRate,sceneWritesEnabled,verifySceneChallenge,scenePilotCity} from '../../lib/scene-core.js';
export async function onRequestGet(context){
 if(!sceneEnabled(context))return sceneReply({enabled:false},503);
 const p=new URL(context.request.url).searchParams,city=cityFor(p.get('city')),topic=p.get('topic'),sort=p.get('sort')==='popular'?'popular':'latest';
 if(!city||!scenePilotCity(city.slug)||topic&&!sceneId(topic))return sceneReply({error:'Invalid city or topic'},400);
 try{
 const db=context.env.JOBS_DB;
 if(topic){
 const row=await db.prepare("SELECT id,title,body,created_at FROM scene_topics WHERE id=? AND city_id=? AND status='published'").bind(topic,city.id).first();
 if(!row)return sceneReply({error:'Discussion not found'},404);
 const replies=await db.prepare("SELECT id,body,created_at FROM scene_replies WHERE topic_id=? AND status='published' ORDER BY created_at,id LIMIT 100").bind(topic).all();
 return sceneReply({topic:row,replies:replies.results||[]});
 }
 const order=sort==='popular'?'reply_count DESC,t.created_at DESC,t.id DESC':'t.created_at DESC,t.id DESC';
 const rows=await db.prepare("SELECT t.id,t.title,t.created_at,(SELECT COUNT(*) FROM scene_replies r WHERE r.topic_id=t.id AND r.status='published') AS reply_count FROM scene_topics t WHERE t.city_id=? AND t.status='published' ORDER BY "+order+" LIMIT 50").bind(city.id).all();
 return sceneReply({topics:rows.results||[]});
 }catch{return sceneReply({error:'Scene unavailable'},503);}
}
export async function onRequestPost(context){
 // Deliberately gated until independent moderation, privacy and abuse review.
 if(!sceneWritesEnabled(context))return sceneReply({error:'Posting unavailable'},503);
 if(!sameOrigin(context.request))return sceneReply({error:'Invalid origin'},403);
 const input=await readSceneInput(context.request),city=cityFor(input?.city),kind=input?.kind;
 if(!city||!scenePilotCity(city.slug)||!['topic','reply','report'].includes(kind))return sceneReply({error:'Invalid submission'},400);
 const title=kind==='topic'?sceneText(input.title,8,160):null,body=kind==='topic'?sceneText(input.body,10,3000):kind==='reply'?sceneText(input.body,2,2000):null;
 if(kind==='topic'&&(!title||!body)||kind==='reply'&&!body||kind!=='topic'&&!sceneId(input.topicId))return sceneReply({error:'Invalid submission'},422);
 if(kind==='report'&&(!['spam','harassment','privacy','false_claim','other'].includes(input.reason)||input.replyId&&!sceneId(input.replyId)))return sceneReply({error:'Invalid report'},422);
 if(!await verifySceneChallenge(context,input.challenge,kind))return sceneReply({error:'Please complete the verification again'},403);
 try{
 const db=context.env.JOBS_DB;
 if(kind!=='topic'){
 const topic=await db.prepare("SELECT id FROM scene_topics WHERE id=? AND city_id=? AND status='published'").bind(input.topicId,city.id).first();
 if(!topic)return sceneReply({error:'Discussion not found'},404);
 if(kind==='report'&&input.replyId){const reply=await db.prepare("SELECT id FROM scene_replies WHERE id=? AND topic_id=? AND status='published'").bind(input.replyId,input.topicId).first();if(!reply)return sceneReply({error:'Reply not found'},404);}
 }
 if(!await consumeSceneRate(context,kind))return sceneReply({error:'Submission limit reached or posting unavailable'},429);
 const id=crypto.randomUUID();
 if(kind==='topic')await db.prepare("INSERT INTO scene_topics(id,city_id,title,body) VALUES(?,?,?,?)").bind(id,city.id,title,body).run();
 else if(kind==='reply')await db.prepare("INSERT INTO scene_replies(id,topic_id,body) VALUES(?,?,?)").bind(id,input.topicId,body).run();
 else await db.prepare("INSERT INTO scene_reports(id,topic_id,reply_id,reason) VALUES(?,?,?,?)").bind(id,input.topicId,input.replyId||null,input.reason).run();
 return sceneReply({ok:true,status:'pending_review'},202);
 }catch{return sceneReply({error:'Submission unavailable'},503);}
}
