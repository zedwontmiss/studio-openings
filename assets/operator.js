/* Studio Openings v1.0 — private editorial review and manual invoice console. */
(function(){'use strict';
 var token='',data={submissions:[],campaigns:[]},selectedTab='requests',pendingAction=null;
 function $(id){return document.getElementById(id);}
 function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
 function setMessage(id,msg){$(id).textContent=msg||'';}
 function api(method,body){return fetch('/api/operator',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {error:'Invalid server response'};}).then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Request failed');return v;});});}
 function lock(msg){token='';clearScene();clearQueue();sourceState={sources:[],maps:[]};$('operator-key').value='';$('console').hidden=true;$('lock-panel').hidden=false;setMessage('login-error',msg||'Operator console locked.');}
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
  var message='TO: '+s.email+'\nFROM: studioopenings.team@gmail.com (outbound; hello@s-o.app currently receives only)\nSUBJECT: '+subject+'\n\n'+body;
  var ok=copy(message);$('operation-error').hidden=false;setMessage('operation-error',ok?'Email draft copied. Send manually from studioopenings.team@gmail.com until branded outbound sending is verified. Attach the finished invoice PDF.':'Copy was not available. Open an email client and write the message manually.');
 }

 function safeHTML(v){return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 // Download an editable A4 invoice locally, without sending private order data to a third party.
 function downloadInvoice(s){
  if(!s||s.kind!=='employer'||s.paymentStatus!=='ready_to_invoice')return;
  var featured=s.postingPackage==='featured',amount=featured?349:149;
  if(Number(s.priceUSD)!==amount){$('operation-error').hidden=false;setMessage('operation-error','Price mismatch: invoice was not created.');return;}
  var id='INV-'+String(s.id).replace(/[^A-Za-z0-9-]/g,''),issued=new Date(),due=new Date(issued.getTime()+7*86400000);
  var h='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safeHTML(id)+'</title>'+
   '<style>*{box-sizing:border-box}body{font:13px/1.6 Arial,Helvetica,sans-serif;color:#171717;margin:0;background:#eee}.sheet{max-width:210mm;min-height:297mm;background:white;margin:16px auto;padding:22mm 20mm;box-shadow:0 1px 9px #ccc}h1{font-size:25px;letter-spacing:-.04em;margin:0}.head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:30px}.meta{display:flex;justify-content:space-between;gap:26px;margin:30px 0}.meta>div{width:50%}.label{font-size:10px;color:#666;letter-spacing:.06em;text-transform:uppercase}.item,.total{display:flex;justify-content:space-between;gap:24px;border-top:1px solid #ccc;padding:15px 0}.total{border-top:2px solid #111;font-size:21px;font-weight:bold}.muted{color:#666}.editable{background:#fff5cf;border-bottom:1px dotted #777;padding:0 3px}.note{margin:12px auto;max-width:210mm;padding:12px;background:white;border:1px solid #ddd}.terms{border-top:1px solid #ddd;margin-top:22px;padding-top:20px}.foot{border-top:1px solid #ddd;margin-top:40px;padding-top:14px;color:#777;font-size:10px}@media print{@page{size:A4;margin:0}body{background:#fff}.sheet{margin:0;min-height:0;box-shadow:none}.note{display:none}.editable{background:none;border:0}}</style></head><body>'+
   '<div class="note"><b>Complete highlighted fields</b> before printing this invoice to PDF. Verify legal issuer, payment instructions, dates, and billing details. This is not an official tax invoice. Do not mark Invoice sent until actually emailed.</div>'+
   '<main class="sheet"><div class="head"><div><h1>studio openings</h1><p class="muted">s-o.app · hello@s-o.app</p></div><div><h1>INVOICE</h1><p>'+safeHTML(id)+'</p></div></div>'+
   '<div class="meta"><div><div class="label">Bill to</div><strong>'+safeHTML(s.company)+'</strong><div>'+safeHTML(s.email)+'</div></div>'+
   '<div><div class="label">Issued by</div><strong>Studio Openings</strong><div>Legal issuer: <span class="editable" contenteditable="true">[Enter full legal name]</span></div><div>Invoice date: '+issued.toISOString().slice(0,10)+'</div><div>Due date: '+due.toISOString().slice(0,10)+'</div></div></div>'+
   '<div class="item"><div><strong>'+(featured?'Featured Job · 90 days':'Standard Job · 30 days')+'</strong><div>'+safeHTML(s.title)+'</div><small class="muted">Order: '+safeHTML(s.id)+'</small></div><strong>USD '+amount.toFixed(2)+'</strong></div>'+
   '<div class="total"><span>Total due (USD)</span><span>$'+amount.toFixed(2)+'</span></div>'+
   '<div class="terms"><div class="label">Payment instructions</div><p class="editable" contenteditable="true">[Enter your verified commercial PayPal payment instructions or payment link]</p><p>Include invoice reference '+safeHTML(id)+' with payment. Publication follows independent payment verification and a final editorial check.</p></div>'+
   '<div class="foot">One-time job advertising. Up to the selected duration while the vacancy is open and verified. No guarantee of impressions, applicants or hires. Posting terms: s-o.app/terms.html · Questions: hello@s-o.app</div></main></body></html>';
  var url=URL.createObjectURL(new Blob([h],{type:'text/html;charset=utf-8'}));
  var a=document.createElement('a');a.href=url;a.download=id+'.html';document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},3000);
  $('operation-error').hidden=false;setMessage('operation-error','Invoice HTML downloaded. Open it and fill highlighted fields, Print → Save as PDF, email the PDF, then mark Invoice sent only after delivery.');
 }

 function showAction(action,s){pendingAction={action:action,id:s.id,title:s.title,company:s.company};var names={approve:'Approve visitor suggestion',review:'Verify employer and job',invoice_sent:'Mark invoice as sent',mark_paid:'Confirm payment received',publish:'Publish paid job',reject:'Reject pending submission',close:'Close published vacancy',reverify:'Recheck vacancy',pause:'Pause campaign',resume:'Resume campaign',end:'End campaign'};
  $('confirm-heading').textContent=names[action]||'Confirm action';$('confirm-details').textContent=s.title+' — '+s.company+' · '+s.id+' · '+(s.postingPackage||'curated')+' · '+(s.paymentStatus||'no invoice')+'.';
  $('activate-fields').hidden=true;$('review-confirmed').parentNode.hidden=['review','approve','publish','reject','reverify','close'].indexOf(action)<0;
  $('invoice-fields').hidden=action!=='invoice_sent';$('payment-fields').hidden=action!=='mark_paid';
  $('review-confirmed').checked=false;$('invoice-sent-confirmed').checked=false;$('payment-verified').checked=false;$('payment-reference').value='';setMessage('confirm-error','');$('confirm-backdrop').hidden=false;
 }
 function closeAction(){$('confirm-backdrop').hidden=true;pendingAction=null;}
 function execute(){if(!pendingAction)return;var payload={action:pendingAction.action,id:pendingAction.id};
  if(['review','approve','publish','reject','reverify','close'].indexOf(payload.action)>=0){payload.reviewConfirmed=$('review-confirmed').checked;if(!payload.reviewConfirmed){setMessage('confirm-error','You must confirm the editorial review.');return;}}
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
   else if(s.paymentStatus==='ready_to_invoice'){actionButton(actions,'Download invoice','',function(){downloadInvoice(s);});actionButton(actions,'Copy invoice email','',function(){emailDraft(s,'invoice');});actionButton(actions,'Invoice actually sent','primary',function(){showAction('invoice_sent',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='awaiting_payment'){actionButton(actions,'Verify bank payment','primary',function(){showAction('mark_paid',s);});actionButton(actions,'Reject','',function(){showAction('reject',s);});}
   else if(s.paymentStatus==='paid'){actionButton(actions,'Publish paid job','primary',function(){showAction('publish',s);});actionButton(actions,'Copy payment email','',function(){emailDraft(s,'paid');});}
   else info.appendChild(el('p','role','Legacy/no paid order — cannot publish. Request a new paid order.'));
  }else if(kind==='approved'){
   actionButton(actions,'Close vacancy','',function(){showAction('close',s);});
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
 function selectTab(tab){selectedTab=tab;if(tab==='distribution')loadQueue();if(tab==='scene')loadScene();else clearScene();['requests','approved','campaigns','sources','distribution','scene'].forEach(function(name){$('tab-'+name).hidden=name!==tab;});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.className=btn.getAttribute('data-tab')===tab?'tab active':'tab';});}

 // v0.14.2: opt-in registry, same tab-memory credential. Failures do not affect premium management.
 var sourceState={sources:[],maps:[]},indexHealth={},indexReady=false,indexEnvironment='',selectedSource=null,selectedRaw='',selectedCity=null,sourceGeoRequest=0,sourceDebounce=null,sourceInspectRevision=0,sourceInspectButton=null,sourceMapSaving=false;
 function sourceAPI(method,body){return fetch('/api/source-registry',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {error:'Invalid source API response'};}).then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Source registry unavailable');return v;});});}
 function sourceNotice(msg){$('source-feedback').hidden=!msg;$('source-feedback').textContent=msg||'';}
 function indexAPI(method,body){return fetch('/api/ingest-sources',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Indexer unavailable');return v;});});}
 function setupAPI(method,body){return fetch('/api/ingest-setup',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Preview setup unavailable');return v;});});}
 function initIndex(){
   if(!confirm('Initialize Preview D1 tables only? First confirm JOBS_DB points to the separate Preview database, NOT your Production database. No live jobs will be published.'))return;
   sourceNotice('Initializing Preview source tables…');
   setupAPI('POST',{confirm:'initialize-preview-only'}).then(function(d){
     sourceNotice(d.ready?'Preview tables ready. Approve and map an official ATS source, then sync its jobs.':'Some Preview tables remain unavailable.');
     return loadSources();
   }).catch(function(e){sourceNotice('Initialization failed: '+e.message);});
 }
 function renderIndexSetup(){
   var host=$('source-list'),box=$('source-ingest-setup');
   if(!box){box=el('div','record');box.id='source-ingest-setup';host.parentNode.insertBefore(box,host);}
   box.textContent='';
   box.appendChild(el('h3','', 'D1 source index · Preview'));
   var status=indexEnvironment==='preview'?(indexReady?'Ready for approved ATS sync':'Database setup required'):'Preview readiness not confirmed';
   box.appendChild(el('p','hint',status+'. Public indexed feed remains separate from manual validation.'));
   if(indexEnvironment==='preview'&&!indexReady)sourceButton(box,'Initialize Preview tables',initIndex);
   sourceButton(box,'Check readiness',loadIndexReadiness);
 }
 function loadIndexReadiness(){return setupAPI('GET').then(function(d){
   indexReady=!!d.ready;indexEnvironment=d.environment||'';
   renderIndexSetup();if(indexReady)loadIndexHealth();
 }).catch(function(e){indexReady=false;indexEnvironment='';renderIndexSetup();sourceNotice('Preview readiness: '+e.message);});}
 function loadIndexHealth(){return indexAPI('GET').then(function(d){indexHealth={};(d.health||[]).forEach(function(x){indexHealth[x.sourceId]=x;});renderSources();}).catch(function(){indexHealth={};renderSources();});}
 function syncIndexedSource(s){sourceNotice('Checking one approved ATS source…');return indexAPI('POST',{sourceId:s.id}).then(function(d){sourceNotice('Indexed '+d.indexed+' verified vacancies at '+d.source+'. Publication still requires Preview opt-in.');return loadIndexHealth();}).catch(function(e){sourceNotice('Sync unavailable: '+e.message);});}
 function loadSources(){if(!$('source-country').options.length||$('source-country').options.length===1){sourceGet('/api/geo?kind=countries&purpose=source').then(function(j){sourceFill($('source-country'),'Choose country',j.countries);}).catch(function(e){sourceNotice(e.message);});}return sourceAPI('GET').then(function(res){sourceState=res;renderSources();loadIndexReadiness();}).catch(function(e){sourceNotice('Registry unavailable: '+e.message+'. Check the Preview D1 binding, then initialize Preview tables.');loadIndexReadiness();});}
 function sourceAction(payload,after){sourceNotice('Saving…');return sourceAPI('POST',payload).then(function(r){sourceNotice(r.message||'Saved.');return loadSources().then(function(){if(after)after();});}).catch(function(e){sourceNotice(e.message);});}
 function sourceButton(parent,label,callback){var b=el('button','',label);b.type='button';b.onclick=callback;parent.appendChild(b);return b;}
 function renderSources(){var host=$('source-list');host.textContent='';renderIndexSetup();if(!sourceState.sources.length){host.appendChild(el('p','empty','No verified career sources yet. Add a company above.'));return;}
  sourceState.sources.forEach(function(s){var item=el('article','record'),info=el('div'),actions=el('div','actions');item.appendChild(info);item.appendChild(actions);
   info.appendChild(el('span','status',s.status.toUpperCase()+' · '+s.qualification.replace('_',' ')));info.appendChild(el('h3','',s.employerName));info.appendChild(el('p','',s.provider+' / '+s.boardToken+' · '+s.focus));
   var mapped=sourceState.maps.filter(function(m){return m.sourceId===s.id;});info.appendChild(el('p','',mapped.length+' verified location mapping(s)'));linkText(info,s.officialURL,'Official careers ↗');
   var h=indexHealth[s.id];if(h)info.appendChild(el('p','role','Indexer: '+h.status+' · '+h.matched+' matched · last success '+(h.lastSuccess||'never')));
   var inspectButton=sourceButton(actions,'Inspect locations',function(){inspectSource(s,inspectButton);});
   if(s.status==='approved'&&indexReady)sourceButton(actions,'Sync indexed jobs',function(){syncIndexedSource(s);});
   if(s.status==='pending')sourceButton(actions,'Verify & approve',function(){if(confirm('Have you independently verified the employer identity, official careers URL, and ATS board?'))sourceAction({action:'approve',id:s.id,reviewConfirmed:true});});
   if(s.status==='approved')sourceButton(actions,'Pause',function(){sourceAction({action:'pause',id:s.id});});
   if(s.status==='paused')sourceButton(actions,'Resume',function(){sourceAction({action:'resume',id:s.id});});
   host.appendChild(item);
  });
 }
 function jumpToSourceBlock(node){
   if(!node)return;
   // Scroll the actual result into view instead of leaving it below a long
   // registry. No smooth-scroll dependency (old Safari / macOS compatible).
   var top=node.getBoundingClientRect().top+(window.pageYOffset||document.documentElement.scrollTop||0)-24;
   window.scrollTo(0,Math.max(0,Math.round(top)));
 }
 function sourceMapKey(raw){return String(raw||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
 function sourceMapMessage(text,kind){
   var area=$('source-map-feedback');area.textContent=text||'';area.hidden=!text;
   area.className='source-map-feedback'+(kind?' is-'+kind:'');
 }
 function mappedCity(sourceId,raw){
   return (sourceState.maps||[]).filter(function(m){return m.sourceId===sourceId&&m.locationKey===sourceMapKey(raw);})[0]||null;
 }
 function updateMappedRow(raw,mapping){
   var key=sourceMapKey(raw);
   Array.prototype.forEach.call($('source-locations').querySelectorAll('.source-location-row'),function(row){
     if(row.getAttribute('data-location-key')!==key)return;
     var badge=row.querySelector('.source-location-status'),btn=row.querySelector('button');
     if(badge){badge.textContent='✓ Verified · '+[mapping.cityName,mapping.regionName].filter(Boolean).join(', ');badge.className='source-location-status is-verified';}
     if(btn)btn.textContent='Change mapping';
   });
 }
 function saveVerifiedLocationMapping(){
   if(sourceMapSaving)return Promise.resolve();
   if(selectedSource&&selectedSource.status!=='approved'){
     sourceMapMessage('Approve this employer source before saving a city mapping.','error');
     return Promise.resolve();
   }
   if(!selectedSource||!selectedCity||!selectedRaw){
     sourceMapMessage('Select a verified city from the search results before saving.','error');
     return Promise.resolve();
   }
   var s=selectedSource,raw=selectedRaw,city=selectedCity,button=$('source-map-save'),accepted=false;
   sourceMapSaving=true;button.disabled=true;button.textContent='Saving…';
   sourceMapMessage('Saving and confirming the mapping in Preview D1…','pending');
   return sourceAPI('POST',{action:'map_location',id:s.id,rawLocation:raw,locationReference:city})
     .then(function(){accepted=true;return sourceAPI('GET');})
     .then(function(result){
       var m=(result.maps||[]).filter(function(x){return x.sourceId===s.id&&x.locationKey===sourceMapKey(raw);})[0];
       if(!m||String(m.countryCode||'').toUpperCase()!==String(city.countryCode||'').toUpperCase()||
          sourceMapKey(m.cityName)!==sourceMapKey(city.cityName))
         throw Error('The saved city could not be confirmed from the source registry. Please retry.');
       sourceState=result;renderSources();
       var label=[m.cityName,m.regionName,m.countryName].filter(Boolean).join(', ');
       sourceMapMessage('✓ Saved and verified in Preview D1: '+label+'.','success');
       button.disabled=true;button.textContent='Saved ✓';
       updateMappedRow(raw,m);
       sourceNotice('Verified mapping saved: '+raw+' → '+label+'.');
     })
     .catch(function(e){
       button.disabled=false;button.textContent='Retry save';
       sourceMapMessage((accepted?'Unable to confirm the saved mapping: ':'Mapping not saved: ')+(e&&e.message||'Unexpected error'),'error');
     }).then(function(){sourceMapSaving=false;});
 }
 function inspectSource(s,clickedButton){
   selectedSource=s;selectedRaw='';selectedCity=null;
   var revision=++sourceInspectRevision,review=$('source-review'),host=$('source-locations');
   if(sourceInspectButton){sourceInspectButton.disabled=false;sourceInspectButton.textContent='Inspect locations';}
   sourceInspectButton=clickedButton||null;
   if(sourceInspectButton){sourceInspectButton.disabled=true;sourceInspectButton.textContent='Inspecting…';}
   review.hidden=false;$('source-map-form').hidden=true;
   $('source-review-title').textContent='Official job locations — '+s.employerName;
   host.textContent='Checking the official ATS board. This may take a few seconds…';
   host.setAttribute('aria-busy','true');
   jumpToSourceBlock(review);
   return sourceAPI('POST',{action:'inspect',id:s.id}).then(function(result){
     if(revision!==sourceInspectRevision)return;
     host.textContent='';
     host.appendChild(el('p','hint',result.totalPublished+' jobs returned by the official ATS; '+result.creativeTitles+' potential creative roles. Verify locations individually before publishing.'));
     if(!Array.isArray(result.locations)||!result.locations.length){
       host.appendChild(el('p','empty','No recognizable locations in the current creative roles. Review the original employer board or choose another source.'));
       linkText(host,s.officialURL,'Open official careers ↗');
       return;
     }
     if(s.status!=='approved'){
       var gate=el('div','source-map-gate');
       var hint=el('p','',s.status==='pending'?
         'Approve this verified employer and ATS before mapping vacancy locations.':
         'This source is paused. Resume it to map vacancy locations.');
       gate.appendChild(hint);
       if(s.status==='pending'){
         var verify=sourceButton(gate,'Verify & approve source',function(){
           if(!confirm('Have you independently verified the employer identity, official careers URL, and ATS board?'))return;
           verify.disabled=true;verify.textContent='Verifying…';
           sourceAPI('POST',{action:'approve',id:s.id,reviewConfirmed:true}).then(function(){
             return loadSources();
           }).then(function(){
             var current=(sourceState.sources||[]).filter(function(it){return it.id===s.id;})[0];
             if(!current||current.status!=='approved')throw Error('Approval not confirmed by the registry.');
             sourceNotice('Official source approved. You can now map city locations.');
             return inspectSource(current);
           }).catch(function(err){
             verify.disabled=false;verify.textContent='Verify & approve source';
             hint.textContent='Approval not confirmed: '+(err&&err.message||'Unknown error');
             hint.className='source-map-gate-error';
           });
         });
       }
       host.appendChild(gate);
     }
     result.locations.forEach(function(loc){
       var row=el('div','source-location-row'),text=el('span','',loc.rawLocation+' ('+loc.count+' job'+(loc.count===1?'':'s')+')');
       row.setAttribute('data-location-key',sourceMapKey(loc.rawLocation));
       row.appendChild(text);
       var mapping=mappedCity(s.id,loc.rawLocation);
       var badge=el('small','source-location-status'+(mapping?' is-verified':''),
         mapping?'✓ Verified · '+[mapping.cityName,mapping.regionName].filter(Boolean).join(', '):'Not mapped');
       row.appendChild(badge);
       if(s.status==='approved')sourceButton(row,mapping?'Change mapping':'Map city',function(){
         if(sourceMapSaving){sourceMapMessage('Finish saving the current mapping first.','pending');return;}
         selectedRaw=loc.rawLocation;selectedCity=null;$('source-map-form').hidden=false;
         sourceMapMessage(mapping?'Current mapping: '+[mapping.cityName,mapping.regionName].filter(Boolean).join(', ')+'. Choose a new verified city to change it.':'','neutral');
         $('source-map-save').textContent='Save verified mapping';
         $('source-raw-location').value=loc.rawLocation;$('source-country').value='';
         $('source-region').textContent='';$('source-region').disabled=true;
         $('source-city').value='';$('source-city').disabled=true;
         $('source-map-save').disabled=true;
         $('source-selected-city').textContent=/\s+or\s+|;|\//i.test(loc.rawLocation)?
           'This posting may list multiple cities. Do not assign one city unless the original vacancy confirms it. Otherwise, leave this location unmapped.':
           'Select the correct verified country, region and city.';
         $('source-city-options').hidden=true;
         jumpToSourceBlock($('source-map-form'));
       });
       else{
         var locked=sourceButton(row,s.status==='pending'?'Approve source first':'Resume source first',function(){});
         locked.disabled=true;locked.title='Official ATS approval required for mapping.';
       }
       host.appendChild(row);
     });
   }).catch(function(e){
     if(revision!==sourceInspectRevision)return;
     host.textContent='';
     host.appendChild(el('p','source-inspect-error','Unable to retrieve job locations: '+(e&&e.message||'Unknown ATS error')+'. The source is still pending; no jobs have been published.'));
     var retry=sourceButton(host,'Retry inspection',function(){inspectSource(s,retry);});
     retry.className='source-retry';
     linkText(host,s.officialURL,'Check official careers ↗');
   }).then(function(){
     if(revision!==sourceInspectRevision)return;
     host.setAttribute('aria-busy','false');
     if(sourceInspectButton){sourceInspectButton.disabled=false;sourceInspectButton.textContent='Inspect locations';sourceInspectButton=null;}
   });
 }
 function sourceGet(url){var sourceMode=url.indexOf('purpose=source')>=0;return fetch(url,{credentials:'same-origin',cache:'no-store',headers:sourceMode?{Authorization:'Bearer '+token}:{}}).then(function(r){return r.json().then(function(j){if(!r.ok)throw Error(j.error||'Geographic lookup unavailable.');return j;});});}
 function sourceFill(sel,placeholder,items){sel.textContent='';sel.appendChild(new Option(placeholder,''));items.forEach(function(x){sel.appendChild(new Option(x.name,String(x.id||x.code)));});}

 $('source-form').onsubmit=function(e){e.preventDefault();var f=new FormData(this),input={action:'add'};['employerName','officialURL','provider','boardToken','focus','qualification'].forEach(function(k){input[k]=String(f.get(k)||'');});sourceAction(input,function(){$('source-form').reset();});};
 $('source-country').onchange=function(){selectedCity=null;$('source-map-save').disabled=true;var cc=this.value,sel=$('source-region');$('source-city').value='';$('source-city').disabled=true;sourceFill(sel,'Loading regions…',[]);sel.disabled=true;if(!cc)return;var requestNo=++sourceGeoRequest;sourceGet('/api/geo?kind=regions&purpose=source&country='+encodeURIComponent(cc)).then(function(j){if(requestNo!==sourceGeoRequest)return;sourceFill(sel,'Choose region',j.regions);sel.disabled=false;}).catch(function(e){$('source-selected-city').textContent=e.message;});};
 $('source-region').onchange=function(){selectedCity=null;$('source-map-save').disabled=true;var inp=$('source-city');inp.disabled=!this.value;inp.value='';$('source-city-options').hidden=true;};
 $('source-city').oninput=function(){selectedCity=null;$('source-map-save').disabled=true;var q=this.value.trim(),country=$('source-country').value,region=$('source-region').value,out=$('source-city-options'),requestNo=++sourceGeoRequest;out.textContent='';out.hidden=true;clearTimeout(sourceDebounce);if(q.length<2||!country||!region)return;
  sourceDebounce=setTimeout(function(){sourceGet('/api/geo?kind=cities&purpose=source&country='+encodeURIComponent(country)+'&region='+encodeURIComponent(region)+'&q='+encodeURIComponent(q)).then(function(j){if(requestNo!==sourceGeoRequest)return;out.textContent='';j.cities.forEach(function(city){var b=el('button','',city.name);b.type='button';b.onclick=function(){selectedCity={kind:'city',countryCode:country,regionId:Number(region),cityId:Number(city.id),cityName:city.name,regionName:$('source-region').options[$('source-region').selectedIndex].text};$('source-city').value=city.name;out.hidden=true;$('source-map-save').disabled=false;$('source-selected-city').textContent='Verified selection: '+city.name+', '+selectedCity.regionName;};out.appendChild(b);});out.hidden=!j.cities.length;if(!j.cities.length)$('source-selected-city').textContent='No verified city matched. Try another spelling.';}).catch(function(e){$('source-selected-city').textContent=e.message;});},220);
 };
 $('source-map-form').onsubmit=function(e){e.preventDefault();return saveVerifiedLocationMapping();};
 function clearQueue(){
  $('queue-setup').hidden=true;
  ['queue-candidates','queue-entries','queue-history','queue-metrics','queue-message'].forEach(function(id){$(id).textContent='';});
  $('queue-export').value='';$('queue-output').hidden=true;
 }
 function queueAPI(input){
  return fetch('/api/distribution',{method:input?'POST':'GET',credentials:'same-origin',cache:'no-store',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:input?JSON.stringify(input):undefined
  }).then(function(r){return r.json().then(function(v){if(!r.ok)throw Error(v.error||'Queue unavailable');return v;});});
 }
 function queueAction(input){
  var session=token;
  return queueAPI(input).then(function(v){if(!token||session!==token)return;
   if(v.body){$('queue-export').value=v.body;$('queue-output').hidden=false;}
   return loadQueue('Saved '+input.action+'.');
  }).catch(function(err){if(session===token)setMessage('queue-message',err.message);});
 }
 function reviewForm(card,item){
  var form=el('form','source-form');
  var evidence=el('input'),description=el('textarea'),confirm=el('input');
  evidence.required=true;evidence.maxLength=500;description.required=true;description.minLength=240;description.maxLength=16000;
  confirm.type='checkbox';confirm.required=true;
  [[evidence,'Permission record or reference'],[description,'Full authorized plain-text description'],[confirm,'I checked this exact vacancy, location and reuse permission.']].forEach(function(pair){
   var label=el('label','',pair[1]);label.appendChild(pair[0]);form.appendChild(label);
  });
  var save=el('button','','Save verification');save.type='submit';form.appendChild(save);
  form.onsubmit=function(e){e.preventDefault();queueAction({action:'review',id:item.id,version:item.version,evidence:evidence.value,description:description.value,confirmed:confirm.checked});};
  var details=el('details');details.appendChild(el('summary','','Review publication rights'));details.appendChild(form);card.appendChild(details);
  actionButton(card,'Revoke rights','',function(){queueAction({action:'revoke',id:item.id});});
 }
 function loadQueue(message){
  var session=token;
  return queueAPI().then(function(v){
   if(!session||session!==token)return;
   $('queue-setup').hidden=true;
   var candidates=$('queue-candidates'),entries=$('queue-entries'),history=$('queue-history'),metrics=$('queue-metrics');
   [candidates,entries,history,metrics].forEach(function(n){n.textContent='';});
   v.candidates.forEach(function(item){
    var card=el('article','record');candidates.appendChild(card);
    card.appendChild(el('strong','',item.title+' · '+item.company));card.appendChild(el('p','',item.location));
    linkText(card,item.url,'Original vacancy');if(item.source)reviewForm(card,item);
    ['reddit','x'].forEach(function(channel){actionButton(card,'Draft for '+channel,'',function(){queueAction({action:'draft',id:item.id,channel:channel});});});
   });
   if(!v.candidates.length)candidates.textContent='No vacancies verified within the last 72 hours.';
   v.queue.forEach(function(q){
    var card=el('article','record');entries.appendChild(card);
    card.appendChild(el('strong','',q.channel+' · '+q.status));card.appendChild(el('p','',q.body));linkText(card,q.original_url,'Verify original vacancy');
    function button(label,action){actionButton(card,label,'',function(){queueAction({action:action,id:q.job_id,channel:q.channel,version:q.fingerprint});});}
    if(q.status==='draft')button('Approve this text','approve');
    if(q.status==='approved'||q.status==='exported')button('Export approved text','export');
    if(q.status!=='withdrawn')button('Withdraw','withdraw');
   });
   if(!v.queue.length)entries.textContent='No drafts yet.';
   v.audit.forEach(function(a){history.appendChild(el('li','',a.recorded_at+' UTC · '+a.job_id+' · '+a.channel+' · '+a.event));});
   v.metrics.forEach(function(m){metrics.appendChild(el('p','',m.day+' · '+m.event+' · '+m.referral+' · '+(m.job_key||'directory')+' · '+m.total));});
   setMessage('queue-message',message||'');
  }).catch(function(err){if(session===token){clearQueue();$('queue-setup').hidden=err.message!=='Queue unavailable. Check the isolated Preview migration.';setMessage('queue-message',err.message);}});
 }
 $('queue-setup').onclick=function(){
  if(window.confirm('Initialize the queue and metrics in the isolated Preview database?'))queueAction({action:'initialize',confirmed:true});
 };
 $('queue-refresh').onclick=function(){clearQueue();loadQueue();};
 $('queue-copy').onclick=function(){var field=$('queue-export');field.focus();field.select();var copied=document.execCommand('copy');setMessage('queue-message',copied?'Copied approved text.':'Text selected for manual copy.');};

 // Scene uses the same in-memory operator credential, but an independent preview-only endpoint.
 var sceneRevision=0,sceneBusy=false;
 function clearScene(){sceneRevision++;sceneBusy=false;['scene-topics','scene-replies','scene-reports','scene-feedback'].forEach(function(id){$(id).textContent='';});$('scene-refresh').disabled=false;}
 function sceneAPI(input){return fetch('/api/scene-moderation',{method:input?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:input?JSON.stringify(input):undefined}).then(function(r){return r.json().then(function(v){if(!r.ok)throw Error(v.error||'Scene unavailable');return v;});});}
 function sceneCurrent(session,revision){return !!token&&session===token&&revision===sceneRevision&&selectedTab==='scene';}
 function sceneAction(kind,id,status){
  if(sceneBusy||!token||!confirm('Confirm '+status+' for this '+kind+'?'))return;
  var session=token,revision=sceneRevision;sceneBusy=true;$('scene-refresh').disabled=true;
  sceneAPI({kind:kind,id:id,status:status}).then(function(){if(sceneCurrent(session,revision)){sceneBusy=false;loadScene('Saved '+status+'.');}},function(err){if(sceneCurrent(session,revision)){sceneBusy=false;$('scene-refresh').disabled=false;setMessage('scene-feedback',err.message);}});
 }
 function sceneRecord(host,kind,item){
  var card=el('article','record'),info=el('div'),actions=el('div','actions');
  card.appendChild(info);card.appendChild(actions);
  info.appendChild(el('h3','',item.title||item.topic_title|| (kind==='report'?'Report: '+item.reason:'Anonymous reply')));
  info.appendChild(el('p','role',[item.city_id,item.created_at,item.id].filter(Boolean).join(' · ')));
  if(item.parent_body)info.appendChild(el('p','','Parent discussion: '+item.parent_body));
  if(item.body)info.appendChild(el('p','',item.body));
  if(kind==='report'){
   if(item.reply_body)info.appendChild(el('p','','Reported reply: '+item.reply_body));
   if(item.topic_status==='published'&&!item.reply_id)actionButton(actions,'Remove topic','',function(){sceneAction('topic',item.topic_id,'removed');});
   if(item.reply_id&&item.reply_status==='published')actionButton(actions,'Remove reply','',function(){sceneAction('reply',item.reply_id,'removed');});
   actionButton(actions,'Mark report reviewed','',function(){sceneAction('report',item.id,'reviewed');});
  }else{
   if(kind==='topic'||item.topic_status==='published')actionButton(actions,'Publish','primary',function(){sceneAction(kind,item.id,'published');});
   actionButton(actions,'Reject','',function(){sceneAction(kind,item.id,'rejected');});
  }
  host.appendChild(card);
 }
 function loadScene(message){
  if(!token||selectedTab!=='scene'||sceneBusy)return;
  var session=token,revision=++sceneRevision;sceneBusy=true;$('scene-refresh').disabled=true;
  sceneAPI().then(function(d){if(!sceneCurrent(session,revision))return;
   [['topics','topic'],['replies','reply'],['reports','report']].forEach(function(pair){var host=$('scene-'+pair[0]);host.textContent='';var rows=Array.isArray(d[pair[0]])?d[pair[0]]:[];if(!rows.length)host.appendChild(el('p','empty','No pending records.'));rows.forEach(function(item){sceneRecord(host,pair[1],item);});});
   setMessage('scene-feedback',message||'');
  },function(err){if(sceneCurrent(session,revision)){['scene-topics','scene-replies','scene-reports'].forEach(function(id){$(id).textContent='';});setMessage('scene-feedback',err.message+' — Scene may be disabled or its preview schema may not be installed.');}}).then(function(){if(sceneCurrent(session,revision)){sceneBusy=false;$('scene-refresh').disabled=false;}});
 }
 $('scene-refresh').addEventListener('click',function(){loadScene();});

 $('unlock-button').addEventListener('click',unlock);$('operator-key').addEventListener('keydown',function(e){if(e.key==='Enter')unlock();});$('refresh-button').addEventListener('click',function(){api('GET').then(function(d){data=d;render();}).catch(function(err){if(/access|invalid|configured/i.test(err.message))lock(err.message);else {$('operation-error').hidden=false;setMessage('operation-error',err.message);}});});$('lock-button').addEventListener('click',function(){lock('Operator console locked.');});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.addEventListener('click',function(){selectTab(btn.getAttribute('data-tab'));});});$('cancel-action').addEventListener('click',closeAction);$('execute-action').addEventListener('click',execute);$('confirm-backdrop').addEventListener('click',function(e){if(e.target===$('confirm-backdrop'))closeAction();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('confirm-backdrop').hidden)closeAction();});
})();
