(function(root){
  'use strict';
  var focus=[
    {id:'brand-design',label:'Brand Design',discipline:'visual',evidence:/\bbrand(?:ing)?\b/i},
    {id:'architecture',label:'Architecture',discipline:'architecture'},
    {id:'interior-design',label:'Interior Design',discipline:'interior'},
    {id:'industrial-design',label:'Industrial Design',discipline:'industrial'},
    {id:'product-design',label:'Product Design',discipline:'product'},
    {id:'graphic-design',label:'Graphic Design',discipline:'visual'},
    {id:'motion-design',label:'Motion Design',discipline:'motion'},
    {id:'fashion',label:'Fashion',discipline:'fashion'},
    {id:'web-design',label:'Web Design',discipline:'web'},
    {id:'museum',label:'Museum',discipline:'museum'},
    {id:'arts-and-culture',label:'Arts and Culture',discipline:'culture'}
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
    topics.forEach(function(topic){
      var label=normalize(topic.label);
      if(!byLabel[label])byLabel[label]=topic;
      byId[topic.id]=topic;
    });
    function fromQuery(query){
      return byLabel[normalize(query)];
    }
    function labels(ids){
      return ids.map(function(id){return byId[id]?byId[id].label:'';}).join(' ');
    }
    function disciplineLabels(disciplines,text){
      return focus.filter(function(topic){return matchesDiscipline(topic,disciplines,text);}).map(function(topic){return topic.label;}).join(' ');
    }
    return {topics:topics,fromQuery:fromQuery,labels:labels,disciplineLabels:disciplineLabels,matchesDiscipline:matchesDiscipline,matchesText:matchesText};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create};
  else root.SOAPPSearchTopics=create(root.SOAPPGeographicTopics);
})(typeof window!=='undefined'?window:globalThis);
