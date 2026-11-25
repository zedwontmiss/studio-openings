import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const staticPages=['index.html','about.html','contact.html','coverage.html','post-a-job.html','privacy.html','terms.html'];
for(const page of staticPages){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(html,/rel="icon" href="\/assets\/favicon\.svg(?:\?v=\d+)?" type="image\/svg\+xml"/,page+' must link the modern favicon');
  assert.match(html,/rel="alternate icon" href="\/favicon\.ico(?:\?v=\d+)?" sizes="any"/,page+' must link the legacy favicon');
  assert.match(html,/rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/,page+' must link the iPhone icon');
}

for(const page of ['functions/disciplines/[slug].js','functions/jobs/[id].js','functions/openings/[id].js']){
  const source=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(source,/rel="icon" href="\/assets\/favicon\.svg(?:\?v=\d+)?"/,page+' must render the favicon');
  assert.match(source,/rel="alternate icon" href="\/favicon\.ico(?:\?v=\d+)?"/,page+' must render the legacy favicon');
  assert.match(source,/rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/,page+' must render the iPhone icon');
}

const ico=readFileSync(new URL('../favicon.ico',import.meta.url));
const apple=readFileSync(new URL('../assets/apple-touch-icon.png',import.meta.url));
const svg=readFileSync(new URL('../assets/favicon.svg',import.meta.url),'utf8');
assert.match(svg,/<title>S\/O<\/title>/,'favicon must identify the Studio Openings mark');
assert.match(svg,/<path /,'favicon must use fixed outlines');
assert.ok(!svg.includes('<text'),'favicon must not depend on installed fonts');
assert.equal(ico.readUInt16LE(4),2,'favicon must include two sizes');
assert.deepEqual([ico[6],ico[22]],[16,32]);
assert.deepEqual([...ico.subarray(0,4)],[0,0,1,0],'favicon.ico must be a Windows icon');
assert.deepEqual([...apple.subarray(0,8)],[137,80,78,71,13,10,26,10],'apple-touch-icon must be a PNG');
console.log('Favicon links and browser-compatible assets passed.');

assert.ok(!svg.includes('<rect'),'favicon must have transparent background and no border');
