(function(){
'use strict';
var d=document,layout=d.getElementById('type-filter-layout'),tabs=d.getElementById('type-filter-tabs'),panel=d.getElementById('type-filter-panel'),legacy=d.getElementById('legacy-filter-controls');
if(!layout||!tabs||!panel||!legacy)return;
var groups=[{id:'discipline',label:'DISCIPLINE'},{id:'region',label:'COUNTRY / REGION'},{id:'work-mode',label:'ARRANGEMENT'},{id:'job-type',label:'EMPLOYMENT'},{id:'has-pay',label:'SALARY'},{id:'sort',label:'SORT'}],open='',buttons={},signature='';
function button(label,fn){var b=d.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;}
function fire(el){var e=d.createEvent('Event');e.initEvent('change',true,false);el.dispatchEvent(e);}
function selectLabel(el){return el&&el.selectedIndex>=0?el.options[el.selectedIndex].textContent:'';}
function controls(g){return g.id==='discipline'?Array.prototype.slice.call(legacy.querySelectorAll('input[name="discipline"]')):[d.getElementById(g.id)];}
function label(g){var c=controls(g);if(g.id==='discipline'){var n=c.filter(function(x){return x.checked;}).length;return n?' / '+n:'';}if(g.id==='has-pay')return c[0].checked?' / disclosed':'';if(g.id==='sort'&&c[0].value==='auto')return ' / '+(d.getElementById('search').value.trim()?'Relevance':'Latest');return c[0].value==='all'?'':' / '+selectLabel(c[0]);}
function renderPanel(force){var g=groups.filter(function(x){return x.id===open;})[0];panel.hidden=!g;if(!g){signature='';return;}var c=controls(g),sig=JSON.stringify([open,c.map(function(x){return [x.value,x.checked,x.options?Array.prototype.map.call(x.options,function(o){return [o.value,o.textContent]}):null];})]);if(!force&&sig===signature)return;signature=sig;panel.textContent='';var head=d.createElement('div');head.className='type-filter-panel-head';var title=d.createElement('strong');title.textContent=g.label;head.appendChild(title);var close=button('×',function(){open='';refresh();buttons[g.id].focus();});close.setAttribute('aria-label','Close '+g.label.toLowerCase());head.appendChild(close);panel.appendChild(head);var grid=d.createElement('div');grid.className='type-filter-options';panel.appendChild(grid);
function option(text,selected,action){var b=button(text,action);b.setAttribute('aria-pressed',String(selected));grid.appendChild(b);}
if(g.id==='discipline'){option('All',!c.some(function(x){return x.checked;}),function(){c.forEach(function(x){x.checked=false;});if(c.length)fire(c[0]);refresh();});c.forEach(function(x){option(x.parentNode.textContent.trim(),x.checked,function(){x.checked=!x.checked;fire(x);refresh();});});}
else if(g.id==='has-pay'){[false,true].forEach(function(v){option(v?'Salary disclosed':'Any',c[0].checked===v,function(){c[0].checked=v;fire(c[0]);refresh();});});}
else Array.prototype.forEach.call(c[0].options,function(o){option(o.textContent,c[0].value===o.value,function(){c[0].value=o.value;fire(c[0]);refresh();});});
}
function refresh(){groups.forEach(function(g){var b=buttons[g.id];b.textContent=(open===g.id?'× ':'+ ')+g.label+label(g);b.setAttribute('aria-expanded',String(open===g.id));});renderPanel(false);}
groups.forEach(function(g){var b=button('',function(){open=open===g.id?'':g.id;refresh();});b.setAttribute('aria-controls','type-filter-panel');tabs.appendChild(b);buttons[g.id]=b;});
var actions=legacy.querySelector('.filter-actions');if(actions)layout.querySelector('.type-filter-content').appendChild(actions);
legacy.hidden=true;layout.hidden=false;window.SOAPPTypeFilters={refresh:refresh};refresh();
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open&&layout.contains(d.activeElement)){var old=open;open='';refresh();buttons[old].focus();}});
})();
