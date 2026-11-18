/** Canonical location references for submissions and SEO.
 * Client codes/labels are untrusted until validated via verifyCityReference().
 */
import {getCountry,cityCovered,placeKey,US_REGIONS,SUPPORTED_COUNTRIES} from './coverage-policy.js';
const LEGACY_COUNTRIES=Object.fromEntries(SUPPORTED_COUNTRIES.map(x=>[x.code,x.name]));
function clean(s){return typeof s==='string'&&s.length<=120&&!/[<>\r\n]/.test(s);}
export function resolveReference(ref){
 if(!ref||typeof ref!=='object'||Array.isArray(ref))return null;
 const cc=String(ref.countryCode||'').toUpperCase();
 if(ref.kind==='worldwide'&&!cc)return {kind:'worldwide',countryCode:'',regionCode:'',label:'Worldwide'};
 const country=getCountry(cc);if(!country)return null;
 if(ref.kind==='country')return {kind:'country',countryCode:cc,regionCode:'',label:country.name};
 if(ref.kind==='region'&&cc==='US'&&US_REGIONS[ref.regionCode])return {kind:'region',countryCode:cc,regionCode:ref.regionCode,label:US_REGIONS[ref.regionCode]};
 if(ref.kind!=='city'||!Number.isSafeInteger(Number(ref.regionId))||!Number.isSafeInteger(Number(ref.cityId))||!clean(ref.cityName)||!clean(ref.regionName))return null;
 if(Number(ref.regionId)<=0||Number(ref.cityId)<=0)return null;
 // This is a shape / coverage check, NOT proof of geographic existence.
 if(!cityCovered(cc,ref.cityName))return null;
 return {kind:'city',countryCode:cc,regionCode:String(ref.regionCode||'').slice(0,12),regionId:Number(ref.regionId),cityId:Number(ref.cityId),
   cityName:ref.cityName.trim(),regionName:ref.regionName.trim(),label:ref.cityName.trim()+', '+ref.regionName.trim()+', '+country.name};
}
export function locateRaw(value){
 const name=placeKey(value);
 if(['worldwide','global','anywhere'].includes(name))return {kind:'worldwide',countryCode:'',regionCode:'',label:'Worldwide'};
 for(const [code,c] of (Object.entries(LEGACY_COUNTRIES))){if(placeKey(c)===name||placeKey(code)===name)return resolveReference({kind:'country',countryCode:code});}
 for(const [code,c] of Object.entries(US_REGIONS)){if(placeKey(c)===name||placeKey(code)===name)return resolveReference({kind:'region',countryCode:'US',regionCode:code});}
 return null;
}
export function standardizeJobLocation(input){
 const raw=String(input.location||'').trim(),ref=resolveReference(input.locationReference);
 if(!ref)return {error:'Choose a supported country and verified city from the selectors'};
 if(ref.kind==='worldwide'&&input.mode!=='remote')return {error:'Worldwide requires Remote arrangement'};
 if(ref.kind==='country'&&input.mode!=='remote')return {error:'On-site and hybrid jobs require a verified city'};
 if(ref.kind==='region'&&input.mode!=='remote')return {error:'Choose a verified city'};
 if(ref.kind==='city'&&String(input.locationCity||'').trim()!==ref.cityName)return {error:'Select the city from the verified suggestions'};
 return {display:ref.kind==='city'?ref.label:ref.label,reference:ref,city:ref.kind==='city'?ref.cityName:'',verified:ref.kind!=='worldwide'};
}
