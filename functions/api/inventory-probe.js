import {SOURCE_KEYS,sourcePath,validateSnapshot,MAX_AGE} from '../../lib/feed-snapshot.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {recentPosting} from '../../lib/public-inventory.js';
import {vacancyLinkKey} from '../../lib/vacancy-identity.js';
import {onRequestGet as ai} from './ai-jobs.js';
import {onRequestGet as direct} from './direct-jobs.js';
export function probeResult(key,data,now=Date.now()){
 const stamp=Date.parse(data?.updatedAt||'');
 const valid=validateSnapshot({source_key:key,generated_at:stamp,payload_json:JSON.stringify(data)},now);
 if(!valid)return {ok:true,source:key,state:!Number.isFinite(stamp)||stamp>now?'invalid timestamp':now-stamp>=MAX_AGE?'stale':'partial or invalid payload',eligibleCount:null,received:Array.isArray(data?.jobs)?data.jobs.length:null};
 const ids=new Set(),links=new Set();let eligibleCount=0,duplicates=0,undatedOrOld=0;
 for(const j of valid.jobs){if(!recentPosting(j,now)){undatedOrOld++;continue;}const link=vacancyLinkKey(j);if(ids.has(j.id)||link&&links.has(link)){duplicates++;continue;}ids.add(j.id);if(link)links.add(link);eligibleCount++;}
 return {ok:true,source:key,state:'valid',received:data.jobs.length,eligibleCount,duplicates,undatedOrOld,filtered:data.jobs.length-valid.jobs.length,updatedAt:valid.updatedAt};
}
export async function onRequestGet(context){
 const {request,env}=context;
 if(!reviewHost(new URL(request.url).hostname)||!operatorAuthorized(request,env))return sceneReply({error:'Authenticated Preview required'},403);
 const key=new URL(request.url).searchParams.get('shard');if(!SOURCE_KEYS.includes(key))return sceneReply({error:'Unknown shard'},422);
 try{const r=await (key.startsWith('ai-')?ai:direct)({...context,request:new Request(new URL(sourcePath(key),request.url))});if(!r.ok)return sceneReply({ok:true,source:key,state:'unavailable',eligibleCount:null});return sceneReply(probeResult(key,await r.json()));}catch{return sceneReply({ok:true,source:key,state:'unavailable',eligibleCount:null});}
}
