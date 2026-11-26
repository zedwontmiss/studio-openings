import {STUDIO_WORKSPACE} from '../../lib/studio-workspace.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {assessIndex,VERSION} from '../../lib/studio-index.js';
const allowed=(req,env)=>reviewHost(new URL(req.url).hostname)&&env?.PREVIEW_D1_ISOLATED==='true'&&!!env?.JOBS_DB&&operatorAuthorized(req,env);
const known=id=>STUDIO_WORKSPACE.studios.some(s=>s.id===id);
const today=()=>new Date().toISOString().slice(0,10);
export async function onRequestGet({request,env}){
 if(!allowed(request,env))return sceneReply({error:'Authenticated isolated Preview required'},403);
 const id=new URL(request.url).searchParams.get('studio');if(id&&!known(id))return sceneReply({error:'Unknown studio'},404);
 const studios=STUDIO_WORKSPACE.studios.map(s=>({id:s.id,name:s.name}));
 try{const rows=await env.JOBS_DB.prepare('SELECT studio_id,payload,revision FROM studio_index_assessments ORDER BY studio_id LIMIT 5001').all();if(rows.results.length>5000)return sceneReply({error:'Workspace capacity exceeded'},409);
 const records=rows.results.filter(r=>known(r.studio_id)&&(!id||r.studio_id===id)).map(r=>({studioId:r.studio_id,revision:r.revision,assessment:assessIndex(JSON.parse(r.payload),today())}));
 return sceneReply({ok:true,ready:true,version:VERSION,studios,records});
 }catch{return sceneReply({ok:true,ready:false,version:VERSION,studios,records:[]});}
}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated same-origin isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>30000)throw Error();x=JSON.parse(raw);}catch{return sceneReply({error:'Invalid request'},400);}
 try{const db=env.JOBS_DB;
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){await db.prepare('CREATE TABLE IF NOT EXISTS studio_index_assessments (studio_id TEXT PRIMARY KEY,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();return sceneReply({ok:true});}
 if(x.action!=='save'||!known(x.studioId)||!Number.isInteger(x.revision)||x.revision<0)return sceneReply({error:'Invalid request'},422);
 const a=assessIndex(x.assessment,today());if(!a)return sceneReply({error:'Invalid evidence or assessment'},422);
 const payload=JSON.stringify({version:a.version,reviewedOn:a.reviewedOn,criteria:a.criteria});
 const r=x.revision===0?await db.prepare('INSERT OR IGNORE INTO studio_index_assessments(studio_id,payload) VALUES(?,?)').bind(x.studioId,payload).run():await db.prepare('UPDATE studio_index_assessments SET payload=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE studio_id=? AND revision=?').bind(payload,x.studioId,x.revision).run();
 if(!r.meta?.changes)return sceneReply({error:'Revision conflict; reload'},409);return sceneReply({ok:true,assessment:a,revision:x.revision+1});
 }catch{return sceneReply({error:'Index storage unavailable'},503);}
}
