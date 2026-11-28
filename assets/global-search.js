(function(root){
'use strict';
var input=document.getElementById('search'),panel=document.getElementById('global-discovery'),results=document.getElementById('global-discovery-results'),directory=document.getElementById('jobs');
if(!input||!directory)return;
var kind=document.body.getAttribute('data-index-kind')||'',localSelect=document.getElementById('studio-discipline'),country=document.getElementById('studio-country'),city=document.getElementById('studio-city');
if(!kind&&(!panel||!results))return;
var sources=[{path:'/studio',name:'Studios',prefix:'/studio/',selector:'#studio-list li',heading:'h2'},{path:'/article',name:'Articles',prefix:'/article/',selector:'#editorial-list article',heading:'h2'}],last='',items=[];
var pendingSources=kind?0:sources.length,unavailableSources=0,jobsStatus='loading',jobCount=0;
var searchShell=input.parentNode,composing=false;
var empty=document.createElement('div'),message=document.createElement('span'),clear=document.createElement('button');
empty.className='search-empty-message';
message.setAttribute('role','status');
empty.hidden=true;
clear.type='button';
clear.textContent='Clear search';
clear.addEventListener('click',function(){
 input.focus();
 input.value='';
 input.dispatchEvent(new Event('input',{bubbles:true}));
});
empty.appendChild(message);
empty.appendChild(clear);
searchShell.parentNode.insertBefore(empty,searchShell.nextSibling);

function drawFeedback(feedback){
 var text=last&&!composing?feedback:'';
 empty.hidden=!text;
 if(text!==message.textContent)message.textContent=text;
}

// Synthetic placements exist only on the exact owner-review hostname.
// Never add these to the generated registry, editorial feed or public search data.
var demoHost=root.location.hostname==='development.studio-openings.pages.dev';
var demos=[{kind:'Studios',title:'Example Studio',text:'Example Studio design architecture preview',discipline:'architecture',path:'/studio?demo=featured'},{kind:'Articles',title:'The future of independent design studios.',text:'The future of independent design studios. Example Studio architecture design preview',path:'/article?demo=featured'}];
function decorateDemo(a,title){a.className+=' so-sponsored-title';a.textContent=title;var sup=document.createElement('sup');sup.className='so-sponsored-marker';sup.textContent='(*)';sup.setAttribute('aria-label','Sponsored placement demonstration');sup.title='Sponsored placement demonstration (fictional)';a.appendChild(sup);}
function addDemoRow(){if(!demoHost||!kind)return;var i=demos[kind==='studio'?0:1],host=document.getElementById(kind==='studio'?'studio-list':'editorial-list');if(!host)return;var row=document.createElement(kind==='studio'?'li':'article');row.setAttribute('data-demo-placement','true');row.setAttribute('data-discipline',i.discipline||'');row.setAttribute('data-category','Studio');if(kind==='article')row.className='editorial-card';var h=document.createElement('h2'),a=document.createElement('a');a.href=i.path;decorateDemo(a,i.title);if(kind==='studio'){a.className+=' studio-profile-link';a.textContent='';decorateDemo(h,i.title);a.appendChild(h);row.appendChild(a);}else{h.appendChild(a);row.appendChild(h);var time=document.createElement('time');time.textContent='Preview only';row.appendChild(time);}var p=document.createElement('p');p.hidden=true;p.textContent=i.text;row.appendChild(p);host.insertBefore(row,kind==='studio'?host.children[4]||null:host.firstChild);a.addEventListener('click',function(e){e.preventDefault();root.alert('Fictional sponsored placement for design review only. No commercial relationship or live article.');});}
if(demoHost){if(kind)addDemoRow();else items=items.concat(demos.map(function(i){return {path:i.path,title:i.title,text:i.text,kind:i.kind,demo:true};}));}

var sponsoredPaths={};
function markSponsored(node){if(node.getAttribute('data-real-sponsor'))return;node.setAttribute('data-real-sponsor','true');node.className+=' so-sponsored-title';var mark=document.createElement('sup');mark.className='so-sponsored-marker';mark.textContent='(*)';mark.setAttribute('aria-label','Paid sponsored placement');mark.title='Paid sponsored placement';node.appendChild(mark);}
function markStudioRows(){if(kind!=='studio')return;Array.prototype.forEach.call(document.querySelectorAll('#studio-list a[href]'),function(a){if(sponsoredPaths[a.getAttribute('href')])markSponsored(a.querySelector('h2')||a);});}
if(demoHost)fetch('/api/sponsored-studios',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json();}).then(function(d){(d.placements||[]).forEach(function(p){if(/^\/studio\/[a-z0-9-]+$/.test(p.path))sponsoredPaths[p.path]=true;});markStudioRows();draw();}).catch(function(){});
function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
function matches(text,ids,query){
 var catalog=root.SOAPPSearchTopics;
 return catalog.matchesText(text+' '+catalog.labels(ids||[]),query);
}
function rowTopics(row){return (row.getAttribute('data-topics')||'').split(/\s+/);}
// Homepage previews only: matched highlights first, then title relevance.
// Stable original order breaks ties; never promote an unrelated sponsorship.
function previewMatches(items,kind,query,sponsoredPaths){
 var q=norm(query),tokens=q.split(' ');
 if(!q)return [];
 return items.filter(function(i){return i.kind===kind&&matches(i.text,i.topicIds,q);}).map(function(i,index){
  var title=norm(i.title),score=title===q?1000:title.indexOf(q)===0?500:title.indexOf(q)!==-1?250:0;
  tokens.forEach(function(t){if(title.indexOf(t)!==-1)score+=10;});
  return {item:i,index:index,highlight:i.demo||sponsoredPaths[i.path]?1:0,score:score};
 }).sort(function(a,b){return b.highlight-a.highlight||b.score-a.score||a.index-b.index;}).slice(0,5).map(function(r){return r.item;});
}
function parse(html,s){var doc=new DOMParser().parseFromString(html,'text/html'),found=[],seen={};Array.prototype.forEach.call(doc.querySelectorAll(s.selector),function(row){var a=row.querySelector('a[href]'),h=row.querySelector(s.heading);if(!a||!h)return;var p=a.getAttribute('href');if(p.indexOf(s.prefix)!==0||!/^\/(?:studio|article)\/[a-z0-9-]+$/.test(p)||seen[p])return;seen[p]=true;var description=row.querySelector('.editorial-summary')||row.querySelector('p');found.push({path:p,title:h.textContent,description:description?description.textContent:'',topicIds:rowTopics(row),text:row.textContent+' '+(row.getAttribute('data-category')||'')+' '+(row.getAttribute('data-discipline')||''),kind:s.name});});return found;}
function locationMatches(row){var locations=(row.getAttribute('data-locations')||'').split(';');return locations.some(function(loc){return (!country||!country.value||loc.split('|')[0]===country.value)&&(!city||!city.value||loc===city.value);});}
function draw(){
 directory.classList.toggle('global-query-active',!!last);
 if(kind){
  var magazine=document.getElementById('editorial-magazine');
  if(magazine)magazine.hidden=!!last;
  var rows=document.querySelectorAll(kind==='studio'?'#studio-list li':'#editorial-list article'),visible=0;
  var studioSearch=kind==='studio'&&root.SOAPPStudioUnified;
  Array.prototype.forEach.call(rows,function(row){
   var text=row.textContent+' '+(row.getAttribute('data-category')||'')+' '+(row.getAttribute('data-discipline')||'');
   // Comma-delimited locations must still match one verified office.
   var matched=!last||(studioSearch&&studioSearch.matches(row,last))||
    ((!studioSearch||last.indexOf(',')===-1)&&matches(text,rowTopics(row),last));
   var discipline=localSelect&&localSelect.value;
   row.hidden=!matched||(kind==='studio'&&!locationMatches(row))||!!(discipline&&(row.getAttribute('data-discipline')||'').split(/\s+/).indexOf(discipline)===-1);
   if(!row.hidden)visible++;
  });
  drawFeedback(visible?'':kind==='studio'?'No studios found.':'No articles found.');
  return;
 }
 results.textContent='';
 panel.hidden=true;
 if(last)sources.forEach(function(s){
  var found=previewMatches(items,s.name,last,sponsoredPaths);
  if(!found.length)return;
  var group=document.createElement('div'),heading=document.createElement('h2');
  group.className='global-result-group';
  heading.textContent=s.name;
  group.appendChild(heading);
  found.forEach(function(i){
   var a=document.createElement('a');
   a.href=i.path;
   if(i.demo)decorateDemo(a,i.title);
   else{
    a.textContent=i.title;
    if(sponsoredPaths[i.path])markSponsored(a);
   }
   group.appendChild(a);
  });
  results.appendChild(group);
  panel.hidden=false;
 });
 var settled=jobsStatus!=='loading'&&!pendingSources;
 var feedback='';
 if(settled&&!jobCount&&panel.hidden){
  feedback=jobsStatus==='error'||unavailableSources?'Some results are temporarily unavailable.':'No results found.';
 }
 drawFeedback(feedback);
}
if(!kind)sources.forEach(function(s){
 var studio=s.name==='Studios';
 fetch(studio?'/assets/studio-search.json':s.path,{credentials:'same-origin'}).then(function(r){
  if(!r.ok)throw Error('Unavailable');
  return studio?r.json():r.text();
 }).then(function(data){
  var found=studio?data.filter(function(i){
   return /^\/studio\/[a-z0-9-]+$/.test(i.path)&&typeof i.title==='string'&&typeof i.text==='string';
  }).map(function(i){
   return {path:i.path,title:i.title,text:i.text,topicIds:i.topicIds,kind:s.name};
  }):parse(data,s);
  items=items.concat(found);
 }).catch(function(){unavailableSources++;}).then(function(){pendingSources--;draw();});
});
root.SOAPPGlobalSearch={
 refresh:draw,
 update:function(q,count,status){
  q=norm(q);
  if(kind){count=jobCount;status=jobsStatus;}
  if(q===last&&count===jobCount&&status===jobsStatus)return;
  last=q;
  jobCount=count;
  jobsStatus=status;
  draw();
 }
};
if(kind){
 function localSearch(){var q=input.value;root.SOAPPGlobalSearch.update(q);Array.prototype.forEach.call(document.querySelectorAll('.so-primary a'),function(link){var url=new URL(link.href,root.location.href);if(q.trim())url.searchParams.set('q',q.trim().slice(0,120));else url.searchParams.delete('q');link.href=url.pathname+url.search;});}
 try{input.value=(new URL(root.location.href).searchParams.get('q')||'').slice(0,120);}catch(e){}
 localSearch();input.addEventListener('input',function(){localSearch();root.scrollTo(0,0);});
}
if(localSelect)localSelect.addEventListener('change',draw);
if(country&&city){country.addEventListener('change',function(){city.value='';Array.prototype.forEach.call(city.options,function(o){o.hidden=!!(o.value&&country.value&&o.getAttribute('data-country')!==country.value);o.disabled=o.hidden;});draw();});city.addEventListener('change',draw);}
// Preserve the resting placeholder until the user focuses the field.
// A thicker decorative caret is used only while empty; native editing remains intact.
function syncSearchCaret(){if(!searchShell||!searchShell.classList)return;searchShell.classList.toggle('so-empty-focus',document.activeElement===input&&!input.value&&!composing);}
input.addEventListener('focus',syncSearchCaret);
input.addEventListener('blur',syncSearchCaret);
input.addEventListener('input',syncSearchCaret);
input.addEventListener('compositionstart',function(){composing=true;syncSearchCaret();draw();});
input.addEventListener('compositionend',function(){composing=false;syncSearchCaret();draw();});
root.addEventListener('focus',syncSearchCaret);
syncSearchCaret();
})(window);
