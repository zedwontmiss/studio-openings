(function(root){
'use strict';
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
var aliases={US:['us','usa','united states of america'],GB:['uk','gb','great britain','britain'],AU:['au'],CA:['ca'],IN:['in']};
function words(p){return String(p||'').split(',').map(function(x){return x.trim();});}
function hit(part,value,extra,exact){var a=norm(part);if(!a)return !exact;return [value].concat(extra||[]).some(function(v){v=norm(v);return exact?v===a:v.indexOf(a)===0;});}
function model(rows,countries){
 var places=[],seen={};
 rows.forEach(function(row){String(row).split(';').forEach(function(s){var p=s.split('|');if(p.length!==3||!countries[p[0]]||!p[2]||seen[s])return;seen[s]=true;places.push({key:s,code:p[0],values:[countries[p[0]],p[1],p[2]]});});});
 function fits(place,parts,exactLast){return parts.length<=3&&parts.every(function(part,i){return hit(part,place.values[i],i===0?[place.code].concat(aliases[place.code]||[]):[],i<parts.length-1||exactLast);});}
 function options(value){var parts=words(value),i=parts.length-1;if(i>2)return [];var found={};return places.filter(function(p){return fits(p,parts,false);}).map(function(p){return p.values[i];}).filter(function(v){if(!v||found[v])return false;found[v]=true;return true;}).sort(function(a,b){return a.localeCompare(b);}).slice(0,12);}
 function complete(value,choice){var parts=words(value),i=parts.length-1;if(i>2||options(value).indexOf(choice)<0)return null;parts[i]=choice;var canonical=places.filter(function(p){return fits(p,parts,true);})[0];if(!canonical)return null;parts=canonical.values.slice(0,i+1);return parts.join(', ')+(i<2&&places.some(function(p){return fits(p,parts,true)&&p.values[i+1];})?', ':'');}
 function matches(value,keys){var p=words(value);if(p.length===1&&!p[0])return true;if(p.length>3)return false;return places.some(function(place){return keys.split(';').indexOf(place.key)>=0&&fits(place,p,false);});}
 return {options:options,complete:complete,matches:matches};
}
if(typeof module!=='undefined'&&module.exports){module.exports=model;return;}
var d=root.document,field=d.getElementById('studio-location'),box=d.getElementById('studio-geo'),list=d.getElementById('studio-location-options'),clear=d.getElementById('studio-location-clear'),fallback=d.getElementById('studio-geo-fallback'),country=d.getElementById('studio-country');if(!field||!box||!list||!clear||!fallback||!country)return;
var countries={},rows=[];Array.prototype.forEach.call(country.options,function(o){if(o.value)countries[o.value]=o.textContent;});Array.prototype.forEach.call(d.querySelectorAll('#studio-list li'),function(row){rows.push(row.getAttribute('data-locations'));});var m=model(rows,countries),choices=[],active=-1;
function refresh(){if(root.SOAPPGlobalSearch)root.SOAPPGlobalSearch.refresh();clear.hidden=!field.value;}
function close(){choices=[];active=-1;list.hidden=true;field.setAttribute('aria-expanded','false');field.removeAttribute('aria-activedescendant');}
function highlight(){Array.prototype.forEach.call(list.children,function(o,i){o.setAttribute('aria-selected',i===active?'true':'false');});if(active>=0)field.setAttribute('aria-activedescendant','studio-geo-option-'+active);else field.removeAttribute('aria-activedescendant');}
function show(){choices=m.options(field.value);active=-1;list.textContent='';choices.forEach(function(v,i){var o=d.createElement('div');o.id='studio-geo-option-'+i;o.setAttribute('role','option');o.setAttribute('aria-selected','false');o.textContent=v;o.addEventListener('mousedown',function(e){e.preventDefault();});o.addEventListener('click',function(){choose(v);});list.appendChild(o);});list.hidden=!choices.length;field.setAttribute('aria-expanded',choices.length?'true':'false');highlight();}
function choose(v){var next=m.complete(field.value,v);if(next===null)return;field.value=next;refresh();field.focus();if(/, $/.test(next))show();else close();}
root.SOAPPStudioLocation={matches:function(keys){return m.matches(field.value,keys);}};
field.addEventListener('input',function(){refresh();show();});field.addEventListener('focus',show);field.addEventListener('blur',function(){root.setTimeout(function(){if(d.activeElement!==field)close();},180);});
field.addEventListener('keydown',function(e){if(e.isComposing||e.keyCode===229)return;var k=e.key;if(k==='Escape'){close();return;}if(k==='ArrowDown'||k==='ArrowUp'){if(!choices.length)show();if(choices.length){e.preventDefault();active=(active+(k==='ArrowDown'?1:choices.length-1)+(active<0&&k==='ArrowUp'?1:0))%choices.length;highlight();}return;}if(k==='Enter'||k===','){var opts=m.options(field.value),part=words(field.value).pop(),exact=opts.filter(function(v){return norm(v)===norm(part);}),selected=active>=0?choices[active]:exact.length===1?exact[0]:opts.length===1?opts[0]:null;if(selected){e.preventDefault();choose(selected);}else if(k==='Enter'||k===','){e.preventDefault();show();}}});
clear.addEventListener('click',function(){field.value='';refresh();field.focus();show();});fallback.hidden=true;box.hidden=false;refresh();
})(typeof window!=='undefined'?window:globalThis);
