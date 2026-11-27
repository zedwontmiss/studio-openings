import assert from 'node:assert/strict';
import {validateSnapshot,sourcePath,isolated,MAX_AGE} from '../lib/feed-snapshot.js';
const now=Date.now(),job={id:'ai-test',title:'Designer',company:'Example',location:'London',role:'visual',url:'https://example.com/job',description:'Public text',applicationEmail:'private@example.com'};
const row={source_key:'ai-0',generated_at:now,payload_json:JSON.stringify({jobs:[job,{...job,company:'Koto'},{...job,url:'javascript:alert(1)'},{...job,expiresAt:new Date(now-1).toISOString()}]})};
const out=validateSnapshot(row,now);assert.equal(out.jobs.length,1);assert.equal(out.jobs[0].applicationEmail,undefined);
assert.equal(validateSnapshot({...row,generated_at:now-MAX_AGE},now),null);
assert.equal(validateSnapshot({...row,payload_json:JSON.stringify({jobs:[job],failed:['a']})},now),null);
assert.equal(sourcePath('https://evil.example'),'');
assert.equal(isolated({request:new Request('https://s-o.app/'),env:{PREVIEW_D1_ISOLATED:'true',INVENTORY_SNAPSHOT_ENABLED:'true',JOBS_DB:{}}}),false);
console.log('Snapshot safety checks passed');

assert.equal(validateSnapshot({...row,generated_at:now-17*60000},now).jobs.length,1);
assert.equal(validateSnapshot({...row,payload_json:JSON.stringify({jobs:[job],truncated:true})},now),null);
assert.equal(validateSnapshot({...row,payload_json:JSON.stringify({jobs:[job],updatedAt:new Date(now-1).toISOString()})},now),null);
assert.equal(validateSnapshot({...row,payload_json:JSON.stringify({jobs:[job],health:{status:'partial'}})},now),null);
