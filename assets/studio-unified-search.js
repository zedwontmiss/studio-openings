(function(root){
'use strict';
var countries={AU:'Australia',CA:'Canada',IN:'India',GB:'United Kingdom',US:'United States'};
var aliases={US:['usa','united states of america'],GB:['uk','great britain','britain'],AU:[],CA:[],IN:[]};
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
function prefix(value,query){return norm(value).indexOf(norm(query))===0;}
function terms(text,q){var t=norm(text);return norm(q).split(' ').every(function(x){return t.indexOf(x)!==-1;});}
function matches(name,keys,q){
 q=norm(q);if(!q)return true;
 var parts=q.split(',').map(norm);
 if(parts.length===1&&terms(name,q))return true;
 if(parts.length>3||parts.some(function(x,i){return !x&&i!==parts.length-1;}))return false;
 return String(keys||'').split(';').some(function(key){
  var p=key.split('|');if(p.length!==3)return false;
  var country=[countries[p[0]]||p[0],p[0]].concat(aliases[p[0]]||[]);
  var levels=[country,[p[1]],[p[2]]];
  function at(i,x){return levels[i].some(function(v){return prefix(v,x);});}
  if(parts.length===1)return [0,1,2].some(function(i){return at(i,q);});
  // Ordered components must refer to the same office, not different offices.
  return [0,1].some(function(start){return start+parts.length<=3&&parts.every(function(x,i){return at(start+i,x);});});
 });
}
if(typeof module!=='undefined'&&module.exports){module.exports=matches;return;}
var d=root.document,select=d.getElementById('studio-discipline'),details=d.getElementById('studio-category'),host=d.getElementById('studio-category-options'),current=d.getElementById('studio-category-current'),fallback=d.getElementById('studio-category-fallback');
if(!select||!details||!host||!current||!fallback)return;
root.SOAPPStudioUnified={matches:function(row,q){var title=row.querySelector('h2'),hidden=row.querySelector('p');return matches((title?title.textContent:'')+' '+(hidden?hidden.getAttribute('data-aliases')||'':''),row.getAttribute('data-locations'),q);}};
function update(){Array.prototype.forEach.call(host.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-value')===select.value?'true':'false');});current.textContent=select.value?' / '+select.options[select.selectedIndex].textContent:'';if(root.SOAPPGlobalSearch)root.SOAPPGlobalSearch.refresh();}
Array.prototype.forEach.call(select.options,function(o){var b=d.createElement('button');b.type='button';b.textContent=o.value?o.textContent:'All';b.setAttribute('data-value',o.value);b.addEventListener('click',function(){select.value=o.value;update();details.open=false;details.querySelector('summary').focus();});host.appendChild(b);});
select.hidden=true;fallback.hidden=true;details.hidden=false;update();
})(typeof window!=='undefined'?window:globalThis);
