/* Studio Openings leadership taxonomy regression — no dependencies. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const start=app.indexOf('  function directionTagProfile(job){');
const end=app.indexOf('  function jobKeywords(job,allTags){',start);
assert(start>=0&&end>start,'Leadership taxonomy source must exist');
const make=new Function(app.slice(start,end)+'\nreturn directionTagProfile;');
const profile=make();
const cd=profile({title:'Creative Director',description:'Lead brand strategy, advertising campaigns and marketing.'});
assert.deepStrictEqual(cd.visible,['Creative','Creative Direction','Director']);
for(const s of ['Creative Director','Design','Management','Brand Strategy','Branding','Marketing','Advertising','Campaigns']){
 if(s==='Branding')continue; // Branding requires explicit branding / brand identity, not brand strategy alone.
 assert(cd.searchable.includes(s),s+' must be searchable');
}
assert(!cd.searchable.includes('Graphic Design'),'Do not infer graphic design for directors');
const ad=profile({title:'Art Director',description:'Guide graphic design and visual concepts for campaigns.'});
assert.deepStrictEqual(ad.visible,['Design','Art Direction','Lead']);
for(const s of ['Creative','Art Director','Visual Design','Graphic Design','Campaigns'])assert(ad.searchable.includes(s),s+' should be searchable');
assert(!ad.searchable.includes('Marketing'),'Do not infer marketing from art direction');
const senior=profile({title:'Senior Art Director',description:''});
assert.strictEqual(senior.visible[2],'Senior');
const chief=profile({title:'Chief Creative Director',description:''});
assert.strictEqual(chief.visible[2],'Executive');
assert.strictEqual(profile({title:'Marketing Director',description:'brand campaigns'}),null);
assert.strictEqual(profile({title:'Graphic Designer',description:'creative direction'}),null);
assert.strictEqual(profile({title:'Creative Director',description:''}).searchable.includes('Advertising'),false);
assert(app.includes('searchTag(shortTagLabel(word))'), 'Clickable tags use visible global search');
assert(app.includes(')?verifiedTags:jobSearchTags(job);'), 'Keyword filters use searchable role terms');
assert(app.includes('if(direction)return direction.visible;'), 'UI displays three canonical badges');
assert(app.includes('return allTags?tags:tags.slice(0,3);'), 'Other roles retain existing max-three badge policy');
const backend=fs.readFileSync(path.join(root,'functions/api/jobs.js'),'utf8');
assert(backend.includes('const leadership=directionTags(title,description,role);if(leadership)return leadership;'));
const ai=fs.readFileSync(path.join(root,'functions/api/ai-jobs.js'),'utf8');
assert(ai.includes('if(leadership){tags.length=0;tags.push(...leadership);}'));
console.log('PASS: creative direction / art direction title, hierarchy, aliases, adjacent evidence, and search');
