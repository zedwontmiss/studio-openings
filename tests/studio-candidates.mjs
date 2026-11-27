import assert from 'node:assert/strict';
import {studioCandidates} from '../lib/studio-candidates.js';
const s={id:'one',employer_name:'Example Design',official_url:'https://example.com/careers',focus:'visual',status:'approved',reviewed_at:'2026-11-25'};
const m={source_id:'one',city_name:'London',region_name:'England',country_code:'GB',city_id:'external-id'};
const rows=studioCandidates([s,{...s,id:'two'},{...s,id:'three',status:'pending'},{...s,id:'four',employer_name:'Koto'}],[m],[]);
assert.equal(rows.length,1);assert.equal(rows[0].sourceIds.length,2);assert.equal(rows[0].vacancyCities.length,1);assert.equal(rows[0].offices,undefined);
assert.equal(studioCandidates([s,{...s,id:'other',official_url:'https://different.example/careers'}],[],[]).every(c=>c.status==='identity-conflict'),true);
assert.equal(studioCandidates([s],[],[{id:'example',slug:'example',name:'Example Design',aliases:[],careerHost:'example.com'}])[0].status,'possible-existing');
assert.equal(studioCandidates([{...s,reviewed_at:null}],[],[]).length,0);
