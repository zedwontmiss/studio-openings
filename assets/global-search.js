(function(root){
'use strict';
var input=document.getElementById('search'),panel=document.getElementById('global-discovery'),results=document.getElementById('global-discovery-results'),directory=document.getElementById('jobs');
if(!input||!panel||!results||!directory)return;
var kind=document.body.getAttribute('data-index-kind')||'',localSelect=document.getElementById('studio-discipline');
var sources=[{path:'/studio',name:'Studios',prefix:'/studio/',selector:'#studio-list li',heading:'h2'},{path:'/article',name:'Articles',prefix:'/article/',selector:'#editorial-list article',heading:'h2'}],last='',items=[];
function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
function matches(text,query){return norm(query).split(' ').every(function(t){return norm(text).indexOf(t)!==-1;});}
function parse(html,s){var doc=new DOMParser().parseFromString(html,'text/html'),found=[],seen={};Array.prototype.forEach.call(doc.querySelectorAll(s.selector),function(row){var a=row.querySelector('a[href]'),h=row.querySelector(s.heading);if(!a||!h)return;var p=a.getAttribute('href');if(p.indexOf(s.prefix)!==0||!/^\/(?:studio|article)\/[a-z0-9-]+$/.test(p)||seen[p])return;seen[p]=true;var description=row.querySelector('.editorial-summary')||row.querySelector('p');found.push({path:p,title:h.textContent,description:description?description.textContent:'',text:row.textContent+' '+(row.getAttribute('data-category')||'')+' '+(row.getAttribute('data-discipline')||''),kind:s.name});});return found;}
function draw(){
 if(kind){var rows=document.querySelectorAll(kind==='studio'?'#studio-list li':'#editorial-list article');Array.prototype.forEach.call(rows,function(row){var text=row.textContent+' '+(row.getAttribute('data-category')||'')+' '+(row.getAttribute('data-discipline')||'');row.hidden=!!(last&&!matches(text,last))||!!(localSelect&&localSelect.value&&row.getAttribute('data-discipline')!==localSelect.value);});}
 results.textContent='';panel.hidden=true;directory.classList.toggle('global-query-active',!!last);if(!last)return;sources.forEach(function(s){if(s.prefix==='/'+kind+'/')return;var found=items.filter(function(i){return i.kind===s.name&&matches(i.text,last);});if(!found.length)return;var group=document.createElement('div');group.className='global-result-group';var heading=document.createElement('h2');heading.textContent=s.name;group.appendChild(heading);found.forEach(function(i){var a=document.createElement('a');a.href=i.path;a.textContent=i.title;group.appendChild(a);});results.appendChild(group);panel.hidden=false;});}
sources.forEach(function(s){if(s.prefix==='/'+kind+'/')return;fetch(s.path,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw Error('Unavailable');return r.text();}).then(function(html){items=items.concat(parse(html,s));draw();}).catch(function(){/* Leave unavailable source blank; ordinary navigation still works. */});});
root.SOAPPGlobalSearch={update:function(q){q=norm(q);if(q===last)return;last=q;draw();}};
input.addEventListener('input',function(){root.SOAPPGlobalSearch.update(input.value);});
if(localSelect)localSelect.addEventListener('change',draw);
// Use the native blinking caret. Avoid opening the mobile keyboard automatically
// and do not steal focus from an incoming job deep link.
if(root.matchMedia&&root.matchMedia('(min-width: 731px) and (pointer: fine)').matches&&!root.location.search&&!root.location.hash){input.focus();}
})(window);
