(function(){
'use strict';
var d=document,items=[];
function fire(el){var e=d.createEvent('Event');e.initEvent('change',true,false);el.dispatchEvent(e);}
function make(id){
 var select=d.getElementById(id);if(!select)return;
 var wrap=select.parentNode,label=wrap.querySelector('label'),details=d.createElement('details'),summary=d.createElement('summary'),heading=d.createElement('span'),value=d.createElement('span'),list=d.createElement('div');
 details.className='sidebar-choice';heading.textContent=label.textContent;summary.appendChild(heading);details.appendChild(summary);value.className='sidebar-current';list.className='sidebar-options';details.appendChild(list);wrap.appendChild(details);wrap.appendChild(value);
 var signature='',search=null;
 if(id==='region'){search=d.createElement('input');search.type='search';search.className='sidebar-country-search';search.placeholder='search country';search.setAttribute('aria-label','Search country or region');search.autocomplete='off';details.insertBefore(search,list);search.addEventListener('input',filter);search.addEventListener('keydown',function(e){if(e.key==='Enter'){var visible=Array.prototype.filter.call(list.children,function(b){return !b.hidden;});if(visible.length===1){e.preventDefault();visible[0].click();}}});details.addEventListener('toggle',function(){if(!details.open){search.value='';filter();}});}
 function filter(){var q=search?search.value.trim().toLowerCase():'';Array.prototype.forEach.call(list.children,function(b){b.hidden=b.textContent.toLowerCase().indexOf(q)<0;});}
 function refresh(){
  var o=select.options[select.selectedIndex],active=!!o&&select.value!==''&&select.value!==(id==='sort'?'auto':'all');
  value.hidden=!active;value.textContent=active?'– '+o.textContent:'';
  var sig=JSON.stringify([select.value,Array.prototype.map.call(select.options,function(x){return [x.value,x.textContent];})]);
  if(sig===signature)return;signature=sig;list.textContent='';
  Array.prototype.forEach.call(select.options,function(x){var b=d.createElement('button');b.type='button';b.textContent=x.textContent;b.setAttribute('aria-pressed',String(x.value===select.value));b.addEventListener('click',function(){select.value=x.value;details.open=false;fire(select);refresh();summary.focus();});list.appendChild(b);});filter();
 }
 select.addEventListener('change',refresh);label.hidden=true;select.hidden=true;wrap.classList.add('sidebar-enhanced');items.push(refresh);refresh();
}
try{['region','work-mode','job-type','sort'].forEach(make);}catch(e){d.body.classList.add('sidebar-fallback');}
window.SOAPPTypeFilters={refresh:function(){items.forEach(function(fn){fn();});}};
var s=d.getElementById('search');if(s)s.addEventListener('input',window.SOAPPTypeFilters.refresh);
})();
