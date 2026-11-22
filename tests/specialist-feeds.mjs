import assert from 'node:assert/strict';
import {normalize,SOURCES} from '../functions/api/ai-jobs.js';
import {classifyCreative} from '../lib/source-registry-core.js';
const base={uid:'fixture-12345',description:'The team works together on creative production for the studio. '.repeat(5)};
const fashion=SOURCES.find(s=>s.board_token==='fashionnova'),web=SOURCES.find(s=>s.board_token==='dept');
function job(source,title,location){
  const url='https://job-boards.greenhouse.io/'+source.board_token+'/jobs/12345';
  return normalize({...base,title,url,location},source,Date.now());
}
for(const [source,title,location,role,tag] of [
  [fashion,'Photographer','Beverly Hills, California','fashion','Photography'],
  [fashion,'Editorial Photo Retoucher','Beverly Hills, California','fashion','Photography'],
  [fashion,'Apparel Designer','Beverly Hills, CA','fashion','Fashion'],
  [web,'Creative Developer - 6 months FTC','Toronto, Ontario, Canada','web','Creative Technology'],
  [web,'Brand Designer, Web','New York, NY','web','Web Design'],
]){
  const j=job(source,title,location);
  assert.equal(j.role,role);assert.ok(j.tags.includes(tag));assert.equal(j.location,location);
  assert.equal(j.posted,'');assert.ok(j.url.includes(source.board_token));
}
assert.equal(job(fashion,'Retail Sales Associate','Beverly Hills, CA'),null);
assert.equal(job(web,'Creative Developer','Remote'),null);
assert.equal(job(fashion,'Web Designer','Beverly Hills, CA'),null);
assert.equal(classifyCreative('Software Engineer','I enjoy photography and creative technology.'),'');
assert.equal(classifyCreative('Graphic Designer','Build campaigns for fashion clients.'),'visual');
console.log('Specialist feed disciplines, tags, coverage and exclusions passed.');
