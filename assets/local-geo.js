(function(root){
 'use strict';
 var cities=[{"slug":"chicago","city":"Chicago","country":"US","region":"Illinois"},{"slug":"london","city":"London","country":"GB","region":"England"},{"slug":"los-angeles","city":"Los Angeles","country":"US","region":"California"},{"slug":"melbourne","city":"Melbourne","country":"AU","region":"Victoria"},{"slug":"montreal","city":"Montreal","country":"CA","region":"Quebec"},{"slug":"mumbai","city":"Mumbai","country":"IN","region":"Maharashtra"},{"slug":"new-york","city":"New York","country":"US","region":"New York"}];
 function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
 function find(slug){return cities.filter(function(c){return c.slug===slug;})[0]||null;}
 var countries={US:['united states','usa','us'],GB:['united kingdom','uk','gb','england'],CA:['canada','ca'],AU:['australia','au'],IN:['india','in']};
 var regions={'new-york':['new york','ny'],'los-angeles':['california','ca'],chicago:['illinois','il'],london:['england','greater london'],montreal:['quebec','qc'],melbourne:['victoria','vic'],mumbai:['maharashtra','mh']};
 function matches(job,slug){
  var c=find(slug);if(!c||!job)return false;
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
  var countryEvidence=String(job.geoCountry||'').toUpperCase()===c.country||
    !!(ref&&String(ref.countryCode||'').toUpperCase()===c.country)||
    parts.slice(1).some(function(v){return countries[c.country].indexOf(v)>=0;});
  var regionEvidence=parts.slice(1).some(function(v){return regions[slug].indexOf(v)>=0;});
  // Reject ambiguous city+region strings such as London, Ontario.
  if(parts.length>1&&!regionEvidence&&!parts.slice(1).every(function(v){return countries[c.country].indexOf(v)>=0;}))return false;
  return countryEvidence||regionEvidence;
 }
 root.SOAPPLocalGeo={find:find,matches:matches,cities:cities};
})(typeof window!=='undefined'?window:globalThis);
