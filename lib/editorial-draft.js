import {STUDIO_IDENTITIES} from './studio-identities.js';
import {LOCAL_CITIES} from './local-cities.js';
export const CATEGORIES=['Career','Practice','Studio','Research','Industry','Opinion','Resources'];
export function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
const text=(v,n)=>typeof v==='string'&&v.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
export function cleanEditorialDraft(x){
 if(!x||x.kind!=='independent'||typeof x.slug!=='string'||!/^([a-z0-9]+-)*[a-z0-9]+$/.test(x.slug)||x.slug.length>100||!CATEGORIES.includes(x.category))return null;
 for(const [k,n] of Object.entries({title:180,description:400,body:30000,notes:4000,date:10,contributor:120,studioId:180,cityId:180}))if(!text(x[k],n))return null;
 if(!x.title.trim()||x.date&&!validDate(x.date)||x.studioId&&!STUDIO_IDENTITIES.some(s=>s.id===x.studioId)||x.cityId&&!LOCAL_CITIES.some(c=>c.id===x.cityId))return null;
 return {slug:x.slug,kind:'independent',title:x.title.trim(),description:x.description.trim(),category:x.category,date:x.date,body:x.body.trim(),notes:x.notes.trim(),contributor:x.contributor.trim(),studioId:x.studioId,cityId:x.cityId};
}
export function stageEditorial(d,existing,today){
 const x=cleanEditorialDraft(d),errors=[];
 if(!x)return {ok:false,errors:['Invalid independent draft']};
 if(existing.some(a=>a.slug===x.slug))errors.push('Published slug already exists; corrections require a separate reviewed edit');
 if(!x.description||!x.body||!x.date||x.date>today||!x.notes)errors.push('Summary, body, valid publication date and factual review notes required');
 const blocks=x.body.split(/\n\s*\n/).filter(Boolean).map(p=>p.startsWith('## ')?{type:'heading',text:p.slice(3).trim()}:{type:'paragraph',text:p.trim()});
 if(!blocks.some(b=>b.type==='paragraph')||blocks.some(b=>!b.text||b.text.length>15000))errors.push('Article paragraphs required; maximum 15000 characters per block');
 if(errors.length)return {ok:false,errors};
 return {ok:true,article:{slug:x.slug,title:x.title,description:x.description,category:x.category,date:x.date,status:'published',blocks,related:x.studioId?[{path:'/studio/'+STUDIO_IDENTITIES.find(s=>s.id===x.studioId).slug,label:'Explore studio profile'}]:[],cityIds:x.cityId?[x.cityId]:[]}};
}
export function prepareEditorialBatch(drafts,existing,today){
 const records=[],errors=[],seen=new Set();
 for(const d of drafts){if(d.state!=='reviewed'||!Number.isInteger(d.revision)||d.revision<1||seen.has(d.slug)){errors.push('Invalid or duplicate reviewed draft');continue;}seen.add(d.slug);const r=stageEditorial(d,existing.concat(records),today);if(r.ok)records.push(r.article);else errors.push(d.slug+': '+r.errors.join('; '));}
 return errors.length?{ok:false,errors}:{ok:true,version:1,status:'reviewed-independent-editorial',articles:records};
}
