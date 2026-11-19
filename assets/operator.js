/* Studio Openings v1.0 — private editorial review and manual invoice console. */
(function(){'use strict';
 var token='',data={submissions:[],campaigns:[]},selectedTab='requests',pendingAction=null;
 function $(id){return document.getElementById(id);}
 function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
 function setMessage(id,msg){$(id).textContent=msg||'';}
 function api(method,body){return fetch('/api/operator',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {error:'Invalid server response'};}).then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Request failed');return v;});});}
 function lock(msg){token='';sourceState={sources:[],maps:[]};$('operator-key').value='';$('console').hidden=true;$('lock-panel').hidden=false;setMessage('login-error',msg||'Operator console locked.');}
 function load(){return api('GET').then(function(d){data=d;$('lock-panel').hidden=true;$('console').hidden=false;render();loadSources();setMessage('login-error','');}).catch(function(err){lock(err.message);});}
 function unlock(){var value=$('operator-key').value.trim();if(value.length<32){setMessage('login-error','Enter the 32+ character operator secret.');return;}token=value;$('operator-key').value='';load();}
 function campaignFor(id){for(var i=0;i<data.campaigns.length;i++){if(data.campaigns[i].submissionId===id)return data.campaigns[i];}return null;}
 function dateOnly(v){return v?String(v).slice(0,10):'—';}
 function count(){var pending=0,orders=0,active=0;data.submissions.forEach(function(s){if(s.status==='pending')pending++;if(s.kind==='employer')orders++;});data.campaigns.forEach(function(c){var today=new Date().toISOString().slice(0,10);if(c.status==='active'&&c.startsOn<=today&&c.endsOn>=today)active++;});$('count-pending').textContent=pending;$('count-requests').textContent=orders;$('count-active').textContent=active;}
 function linkText(parent,url,label){if(!url||!/^https:\/\/[^\s/]+/i.test(url))return;var a=el('a','quiet-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.appendChild(a);}
 function actionButton(parent,label,cls,fn){var b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);parent.appendChild(b);return b;}
 function copy(value){var area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.left='-10000px';document.body.appendChild(area);area.focus();area.select();var success=false;try{success=document.execCommand('copy');}catch(e){}document.body.removeChild(area);if(!success&&navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).catch(function(){});success=true;}return success;}
 function subjectFor(s,kind){if(kind==='invoice')return 'Studio Openings — Invoice for '+s.id;if(kind==='paid')return 'Studio Openings — Payment received · '+s.id;return 'Studio Openings — Your job is published · '+s.id;}
 function emailDraft(s,kind){
  var subject=subjectFor(s,kind),body='';
  if(kind==='invoice')body='Hello,\n\nThank you for submitting '+s.title+' at '+s.company+'. Your job has passed editorial review.\n\nPlan: '+(s.postingPackage==='featured'?'Featured Job':'Standard Job')+'\nAmount: USD '+s.priceUSD+'\nReference: '+s.id+'\n\nPlease find the invoice and payment instructions attached separately. Your job will only be published after payment is independently verified.\n\nStudio Openings';
  else if(kind==='paid')body='Hello,\n\nWe have confirmed receipt of payment for '+s.title+' (reference '+s.id+'). The listing is awaiting final publication review.\n\nStudio Openings';
  else body='Hello,\n\nYour job '+s.title+' has been published on Studio Openings.\n\nReference: '+s.id+'\nPlan: '+(s.postingPackage==='featured'?'Featured Job':'Standard Job')+'\n\nPlease confirm the vacancy remains open and notify us if it is filled.\n\nStudio Openings';
  var message='TO: '+s.email+'\nFROM: hello@s-o.app (choose this sender in your email service)\nSUBJECT: '+subject+'\n\n'+body;
  var ok=copy(message);$('operation-error').hidden=false;setMessage('operation-error',ok?'Email draft copied. Send manually FROM hello@s-o.app. For invoices: prepare and attach the actual invoice before marking sent.':'Copy was not available. Open an email client and write the message manually.');
 }
 function showAction(action,s){pendingAction={action:action,id:s.id,title:s.title,company:s.company};var names={approve:'Approve visitor suggestion',review:'Verify employer and job',invoice_sent:'Mark invoice as sent',mark_paid:'Confirm payment received',publish:'Publish paid job',reject:'Reject pending submission',reverify:'Recheck vacancy',pause:'Pause campaign',resume:'Resume campaign',end:'End campaign'};
  $('confirm-heading').textContent=names[action]||'Confirm action';$('confirm-details').textContent=s.title+' — '+s.company+' · '+s.id+' · '+(s.postingPackage||'curated')+' · '+(s.paymentStatus||'no invoice')+'.';
  $('activate-fields').hidden=true;$('review-confirmed').parentNode.hidden=['review','approve','publish','reject','reverify'].indexOf(action)<0;
  $('invoice-fields').hidden=action!=='invoice_sent';$('payment-fields').hidden=action!=='mark_paid';
  $('review-confirmed').checked=false;$('invoice-sent-confirmed').checked=false;$('payment-verified').checked=false;$('payment-reference').value='';setMessage('confirm-error','');$('confirm-backdrop').hidden=false;
 }
 function closeAction(){$('confirm-backdrop').hidden=true;pendingAction=null;}
 function execute(){if(!pendingAction)return;var payload={action:pendingAction.action,id:pendingAction.id};
  if(['review','approve','publish','reject','reverify'].indexOf(payload.action)>=0){payload.reviewConfirmed=$('review-confirmed').checked;if(!payload.reviewConfirmed){setMessage('confirm-error','You must confirm the editorial review.');return;}}
  if(payload.action==='invoice_sent'){payload.invoiceSentConfirmed=$('invoice-sent-confirmed').checked;if(!payload.invoiceSentConfirmed){setMessage('confirm-error','Do not mark sent unless the actual invoice has been sent.');return;}}
  if(payload.action==='mark_paid'){payload.paymentConfirmed=$('payment-verified').checked;payload.paymentReference=$('payment-reference').value.trim();if(!payload.paymentConfirmed||payload.paymentReference.length<4){setMessage('confirm-error','Verify funds in your own account and enter a reconciliation reference.');return;}}
  $('execute-action').disabled=true;api('POST',payload).then(function(res){closeAction();return api('GET').then(function(d){data=d;render();$('operation-error').hidden=false;setMessage('operation-error',res.message||'Updated. No automatic email has been sent.');});}).then(function(){$('execute-action').disabled=false;},function(err){$('execute-action').disabled=false;setMessage('confirm-error',err.message);});
 }
 function record(s,kind){var item=el('article','record'),info=el('div'),actions=el('div','actions');item.appendChild(info);item.appendChild(actions);
  var campaign=campaignFor(s.id),isFeatured=s.postingPackage==='featured';
  var planLabel=s.kind==='employer'?(isFeatured?'★ Featured · $349':'Standard · $149'):'Visitor suggestion';
  info.appendChild(el('span','status'+(isFeatured?' featured':''),planLabel));
  info.appendChild(el('h3','',s.title));info.appendChild(el('p','',s.company+' · '+s.location+' · '+s.role));
  var statusLine=s.kind==='employer'?String(s.paymentStatus||'NO PAID ORDER').replace(/_/g,' '):s.status;
  info.appendChild(el('p','role',s.id+' · '+statusLine+' · Submitted '+dateOnly(s.createdAt)));
  if(s.email)info.appendChild(el('p','',s.email));if(s.invoiceSentAt)info.appendChild(el('p','','Invoice sent: '+dateOnly(s.invoiceSentAt)));
  if(s.paymentConfirmedAt)info.appendChild(el('p','','Funds marked received: '+dateOnly(s.paymentConfirmedAt)+' · '+s.paymentReference));
  if(s.reviewedAt)info.appendChild(el('p','','Vacancy verified: '+dateOnly(s.reviewedAt)));
  if(s.publishedAt)info.appendChild(el('p','','Published: '+dateOnly(s.publishedAt)+' · active only during purchased term and while verified'));
  if(s.closesOn)info.appendChild(el('p','','Closes: '+s.closesOn));linkText(info,s.applicationURL||s.companyWebsite,'View employer source ↗');
  if(kind==='requests'){
   if(s.kind==='suggest'){actionButton(actions,'Approve','primary',function(){showAction('approve',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='pending_review'){actionButton(actions,'Review passed','primary',function(){showAction('review',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='ready_to_invoice'){actionButton(actions,'Copy invoice email','',function(){emailDraft(s,'invoice');});actionButton(actions,'Invoice actually sent','primary',function(){showAction('invoice_sent',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='awaiting_payment'){actionButton(actions,'Verify bank payment','primary',function(){showAction('mark_paid',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='paid'){actionButton(actions,'Publish paid job','primary',function(){showAction('publish',s);});actionButton(actions,'Copy payment email','',function(){emailDraft(s,'paid');});}
   else info.appendChild(el('p','role','Legacy/no paid order — cannot publish. Request a new paid order.'));
  }else if(kind==='approved'){
   actionButton(actions,'Reverify','',function(){showAction('reverify',s);});
   if(s.kind==='employer')actionButton(actions,'Copy publication email','',function(){emailDraft(s,'published');});
   if(campaign)actions.appendChild(el('span','status',campaign.status));
  }else if(kind==='campaigns'&&campaign){
   if(campaign.status==='active')actionButton(actions,'Pause','',function(){showAction('pause',s);});
   if(campaign.status==='paused')actionButton(actions,'Resume','primary',function(){showAction('resume',s);});
   if(campaign.status!=='ended')actionButton(actions,'End','',function(){showAction('end',s);});
   info.appendChild(el('p','','Featured · '+campaign.status+' · '+dateOnly(campaign.startsOn)+' to '+dateOnly(campaign.endsOn)));
  }
  return item;
 }
 function fill(id,items,kind){var host=$(id);host.textContent='';if(!items.length){host.appendChild(el('p','empty','No records in this view.'));return;}items.forEach(function(s){host.appendChild(record(s,kind));});}
 function render(){count();var requests=data.submissions.filter(function(s){return s.status==='pending';}),approved=data.submissions.filter(function(s){return s.status==='approved';}),campaignJobs=approved.filter(function(s){return !!campaignFor(s.id);});fill('requests-list',requests,'requests');fill('approved-list',approved,'approved');fill('campaigns-list',campaignJobs,'campaigns');selectTab(selectedTab);}
 function selectTab(tab){selectedTab=tab;['requests','approved','campaigns','sources'].forEach(function(name){$('tab-'+name).hidden=name!==tab;});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.className=btn.getAttribute('data-tab')===tab?'tab active':'tab';});}

 // v0.14.2: opt-in registry, same tab-memory credential. Failures do not affect premium management.
 var sourceState={sources:[],maps:[]},selectedSource=null,selectedRaw='',selectedCity=null,sourceGeoRequest=0,sourceDebounce=null;
 function sourceAPI(method,body){return fetch('/api/source-registry',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {error:'Invalid source API response'};}).then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Source registry unavailable');return v;});});}
 function sourceNotice(msg){$('source-feedback').hidden=!msg;$('source-feedback').textContent=msg||'';}
 function loadSources(){if(!$('source-country').options.length||$('source-country').options.length===1){sourceGet('/api/geo?kind=countries&purpose=source').then(function(j){sourceFill($('source-country'),'Choose country',j.countries);}).catch(function(e){sourceNotice(e.message);});}return sourceAPI('GET').then(function(res){sourceState=res;renderSources();}).catch(function(e){sourceNotice('Registry unavailable: '+e.message+'. Run v0.14.2 D1 migration before using this tab.');});}
 function sourceAction(payload,after){sourceNotice('Saving…');return sourceAPI('POST',payload).then(function(r){sourceNotice(r.message||'Saved.');return loadSources().then(function(){if(after)after();});}).catch(function(e){sourceNotice(e.message);});}
 function sourceButton(parent,label,callback){var b=el('button','',label);b.type='button';b.onclick=callback;parent.appendChild(b);return b;}
 function renderSources(){var host=$('source-list');host.textContent='';if(!sourceState.sources.length){host.appendChild(el('p','empty','No verified career sources yet. Add a company above.'));return;}
  sourceState.sources.forEach(function(s){var item=el('article','record'),info=el('div'),actions=el('div','actions');item.appendChild(info);item.appendChild(actions);
   info.appendChild(el('span','status',s.status.toUpperCase()+' · '+s.qualification.replace('_',' ')));info.appendChild(el('h3','',s.employerName));info.appendChild(el('p','',s.provider+' / '+s.boardToken+' · '+s.focus));
   var mapped=sourceState.maps.filter(function(m){return m.sourceId===s.id;});info.appendChild(el('p','',mapped.length+' verified location mapping(s)'));linkText(info,s.officialURL,'Official careers ↗');
   sourceButton(actions,'Inspect locations',function(){inspectSource(s);});
   if(s.status==='pending')sourceButton(actions,'Verify & approve',function(){if(confirm('Have you independently verified the employer identity, official careers URL, and ATS board?'))sourceAction({action:'approve',id:s.id,reviewConfirmed:true});});
   if(s.status==='approved')sourceButton(actions,'Pause',function(){sourceAction({action:'pause',id:s.id});});
   if(s.status==='paused')sourceButton(actions,'Resume',function(){sourceAction({action:'resume',id:s.id});});
   host.appendChild(item);
  });
 }
 function inspectSource(s){selectedSource=s;selectedRaw='';selectedCity=null;$('source-review').hidden=false;$('source-map-form').hidden=true;$('source-review-title').textContent='Official job locations — '+s.employerName;$('source-locations').textContent='Checking the official ATS board…';
  sourceAPI('POST',{action:'inspect',id:s.id}).then(function(result){var host=$('source-locations');host.textContent='';host.appendChild(el('p','hint',result.totalPublished+' published ATS jobs; '+result.creativeTitles+' creative-title candidates. Map each distinct location separately.'));
   if(!result.locations.length){host.appendChild(el('p','empty','No locations found in matching creative vacancies.'));return;}
   result.locations.forEach(function(loc){var row=el('div','source-location-row'),text=el('span','',loc.rawLocation+' ('+loc.count+' job'+(loc.count===1?'':'s')+')');row.appendChild(text);
    var exists=sourceState.maps.some(function(m){return m.sourceId===s.id&&m.locationKey===loc.rawLocation.trim().replace(/\s+/g,' ').toLowerCase();});
    if(exists)row.appendChild(el('small','', 'Verified'));
    sourceButton(row,exists?'Change mapping':'Map city',function(){selectedRaw=loc.rawLocation;selectedCity=null;$('source-map-form').hidden=false;$('source-raw-location').value=loc.rawLocation;$('source-country').value='';$('source-region').textContent='';$('source-region').disabled=true;$('source-city').value='';$('source-city').disabled=true;$('source-map-save').disabled=true;$('source-selected-city').textContent='Select the correct verified country, region and city.';$('source-city-options').hidden=true;});
    host.appendChild(row);
   });
  }).catch(function(e){$('source-locations').textContent=e.message;});
 }
 function sourceGet(url){var sourceMode=url.indexOf('purpose=source')>=0;return fetch(url,{credentials:'same-origin',cache:'no-store',headers:sourceMode?{Authorization:'Bearer '+token}:{}}).then(function(r){return r.json().then(function(j){if(!r.ok)throw Error(j.error||'Geographic lookup unavailable.');return j;});});}
 function sourceFill(sel,placeholder,items){sel.textContent='';sel.appendChild(new Option(placeholder,''));items.forEach(function(x){sel.appendChild(new Option(x.name,String(x.id||x.code)));});}

 $('source-form').onsubmit=function(e){e.preventDefault();var f=new FormData(this),input={action:'add'};['employerName','officialURL','provider','boardToken','focus','qualification'].forEach(function(k){input[k]=String(f.get(k)||'');});sourceAction(input,function(){$('source-form').reset();});};
 $('source-country').onchange=function(){selectedCity=null;$('source-map-save').disabled=true;var cc=this.value,sel=$('source-region');$('source-city').value='';$('source-city').disabled=true;sourceFill(sel,'Loading regions…',[]);sel.disabled=true;if(!cc)return;var requestNo=++sourceGeoRequest;sourceGet('/api/geo?kind=regions&purpose=source&country='+encodeURIComponent(cc)).then(function(j){if(requestNo!==sourceGeoRequest)return;sourceFill(sel,'Choose region',j.regions);sel.disabled=false;}).catch(function(e){$('source-selected-city').textContent=e.message;});};
 $('source-region').onchange=function(){selectedCity=null;$('source-map-save').disabled=true;var inp=$('source-city');inp.disabled=!this.value;inp.value='';$('source-city-options').hidden=true;};
 $('source-city').oninput=function(){selectedCity=null;$('source-map-save').disabled=true;var q=this.value.trim(),country=$('source-country').value,region=$('source-region').value,out=$('source-city-options'),requestNo=++sourceGeoRequest;out.textContent='';out.hidden=true;clearTimeout(sourceDebounce);if(q.length<2||!country||!region)return;
  sourceDebounce=setTimeout(function(){sourceGet('/api/geo?kind=cities&purpose=source&country='+encodeURIComponent(country)+'&region='+encodeURIComponent(region)+'&q='+encodeURIComponent(q)).then(function(j){if(requestNo!==sourceGeoRequest)return;out.textContent='';j.cities.forEach(function(city){var b=el('button','',city.name);b.type='button';b.onclick=function(){selectedCity={kind:'city',countryCode:country,regionId:Number(region),cityId:Number(city.id),cityName:city.name,regionName:$('source-region').options[$('source-region').selectedIndex].text};$('source-city').value=city.name;out.hidden=true;$('source-map-save').disabled=false;$('source-selected-city').textContent='Verified selection: '+city.name+', '+selectedCity.regionName;};out.appendChild(b);});out.hidden=!j.cities.length;if(!j.cities.length)$('source-selected-city').textContent='No verified city matched. Try another spelling.';}).catch(function(e){$('source-selected-city').textContent=e.message;});},220);
 };
 $('source-map-form').onsubmit=function(e){e.preventDefault();if(!selectedSource||!selectedCity||!selectedRaw)return;sourceAction({action:'map_location',id:selectedSource.id,rawLocation:selectedRaw,locationReference:selectedCity},function(){if(selectedSource)inspectSource(selectedSource);});};
 $('unlock-button').addEventListener('click',unlock);$('operator-key').addEventListener('keydown',function(e){if(e.key==='Enter')unlock();});$('refresh-button').addEventListener('click',function(){api('GET').then(function(d){data=d;render();}).catch(function(err){if(/access|invalid|configured/i.test(err.message))lock(err.message);else {$('operation-error').hidden=false;setMessage('operation-error',err.message);}});});$('lock-button').addEventListener('click',function(){lock('Operator console locked.');});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.addEventListener('click',function(){selectTab(btn.getAttribute('data-tab'));});});$('cancel-action').addEventListener('click',closeAction);$('execute-action').addEventListener('click',execute);$('confirm-backdrop').addEventListener('click',function(e){if(e.target===$('confirm-backdrop'))closeAction();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('confirm-backdrop').hidden)closeAction();});
})();
