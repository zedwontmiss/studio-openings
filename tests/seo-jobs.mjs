import assert from 'node:assert/strict';
import {eligibleJob,toSchema} from '../lib/seo-jobs.js';
import {onRequestGet as renderSitemap} from '../functions/sitemap.xml.js';
import {onRequestGet as renderJob} from '../functions/jobs/[id].js';

const now=Date.now();
const isoDate=(n)=>new Date(n).toISOString().slice(0,10);
const dbDate=(n)=>new Date(n).toISOString().slice(0,19).replace('T',' ');
const DAY=86400000;
const id='SO-TEST-123456';
const data={
 title:'Senior Product Designer',company:'Independent Creative Studio',
 description:'We are seeking a senior designer to collaborate on creative product work. '.repeat(8),
 role:'product',mode:'remote',type:'Full-time',location:'Worldwide',
 locationReference:{kind:'worldwide'},applicationMethod:'external',
 url:'https://example.org/careers/designer'
};
function record(){
 return {id,status:'approved',submission_type:'employer',job_data:JSON.stringify(data),
 created_at:dbDate(now-2*DAY),reviewed_at:dbDate(now-1*DAY),
 order_tier:'standard',order_status:'paid',order_published_at:dbDate(now-2*DAY)};
}
const approved=record();
const job=eligibleJob(approved,now);
assert.ok(job,'verified, paid, published employer job should qualify');
assert.equal(job.datePosted,isoDate(now-2*DAY),'employer submission date must be preserved');
const schema=toSchema(job,'https://s-o.app');
assert.equal(schema['@type'],'JobPosting');
assert.equal(schema.url,'https://s-o.app/jobs/'+id);
assert.equal(schema.jobLocationType,'TELECOMMUTE');
assert.ok(!schema.applicantLocationRequirements,'worldwide jobs must not invent restricted eligibility');
assert.equal(eligibleJob({...approved,status:'pending'},now),null);
assert.equal(eligibleJob({...approved,submission_type:'source'},now),null);
assert.equal(eligibleJob({...approved,order_status:'unpaid'},now),null);
assert.equal(eligibleJob({...approved,reviewed_at:dbDate(now-40*DAY)},now),null);
assert.equal(eligibleJob({...approved,order_published_at:dbDate(now-40*DAY)},now),null);
assert.equal(eligibleJob({...approved,job_data:JSON.stringify({...data,closesOn:isoDate(now-2*DAY)})},now),null);
assert.equal(eligibleJob({...approved,job_data:JSON.stringify({...data,description:'Too short'})},now),null);

function envFor(rows){
 return {PUBLIC_CANONICAL_HOST:'s-o.app',JOBS_DB:{prepare(sql){
   return {bind(){return {first:async()=>rows[0]||null};},all:async()=>({results:rows})};
 }}};
}
const env=envFor([approved,{...record(),id:'SO-TEST-EXPIRED',reviewed_at:dbDate(now-40*DAY)}]);
const site=await renderSitemap({request:new Request('https://development.studio-openings.pages.dev/sitemap.xml'),env});
const xml=await site.text();
assert.equal(site.status,200);
assert.ok(xml.includes('https://s-o.app/jobs/'+id),'valid employer job must appear');
assert.ok(!xml.includes('SO-TEST-EXPIRED'),'expired job must be excluded');
assert.ok(xml.includes('https://s-o.app/disciplines/architecture'),'all category pages remain discoverable');
const rendered=await renderJob({params:{id},env,request:new Request('https://development.studio-openings.pages.dev/jobs/'+id)});
assert.equal(rendered.status,200);
assert.equal(rendered.headers.get('x-robots-tag'),'noindex, nofollow');
const html=await rendered.text();
assert.ok(html.includes('https://s-o.app/jobs/'+id));
assert.ok(html.includes('application/ld+json'));
assert.ok(html.includes(job.datePosted));
const closed=await renderJob({params:{id},env:envFor([{...approved,order_status:'unpaid'}]),request:new Request('https://s-o.app/jobs/'+id)});
assert.equal(closed.status,404);
assert.equal(closed.headers.get('x-robots-tag'),'noindex');
console.log('Job SEO, expiry, sitemap and Preview isolation tests passed.');
