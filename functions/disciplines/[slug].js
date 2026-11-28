import {publicHeader,HEADER_CSS} from '../../lib/public-header.js';
import {DISCIPLINES,DISCIPLINE_SLUGS} from '../../lib/discipline-pages.js';
import {DISCIPLINE_GUIDES} from '../../lib/discipline-guides.js';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const HEAD={'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=600','x-content-type-options':'nosniff'};
const resourceLinks=items=>items.map(({path,label,detail})=>'<li><a href="'+esc(path)+'">'+esc(label)+'</a>'+(detail?' · '+esc(detail):'')+'</li>').join('');
export async function onRequestGet({params,request}){
 const slug=String(params?.slug||'').toLowerCase(),item=DISCIPLINES[slug];
 if(!DISCIPLINE_SLUGS.includes(slug))return new Response('Page not found',{status:404,headers:{...HEAD,'x-robots-tag':'noindex'}});
 const url=new URL(request.url),preview=url.hostname!=='s-o.app';
 const canonical='https://s-o.app/disciplines/'+slug;
 const guide=DISCIPLINE_GUIDES[slug];
 const description=esc(guide?.description||item.intro.slice(0,155));
 const intro=esc(item.intro),name=esc(item.name),tip=esc(item.advice);
 const links=DISCIPLINE_SLUGS.filter(k=>k!==slug).map(k=>'<a href="/disciplines/'+k+'">'+esc(DISCIPLINES[k].label)+'</a>').join(' · ');
 const focus=item.focus.map(x=>'<li>'+esc(x)+'</li>').join('');
 const listUrl='/?discipline='+encodeURIComponent(slug)+'#jobs';
 const guideHtml=guide?`
${guide.sections.map(({title,text})=>'<h2>'+esc(title)+'</h2><p>'+esc(text)+'</p>').join('')}
<h2>Explore these practices</h2><ul>${resourceLinks(guide.studios)}</ul>
<h2>Related reading</h2><ul>${resourceLinks(guide.articles)}</ul>`:'';
 const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<title>${name} | Studio Openings</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Studio Openings"><meta property="og:title" content="${name} | Studio Openings"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary">
<style>html{font:14px/1.65 Helvetica,Arial,sans-serif;color:#202020;background:#fff}
body{margin:0}main,footer{max-width:760px;margin-left:auto;margin-right:auto;padding-left:20px;padding-right:20px;box-sizing:border-box}

main{padding-top:25px;padding-bottom:25px}h1{font-size:27px;line-height:1.25;margin:5px 0 18px}
h2{font-size:17px;margin:24px 0 8px}p{margin:0 0 15px}li{margin-bottom:6px}
a{color:#151515}.cta{display:inline-block;color:white;background:#111;text-decoration:none;padding:11px 16px;font-weight:bold;margin:15px 0 12px}
.note{color:#666;font-size:12px}footer{border-top:1px solid #ddd;padding-top:20px;padding-bottom:20px;margin-top:30px;color:#666;font-size:12px}
.other a{display:inline-block;margin:0 6px 7px 0}</style>${HEADER_CSS}</head>
<body>${publicHeader('jobs')}
<main><p class="note">creative careers / ${esc(item.label)}</p>
<h1>${name}</h1><p>${intro}</p>
<h2>What this discipline covers</h2><ul>${focus}</ul>
<h2>Before applying</h2><p>${tip}</p>
<p>Openings change regularly. Use the live directory below for currently available listings, salary information when disclosed, and the original source link. No vacancy count or availability is implied by this page.</p>
<a class="cta" href="${listUrl}">Browse ${esc(item.label)} openings</a>${guideHtml}
<h2>Explore other creative disciplines</h2><p class="other">${links}</p>
</main><footer>Studio Openings · <a href="/about">About</a> · <a href="/contact">Contact</a></footer>
</body></html>`;
 return new Response(html,{headers:preview?{...HEAD,'x-robots-tag':'noindex, nofollow'}:HEAD});
}
