import assert from 'node:assert/strict';
import {reviewHost,deferredPath,hiddenReleasePath} from '../lib/release-scope.js';
for(const p of ['/scene','/scene.html','/scene/','/scene/index.html','/cities','/cities.html','/scene-guidelines','/scene-contributors','/london','/new-york.html','/s%63ene']){
 assert.equal(hiddenReleasePath('s-o.app',p),true,p);
 assert.equal(hiddenReleasePath('development.studio-openings.pages.dev',p),['/scene-guidelines','/scene-contributors'].includes(p),p);
 assert.equal(hiddenReleasePath('studio-openings.pages.dev',p),true,p);
}
for(const p of ['/','/studio','/article','/studio/framestore','/advertise','/contact','/about','/coverage'])assert.equal(deferredPath(p),false,p);
assert.equal(reviewHost('development.studio-openings.pages.dev.evil.example'),false);
console.log('Release scope checks passed.');

import {onRequest} from '../functions/_middleware.js';
for(const p of ['/scene-guidelines','/scene-contributors','/mumbai']){const r=await onRequest({request:new Request('https://development.studio-openings.pages.dev'+p),env:{},next:()=>{throw Error('Hidden route reached downstream');}});assert.equal(r.status,404);assert.match(r.headers.get('x-robots-tag'),/noindex/);}

import {studioExternalLink} from '../lib/public-routes.js';
const origin='https://development.studio-openings.pages.dev/studio/shape-architecture';
for(const link of ['https://example.com/careers','//example.com','https://www.google.com/maps'])assert.equal(studioExternalLink(link,origin),true);
for(const link of ['/studio','/article','#top','https://s-o.app/studio','https://development.studio-openings.pages.dev/contact','mailto:hello@example.com'])assert.equal(studioExternalLink(link,origin),false);
