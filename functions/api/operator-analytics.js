import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
export async function onRequestGet({request,env}){
 if(!operatorAuthorized(request,env))return sceneReply({error:'Operator access required'},403);
 if(!reviewHost(new URL(request.url).hostname)||env?.PREVIEW_D1_ISOLATED!=='true'||!env.JOBS_DB)return sceneReply({error:'Isolated Preview required'},403);
 const days=Number(new URL(request.url).searchParams.get('days')||30);
 if(![7,30,90].includes(days))return sceneReply({error:'Invalid reporting period'},422);
 const offset='-'+(days-1)+' days',db=env.JOBS_DB;
 let traffic=null,revenue=null;
 try{const rows=await db.prepare("SELECT event,SUM(total) AS total FROM traffic_daily WHERE day>=date('now',?) AND day<=date('now') AND event IN ('visit','listing','apply') GROUP BY event").bind(offset).all();traffic={visits:0,listingViews:0,applyClicks:0};const keys={visit:'visits',listing:'listingViews',apply:'applyClicks'};for(const r of rows.results||[])if(Object.hasOwn(keys,r.event))traffic[keys[r.event]]=Number(r.total)||0;}catch{}
 try{const row=await db.prepare("SELECT COALESCE(SUM(price_usd),0) AS amount FROM job_orders WHERE status='paid' AND payment_confirmed_at>=date('now',?) AND payment_confirmed_at<=CURRENT_TIMESTAMP").bind(offset).first();revenue=Number(row.amount)||0;}catch{}
 return sceneReply({ok:true,days,traffic,trafficEnabled:env.TRAFFIC_ENABLED==='true',jobOrderReceiptsUSD:revenue,environment:'isolated-preview'});
}
