import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compile,build} from './build-editorial.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),file=p=>new URL('../'+p,import.meta.url),read=p=>readFileSync(file(p),'utf8');
const input=process.argv[2];assert.ok(input,'Usage: node operations/publish-editorial-batch.mjs batch.json [--apply]');
const batch=JSON.parse(readFileSync(input,'utf8')),registry=JSON.parse(read('editorial/published.json')),today=new Date().toISOString().slice(0,10);
assert.equal(batch.version,1);assert.equal(batch.status,'reviewed-independent-editorial');assert.ok(Array.isArray(batch.articles)&&batch.articles.length>0&&batch.articles.length<=500);
const allowed=['slug','title','description','category','date','status','blocks','related','cityIds','searchTopics'];
for(const a of batch.articles){assert.ok(Object.keys(a).every(k=>allowed.includes(k)));assert.equal(a.status,'published');assert.ok(a.date<=today);assert.ok(a.blocks.every(b=>['paragraph','heading'].includes(b.type)&&Object.keys(b).every(k=>['type','text'].includes(k))));}
const next={...registry,articles:registry.articles.concat(batch.articles)};
compile(next,read('editorial/index.template.html'),read('editorial/reader.template.html'));
console.log(batch.articles.length+' validated independent articles; '+next.articles.length+' registry entries.');
if(!process.argv.includes('--apply'))process.exit(0);
assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'development');assert.equal(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),'','Clean worktree required');
writeFileSync(file('editorial/published.json'),JSON.stringify(next,null,2)+'\n');build(false);
console.log('Review generated changes and test before explicit development commit. No deployment performed.');
