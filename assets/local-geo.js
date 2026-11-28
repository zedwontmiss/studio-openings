(function(root){
 'use strict';
 var cities=[{"id":"gb--england--bristol","slug":"bristol","city":"Bristol","country":"GB","region":"England"},{"id":"us--illinois--chicago","slug":"chicago","city":"Chicago","country":"US","region":"Illinois"},{"id":"gb--england--london","slug":"london","city":"London","country":"GB","region":"England"},{"id":"us--california--los-angeles","slug":"los-angeles","city":"Los Angeles","country":"US","region":"California"},{"id":"au--victoria--melbourne","slug":"melbourne","city":"Melbourne","country":"AU","region":"Victoria"},{"id":"ca--quebec--montreal","slug":"montreal","city":"Montreal","country":"CA","region":"Quebec"},{"id":"in--maharashtra--mumbai","slug":"mumbai","city":"Mumbai","country":"IN","region":"Maharashtra"},{"id":"us--new-york--new-york","slug":"new-york","city":"New York","country":"US","region":"New York"},{"id":"us--oregon--portland","slug":"portland","city":"Portland","country":"US","region":"Oregon"},{"id":"us--california--san-francisco","slug":"san-francisco","city":"San Francisco","country":"US","region":"California"},{"id":"ca--ontario--toronto","slug":"toronto","city":"Toronto","country":"CA","region":"Ontario"},{"id":"ca--british-columbia--vancouver","slug":"vancouver","city":"Vancouver","country":"CA","region":"British Columbia"},{"id":"ca--british-columbia--victoria","slug":"victoria","city":"Victoria","country":"CA","region":"British Columbia"}];
 function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
 function find(slug){return cities.filter(function(c){return c.slug===slug;})[0]||null;}
 var countries={US:['united states','usa','us'],GB:['united kingdom','uk','gb','england'],CA:['canada','ca'],AU:['australia','au'],IN:['india','in']};
 var regions={bristol:['england','bristol'],'new-york':['new york','ny'],'los-angeles':['california','ca'],chicago:['illinois','il'],london:['england','greater london'],montreal:['quebec','qc'],melbourne:['victoria','vic'],mumbai:['maharashtra','mh'],'san-francisco':['california','ca'],portland:['oregon','or'],toronto:['ontario','on'],vancouver:['british columbia','bc'],victoria:['british columbia','bc']};
 function matches(job,scope){
  if(!scope||!job)return false;
  var c=typeof scope==='string'?find(scope):cities.filter(function(city){return city.id===scope.cityId;})[0]||scope;
  if(!c)return false;
  var location=normalize(job.location),kind=normalize(job.locationKind),mode=normalize(job.mode);
  if(kind==='eligibility'||mode==='remote'||/\b(?:remote|worldwide|global|eligible)\b/.test(location))return false;
  var ref=job.locationReference;
  if(ref&&ref.countryCode&&String(ref.countryCode).toUpperCase()!==c.country)return false;
  if(job.geoCountry&&String(job.geoCountry).toUpperCase()!==c.country)return false;
  var parts=location.split(/[,]/).map(function(v){return v.trim();});
  var aliases=c.slug==='new-york'?['new york','new york city','nyc']:[normalize(c.city)];
  if(aliases.indexOf(parts[0])<0)return false;
  // An exact city plus independently reported country or a recognized region
  // is required. Do not treat a mention in employer, title or description as geography.
  // Reject conflicting country/region tokens even if another token agrees.
  var regionTokens=regions[c.slug]||[normalize(c.region)];
  var countryTokens=countries[c.country]||[normalize(c.countryName),normalize(c.country)];
  var tail=parts.slice(1),allowed=countryTokens.concat(regionTokens);
  if(tail.some(function(v){return allowed.indexOf(v)<0;}))return false;
  // CA alone is ambiguous between California and Canada; require country evidence.
  if(c.country==='US'&&tail.length===1&&tail[0]==='ca'&&!job.geoCountry&&!(ref&&ref.countryCode))return false;
  var countryEvidence=String(job.geoCountry||'').toUpperCase()===c.country||
    !!(ref&&String(ref.countryCode||'').toUpperCase()===c.country)||
    parts.slice(1).some(function(v){return countryTokens.indexOf(v)>=0;});
  var regionEvidence=parts.slice(1).some(function(v){return regionTokens.indexOf(v)>=0;});
  // Reject ambiguous city+region strings such as London, Ontario.
  if(parts.length>1&&!regionEvidence&&!parts.slice(1).every(function(v){return countryTokens.indexOf(v)>=0;}))return false;
  return countryEvidence||regionEvidence;
 }
 function cityId(job){var found=cities.filter(function(c){return matches(job,c.slug);});return found.length===1?found[0].id:null;}
 root.SOAPPLocalGeo={find:find,matches:matches,cityId:cityId,cities:cities};
})(typeof window!=='undefined'?window:globalThis);
