import {reviewHost} from '../lib/release-scope.js';
import {findLocal,localPage} from '../lib/local-page.js';
import {sceneEnabled,sceneId,sceneWritesEnabled,scenePilotCity} from '../lib/scene-core.js';
export async function onRequestGet(context){
 const city=findLocal(String(context.params?.city||''));
 if(!city)return context.next();
 if(!reviewHost(new URL(context.request.url).hostname))return new Response('Not found',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
 let scene={enabled:false,topics:[]};
 if(sceneEnabled(context)&&scenePilotCity(city.slug)){
  try{
   const p=new URL(context.request.url).searchParams,db=context.env.JOBS_DB,topic=p.get('topic');
   if(topic&&sceneId(topic)){
    const row=await db.prepare("SELECT id,title,body,created_at FROM scene_topics WHERE id=? AND city_id=? AND status='published'").bind(topic,city.id).first();
    if(row){const replies=await db.prepare("SELECT id,body,created_at FROM scene_replies WHERE topic_id=? AND status='published' ORDER BY created_at,id LIMIT 100").bind(topic).all();scene={enabled:true,topic:row,replies:replies.results||[]};}
   }
   if(!scene.enabled){const order=p.get('sort')==='popular'?'reply_count DESC,t.created_at DESC,t.id DESC':'t.created_at DESC,t.id DESC';
    const rows=await db.prepare("SELECT t.id,t.title,t.created_at,(SELECT COUNT(*) FROM scene_replies r WHERE r.topic_id=t.id AND r.status='published') AS reply_count FROM scene_topics t WHERE t.city_id=? AND t.status='published' ORDER BY "+order+" LIMIT 50").bind(city.id).all();scene={enabled:true,topics:rows.results||[]};}
  }catch{scene={enabled:false,topics:[]};}
 }
 if(scene.enabled&&sceneWritesEnabled(context)){scene.writes=true;scene.siteKey=context.env.SCENE_TURNSTILE_SITE_KEY;}
 return new Response(localPage(city,scene),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
}
