/* Studio Openings v1.1.5, zero-dependency regression suite.
 * Run: node tests/featured-regression.cjs
 * Executes actual featured and Saved Jobs ranking functions from assets/app.js.
 */
'use strict';
const fs=require('fs'),path=require('path');
const app=fs.readFileSync(path.join(__dirname,'..','assets','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','assets','styles.css'),'utf8');
function check(condition,message){if(!condition)throw Error('FAIL: '+message);}
function part(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 check(i>=0&&j>i,'Missing code block '+start);
 return app.slice(i,j);
}
const premiumBlock=part('  var featuredById=Object.create(null);','  function loadFeaturedConfig(){');
function createEngine(sort){
 const state={sort:sort||'relevant',query:'designer'};
 const sortJobs=(a,b)=>a.title.localeCompare(b.title);
 return new Function('state','sortJobs',part('  function effectiveSort(){','  function relevanceScore(job){')+premiumBlock+'\nreturn {rankedFeed,isFeatured,setFeaturedConfig};')(state,sortJobs);
}
const day=(delta)=>new Date(Date.now()+delta*86400000).toISOString().slice(0,10);
const active={startsOn:day(-3),endsOn:day(25),approved:true};
const expired={startsOn:day(-18),endsOn:day(-1),approved:true};
const jobs=[
 {id:'direct-arch-featured',title:'Zebra Project Architect',role:'architecture'},
 {id:'direct-product-featured',title:'Zebra Product Designer',role:'product'},
 {id:'direct-arch-standard',title:'Alpha Building Designer',role:'architecture'},
 {id:'direct-arch-featured-two',title:'Omega Landscape Architect',role:'architecture'},
 {id:'direct-arch-expired',title:'Bravo Project Architect',role:'architecture'},
 {id:'direct-arch-unapproved',title:'Charlie Project Architect',role:'architecture'}
];
function configure(engine){
 engine.setFeaturedConfig({placements:[
  {...active,jobId:'direct-arch-featured'},
  {...active,jobId:'direct-product-featured'},
  {...active,jobId:'direct-arch-featured-two'},
  {...expired,jobId:'direct-arch-expired'},
  {...active,jobId:'direct-arch-unapproved',approved:false}
 ]});
}
const relevant=createEngine('relevant');configure(relevant);
check(relevant.isFeatured(jobs[0]),'First active Featured detected');
check(relevant.isFeatured(jobs[1]),'Second discipline Featured detected');
check(!relevant.isFeatured(jobs[2]),'Ordinary vacancy is not Featured');
check(!relevant.isFeatured(jobs[4]),'Expired campaign is not Featured');
check(!relevant.isFeatured(jobs[5]),'Unapproved campaign is not Featured');
check(!relevant.isFeatured({id:'direct-deleted'}),'Unknown campaign not Featured');
// Emulate selected Architecture filter: job must already pass the same filter
// before rankedFeed sees it (the browse view asserts this entry point below).
const architectureJobs=jobs.filter(j=>j.role==='architecture');
const visible=relevant.rankedFeed(architectureJobs);
check(visible.length===architectureJobs.length,'No eligible jobs removed by paid reordering');
check(visible[0].id==='direct-arch-featured'||visible[0].id==='direct-arch-featured-two','Featured is first in matching category');
check(visible[1].id==='direct-arch-featured'||visible[1].id==='direct-arch-featured-two','Other relevant Featured follows');
check(visible.slice(2).every(j=>!relevant.isFeatured(j)),'Every normal job follows the Featured group');
check(visible.every(j=>j.role==='architecture'),'Product Featured cannot appear with Architecture filter');
const productOnly=relevant.rankedFeed(jobs.filter(j=>j.role==='product'));
check(productOnly.length===1&&productOnly[0].id==='direct-product-featured','Product Featured retained in Product category');
const az=createEngine('az');configure(az);
const sorted=az.rankedFeed(architectureJobs);
check(sorted[0].id==='direct-arch-featured-two','A-Z is respected within Featured group');
check(sorted[1].id==='direct-arch-featured','Second Featured follows within A-Z');
check(sorted[2].id==='direct-arch-standard','Normal rows after Featured even if alphabetically earlier');
// Test the actual Saved Jobs comparator from the application.
const comparator=part('  function orderSavedEntries(entries,jobIndex){','  function renderSavedPanel(){');
const orderSavedEntries=new Function('isFeatured',comparator+'\nreturn orderSavedEntries;')(relevant.isFeatured);
const bookmarks=[
 {id:'direct-arch-standard',savedAt:'2026-11-19T00:00:00Z'},
 {id:'direct-arch-featured',savedAt:'2026-08-20T00:00:00Z'},
 {id:'direct-arch-expired',savedAt:'2026-11-20T00:00:00Z'},
 {id:'direct-arch-featured-two',savedAt:'2026-09-01T00:00:00Z'}
];
const index=Object.create(null);jobs.forEach(j=>index[j.id]=j);
const ordered=orderSavedEntries(bookmarks.slice(),index);
check(ordered[0].id==='direct-arch-featured-two'&&ordered[1].id==='direct-arch-featured','Saved Featured first even if saved earlier');
check(ordered[2].id==='direct-arch-expired'&&ordered[3].id==='direct-arch-standard','Expired/unpaid entries fall back to saved date');
const missing=orderSavedEntries(bookmarks.slice(),Object.create(null));
check(missing[0].id==='direct-arch-expired'&&missing[3].id==='direct-arch-featured','Saved snapshots cannot extend a campaign beyond live feed');
check(app.includes('var list=rankedFeed(state.jobs.filter(function(job){return eligible(job);}));'),'Main feed must filter before Featured ranking');
check(app.includes('return savedMatchesFilters(item,jobIndex[item.id]);'),'Saved Jobs must filter before sponsored sorting');
check(app.includes("if(activeFeatured)row.classList.add('is-featured');"),'Saved row receives Featured class');
check(app.includes("star.textContent='★';star.title='Featured · Sponsored';"),'Saved row star disclosure');
check(css.includes('.saved-entry.is-featured{background:#f4efc0;'),'Saved Featured background matches SIGNAL yellow');
check(css.includes('.job-row.is-featured{background:#f4efc0}'),'Featured job background matches SIGNAL yellow');
check(css.includes('.job-row.is-featured:hover{background:#f4efc0}'),'Featured hover matches SIGNAL yellow');
check(css.includes('.saved-library .saved-entry.is-featured{background:#f4efc0}'),'Saved library matches SIGNAL yellow');
check(css.includes('.featured-inquiry.is-selected{background:#f4efc0;'),'Featured package matches SIGNAL yellow');
console.log('PASS: 26 Featured ranking, filtering, expiration, and Saved Jobs assertions');
