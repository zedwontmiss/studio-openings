import assert from 'node:assert/strict';
import {freshEditorialSnapshot,SNAPSHOT_TTL_MS} from '../lib/public-inventory.js';
const now=Date.now(),job={id:'editorial-example',title:'Designer',company:'Example',location:'London',role:'visual',url:'https://example.com/job',applicationMethod:'external',posted:new Date(now-86400000).toISOString(),dateKind:'posted',expiresAt:new Date(now+60000).toISOString()};
const snapshot={version:1,source:'editorial',generatedAt:new Date(now).toISOString(),jobs:[job,{...job,id:'expired',expiresAt:new Date(now-1).toISOString()},{...job,id:'held',company:'Koto'},{...job,id:'no-expiry',expiresAt:''}]};
assert.equal(freshEditorialSnapshot(snapshot,now).jobs.length,1);
assert.equal(freshEditorialSnapshot({...snapshot,generatedAt:new Date(now-SNAPSHOT_TTL_MS).toISOString()},now),null);
assert.equal(freshEditorialSnapshot({...snapshot,generatedAt:new Date(now+1).toISOString()},now),null);
console.log('Editorial snapshot expiry and outreach tests passed.');
