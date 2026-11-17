/** Studio Openings v0.6.1 — native employer submissions, review before publish.
 * Offline preview can prepare downloadable JSON but cannot send to Cloudflare.
 */
(function(){
 'use strict';
 function $(id){return document.getElementById(id);}
 var panel=$('submission-panel'), backdrop=$('submission-backdrop'),form=$('submission-form');
 if(!panel||!form)return;
 var mode='employer',lastFocus=null,configuration=null,widgetId=null,token='',lastPrepared=null;
 // Explicit required-field convention, including a non-color-only explanation.
 // The existing HTML already contains the visible required asterisks and required attributes.
 var legend=document.createElement('p');legend.className='so-required-legend';
 var legendStar=document.createElement('span');legendStar.setAttribute('aria-hidden','true');legendStar.textContent='*';
 legend.appendChild(legendStar);legend.appendChild(document.createTextNode(' Required fields'));
 form.insertBefore(legend,form.firstChild);
 var permissionLabel=form.querySelector('.submission-consent label');
 if(permissionLabel && !permissionLabel.querySelector('.so-permission-required')){
   var permissionStar=document.createElement('span');permissionStar.className='so-permission-required';
   permissionStar.setAttribute('aria-hidden','true');permissionStar.textContent='*';
   permissionLabel.appendChild(permissionStar);
 }
 // v0.11: optional employer-only inquiry. No payment, priority, or publication is granted here.
 var featuredChoice=document.createElement('div');
 featuredChoice.className='featured-inquiry';
 featuredChoice.id='featured-inquiry';
 var featuredLabel=document.createElement('label');
 featuredLabel.className='featured-inquiry-choice';
 var featuredInput=document.createElement('input');
 featuredInput.type='checkbox';featuredInput.name='featuredInterest';featuredInput.value='yes';
 featuredLabel.appendChild(featuredInput);
 var featuredHeading=document.createElement('span');
 featuredHeading.textContent='Request featured placement ';
 var featuredStar=document.createElement('span');
 featuredStar.className='featured-inquiry-star';featuredStar.textContent='★';
 featuredStar.setAttribute('aria-label','Featured listing');
 featuredHeading.appendChild(featuredStar);featuredLabel.appendChild(featuredHeading);
 featuredChoice.appendChild(featuredLabel);
 var featuredExplain=document.createElement('p');
 featuredExplain.textContent='Optional. Featured jobs have an exclusive pale-yellow background and a star beside the title. All listings need approval. Pricing and payment are arranged separately if approved; no payment is taken now.';
 featuredChoice.appendChild(featuredExplain);
 var beforeConsent=form.querySelector('.submission-consent');
 if(beforeConsent)form.insertBefore(featuredChoice,beforeConsent);
 else form.appendChild(featuredChoice);
 var draftKey='studio-openings.drafts.v061',preview=window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:';
 var turnstileScript;
 function message(s,error){var el=$('submission-error');el.textContent=s;el.className='submission-error'+(error?'':' submission-ok');el.hidden=!s;}
 function setMode(next){
   mode=next==='suggest'?'suggest':'employer';
   ['employer','suggest'].forEach(function(k){$('mode-'+k).classList.toggle('active',mode===k);$('mode-'+k).setAttribute('aria-pressed',String(mode===k));});
   if(mode==='suggest'){var radio=form.querySelector('input[name=applicationMethod][value=external]');if(radio)radio.checked=true;}
   updateApplicationMethod();
   featuredChoice.hidden=mode!=='employer';
   featuredInput.disabled=mode!=='employer';
   if(mode!=='employer')featuredInput.checked=false;
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
   form.hidden=false;$('submission-result').hidden=true;resetValidation();message('');$('submission-close').focus();
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
   return {schema:'studio-openings-submission-v1',kind:mode,applicationMethod:updateApplicationMethod(),applicationEmail:v('applicationEmail'),title:v('title'),company:v('company'),location:v('location'),mode:v('mode'),type:v('type'),role:v('role'),url:urlHttps(v('url')),companyWebsite:v('companyWebsite')?urlHttps(v('companyWebsite')):'',contactEmail:v('contactEmail'),salary:v('salary'),closesOn:v('closesOn'),eligibility:v('eligibility'),description:v('description'),permissionChecked:f.get('permission')==='on',featuredInterest:mode==='employer'&&f.get('featuredInterest')==='yes'};
 }
 // Inline, accessible validation. The form uses novalidate intentionally so we can
 // show every issue at once and focus the first affected field.
 var validationAttempted=false;
 function inputFor(name){return form.elements.namedItem(name);}
 function emailValid(value){return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(value||'');}
 function fieldErrors(data){
   var issues=[];
   function add(name,text){issues.push({name:name,text:text});}
   if(data.title.length<3)add('title',data.title?'Enter at least 3 characters.':'Job title is required.');
   if(data.company.length<2)add('company',data.company?'Enter at least 2 characters.':'Company / studio is required.');
   if(!data.location)add('location','Location is required. Enter a city and country, or Worldwide.');
   if(!data.mode)add('mode','Select a work arrangement.');
   if(!data.role)add('role','Select a discipline.');
   if(data.applicationMethod==='external'&&!data.url)add('url','Enter a valid HTTPS application link (https://…).');
   if(data.applicationMethod==='email'&&!emailValid(data.applicationEmail))add('applicationEmail','Enter a valid application email address.');
   if(!emailValid(data.contactEmail))add('contactEmail',data.contactEmail?'Enter a valid contact email address.':'Contact email is required.');
   var site=inputFor('companyWebsite');
   if(site&&site.value.trim()&&!urlHttps(site.value.trim()))add('companyWebsite','Enter a valid HTTPS website address, or leave this blank.');
   var closes=inputFor('closesOn');
   if(closes&&closes.value&&closes.value<new Date().toISOString().slice(0,10))add('closesOn','The closing date cannot be in the past.');
   if(!data.permissionChecked)add('permission','Please confirm that you have permission to submit this vacancy.');
   return issues;
 }
 function clearFieldErrors(){
   form.querySelectorAll('[aria-invalid="true"]').forEach(function(el){
     el.removeAttribute('aria-invalid');
     var previous=el.getAttribute('data-so-original-describedby');
     if(previous){el.setAttribute('aria-describedby',previous);}else{el.removeAttribute('aria-describedby');}
     el.removeAttribute('data-so-original-describedby');
   });
   form.querySelectorAll('.so-invalid-field').forEach(function(el){el.classList.remove('so-invalid-field');});
   form.querySelectorAll('.so-field-error').forEach(function(el){el.remove();});
 }
 function showFieldError(issue){
   var input=inputFor(issue.name);
   if(!input)return;
   var outer=issue.name==='permission'?form.querySelector('.submission-consent'):input.closest('label');
   if(!outer)return;
   outer.classList.add('so-invalid-field');
   input.setAttribute('aria-invalid','true');
   var id='so-error-'+issue.name;
   input.setAttribute('data-so-original-describedby',input.getAttribute('aria-describedby')||'');
   input.setAttribute('aria-describedby',((input.getAttribute('data-so-original-describedby')||'')+' '+id).trim());
   var note=document.createElement('span');note.className='so-field-error';note.id=id;
   note.textContent=issue.text;
   outer.appendChild(note);
 }
 function showValidation(data,focusFirst){
   var issues=fieldErrors(data);
   clearFieldErrors();
   issues.forEach(showFieldError);
   if(issues.length){
     message('Please correct the '+issues.length+' highlighted field'+(issues.length===1?'':'s')+' before sending.',true);
     if(focusFirst){
       var first=inputFor(issues[0].name);
       if(first){
         try{first.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){first.scrollIntoView();}
         try{first.focus({preventScroll:true});}catch(e){first.focus();}
       }
     }
     return false;
   }
   message('');return true;
 }
 function resetValidation(){validationAttempted=false;clearFieldErrors();}
 function liveValidation(){if(validationAttempted)showValidation(collect(),false);}
 form.addEventListener('input',liveValidation);
 form.addEventListener('change',liveValidation);
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
   var data=collect();validationAttempted=true;if(!showValidation(data,true))return;
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
     result('Submitted for review',data.featuredInterest?'Your listing was received for editorial review. Your featured-placement request was recorded. This is not a payment or a promise of promotion.':'Your listing was received. It is pending manual approval and is not public yet.',false,payload.reference);
   }catch(err){
     message((err.message||'Could not submit')+' — nothing was published. You can retry or save a local draft.',true);
     if(widgetId!==null&&window.turnstile){window.turnstile.reset(widgetId);token='';}
   }finally{setSending(true);}
 }
 function newSubmission(){form.reset();form.hidden=false;lastPrepared=null;token='';$('submission-result').hidden=true;setMode('employer');resetValidation();message('');if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);}
 $('nav-submit').addEventListener('click',function(e){e.preventDefault();open();});
 $('mode-employer').addEventListener('click',function(){setMode('employer');});
 $('mode-suggest').addEventListener('click',function(){setMode('suggest');});
 form.querySelectorAll('input[name=applicationMethod]').forEach(function(r){r.addEventListener('change',updateApplicationMethod);});
 updateApplicationMethod();
 setMode('employer');
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
