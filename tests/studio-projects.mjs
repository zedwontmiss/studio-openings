import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {validateStudioProjects} from '../lib/studio-projects.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const studios=read('studio-registry/published.json').studios,projects=read('studio-registry/projects.json').projects,today=new Date().toISOString().slice(0,10);
assert.ok(validateStudioProjects(projects,studios,today).ok);
const p=projects[0],valid=x=>validateStudioProjects(x,studios,today).ok;
assert.ok(!valid([p,p]));assert.ok(!valid([{...p,studioIds:['missing-studio']}]));assert.ok(!valid([{...p,relationship:'unknown'}]));assert.ok(!valid([{...p,status:'reviewed'}]));assert.ok(valid([{...p,status:'reviewed',reviewConfirmed:true}]));assert.ok(!valid([{...p,score:90}]));assert.ok(!valid([{...p,evidence:[]} ]));assert.ok(!valid([{...p,url:'http://example.com'}]));
console.log('Studio project evidence validation passed.');
