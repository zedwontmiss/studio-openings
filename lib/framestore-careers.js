import {vacancyExcerpt,employmentTypeOf} from './source-registry-core.js';
import {POLICY_VERSION,cityCovered} from './coverage-policy.js';

// Public board linked by https://www.framestore.com/careers. This is a
// read-only list, not candidate/application API access or republication consent.
const API='https://framestore.recruitee.com/api/offers/';
const PLACES={London:['GB','United Kingdom'],Montreal:['CA','Canada'],Mumbai:['IN','India'],Melbourne:['AU','Australia'],Chicago:['US','United States'],'Los Angeles':['US','United States'],'New York':['US','United States']};
export function normalizeFramestore(row,now=Date.now()){
 if(row.status!=='published'||!row.id||!/^[a-z0-9-]+$/.test(row.slug||''))return null;
 const title=String(row.title||'').trim();
 if(/expression of interest|freelance:|talent|work experience/i.test(title))return null;
 if(!/^(?:AI (?:Lead Artist|Supervisor)|(?:2D Lead\/\s*)?(?:2D |Compositing |Animation |Lighting )?Supervisor|Blender Generalist(?: - Visual Development Artist)?|Houdini Generalist|Creature FX TD \((?:Houdini|Maya)\)|Animator|Compositor)$/.test(title))return null;
 const place=PLACES[row.city];
 // Remote alone is not proof of eligible countries. Do not guess from office.
 if(!place||!cityCovered(place[0],row.city)||place[0]!==row.country_code||row.remote||!String(row.location||'').includes(row.city)||!String(row.location||'').includes(place[1]))return null;
 if(!Array.isArray(row.locations)||row.locations.length!==1||row.locations[0].city!==row.city||row.locations[0].country_code!==place[0])return null;
 const date=value=>Date.parse(String(value||'').replace(' UTC','Z').replace(' ','T'));
 if(row.close_at&&(!Number.isFinite(date(row.close_at))||date(row.close_at)<=now))return null;
 const url='https://framestore.recruitee.com/o/'+row.slug;
 if(row.careers_url!==url||row.careers_apply_url!==url+'/c/new')return null;
 const description=vacancyExcerpt(row.description+'\n\nRequirements\n\n'+(row.requirements||''),950);
 if(description.length<130)return null;
 const published=date(row.published_at),posted=Number.isFinite(published)&&published<=now?new Date(published).toISOString():'';
 return {id:'direct-framestore-'+row.id,title,company:'Framestore',location:row.location,
  geoCountry:place[0],geoPolicy:POLICY_VERSION,locationKind:'office',role:'motion',tags:['VFX','Motion Design'],relevance:93,
  mode:row.hybrid===true?'hybrid':row.on_site===true?'onsite':'',salary:'',
  type:employmentTypeOf(row.employment_type_code,title),posted,dateKind:posted?'posted':'added',
  description,descriptionKind:'source-excerpt',source:'Official careers · Framestore',sourceUrl:'https://www.framestore.com/careers',url,
  verifiedAt:new Date(now).toISOString(),expiresAt:new Date(Math.min(now+6*3600000,row.close_at?date(row.close_at):Infinity)).toISOString()};
}
export async function scanFramestore(fetcher=fetch,now=Date.now()){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7500);
 try{
  const response=await fetcher(API,{redirect:'manual',signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok||!String(response.headers.get('content-type')).includes('application/json'))throw Error('Framestore unavailable');
  const reader=response.body.getReader(),chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();throw Error('Board too large');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const payload=JSON.parse(new TextDecoder().decode(bytes));
  if(!Array.isArray(payload.offers)||payload.offers.length>800)throw Error('Board layout changed');
  return {jobs:payload.offers.map(row=>normalizeFramestore(row,now)).filter(Boolean),failed:[],discovered:payload.offers.length,truncated:false};
 }finally{clearTimeout(timer);}
}
