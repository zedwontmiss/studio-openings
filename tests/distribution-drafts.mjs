import assert from 'node:assert/strict';
import {draftDistributionPost,distributionEligible} from '../lib/distribution-drafts.js';
const now=Date.now();
const base={
 id:'SO-TEST-123456',role:'product',title:'Product Designer',company:'Independent Creative Studio',
 location:'Boston, MA, USA',mode:'Hybrid',salary:'USD 90k–120k',
 detailUrl:'https://s-o.app/jobs/SO-TEST-123456',verifiedAt:new Date(now-3600000).toISOString(),
 operatorApproved:true,active:true,sourceVerified:true
};
for(const channel of ['reddit','x']){
 const draft=draftDistributionPost(base,channel,now);
 assert.ok(draft,channel+' draft missing');
 assert.equal(draft.status,'draft');
 assert.equal(draft.approved,false);
 assert.equal(draft.autoPublish,false);
 assert.equal(draft.requiresApproval,true);
 assert.ok(draft.body.includes('Product Designer'));
 assert.ok(draft.body.includes('Independent Creative Studio'));
 assert.ok(draft.body.includes('utm_source='+channel));
 assert.ok(draft.targetUrl.startsWith('https://s-o.app/jobs/'));
}
assert.equal(draftDistributionPost(base,'linkedin',now),null);
assert.equal(distributionEligible({...base,active:false},now),null);
assert.equal(distributionEligible({...base,operatorApproved:false},now),null);
assert.equal(distributionEligible({...base,sourceVerified:false},now),null);
assert.equal(distributionEligible({...base,verifiedAt:new Date(now-80*3600000).toISOString()},now),null);
assert.equal(distributionEligible({...base,expiresAt:new Date(now-3600000).toISOString()},now),null);
assert.equal(distributionEligible({...base,detailUrl:'https://himalayas.app/jobs/x'},now),null);
assert.equal(distributionEligible({...base,applicationStatus:'closed'},now),null);
console.log('Distribution drafting, provenance, freshness and channel safety checks passed.');
