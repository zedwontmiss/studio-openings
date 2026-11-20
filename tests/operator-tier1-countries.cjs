/* Studio Openings v1.1.9 — Tier 1 operator-country selection regression.
 * Run: node tests/operator-tier1-countries.cjs (Node 18+, no packages).
 * Uses actual coverage policy and Pages geo handler source code.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const coverage=fs.readFileSync(path.join(root,'lib','coverage-policy.js'),'utf8');
const geo=fs.readFileSync(path.join(root,'functions','api','geo.js'),'utf8');
const strip=x=>x.replace(/^import\s+.*$/gm,'').replace(/^export\s+(?=(?:const|let|function|async\s+function|class))/gm,'');
const policy=new Function(strip(coverage)+'\nreturn {SUPPORTED_COUNTRIES,SOURCE_MAPPING_TIER1,cityCovered,placeKey,getCountry};')();
class FakeResponse {
 constructor(body,options={}){this.body=JSON.parse(body);this.status=options.status||200;this.headers=options.headers||{};}
}
const regionsFor=async country=>[{id:123,name:country==='JP'?'Tokyo':'Illinois',unassigned:false}];
const citiesFor=async()=>[{id:4,name:'Tokyo',population:100000}];
const handler=new Function('SUPPORTED_COUNTRIES','SOURCE_MAPPING_TIER1','cityCovered','placeKey','getCountry','regionsFor','citiesFor','Response',
 strip(geo)+'\nreturn onRequestGet;')(
 policy.SUPPORTED_COUNTRIES,policy.SOURCE_MAPPING_TIER1,policy.cityCovered,policy.placeKey,policy.getCountry,regionsFor,citiesFor,FakeResponse
);
const token='test-operator-token-123456789012345678901234';
const call=(url,authorised=true)=>handler({request:{url:'https://development.studio-openings.pages.dev'+url,
 headers:{get:k=>k==='authorization'&&authorised?'Bearer '+token:null}},env:{OPERATOR_ACCESS_TOKEN:token}});
(async()=>{
 const tier1=await call('/api/geo?kind=countries&purpose=source');
 assert.strictEqual(tier1.status,200,'Source country request should succeed when authorized');
 assert.deepStrictEqual(tier1.body.countries.map(x=>x.code),['US','CA'],'United States first, Canada second, only Tier 1');
 assert.deepStrictEqual(tier1.body.countries.map(x=>x.name),['United States','Canada']);
 assert(!tier1.body.countries.some(x=>!x||!x.code),'No invalid entries in country picker');
 const forbidden=await call('/api/geo?kind=countries&purpose=source',false);
 assert.strictEqual(forbidden.status,401,'Source country request stays operator-only');
 const employer=await call('/api/geo?kind=countries&purpose=employer',false);
 assert(employer.body.countries.length>2&&employer.body.countries.some(x=>x.code==='GB'),'Employer market list untouched');
 const request=await call('/api/geo?kind=countries&purpose=request',false);
 assert(request.body.countries.some(x=>x.code==='AU'),'Coverage-request market list unchanged');
 const existingGlobal=await call('/api/geo?kind=regions&purpose=source&country=JP');
 assert.strictEqual(existingGlobal.status,200,'Source lookup for previously supported non-Tier-1 locations preserved');
 assert.strictEqual(existingGlobal.body.regions[0].name,'Tokyo');
 assert(geo.includes('countries:SOURCE_MAPPING_TIER1'),'Geo endpoint uses central Tier 1 constant');
 assert(!geo.includes("fetchPlace('countries.json')"),'Large global-country payload no longer fetched');
 const ui=fs.readFileSync(path.join(root,'operator.html'),'utf8');
 assert(ui.includes('Verified country (Tier 1)'),'Dropdown accurately labeled');
 console.log('PASS: 9 Tier 1 dropdown, access and broader-coverage checks');
})().catch(err=>{console.error(err);process.exitCode=1;});
