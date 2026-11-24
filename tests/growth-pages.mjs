import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet} from '../functions/sitemap.xml.js';
import {onRequest} from '../functions/_middleware.js';
const pages=["/studio","/article","/article/creative-job-search-checklist"];
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const p of pages){const html=read(p.slice(1)+'.html');assert.ok(html.includes('rel="canonical" href="https://s-o.app'+p+'"'));assert.ok(html.includes('href="/studio"'));assert.ok(html.includes('href="/article"'));for(const host of ['s-o.app','development.studio-openings.pages.dev']){const r=await onRequest({request:new Request('https://'+host+p),env:{},next:async()=>new Response(html,{headers:{'content-type':'text/html'}})});assert.equal(r.headers.get('x-robots-tag'),host==='s-o.app'?null:'noindex, nofollow');}}
const sitemap=await onRequestGet({request:new Request('https://s-o.app/sitemap.xml'),env:{}});const xml=await sitemap.text();for(const p of pages){assert.ok(xml.includes('<loc>https://s-o.app'+p+'</loc>'));assert.ok(read('sitemap.xml').includes('<loc>https://s-o.app'+p+'</loc>'));}
assert.ok(!/Koto|Runway|Linear/.test(read('studio.html')));assert.ok(read('index.html').includes('href="/studio">studio</a><a href="/article">article</a>'));console.log('Growth page routes, canonicals, sitemap and isolation passed.');
