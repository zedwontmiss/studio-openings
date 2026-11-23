import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('assets/app.js','utf8');
const code=source.slice(source.indexOf('  function fetchFeedJSON('),source.indexOf('  function loadLive(){'));
function client(fetch,abort){if(arguments.length<2)abort=AbortController;return new Function('fetch','AbortController',code+';return fetchFeedJSON;')(fetch,abort);}
assert.deepEqual(await client(async()=>new Response('{"jobs":[]}'))('/api/jobs'),{jobs:[]});
await assert.rejects(client(async()=>new Response('unavailable',{status:503}))('/api/jobs'),/unavailable/);
await assert.rejects(client(async()=>new Response('invalid'))('/api/jobs'));
await assert.rejects(client(()=>new Promise(()=>{}))('/api/jobs',5),/timed out/);
await assert.rejects(client(()=>new Promise(()=>{}),undefined)('/api/jobs',5),/timed out/);
await assert.rejects(client(async()=>({ok:true,json:()=>new Promise(()=>{})}))('/api/jobs',5),/timed out/);
const start=source.indexOf('  function dateLabel(job)'),end=source.indexOf('  // Compact eligibility',start);
const dateLabel=new Function('function trim(v){return String(v||"").trim();}\n'+source.slice(start,end)+';return dateLabel;')();
assert.match(dateLabel({verifiedAt:'2026-11-23T05:00:00Z'}).label,/^Checked /);
assert.match(dateLabel({verifiedAt:'2026-11-23'}).label,/^Checked /);
assert.equal(dateLabel({}).label,'Date unavailable');
console.log('Feed timeout, HTTP/JSON/body failure, legacy abort fallback and verified timestamp labels passed.');
