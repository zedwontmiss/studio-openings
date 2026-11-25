import {STUDIO_WORKSPACE} from '../../lib/studio-workspace.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {outreachHeld} from '../../lib/outreach-policy.js';
import {cleanRelationship,cleanRelationshipEvent} from '../../lib/studio-relationships.js';
const SQL=["CREATE TABLE IF NOT EXISTS studio_relationships (studio_id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)","CREATE TABLE IF NOT EXISTS studio_relationship_events (id INTEGER PRIMARY KEY AUTOINCREMENT, studio_id TEXT NOT NULL, kind TEXT NOT NULL, summary TEXT NOT NULL, happened_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)","CREATE INDEX IF NOT EXISTS studio_relationship_events_by_studio ON studio_relationship_events(studio_id,id DESC)"];
const allowed=(req,env)=>reviewHost(new URL(req.url).hostname)&&env?.PREVIEW_D1_ISOLATED==='true'&&!!env?.JOBS_DB&&operatorAuthorized(req,env);
const studios=STUDIO_WORKSPACE.studios.map(s=>({id:s.id,name:s.name,slug:s.slug,website:s.website,discipline:s.disciplines.join(', '),held:outreachHeld(s.name,s.website)||outreachHeld(s.name,s.source.url)}));
const known=id=>studios.some(s=>s.id===id);
export async function onRequestGet({request,env}){
 if(!allowed(request,env))return sceneReply({error:'Authenticated isolated Preview required'},403);
 const id=new URL(request.url).searchParams.get('studio');
 if(id&&!known(id))return sceneReply({error:'Unknown studio'},404);
 try{
 const db=env.JOBS_DB;
 if(id){const row=await db.prepare('SELECT payload,revision,updated_at FROM studio_relationships WHERE studio_id=?').bind(id).first();const events=await db.prepare('SELECT kind,summary,happened_on,created_at FROM studio_relationship_events WHERE studio_id=? ORDER BY id DESC LIMIT 100').bind(id).all();return sceneReply({ok:true,record:row?{...JSON.parse(row.payload),revision:row.revision,updatedAt:row.updated_at}:null,events:events.results||[]});}
 const q=await db.prepare('SELECT studio_id,payload,revision FROM studio_relationships ORDER BY studio_id LIMIT 5001').all();if(q.results.length>5000)return sceneReply({error:'Workspace capacity exceeded'},409);
 return sceneReply({ok:true,ready:true,studios,records:q.results.map(r=>({studioId:r.studio_id,...JSON.parse(r.payload),revision:r.revision}))});
 }catch{return id?sceneReply({error:'Relationship storage unavailable'},503):sceneReply({ok:true,ready:false,studios,records:[]});}
}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated same-origin isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>10000)throw Error();x=JSON.parse(raw);}catch{return sceneReply({error:'Invalid request'},400);}
 const db=env.JOBS_DB;
 try{
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){for(const s of SQL)await db.prepare(s).run();return sceneReply({ok:true});}
 if(!known(x.studioId))return sceneReply({error:'Unknown studio'},404);
 if(x.action==='save'){
 const d=cleanRelationship(x.record);if(!d||!Number.isInteger(x.revision)||x.revision<0)return sceneReply({error:'Invalid relationship record'},422);
 const old=await db.prepare('SELECT payload,revision FROM studio_relationships WHERE studio_id=?').bind(x.studioId).first();
 if(old&&JSON.parse(old.payload).doNotContact&&!d.doNotContact&&x.confirmResume!==true)return sceneReply({error:'Explicit opt-out reversal confirmation required'},422);
 let r;if(x.revision===0)r=await db.prepare('INSERT OR IGNORE INTO studio_relationships(studio_id,payload) VALUES(?,?)').bind(x.studioId,JSON.stringify(d)).run();
 else r=await db.prepare('UPDATE studio_relationships SET payload=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE studio_id=? AND revision=?').bind(JSON.stringify(d),x.studioId,x.revision).run();
 if(!r.meta?.changes)return sceneReply({error:'Revision conflict; reload studio'},409);return sceneReply({ok:true,record:{...d,revision:x.revision+1}});
 }
 if(x.action==='log'){
 const e=cleanRelationshipEvent(x.event,new Date().toISOString().slice(0,10));if(!e)return sceneReply({error:'Invalid activity'},422);
 const row=await db.prepare('SELECT payload,revision FROM studio_relationships WHERE studio_id=?').bind(x.studioId).first();if(!row)return sceneReply({error:'Save relationship first'},409);
 const record=JSON.parse(row.payload);
 if(e.kind==='opt-out'){record.doNotContact=true;record.nextFollowup='';const results=await db.batch([db.prepare('UPDATE studio_relationships SET payload=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE studio_id=?').bind(JSON.stringify(record),x.studioId),db.prepare('INSERT INTO studio_relationship_events(studio_id,kind,summary,happened_on) VALUES(?,?,?,?)').bind(x.studioId,e.kind,e.summary,e.happenedOn)]);if(!results.every(r=>r.success))throw Error();}
 else await db.prepare('INSERT INTO studio_relationship_events(studio_id,kind,summary,happened_on) VALUES(?,?,?,?)').bind(x.studioId,e.kind,e.summary,e.happenedOn).run();
 return sceneReply({ok:true});
 }
 return sceneReply({error:'Unknown action'},422);
 }catch{return sceneReply({error:'Relationship storage unavailable'},503);}
}
