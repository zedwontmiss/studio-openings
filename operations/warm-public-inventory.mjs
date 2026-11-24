// Read-only preview check. No production calls, credentials or database writes.
const origin='https://development.studio-openings.pages.dev';
const response=await fetch(origin+'/api/public-inventory',{signal:AbortSignal.timeout(15000),redirect:'error'});
if(!response.ok)throw Error('Inventory unavailable: '+response.status);
const data=await response.json();
if(data.version!==1||!Array.isArray(data.sources))throw Error('Invalid inventory');
for(const source of data.sources){
 if(!['approved','indexed','editorial'].includes(source.source)||!Array.isArray(source.jobs))throw Error('Invalid source batch');
 console.log(source.source+': '+source.jobs.length+' records'+(source.failed?' (unavailable)':''));
}
const home=await fetch(origin+'/',{signal:AbortSignal.timeout(15000),redirect:'error'});
if(!home.ok)throw Error('Preview unavailable: '+home.status);
const html=await home.text();
const count=(html.match(/<article class="job-row">/g)||[]).length;
console.log('Homepage listing markup occurrences (including template): '+count);
if(!home.headers.get('x-robots-tag')?.includes('noindex'))throw Error('Preview indexing isolation missing');
