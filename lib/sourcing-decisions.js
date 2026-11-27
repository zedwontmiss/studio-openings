export const SOURCING_MODES=['standard','directory-only','commercial-prospect','editorial-prospect'];
export function cleanSourcingDecision(x){
 if(!x||typeof x.studioId!=='string'||!SOURCING_MODES.includes(x.mode)||typeof x.reason!=='string'||x.reason.trim().length<3||x.reason.length>500)return null;
 return {studioId:x.studioId,mode:x.mode,reason:x.reason.trim()};
}
export function compileSourcingRules(decisions,studios){
 const seen=new Set(),rules=[];
 for(const raw of decisions){
  const d=cleanSourcingDecision(raw),s=d&&studios.find(x=>x.id===d.studioId);
  if(!s||seen.has(d.studioId))throw Error('Unknown or duplicate studio decision');
  seen.add(d.studioId);
  if(d.mode==='standard')continue;
  const aliases=[...new Set([s.name,...s.aliases])],hosts=[];
  // Only employer-owned website domains, never a shared ATS hostname.
  const u=new URL(s.website);
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Invalid studio website');
  const host=u.hostname.replace(/^www\./,'');
  if(!['greenhouse.io','lever.co','ashbyhq.com','workdayjobs.com','smartrecruiters.com','workable.com'].some(h=>host===h||host.endsWith('.'+h)))hosts.push(host);
  rules.push({studioId:s.id,mode:d.mode,aliases,hosts});
 }
 return rules;
}
