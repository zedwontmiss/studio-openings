import {placeKey} from './coverage-policy.js';
export function rankCities(cities,query,country){
  const q=placeKey(query),alias=country==='US'&&['newyork','nyc'].includes(q)?'newyorkcity':q;
  function score(city){
    const name=placeKey(city.name);
    const administrative=/\b(?:county|urban area|metropolitan|metro area|district)\b/i.test(city.name);
    return (administrative?10:0)+(name===alias?0:name===q?1:name.startsWith(q)?2:3);
  }
  return cities.filter(city=>placeKey(city.name).includes(q)||placeKey(city.name)===alias)
    .sort((a,b)=>score(a)-score(b)||b.population-a.population||a.name.localeCompare(b.name));
}
