import {reviewHost} from '../../lib/release-scope.js';
import {publicPlacements} from '../../lib/commercial-placements.js';
export async function onRequestGet({request,env}){
 const reply=placements=>new Response(JSON.stringify({placements}),{headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
 if(!reviewHost(new URL(request.url).hostname)||env?.PREVIEW_D1_ISOLATED!=='true'||env?.COMMERCIAL_PLACEMENTS_ENABLED!=='true'||!env.JOBS_DB)return reply([]);
 try{const q=await env.JOBS_DB.prepare("SELECT * FROM commercial_placements WHERE state='active' AND starts_on<=date('now') AND ends_on>=date('now') LIMIT 501").all();if(q.results.length>500)return reply([]);return reply(publicPlacements(q.results,new Date().toISOString().slice(0,10)));}catch{return reply([]);}
}
