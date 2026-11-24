(function(root){
  'use strict';
  var keys=['filters','discipline','q','city','region','type','mode','pay','sort','tag','match'];
  function choice(value,allowed,fallback){return allowed.indexOf(value)>=0?value:fallback;}
  function unique(values,max,length){return values.filter(function(x,i,a){return typeof x==='string'&&x.length>0&&x.length<=length&&a.indexOf(x)===i;}).slice(0,max);}
  function read(href,roles,countries){
    var params=new URL(href).searchParams;
    if(!keys.some(function(key){return params.has(key);}))return null;
    var requestedDiscipline=params.getAll('discipline').join(',').split(',');
    var region=params.get('region')||'all';
    return {
      selectedRoles:unique(requestedDiscipline.filter(function(role){return roles.indexOf(role)>=0;}),10,20),
      city:root.SOAPPLocalGeo&&root.SOAPPLocalGeo.find(params.get('city'))?params.get('city'):'',
      query:(params.get('q')||'').replace(/\s+/g,' ').trim().slice(0,120),
      region:choice(region,['all','worldwide'].concat(countries),'all'),
      type:choice(params.get('type'),['full-time','part-time','contract','internship'],'all'),
      mode:choice(params.get('mode'),['remote','hybrid','onsite'],'all'),
      hasPay:params.get('pay')==='1',
      sort:choice(params.get('sort'),['newest','az','company'],'relevant'),
      keywords:unique(params.getAll('tag'),15,35),
      keywordMatch:params.get('match')==='all'?'all':'any'
    };
  }
  function build(href,state){
    // Share only deliberate filters; never forward job IDs, tracking parameters,
    // private Saved state or arbitrary query strings from the current address.
    var url=new URL('/',href),p=url.searchParams;p.set('filters','1');
    if(state.selectedRoles.length)p.set('discipline',state.selectedRoles.join(','));
    if(state.query)p.set('q',state.query.slice(0,120));
    ['region','type','mode'].forEach(function(key){if(state[key]!=='all')p.set(key,state[key]);});
    if(state.hasPay)p.set('pay','1');
    if(['newest','az','company'].indexOf(state.sort)>=0)p.set('sort',state.sort);
    if(state.city&&root.SOAPPLocalGeo&&root.SOAPPLocalGeo.find(state.city))p.set('city',state.city);
    unique(state.keywords||[],15,35).forEach(function(tag){p.append('tag',tag);});
    if((state.keywords||[]).length&&state.keywordMatch==='all')p.set('match','all');
    url.hash='jobs';return url.href;
  }
  function clear(href){var url=new URL(href);keys.forEach(function(key){url.searchParams.delete(key);});return url.href;}
  root.StudioOpeningFilterLinks={read:read,build:build,clear:clear};
})(window);
