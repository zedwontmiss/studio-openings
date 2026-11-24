import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
const file=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(file(p),'utf8');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function renderRows(records){
 const ids=new Set(),slugs=new Set();
 for(const s of records){
  assert.match(s.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.match(s.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!ids.has(s.id)&&!slugs.has(s.slug));ids.add(s.id);slugs.add(s.slug);
  assert.ok(typeof s.name==='string'&&s.name.trim());assert.ok(typeof s.summary==='string');
  assert.ok(Array.isArray(s.disciplines)&&s.disciplines.length&&s.disciplines.every(d=>DISCIPLINE_SLUGS.includes(d)));
  assert.ok(Array.isArray(s.aliases)&&s.aliases.every(a=>typeof a==='string'));
  assert.ok(Array.isArray(s.offices));for(const o of s.offices){assert.ok(o.country&&o.city&&o.sourceUrl&&o.reviewedOn);assert.equal(new URL(o.sourceUrl).protocol,'https:');}
  assert.equal(new URL(s.source.url).protocol,'https:');assert.match(s.source.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof s.employerVerified,'boolean');
 }
 return records.slice().sort((a,b)=>a.name.localeCompare(b.name,'en')).map(s=>'<li data-discipline="'+esc(s.disciplines.join(' '))+'"><a class="studio-profile-link" href="/studio/'+s.slug+'"><h2>'+esc(s.name)+'</h2><p hidden>'+esc([s.summary,...s.aliases,...s.offices.map(o=>o.city+' '+o.region+' '+o.country)].join(' '))+'</p></a></li>').join('');
}
const data=JSON.parse(read('studio-registry/published.json'));
const html=read('studio.html'),pattern=/(<ul class="growth-list" id="studio-list">)[\s\S]*?(<\/ul>)/;
assert.ok(pattern.test(html));
const next=html.replace(pattern,(_,a,b)=>a+renderRows(data.studios)+b);
if(process.argv.includes('--check'))assert.equal(html,next,'Studio index out of sync');else writeFileSync(file('studio.html'),next);
console.log('Studio registry index verified.');
