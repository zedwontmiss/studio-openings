(function(root){
  'use strict';
  var topics=[
    {id:'brand-design',label:'Brand Design',discipline:'visual',evidence:/\bbrand(?:ing)?\b/i},
    {id:'london',label:'London',city:'london',cityId:'gb--england--london'},
    {id:'architecture',label:'Architecture',discipline:'architecture'}
  ];

  function fromQuery(query){
    var label=String(query||'').toLowerCase().trim().replace(/\s+/g,' ');
    return topics.filter(function(topic){return topic.label.toLowerCase()===label;})[0];
  }

  function matchesDiscipline(topic,disciplines,text){
    return disciplines.indexOf(topic.discipline)>=0&&(!topic.evidence||topic.evidence.test(text));
  }

  var api={topics:topics,fromQuery:fromQuery,matchesDiscipline:matchesDiscipline};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SOAPPSearchTopics=api;
})(typeof window!=='undefined'?window:globalThis);
