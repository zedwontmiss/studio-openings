import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Read as ESM without needing a package.json or local build tools.
const scope=readFileSync('lib/job-scope.js','utf8').replace(/^export /gm,'');
const core=scope+'\n'+readFileSync('lib/source-registry-core.js','utf8').replace(/^import .*;$/gm,'');
const {sourceExcerpt}=await import('data:text/javascript;base64,'+Buffer.from(core).toString('base64'));
const jobs=readFileSync('functions/api/jobs.js','utf8').replace(/^import .*;$/gm,'').replace(/^export /gm,'');
const {plainText,stripHimalayasAttribution}=new Function(jobs+';return {plainText,stripHimalayasAttribution};')();

const longBody='<h2>About the Role</h2><p>'+('Our studio creates excellent design. You will collaborate with our creative team. ').repeat(260)+'</p>';
for(const [label,fn] of [['official ATS',sourceExcerpt],['Himalayas/Jobicy',plainText]]){
  const result=fn(longBody);
  assert.ok(result.length>1800,label+': description was prematurely cut');
  assert.ok(result.length<=14000,label+': exceeded safe payload limit');
  assert.match(result,/[.!?]$/,label+': incomplete final sentence');
  assert.match(result,/Our studio creates excellent design/,label+': lost source content');
}
assert.ok(sourceExcerpt('<p>'+('We need a designer who enjoys collaboration. ').repeat(5)+'</p>').includes('We need a designer'));
assert.equal(plainText('<p>We need a designer.</p>'),'We need a designer.');
assert.equal(stripHimalayasAttribution('Real employer description.\n\nOriginally posted on Himalayas'),'Real employer description.');
assert.equal(stripHimalayasAttribution('Real employer description.\n\nOriginally posted on Himalayas.'),'Real employer description.');
assert.equal(stripHimalayasAttribution('Himalayas experience is useful.\n\nRequirements'),'Himalayas experience is useful.\n\nRequirements');
console.log('All description smoke tests passed.');
