import assert from 'node:assert/strict';
import {findLocal,localPage} from '../lib/local-page.js';
const html=localPage(findLocal('london'));
assert.ok(html.indexOf('id="scene"')<html.indexOf('id="jobs"'));
assert.ok(html.indexOf('id="article"')<html.indexOf('id="studio"'));
const topic={id:'12345678-1234-1234-1234-123456789abc',title:'<script>alert(1)</script>',created_at:'2026-11-25',reply_count:2};
const list=localPage(findLocal('london'),{enabled:true,topics:[topic]});
assert.ok(list.includes('&lt;script&gt;'));assert.ok(!list.includes('<script>alert(1)</script>'));
assert.ok(list.includes('2 replies'));console.log('Scene layout checks passed.');
