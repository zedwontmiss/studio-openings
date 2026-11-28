(function(root){
  'use strict';
  var focus=[
    {id:'brand-design',label:'Brand Design',discipline:'visual',evidence:/\bbrand(?:ing)?\b/i},
    {id:'architecture',label:'Architecture',discipline:'architecture',guideQuery:'Architecture & Landscape'},
    {id:'interior-design',label:'Interior Design',discipline:'interior',guideQuery:'Interior & Spatial Design'},
    {id:'industrial-design',label:'Industrial Design',discipline:'industrial',guideQuery:'Industrial & Furniture Design'},
    {id:'product-design',label:'Product Design',discipline:'product',guideQuery:'Product Design & UX'},
    {id:'graphic-design',label:'Graphic Design',discipline:'visual',guideQuery:'Graphic, Branding & Art Direction'},
    {id:'motion-design',label:'Motion Design',discipline:'motion',guideQuery:'Motion, 3D & Animation'},
    {id:'fashion',label:'Fashion',discipline:'fashion',guideQuery:'Fashion & Photography'},
    {id:'web-design',label:'Web Design',discipline:'web',guideQuery:'Web Design & Creative Technology'},
    {id:'museum',label:'Museum',discipline:'museum',guideQuery:'Museum & Exhibition Design'},
    {id:'arts-and-culture',label:'Arts and Culture',discipline:'culture',guideQuery:'Arts & Cultural Production'}
  ];
  var editorial=[
    {id:'job-search',label:'Job Search'},
    {id:'remote',label:'Remote'},
    {id:'portfolio',label:'Portfolio'},
    {id:'studio-careers',label:'Studio Careers'}
  ];

  function normalize(query){
    return String(query||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
  }

  function guideKey(normalizedQuery){
    return normalizedQuery.replace(/[,/&]|\band\b/g,' ').replace(/\s+/g,' ').trim();
  }

  function matchesDiscipline(topic,disciplines,text){
    return disciplines.indexOf(topic.discipline)>=0&&(!topic.evidence||topic.evidence.test(text));
  }

  function matchesText(text,query){
    var hay=normalize(text);
    var terms=normalize(query).replace(/(\S)[-–—]+$/,'$1').split(' ');
    return terms.every(function(term){return hay.indexOf(term)!==-1;});
  }

  function create(places){
    var topics=focus.concat(editorial,places||[]);
    var byLabel=Object.create(null),byId=Object.create(null);
    var byGuideQuery=Object.create(null),byGuidePrefix=Object.create(null),queryByDiscipline=Object.create(null);
    function addGuidePrefixes(phrase,topic){
      var firstSpace=phrase.indexOf(' ');
      if(firstSpace<0)return;
      for(var end=firstSpace;end<phrase.length;end++){
        var prefix=phrase.slice(0,end).trim();
        var previous=byGuidePrefix[prefix];
        // An ambiguous prefix should fall through to ordinary search.
        if(previous!==topic)byGuidePrefix[prefix]=previous===undefined?topic:null;
      }
    }
    topics.forEach(function(topic){
      var label=normalize(topic.label);
      if(!byLabel[label])byLabel[label]=topic;
      byId[topic.id]=topic;
      if(topic.guideQuery){
        var guide=normalize(topic.guideQuery);
        var key=guideKey(guide);
        byGuideQuery[key]=topic;
        queryByDiscipline[topic.discipline]=topic.guideQuery;
        addGuidePrefixes(key,topic);
        addGuidePrefixes(normalize(guide.replace(/[,/]/g,' ').replace(/&/g,' and ')),topic);
      }
    });
    function fromQuery(query){
      var normalized=normalize(query);
      var key=guideKey(normalized);
      var exact=byLabel[normalized]||byGuideQuery[key];
      // Single words can still match titles, employers and locations as usual.
      if(exact||!/[ ,/&]/.test(normalized))return exact;
      return byGuidePrefix[key]||undefined;
    }
    function disciplineQuery(discipline){
      return queryByDiscipline[discipline];
    }
    function labels(ids){
      return ids.map(function(id){return byId[id]?byId[id].label:'';}).join(' ');
    }
    function disciplineLabels(disciplines,text){
      return focus.filter(function(topic){return matchesDiscipline(topic,disciplines,text);}).map(function(topic){return topic.label;}).join(' ');
    }
    return {topics:topics,fromQuery:fromQuery,disciplineQuery:disciplineQuery,labels:labels,disciplineLabels:disciplineLabels,matchesDiscipline:matchesDiscipline,matchesText:matchesText};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create};
  else root.SOAPPSearchTopics=create(root.SOAPPGeographicTopics);
})(typeof window!=='undefined'?window:globalThis);
