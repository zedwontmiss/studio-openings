(function(){
'use strict';
var input=document.getElementById('search'),list=document.getElementById('scene-city-list'),filter=document.getElementById('scene-country'),current=document.getElementById('scene-country-current'),directory=document.getElementById('jobs');
if(!input||!list||!filter)return;
var country='',buttons=filter.querySelectorAll('button[data-country]'),rows=list.querySelectorAll('li'),composing=false;
function norm(s){return String(s||'').toLowerCase().replace(/[,]+/g,' ').replace(/\s+/g,' ').trim();}
function draw(){var q=norm(input.value);Array.prototype.forEach.call(rows,function(row){var text=norm(row.getAttribute('data-geography'));row.hidden=!!(country&&row.getAttribute('data-country')!==country)||!!(q&&!q.split(' ').every(function(t){return text.indexOf(t)!==-1;}));});directory.classList.toggle('global-query-active',!!q);}
function caret(){input.parentNode.classList.toggle('so-empty-focus',document.activeElement===input&&!input.value&&!composing);}
Array.prototype.forEach.call(buttons,function(b){b.addEventListener('click',function(){country=b.getAttribute('data-country');Array.prototype.forEach.call(buttons,function(x){x.setAttribute('aria-pressed',String(x===b));});current.hidden=!country;current.textContent=country?'– '+b.textContent:'';filter.open=false;draw();filter.querySelector('summary').focus();});});
try{input.value=(new URL(window.location.href).searchParams.get('q')||'').slice(0,120);}catch(e){}
input.addEventListener('input',function(){draw();caret();window.scrollTo(0,0);});input.addEventListener('focus',caret);input.addEventListener('blur',caret);input.addEventListener('compositionstart',function(){composing=true;caret();});input.addEventListener('compositionend',function(){composing=false;draw();caret();});draw();caret();
})();
