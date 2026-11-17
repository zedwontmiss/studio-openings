/**
 * Studio Openings geographic publication policy v0.8.1.
 * Country is based on the ACTUAL JOB LOCATION (firm posts) or disclosed
 * applicant eligibility (remote feeds), not employer headquarters or IP.
 * Fail closed: unfamiliar areas, mixed markets, or missing data are held.
 * This is a rollout allowlist, NOT an estimate of pay or a judgment of countries.
 */
export const POLICY_VERSION = 'geo-v081';
const TIER1 = ['US','CA'];
const TIER2 = ['SG','AU','NZ','GB','IE','CH','DE','NL','BE','LU','FR','AT','DK','SE','NO','FI','IS','AE','SA','QA'];
const REVIEW_ONLY = ['JP','KR','KW','BH','OM'];
export const AUTO_PUBLISH_COUNTRIES = Object.freeze([...TIER1,...TIER2]);
export const MANUAL_REVIEW_COUNTRIES = Object.freeze(REVIEW_ONLY);
const priorities = new Map([...TIER1.map(k=>[k,1]),...TIER2.map(k=>[k,2]),...REVIEW_ONLY.map(k=>[k,3])]);

const nameCode = new Map();
function register(code,names){for(const name of names){nameCode.set(name.toLowerCase().replace(/\./g,'').trim(),code);}}
register('US',['us','u.s.','usa','u.s.a.','united states','united states of america','america']);
register('CA',['canada','can']);
register('SG',['singapore']);register('AU',['australia','aus']);register('NZ',['new zealand']);
register('GB',['united kingdom','uk','u.k.','great britain','britain','england','scotland','wales','northern ireland']);
register('IE',['ireland','republic of ireland']);register('CH',['switzerland']);register('DE',['germany']);
register('NL',['netherlands','the netherlands','holland']);register('BE',['belgium']);
register('LU',['luxembourg']);register('FR',['france']);register('AT',['austria']);
register('DK',['denmark']);register('SE',['sweden']);register('NO',['norway']);
register('FI',['finland']);register('IS',['iceland']);
register('AE',['united arab emirates','uae','u.a.e.','emirates']);
register('SA',['saudi arabia','saudi','ksa','kingdom of saudi arabia']);
register('QA',['qatar']);
register('JP',['japan']);register('KR',['south korea','republic of korea','korea']);
register('KW',['kuwait']);register('BH',['bahrain']);register('OM',['oman']);
// Explicit exclusions are recognized to avoid treating multi-country strings as eligible.
register('IN',['india']);register('PH',['philippines']);register('ZA',['south africa']);
register('BR',['brazil']);register('MX',['mexico']);register('ID',['indonesia']);
register('MY',['malaysia']);register('TH',['thailand']);register('VN',['vietnam']);
register('PK',['pakistan']);register('BD',['bangladesh']);register('NG',['nigeria']);
register('EG',['egypt']);register('TR',['turkey']);register('PL',['poland']);
register('ES',['spain']);register('IT',['italy']);register('PT',['portugal']);
register('CZ',['czechia','czech republic']);register('RO',['romania']);
register('GR',['greece']);register('HU',['hungary']);register('AL',['albania']);
register('AD',['andorra']);register('RS',['serbia']);register('CY',['cyprus']);
register('UA',['ukraine']);register('RU',['russia']);register('CN',['china']);
register('HK',['hong kong']);register('TW',['taiwan']);register('IL',['israel']);

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));
const CA_PROVINCES = new Set('AB BC MB NB NL NS NT NU ON PE QC SK YT'.split(' '));
const BROAD = /^(?:north america|americas|europe|eu|eu only|european union|european economic area|eea|emea|smea|apac|asia|middle east|gcc|gulf|mena|latam|remote|various|multiple locations|any location with company presence|eastern time|est|pst|utc[+-].*)$/i;
const WORLDWIDE = /^(?:anywhere|worldwide|global|globally|work from anywhere|any country|all countries)$/i;
function tidy(v){return String(v||'').trim().replace(/[\u2013\u2014]/g,'-').replace(/\s+/g,' ');}
function country(value){
 const raw=tidy(value).replace(/\.$/,'').toLowerCase();
 if(!raw)return '';
 if(nameCode.has(raw.replace(/\./g,'')))return nameCode.get(raw.replace(/\./g,''));
 // ISO country codes are accepted ONLY as an entire field, never within prose.
 const code=raw.toUpperCase();
 if(code.length===2 && (priorities.has(code)||nameCodeHasCode(code)))return code;
 return '';
}
function nameCodeHasCode(code){for(const v of nameCode.values())if(v===code)return true;return false;}
const result=(kind,codes=[],reason='')=>({kind,eligible:kind==='publish',codes,tier:kind==='publish'?(codes.includes('WW')?0:Math.min(...codes.map(c=>priorities.get(c)))):0,reason});
function evaluateCountries(codes){
 if(!codes.length)return result('hold',[],'location-unknown');
 if(codes.some(c=>!priorities.has(c)))return result('hold',codes,'unsupported-market');
 if(codes.some(c=>priorities.get(c)===3))return result('review',codes,'manual-review-market');
 return result('publish',codes,'approved-market');
}
function parseRemoteToken(raw){
 let s=tidy(raw).replace(/^eligible\s*:\s*/i,'').replace(/^available\s+(?:in|to)\s+/i,'').replace(/^(?:remote\s*(?:-|:|in)\s*)/i,'').replace(/\s*(?:only|based|residents?|applicants?|candidates?)$/i,'').trim();
 if(WORLDWIDE.test(s))return '__WORLD__';
 if(BROAD.test(s)||/\+\s*\d+\b|\b(?:and other|more countries|selected countries)\b/i.test(s))return '';
 return country(s);
}
/** Remote eligibility. Multi-country lists must contain ONLY supported markets. */
export function remoteEligibility(value,options={}){
 // Himalayas API: empty restrictions array => worldwide; a separate non-empty
 // timezoneRestrictions list means this is not truly unrestricted worldwide.
 const timezoneRestricted=Array.isArray(options.timezones)&&options.timezones.length>0;
 if(Array.isArray(value)){
  if(!value.length)return timezoneRestricted?result('hold',[],'timezone-only-restriction'):result('publish',['WW'],'worldwide');
  const codes=value.map(entry=>{
   if(entry&&typeof entry==='object'){
    const iso=String(entry.alpha2||'').toUpperCase();
    if(iso.length===2 && (priorities.has(iso)||nameCodeHasCode(iso)))return iso;
    return country(entry.name||entry.slug);
   }
   return parseRemoteToken(entry);
  });
  if(codes.some(c=>!c||c==='__WORLD__'))return result('hold',[],'ambiguous-eligibility');
  return evaluateCountries([...new Set(codes)]);
 }
 const raw=tidy(value);
 if(!raw)return result('hold',[],'eligibility-unknown');
 if(WORLDWIDE.test(raw))return result('publish',['WW'],'worldwide');
 if(BROAD.test(raw))return result('hold',[],'broad-region');
 const tokens=raw.split(/\s*(?:,|;|\/|\||\s+and\s+|\s*&\s*)\s*/i).filter(Boolean);
 if(!tokens.length)return result('hold',[],'eligibility-unknown');
 const codes=tokens.map(parseRemoteToken);
 if(codes.length===1&&codes[0]==='__WORLD__')return result('publish',['WW'],'worldwide');
 if(codes.some(c=>!c||c==='__WORLD__'))return result('hold',[],'mixed-or-unknown-market');
 return evaluateCountries([...new Set(codes)]);
}
/** Official firm listings: use the worksite, NOT the firm's headquarters. */
export function officeLocation(value){
 const s=tidy(value);
 if(!s||BROAD.test(s)||WORLDWIDE.test(s)||/\+\s*\d+|multiple locations|various offices/i.test(s))return result('hold',[],'office-location-unknown');
 const chunks=s.split(/\s*(?:;|\||\/|\s+and\s+)\s*/i);
 const codes=[];
 for(const chunk of chunks){
  const cleaned=chunk.replace(/^(?:on[ -]site|hybrid|remote|based in)\s*[-:,]?\s*/i,'').trim();
  const pieces=cleaned.split(',').map(x=>x.trim()).filter(Boolean);
  if(!pieces.length)return result('hold',[],'office-location-unknown');
  const last=pieces[pieces.length-1].toUpperCase();
  // Two-letter US states only when following a city (Los Angeles, CA).
  // This deliberately differs from remote eligibility where CA means Canada.
  let code=pieces.length>1&&US_STATES.has(last)?'US':
    pieces.length>1&&CA_PROVINCES.has(last)?'CA':country(pieces[pieces.length-1]);
  if(!code)return result('hold',[],'office-location-unknown');
  // reject explicit additional country in an earlier component
  if(pieces.slice(0,-1).some(p=>{const c=country(p);return c&&c!==code;}))return result('hold',[],'mixed-country-office');
  codes.push(code);
 }
 return evaluateCountries([...new Set(codes)]);
}
export function geoMeta(decision){return {geoTier:decision.tier,geoCountryCodes:decision.codes,geoScope:decision.reason};}
