/* Private, dependency-free Production D1 readiness interface. */
(function(){'use strict';
 var key='',locked=false;
 function $(x){return document.getElementById(x);}
 function message(s){$('message').textContent=s;}
 function request(method,body){
  return fetch('/api/launch-readiness',{method:method,cache:'no-store',credentials:'omit',headers:{'authorization':'Bearer '+key,'content-type':'application/json'},body:method==='POST'?JSON.stringify(body):undefined})
   .then(function(res){return res.json().then(function(data){if(!res.ok)throw Error(data.error||'Database access failed');return data;});});
 }
 function render(data){
  $('report').hidden=false;$('status').textContent=data.ready?'READY':'CHECK REQUIRED';$('summary').textContent=data.message||'Check the table details.';
  var list=$('tables');list.textContent='';
  Object.keys(data.detail||{}).forEach(function(name){
   var row=document.createElement('div');row.className='record';row.style.padding='11px 0';
   var info=document.createElement('div'),head=document.createElement('strong');head.textContent=name;info.appendChild(head);
   var d=document.createElement('p');d.className='hint';
   var item=data.detail[name];d.textContent=!item.present?'Missing table':item.missingColumns.length?'Missing columns: '+item.missingColumns.join(', '):'Compatible';
   info.appendChild(d);row.appendChild(info);list.appendChild(row);
  });
  $('upgrade').hidden=!data.canInitialize;
  $('ack').checked=false;$('install').disabled=true;
 }
 $('check').addEventListener('click',function(){
  if(locked)return;key=$('key').value.trim();if(!key){message('Enter the Production operator secret.');return;}
  locked=true;$('check').disabled=true;message('Checking Production database…');
  request('GET').then(function(data){render(data);message('Inspection completed. No database changes made.');},function(err){$('report').hidden=true;message(err.message+' Verify Production operator secret and JOBS_DB binding.');})
   .then(function(){locked=false;$('check').disabled=false;});
 });
 $('ack').addEventListener('change',function(){$('install').disabled=!$('ack').checked;});
 $('install').addEventListener('click',function(){
  if(locked||!$('ack').checked)return;
  if(!window.confirm('Create the missing job_orders table in Production D1? This does not alter existing tables or record payments.'))return;
  locked=true;$('install').disabled=true;message('Creating the missing Production table…');
  request('POST',{confirm:'create-missing-job-orders-on-production'}).then(function(data){render(data);message(data.changed?'Table created and verified. Production schema ready.':'Production schema already ready.');},function(err){message('Setup not confirmed: '+err.message);})
   .then(function(){locked=false;});
 });
})();