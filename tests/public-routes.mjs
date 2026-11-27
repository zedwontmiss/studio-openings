import assert from 'node:assert/strict';
import {canonicalAlias,publicLink} from '../lib/public-routes.js';
const paths=new Set(['/about','/studio/example','/']);
assert.equal(canonicalAlias('/about.html',paths),'/about');
assert.equal(canonicalAlias('/studio/example.html',paths),'/studio/example');
assert.equal(canonicalAlias('/operator.html',paths),'');
assert.equal(canonicalAlias('/index.html',paths),'/');
assert.equal(publicLink('/contact.html?x=1#top'),'/contact?x=1#top');
assert.equal(publicLink('https://example.org/contact.html'),'https://example.org/contact.html');
console.log('Public route alias checks passed.');

assert.equal(canonicalAlias('/cities',new Set()),'/scene');assert.equal(canonicalAlias('/cities.html',new Set()),'/scene');
