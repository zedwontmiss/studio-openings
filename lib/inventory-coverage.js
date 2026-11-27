import {SUPPORTED_COUNTRIES} from './coverage-policy.js';
import {DISCIPLINE_SLUGS} from './discipline-pages.js';
import {engineeringTitle} from './job-scope.js';
import {vacancyLinkKey} from './vacancy-identity.js';
import {outreachHeld} from './outreach-policy.js';
export function inventoryCoverage(batches,now=Date.now()){
 const countries=SUPPORTED_COUNTRIES.map(c=>({...c,counts:Object.fromEntries(DISCIPLINE_SLUGS.map(r=>[r,0])),total:0})),roles=Object.fromEntries(DISCIPLINE_SLUGS.map(r=>[r,0])),worldwide=Object.fromEntries(DISCIPLINE_SLUGS.map(r=>[r,0])),seen=new Set(),links=new Set(),quality={duplicates:0,expired:0,engineering:0,invalid:0,held:0,unknownCountry:0,missingSalary:0,missingDate:0,underThreeSourceTags:0},batchesReport=[];let total=0;
 for(const b of batches){let accepted=0;for(const j of b.jobs||[]){if(!j||!j.id||!j.title||!j.company||!j.location||!DISCIPLINE_SLUGS.includes(j.role)){quality.invalid++;continue;}if(engineeringTitle(j.title)){quality.engineering++;continue;}if(j.expiresAt&&!(Date.parse(j.expiresAt)>now)){quality.expired++;continue;}if(outreachHeld(j.company,j.url)){quality.held++;continue;}const key=vacancyLinkKey(j);if(seen.has(j.id)||key&&links.has(key)){quality.duplicates++;continue;}seen.add(j.id);if(key)links.add(key);total++;accepted++;roles[j.role]++;
 if(!j.salary)quality.missingSalary++;if(!Number.isFinite(Date.parse(j.posted||''))||j.dateKind==='added'||j.dateKind==='updated')quality.missingDate++;if(!Array.isArray(j.tags)||new Set(j.tags).size<3)quality.underThreeSourceTags++;
 if((j.locationKind==='eligibility'||j.mode==='remote')&&/\b(worldwide|anywhere|all countries|global)\b/i.test(j.location)){worldwide[j.role]++;continue;}
 const matches=countries.filter(c=>String(j.geoCountry||'').toUpperCase()===c.code||new RegExp('\\b'+c.name+'\\b','i').test(j.location)||c.code==='GB'&&/\b(?:UK|England|Scotland|Wales|Northern Ireland)\b/i.test(j.location)||c.code==='US'&&/\b(?:USA|US)\b/i.test(j.location));
 if(!matches.length)quality.unknownCountry++;for(const c of matches){c.counts[j.role]++;c.total++;}
 }batchesReport.push({source:b.source,received:(b.jobs||[]).length,accepted,failed:!!b.failed});}
 const gaps=countries.flatMap(c=>DISCIPLINE_SLUGS.filter(r=>c.counts[r]===0).map(role=>({country:c.code,role})));
 return {total,roles,worldwide,countries,quality,gaps,batches:batchesReport,generatedAt:new Date(now).toISOString()};
}
