/** Shared publication coverage checks; compatibility with v0.14 approved jobs. */
import {POLICY_VERSION,canUseCountry,cityCovered} from './coverage-policy.js';
export {POLICY_VERSION};
function inferCountry(raw){
  const v=String(raw||'').toLowerCase();
  if(/\b(usa|u\.?s\.?a\.?|united states|new york|california|chicago|boston|seattle)\b/.test(v))return 'US';
  if(/\b(canada|toronto|vancouver)\b/.test(v))return 'CA';
  if(/\b(united kingdom|\buk\b|london|manchester)\b/.test(v))return 'GB';
  return '';
}
/** Legacy imported job strings are not sufficiently grounded to infer more cities. */
export function officeLocation(raw){
  const code=inferCountry(raw);return {eligible:!!code&&canUseCountry(code),countryCode:code,raw:String(raw||'')};
}
export function remoteEligibility(raw){
  const s=String(raw||'');if(/\b(worldwide|global|anywhere)\b/i.test(s))return {eligible:true,countryCode:'',raw:s};
  return officeLocation(raw);
}
export function geoMeta(geo){return {geoCountry:geo.countryCode||'',geoPolicy:POLICY_VERSION};}
