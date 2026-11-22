import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const staticPages=['index.html','about.html','contact.html','coverage.html','post-a-job.html','privacy.html','terms.html'];
for(const page of staticPages){
  const html=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(html,/rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml"/,page+' must link the modern favicon');
  assert.match(html,/rel="alternate icon" href="\/favicon\.ico" sizes="any"/,page+' must link the legacy favicon');
  assert.match(html,/rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/,page+' must link the iPhone icon');
}

for(const page of ['functions/disciplines/[slug].js','functions/jobs/[id].js','functions/openings/[id].js']){
  const source=readFileSync(new URL('../'+page,import.meta.url),'utf8');
  assert.match(source,/rel="icon" href="\/assets\/favicon\.svg"/,page+' must render the favicon');
  assert.match(source,/rel="alternate icon" href="\/favicon\.ico"/,page+' must render the legacy favicon');
  assert.match(source,/rel="apple-touch-icon" href="\/assets\/apple-touch-icon\.png"/,page+' must render the iPhone icon');
}

const ico=readFileSync(new URL('../favicon.ico',import.meta.url));
const apple=readFileSync(new URL('../assets/apple-touch-icon.png',import.meta.url));
const svg=readFileSync(new URL('../assets/favicon.svg',import.meta.url),'utf8');
assert.match(svg,/>s\/o<\/text>/,'favicon must display the Studio Openings s/o mark');
assert.deepEqual([...ico.subarray(0,4)],[0,0,1,0],'favicon.ico must be a Windows icon');
assert.deepEqual([...apple.subarray(0,8)],[137,80,78,71,13,10,26,10],'apple-touch-icon must be a PNG');
console.log('Favicon links and browser-compatible assets passed.');
