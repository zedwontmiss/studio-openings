import assert from 'node:assert/strict';
import {LOCAL_CITIES} from '../lib/local-cities.js';
import {findLocal,localPage} from '../lib/local-page.js';
const city=findLocal('melbourne');assert.ok(city);assert.ok(localPage(city).includes('>studio openings</a><span class="so-section"> / melbourne</span>'));assert.ok(localPage(city).includes('/studio/framestore'));assert.equal(findLocal('operator'),null);assert.equal(new Set(LOCAL_CITIES.map(c=>c.slug)).size,LOCAL_CITIES.length);assert.ok(localPage(city).includes('noindex, nofollow'));
console.log('Local pilot checks passed.');
