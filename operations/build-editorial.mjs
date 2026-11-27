import {LOCAL_CITIES} from '../lib/local-cities.js';
import {readFileSync,writeFileSync,readdirSync,unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const origin='https://s-o.app';
const categories=['Career','Practice','Studio','Research','Industry','Opinion','Resources'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function text(value,max){assert.equal(typeof value,'string');assert.ok(value.trim()&&value.length<=max);return value;}
function link(l){text(l.label,200);assert.match(l.path,/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/);return '<a href="'+esc(l.path)+'">'+esc(l.label)+'</a>';}
function dateLabel(d){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));}
function validDate(d){assert.match(d,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(d+'T00:00:00Z').toISOString().slice(0,10),d);}
function fill(template,data){return template.replace(/@@([A-Z]+)@@/g,(_,key)=>{assert.ok(Object.hasOwn(data,key),'Missing template value '+key);return data[key];});}
export function authorAvatar(name){
 if(name==='ZWM')return {initials:'ZM',shade:'zwm'};
 if(name==='Studio Openings')return {initials:'S/O',shade:'brand'};
 const words=name.trim().split(/\s+/),initials=(words[0].charAt(0)+(words.length>1?words[words.length-1].charAt(0):'')).toUpperCase();
 const palette=['#111111','#333333','#555555','#777777','#aaaaaa','#cccccc','#eeeeee','#ffffff'];
 let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))>>>0;
 const shade=hash%palette.length;
 return {initials,shade};
}
export function compile(source,indexTemplate,readerTemplate){
 assert.ok(Array.isArray(source.articles));const seen=new Set();
 for(const a of source.articles){assert.match(a.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(a.slug.length<=100&&!seen.has(a.slug));seen.add(a.slug);assert.ok(['published','unpublished'].includes(a.status));if(a.status!=='published'){assert.deepEqual(Object.keys(a).sort(),['slug','status']);continue;}assert.ok(Array.isArray(a.cityIds||[]));assert.ok((a.cityIds||[]).every(id=>LOCAL_CITIES.some(c=>c.id===id)),'Unknown editorial city ID');assert.equal(new Set(a.cityIds||[]).size,(a.cityIds||[]).length);if(a.author!==undefined)text(a.author,120);text(a.title,180);text(a.description,400);assert.ok(categories.includes(a.category));validDate(a.date);assert.ok(Array.isArray(a.blocks)&&a.blocks.length>0);for(const b of a.blocks){assert.ok(['heading','paragraph','links'].includes(b.type));if(b.type==='links'){assert.ok(Array.isArray(b.links)&&b.links.length);b.links.forEach(link);}else{text(b.text,15000);}}assert.ok(Array.isArray(a.related));a.related.forEach(link);}
 const articles=source.articles.filter(a=>a.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
 const published=new Set(articles.map(a=>'/article/'+a.slug));
 for(const a of articles){for(const l of a.related.concat(a.blocks.filter(b=>b.type==='links').flatMap(b=>b.links))){if(l.path.startsWith('/article/'))assert.ok(published.has(l.path),'Article link targets an unpublished entry');}}
 const out=new Map(),url=a=>origin+'/article/'+a.slug,href=a=>'/article/'+a.slug;
 const meta=a=>'<p class="editorial-meta">'+esc(a.author||'Studio Openings')+' · <time datetime="'+a.date+'">'+dateLabel(a.date)+'</time></p>';
 const feature=articles.find(a=>a.slug===source.featured)||articles[0];
 const featureHtml=feature?'<section class="editorial-feature"><div><p class="editorial-kicker">Featured · '+esc(feature.category)+'</p><h2><a href="'+href(feature)+'">'+esc(feature.title)+'</a></h2><p>'+esc(feature.description)+'</p>'+meta(feature)+'<a class="editorial-read" href="'+href(feature)+'">Read article →</a></div><div class="editorial-feature-art" aria-hidden="true"><span>CREATIVE<br>WORK.</span><small>SO / EDITORIAL</small></div></section>':'';
 const tabs=['All',...categories.filter(c=>articles.some(a=>a.category===c))];
 const selected=articles.filter(a=>a!==feature).slice(0,2);
 const lead=feature?'<section class="so-editorial-lead"><p class="so-editorial-eyebrow">SELECTED / '+esc(feature.series||feature.category)+'</p><h2><a href="'+href(feature)+'">'+esc(feature.title)+'</a></h2><p class="so-editorial-deck">'+esc(feature.description)+'</p>'+meta(feature)+'</section>':'';
 const selection=selected.map(a=>'<section class="so-editorial-selected"><h2><a href="'+href(a)+'">'+esc(a.title)+'</a></h2>'+meta(a)+'</section>').join('');
 const magazine=lead+'<div class="so-editorial-selection">'+selection+'<a class="so-signal-square" data-signal-contact href="/signal"><span>studio openings</span><strong>SIGNAL.</strong><span>Subscribe →</span></a></div>';
 const cards=articles.map(a=>'<article class="editorial-card" data-category="'+a.category+'"><h2><a href="'+href(a)+'">'+esc(a.title)+'</a></h2><time datetime="'+a.date+'">'+dateLabel(a.date)+'</time><p class="editorial-summary" hidden>'+esc(a.description)+'</p></article>').join('');
 out.set('article.html',fill(indexTemplate,{FEATURE:magazine,TABS:'',CARDS:cards}));
 for(const a of articles){
  const body=a.blocks.map(b=>b.type==='links'?'<p>'+b.links.map(link).join(' · ')+'</p>':b.type==='heading'?'<h2>'+esc(b.text)+'</h2>':'<p>'+esc(b.text)+'</p>').join('');
  const words=a.blocks.map(b=>b.text||'').join(' ').trim().split(/\s+/).length;
  const name=a.author||'Studio Openings',avatar=authorAvatar(name);
  const publisher={'@type':'Organization',name:'Studio Openings',url:origin};
  const author=a.author?{'@type':'Person',name}:publisher;
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,datePublished:a.date,author,publisher,mainEntityOfPage:url(a)}).replace(/</g,'\\u003c');
  const metaHtml='<meta property="og:type" content="article"><meta property="og:title" content="'+esc(a.title)+'"><meta property="og:description" content="'+esc(a.description)+'"><meta property="og:url" content="'+url(a)+'"><meta property="article:published_time" content="'+a.date+'"><meta name="twitter:card" content="summary"><script type="application/ld+json">'+schema+'</script>';
  const related=a.related.concat(articles.filter(b=>b.slug!==a.slug).sort((x,y)=>Number(y.category===a.category)-Number(x.category===a.category)).slice(0,2).map(b=>({label:b.title,path:href(b)})));
  const main='<main class="editorial-reader"><a class="editorial-back" href="/article">← All articles</a><article><header class="editorial-article-header"><p class="editorial-kicker">'+a.category+'</p><h1>'+esc(a.title)+'</h1><p class="editorial-deck">'+esc(a.description)+'</p><div class="editorial-byline"><span class="editorial-avatar editorial-avatar-'+avatar.shade+'" aria-hidden="true">'+esc(avatar.initials)+'</span><div><strong>'+esc(name)+'</strong><span><time datetime="'+a.date+'">'+dateLabel(a.date)+'</time> · '+Math.max(1,Math.ceil(words/200))+' min read</span></div></div><div class="editorial-share"><a href="mailto:?subject='+encodeURIComponent(a.title)+'&amp;body='+encodeURIComponent(url(a))+'">Share by email</a><button type="button" id="editorial-copy" hidden>Copy link</button><span id="editorial-copy-status" role="status"></span></div></header><div class="editorial-prose">'+body+'</div></article><aside class="editorial-related"><h2>Continue exploring</h2><ul>'+related.map(l=>'<li>'+link(l)+'</li>').join('')+'</ul></aside></main>';
  out.set('article/'+a.slug+'.html',fill(readerTemplate,{TITLE:esc(a.title),DESCRIPTION:esc(a.description),URL:url(a),META:metaHtml,READER:main}));
 }
 out.set('article/feed.xml','<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Studio Openings Articles</title><link>'+origin+'/article</link><description>Notes on creative work, careers and studios.</description><language>en</language>'+articles.slice(0,50).map(a=>'<item><title>'+esc(a.title)+'</title><link>'+url(a)+'</link><guid isPermaLink="true">'+url(a)+'</guid><description>'+esc(a.description)+'</description><pubDate>'+new Date(a.date+'T00:00:00Z').toUTCString()+'</pubDate><category>'+a.category+'</category></item>').join('')+'</channel></rss>\n');
 out.set('lib/editorial-workspace-index.js','// Generated from published editorial registry; public metadata only.\nexport const EDITORIAL_WORKSPACE_INDEX='+JSON.stringify(source.articles.filter(a=>a.status==='published').map(a=>({slug:a.slug,title:a.title,category:a.category,date:a.date,description:a.description,...(a.author?{author:a.author}:{}),...(a.series?{series:a.series}:{}),studioSlugs:[...new Set(a.related.map(l=>l.path).filter(p=>/^\/studio\/[a-z0-9-]+$/.test(p)).map(p=>p.slice(8)))]})))+';\n');
 out.set('lib/editorial-routes.js','// Generated by operations/build-editorial.mjs. Do not edit.\nexport const ARTICLE_PATHS=Object.freeze('+JSON.stringify(articles.map(href))+');\n');
 out.set('lib/local-editorial.js','// Generated by operations/build-editorial.mjs. Do not edit.\nexport const LOCAL_ARTICLES=Object.freeze('+JSON.stringify(articles.filter(a=>(a.cityIds||[]).length).map(a=>({slug:a.slug,title:a.title,date:a.date,cityIds:a.cityIds})))+');\n');
 return out;
}
export function build(check=false){
 const source=JSON.parse(read('editorial/published.json'));const out=compile(source,read('editorial/index.template.html'),read('editorial/reader.template.html'));
 const sitemap=read('sitemap.xml').replace(/<url><loc>https:\/\/s-o\.app\/article\/[a-z0-9-]+<\/loc><\/url>/g,'');
 out.set('sitemap.xml',sitemap.replace('</urlset>',source.articles.filter(a=>a.status==='published').sort((a,b)=>b.date.localeCompare(a.date)).map(a=>'<url><loc>'+origin+'/article/'+a.slug+'</loc></url>').join('')+'</urlset>'));
 const stale=readdirSync(path.join(root,'article')).filter(n=>n.endsWith('.html')&&!out.has('article/'+n));
 if(check){assert.deepEqual(stale,[],'Stale article pages');for(const [p,c] of out)assert.equal(read(p),c,'Generated file is stale: '+p);}
 else{for(const [p,c] of out)writeFileSync(path.join(root,p),c);for(const n of stale)unlinkSync(path.join(root,'article',n));}
 return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){build(process.argv.includes('--check'));console.log('Editorial generation verified.');}
