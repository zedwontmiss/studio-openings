import {cleanStudioDraft,stageStudio} from './studio-draft.js';
export function preparePublication(drafts,existing,today){
 const records=[],errors=[],seen=new Set();
 for(const entry of drafts){
  const draft=cleanStudioDraft(entry);
  if(!draft||entry.state!=='reviewed'||!Number.isInteger(entry.revision)||entry.revision<1||seen.has(entry.id)){errors.push({id:String(entry?.id||''),error:'Invalid or duplicate reviewed draft'});continue;}
  seen.add(entry.id);
  const result=stageStudio(draft,existing.concat(records),today);
  if(!result.ok){errors.push({id:draft.id,error:result.errors.join('; ')});continue;}
  records.push(result.record);
 }
 return errors.length?{ok:false,errors}:{ok:true,version:1,status:'reviewed-not-published',reviewedOn:today,records};
}
