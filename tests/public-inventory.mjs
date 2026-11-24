import assert from 'node:assert/strict';
import {initialRows,readInventory} from '../lib/public-inventory.js';
const now=Date.now(),job={id:'example',title:'Designer <script>',company:'Test & Studio',location:'London',role:'visual',url:'https://example.com/jobs/1',applicationMethod:'external',expiresAt:new Date(now+60000).toISOString()};
const html=initialRows({sources:[{jobs:[job,job,{...job,id:'expired',expiresAt:new Date(now-1).toISOString()},{...job,id:'bad',url:'javascript:alert(1)'},{...job,id:'email',applicationMethod:'email',applicationEmail:'private@example.com',url:''}]}]},now);
assert.equal((html.match(/class="job-row"/g)||[]).length,1);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Test &amp; Studio'));assert.ok(!html.includes('private@example.com'));assert.ok(!html.includes('javascript:'));
const inventory=await readInventory({env:{}});assert.equal(inventory.sources.length,3);assert.equal(inventory.sources[0].failed,true);assert.ok(Array.isArray(inventory.sources[2].jobs));
console.log('Public inventory safety checks passed.');
