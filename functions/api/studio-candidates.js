import {studioCandidates} from '../../lib/studio-candidates.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
export async function onRequestGet(context){
 if(!reviewHost(new URL(context.request.url).hostname)||context.env?.PREVIEW_D1_ISOLATED!=='true'||!context.env?.JOBS_DB||!operatorAuthorized(context.request,context.env))return sceneReply({error:'Isolated Preview operator access required'},403);
 try{
  const db=context.env.JOBS_DB;
  const [sources,maps]=await Promise.all([
   db.prepare("SELECT id,employer_name,official_url,focus,status,reviewed_at FROM creative_sources WHERE status='approved' ORDER BY id LIMIT 501").all(),
   db.prepare("SELECT m.source_id,m.city_name,m.region_name,m.country_code,m.city_id FROM source_location_maps m JOIN creative_sources s ON s.id=m.source_id WHERE s.status='approved' ORDER BY m.source_id,m.location_key LIMIT 3001").all()
  ]);
  const a=sources.results||[],b=maps.results||[];
  return sceneReply({candidates:studioCandidates(a.slice(0,500),b.slice(0,3000)),truncated:a.length>500||b.length>3000,note:'Vacancy locations are not verified studio offices. All records require independent directory review.'});
 }catch{return sceneReply({error:'Candidate registry unavailable'},503);}
}
