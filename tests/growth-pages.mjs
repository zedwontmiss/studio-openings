import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet} from '../functions/sitemap.xml.js';
import {onRequest} from '../functions/_middleware.js';
const pages=["/studio","/article",...ARTICLE_PATHS,...STUDIO_PATHS];
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const expectedOrigin='https://s-o.app';
for(const p of pages){const html=read(p.slice(1)+'.html');const canonical=html.match(/<link rel="canonical" href="([^"]+)"/);assert.ok(canonical);const url=new URL(canonical[1]);assert.equal(url.origin,expectedOrigin);assert.equal(url.pathname,p);for(const host of ['s-o.app','development.studio-openings.pages.dev']){const r=await onRequest({request:new Request('https://'+host+p),env:{},next:async()=>new Response(html,{headers:{'content-type':'text/html'}})});assert.equal(r.headers.get('x-robots-tag'),host==='s-o.app'?null:'noindex, nofollow');}}
const sitemap=await onRequestGet({request:new Request('https://s-o.app/sitemap.xml'),env:{}});for(const xml of [await sitemap.text(),read('sitemap.xml')]){const locations=new Set(Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g),m=>m[1]));for(const p of pages)assert.ok(locations.has(expectedOrigin+p));for(const location of locations)assert.equal(new URL(location).origin,expectedOrigin);}
const directory=read('studio.html');assert.ok(!/Koto|Runway|Linear/.test(directory));const links=new Set(Array.from(directory.matchAll(/href="([^"]+)"/g),m=>m[1]));for(const p of pages.filter(p=>p.startsWith('/studio/')))assert.ok(links.has(p));
assert.ok(read('index.html').includes('class="so-primary"'));console.log('Growth page routes, canonicals, sitemap and isolation passed.');

const studioRows=Array.from(directory.matchAll(/<li data-discipline="[^"]+"[^>]*>([\s\S]*?)<\/li>/g),m=>m[1]);assert.equal(studioRows.length,STUDIO_PATHS.length);for(const row of studioRows){const targets=Array.from(row.matchAll(/href="([^"]+)"/g),m=>m[1]);assert.equal(targets.length,1);const target=new URL(targets[0],expectedOrigin);assert.equal(target.origin,expectedOrigin);assert.ok(pages.includes(target.pathname));assert.ok(target.pathname.startsWith('/studio/'));}

const editorialIndex=read('article.html');const articleLinks=new Set(Array.from(editorialIndex.matchAll(/href="([^"]+)"/g),m=>m[1]));for(const p of pages.filter(p=>p.startsWith('/article/'))){assert.ok(articleLinks.has(p));const html=read(p.slice(1)+'.html');const json=html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);assert.ok(json);const schema=JSON.parse(json[1]);assert.equal(schema['@type'],'Article');assert.equal(schema.mainEntityOfPage,expectedOrigin+p);assert.ok(html.includes('class="editorial-prose"'));}assert.equal((read('article/feed.xml').match(/<item>/g)||[]).length,Math.min(50,ARTICLE_PATHS.length));

assert.ok(!directory.includes("View profile"));assert.ok(!directory.includes("studio-profile-action"));
const contact=read("contact.html");assert.equal((contact.match(/mailto:/g)||[]).length,1);assert.ok(contact.includes('href="mailto:hello@s-o.app"'));assert.ok(!contact.includes(">Email</a>"));

for(const key of ["architecture","interior","industrial","product","visual","motion","fashion","web","museum","culture"])assert.ok(directory.includes('<option value="'+key+'">'));

for(const p of ["studio.html","article.html"]){const h=read(p);assert.equal((h.match(/id="search"/g)||[]).length,1);assert.ok(h.includes("data-index-kind="));assert.ok(!h.includes("id=\"job-list\""));}
