import {engineeringTitle} from './job-scope.js';
import {outreachHeld} from './outreach-policy.js';
const roles=['architecture','interior','industrial','product','visual','motion','fashion','web','museum','culture'];
const text=(v,n)=>String(v||'').replace(/[\r\n\t]+/g,' ').trim().slice(0,n);
function safeURL(j){try{const u=new URL(j.url);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:'';}catch{return '';}}
export function prepareSignal(batches,studios,articles,now=Date.now()){
 const seen=new Set(),companies=new Set(),pool=[];
 for(const j of batches.flatMap(b=>b.jobs||[])){if(!j||!roles.includes(j.role)||engineeringTitle(j.title)||outreachHeld(j.company,j.url)||!j.title||!j.company||!j.location||j.applicationMethod&&j.applicationMethod!=='external'||j.expiresAt&&!(Date.parse(j.expiresAt)>now))continue;const date=Date.parse(j.posted||'');if(j.dateKind==='added'||j.dateKind==='updated'||!Number.isFinite(date)||date>now||now-date>7*86400000)continue;const url=safeURL(j);if(!url)continue;const key=url.replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase();if(seen.has(key))continue;seen.add(key);pool.push({title:text(j.title,150),company:text(j.company,100),location:text(j.location,150),role:j.role,url,date});}
 pool.sort((a,b)=>b.date-a.date||a.title.localeCompare(b.title));const jobs=[],counts={};for(const limit of [1,2])for(const j of pool){if(jobs.length>=12)break;const company=j.company.toLowerCase();if(companies.has(company)||(counts[j.role]||0)>=limit)continue;companies.add(company);counts[j.role]=(counts[j.role]||0)+1;jobs.push(j);}
 const day=new Date(now).toISOString().slice(0,10),week=Math.floor(now/(7*86400000));
 const validSlug=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
 const ordered=studios.filter(s=>s.name&&validSlug(s.slug)&&!outreachHeld(s.name,s.website||'')).slice().sort((a,b)=>a.slug.localeCompare(b.slug));
 const validArticles=articles.filter(a=>a.title&&validSlug(a.slug)&&/^\d{4}-\d{2}-\d{2}$/.test(a.date)&&Number.isFinite(Date.parse(a.date))&&a.date<=day).slice().sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
 const selected=validArticles.slice(0,2);
 const reading=selected.map(a=>({title:text(a.title,180),description:text(a.description,300),series:text(a.series,40),url:'https://s-o.app/article/'+a.slug}));
 const chosen=[],seenStudios=new Set();
 function choose(s){if(!s||chosen.length>=3||seenStudios.has(s.slug))return;seenStudios.add(s.slug);chosen.push(s);}
 // Connect the lead editorial to its directly related, already-published practices.
 // Keep at most one editorial-linked studio and rotate the remaining places.
 const leadSlugs=selected[0]?.studioSlugs||[];
 for(const slug of leadSlugs){const s=ordered.find(x=>x.slug===slug);if(s){choose(s);break;}}
 const year=Number(day.slice(0,4));
 const emerging=ordered.filter(s=>Number.isInteger(s.foundingYear)&&s.foundingYear<=year&&year-s.foundingYear<10);
 for(const pool of [emerging,ordered])for(let i=0;i<pool.length&&chosen.length<3;i++)choose(pool[(week*3+i)%pool.length]);
 const picks=chosen.map(s=>({title:text(s.name,160),description:text(s.summary,200),location:text([...new Set((s.offices||[]).map(o=>o.city).filter(Boolean))].join(' / '),150),url:'https://s-o.app/studio/'+s.slug}));
 const subject='SIGNAL. / '+day;
 const body=['SIGNAL.','For the creatively employed and unemployed.','','OPENINGS',...jobs.map(j=>j.title+' — '+j.company+'\n'+j.location+'\n'+j.url+'\n'),...(jobs.length?[]:['No eligible recent openings in available inventory. Review before sending.']),'STUDIOS',...picks.map(s=>[s.title,s.location,s.description,s.url,''].filter((v,i)=>v||i===4).join('\n')),'READING',...reading.map(a=>[a.series? a.series+' / '+a.title:a.title,a.description,a.url,''].filter((v,i)=>v||i===3).join('\n')),'studio openings / s-o.app'].join('\n');
 return {subject,body,jobs,picks,reading,generatedAt:new Date(now).toISOString()};
}
