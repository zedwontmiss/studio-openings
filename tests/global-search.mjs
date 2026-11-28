import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');assert.equal((html.match(/id="search"/g)||[]).length,1);assert.ok(html.includes('placeholder="search here"'));assert.ok(html.includes('id="global-discovery"'));assert.ok(read('assets/app.js').includes("SOAPPGlobalSearch.update(state.onlySaved?\x27\x27:state.query,list.length,state.feedStatus)"));assert.ok(read('assets/global-search.css').includes('700 48px/1.15 Helvetica'));const js=read('assets/global-search.js');assert.ok(js.includes("path:'/studio'"));assert.ok(js.includes("path:'/article'"));assert.ok(!js.includes('innerHTML'));console.log('Global search integration checks passed.');

assert.ok(html.includes('type="text" id="search"'));assert.ok(!html.includes('id="global-discovery-status"'));assert.ok(!js.includes('No matching'));assert.ok(!js.includes('Searching studios'));assert.ok(!js.includes('found.slice'));assert.ok(!read('assets/app.js').includes('global-no-job-matches'));assert.ok(!read('assets/global-search.css').includes('.global-no-job-matches'));console.log('Quiet live search checks passed.');

assert.ok(!js.includes('a.appendChild(small)'));for(const selector of ['.sidebar','.results-toolbar','.job-open-details','.job-open-company','.job-keywords','.job-age-group'])assert.ok(!read('assets/global-search.css').split('}').some(rule=>rule.includes('.global-query-active')&&rule.includes(selector)&&/display\s*:\s*none/.test(rule)),'Search must preserve '+selector);assert.ok(html.indexOf('id="global-discovery"')<html.indexOf('class="content-grid"'));assert.ok(read('assets/public-design.css').includes('.so-sponsored-title'));console.log('Title-only search checks passed.');

assert.ok(js.includes('/assets/studio-search.json'));assert.ok(js.includes('locationMatches'));

for(const p of ['studio.html','article.html','editorial/index.template.html']){const s=read(p);assert.ok(!s.includes('id="job-list"'));assert.ok(!s.includes('assets/app.js'));assert.ok(!s.includes('id="global-discovery"'));}assert.ok(js.includes('if(!kind)sources.forEach'));assert.ok(!js.includes('secondaryAllowed'));assert.ok(!read('assets/app.js').includes('SOAPPGlobalSearch.update(state.query,false)'));

const css=read('assets/global-search.css');assert.ok(css.includes('input#search:focus::placeholder{color:transparent;opacity:0}'));assert.ok(css.includes('width:2px;height:46px'));assert.ok(js.includes('document.activeElement===input&&!input.value&&!composing'));assert.ok(js.includes("'compositionstart'"));assert.ok(!js.includes('autofocus'),'Resting placeholder must remain visible until intentional focus');assert.equal((js.match(/input\.focus\(\)/g)||[]).length,1);assert.match(js,/button\.addEventListener\('click',function\(\)\{\s+input\.focus/);

assert.ok(js.includes("jobsStatus!=='loading'&&!pendingSources"));assert.ok(js.includes('No results found.'));assert.ok(js.includes('Clear search'));assert.ok(js.includes('catalog.suggest(last)'));
