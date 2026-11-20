/* Dependency-free regression tests for location display only.
 * Run: node tests/location-display-regression.cjs
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'..','assets','app.js'),'utf8');
const begin=src.indexOf('  // Only display compaction:');
const end=src.indexOf('  function eligibilityLabel(job){',begin);
assert(begin>=0&&end>begin,'Location formatting function not found');
const compact=new Function('var trim=function(v){return String(v||"").trim();};\n'+src.slice(begin,end)+'\nreturn compactJobLocation;')();
const tests=[
 ['Woolpert US state abbreviations plus city-only tail',{location:'Chicago, IL; Coral Gables, FL; Fairview Heights, IL; Miami, FL; New York, NY; Remote - United States; St. Louis',geoCountry:'US',locationKind:'office'},'United States (selected)'],
 ['Six US state abbreviations',{location:'Charlotte, NC; Chicago, IL; Coral Gables, FL; Miami, FL; New York, NY; Pittsburgh, PA',locationKind:'office'},'United States (selected)'],
 ['Four explicit US countries',{location:'Dallas, Texas, United States; Des Moines, Iowa, United States; Houston, Texas, United States; Omaha, Nebraska, United States',locationKind:'office'},'United States (selected)'],
 ['US full state names',{location:'Dallas, Texas; Miami, Florida; Chicago, Illinois; Seattle, Washington',locationKind:'office'},'United States (selected)'],
 ['Three locations unchanged',{location:'Chicago, IL; Miami, FL; New York, NY',locationKind:'office'},'Chicago, IL; Miami, FL; New York, NY'],
 ['Mixed Canadian provinces',{location:'Chicago, IL; Miami, FL; Vancouver, BC; Toronto, ON',geoCountry:'US',locationKind:'office'},'Multiple locations (selected)'],
 ['Mixed-country office list',{location:'New York, United States; London, UK; Paris, France; Berlin, Germany',geoCountry:'US',locationKind:'office'},'Multiple locations (selected)'],
 ['Unknown countries are not guessed',{location:'Studio One; Studio Two; Studio Three; Studio Four',locationKind:'office'},'Multiple locations (selected)'],
 ['Four Canada offices',{location:'Toronto, ON; Montreal, QC; Vancouver, BC; Calgary, AB',locationKind:'office'},'Multiple locations (selected)'],
 ['Pipe-separated US',{location:'Chicago, IL | Miami, FL | Denver, CO | Seattle, WA',locationKind:'office'},'United States (selected)'],
 ['Single location',{location:'Chicago, IL',locationKind:'office'},'Chicago, IL'],
 ['Empty',{location:'',locationKind:'office'},'Region not stated'],
 ['European remote eligibility',{location:'Eligible: France, Germany, Italy, Spain',locationKind:'eligibility'},'Eligible: Europe (selected countries)'],
 ['Mixed remote eligibility',{location:'Eligible: United States, Canada, Japan, Singapore',locationKind:'eligibility'},'Eligible: United States, Canada, Japan, Singapore'],
 ['Known mixed source overrides US geoCountry',{location:'Chicago, IL; Miami, FL; New York, NY; Toronto, Canada; Seattle, WA',geoCountry:'US',locationKind:'office'},'Multiple locations (selected)'],
 ['Full US state/country series',{location:'Phoenix, Arizona, United States; Los Angeles, California, United States; Dallas, Texas, United States; New York, New York, United States',locationKind:'office'},'United States (selected)']
];
tests.forEach(function(t){assert.strictEqual(compact(t[1]),t[2],t[0]);});
assert(src.includes('var shortLocation=compactJobLocation(job);'),'Drawer should also display compact location');
assert(src.includes('var items=[compactJobLocation(job),niceMode(job.mode),trim(job.type)]'),'Feed row should compact office lists');
console.log('PASS: '+(tests.length+2)+' location display and drawer regressions');
