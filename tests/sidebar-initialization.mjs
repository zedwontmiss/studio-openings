import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=app.indexOf("  var resultsSortLabel=document.querySelector('.sidebar-sort');");
const end=app.indexOf('  function savedDateLabel',start);
assert.ok(start>=0&&end>start);
function node(){return {children:[],appendChild(n){this.children.push(n)},setAttribute(){},addEventListener(){},insertBefore(n){this.children.push(n)}};}
const list=node();list.parentNode=node();const sort=node();const state={onlySaved:false};let rendered=0;
const context={document:{querySelector(){return sort},createElement(){return node()}},$:()=>list,state,render(){rendered++}};
vm.runInNewContext(app.slice(start,end)+'\n toggleSavedView(true);',context);
assert.equal(state.onlySaved,true);assert.equal(rendered,1);assert.equal(list.parentNode.children.length,1);assert.ok(context.savedPanel);assert.ok(context.savedBack);assert.ok(context.savedListing);assert.ok(!html.includes('Loading jobs…'));assert.ok(!html.includes('Fetching jobs…'));console.log('Sidebar initialization and quiet loading checks passed.');
