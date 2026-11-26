import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {STUDIO_LOCATIONS,locationStudios} from '../lib/studio-locations.js';import {onRequestGet} from '../functions/sitemap.xml.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),studios=JSON.parse(read('studio-registry/published.json')).studios;
execFileSync(process.execPath,[new URL('../operations/build-studio-locations.mjs',import.meta.url).pathname,'--check']);
const xml=await (await onRequestGet({env:{}})).text();
for(const l of STUDIO_LOCATIONS){assert.ok(locationStudios(studios,l).length>=5);assert.ok(xml.includes('https://s-o.app'+l.path));assert.ok(read('studio.html').includes('href="/studio?q='+encodeURIComponent(l.city)+'#jobs"'));assert.ok(STUDIO_LOCATIONS.filter(x=>x.slug!==l.slug).some(x=>read('studio/location/'+x.slug+'.html').includes('href="'+l.path+'"')));}
assert.ok(locationStudios(studios,STUDIO_LOCATIONS.find(x=>x.slug==='new-york')).some(s=>s.offices.some(o=>o.city==='Brooklyn')));
console.log('Studio location pages and sitemap passed.');

assert.ok(!read('studio.html').includes('class="studio-location-guide"'));assert.ok(!read('studio.html').includes('Directory ↗'));
