import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import topicSearch from '../assets/search-topics.js';
import locations from '../assets/studio-topic-data.js';
import {articleTopicIds,renderTopicPills,studioTopicIds} from '../operations/search-topic-pills.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pillStylesheet='href="/assets/topic-pills.css?v=1"';
assert.match(read('assets/topic-pills.css'),/\.so-topic-pills a\s*\{[^}]*border:\s*1px solid/);
const {studios}=JSON.parse(read('studio-registry/published.json'));
const raggedEdge=studios.find(studio=>studio.slug==='ragged-edge');
const twoByFour=studios.find(studio=>studio.slug==='2x4');
const topics=topicSearch.create(locations);
const byId=new Map(topics.topics.map(topic=>[topic.id,topic]));
const articles=JSON.parse(read('editorial/published.json')).articles;
const guide=articles.find(article=>article.slug==='london-creative-studios');
const newYorkGuide=articles.find(article=>article.slug==='new-york-creative-studios');
const studioIds=studioTopicIds(raggedEdge);
assert.deepEqual(studioIds,['london','country-gb','brand-design','graphic-design']);
assert.deepEqual(studioTopicIds(twoByFour).map(id=>byId.get(id).label),['New York','United States','Interior Design','Graphic Design','Web Design']);
assert.deepEqual(guide.searchTopics,['london','brand-design','architecture']);
assert.equal(topics.fromQuery('  BRAND   DESIGN ').id,'brand-design');
assert.equal(topics.fromQuery('Brand Design London'),undefined);
const brandText=topics.labels(['brand-design']);
for(const query of ['b','BR','BR-','bra','brand','  BrAnD   D  ','brand des','brand design'])assert.equal(topics.matchesText(brandText,query),true,query);
assert.equal(topics.matchesText(brandText,'brand developer'),false);
assert.equal(topics.matchesText('São Paulo, Brazil','sao br'),true);
for(const topic of topics.topics)assert.equal(topics.fromQuery(topic.label),topic,'Every pill must reach its exact topic');
assert.equal(topics.matchesDiscipline(topics.fromQuery('Brand Design'),['visual'],'Branding agency'),true);
assert.equal(topics.matchesDiscipline(topics.fromQuery('Brand Design'),['visual'],'Graphic designer'),false);
assert.equal(studioTopicIds({...raggedEdge,offices:[{...raggedEdge.offices[0],kind:'gallery'}]}).includes('london'),false);
assert.throws(()=>renderTopicPills(['unknown']),/Invalid or duplicate/);

const search=JSON.parse(read('assets/studio-search.json'));
assert.deepEqual(search.find(row=>row.path==='/studio/ragged-edge').topicIds,studioIds);
assert.ok(read('studio.html').includes('data-topics="london country-gb brand-design graphic-design"><a class="studio-profile-link" href="/studio/ragged-edge"'));
assert.deepEqual(articleTopicIds(guide),['london','country-gb','brand-design','architecture']);
assert.deepEqual(articleTopicIds(newYorkGuide).map(id=>byId.get(id).label),['New York','United States','Brand Design','Architecture','Museum']);
assert.deepEqual(articleTopicIds({...newYorkGuide,searchTopics:undefined}),['city-us--new-york--new-york','country-us']);
for(const article of articles.filter(article=>article.status==='published')){
 const ids=articleTopicIds(article);
 assert.ok(ids.length,article.slug+' must have linked topics');
 const pills=renderTopicPills(ids);
 const html=read('article/'+article.slug+'.html');
 assert.ok(html.includes(pillStylesheet),article.slug);
 assert.ok(html.includes(pills),article.slug);
 if(ids.length>1)assert.ok(pills.includes('</a> <a '),article.slug);
 assert.ok(read('article.html').includes('data-topics="'+ids.join(' ')+'"><h2><a href="/article/'+article.slug+'"'),article.slug);
}
assert.ok(read('studio/ragged-edge.html').includes(renderTopicPills(studioIds.filter(id=>id!=='graphic-design'))));
for(const studio of studios){
 const html=read('studio/'+studio.slug+'.html');
 const ids=studioTopicIds(studio);
 const offices=studio.offices.filter(office=>office.kind==='office');
 const path='/studio/'+studio.slug;
 assert.deepEqual(search.find(row=>row.path===path).topicIds,ids,path);
 assert.ok(html.includes('class="so-topic-pills"'),path);
 assert.ok(html.includes(pillStylesheet),path);
 const distinctCityIds=offices.filter(office=>office.city!==byId.get('country-'+office.country.toLowerCase()).label).map(office=>office.cityId);
 assert.equal(ids.filter(id=>byId.get(id).cityId).length,new Set(distinctCityIds).size,path);
 assert.equal(ids.filter(id=>byId.get(id).country&&!byId.get(id).cityId).length,new Set(offices.map(office=>office.country)).size,path);
}
for(const path of ['about.html',...studios.map(studio=>'studio/'+studio.slug+'.html')]){
 assert.ok(read(path).includes('href="/contact#studio-correction"'));
}
assert.match(read('contact.html'),/id="studio-correction"[\s\S]*?href="mailto:hello@s-o\.app\?subject=Studio%20profile%20correction"/);
console.log('Shared search topics and studio correction paths passed.');
