import {SUPPORTED_COUNTRIES,cityCovered,placeKey,getCountry} from '../../lib/coverage-policy.js';
import {fetchPlace,regionsFor,citiesFor} from '../../lib/place-provider.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':status===200?'public, max-age=300':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){
  const u=new URL(request.url);const kind=u.searchParams.get('kind'),requested=u.searchParams.get('purpose'),purpose=requested==='source'?'source':requested==='request'?'request':'employer';
  if(purpose==='source'){
    const key=String(env?.OPERATOR_ACCESS_TOKEN||'');
    if(key.length<32||request.headers.get('authorization')!=='Bearer '+key)return json({error:'Operator access required'},401);
  }
  const country=String(u.searchParams.get('country')||'').toUpperCase();
  try{
    if(kind==='countries'){
      // Same high-value market allowlist for employers and expansion requests.
      // Geography validity alone does not make a market actively supported.
      if(purpose==='source')return json({countries:(await fetchPlace('countries.json')).countries.map(x=>({code:x.code,name:x.name}))});
      return json({countries:SUPPORTED_COUNTRIES});
    }
    if(!/^[A-Z]{2}$/.test(country)||(purpose!=='source'&&!getCountry(country)))return json({error:'Country not supported'},422);
    if(kind==='regions')return json({regions:(await regionsFor(country)).filter(x=>!x.unassigned)});
    if(kind==='cities'){
      const region=Number(u.searchParams.get('region'));
      const q=placeKey(u.searchParams.get('q')||'');
      if(!Number.isSafeInteger(region)||region<=0||q.length<2||q.length>65)return json({error:'Choose a region and enter at least 2 characters'},422);
      // Verify the region belongs to the country before fetching the settlement file.
      const valid=(await regionsFor(country)).some(x=>x.id===region&&!x.unassigned);
      if(!valid)return json({error:'Invalid region for country'},422);
      const cities=(await citiesFor(country,region)).filter(x=>purpose==='request'||purpose==='source'||cityCovered(country,x.name));
      const ranked=cities.filter(x=>placeKey(x.name).includes(q)).sort((a,b)=>{
        const ap=placeKey(a.name).startsWith(q)?0:1,bp=placeKey(b.name).startsWith(q)?0:1;
        return ap-bp||b.population-a.population||a.name.localeCompare(b.name);
      });
      return json({cities:ranked.slice(0,24).map(x=>({id:x.id,name:x.name})),matches:ranked.length});
    }
    return json({error:'Invalid lookup'},422);
  }catch(e){return json({error:'Geographic reference is temporarily unavailable. Try again later.'},503);}
}
