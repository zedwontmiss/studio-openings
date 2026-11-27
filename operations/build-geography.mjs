import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const file=p=>new URL('../'+p,import.meta.url),read=p=>readFileSync(file(p),'utf8');
const records=JSON.parse(read('studio-registry/published.json')).studios;
const cities=new Map();
for(const s of records)for(const o of s.offices){
 assert.match(o.cityId,/^[a-z0-9-]+$/);
 const slug=o.city.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const old=cities.get(o.cityId);
 if(old){assert.equal(old.city,o.city);assert.equal(old.country,o.country);assert.equal(old.region,o.region);}
 else cities.set(o.cityId,{id:o.cityId,city:o.city,country:o.country,region:o.region,slug,studios:[]});
 const c=cities.get(o.cityId);
 if(!c.studios.some(x=>x.slug===s.slug))c.studios.push({slug:s.slug,name:s.name,summary:s.summary});
}
const cs=[...cities.values()].sort((a,b)=>a.slug.localeCompare(b.slug));
assert.equal(new Set(cs.map(c=>c.slug)).size,cs.length,'City slug collision: explicitly resolve before publishing');
const server="// Generated from the current studio registry; pilot city routes only.\nexport const LOCAL_CITIES=Object.freeze("+JSON.stringify(cs)+");\nexport const LOCAL_PATHS=Object.freeze(LOCAL_CITIES.map(c=>'/'+c.slug));\n";
const browser=read('assets/local-geo.js').replace(/var cities=\[[^\n]+\];/,'var cities='+JSON.stringify(cs.map(({id,slug,city,country,region})=>({id,slug,city,country,region})))+';');
for(const [p,c] of [['lib/local-cities.js',server],['assets/local-geo.js',browser]]){if(process.argv.includes('--check'))assert.equal(read(p),c,'Stale geography: '+p);else writeFileSync(file(p),c);}
console.log('Canonical geography generated: '+cs.length+' cities.');
