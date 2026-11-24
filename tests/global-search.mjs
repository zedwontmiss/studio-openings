import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');assert.equal((html.match(/id="search"/g)||[]).length,1);assert.ok(html.includes('placeholder="SEARCH HERE"'));assert.ok(html.includes('id="global-discovery"'));assert.ok(read('assets/app.js').includes('SOAPPGlobalSearch.update(state.query)'));assert.ok(read('assets/global-search.css').includes('700 48px/1.15 Helvetica'));const js=read('assets/global-search.js');assert.ok(js.includes("path:'/studio'"));assert.ok(js.includes("path:'/article'"));assert.ok(!js.includes('innerHTML'));console.log('Global search integration checks passed.');

assert.ok(html.includes('type="text" id="search"'));assert.ok(!html.includes('id="global-discovery-status"'));assert.ok(!js.includes('No matching'));assert.ok(!js.includes('Searching studios'));assert.ok(!js.includes('found.slice'));assert.ok(read('assets/app.js').includes('global-no-job-matches'));assert.ok(read('assets/global-search.css').includes('.global-query-active.global-no-job-matches .content-grid'));console.log('Quiet live search checks passed.');
