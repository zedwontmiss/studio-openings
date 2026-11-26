import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {STUDIO_LOCATION_PATHS} from '../lib/studio-locations.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {onRequestGet as sitemap} from '../functions/sitemap.xml.js';
import {onRequest as middleware} from '../functions/_middleware.js';
import {hiddenReleasePath} from '../lib/release-scope.js';
const origin='https://s-o.app',preview='https://development.studio-openings.pages.dev';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const locations=xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const staticUrls=locations(read('sitemap.xml')),dynamicUrls=locations(await (await sitemap({env:{}})).text());
const expected=['/','/privacy','/coverage','/post-a-job','/advertise','/about','/contact','/terms','/studio','/article',...STUDIO_PATHS,...STUDIO_LOCATION_PATHS,...ARTICLE_PATHS,...DISCIPLINE_SLUGS.map(s=>'/disciplines/'+s)];
for(const urls of [staticUrls,dynamicUrls]){
 assert.equal(urls.length,new Set(urls).size,'Duplicate sitemap URL');
 for(const p of expected)assert.ok(urls.includes(origin+p),'Missing sitemap entry '+p);
 for(const url of urls){assert.equal(new URL(url).origin,origin);assert.equal(hiddenReleasePath('s-o.app',new URL(url).pathname),false);}
}
const invoke=(host,path,status=200)=>middleware({request:new Request(host+path,{method:'HEAD'}),env:{},next:async()=>new Response(null,{status})});
for(const p of expected){const prod=await invoke(origin,p);assert.equal(prod.headers.get('x-robots-tag'),null,p);assert.equal(prod.headers.get('link'),'<'+origin+p+'>; rel="canonical"');assert.match((await invoke(preview,p)).headers.get('x-robots-tag'),/noindex/);assert.match((await invoke(origin,p,404)).headers.get('x-robots-tag'),/noindex/);}
for(const p of ['/social-carousel','/social-carousel.html','/social-carousel/index.html','/social%2Dcarousel','/studio-index-workshop','/studio%2Dindex-workshop','/signal','/s%69gnal','/weekly','/scene','/london']){assert.equal((await invoke(origin,p)).status,404,p);}
for(const p of ['/operator','/api/studio-index','/api/signal-draft'])assert.match((await invoke(origin,p)).headers.get('x-robots-tag'),/noindex/);
for(const p of [...STUDIO_PATHS,...STUDIO_LOCATION_PATHS,...ARTICLE_PATHS]){const f=p.slice(1)+'.html';assert.ok(existsSync(new URL('../'+f,import.meta.url)),f);const html=read(f);assert.ok(html.includes('href="'+origin+p+'"'),f+' canonical');assert.ok(!/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),f+' noindex');}
console.log('Launch audit: '+expected.length+' canonical routes; sitemap, headers, generated profiles and preview exclusions checked.');
