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

  function normalize(query){
    return String(query||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
  }

  function matchesDiscipline(topic,disciplines,text){
    return disciplines.indexOf(topic.discipline)>=0&&(!topic.evidence||topic.evidence.test(text));
  }

  function create(places){
    var topics=focus.concat(places||[]);
    var byLabel=Object.create(null);
    var labels=topics.map(function(topic){
      var label=normalize(topic.label);
      if(!byLabel[label])byLabel[label]=topic;
      return label;
    });
    function fromQuery(query){
      return byLabel[normalize(query)];
    }
    function suggest(query){
      var prefix=normalize(query).replace(/[-–—]+$/,'').trim();
      if(prefix.length<2||fromQuery(prefix))return [];
      return topics.filter(function(topic,index){return labels[index].indexOf(prefix)===0;}).slice(0,4);
    }
    return {topics:topics,fromQuery:fromQuery,suggest:suggest,matchesDiscipline:matchesDiscipline};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create};
  else root.SOAPPSearchTopics=create(root.SOAPPGeographicTopics);
})(typeof window!=='undefined'?window:globalThis);
