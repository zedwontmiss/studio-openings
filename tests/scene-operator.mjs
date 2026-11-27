import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('assets/operator.js'),html=read('operator.html'),api=read('functions/api/scene-moderation.js');
assert.ok(html.includes('data-tab="scene"'));assert.ok(html.includes('id="tab-scene"'));assert.match(js,/function lock\(msg\)\{token='';[^}]*clearScene\(\);/);assert.ok(js.includes("'/api/scene-moderation'"));assert.ok(js.includes('sceneCurrent(session,revision)'));assert.ok(api.includes('operatorAuthorized'));assert.ok(api.includes('sameOrigin'));assert.ok(api.includes('topic_title'));assert.ok(api.includes('reply_status'));console.log('Scene operator integration checks passed.');

assert.ok(html.includes('data-tab="scene" type="button" hidden'));assert.ok(js.includes("if(tab==='scene')tab='requests'"));
