import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {EDITORIAL_WORKSPACE_INDEX} from '../../lib/editorial-workspace-index.js';
import {STUDIO_IDENTITIES} from '../../lib/studio-identities.js';
import {LOCAL_CITIES} from '../../lib/local-cities.js';
import {cleanEditorialDraft,stageEditorial,prepareEditorialBatch} from '../../lib/editorial-draft.js';
const SQL="CREATE TABLE IF NOT EXISTS editorial_workspace_drafts (slug TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('draft','reviewed')), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const allowed=(req,env)=>reviewHost(new URL(req.url).hostname)&&env?.PREVIEW_D1_ISOLATED==='true'&&!!env?.JOBS_DB&&operatorAuthorized(req,env);
const metadata={published:EDITORIAL_WORKSPACE_INDEX,studios:STUDIO_IDENTITIES.map(s=>({id:s.id,name:s.name})),cities:LOCAL_CITIES.map(c=>({id:c.id,city:c.city}))};
async function rows(db,reviewed=false){const q=await db.prepare("SELECT payload,state,revision FROM editorial_workspace_drafts"+(reviewed?" WHERE state='reviewed'":"")+" ORDER BY slug LIMIT 501").all();if(q.results.length>500)throw Error('Draft capacity exceeded');return q.results.map(r=>({...JSON.parse(r.payload),state:r.state,revision:r.revision}));}
export async function onRequestGet({request,env}){if(!allowed(request,env))return sceneReply({error:'Authenticated isolated Preview required'},403);try{return sceneReply({ok:true,ready:true,...metadata,drafts:await rows(env.JOBS_DB)});}catch{return sceneReply({ok:true,ready:false,...metadata,drafts:[]});}}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated same-origin isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>65000)throw Error();x=JSON.parse(raw);if(!x||typeof x!=='object')throw Error();}catch{return sceneReply({error:'Invalid request'},400);}
 const db=env.JOBS_DB,today=new Date().toISOString().slice(0,10);
 try{
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){await db.prepare(SQL).run();return sceneReply({ok:true});}
 if(x.action==='export'){const batch=prepareEditorialBatch(await rows(db,true),EDITORIAL_WORKSPACE_INDEX,today);return batch.ok?sceneReply(batch):sceneReply({error:batch.errors.join('; ')},422);}
 const d=cleanEditorialDraft(x.draft);if(!d||!Number.isInteger(x.revision)||x.revision<0||!['save','review'].includes(x.action))return sceneReply({error:'Invalid draft'},422);
 if(EDITORIAL_WORKSPACE_INDEX.some(a=>a.slug===d.slug))return sceneReply({error:'Published slug exists'},409);
 let state='draft';
 if(x.action==='review'){if(x.confirm!==true||x.revision<1)return sceneReply({error:'Save first and confirm independent editorial review'},422);const old=await db.prepare('SELECT payload,revision FROM editorial_workspace_drafts WHERE slug=?').bind(d.slug).first();if(!old||old.revision!==x.revision||old.payload!==JSON.stringify(d))return sceneReply({error:'Draft changed; save and reload before review'},409);const staged=stageEditorial(d,EDITORIAL_WORKSPACE_INDEX,today);if(!staged.ok)return sceneReply({error:staged.errors.join('; ')},422);state='reviewed';}
 let r;if(x.revision===0){const count=await db.prepare('SELECT COUNT(*) AS n FROM editorial_workspace_drafts').first();if(count.n>=500)return sceneReply({error:'Draft capacity reached'},409);r=await db.prepare("INSERT OR IGNORE INTO editorial_workspace_drafts(slug,payload,state) VALUES(?,?,'draft')").bind(d.slug,JSON.stringify(d)).run();}else r=await db.prepare('UPDATE editorial_workspace_drafts SET payload=?,state=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE slug=? AND revision=?').bind(JSON.stringify(d),state,d.slug,x.revision).run();
 if(!r.meta?.changes)return sceneReply({error:'Revision conflict; reload'},409);return sceneReply({ok:true,draft:{...d,state,revision:x.revision+1}});
 }catch{return sceneReply({error:'Editorial storage unavailable'},503);}
}
