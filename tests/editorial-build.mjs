import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compile,build,authorAvatar} from '../operations/build-editorial.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
build(true);
const source=JSON.parse(read('editorial/published.json')),index=read('editorial/index.template.html'),reader=read('editorial/reader.template.html');
const sample={...source.articles[0],slug:'fixture-sample',title:'Fixture <script>alert(1)</script>',blocks:[{type:'paragraph',text:'<img src=x onerror=alert(1)>'}],related:[]};
const output=compile({articles:[sample,{slug:'not-public',status:'unpublished'}]},index,reader);
assert.ok(output.has('article/fixture-sample.html'));assert.ok(!output.has('article/not-public.html'));assert.equal(output.get('article/fixture-sample.html').includes('<img src=x onerror=alert(1)>'),false);
assert.throws(()=>compile({articles:[{...sample,slug:'../escape'}]},index,reader));
assert.throws(()=>compile({articles:[{...sample,related:[{label:'bad',path:'//evil.example'}]}]},index,reader));
assert.throws(()=>compile({articles:[{slug:'private-draft',status:'unpublished',text:'private'}]},index,reader));
console.log('Editorial compiler, stale outputs, publication and escaping tests passed.');

assert.equal(authorAvatar('ZWM').initials,'ZM');assert.deepEqual(authorAvatar('ZWM'),authorAvatar('ZWM'));assert.ok(read('article/when-a-design-studio-becomes-a-platform.html').includes('<strong>ZWM</strong>'));assert.ok(read('article/when-a-design-studio-becomes-a-platform.html').includes('"author":{"@type":"Person","name":"ZWM"}'));

assert.deepEqual(authorAvatar('Studio Openings'),{initials:'S/O',shade:'brand'});assert.ok(read('article.html').includes('id="editorial-magazine"'));assert.ok(read('article.html').includes('SELECTED / OWN WORK'));
