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

assert.equal(authorAvatar('Falah Ibrahim').initials,'FI');assert.deepEqual(authorAvatar('Falah Ibrahim'),authorAvatar('Falah Ibrahim'));assert.ok(read('article/when-a-design-studio-becomes-a-platform.html').includes('<strong>Falah Ibrahim</strong>'));assert.ok(read('article/when-a-design-studio-becomes-a-platform.html').includes('"author":{"@type":"Person","name":"Falah Ibrahim"}'));
