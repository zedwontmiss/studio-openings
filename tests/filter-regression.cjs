/*
 * Studio Openings — filter/tag regression suite (Node, no dependencies).
 * Run: node tests/filter-regression.cjs
 * Reads the real production browser functions from assets/app.js.
 * The live-feed filter MUST NOT pass Array.filter's (index, array) to
 * eligible(job, savedRoleOverride, savedTagsOverride).
 */
'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'..','assets','app.js'),'utf8');
function between(start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing source function: '+start);
 return src.slice(a,b);
}
assert(src.includes('state.jobs.filter(function(job){return eligible(job);})'),
 'Do not pass eligible directly to Array.filter: callback index/array are not saved metadata');
const compiled=[
 between('  var roleLabels = {','  var state ='),
 between('  var ROLE_TAG={','  function jobKeywords(job,allTags){'),
 between('  function jobKeywords(job,allTags){','  // One explicitly assigned colour'),
 between('  function categoryFor(job) {','  function dateLabel(job)'),
 'function trim(v){return String(v||"").trim();}',
 between('  function usMatch(loc)','  function effectiveSort()')
].join('\n');
const make=new Function('state',compiled+'\nreturn {eligible,categoryFor,jobKeywords};');
const jobs=[
 {id:'art',title:'Art Director',company:'Example Graphic Studio',role:'visual',location:'Eligible: United States',mode:'remote',type:'Full-time',salary:'$140k'},
 {id:'ux',title:'Principal UX Designer',company:'Example Game Company',role:'product',location:'Eligible: United States',mode:'remote',type:'Full-time',salary:'$160k',tags:['Product Design','UX/UI']},
 {id:'prod',title:'Senior Product Designer, Design Systems',company:'Example Product Company',role:'product',location:'Eligible: United States',mode:'remote',type:'Full-time',salary:'$140k'},
 {id:'motion',title:'Motion Designer 3D',company:'Example Motion Studio',role:'motion',location:'New York, United States',mode:'onsite',type:'Contract',salary:''},
 {id:'arch',title:'Project Architect',company:'Example Architecture Studio',role:'architecture',location:'New York, United States',mode:'onsite',type:'Full-time',salary:'$90k',description:'Building design and Revit'},
 {id:'museum',title:'Exhibition Designer',company:'Example Museum',role:'museum',location:'London, United Kingdom',mode:'onsite',type:'Contract',salary:''},
 {id:'tech',title:'Deployment Architect - Messaging & SMS',company:'Example Software',role:'architecture',location:'Remote (Europe)',mode:'remote',type:'Full-time',salary:'',description:'Cloud architecture and systems integration'}
];
const base={selectedRoles:[],keywords:[],keywordMatch:'any',query:'',region:'all',mode:'all',type:'all',hasPay:false};
const cases=[
 ['unfiltered',['art','ux','prod','motion','arch','museum'],{}],
 ['product filter',['ux','prod'],{selectedRoles:['product']}],
 ['visual filter',['art'],{selectedRoles:['visual']}],
 ['architect excludes IT',['arch'],{selectedRoles:['architecture']}],
 ['museum filter',['museum'],{selectedRoles:['museum']}],
 ['motion filter',['motion'],{selectedRoles:['motion']}],
 ['multiple categories',['ux','prod','museum'],{selectedRoles:['product','museum']}],
 ['Product Design tag',['ux','prod'],{keywords:['Product Design']}],
 ['UX/UI tag',['ux'],{keywords:['UX/UI']}],
 ['category plus UX tag',['ux'],{selectedRoles:['product'],keywords:['UX/UI']}],
 ['match all UX tags',['ux'],{keywords:['Product Design','UX/UI'],keywordMatch:'all'}],
 ['art direction dual tag',['art'],{keywords:['Design','Art Direction'],keywordMatch:'all'}],
 ['match any mixed tags',['ux','prod'],{keywords:['Product Design','Graphic Design']}],
 ['art direction searchable',['art'],{keywords:['Art Direction']}],
 ['art director exact title searchable',['art'],{keywords:['Art Director']}],
 ['creative leadership searchable',['art'],{keywords:['Creative']}],
 ['art direction lead searchable',['art'],{keywords:['Lead']}],
 ['graphic design not automatically assigned to Art Director',[],{selectedRoles:['visual'],keywords:['Graphic Design']}],
 ['missing keyword',[],{keywords:['SketchUp']}],
 ['full-time',['art','ux','prod','arch'],{type:'full-time'}],
 ['salary disclosed',['art','ux','prod','arch'],{hasPay:true}],
 ['United States',['art','ux','prod','motion','arch'],{region:'us'}],
 ['title search',['prod'],{query:'design systems'}],
 ['employer search',['ux'],{query:'game company'}]
];
for(const [name,expected,filters] of cases){
 const api=make({...base,...filters});
 assert.deepStrictEqual(jobs.filter(j=>api.eligible(j)).map(j=>j.id),expected,name);
}
const filtered=make({...base,selectedRoles:['product'],keywords:['Product Design']});
const mixed={id:'mixed',title:'Senior Motion & Graphic Designer',role:'visual',company:'Silverback Strategies',location:'United States',mode:'remote'};
for(const role of ['motion','visual'])assert(make({...base,selectedRoles:[role]}).eligible(mixed),'Mixed title must match '+role);
assert(make(base).jobKeywords(mixed).includes('Motion Design'));
assert(!make({...base,selectedRoles:['motion']}).eligible({...mixed,title:'Graphic Designer',description:'We collaborate with motion designers.'}),'Description mentions do not add disciplines');
assert(!make({...base,selectedRoles:['motion']}).eligible({...mixed,title:'Motion Capture Engineer'}),'Motion engineering is not automatically motion design');
assert(make({...base,region:'gb'}).eligible({title:'Web Designer',role:'web',location:'London, United Kingdom'}));
assert(!make({...base,region:'us'}).eligible({title:'Web Designer',role:'web',location:'London, United Kingdom'}));
assert(make({...base,region:'ca'}).eligible({title:'Designer',role:'visual',location:'Toronto',geoCountry:'CA'}));
assert(!make({...base,region:'ca'}).eligible({title:'Designer',role:'visual',location:'Los Angeles, CA',geoCountry:'US'}));
assert(!make({...base,region:'gb'}).eligible({title:'Designer',role:'visual',location:'Europe',locationKind:'eligibility'}));
assert(make({...base,region:'gb'}).eligible({title:'Designer',role:'visual',location:'Worldwide',mode:'remote',locationKind:'eligibility'}));
assert(filtered.eligible(jobs[1],1,jobs),'Numeric callback override must be ignored for an actual Product job');
assert(!filtered.eligible(jobs[0],1,jobs),'Numeric callback override must not pass a Visual job');
assert(filtered.eligible(jobs[1],'product',['Product Design','UX/UI']),'Saved snapshot override must work');
assert(!filtered.eligible(jobs[3],'motion',['Motion Design']),'Saved role must respect Product filter');
console.log('PASS: '+(cases.length+4)+' live/saved filter regressions');

const specialty=make({keywords:[],selectedRoles:[]});
assert.deepStrictEqual(specialty.jobKeywords({role:'fashion',title:'Photographer',tags:['Fashion']}),['Photography']);
assert.deepStrictEqual(specialty.jobKeywords({role:'fashion',title:'Editorial Photo Retoucher',tags:['Photography']}),['Photography','Retouching']);
assert.deepStrictEqual(specialty.jobKeywords({role:'web',title:'Creative Developer',tags:['Web Design']}),['Creative Technology']);
assert.deepStrictEqual(specialty.jobKeywords({role:'web',title:'Web Designer'}),['Web Design']);
