import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {reviewStudio} from '../lib/studio-review.js';
const [candidateFile,reviewFile,outputFile]=process.argv.slice(2);
assert.ok(candidateFile&&reviewFile&&outputFile,'Usage: node operations/review-studio-candidates.mjs candidates.json reviews.json staging.json');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const current=read(new URL('../studio-registry/published.json',import.meta.url));
const exported=read(candidateFile),reviews=read(reviewFile);
assert.ok(Array.isArray(exported.candidates)&&exported.truncated===false,'Complete export required');
assert.ok(Array.isArray(reviews),'Expected review array');
const today=new Date().toISOString().slice(0,10),accepted=[],rejected=[],seen=new Set();
for(const review of reviews){
 const key=review.careerURL;
 if(seen.has(key)){rejected.push({careerURL:key,errors:['Duplicate review']});continue;}seen.add(key);
 const matches=exported.candidates.filter(c=>c.careerURL===key);
 if(matches.length!==1){rejected.push({careerURL:key,errors:['Candidate absent or ambiguous']});continue;}
 const result=reviewStudio(matches[0],review,current.studios.concat(accepted),today);
 if(result.ok)accepted.push(result.record);else rejected.push({careerURL:key,errors:result.errors});
}
writeFileSync(outputFile,JSON.stringify({status:'staged-not-published',reviewedOn:today,accepted,rejected},null,2)+'\n',{flag:'wx'});
console.log(accepted.length+' staged; '+rejected.length+' rejected. Published registry unchanged.');
if(rejected.length)process.exitCode=1;
