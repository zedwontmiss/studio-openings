// Run in a clean development worktree. Dry-run is default; no deployment or commit.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {qualifyStudio} from '../lib/studio-acquisition-gate.js';
import {reviewStudio} from '../lib/studio-review.js';
const root=fileURLToPath(new URL('../',import.meta.url)),file=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(file(p),'utf8'),write=(p,s)=>writeFileSync(file(p),s);
const input=process.argv[2];assert.ok(input,'Usage: node operations/publish-studio-batch.mjs batch.json [--apply]');
const batch=JSON.parse(readFileSync(input,'utf8')),current=JSON.parse(read('studio-registry/published.json'));
const today=new Date().toISOString().slice(0,10);
assert.equal(batch.version,1);assert.equal(batch.status,'reviewed-not-published');assert.ok(Array.isArray(batch.records)&&batch.records.length>0&&batch.records.length<=2000);
const accepted=[];
for(const r of batch.records){
 const qualification=qualifyStudio(r,batch.qualifications?.[r.id],today);
 assert.ok(qualification.ok,r.name+': '+qualification.errors.join('; '));
 const website=new URL(r.website);assert.equal(website.protocol,'https:');
 const result=reviewStudio({status:'review-required',name:r.name,domain:website.hostname.replace(/^www\./,''),careerURL:r.source?.url},{decision:'approve',record:r,identityEvidence:r.website,officeEvidenceReviewed:true,creativeScopeReviewed:true},current.studios.concat(accepted),today);
 assert.ok(result.ok,r.name+': '+(result.errors||[]).join('; '));accepted.push({...result.record,foundingYear:r.foundingYear});
}
console.log(accepted.length+' validated additions; '+(current.studios.length+accepted.length)+' total.');
if(!process.argv.includes('--apply'))process.exit(0);
assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'development','Apply only on development');
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),'','Use clean worktree; keep batch file outside repository');
const studios=current.studios.concat(accepted),next={...current,studios};
write('studio-registry/published.json',JSON.stringify(next,null,2)+'\n');
execFileSync(process.execPath,['operations/build-geography.mjs'],{cwd:root,stdio:'inherit'});
const sitemap=read('sitemap.xml').replace(/<url><loc>https:\/\/s-o\.app\/studio\/[a-z0-9-]+<\/loc><\/url>/g,'');
write('sitemap.xml',sitemap.replace('</urlset>',studios.map(s=>'<url><loc>https://s-o.app/studio/'+s.slug+'</loc></url>').join('')+'</urlset>'));
const backlog=JSON.parse(read('operations/studio-acquisition-backlog.json')),norm=s=>String(s).normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' '),names=new Set(studios.flatMap(s=>[s.name,...s.aliases].map(norm)));
const candidates=backlog.candidates.filter(x=>!names.has(norm(x.name))).map(x=>({name:x.name,discipline:x.discipline,marketHint:x.marketHint,evidence:x.evidence||null}));
write('lib/studio-workspace.js','// Generated from directory registry and research backlog; no private contact data.\nexport const STUDIO_WORKSPACE='+JSON.stringify({studios,candidates})+';\n');
for(const script of ['build-studio-index.mjs','build-studio-profiles.mjs','build-editorial.mjs'])execFileSync(process.execPath,['operations/'+script],{cwd:root,stdio:'inherit'});
console.log('Generated outputs ready for diff, tests and explicit development commit; no deployment performed.');
