import assert from 'node:assert/strict';import vm from 'node:vm';import topicSearch from '../assets/search-topics.js';import locations from '../assets/studio-topic-data.js';import {readFileSync} from 'node:fs';const js=readFileSync(new URL('../assets/global-search.js',import.meta.url),'utf8');const start=js.indexOf('function norm('),end=js.indexOf('function parse(html,s)');assert.ok(start>=0&&end>start);const ctx=vm.createContext({root:{SOAPPSearchTopics:topicSearch.create(locations)}});vm.runInContext(js.slice(start,end),ctx);const rows=Array.from({length:10},(_,i)=>({kind:'Studios',title:'Studio '+i,text:'architecture design',path:'/studio/'+i}));rows.push({kind:'Studios',title:'Architecture Studio',text:'architecture design',path:'/studio/exact'},{kind:'Studios',title:'Unrelated',text:'fashion',path:'/studio/other',demo:true});const sponsored={'/studio/9':true};const result=ctx.previewMatches(rows,'Studios','ARCHITECT',sponsored);assert.equal(result.length,5);assert.equal(result[0].path,'/studio/9');assert.equal(result[1].path,'/studio/exact');assert.ok(!result.some(r=>r.path==='/studio/other'));const articles=Array.from({length:8},(_,i)=>({kind:'Articles',title:'Architecture '+i,text:'architecture',path:'/article/'+i,demo:i===7}));const ar=ctx.previewMatches(rows.concat(articles),'Articles','architecture',{});assert.equal(ar.length,5);assert.equal(ar[0].path,'/article/7');assert.equal(ctx.previewMatches(rows,'Studios','',{}).length,0);assert.equal(ctx.previewMatches(rows,'Studios','nonexistent',{}).length,0);console.log('Global search preview limits and priority passed.');
const searchable=[
 {kind:'Studios',title:'Buck',text:'Buck',path:'/studio/buck'},
 {kind:'Studios',title:'Studio North',text:'Studio North Brazil',path:'/studio/studio-north'},
 {kind:'Studios',title:'Ragged Edge',text:'Ragged Edge independent agency',topicIds:['brand-design'],path:'/studio/ragged-edge'},
 {kind:'Articles',title:'London guide',text:'Independent London studios',topicIds:['brand-design'],path:'/article/london-guide'}
];
for(const [query,expected] of [['b',3],['br',2],['BR-',2],['bra',2],['brand',1],['brand des',1],['brand design',1]]){
 const studios=ctx.previewMatches(searchable,'Studios',query,{});
 const articles=ctx.previewMatches(searchable,'Articles',query,{});
 assert.equal(studios.length,expected,query);
 assert.ok(studios.some(row=>row.path==='/studio/ragged-edge'),query);
 assert.equal(articles.length,1,query);
}
assert.equal(ctx.previewMatches(searchable,'Articles','brand developer',{}).length,0);
