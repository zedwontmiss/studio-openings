import assert from 'node:assert/strict';
import {LOCAL_ARTICLES} from '../lib/local-editorial.js';
import {LOCAL_CITIES} from '../lib/local-cities.js';
import {localPage} from '../lib/local-page.js';
for(const a of LOCAL_ARTICLES){assert.ok(a.cityIds.length);for(const id of a.cityIds)assert.ok(LOCAL_CITIES.some(c=>c.id===id));}
for(const c of LOCAL_CITIES){const html=localPage(c);assert.ok(html.includes('href="/cities"'));for(const a of LOCAL_ARTICLES)assert.equal(html.includes('href="/article/'+a.slug+'"'),a.cityIds.includes(c.id));}
console.log('Local editorial associations checked.');
