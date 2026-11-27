// IndexNow: canonical public sitemap only; no Preview submissions.
import {execFileSync} from 'node:child_process';
const root='https://s-o.app',key='e339e672463c4058904798e3136b07c8',keyLocation=root+'/'+key+'.txt';
const live=process.env.INDEXNOW_SEND==='true',seed=process.env.INDEXNOW_MODE==='seed';
const read=(rev,path)=>execFileSync('git',['show',rev+':'+path],{encoding:'utf8'});
const urls=xml=>new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).filter(u=>{try{const p=new URL(u);return p.origin===root&&!p.search&&!p.hash&&!/^\/(?:api|operator|signal|scene|weekly|launch-check)(?:\/|$)/.test(p.pathname);}catch{return false;}}));
const current=urls(read('HEAD','sitemap.xml'));
if(!current.size)throw Error('Empty sitemap');
let list;
if(seed){list=[...current];}else{
 const before=process.env.INDEXNOW_BEFORE;
 if(!before||! /^[a-f0-9]{40}$/.test(before)||/^0+$/.test(before))throw Error('Valid previous commit required');
 const previous=urls(read(before,'sitemap.xml'));
 const files=new Set(execFileSync('git',['diff','--name-only',before,'HEAD'],{encoding:'utf8'}).trim().split('\n'));
 const changed=u=>{const p=new URL(u).pathname;return files.has(p==='/'?'index.html':p.slice(1)+'.html')||files.has(p.slice(1)+'/index.html');};
 list=[...new Set([...current].filter(u=>!previous.has(u)||changed(u)).concat([...previous].filter(u=>!current.has(u))))];
}
console.log((live?'Live':'Dry run')+': '+list.length+' URL notifications');
if(!live||!list.length)process.exit(0);
if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Production branch required');
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r.text();}
if((await get(keyLocation)).trim()!==key)throw Error('Production key not deployed');
const deployed=urls(await get(root+'/sitemap.xml'));
if([...current].some(u=>!deployed.has(u)))throw Error('Production sitemap not yet deployed');
for(let i=0;i<list.length;i+=500){
 const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:'s-o.app',key,keyLocation,urlList:list.slice(i,i+500)}),signal:AbortSignal.timeout(15000)});
 console.log('IndexNow HTTP '+r.status);
 if(![200,202].includes(r.status))throw Error('Submission not accepted: '+r.status);
}
