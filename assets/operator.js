/* Studio Openings v1.0 — private editorial review and manual invoice console. */
(function(){'use strict';
 var token='',data={submissions:[],campaigns:[]},selectedTab='requests',pendingAction=null;
 function $(id){return document.getElementById(id);}
 function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
 function setMessage(id,msg){$(id).textContent=msg||'';}
 function api(method,body){return fetch('/api/operator',{method:method,credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {error:'Invalid server response'};}).then(function(v){if(!r.ok||!v.ok)throw Error(v.error||'Request failed');return v;});});}
 function lock(msg){token='';clearReadiness();clearAnalytics();clearCommercial();clearEditorial();clearSourcing();clearCRM();clearWorkspace();clearStudioCandidates();clearInventoryHealth();clearScene();clearQueue();sourceState={sources:[],maps:[]};$('operator-key').value='';$('console').hidden=true;$('lock-panel').hidden=false;setMessage('login-error',msg||'Operator console locked.');}
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
   if(s.kind==='employer'){actionButton(actions,'Copy publication email','',function(){emailDraft(s,'published');});if(location.hostname==='development.studio-openings.pages.dev')actionButton(actions,'Get private management link','',function(){var session=token;fetch('/api/employer-management',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session,'Content-Type':'application/json'},body:JSON.stringify({action:'issue',id:s.id})}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Link unavailable');return d;});}).then(function(d){if(!session||session!==token)return;window.prompt('Copy this private Preview link and send only to the verified employer. Valid for 120 days.',d.url);}).catch(function(e){if(session===token){$('operation-error').hidden=false;setMessage('operation-error',e.message);}});});}
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
 function selectTab(tab){if(tab!=='readiness')clearReadiness();if(tab!=='signal'){resetSignalApproval();$('signal-subject').value='';$('signal-draft').value='';$('signal-html').value='';setMessage('signal-status','');}if(tab==='scene')tab='requests';selectedTab=tab;if(tab==='analytics')loadAnalytics();else clearAnalytics();if(tab==='commercial')loadCommercial();else clearCommercial();if(tab==='editorial')loadEditorial();else clearEditorial();if(tab==='sourcing')loadSourcing();else clearSourcing();if(tab==='relationships')loadCRM();else clearCRM();if(tab==='studios')loadWorkspace();else clearWorkspace();if(tab!=='sources'){clearInventoryHealth();clearStudioCandidates();}if(tab==='distribution')loadQueue();if(tab==='scene')loadScene();else clearScene();['requests','approved','campaigns','sources','distribution','scene','studios','relationships','sourcing','editorial','commercial','analytics','signal','readiness'].forEach(function(name){$('tab-'+name).hidden=name!==tab;});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.className=btn.getAttribute('data-tab')===tab?'tab active':'tab';});}

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
 function clearScene(){ $('scene-retention-result').textContent='';$('scene-retention-run').disabled=true;sceneRevision++;sceneBusy=false;['scene-topics','scene-replies','scene-reports','scene-feedback'].forEach(function(id){$(id).textContent='';});$('scene-refresh').disabled=false;}
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
 function retentionRequest(run){
  if(!token||selectedTab!=='scene'||sceneBusy)return;
  if(run&&!confirm('Permanently delete eligible expired records in isolated Preview D1? Published discussions and unresolved reports are protected.'))return;
  var session=token,revision=sceneRevision;
  $('scene-retention-run').disabled=true;$('scene-retention-check').disabled=true;
  fetch('/api/scene-retention',{method:run?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:run?JSON.stringify({confirm:'purge-expired-scene-preview'}):undefined}).then(function(r){return r.json().then(function(v){if(!r.ok)throw Error(v.error||'Retention unavailable');return v;});}).then(function(v){if(!sceneCurrent(session,revision))return;var counts=run?v.deleted:v.eligible;setMessage('scene-retention-result',(run?'Deleted: ':'Eligible: ')+Object.keys(counts).map(function(k){return k+' '+counts[k];}).join(' · '));$('scene-retention-run').disabled=run||!Object.keys(counts).some(function(k){return counts[k]>0;});},function(err){if(sceneCurrent(session,revision))setMessage('scene-retention-result',err.message);}).then(function(){if(session===token)$('scene-retention-check').disabled=false;});
 }
 $('scene-retention-check').addEventListener('click',function(){retentionRequest(false);});
 $('scene-retention-run').addEventListener('click',function(){retentionRequest(true);});
 $('scene-refresh').addEventListener('click',function(){loadScene();});

 var inventoryRevision=0;
 function clearInventoryHealth(){batchRevision++;batchRunning=false;$('inventory-probe-all').disabled=false;$('inventory-probe-stop').disabled=true;$('inventory-probe-summary').textContent='';$('inventory-probe-report').textContent='';probeRevision++;$('inventory-probe-result').textContent='';$('inventory-probe-run').disabled=false;clearCoverage();inventoryRevision++;$('inventory-health-list').textContent='';$('inventory-health-result').textContent='';$('inventory-health-refresh').disabled=false;}
 function loadInventoryHealth(){
  if(!token||selectedTab!=='sources')return;
  var session=token,rev=++inventoryRevision,host=$('inventory-health-list');host.textContent='';$('inventory-health-refresh').disabled=true;
  fetch('/api/inventory-health',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){if(!r.ok)throw Error('Feed health unavailable — check Preview flags and schema.');return r.json();}).then(function(d){if(token!==session||rev!==inventoryRevision||selectedTab!=='sources')return;
   var rows=Array.isArray(d.sources)?d.sources:[];rows.forEach(function(s){var item=el('article','record'),info=el('div');info.appendChild(el('h3','',s.source));info.appendChild(el('p','',s.status+' · '+s.snapshotState+' · '+(s.eligibleCount===null?'eligible count unknown':s.eligibleCount+' dated eligible jobs')+' · '+(s.snapshotAgeMs===null?'age unknown':Math.floor(s.snapshotAgeMs/60000)+' min old')+' · '+(s.lastAttemptAt? 'last attempt '+new Date(s.lastAttemptAt).toISOString():'never attempted')));item.appendChild(info);host.appendChild(item);});setMessage('inventory-health-result',(d.enabled?'Snapshot delivery enabled. ':'Snapshot delivery disabled. ')+rows.filter(function(s){return s.fresh;}).length+' / '+rows.length+' valid fresh snapshots; '+rows.filter(function(s){return s.status!=='ok'&&s.status!=='not-attempted';}).length+' non-success attempts. No refresh triggered.');
  },function(e){if(token===session&&rev===inventoryRevision)setMessage('inventory-health-result',e.message);}).then(function(){if(token===session&&rev===inventoryRevision)$('inventory-health-refresh').disabled=false;});
 }
 var candidateRevision=0,candidateData=null;
 function clearStudioCandidates(){candidateRevision++;candidateData=null;$('studio-candidates-list').textContent='';$('studio-candidates-result').textContent='';$('studio-candidates-refresh').disabled=false;$('studio-candidates-copy').disabled=true;}
 function loadStudioCandidates(){
  if(!token||selectedTab!=='sources')return;
  clearStudioCandidates();var session=token,rev=candidateRevision,host=$('studio-candidates-list');$('studio-candidates-refresh').disabled=true;
  function current(){return token===session&&rev===candidateRevision&&selectedTab==='sources';}
  fetch('/api/studio-candidates',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){if(!r.ok)throw Error('Studio discovery unavailable — check isolated Preview binding.');return r.json();}).then(function(d){
   if(!current())return;candidateData=d;var rows=Array.isArray(d.candidates)?d.candidates:[];
   rows.forEach(function(c){var card=el('article','record'),info=el('div');info.appendChild(el('h3','',c.name));info.appendChild(el('p','',c.status+' · '+c.disciplines.join(', ')));linkText(info,c.careerURL,'Review official career source');
    info.appendChild(el('p','','Vacancy cities (not offices): '+(c.vacancyCities.map(function(x){return [x.city,x.region,x.country].filter(Boolean).join(', ');}).join(' / ')||'none mapped')));
    if(c.existingMatches.length)info.appendChild(el('p','','Possible existing studios: '+c.existingMatches.map(function(x){return x.name;}).join(', ')));card.appendChild(info);host.appendChild(card);});
   setMessage('studio-candidates-result',rows.length+' candidate groups'+(d.truncated?' · capped result; not exhaustive':'')+' · none automatically published');$('studio-candidates-copy').disabled=!rows.length;
  }).catch(function(e){if(current())setMessage('studio-candidates-result',e.message);}).then(function(){if(current())$('studio-candidates-refresh').disabled=false;});
 }
 $('studio-candidates-refresh').addEventListener('click',loadStudioCandidates);
 $('studio-candidates-copy').addEventListener('click',function(){if(candidateData&&token)setMessage('studio-candidates-result',copy(JSON.stringify(candidateData,null,2))?'Candidate export copied for review; not a publication file.':'Clipboard unavailable.');});
 $('inventory-health-refresh').addEventListener('click',loadInventoryHealth);
 var probeRevision=0;
 var batchRevision=0,batchRunning=false,batchStop=false;
 $('inventory-probe-stop').addEventListener('click',function(){batchStop=true;this.disabled=true;});
 $('inventory-probe-all').addEventListener('click',function(){
  if(!token||selectedTab!=='sources'||batchRunning||$('inventory-probe-run').disabled)return;
  var session=token,rev=++batchRevision,keys=Array.prototype.map.call($('inventory-probe-shard').options,function(o){return o.value;}),done=0,valid=0,unknown=0,total=0,dupes=0,old=0;
  batchRunning=true;batchStop=false;$('inventory-probe-all').disabled=true;$('inventory-probe-run').disabled=true;$('inventory-probe-stop').disabled=false;$('inventory-probe-report').textContent='';
  function current(){return token===session&&rev===batchRevision&&selectedTab==='sources';}
  function summary(s){setMessage('inventory-probe-summary',s+' · '+done+'/'+keys.length+' tested · '+valid+' valid · '+unknown+' unavailable or incomplete · '+total+' eligible across valid shards (before cross-shard deduplication) · '+dupes+' within-shard duplicates · '+old+' undated or old. No snapshots saved.');}
  function finish(s){if(!current())return;batchRunning=false;$('inventory-probe-all').disabled=false;$('inventory-probe-run').disabled=false;$('inventory-probe-stop').disabled=true;summary(s);}
  function next(){if(!current())return;if(batchStop||done===keys.length){finish(batchStop?'Stopped':'Completed');return;}var key=keys[done];summary('Testing '+key);
   fetch('/api/inventory-probe?shard='+encodeURIComponent(key),{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){if(r.status===401||r.status===403)throw Error('Operator access expired');if(!r.ok)return {state:'request failed',eligibleCount:null};return r.json();}).then(function(d){if(!current())return;done++;if(d.state==='valid'&&typeof d.eligibleCount==='number'){valid++;total+=d.eligibleCount;dupes+=d.duplicates||0;old+=d.undatedOrOld||0;}else unknown++;var item=el('article','record'),info=el('div');info.appendChild(el('h3','',key));info.appendChild(el('p','',d.state+(d.eligibleCount===null||d.eligibleCount===undefined?' · eligible count unknown':' · '+d.eligibleCount+' eligible')));item.appendChild(info);$('inventory-probe-report').appendChild(item);next();}).catch(function(e){if(current())finish('Interrupted: '+e.message);});
  }next();
 });

 $('inventory-probe-run').addEventListener('click',function(){var session=token,rev=++probeRevision,shard=$('inventory-probe-shard').value,btn=$('inventory-probe-run');if(!session||selectedTab!=='sources')return;btn.disabled=true;$('inventory-probe-all').disabled=true;setMessage('inventory-probe-result','Testing '+shard+'…');function current(){return token===session&&rev===probeRevision&&selectedTab==='sources';}fetch('/api/inventory-probe?shard='+encodeURIComponent(shard),{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Test unavailable');return d;});}).then(function(d){if(!current())return;setMessage('inventory-probe-result',d.source+' — '+d.state+(d.eligibleCount===null?' · eligible count unknown':' · '+d.eligibleCount+' unique dated eligible jobs · '+d.duplicates+' duplicates · '+d.undatedOrOld+' undated or old · '+d.filtered+' filtered · source timestamp '+d.updatedAt)+'. No snapshot saved.');}).catch(function(e){if(current())setMessage('inventory-probe-result',e.message);}).then(function(){if(current()){btn.disabled=false;$('inventory-probe-all').disabled=false;}});});


 var workspaceData=null,workspaceDrafts=[],workspaceLimit=30,workspaceEdit='',workspaceRevision=0;
 var workspaceKey='soapp.operator.studio-drafts.v1';
 var fields=['name','website','career','discipline','country','region','city','evidence','summary','reviewedOn','sourcing','relationship','overview','notes'];
 function cleanDraft(x){if(!x||typeof x.id!=='string'||!/^[-a-zA-Z0-9_]{1,180}$/.test(x.id))return null;var y={id:x.id};fields.forEach(function(k){y[k]=typeof x[k]==='string'?x[k].slice(0,k==='notes'?1000:k==='overview'?700:300):'';});return y.name.trim()?y:null;}
 function clearWorkspace(){workspaceRevision++;workspaceData=null;workspaceDrafts=[];workspaceEdit='';$('workspace-init').hidden=true;$('workspace-list').textContent='';$('studio-workspace-stats').textContent='';$('workspace-form').reset();$('workspace-form').hidden=true;$('workspace-feedback').textContent='';$('workspace-more').hidden=true;}
 function saveWorkspace(){try{localStorage.setItem(workspaceKey,JSON.stringify(workspaceDrafts));return true;}catch(e){return false;}}
 function loadWorkspace(){clearWorkspace();var session=token,rev=workspaceRevision;if(location.hostname!=='development.studio-openings.pages.dev'){setMessage('workspace-feedback','Preview workspace only.');return;}try{workspaceDrafts=JSON.parse(localStorage.getItem(workspaceKey)||'[]').map(cleanDraft).filter(Boolean);}catch(e){workspaceDrafts=[];}fetch('/api/studio-workspace',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){if(!r.ok)throw Error('Workspace unavailable');return r.json();}).then(function(d){if(token!==session||rev!==workspaceRevision||selectedTab!=='studios')return;workspaceData=d;renderWorkspace();$('workspace-init').hidden=!!d.ready;}).catch(function(e){if(token===session&&rev===workspaceRevision)setMessage('workspace-feedback',e.message);});}
 function workspaceRows(){if(!workspaceData)return [];var rows=workspaceData.studios.map(function(s){var o=s.offices[0]||{};return {id:'published-'+s.id,name:s.name,website:s.website,career:s.source.url,discipline:s.disciplines[0],country:o.country,region:o.region,city:o.city,evidence:o.sourceUrl,summary:s.summary,overview:s.overview,reviewedOn:s.source.reviewedOn,status:'published',slug:s.slug};}).concat(workspaceData.candidates.map(function(s,i){return {id:'lead-'+i,name:s.name,discipline:s.discipline,summary:s.marketHint,notes:s.evidence||'',status:'research'};}));var server=workspaceData.drafts||[],local=workspaceDrafts.filter(function(d){return !server.some(function(s){return s.id===d.id;});}),drafts=server.concat(local);return rows.filter(function(r){return !drafts.some(function(d){return d.id===r.id;});}).concat(drafts.map(function(d){var r={};Object.keys(d).forEach(function(k){r[k]=d[k];});r.status=d.state||'draft';return r;}));}
 function renderWorkspace(){if(!workspaceData)return;var q=$('workspace-search').value.toLowerCase().trim(),f=$('workspace-filter').value,all=workspaceRows(),rows=all.filter(function(r){return (f==='all'||f===r.status)&&[r.name,r.discipline,r.country,r.region,r.city,r.summary].join(' ').toLowerCase().indexOf(q)!==-1;}).sort(function(a,b){return a.name.localeCompare(b.name);});$('studio-workspace-stats').textContent=workspaceData.studios.length+' published · '+workspaceData.candidates.length+' research leads · '+(workspaceData.drafts||[]).length+' server drafts · '+workspaceDrafts.length+' local backups';var host=$('workspace-list');host.textContent='';rows.slice(0,workspaceLimit).forEach(function(r){var card=el('article','record'),info=el('div'),actions=el('div','actions');info.appendChild(el('h3','',r.name));info.appendChild(el('p','',[r.status,r.discipline,r.city,r.country].filter(Boolean).join(' · ')));if(r.slug){var a=el('a','quiet-link','View profile ↗');a.href='/studio/'+r.slug;info.appendChild(a);}actionButton(actions,r.status==='draft'?'Edit draft':'Review / edit','',function(){editWorkspace(r);});if(r.status==='draft'&&r.revision)actionButton(actions,'Review evidence','',function(){reviewWorkspace(r);});card.appendChild(info);card.appendChild(actions);host.appendChild(card);});$('workspace-more').hidden=rows.length<=workspaceLimit;setMessage('workspace-feedback',rows.length+' matching records. Server storage '+(workspaceData.ready?'ready.':'not initialized; local backups only.')+'');}
 function editWorkspace(r){var form=$('workspace-form');form.reset();workspaceEdit=r.id;fields.forEach(function(k){if(form.elements[k]&&r[k])form.elements[k].value=r[k];});form.hidden=false;$('workspace-editor-title').textContent='Draft / '+(r.name||'New studio');form.scrollIntoView();form.elements.name.focus();}
 function workspaceAPI(body){return fetch('/api/studio-workspace',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Workspace request failed');return d;});});}
 function putWorkspace(r,action){var session=token,rev=workspaceRevision,old=(workspaceData.drafts||[]).filter(function(d){return d.id===r.id;})[0];return workspaceAPI({action:action,draft:cleanDraft(r),revision:old?old.revision:0,confirm:action==='review'}).then(function(d){if(session!==token||rev!==workspaceRevision)return;workspaceData.drafts=(workspaceData.drafts||[]).filter(function(x){return x.id!==r.id;});workspaceData.drafts.push(d.draft);workspaceDrafts=workspaceDrafts.filter(function(x){return x.id!==r.id;});saveWorkspace();renderWorkspace();setMessage('workspace-feedback',action==='review'?'Evidence review accepted; staged, not published.':'Saved in Preview D1.');}).catch(function(e){if(session===token&&rev===workspaceRevision)setMessage('workspace-feedback',e.message);});}
 function reviewWorkspace(r){if(confirm('Confirm official identity, location evidence, career source and creative scope have been independently checked? This stages the record, not publication.'))putWorkspace(r,'review');}
 $('workspace-init').addEventListener('click',function(){if(!token||!confirm('Initialize studio draft storage only in the isolated Preview database?'))return;var session=token,rev=workspaceRevision;workspaceAPI({action:'initialize',confirm:'isolated-preview-only'}).then(function(){if(session===token&&rev===workspaceRevision)loadWorkspace();}).catch(function(e){if(session===token&&rev===workspaceRevision)setMessage('workspace-feedback',e.message);});});
 $('workspace-search').addEventListener('input',function(){workspaceLimit=30;renderWorkspace();});$('workspace-filter').addEventListener('change',function(){workspaceLimit=30;renderWorkspace();});$('workspace-more').addEventListener('click',function(){workspaceLimit+=30;renderWorkspace();});
 $('workspace-new').addEventListener('click',function(){if(workspaceData)editWorkspace({id:'new-'+Date.now()});});$('workspace-cancel').addEventListener('click',function(){$('workspace-form').hidden=true;});
 $('workspace-form').addEventListener('submit',function(e){e.preventDefault();if(!token||!workspaceData||!workspaceEdit)return;var r={id:workspaceEdit};fields.forEach(function(k){r[k]=e.target.elements[k].value.trim();});r=cleanDraft(r);if(!r)return;if(workspaceData.ready){putWorkspace(r,'save');$('workspace-form').hidden=true;return;}workspaceDrafts=workspaceDrafts.filter(function(d){return d.id!==r.id;});workspaceDrafts.push(r);var ok=saveWorkspace();$('workspace-form').hidden=true;renderWorkspace();setMessage('workspace-feedback',ok?'Local draft saved. Not published.':'Storage unavailable; export the draft before leaving.');});
 $('workspace-publish-export').addEventListener('click',function(){if(!token||!workspaceData||!workspaceData.ready)return setMessage('workspace-feedback','Initialize Preview storage first.');var session=token,rev=workspaceRevision;workspaceAPI({action:'export-reviewed'}).then(function(d){if(session!==token||rev!==workspaceRevision)return;if(!d.records.length)return setMessage('workspace-feedback','No reviewed studios ready.');var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='studio-publication-batch.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);setMessage('workspace-feedback',d.records.length+' reviewed studios exported. Not published.');}).catch(function(e){if(session===token&&rev===workspaceRevision)setMessage('workspace-feedback',e.message);});});
 $('workspace-export').addEventListener('click',function(){if(!token||!workspaceData)return;var blob=new Blob([JSON.stringify({version:1,drafts:workspaceDrafts.concat(workspaceData.drafts||[])},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='studio-workspace-drafts.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);});
 $('workspace-import-button').addEventListener('click',function(){if(token&&workspaceData)$('workspace-import').click();});$('workspace-import').addEventListener('change',function(){var file=this.files[0],session=token,revision=workspaceRevision;this.value='';if(!file||file.size>2000000)return;var reader=new FileReader();reader.onload=function(){if(!session||token!==session||revision!==workspaceRevision||selectedTab!=='studios')return;try{var d=JSON.parse(reader.result);if(d.version!==1||!Array.isArray(d.drafts)||d.drafts.length>2000)throw Error('Invalid draft file');var incoming=d.drafts.map(cleanDraft).filter(Boolean);if(incoming.length!==d.drafts.length)throw Error('Invalid draft record');incoming.forEach(function(r){workspaceDrafts=workspaceDrafts.filter(function(x){return x.id!==r.id;});workspaceDrafts.push(r);});saveWorkspace();renderWorkspace();}catch(e){setMessage('workspace-feedback',e.message);}};reader.readAsText(file);});


 var crmData=null,crmSelected=null,crmRecord=null,crmRevision=0,crmDetailRevision=0,crmLimit=30;
 function crmToday(){return new Date().toISOString().slice(0,10);}
 function clearCRM(){crmRevision++;crmDetailRevision++;crmData=null;crmSelected=null;crmRecord=null;$('crm-list').textContent='';$('crm-history').textContent='';$('crm-feedback').textContent='';$('crm-stats').textContent='';$('crm-detail').hidden=true;$('crm-init').hidden=true;$('crm-more').hidden=true;$('crm-form').reset();$('crm-event').reset();}
 function crmAPI(body,id){return fetch('/api/studio-relationships'+(id?'?studio='+encodeURIComponent(id):''),{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Relationship request failed');return d;});});}
 function crmCurrent(session,rev){return session&&session===token&&rev===crmRevision&&selectedTab==='relationships';}
 function loadCRM(){clearCRM();var session=token,rev=crmRevision;crmAPI().then(function(d){if(!crmCurrent(session,rev))return;crmData=d;$('crm-init').hidden=d.ready;renderCRM();}).catch(function(e){if(crmCurrent(session,rev))setMessage('crm-feedback',e.message);});}
 function crmFor(id){return (crmData.records||[]).filter(function(r){return r.studioId===id;})[0]||{stage:'uncontacted',intent:'undecided',contactPage:'',notes:'',nextFollowup:'',doNotContact:false,revision:0};}
 function crmAssessment(r){return r.assessment||{commercial:'unknown',social:'unknown',commercialEvidence:'',socialEvidence:'',commercialReason:'',socialReason:'',reviewedOn:''};}
 function crmDue(r){return !r.doNotContact&&r.nextFollowup&&r.nextFollowup<=crmToday();}
 function renderCRM(){if(!crmData)return;var q=$('crm-search').value.trim().toLowerCase(),f=$('crm-filter').value,all=crmData.studios,rows=all.filter(function(s){var r=crmFor(s.id);return (s.name+' '+s.discipline).toLowerCase().indexOf(q)!==-1&&(f==='all'||(f==='followup'?crmDue(r):f==='optout'?r.doNotContact:f==='qualified-commercial'?crmAssessment(r).commercial==='qualified':f==='qualified-social'?crmAssessment(r).social==='qualified':f==='unassessed'?crmAssessment(r).commercial==='unknown'&&crmAssessment(r).social==='unknown':r.stage===f));}).sort(function(a,b){return a.name.localeCompare(b.name);});$('crm-stats').textContent=all.length+' indexed studios · '+crmData.records.filter(function(r){return crmAssessment(r).commercial==='qualified';}).length+' qualified commercial · '+crmData.records.filter(function(r){return crmAssessment(r).social==='qualified';}).length+' qualified social · '+crmData.records.filter(crmDue).length+' follow-ups due · '+crmData.records.filter(function(r){return r.doNotContact;}).length+' opted out';var host=$('crm-list');host.textContent='';rows.slice(0,crmLimit).forEach(function(s){var r=crmFor(s.id),card=el('article','record'),info=el('div'),actions=el('div','actions');info.appendChild(el('h3','',s.name));info.appendChild(el('p','',[r.stage,r.intent,'Commercial: '+crmAssessment(r).commercial,'Social: '+crmAssessment(r).social,r.doNotContact?'Do not contact':'',s.held?'Existing sourcing hold':'',r.nextFollowup?'Follow-up '+r.nextFollowup:''].filter(Boolean).join(' · ')));var a=el('a','quiet-link','View profile ↗');a.href='/studio/'+s.slug;info.appendChild(a);actionButton(actions,'Manage','',function(){openCRM(s);});card.appendChild(info);card.appendChild(actions);host.appendChild(card);});$('crm-more').hidden=rows.length<=crmLimit;setMessage('crm-feedback',crmData.ready?rows.length+' matching studios. No automated contact.':'Initialize isolated Preview storage to manage relationships.');}
 function openCRM(s){if(!crmData||!crmData.ready)return;var session=token,rev=crmRevision,detail=++crmDetailRevision;crmSelected=s;crmRecord=null;$('crm-detail').hidden=true;crmAPI(null,s.id).then(function(d){if(!crmCurrent(session,rev)||detail!==crmDetailRevision)return;crmRecord=d.record||crmFor(s.id);var form=$('crm-form');form.reset();['stage','intent','contactPage','notes','nextFollowup'].forEach(function(k){form.elements[k].value=crmRecord[k]||'';});var assessment=crmAssessment(crmRecord);Object.keys(assessment).forEach(function(k){form.elements[k].value=assessment[k];});form.elements.doNotContact.checked=crmRecord.doNotContact;$('crm-name').textContent=s.name;$('crm-hold').textContent=s.held?'Existing vacancy sourcing hold. CRM changes do not release it.':'Sourcing status is managed separately.';$('crm-event').reset();$('crm-event').elements.happenedOn.value=crmToday();var host=$('crm-history');host.textContent='';d.events.forEach(function(e){var row=el('article','record'),info=el('div');info.appendChild(el('h3','',e.kind+' · '+e.happened_on));info.appendChild(el('p','',e.summary));row.appendChild(info);host.appendChild(row);});$('crm-detail').hidden=false;$('crm-detail').scrollIntoView();}).catch(function(e){if(crmCurrent(session,rev)&&detail===crmDetailRevision)setMessage('crm-feedback',e.message);});}
 $('crm-init').addEventListener('click',function(){if(!token||!confirm('Initialize employer relationship tables in isolated Preview only?'))return;var session=token,rev=crmRevision;crmAPI({action:'initialize',confirm:'isolated-preview-only'}).then(function(){if(crmCurrent(session,rev))loadCRM();}).catch(function(e){if(crmCurrent(session,rev))setMessage('crm-feedback',e.message);});});
 $('crm-refresh').addEventListener('click',loadCRM);$('crm-search').addEventListener('input',function(){crmLimit=30;renderCRM();});$('crm-filter').addEventListener('change',function(){crmLimit=30;renderCRM();});$('crm-more').addEventListener('click',function(){crmLimit+=30;renderCRM();});
 $('crm-form').addEventListener('submit',function(e){e.preventDefault();if(!crmRecord||!crmSelected)return;var form=e.target,s=crmSelected,session=token,rev=crmRevision,detail=crmDetailRevision,r={};['stage','intent','contactPage','notes','nextFollowup'].forEach(function(k){r[k]=form.elements[k].value.trim();});r.assessment={};Object.keys(crmAssessment({})).forEach(function(k){r.assessment[k]=form.elements[k].value.trim();});r.doNotContact=form.elements.doNotContact.checked;var resume=crmRecord.doNotContact&&!r.doNotContact;if(resume&&!confirm('Confirm documented permission to resume contact?'))return;crmAPI({action:'save',studioId:s.id,record:r,revision:crmRecord.revision,confirmResume:resume}).then(function(d){if(!crmCurrent(session,rev)||detail!==crmDetailRevision)return;crmData.records=crmData.records.filter(function(x){return x.studioId!==s.id;});d.record.studioId=s.id;crmData.records.push(d.record);renderCRM();openCRM(s);}).catch(function(err){if(crmCurrent(session,rev)&&detail===crmDetailRevision)setMessage('crm-feedback',err.message);});});
 $('crm-event').addEventListener('submit',function(e){e.preventDefault();if(!crmRecord||!crmRecord.revision||!crmSelected)return setMessage('crm-feedback','Save the relationship first.');var f=e.target,s=crmSelected,session=token,rev=crmRevision,detail=crmDetailRevision;crmAPI({action:'log',studioId:s.id,event:{kind:f.elements.kind.value,summary:f.elements.summary.value,happenedOn:f.elements.happenedOn.value}}).then(function(){if(!crmCurrent(session,rev)||detail!==crmDetailRevision)return;crmAPI().then(function(d){if(!crmCurrent(session,rev)||detail!==crmDetailRevision)return;crmData=d;renderCRM();openCRM(s);});}).catch(function(err){if(crmCurrent(session,rev)&&detail===crmDetailRevision)setMessage('crm-feedback',err.message);});});


 var sourcingData=null,sourcingSelected=null,sourcingRevision=0,sourcingLimit=30;
 function clearSourcing(){sourcingRevision++;sourcingData=null;sourcingSelected=null;$('sourcing-list').textContent='';$('sourcing-stats').textContent='';$('sourcing-feedback').textContent='';$('sourcing-form').reset();$('sourcing-form').hidden=true;$('sourcing-init').hidden=true;$('sourcing-more').hidden=true;}
 function sourcingAPI(body){return fetch('/api/studio-sourcing',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Sourcing request failed');return d;});});}
 function sourcingCurrent(session,rev){return session&&session===token&&rev===sourcingRevision&&selectedTab==='sourcing';}
 function loadSourcing(){clearSourcing();var session=token,rev=sourcingRevision;sourcingAPI().then(function(d){if(!sourcingCurrent(session,rev))return;sourcingData=d;$('sourcing-init').hidden=d.ready;renderSourcing();}).catch(function(e){if(sourcingCurrent(session,rev))setMessage('sourcing-feedback',e.message);});}
 function sourcingFor(s){return sourcingData.decisions.filter(function(d){return d.studioId===s.id;})[0]||{mode:s.activeMode,reason:'',revision:0};}
 function renderSourcing(){if(!sourcingData)return;var q=$('sourcing-search').value.trim().toLowerCase(),f=$('sourcing-filter').value,rows=sourcingData.studios.filter(function(s){return (s.name+' '+s.discipline).toLowerCase().indexOf(q)!==-1&&(f==='all'||sourcingFor(s).mode===f);}).sort(function(a,b){return a.name.localeCompare(b.name);});$('sourcing-stats').textContent=sourcingData.studios.length+' indexed studios · '+sourcingData.decisions.length+' recorded decisions';var host=$('sourcing-list');host.textContent='';rows.slice(0,sourcingLimit).forEach(function(s){var d=sourcingFor(s),card=el('article','record'),info=el('div'),actions=el('div','actions');info.appendChild(el('h3','',s.name));info.appendChild(el('p','',s.discipline+' · deployed: '+s.activeMode+(s.held?' · hold applies':'')+(d.revision?' · recorded: '+d.mode:'')));actionButton(actions,'Manage policy','',function(){if(!sourcingData.ready)return;sourcingSelected=s;var f=$('sourcing-form');f.reset();f.elements.mode.value=d.mode;f.elements.reason.value=d.reason;$('sourcing-name').textContent=s.name;$('sourcing-current').textContent='Deployed policy: '+s.activeMode+(s.held?' · hold applies':'');f.hidden=false;f.scrollIntoView();});card.appendChild(info);card.appendChild(actions);host.appendChild(card);});$('sourcing-more').hidden=rows.length<=sourcingLimit;setMessage('sourcing-feedback',sourcingData.ready?rows.length+' matching studios. Staged decisions do not change feeds yet.':'Initialize isolated Preview storage.');}
 $('sourcing-init').addEventListener('click',function(){if(!token||!confirm('Initialize sourcing decisions in isolated Preview only?'))return;var session=token,rev=sourcingRevision;sourcingAPI({action:'initialize',confirm:'isolated-preview-only'}).then(function(){if(sourcingCurrent(session,rev))loadSourcing();}).catch(function(e){if(sourcingCurrent(session,rev))setMessage('sourcing-feedback',e.message);});});
 $('sourcing-search').addEventListener('input',function(){sourcingLimit=30;renderSourcing();});$('sourcing-filter').addEventListener('change',function(){sourcingLimit=30;renderSourcing();});$('sourcing-more').addEventListener('click',function(){sourcingLimit+=30;renderSourcing();});
 $('sourcing-form').addEventListener('submit',function(e){e.preventDefault();if(!sourcingSelected||!sourcingData.ready)return;var s=sourcingSelected,f=e.target,session=token,rev=sourcingRevision,d=sourcingFor(s);sourcingAPI({action:'save',decision:{studioId:s.id,mode:f.elements.mode.value,reason:f.elements.reason.value},revision:d.revision,confirm:f.elements.confirm.checked}).then(function(r){if(!sourcingCurrent(session,rev))return;sourcingData.decisions=sourcingData.decisions.filter(function(x){return x.studioId!==s.id;});sourcingData.decisions.push(r.decision);$('sourcing-form').hidden=true;renderSourcing();setMessage('sourcing-feedback','Reviewed decision saved; deployment unchanged.');}).catch(function(err){if(sourcingCurrent(session,rev))setMessage('sourcing-feedback',err.message);});});
 $('sourcing-export').addEventListener('click',function(){if(!sourcingData||!sourcingData.ready)return;var session=token,rev=sourcingRevision;sourcingAPI({action:'export',confirm:true}).then(function(d){if(!sourcingCurrent(session,rev))return;var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='studio-sourcing-decisions.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);setMessage('sourcing-feedback',d.decisions.length+' decisions exported for development review.');}).catch(function(e){if(sourcingCurrent(session,rev))setMessage('sourcing-feedback',e.message);});});


 var edData=null,edEditing=null,edRevision=0;
 var edFields=['slug','title','description','category','date','body','notes','contributor','studioId','cityId'];
 function clearEditorial(){edRevision++;edData=null;edEditing=null;$('ed-list').textContent='';$('ed-stats').textContent='';$('ed-feedback').textContent='';$('ed-form').reset();$('ed-form').hidden=true;$('ed-preview').textContent='';$('ed-preview').hidden=true;$('ed-init').hidden=true;}
 function edAPI(body){return fetch('/api/editorial-workspace',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Editorial request failed');return d;});});}
 function edCurrent(session,rev){return session&&session===token&&rev===edRevision&&selectedTab==='editorial';}
 function loadEditorial(){clearEditorial();var session=token,rev=edRevision;edAPI().then(function(d){if(!edCurrent(session,rev))return;edData=d;$('ed-init').hidden=d.ready;renderEditorial();}).catch(function(e){if(edCurrent(session,rev))setMessage('ed-feedback',e.message);});}
 function renderEditorial(){if(!edData)return;var q=$('ed-search').value.trim().toLowerCase(),f=$('ed-filter').value,all=edData.published.map(function(a){return {slug:a.slug,title:a.title,category:a.category,date:a.date,state:'published'};}).concat(edData.drafts),rows=all.filter(function(a){return (f==='all'||a.state===f)&&(a.title+' '+a.category).toLowerCase().indexOf(q)!==-1;});$('ed-stats').textContent=edData.published.length+' published · '+edData.drafts.filter(function(a){return a.state==='draft';}).length+' drafts · '+edData.drafts.filter(function(a){return a.state==='reviewed';}).length+' reviewed';var host=$('ed-list');host.textContent='';rows.forEach(function(a){var card=el('article','record'),info=el('div'),actions=el('div','actions');info.appendChild(el('h3','',a.title));info.appendChild(el('p','',[a.state,a.category,a.date].filter(Boolean).join(' · ')));if(a.state==='published'){var link=el('a','quiet-link','Read article ↗');link.href='/article/'+a.slug;info.appendChild(link);}else{actionButton(actions,'Edit','',function(){editEditorial(a);});if(a.state==='draft')actionButton(actions,'Review','',function(){if(confirm('Confirm facts, source rights, contributor permission and independent editorial status?'))saveEditorial(a,'review',a.revision);});}card.appendChild(info);card.appendChild(actions);host.appendChild(card);});setMessage('ed-feedback',edData.ready?rows.length+' matching articles. Reviewed drafts are not public.':'Initialize isolated Preview storage.');}
 function edOptions(select,rows,label){select.textContent='';var first=el('option','',label);first.value='';select.appendChild(first);rows.forEach(function(r){var op=el('option','',r.name||r.city);op.value=r.id;select.appendChild(op);});}
 function editEditorial(a){if(!edData||!edData.ready)return;edEditing=a||{revision:0};var f=$('ed-form');f.reset();edOptions(f.elements.studioId,edData.studios,'None');edOptions(f.elements.cityId,edData.cities,'None');edFields.forEach(function(k){if(edEditing[k])f.elements[k].value=edEditing[k];});f.elements.slug.readOnly=!!edEditing.revision;$('ed-preview').hidden=true;f.hidden=false;f.scrollIntoView();}
 function readEditorial(){var d={kind:'independent'},f=$('ed-form');edFields.forEach(function(k){d[k]=f.elements[k].value.trim();});return d;}
 function saveEditorial(a,action,revision){var d={kind:'independent'};edFields.forEach(function(k){d[k]=a[k]||'';});var session=token,rev=edRevision;edAPI({action:action,draft:d,revision:revision,confirm:action==='review'}).then(function(r){if(!edCurrent(session,rev))return;edData.drafts=edData.drafts.filter(function(x){return x.slug!==r.draft.slug;});edData.drafts.push(r.draft);$('ed-form').hidden=true;renderEditorial();setMessage('ed-feedback',action==='review'?'Reviewed; ready for publication export.':'Draft saved in Preview D1.');}).catch(function(e){if(edCurrent(session,rev))setMessage('ed-feedback',e.message);});}
 $('ed-search').addEventListener('input',renderEditorial);$('ed-filter').addEventListener('change',renderEditorial);$('ed-new').addEventListener('click',function(){editEditorial(null);});$('ed-cancel').addEventListener('click',function(){$('ed-form').hidden=true;edEditing=null;});$('ed-form').addEventListener('submit',function(e){e.preventDefault();if(edEditing)saveEditorial(readEditorial(),'save',edEditing.revision);});
 $('ed-preview-btn').addEventListener('click',function(){var d=readEditorial(),p=$('ed-preview');p.textContent='';p.appendChild(el('h2','',d.title));p.appendChild(el('p','',d.description));d.body.split(/\n\s*\n/).filter(Boolean).forEach(function(s){p.appendChild(el(s.indexOf('## ')===0?'h3':'p','',s.indexOf('## ')===0?s.slice(3):s));});p.hidden=false;});
 $('ed-init').addEventListener('click',function(){if(!token||!confirm('Initialize independent editorial storage in isolated Preview only?'))return;var session=token,rev=edRevision;edAPI({action:'initialize',confirm:'isolated-preview-only'}).then(function(){if(edCurrent(session,rev))loadEditorial();}).catch(function(e){if(edCurrent(session,rev))setMessage('ed-feedback',e.message);});});
 $('ed-export').addEventListener('click',function(){if(!edData||!edData.ready)return;var session=token,rev=edRevision;edAPI({action:'export'}).then(function(d){if(!edCurrent(session,rev))return;if(!d.articles.length)return setMessage('ed-feedback','No reviewed articles.');var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='editorial-publication-batch.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);setMessage('ed-feedback',d.articles.length+' reviewed articles exported; not published.');}).catch(function(e){if(edCurrent(session,rev))setMessage('ed-feedback',e.message);});});


 var cpRevision=0,cpData=null;
 function clearCommercial(){cpRevision++;cpData=null;$('cb-list').textContent='';$('cb-feedback').textContent='';$('cb-form').reset();$('cb-form').hidden=true;$('cb-init').hidden=true;$('cp-list').textContent='';$('cp-feedback').textContent='';$('cp-form').reset();$('cp-form').hidden=true;$('cp-init').hidden=true;}
 function cpAPI(body){return fetch('/api/commercial-placements',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Commercial request failed');return d;});});}
 function cpCurrent(t,r){return t&&t===token&&r===cpRevision&&selectedTab==='commercial';}
 function cpAction(body){var t=token,r=cpRevision;cpAPI(body).then(function(){if(cpCurrent(t,r))loadCommercial();}).catch(function(e){if(cpCurrent(t,r))setMessage('cp-feedback',e.message);});}
 function loadCommercial(){clearCommercial();var t=token,r=cpRevision;cpAPI().then(function(d){if(!cpCurrent(t,r))return;cpData=d;loadBundles(t,r,d.studios);$('cp-init').hidden=d.ready;$('cp-form').hidden=!d.ready;var sel=$('cp-form').elements.studioId;sel.textContent='';d.studios.forEach(function(s){var opt=el('option','',s.name);opt.value=s.id;sel.appendChild(opt);});d.records.forEach(function(x){var card=el('article','record'),info=el('div'),actions=el('div','actions'),s=d.studios.filter(function(s){return s.id===x.studio_id;})[0];info.appendChild(el('h3','',s?s.name:x.studio_id));info.appendChild(el('p','',[x.state,x.starts_on+' – '+x.ends_on,'USD '+(x.amount_cents/100).toFixed(2),x.ends_on<new Date().toISOString().slice(0,10)?'Expired':''].join(' · ')));function act(action,ref){cpAction({action:action,id:x.id,revision:x.revision,reference:ref,confirm:true});}if(x.state==='draft')actionButton(actions,'Verify payment','',function(){var ref=prompt('Enter reconciliation reference only after independently confirming funds received.');if(ref&&confirm('Confirm funds received?'))act('paid',ref);});if(x.state==='paid')actionButton(actions,'Activate','',function(){if(confirm('Activate agreed Preview sponsorship?'))act('activate');});if(x.state!=='ended')actionButton(actions,'End','',function(){if(confirm('End placement? This does not issue a refund.'))act('end');});card.appendChild(info);card.appendChild(actions);$('cp-list').appendChild(card);});setMessage('cp-feedback',d.ready?d.records.length+' studio placements. No automated payment or email.':'Initialize isolated Preview storage.');}).catch(function(e){if(cpCurrent(t,r))setMessage('cp-feedback',e.message);});}
 $('cp-init').addEventListener('click',function(){if(confirm('Initialize isolated Preview commercial storage?'))cpAction({action:'initialize',confirm:'isolated-preview-only'});});$('cp-refresh').addEventListener('click',loadCommercial);
 $('cp-form').addEventListener('submit',function(e){e.preventDefault();var f=e.target;if(!cpData||!cpData.ready||!confirm('Record these agreed commercial terms?'))return;cpAction({action:'create',confirm:true,record:{studioId:f.elements.studioId.value,startsOn:f.elements.startsOn.value,endsOn:f.elements.endsOn.value,amountCents:Math.round(Number(f.elements.amount.value)*100)}});});


 function cbAPI(body){return fetch('/api/commercial-bundles',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Bundle request failed');return d;});});}
 function cbAction(body){var t=token,r=cpRevision;cbAPI(body).then(function(){if(cpCurrent(t,r))loadCommercial();}).catch(function(e){if(cpCurrent(t,r))setMessage('cb-feedback',e.message);});}
 function loadBundles(t,r,studios){cbAPI().then(function(d){if(!cpCurrent(t,r))return;$('cb-init').hidden=d.ready;$('cb-form').hidden=!d.ready;var sel=$('cb-form').elements.studioId;sel.textContent='';studios.forEach(function(s){var op=el('option','',s.name);op.value=s.id;sel.appendChild(op);});var host=$('cb-list');host.textContent='';d.records.forEach(function(x){var card=el('article','record'),info=el('div'),actions=el('div','actions'),s=studios.filter(function(s){return s.id===x.studio_id;})[0];info.appendChild(el('h3','',(s?s.name:x.studio_id)+' / '+x.product));info.appendChild(el('p','',x.state+' · USD '+(x.amount_cents/100).toFixed(2)+' · '+x.starts_on+' – '+x.ends_on));info.appendChild(el('p','','Deliverables: '+x.deliverables.join(', ')));info.appendChild(el('p','',x.brief));function act(action,reference){cbAction({action:action,id:x.id,revision:x.revision,reference:reference,confirm:true});}if(x.state==='draft')actionButton(actions,'Verify payment','',function(){var ref=prompt('Reconciliation reference after independently confirming funds');if(ref&&confirm('Confirm received funds? This does not activate placements.'))act('paid',ref);});if(x.state!=='ended')actionButton(actions,'End order','',function(){if(confirm('End order? This does not issue a refund.'))act('end');});card.appendChild(info);card.appendChild(actions);host.appendChild(card);});setMessage('cb-feedback',d.ready?d.records.length+' orders · fulfillment not automated':'Initialize isolated Preview bundle storage.');}).catch(function(e){if(cpCurrent(t,r))setMessage('cb-feedback',e.message);});}
 $('cb-init').addEventListener('click',function(){if(confirm('Initialize isolated Preview bundle storage?'))cbAction({action:'initialize',confirm:'isolated-preview-only'});});
 $('cb-form').addEventListener('submit',function(e){e.preventDefault();var f=e.target;if(!confirm('Record agreed custom terms?'))return;cbAction({action:'create',confirm:true,record:{studioId:f.elements.studioId.value,product:f.elements.product.value,startsOn:f.elements.startsOn.value,endsOn:f.elements.endsOn.value,amountCents:Math.round(Number(f.elements.amount.value)*100),brief:f.elements.brief.value}});});


 var analyticsRevision=0;
 function clearAnalytics(){analyticsRevision++;['analytics-visits','analytics-views','analytics-clicks','analytics-revenue'].forEach(function(k){$(k).textContent='—';});$('analytics-status').textContent='';}
 function loadAnalytics(){clearAnalytics();var session=token,rev=analyticsRevision;fetch('/api/operator-analytics?days='+$('analytics-period').value,{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Analytics unavailable');return d;});}).then(function(d){if(!session||session!==token||rev!==analyticsRevision||selectedTab!=='analytics')return;var t=d.traffic;if(t){$('analytics-visits').textContent=t.visits.toLocaleString();$('analytics-views').textContent=t.listingViews.toLocaleString();$('analytics-clicks').textContent=t.applyClicks.toLocaleString();}if(d.jobOrderReceiptsUSD!==null)$('analytics-revenue').textContent=String.fromCharCode(36)+d.jobOrderReceiptsUSD.toFixed(2);setMessage('analytics-status',(!d.trafficEnabled?'Traffic collection is disabled. ':'')+(!t?'Traffic table unavailable. ':'')+(d.jobOrderReceiptsUSD===null?'Payment records unavailable. ':'')+'Preview figures only; no production data.');}).catch(function(e){if(session===token&&rev===analyticsRevision)setMessage('analytics-status',e.message);});}
 $('analytics-period').addEventListener('change',loadAnalytics);$('analytics-refresh').addEventListener('click',loadAnalytics);

 $('unlock-button').addEventListener('click',unlock);$('operator-key').addEventListener('keydown',function(e){if(e.key==='Enter')unlock();});$('refresh-button').addEventListener('click',function(){api('GET').then(function(d){data=d;render();}).catch(function(err){if(/access|invalid|configured/i.test(err.message))lock(err.message);else {$('operation-error').hidden=false;setMessage('operation-error',err.message);}});});$('lock-button').addEventListener('click',function(){lock('Operator console locked.');});Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(btn){btn.addEventListener('click',function(){selectTab(btn.getAttribute('data-tab'));});});$('cancel-action').addEventListener('click',closeAction);$('execute-action').addEventListener('click',execute);$('confirm-backdrop').addEventListener('click',function(e){if(e.target===$('confirm-backdrop'))closeAction();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('confirm-backdrop').hidden)closeAction();});
var signalRecord=null;function resetSignalApproval(){signalRecord=null;$('signal-approved').checked=false;$('signal-export').disabled=true;}
$('signal-approved').addEventListener('change',function(){$('signal-export').disabled=!(signalRecord&&this.checked);});
$('signal-number').addEventListener('input',resetSignalApproval);
$('signal-export').addEventListener('click',function(){if(!token||selectedTab!=='signal'||!signalRecord||!$('signal-approved').checked)return;var url=URL.createObjectURL(new Blob([JSON.stringify(signalRecord,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='signal-'+signalRecord.editionNumber+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);});
document.getElementById('signal-generate').addEventListener('click',function(){var session=token;if(!session)return;resetSignalApproval();$('signal-subject').value='';$('signal-draft').value='';$('signal-html').value='';setMessage('signal-status','Preparing from available inventory…');fetch('/api/signal-draft?edition='+encodeURIComponent($('signal-number').value.trim()),{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Draft unavailable');return d;});}).then(function(d){if(token!==session||selectedTab!=='signal')return;$('signal-subject').value=d.draft.subject;$('signal-draft').value=d.draft.body;$('signal-html').value=d.html||'';signalRecord=d.archiveRecord||null;$('signal-export').disabled=!(signalRecord&&$('signal-approved').checked);setMessage('signal-status',d.draft.jobs.length+' jobs · '+d.draft.picks.length+' studios · '+d.draft.reading.length+' articles · '+d.coverage.snapshotShards+' fresh snapshot shards. '+(d.coverage.failed.length?'Unavailable batches: '+d.coverage.failed.join(', ')+'. ':'')+(d.draft.readyForReview?'Review before sending.':'Incomplete — do not send.'));}).catch(function(e){if(token===session)setMessage('signal-status',e.message);});});
var coverageRevision=0;
function clearCoverage(){coverageRevision++;$('coverage-output').textContent='';$('coverage-status').textContent='';$('coverage-refresh').disabled=false;}
$('coverage-refresh').addEventListener('click',function(){clearCoverage();var session=token,rev=coverageRevision;if(!session||selectedTab!=='sources')return;$('coverage-refresh').disabled=true;setMessage('coverage-status','Reading existing inventory…');function current(){return session===token&&rev===coverageRevision&&selectedTab==='sources';}fetch('/api/inventory-coverage',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Coverage unavailable');return d;});}).then(function(d){if(!current())return;var host=$('coverage-output'),roles=Object.keys(d.roles),summary=el('p','',d.total+' unique sampled jobs · '+d.freshShards+'/'+d.expectedShards+' fresh shards · '+d.gaps.length+' empty country/discipline combinations');host.appendChild(summary);host.appendChild(el('p','','Source quality: '+Object.keys(d.quality).map(function(k){return k+': '+d.quality[k];}).join(' · ')));var table=document.createElement('table');table.style.borderCollapse='collapse';function row(values,header){var tr=document.createElement('tr');values.forEach(function(v){var td=document.createElement(header?'th':'td');td.textContent=v;td.style.padding='5px 8px';td.style.textAlign='left';td.style.borderBottom='1px solid #ddd';tr.appendChild(td);});table.appendChild(tr);}row(['Country'].concat(roles,['Total']),true);row(['Worldwide'].concat(roles.map(function(r){return d.worldwide[r];}),[roles.reduce(function(n,r){return n+d.worldwide[r];},0)]),false);d.countries.forEach(function(c){row([c.name].concat(roles.map(function(r){return c.counts[r];}),[c.total]),false);});host.appendChild(table);var failed=d.batches.filter(function(b){return b.failed;});setMessage('coverage-status',d.scope+(failed.length?' · Unavailable: '+failed.map(function(b){return b.source;}).join(', '):''));}).catch(function(e){if(current())setMessage('coverage-status',e.message);}).then(function(){if(current())$('coverage-refresh').disabled=false;});});
$('readiness-isolation').addEventListener('change',function(){$('readiness-initialize').disabled=!this.checked||this.disabled;});
$('readiness-initialize').addEventListener('click',function(){var session=token,rev=readinessRevision;if(!session||selectedTab!=='readiness'||!$('readiness-isolation').checked||$('readiness-isolation').disabled)return;if(!window.confirm('Create only missing tables in independently verified isolated Preview?'))return;$('readiness-initialize').disabled=true;setMessage('readiness-status','Creating missing Preview tables…');fetch('/api/preview-readiness',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session,'Content-Type':'application/json'},body:JSON.stringify({confirm:'create-missing-preview-tables',separateDatabaseConfirmed:true})}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Schema incompatible; reload readiness');return d;});}).then(function(){if(session===token&&rev===readinessRevision&&selectedTab==='readiness')$('readiness-refresh').click();}).catch(function(e){if(session===token&&rev===readinessRevision){setMessage('readiness-status',e.message);$('readiness-isolation').checked=false;}});});
var readinessRevision=0;function clearReadiness(){readinessRevision++;$('readiness-list').textContent='';$('readiness-status').textContent='';$('readiness-comparison-result').textContent='';$('readiness-refresh').disabled=false;$('readiness-repair').hidden=true;$('readiness-isolation').checked=false;$('readiness-isolation').disabled=false;$('readiness-initialize').disabled=true;}
$('readiness-refresh').addEventListener('click',function(){clearReadiness();var session=token,rev=readinessRevision;if(!session||selectedTab!=='readiness')return;var btn=$('readiness-refresh');btn.disabled=true;setMessage('readiness-status','Checking Preview…');function current(){return session===token&&rev===readinessRevision&&selectedTab==='readiness';}fetch('/api/preview-readiness',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+session}}).then(function(r){return r.json().then(function(d){if(!r.ok||!d.ok)throw Error(d.error||'Readiness unavailable');return d;});}).then(function(d){if(!current())return;if(d.coreComparison){setMessage('readiness-comparison-result','Preview coverage_requests: '+(!d.coreComparison.present?'Missing table':d.coreComparison.missingColumns.length?'Missing columns: '+d.coreComparison.missingColumns.join(', '):'Compatible')+'. Inspected '+d.generatedAt+'.');}if(d.repair&&d.repairEnabled&&d.repair.missing.length&&!d.repair.incompatible.length){$('readiness-repair').hidden=false;$('readiness-plan').textContent='Missing tables: '+d.repair.missing.join(', ')+'. Existing rows will not be changed.';}else if(d.repair&&d.repair.incompatible.length){setMessage('readiness-plan','Incompatible tables: '+d.repair.incompatible.join(', '));$('readiness-repair').hidden=false;$('readiness-isolation').disabled=true;}d.checks.forEach(function(x){var card=el('article','record'),info=el('div');info.appendChild(el('h3','',x.label+' — '+x.state));info.appendChild(el('p','',x.detail));card.appendChild(info);$('readiness-list').appendChild(card);});setMessage('readiness-status',d.checks.filter(function(x){return x.state==='pass';}).length+' checks passed; manual verification still required.');}).catch(function(e){if(current())setMessage('readiness-status',e.message);}).then(function(){if(current())btn.disabled=false;});});
})();
