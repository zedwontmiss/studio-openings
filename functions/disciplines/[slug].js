import {DISCIPLINES,DISCIPLINE_SLUGS} from '../../lib/discipline-pages.js';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const HEAD={'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=600','x-content-type-options':'nosniff'};
export async function onRequestGet({params,request}){
 const slug=String(params?.slug||'').toLowerCase(),item=DISCIPLINES[slug];
 if(!item)return new Response('Page not found',{status:404,headers:{...HEAD,'x-robots-tag':'noindex'}});
 const url=new URL(request.url),preview=url.hostname!=='s-o.app';
 const canonical='https://s-o.app/disciplines/'+slug;
 const intro=esc(item.intro),name=esc(item.name),tip=esc(item.advice);
 const links=DISCIPLINE_SLUGS.filter(k=>k!==slug).map(k=>'<a href="/disciplines/'+k+'">'+esc(DISCIPLINES[k].label)+'</a>').join(' · ');
 const focus=item.focus.map(x=>'<li>'+esc(x)+'</li>').join('');
 const listUrl='/?discipline='+encodeURIComponent(slug)+'#jobs';
 const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} | Studio Openings</title>
<meta name="description" content="${esc((item.intro).slice(0,155))}">
<link rel="canonical" href="${canonical}">
<style>html{font:14px/1.65 Arial,Helvetica,sans-serif;color:#202020;background:#fff}
body{max-width:760px;margin:0 auto;padding:0 22px}
header{border-bottom:1px solid #ddd;padding:18px 0}header a{color:#111;font-weight:bold;text-decoration:none;font-size:17px}
main{padding:25px 0}h1{font-size:27px;line-height:1.25;margin:5px 0 18px}
h2{font-size:17px;margin:24px 0 8px}p{margin:0 0 15px}li{margin-bottom:6px}
a{color:#151515}.cta{display:inline-block;color:white;background:#111;text-decoration:none;padding:11px 16px;font-weight:bold;margin:15px 0 12px}
.note{color:#666;font-size:12px}footer{border-top:1px solid #ddd;padding:22px 0;margin-top:30px;color:#666;font-size:12px}
.other a{display:inline-block;margin:0 6px 7px 0}</style></head>
<body><header><a href="/">studio openings</a></header>
<main><p class="note">creative careers / ${esc(item.label)}</p>
<h1>${name}</h1><p>${intro}</p>
<h2>What this discipline covers</h2><ul>${focus}</ul>
<h2>Before applying</h2><p>${tip}</p>
<p>Openings change regularly. Use the live directory below for currently available listings, salary information when disclosed, and the original source link. No vacancy count or availability is implied by this page.</p>
<a class="cta" href="${listUrl}">Browse ${esc(item.label)} openings</a>
<h2>Explore other creative disciplines</h2><p class="other">${links}</p>
</main><footer>Studio Openings · <a href="/about.html">About</a> · <a href="/contact.html">Contact</a></footer>
</body></html>`;
 return new Response(html,{headers:preview?{...HEAD,'x-robots-tag':'noindex, nofollow'}:HEAD});
}
