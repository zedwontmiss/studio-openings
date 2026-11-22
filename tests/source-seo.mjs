import assert from 'node:assert/strict';
import {sourceSeoJob} from '../lib/source-seo-policy.js';
import {onRequestGet as seoPage} from '../functions/openings/[id].js';
import {onRequestGet as sitemap} from '../functions/sitemap.xml.js';

const now=Date.now(),hour=3600000;
const id='registry-24-verified889';
const job={id,title:'Product Designer',company:'Independent Creative Studio',
 description:'We are hiring for a role that involves research, design and collaboration. '.repeat(12),
 location:'Boston, Massachusetts, United States',role:'product',
 url:'https://jobs.example.org/designer',
 descriptionKind:'official-full',seoPermission:'approved',seoVerified:true,
 seoVerifiedAt:new Date(now-hour).toISOString(),source:'Official careers'};
function row(j=job){return {source_status:'approved',snapshot_state:'active',last_seen_at:new Date(now-hour).toISOString(),job_json:JSON.stringify(j)};}
assert.ok(sourceSeoJob(row(),now),'verified permitted active vacancy must be eligible');
assert.equal(sourceSeoJob({...row(),source_status:'pending'},now),null);
assert.equal(sourceSeoJob({...row(),last_seen_at:new Date(now-80*hour).toISOString()},now),null);
assert.equal(sourceSeoJob(row({...job,seoPermission:undefined}),now),null);
assert.equal(sourceSeoJob(row({...job,seoVerified:false}),now),null);
assert.equal(sourceSeoJob(row({...job,descriptionKind:'source-excerpt'}),now),null);
assert.equal(sourceSeoJob(row({...job,seoVerifiedAt:new Date(now-9*24*hour).toISOString()}),now),null);
assert.equal(sourceSeoJob(row({...job,expiresAt:new Date(now-hour).toISOString()}),now),null);
const makeEnv=(enabled='true')=>({SOURCE_SEO_ENABLED:enabled,PUBLIC_CANONICAL_HOST:'s-o.app',JOBS_DB:{
 prepare(){return {bind(){return {first:async()=>row()};},all:async()=>({results:[row()]})};}
}});
const p=await seoPage({params:{id},env:makeEnv(),request:new Request('https://development.studio-openings.pages.dev/openings/'+id)});
assert.equal(p.status,200);
assert.equal(p.headers.get('x-robots-tag'),'noindex, nofollow');
const body=await p.text();
assert.ok(body.includes('https://s-o.app/openings/'+id));
assert.ok(!body.includes('application/ld+json'),'source route must not claim JobPosting without independently verified date');
const off=await seoPage({params:{id},env:makeEnv('false'),request:new Request('https://s-o.app/openings/'+id)});
assert.equal(off.status,404);
const s=await sitemap({request:new Request('https://development.studio-openings.pages.dev/sitemap.xml'),env:makeEnv()});
assert.ok((await s.text()).includes('https://s-o.app/openings/'+id));
const s2=await sitemap({request:new Request('https://s-o.app/sitemap.xml'),env:makeEnv('false')});
assert.ok(!(await s2.text()).includes('/openings/'+id));
console.log('Source SEO rights, freshness, expiry, Preview and rollout tests passed.');
