/** Studio Openings v0.6.1 — native employer submissions, review before publish.
 * Offline preview can prepare downloadable JSON but cannot send to Cloudflare.
 */
(function(){
 'use strict';
 function $(id){return document.getElementById(id);}
 var panel=$('submission-panel'), backdrop=$('submission-backdrop'),form=$('submission-form');
 if(!panel||!form)return;
 var mode='employer',lastFocus=null,configuration=null,widgetId=null,token='',lastPrepared=null;
 var draftKey='studio-openings.drafts.v061',preview=window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:';
 var turnstileScript;
 function message(s,error){var el=$('submission-error');el.textContent=s;el.className='submission-error'+(error?'':' submission-ok');el.hidden=!s;}
 function setMode(next){
   mode=next==='suggest'?'suggest':'employer';
   ['employer','suggest'].forEach(function(k){$('mode-'+k).classList.toggle('active',mode===k);$('mode-'+k).setAttribute('aria-pressed',String(mode===k));});
   if(mode==='suggest'){var radio=form.querySelector('input[name=applicationMethod][value=external]');if(radio)radio.checked=true;}
   updateApplicationMethod();
   $('submission-permission-text').textContent=mode==='employer'?'I represent the hiring organization, or have permission to submit this vacancy for review.':'This is a public vacancy and I have permission to suggest its original application link for review.';
 }
 function setSending(enabled){$('submission-send').disabled=!enabled;$('submission-send').textContent=(preview||!configuration?.enabled)?'Prepare offline request':'Send for review';}
 function loadTurnstile(){
   if(window.turnstile)return Promise.resolve(window.turnstile);
   if(turnstileScript)return turnstileScript;
   turnstileScript=new Promise(function(resolve,reject){
     var script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
     script.onload=function(){if(window.turnstile)resolve(window.turnstile);else reject(Error('Turnstile did not load'));};
     script.onerror=function(){reject(Error('Turnstile could not load. Check your connection.'));};
     document.head.appendChild(script);
   });return turnstileScript;
 }
 async function initializeConfig(){
   setSending(false);
   if(preview){$('submission-connection').textContent='Offline review — form data stays on your device. No request is sent.';setSending(true);return;}
   $('submission-connection').textContent='Checking secure submissions…';
   try {
     var response=await fetch('/api/submission-config',{credentials:'omit',cache:'no-store'});
     if(!response.ok)throw Error('Endpoint not available');
     configuration=await response.json();
     if(!configuration.enabled||!configuration.siteKey)throw Error('Cloudflare submission settings are not yet active.');
     if(!configuration.nativeApplyEnabled){var nativeChoice=form.querySelector('input[name=applicationMethod][value=native]');if(nativeChoice)nativeChoice.disabled=true;var externalChoice=form.querySelector('input[name=applicationMethod][value=external]');if(externalChoice)externalChoice.checked=true;updateApplicationMethod();}
     await loadTurnstile();
     token='';
     if(widgetId!==null){window.turnstile.remove(widgetId);widgetId=null;}
     widgetId=window.turnstile.render('#turnstile-container',{
       sitekey:configuration.siteKey,action:'submit_job',theme:'light',appearance:'interaction-only',
       callback:function(t){token=t;message('');},'expired-callback':function(){token='';},
       'error-callback':function(){token='';message('Verification could not complete. Try again.',true);}
     });
     $('submission-connection').textContent='Secure submission is available. Verification is required before sending.';
     setSending(true);
   }catch(e){configuration=null;$('submission-connection').textContent='Online submissions are not ready: '+(e.message||'configuration unavailable')+'. You can download a request instead.';setSending(true);}
 }
 function open(){
   if(!panel.hidden)return;
   if(!$('job-drawer').hidden)$('drawer-close').click();
   lastFocus=document.activeElement;
   panel.hidden=false;backdrop.hidden=false;document.body.classList.add('submission-open');
   form.hidden=false;$('submission-result').hidden=true;message('');$('submission-close').focus();
   initializeConfig();
 }
 function close(){
   panel.hidden=true;backdrop.hidden=true;document.body.classList.remove('submission-open');
   if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
 }
 function urlHttps(v){
   try{var u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)?u.href:'';}
   catch{return '';}
 }
 function updateApplicationMethod(){
   var selected=form.querySelector('input[name=applicationMethod]:checked');
   var method=mode==='suggest'?'external':(selected?selected.value:'native');
   if(mode==='suggest')form.querySelectorAll('input[name=applicationMethod]').forEach(function(el){el.disabled=true;});
   else form.querySelectorAll('input[name=applicationMethod]').forEach(function(el){el.disabled=(el.value==='native'&&!preview&&configuration&&configuration.nativeApplyEnabled===false);});
   $('method-native').hidden=method!=='native';
   $('method-email').hidden=method!=='email';
   $('method-external').hidden=method!=='external';
   return method;
 }
 function collect(){
   var f=new FormData(form),v=function(k){return String(f.get(k)||'').trim();};
   return {schema:'studio-openings-submission-v1',kind:mode,applicationMethod:updateApplicationMethod(),applicationEmail:v('applicationEmail'),title:v('title'),company:v('company'),location:v('location'),mode:v('mode'),type:v('type'),role:v('role'),url:urlHttps(v('url')),companyWebsite:v('companyWebsite')?urlHttps(v('companyWebsite')):'',contactEmail:v('contactEmail'),salary:v('salary'),closesOn:v('closesOn'),eligibility:v('eligibility'),description:v('description'),permissionChecked:f.get('permission')==='on'};
 }
 function validate(data){
   if(data.title.length<3||!data.company||!data.location||!data.mode||!data.role)return 'Complete all required job details.';
   if(data.applicationMethod==='external'&&!data.url)return 'Use a public HTTPS job application URL.';
   if(data.applicationMethod==='email'&&!/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(data.applicationEmail))return 'Enter a receiving email for applications.';
   if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(data.contactEmail))return 'Enter a valid contact email.';
   if(!data.permissionChecked)return 'Please confirm the submission declaration.';
   if(data.closesOn&&data.closesOn<new Date().toISOString().slice(0,10))return 'The closing date cannot be in the past.';
   return '';
 }
 function download(data){
   if(!data)return;
   var copy=Object.assign({},data);delete copy.turnstileToken;
   var url=URL.createObjectURL(new Blob([JSON.stringify(copy,null,2)+'\n'],{type:'application/json'}));
   var a=document.createElement('a');a.href=url;a.download='studio-openings-submission.json';document.body.appendChild(a);a.click();a.remove();
   setTimeout(function(){URL.revokeObjectURL(url);},1200);
 }
 function localSave(record){
   try{var arr=JSON.parse(localStorage.getItem(draftKey)||'[]');if(!Array.isArray(arr))arr=[];arr.push(record);localStorage.setItem(draftKey,JSON.stringify(arr.slice(-10)));return true;}
   catch{return false;}
 }
 function result(heading,description,offline,reference){
   $('submission-result').hidden=false;form.hidden=true;
   $('submission-result-heading').textContent=heading;
   $('submission-result-copy').textContent=description;
   $('submission-result-reference').textContent=reference?'Reference '+reference:'';
   $('submission-download').hidden=!offline;
 }
 async function send(e){
   e.preventDefault();
   var data=collect(),error=validate(data);if(error){message(error,true);return;}
   lastPrepared=data;
   if(preview||!configuration?.enabled){
     localSave(data);
     result('Offline request prepared — not sent','This is a local review. Download the request JSON; your information has not reached Studio Openings.',true,'');
     return;
   }
   if(!token){message('Complete the Turnstile verification before sending.',true);return;}
   $('submission-send').disabled=true;$('submission-send').textContent='Sending…';message('');
   try {
     var response=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(Object.assign({},data,{turnstileToken:token}))});
     var payload=await response.json();
     if(!response.ok||!payload.ok)throw Error(payload.message||'Submission failed');
     result('Submitted for review', 'Your listing was received. It is pending manual approval and is not public yet.',false,payload.reference);
   }catch(err){
     message((err.message||'Could not submit')+' — nothing was published. You can retry or save a local draft.',true);
     if(widgetId!==null&&window.turnstile){window.turnstile.reset(widgetId);token='';}
   }finally{setSending(true);}
 }
 function newSubmission(){form.reset();form.hidden=false;lastPrepared=null;token='';$('submission-result').hidden=true;setMode('employer');message('');if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);}
 $('nav-submit').addEventListener('click',function(e){e.preventDefault();open();});
 $('mode-employer').addEventListener('click',function(){setMode('employer');});
 $('mode-suggest').addEventListener('click',function(){setMode('suggest');});
 form.querySelectorAll('input[name=applicationMethod]').forEach(function(r){r.addEventListener('change',updateApplicationMethod);});
 updateApplicationMethod();
 $('submission-close').addEventListener('click',close);
 backdrop.addEventListener('click',close);
 form.addEventListener('submit',send);
 $('submission-save').addEventListener('click',function(){
   var data=collect(),ok=localSave(data);
   message(ok?'Draft saved in this browser only. Not submitted.':'Browser storage is unavailable. Use Prepare offline request instead.',!ok);
 });
 $('submission-download').addEventListener('click',function(){download(lastPrepared);});
 $('submission-new').addEventListener('click',newSubmission);
 document.addEventListener('keydown',function(e){
   if(panel.hidden)return;
   if(e.key==='Escape'){e.preventDefault();close();return;}
   if(e.key==='Tab'){
     var items=Array.from(panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(function(el){return el.getClientRects().length>0;});
     if(!items.length)return;
     if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
     if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
   }
 });
 if(location.hash==='#submit')open();
})();
