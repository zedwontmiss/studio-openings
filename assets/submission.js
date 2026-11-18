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
 featuredHeading.textContent='Make your job stand out ';
 var featuredStar=document.createElement('span');
 featuredStar.className='featured-inquiry-star';featuredStar.textContent='★';
 featuredStar.setAttribute('aria-label','Featured listing');
 featuredHeading.appendChild(featuredStar);featuredLabel.appendChild(featuredHeading);
 featuredChoice.appendChild(featuredLabel);
 var featuredExplain=document.createElement('p');
 featuredExplain.textContent='Give your opening a spotlight in the feed. Featured jobs get an exclusive baby-yellow highlight and a star beside the title. Request a spot now; we’ll confirm availability and pricing after review. No payment today.';
 featuredChoice.appendChild(featuredExplain);
 var beforeConsent=form.querySelector('.submission-consent');
 if(beforeConsent)form.insertBefore(featuredChoice,beforeConsent);
 else form.appendChild(featuredChoice);
 function syncFeaturedHighlight(){featuredChoice.classList.toggle('is-selected',mode==='employer' && featuredInput.checked);}
 featuredInput.addEventListener('change',syncFeaturedHighlight);

 // v0.14.1 verified geography. Country -> division -> settlement, never arbitrary city text.
 var soCountries=[{"code":"US","name":"United States"},{"code":"CA","name":"Canada"},{"code":"GB","name":"United Kingdom"},{"code":"CH","name":"Switzerland"},{"code":"DE","name":"Germany"},{"code":"FR","name":"France"},{"code":"NL","name":"Netherlands"},{"code":"BE","name":"Belgium"},{"code":"LU","name":"Luxembourg"},{"code":"AT","name":"Austria"},{"code":"IE","name":"Ireland"},{"code":"DK","name":"Denmark"},{"code":"SE","name":"Sweden"},{"code":"NO","name":"Norway"},{"code":"FI","name":"Finland"},{"code":"IS","name":"Iceland"},{"code":"SG","name":"Singapore"},{"code":"AU","name":"Australia"},{"code":"NZ","name":"New Zealand"},{"code":"AE","name":"United Arab Emirates"},{"code":"SA","name":"Saudi Arabia"},{"code":"QA","name":"Qatar"},{"code":"JP","name":"Japan"},{"code":"KR","name":"South Korea"},{"code":"BG","name":"Bulgaria"},{"code":"HR","name":"Croatia"},{"code":"CY","name":"Cyprus"},{"code":"CZ","name":"Czechia"},{"code":"EE","name":"Estonia"},{"code":"GR","name":"Greece"},{"code":"HU","name":"Hungary"},{"code":"IT","name":"Italy"},{"code":"LV","name":"Latvia"},{"code":"LT","name":"Lithuania"},{"code":"MT","name":"Malta"},{"code":"PL","name":"Poland"},{"code":"PT","name":"Portugal"},{"code":"RO","name":"Romania"},{"code":"SK","name":"Slovakia"},{"code":"SI","name":"Slovenia"},{"code":"ES","name":"Spain"}];
 function soEl(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
 function soGeoSelect(label,placeholder,items){
   var wrap=soEl('label','so-geo-field',label),s=document.createElement('select');
   s.setAttribute('aria-label',label);s.appendChild(new Option(placeholder,''));
   (items||[]).forEach(function(x){s.appendChild(new Option(x.name,x.code));});wrap.appendChild(s);
   return {wrap:wrap,select:s};
 }
 var soLocationInput=form.querySelector('input[name="location"]'),soLocationLabel=soLocationInput&&soLocationInput.closest('label');
 var soLocationGroup=soEl('div','so-geo-group');
 var soIntro=soEl('strong','so-geo-title','Verified workplace location');soLocationGroup.appendChild(soIntro);
 var soHint=soEl('p','so-geo-hint','Select a country, region and verified city. Remote roles can use the country alone.');soLocationGroup.appendChild(soHint);
 var soCountryField=soGeoSelect('Country','Choose country',soCountries),soCountry=soCountryField.select;soLocationGroup.appendChild(soCountryField.wrap);
 var soRegionField=soGeoSelect('State / region','Choose country first',[]),soRegion=soRegionField.select;soRegion.disabled=true;soLocationGroup.appendChild(soRegionField.wrap);
 var soCityWrap=soEl('label','so-geo-field','City / town');
 var soCitySearch=document.createElement('input');soCitySearch.type='search';soCitySearch.placeholder='Select a region first';soCitySearch.maxLength=70;soCitySearch.autocomplete='off';soCitySearch.disabled=true;
 var soCityChoices=soEl('div','so-geo-options');soCityChoices.setAttribute('role','listbox');soCityChoices.hidden=true;
 soCityWrap.appendChild(soCitySearch);soCityWrap.appendChild(soCityChoices);soLocationGroup.appendChild(soCityWrap);
 var soGeoStatus=soEl('p','so-geo-hint','');soGeoStatus.setAttribute('role','status');soLocationGroup.appendChild(soGeoStatus);
 var soRequestNote=soEl('p','so-geo-hint','');
 soRequestNote.appendChild(document.createTextNode('City not currently covered? '));
 var soRequestLink=document.createElement('a');soRequestLink.href='/coverage.html';soRequestLink.textContent='Request coverage for your city';soRequestNote.appendChild(soRequestLink);soLocationGroup.appendChild(soRequestNote);
 if(soLocationLabel&&soLocationLabel.parentNode){soLocationLabel.parentNode.insertBefore(soLocationGroup,soLocationLabel);soLocationLabel.hidden=true;}
 var soCity=document.createElement('input');soCity.type='hidden';soCity.name='locationCity';form.appendChild(soCity);
 var soLocationSelected=null,soSelectedRegion=null,soRegionRequest=0,soCityRequest=0,soSearchTimer=null,soRegionData=[];
 function soClearChoices(){soCityChoices.textContent='';soCityChoices.hidden=true;}
 function soFillSelect(select,placeholder,items){select.textContent='';select.appendChild(new Option(placeholder,''));items.forEach(function(x){select.appendChild(new Option(x.name,String(x.id)));});}
 function soResetCity(){soLocationSelected=null;soCity.value='';soCitySearch.value='';soClearChoices();soLocationInput.value=soCountry.value?soCountry.options[soCountry.selectedIndex].text:'';}
 function soChooseCity(city){
   if(!soSelectedRegion||!soCountry.value)return;
   var c=soCountry.value,cname=soCountry.options[soCountry.selectedIndex].text;
   soLocationSelected={kind:'city',countryCode:c,regionCode:soSelectedRegion.code.replace(c+'-',''),regionId:soSelectedRegion.id,cityId:Number(city.id),cityName:city.name,regionName:soSelectedRegion.name};
   soCity.value=city.name;soCitySearch.value=city.name;soLocationInput.value=city.name+', '+soSelectedRegion.name+', '+cname;
   soGeoStatus.textContent='Verified selection: '+soLocationInput.value;soClearChoices();
 }
 soCountry.addEventListener('change',async function(){
   var request=++soRegionRequest;soCityRequest++;soResetCity();soSelectedRegion=null;
   soRegion.disabled=true;soCitySearch.disabled=true;soCitySearch.placeholder='Choose a region first';
   soFillSelect(soRegion,'Loading regions…',[]);soGeoStatus.textContent='';
   if(!soCountry.value){soFillSelect(soRegion,'Choose country first',[]);return;}
   try{
     var resp=await fetch('/api/geo?kind=regions&country='+encodeURIComponent(soCountry.value));
     var payload=await resp.json();if(!resp.ok)throw Error(payload.error||'Region lookup failed');
     if(request!==soRegionRequest)return;
     soRegionData=payload.regions||[];soFillSelect(soRegion,'Choose state / region',soRegionData);soRegion.disabled=false;
     soGeoStatus.textContent=soCountry.value==='US'?'US nationwide coverage. Select a region to find any verified city.':'Only selected design-market cities are currently covered.';
   }catch(e){if(request===soRegionRequest){soFillSelect(soRegion,'Regions temporarily unavailable',[]);soGeoStatus.textContent='Geographic lookup unavailable. Try again later.';}}
 });
 soRegion.addEventListener('change',function(){
   ++soCityRequest;soResetCity();soSelectedRegion=soRegionData.find(function(x){return String(x.id)===soRegion.value;})||null;
   soCitySearch.disabled=!soSelectedRegion;soCitySearch.placeholder=soSelectedRegion?'Type at least two letters…':'Choose a region first';
   soGeoStatus.textContent=soSelectedRegion?'Type a city and choose from verified results.':'';
 });
 soCitySearch.addEventListener('input',function(){
   var request=++soCityRequest;soLocationSelected=null;soCity.value='';soLocationInput.value=soCountry.options[soCountry.selectedIndex]?.text||'';
   soClearChoices();if(soSearchTimer)clearTimeout(soSearchTimer);
   var q=soCitySearch.value.trim();if(!soSelectedRegion||q.length<2)return;
   soSearchTimer=setTimeout(async function(){
     try{
       var normalized=/^nyc$/i.test(q)&&soCountry.value==='US'?'new york':q;
       var url='/api/geo?kind=cities&country='+encodeURIComponent(soCountry.value)+'&region='+encodeURIComponent(soSelectedRegion.id)+'&q='+encodeURIComponent(normalized);
       var res=await fetch(url),data=await res.json();if(!res.ok)throw Error(data.error||'Lookup unavailable');
       if(request!==soCityRequest)return;
       var cities=data.cities||[];soClearChoices();
       if(!cities.length){soGeoStatus.textContent='No covered city matches. Try another spelling, or request expansion.';return;}
       cities.forEach(function(city){var b=soEl('button','so-geo-option',city.name);b.type='button';b.setAttribute('role','option');b.addEventListener('click',function(){soChooseCity(city);});soCityChoices.appendChild(b);});
       soCityChoices.hidden=false;soGeoStatus.textContent='Select the matching city; typed text alone is not accepted.';
     }catch(e){if(request===soCityRequest)soGeoStatus.textContent='City verification unavailable. Try again later.';}
   },240);
 });
 var soLocationEntry={get:function(){
   if(soLocationSelected)return Object.assign({},soLocationSelected);
   if(soCitySearch.value.trim())return null;
   if(soCountry.value&&(!soRegion.value||form.querySelector('input[name="mode"]:checked')?.value==='remote')){
     return {kind:'country',countryCode:soCountry.value,regionCode:''};
   }
   return null;
 },clear:function(){soLocationSelected=null;soSelectedRegion=null;++soRegionRequest;++soCityRequest;soCountry.value='';soFillSelect(soRegion,'Choose country first',[]);soRegion.disabled=true;soCitySearch.value='';soCitySearch.disabled=true;soCity.value='';soLocationInput.value='';soGeoStatus.textContent='';soClearChoices();}};
 var soEligibilityInput=form.querySelector('input[name="eligibility"]'),soEligibilityLabel=soEligibilityInput&&soEligibilityInput.closest('label');
 var soExtras=soEl('div','so-eligibility-extras');
 var soEligibleField=soGeoSelect('Eligible applicant country (optional)','Not specified',soCountries);
 var soEligible=soEligibleField.select;soExtras.appendChild(soEligibleField.wrap);
 var soEligibleValue=document.createElement('input');soEligibleValue.type='hidden';soEligibleValue.name='applicantLocation';form.appendChild(soEligibleValue);
 var soApplicantEntry={get:function(){return soEligible.value?{kind:'country',countryCode:soEligible.value,regionCode:''}:null;},clear:function(){soEligible.value='';soEligibleValue.value='';}};
 soEligible.addEventListener('change',function(){soEligibleValue.value=soEligible.value?soEligible.options[soEligible.selectedIndex].text:'';});
 function soChoice(label,name,items){var wrap=soEl('label','',label),select=document.createElement('select');select.name=name;
  items.forEach(function(x){select.appendChild(new Option(x[1],x[0]));});wrap.appendChild(select);soExtras.appendChild(wrap);return select;}
 soChoice('Work authorization','workAuthorization',[['unspecified','Not specified'],['required','Required'],['not_required','Not required']]);
 soChoice('Visa sponsorship','visaSponsorship',[['unspecified','Not specified'],['available','Available'],['unavailable','Not available']]);
 if(soEligibilityLabel)soEligibilityLabel.insertAdjacentElement('afterend',soExtras);
 var soDescriptionInput=form.querySelector('textarea[name="description"]');
 if(soDescriptionInput){soDescriptionInput.placeholder='Responsibilities, qualifications, experience, hours and other details';
   var soDescriptionLabel=soDescriptionInput.closest('label');
   if(soDescriptionLabel&&soDescriptionLabel.firstChild&&soDescriptionLabel.firstChild.nodeType===3)soDescriptionLabel.firstChild.nodeValue='Job description (recommended for search visibility)';
 }

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
   syncFeaturedHighlight();
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
   return {schema:'studio-openings-submission-v1',kind:mode,applicationMethod:updateApplicationMethod(),applicationEmail:v('applicationEmail'),title:v('title'),company:v('company'),location:v('location'),locationReference:soLocationEntry.get(),locationCity:v('locationCity'),applicantLocation:v('applicantLocation'),applicantLocationReference:soApplicantEntry.get(),workAuthorization:v('workAuthorization'),visaSponsorship:v('visaSponsorship'),mode:v('mode'),type:v('type'),role:v('role'),url:urlHttps(v('url')),companyWebsite:v('companyWebsite')?urlHttps(v('companyWebsite')):'',contactEmail:v('contactEmail'),salary:v('salary'),closesOn:v('closesOn'),eligibility:v('eligibility'),description:v('description'),permissionChecked:f.get('permission')==='on',featuredInterest:mode==='employer'&&f.get('featuredInterest')==='yes'};
 }
 // Inline, accessible validation. The form uses novalidate intentionally so we can
 // show every issue at once and focus the first affected field.
 var validationAttempted=false;
 function inputFor(name){if(name==='location')return soCitySearch;return form.elements.namedItem(name);}
 function emailValid(value){return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(value||'');}
 function fieldErrors(data){
   var issues=[];
   function add(name,text){issues.push({name:name,text:text});}
   if(data.title.length<3)add('title',data.title?'Enter at least 3 characters.':'Job title is required.');
   if(data.company.length<2)add('company',data.company?'Enter at least 2 characters.':'Company / studio is required.');
   if(!data.locationReference)add('location','Choose a supported country and verified city.');
   else if(data.mode!=='remote'&&data.locationReference.kind!=='city')add('location','On-site and hybrid jobs require a verified city.');
   if(data.applicantLocation&&!data.applicantLocationReference)add('applicantLocation','Select an eligible country.');
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
 function newSubmission(){form.reset();soLocationEntry.clear();soApplicantEntry.clear();form.hidden=false;lastPrepared=null;token='';$('submission-result').hidden=true;setMode('employer');resetValidation();message('');if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);}
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
