/** PlaceDB v1 public-domain geographic reference. Always verify place IDs on server.
 * https://placedb.org/docs/ — stable numeric settlement / division IDs.
 */
import {placeKey, getCountry, cityCovered} from './coverage-policy.js';
const BASE='https://api.placedb.org/v1/';
const err=s=>Object.assign(new Error(s),{status:503});
export async function fetchPlace(path,fetcher=fetch){
  const control=new AbortController();const timer=setTimeout(()=>control.abort(),8500);
  try{
    const response=await fetcher(BASE+path,{method:'GET',signal:control.signal,cf:{cacheTtl:3600,cacheEverything:true}});
    if(!response.ok)throw err('Geographic reference is temporarily unavailable');
    return await response.json();
  }catch(e){throw err('Geographic reference is temporarily unavailable');}
  finally{clearTimeout(timer);}
}
export async function regionsFor(country,fetcher){
  if(!/^[A-Z]{2}$/.test(country))throw new Error('Invalid country');
  const o=await fetchPlace('regions/'+country+'.json',fetcher);
  if(o.country!==country||!Array.isArray(o.regions))throw err('Geographic reference response invalid');
  return o.regions.filter(x=>Number.isSafeInteger(x.id)&&x.id>0&&typeof x.name==='string')
   .map(x=>({id:x.id,name:x.name,code:String(x.iso_3166_2||''),unassigned:!!x.unassigned}));
}
export async function citiesFor(country,regionId,fetcher){
  if(!/^[A-Z]{2}$/.test(country)||!Number.isSafeInteger(regionId)||regionId<=0)throw new Error('Invalid region');
  const o=await fetchPlace('cities/'+country+'/'+regionId+'.json',fetcher);
  if(o.country!==country||Number(o.region)!==regionId||!Array.isArray(o.settlements))throw err('Geographic reference response invalid');
  return o.settlements.filter(x=>Number.isSafeInteger(x.id)&&x.id>0&&typeof x.name==='string')
    .map(x=>({id:x.id,name:x.name,population:Number(x.population||0),regionId}));
}
export async function verifyCityReference(ref,fetcher){
  const cc=String(ref?.countryCode||'').toUpperCase(),rid=Number(ref?.regionId),cid=Number(ref?.cityId);
  if(!getCountry(cc))return {ok:false,error:'Country is outside current publication coverage'};
  if(!Number.isSafeInteger(rid)||!Number.isSafeInteger(cid)||rid<=0||cid<=0)return {ok:false,error:'Choose a verified city'};
  const regions=await regionsFor(cc,fetcher);
  const region=regions.find(x=>x.id===rid&&!x.unassigned);
  if(!region)return {ok:false,error:'Region is not valid for this country'};
  const cities=await citiesFor(cc,rid,fetcher);
  const city=cities.find(x=>x.id===cid);
  if(!city || placeKey(city.name)!==placeKey(ref.cityName))return {ok:false,error:'City does not match the selected region'};
  if(!cityCovered(cc,city.name))return {ok:false,error:'This city is not in active coverage. Request expansion instead.'};
  return {ok:true,country:getCountry(cc),region,city};
}
export async function verifyRequestReference(ref,fetcher){
  const cc=String(ref?.countryCode||'').toUpperCase(),rid=Number(ref?.regionId),cid=Number(ref?.cityId);
  if(!/^[A-Z]{2}$/.test(cc)||!Number.isSafeInteger(rid)||!Number.isSafeInteger(cid))return {ok:false,error:'Select a verified country, region and city'};
  const region=(await regionsFor(cc,fetcher)).find(x=>x.id===rid&&!x.unassigned);
  if(!region)return {ok:false,error:'Invalid region'};
  const city=(await citiesFor(cc,rid,fetcher)).find(x=>x.id===cid);
  if(!city)return {ok:false,error:'Invalid city'};
  return {ok:true,region,city,countryCode:cc};
}
