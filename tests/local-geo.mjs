import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../assets/local-geo.js',import.meta.url),'utf8'),ctx);
const m=ctx.SOAPPLocalGeo.matches;
assert.equal(m({location:'London, United Kingdom',geoCountry:'GB'},'london'),true);
assert.equal(m({location:'London, Ontario, Canada',geoCountry:'CA'},'london'),false);
assert.equal(m({location:'London',company:'London Studio'},'london'),false);
assert.equal(m({location:'Remote, London, United Kingdom',mode:'remote'},'london'),false);
assert.equal(m({location:'London, United Kingdom',locationKind:'eligibility'},'london'),false);
assert.equal(m({location:'New York, NY, United States'},'new-york'),true);
assert.equal(m({location:'Montreal, Quebec, Canada'},'montreal'),true);
assert.equal(m({location:'Sydney, Australia',title:'Melbourne Designer'},'melbourne'),false);
console.log('Local geographic filtering checks passed.');

assert.equal(m({location:'London, England, Canada'},'london'),false);
assert.equal(m({location:'Los Angeles, CA'},'los-angeles'),false);
assert.equal(m({location:'Los Angeles, CA, United States'},'los-angeles'),true);
assert.equal(ctx.SOAPPLocalGeo.cityId({location:'London, England, United Kingdom'}),'gb--england--london');

assert.equal(m({location:'Toronto, Ontario, Canada'},'toronto'),true);assert.equal(m({location:'Portland, Maine, United States'},'portland'),false);assert.equal(m({location:'Portland, Oregon, United States'},'portland'),true);assert.equal(m({location:'San Francisco, CA'},'san-francisco'),false);assert.equal(m({location:'Vancouver, Washington, United States'},'vancouver'),false);
