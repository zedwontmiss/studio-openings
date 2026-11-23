import assert from 'node:assert/strict';
import {outreachHeld,applyOutreachPolicy,SOURCED_FEEDS} from '../lib/outreach-policy.js';
import {onRequestGet} from '../functions/api/direct-jobs.js';
import {sourceSeoJob} from '../lib/source-seo-policy.js';
for(const name of ['Koto','KOTO Studio','Runway','RunwayML','Runway ML','Linear'])assert.equal(outreachHeld(name),true,name);
for(const name of ['Further','Granola','Sierra','Linear Lighting','Runway Fashion'])assert.equal(outreachHeld(name),false,name);
assert.equal(outreachHeld('Unknown','https://careers.koto.studio/jobs/123'),true);
assert.equal(outreachHeld('Unknown','https://jobs.ashbyhq.com/linear/123'),true);
assert.equal(outreachHeld('Unknown','https://koto.com.evil.example/job'),false);
assert.equal(outreachHeld('Unknown','https://evil.example/jobs.ashbyhq.com/linear'),false);
const jobs=[{company:'Koto',url:'https://koto.com/careers/1'},{company:'Linear'},{company:'Runway'},{company:'Further'}];
for(const path of SOURCED_FEEDS){
 const cached=new Response(JSON.stringify({jobs,sources:['Koto','Official careers · Linear','Further']}),{headers:{'content-type':'application/json','etag':'old','cache-control':'public, max-age=300'}});
 const response=await applyOutreachPolicy(cached,path),data=await response.json();
 assert.deepEqual(data.jobs,[{company:'Further'}]);assert.deepEqual(data.sources,['Further']);
 assert.equal(response.headers.get('etag'),null);assert.equal(response.headers.get('cache-control'),'public, max-age=300');
}
const employer=new Response(JSON.stringify({jobs:[jobs[0]]}));
assert.equal(await applyOutreachPolicy(employer,'/api/approved-jobs'),employer,'Do not suppress separately approved employer submissions');
assert.equal(sourceSeoJob({employer_name:'Koto'}),null);
const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Held source must not be fetched');};
try{const response=await onRequestGet({request:new Request('https://example.com/api/direct-jobs?shard=0')});assert.equal(response.status,200);assert.deepEqual((await response.json()).jobs,[]);}finally{globalThis.fetch=original;}
console.log('Outreach holds: source feeds, cached payloads, aliases, canonical hosts, SEO and approved-employer exception passed.');
