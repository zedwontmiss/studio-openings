import assert from 'node:assert/strict';
import {vacancyLinkKey} from '../lib/vacancy-identity.js';
const a={url:'https://boards.greenhouse.io/example/jobs/123?utm_source=x',title:'Designer',location:'London'};
assert.equal(vacancyLinkKey(a),vacancyLinkKey({...a,url:'https://job-boards.greenhouse.io/example/jobs/123'}));
assert.notEqual(vacancyLinkKey(a),vacancyLinkKey({...a,url:'https://job-boards.greenhouse.io/example/jobs/124'}));
assert.equal(vacancyLinkKey({...a,url:'javascript:alert(1)'}),'');
assert.notEqual(vacancyLinkKey({...a,url:'https://example.com/careers'}),vacancyLinkKey({...a,url:'https://example.com/careers',location:'Paris'}));
