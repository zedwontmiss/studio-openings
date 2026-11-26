import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {STUDIO_LOCATIONS,locationStudios} from '../lib/studio-locations.js';
const file=p=>new URL('../'+p,import.meta.url),read=p=>readFileSync(file(p),'utf8');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const studios=JSON.parse(read('studio-registry/published.json')).studios,template=read('studio-registry/location.template.html'),check=process.argv.includes('--check');
if(!check)mkdirSync(file('studio/location/'),{recursive:true});
for(const loc of STUDIO_LOCATIONS){
 const list=locationStudios(studios,loc);assert.ok(list.length>=5,'Thin location: '+loc.city);
 const title="Creative studios in "+loc.city+" — Studio Openings",description="Discover independent creative practices in "+loc.city+", "+loc.countryName+", across design, art and creative industries.";
 const main='<main class="shell"><section class="directory studio-location-page"><a href="/studio?q='+encodeURIComponent(loc.city)+'#jobs">Search studios in '+esc(loc.city)+' ↗</a><h1>Creative studios in '+esc(loc.city)+'</h1><p>'+esc(description)+'</p><ul class="growth-list">'+list.map(s=>'<li><a class="studio-profile-link" href="/studio/'+s.slug+'"><h2>'+esc(s.name)+'</h2></a><p>'+esc(s.summary)+'</p></li>').join('')+'</ul><p>Independent directory. Inclusion does not confirm current hiring. <a href="/contact">Request a correction</a>.</p><section class="studio-location-browse"><h2>Explore other cities</h2><div class="studio-browse-grid">'+STUDIO_LOCATIONS.filter(x=>x.slug!==loc.slug).map(x=>'<a href="'+x.path+'">'+esc(x.city)+'</a>').join('')+'</div></section></section></main>';
 const output=template.replace(/@@(TITLE|DESCRIPTION|CANONICAL|MAIN)@@/g,(_,k)=>({TITLE:esc(title),DESCRIPTION:esc(description),CANONICAL:"https://s-o.app"+loc.path,MAIN:main})[k]);
 const path='studio/location/'+loc.slug+'.html';if(check)assert.equal(read(path),output,path+' stale');else writeFileSync(file(path),output);
}
console.log('Studio location pages verified.');
