import assert from 'node:assert/strict';
import {reviewHost,deferredPath,hiddenReleasePath} from '../lib/release-scope.js';
for(const p of ['/scene','/scene.html','/scene/','/scene/index.html','/cities','/cities.html','/scene-guidelines','/scene-contributors','/london','/new-york.html','/s%63ene']){
 assert.equal(hiddenReleasePath('s-o.app',p),true,p);
 assert.equal(hiddenReleasePath('development.studio-openings.pages.dev',p),false,p);
 assert.equal(hiddenReleasePath('studio-openings.pages.dev',p),true,p);
}
for(const p of ['/','/studio','/article','/studio/framestore','/advertise','/contact','/about','/coverage'])assert.equal(deferredPath(p),false,p);
assert.equal(reviewHost('development.studio-openings.pages.dev.evil.example'),false);
console.log('Release scope checks passed.');
