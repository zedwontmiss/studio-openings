import assert from 'node:assert/strict';import {runMaintenance} from '../operations/preview-maintenance-core.mjs';
const env={SNAPSHOT_SECRET:'s'.repeat(32),INGEST_SECRET:'i'.repeat(32)};
for(const [task,path,key,result] of [['snapshot','refresh-inventory-snapshot',env.SNAPSHOT_SECRET,{ok:true,count:8}],['ingest','ingest-sources',env.INGEST_SECRET,{ok:true,indexed:4,retirement:'double-confirmed'}]]){
 const output=await runMaintenance(task,env,async(url,options)=>{assert.equal(url,'https://development.studio-openings.pages.dev/api/'+path);assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(options.body,'{}');assert.equal(options.headers.authorization,'Bearer '+key);return Response.json(result);});assert.equal(output.status,'ok');assert.ok(!JSON.stringify(output).includes(key));
}
await assert.rejects(runMaintenance('snapshot',{},()=>assert.fail('Unexpected request')),/Missing dedicated/);
await assert.rejects(runMaintenance('https://evil.example',env,()=>assert.fail('Unexpected request')),/Unknown/);
await assert.rejects(runMaintenance('snapshot',env,async()=>Response.json({ok:false},{status:403})),/HTTP 403/);
await assert.rejects(runMaintenance('snapshot',env,async()=>Response.json({ok:true,count:101})),/Unexpected/);
assert.equal((await runMaintenance('ingest',env,async()=>Response.json({ok:true,status:'no-approved-source'}))).status,'no-approved-source');

await assert.rejects(runMaintenance('snapshot',{SNAPSHOT_SECRET:env.SNAPSHOT_SECRET,INGEST_SECRET:env.SNAPSHOT_SECRET},()=>assert.fail('Unexpected request')),/distinct/);
await assert.rejects(runMaintenance('ingest',env,async()=>Response.json({ok:true,indexed:4,retirement:'skipped'})),/incomplete/);
