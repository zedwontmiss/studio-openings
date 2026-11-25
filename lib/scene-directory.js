import {LOCAL_CITIES} from './local-cities.js';
import {sceneDirectoryCities} from './release-scope.js';
import {LOCAL_ARTICLES} from './local-editorial.js';
import {publicHeader,HEADER_CSS} from './public-header.js';
import {esc} from './seo-jobs.js';
export const countryLabel=c=>({US:'United States',GB:'United Kingdom',CA:'Canada',AU:'Australia',IN:'India'})[c]||c;
export const directoryCities=()=>LOCAL_CITIES.filter(c=>sceneDirectoryCities.includes('/'+c.slug));
const layout=(title,description,path,main)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' — Studio Openings</title><meta name="description" content="'+esc(description)+'"><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://s-o.app'+esc(path)+'"><link rel="icon" href="/assets/favicon.svg">'+HEADER_CSS+'<link rel="stylesheet" href="/assets/local.css?v=4"></head><body>'+publicHeader('scene')+main+'</body></html>';
export function sceneDirectory(){
 const cities=directoryCities(),order=['US','CA','GB','AU'],groups=order.map(code=>{const list=cities.filter(c=>c.country===code).sort((a,b)=>a.city.localeCompare(b.city,'en'));return list.length?'<section><h2>'+esc(countryLabel(code))+'</h2><ul>'+list.map(c=>'<li><a href="/'+esc(c.slug)+'">'+esc(c.city)+'</a></li>').join('')+'</ul></section>':'';}).join('');
 return layout('Scene','Explore creative studios and local industry knowledge by city.','/scene','<main class="scene-directory"><h1 class="scene-index-label">SCENE INDEX</h1>'+groups+'<p class="scene-contribute"><a href="/coverage">+ suggest a city</a></p></main>');
}
export function cityDirectory(city){
 const name=esc(city.city),country=esc(countryLabel(city.country)),path='/'+city.slug;
 const articles=LOCAL_ARTICLES.filter(a=>a.cityIds.includes(city.id)).map(a=>'<li><a href="/article/'+esc(a.slug)+'">'+esc(a.title)+'</a><small>'+esc(a.date)+'</small></li>').join('');
 const studios=city.studios.slice().sort((a,b)=>a.name.localeCompare(b.name,'en')).map(s=>{const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.name+', '+city.city+', '+countryLabel(city.country));return '<li><a href="/studio/'+esc(s.slug)+'">'+esc(s.name)+'</a><small>'+esc(s.summary)+' · <a class="scene-map" href="'+esc(maps)+'" target="_blank" rel="noopener noreferrer">map search ↗</a></small></li>';}).join('');
 const contribute='mailto:hello@s-o.app?subject='+encodeURIComponent('Scene contribution — '+city.city)+'&body='+encodeURIComponent('Contribution type (studio / local event / article idea / correction):\n\nPublic source or relevant details:\n');
 return layout(city.city+' creative scene','Explore creative studios, jobs and local articles in '+city.city+', '+countryLabel(city.country)+'.',path,'<main class="scene-directory"><p class="scene-crumb"><a href="/scene">scene</a> / '+country+'</p><h1>'+name+'</h1><section><h2>SCENE</h2><p>Help shape the local directory. Suggestions are reviewed before publication.</p><a class="scene-contribute" href="'+esc(contribute)+'">+ contribute to '+name+'</a></section><section><h2>JOBS</h2><p><a href="/?filters=1&amp;city='+encodeURIComponent(city.slug)+'#jobs">Browse jobs in '+name+' ↗</a></p></section><section><h2>ARTICLE</h2>'+(articles?'<ul>'+articles+'</ul>':'<p><a href="/article">Explore industry articles ↗</a></p>')+'</section><section><h2>STUDIO</h2><ul>'+studios+'</ul></section><p class="scene-crumb">Partial directory of known locations. Map links open a search, not a verified street address. <a href="'+esc(contribute)+'">Suggest a correction.</a></p></main>');
}
