import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {publicHeader,HEADER_CSS} from '../lib/public-header.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=[['index.html','jobs'],['about.html','about'],['contact.html','contact'],['coverage.html','coverage'],['post-a-job.html','post'],['privacy.html',''],['terms.html',''],['studio.html','studio'],['article.html','article'],['editorial/index.template.html','article'],['editorial/reader.template.html','article']];
for(const folder of ['studio','article'])for(const n of readdirSync(new URL('../'+folder+'/',import.meta.url)))if(n.endsWith('.html'))pages.push([folder+'/'+n,folder]);
for(const [p,active] of pages){const html=read(p);assert.ok(html.includes(publicHeader(active)),p+' shared header');assert.ok(html.includes(HEADER_CSS),p+' shared CSS');assert.equal((html.match(/class="so-primary"/g)||[]).length,1);assert.ok(!/Georgia,serif/.test(html));}
for(const p of ['functions/disciplines/[slug].js','functions/jobs/[id].js','functions/openings/[id].js']){assert.ok(read(p).includes("publicHeader('jobs')"));assert.ok(read(p).includes('HEADER_CSS'));}
for(const p of ['assets/styles.css','assets/editorial.css','assets/growth.css','assets/public-design.css'])assert.ok(!/Georgia,serif|Arial,Helvetica,sans-serif/.test(read(p)),p+' Helvetica first');
assert.ok(read('index.html').includes('id="search"'),'Existing functional search retained');
console.log('Unified public navigation and font tests passed.');

assert.ok(publicHeader("jobs").includes('class="so-brand" href="/">studio openings</a>'));assert.ok(publicHeader("about").endsWith('<a class="so-about-mark" href="/about.html" aria-label="About Studio Openings" aria-current="page">S/O</a></div></header>'));
