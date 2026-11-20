/* Source location map-save feedback regression suite.
 * Run: node tests/operator-map-save-regression.cjs
 * Executes actual mapping code from assets/operator.js without external dependencies.
 */
'use strict';
const fs=require('fs'),path=require('path');
const app=fs.readFileSync(path.join(__dirname,'..','assets','operator.js'),'utf8');
const a=app.indexOf(' function sourceMapKey(raw){');
const b=app.indexOf(' function inspectSource(s,clickedButton){',a);
if(a<0||b<a)throw Error('Mapping state handlers missing');
const block=app.slice(a,b);
const expect=(cond,msg)=>{if(!cond)throw Error('Map regression: '+msg);};
const factory=(strategy)=>{
 const status={textContent:'',hidden:true,className:'',disabled:false};
 const save={textContent:'Save verified mapping',disabled:false};
 const rowBadge={textContent:'Not mapped',className:'source-location-status'};
 const rowButton={textContent:'Map city'};
 const row={getAttribute:()=> 'darien, illinois, united states',querySelector:(s)=>s==='.source-location-status'?rowBadge:rowButton};
 const host={querySelectorAll:()=>[row]};
 const nodes={'source-map-feedback':status,'source-map-save':save,'source-locations':host};
 const map={sourceId:'src-12345678-aaaa-4444-bbbb-cccccccccccc',
  locationKey:'darien, illinois, united states',cityName:'Darien',regionName:'Illinois',
  countryName:'United States',countryCode:'US'};
 const source={id:map.sourceId};
 const city={kind:'city',cityName:'Darien',regionName:'Illinois',countryCode:'US',cityId:123};
 const calls=[],notes=[];
 let resolvePost;
 const fakeAPI=(method,body)=>{
  calls.push({method,body});
  if(method==='POST'){
   if(strategy==='reject')return Promise.reject(Error('HTTP 409: approve the source first'));
   if(strategy==='pending')return new Promise(res=>{resolvePost=res;});
   return Promise.resolve({ok:true});
  }
  if(method==='GET')return Promise.resolve({ok:true,maps:strategy==='missing'?[]:[map],sources:[]});
  throw Error('Unexpected API '+method);
 };
 const env=new Function('$','sourceAPI','renderSources','sourceNotice',
 'var sourceState={maps:[]},selectedSource=arguments[4],selectedRaw="Darien, Illinois, United States",selectedCity=arguments[5],sourceMapSaving=false;\n'+block+
 '\nreturn {saveVerifiedLocationMapping,sourceMapMessage,mappedCity,sourceMapKey,updateMappedRow,getState:function(){return sourceState;}};')(
 key=>nodes[key],fakeAPI,()=>notes.push('render'),v=>notes.push(v),source,city);
 return {env,status,save,rowBadge,rowButton,calls,notes,map,resolvePost:()=>resolvePost};
};
async function run(){
 const good=factory('success');
 const pending=good.env.saveVerifiedLocationMapping();
 expect(good.save.textContent==='Saving…'&&good.save.disabled,'shows immediate saving state');
 expect(good.status.className.includes('is-pending')&&!good.status.hidden,'shows local pending message');
 await pending;
 expect(good.calls.length===2&&good.calls[0].method==='POST'&&good.calls[1].method==='GET','reads back confirmed D1 mapping');
 expect(good.calls[0].body.action==='map_location','uses existing approved source action');
 expect(good.save.textContent==='Saved ✓'&&good.save.disabled,'saves and disables duplicate post');
 expect(good.status.className.includes('is-success')&&good.status.textContent.includes('Darien, Illinois, United States'),'shows verified success next to Save');
 expect(good.rowBadge.textContent.includes('✓ Verified')&&good.rowButton.textContent==='Change mapping','upgrades row status');
 expect(good.notes.includes('render'),'refreshes mapping count in source list');
 const bad=factory('reject');await bad.env.saveVerifiedLocationMapping();
 expect(bad.save.textContent==='Retry save'&&!bad.save.disabled,'server rejection offers retry');
 expect(bad.status.className.includes('is-error')&&bad.status.textContent.includes('approve the source first'),'reason for rejection is visible locally');
 expect(bad.calls.length===1,'no GET after failed POST');
 const mismatch=factory('missing');await mismatch.env.saveVerifiedLocationMapping();
 expect(mismatch.save.textContent==='Retry save','no success if the mapping is absent from GET');
 expect(mismatch.status.className.includes('is-error'),'readback failure explained');
 const inflight=factory('pending');
 const action=inflight.env.saveVerifiedLocationMapping();
 await inflight.env.saveVerifiedLocationMapping();
 expect(inflight.calls.length===1,'double click does not create a second POST');
 inflight.resolvePost()({ok:true});await action;
 expect(inflight.save.textContent==='Saved ✓','pending action completes normally');
 expect(app.includes('id="source-map-feedback"')===false,'status HTML is owned by operator.html');
 console.log('PASS: 16 map-save confirmation, rejection, retry and idempotency checks');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
