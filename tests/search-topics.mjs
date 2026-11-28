import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import topics from '../assets/search-topics.js';
import {renderTopicPills,studioTopicIds} from '../operations/search-topic-pills.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const raggedEdge=JSON.parse(read('studio-registry/published.json')).studios.find(studio=>studio.slug==='ragged-edge');
const guide=JSON.parse(read('editorial/published.json')).articles.find(article=>article.slug==='london-creative-studios');
const studioIds=studioTopicIds(raggedEdge);
assert.deepEqual(studioIds,['brand-design','london']);
assert.deepEqual(guide.searchTopics,['london','brand-design','architecture']);
assert.equal(topics.fromQuery('  BRAND   DESIGN ').id,'brand-design');
assert.equal(topics.fromQuery('Brand Design London'),undefined);
assert.equal(topics.matchesDiscipline(topics.fromQuery('Brand Design'),['visual'],'Branding agency'),true);
assert.equal(topics.matchesDiscipline(topics.fromQuery('Brand Design'),['visual'],'Graphic designer'),false);
assert.equal(studioTopicIds({...raggedEdge,offices:[{...raggedEdge.offices[0],kind:'gallery'}]}).includes('london'),false);
assert.throws(()=>renderTopicPills(['unknown']),/Invalid or duplicate/);

const search=JSON.parse(read('assets/studio-search.json'));
assert.deepEqual(search.find(row=>row.path==='/studio/ragged-edge').topicIds,studioIds);
assert.ok(read('studio.html').includes('data-topics="brand-design london"><a class="studio-profile-link" href="/studio/ragged-edge"'));
assert.ok(read('article.html').includes('data-topics="london brand-design architecture"><h2><a href="/article/london-creative-studios"'));
assert.ok(read('studio/ragged-edge.html').includes(renderTopicPills(studioIds)));
assert.ok(read('article/london-creative-studios.html').includes(renderTopicPills(guide.searchTopics)));
assert.ok(!read('studio/pentagram.html').includes('class="so-topic-pills"'));
for(const path of ['about.html','studio/ragged-edge.html']){
 assert.ok(read(path).includes('href="/contact#studio-correction"'));
}
assert.match(read('contact.html'),/id="studio-correction"[\s\S]*?href="mailto:hello@s-o\.app\?subject=Studio%20profile%20correction"/);
console.log('Shared search topics and studio correction paths passed.');
