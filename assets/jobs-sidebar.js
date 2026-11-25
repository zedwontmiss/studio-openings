(function(){
'use strict';
var d=document,items=[];
function fire(el){var e=d.createEvent('Event');e.initEvent('change',true,false);el.dispatchEvent(e);}
function make(id){
 var select=d.getElementById(id);if(!select)return;
 var wrap=select.parentNode,label=wrap.querySelector('label'),details=d.createElement('details'),summary=d.createElement('summary'),heading=d.createElement('span'),value=d.createElement('span'),list=d.createElement('div');
 details.className='sidebar-choice';heading.textContent=label.textContent;summary.appendChild(heading);details.appendChild(summary);value.className='sidebar-current';details.appendChild(value);list.className='sidebar-options';details.appendChild(list);wrap.appendChild(details);
 var signature='';
 function refresh(){
  var o=select.options[select.selectedIndex];value.textContent=id==='sort'&&select.value==='auto'?(d.getElementById('search').value.trim()?'Relevance':'Latest'):(o?o.textContent:'');
  var sig=JSON.stringify([select.value,Array.prototype.map.call(select.options,function(x){return [x.value,x.textContent];})]);
  if(sig===signature)return;signature=sig;list.textContent='';
  Array.prototype.forEach.call(select.options,function(x){var b=d.createElement('button');b.type='button';b.textContent=x.textContent;b.setAttribute('aria-pressed',String(x.value===select.value));b.addEventListener('click',function(){select.value=x.value;details.open=false;fire(select);refresh();summary.focus();});list.appendChild(b);});
 }
 select.addEventListener('change',refresh);label.hidden=true;select.hidden=true;wrap.classList.add('sidebar-enhanced');items.push(refresh);refresh();
}
['region','work-mode','job-type','sort'].forEach(make);
window.SOAPPTypeFilters={refresh:function(){items.forEach(function(fn){fn();});}};
var s=d.getElementById('search');if(s)s.addEventListener('input',window.SOAPPTypeFilters.refresh);
})();
