/* studio openings v0.4 — dependency-free, ES2018-compatible. All source text is escaped by textContent. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var roles = ['all','product','visual','motion','web','architecture','interior','other'];
  var state = { jobs:[], role:'all', query:'', region:'all', type:'all', sort:'newest', onlySaved:false, visible:10, demo:false };
  var STORAGE_KEY = 'worklist.saved.v02';
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (!Array.isArray(saved)) saved=[]; } catch(e) { saved=[]; }
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch(e) {} }
  function formatDate(value) {
    var d = new Date(value); if (isNaN(d.getTime())) return 'Date n/a';
    var diff = Math.max(0,Date.now()-d.getTime()); var days = Math.floor(diff/86400000);
    if (days===0) return 'Today'; if (days===1) return '1 day ago'; if (days<30) return days+'d ago';
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }
  function safeUrl(url) { try {var u=new URL(url); return u.protocol==='https:' && (u.hostname==='jobicy.com'||u.hostname.endsWith('.jobicy.com')||u.hostname==='himalayas.app'||u.hostname.endsWith('.himalayas.app'));} catch(e) {return false;} }
  function isUS(loc) {var s=String(loc||'').toLowerCase();return /\b(us|usa|united states|north america|america|worldwide|anywhere|global)\b/.test(s);}
  function isWorldwide(loc) { return /\b(worldwide|anywhere|global)\b/i.test(String(loc||'')); }
  function matchType(job,filter) { var t=String(job.type||'').toLowerCase(); if (filter==='all') return true; if(filter==='contract')return /contract|freelan/.test(t);if(filter==='full-time')return /full[\s-]?time/.test(t);if(filter==='part-time')return /part[\s-]?time/.test(t);return t.indexOf(filter)!==-1; }
  function eligible(job) {
    if(state.role!=='all' && state.role!==job.role) return false;
    if(state.onlySaved && saved.indexOf(job.id)===-1) return false;
    if(state.region==='us' && !isUS(job.location)) return false;
    if(state.region==='worldwide' && !isWorldwide(job.location)) return false;
    if(!matchType(job,state.type)) return false;
    if(state.query) {
      var q=state.query.toLowerCase();
      var hay=[job.title,job.company,job.location,job.type,job.role].join(' ').toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  }
  function jobSort(a,b) {
    if(state.sort==='az')return a.title.localeCompare(b.title);
    if(state.sort==='company')return a.company.localeCompare(b.company);
    return new Date(b.posted).getTime()-new Date(a.posted).getTime();
  }
  function createRow(job) {
    var fragment=$('job-template').content.cloneNode(true);
    var row=fragment.querySelector('.job-row');
    var title=row.querySelector('.job-title');
    title.textContent=job.title;
    if(!state.demo && safeUrl(job.url)) { title.href=job.url; title.setAttribute('aria-label','Open '+job.title+' at '+job.company+' via '+job.source); }
    else {title.removeAttribute('href');title.classList.add('demo-title');}
    row.querySelector('.job-company').textContent=job.company;
    row.querySelector('.job-location').textContent=job.location || 'Location not specified';
    row.querySelector('.job-type').textContent=job.type || 'Type not specified';
    var salary=row.querySelector('.job-salary'); salary.textContent=job.salary || 'Not disclosed';
    if(!job.salary)salary.classList.add('missing');
    var time=row.querySelector('.job-date'); time.textContent=formatDate(job.posted);time.dateTime=job.posted;
    var meta=row.querySelector('.job-extra');
    if(state.demo){ meta.textContent='Example listing · not a real vacancy'; }
    else {
      var source=document.createElement('a');source.textContent='via '+job.source;source.href=job.url;source.target='_blank';source.rel='noopener noreferrer';meta.appendChild(source);
      if(job.seniority){ var level=document.createElement('span');level.textContent=' · '+job.seniority;meta.appendChild(level); }
    }
    var btn=row.querySelector('.save-button');
    var selected=saved.indexOf(job.id)!==-1;
    btn.classList.toggle('active',selected);
    btn.setAttribute('aria-label',(selected?'Remove saved job: ':'Save job: ')+job.title);
    btn.setAttribute('aria-pressed',String(selected));
    btn.title=selected?'Remove saved job':'Save job';
    btn.addEventListener('click',function(){
      var i=saved.indexOf(job.id); if(i>=0)saved.splice(i,1);else saved.push(job.id);
      persist();render();
    });
    return fragment;
  }
  function render() {
    var sb=$('saved-count');sb.textContent=saved.length;
    var st=$('saved-toggle');st.classList.toggle('active',state.onlySaved);st.setAttribute('aria-pressed',String(state.onlySaved));
    Array.prototype.forEach.call(document.querySelectorAll('.category'),function(btn){var active=btn.getAttribute('data-role')===state.role;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    var filtered=state.jobs.filter(eligible).sort(jobSort);
    $('results-summary').textContent=state.demo ? 'Sample listings' : 'Current listings';
    var list=$('job-list');list.textContent='';
    var frag=document.createDocumentFragment();filtered.slice(0,state.visible).forEach(function(job){frag.appendChild(createRow(job));});list.appendChild(frag);
    $('empty-state').hidden=!(filtered.length===0 && state.jobs.length>0);
    $('more').hidden=filtered.length<=state.visible;
  }
  function reset() {
    state.role='all';state.region='all';state.type='all';state.query='';state.onlySaved=false;state.sort='newest';state.visible=10;
    $('search').value='';$('region').value='all';$('job-type').value='all';$('sort').value='newest';render();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.category'),function(b){b.addEventListener('click',function(){state.role=b.getAttribute('data-role');state.visible=10;render();});});
  $('search').addEventListener('input',function(){state.query=this.value.trim();state.visible=10;render();});
  $('region').addEventListener('change',function(){state.region=this.value;state.visible=10;render();});
  $('job-type').addEventListener('change',function(){state.type=this.value;state.visible=10;render();});
  $('sort').addEventListener('change',function(){state.sort=this.value;render();});
  $('saved-toggle').addEventListener('click',function(){state.onlySaved=!state.onlySaved;state.visible=10;render();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  $('more').addEventListener('click',function(){state.visible+=20;render();});
  document.addEventListener('keydown',function(e){if(e.key==='/'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='SELECT'){e.preventDefault();$('search').focus();}});
  var SAMPLE=[
    ['Senior Product Designer','Example Studio','United States','Full-time','$120k–$160k / yr','product'],
    ['Brand Designer','Sample Creative Co.','Worldwide','Contract','$55–$75 / hr','visual'],
    ['Junior Architect','Sample Architecture Studio','New York, NY','Full-time','', 'architecture'],
    ['Motion Designer','Demo Motion Lab','North America','Full-time','', 'motion'],
    ['UX Researcher','Illustration Company (demo)','United States','Full-time','$95k–$115k / yr','product'],
    ['Webflow Designer','Placeholder Studio','Worldwide','Contract','', 'web'],
    ['3D Artist','Fictional Games LLC','United States','Full-time','$90k–$120k / yr','motion'],
    ['Interior Designer','Demo Interiors','Los Angeles, CA','Contract','', 'interior'],
    ['Visual Designer','Demo Agency','Europe','Full-time','', 'visual'],
    ['Design Systems Specialist','Sample Product Inc.','Worldwide','Full-time','$135k–$170k / yr','product'],
    ['Creative Technologist','Example Media','United States','Contract','', 'web'],
    ['Illustrator','Fictional Creative','Worldwide','Part-time','', 'visual'],
    ['BIM Coordinator','Example Built Environment','Boston, MA','Full-time','', 'architecture'],
    ['Furniture Designer','Sample Objects Lab','Worldwide','Full-time','', 'interior']
  ];
  function displayPreview() {
    state.demo=true;
    state.jobs=SAMPLE.map(function(j,i){return {id:'sample-'+i,title:j[0],company:j[1],location:j[2],type:j[3],salary:j[4],role:j[5],posted:new Date(Date.now()-i*86400000).toISOString(),source:'Preview',url:'',seniority:''};});
    $('updated-label').textContent='Local design preview';
    var msg=$('system-message');msg.classList.add('error');msg.textContent='PREVIEW MODE — sample rows only, not actual vacancies. Deploy this project to Cloudflare Pages to load current jobs automatically.';
    $('list-footnote').textContent='Preview-only sample rows. These are not real job openings. Live jobs are loaded by the Cloudflare Pages Function on deployment.';
    render();
  }
  function displayError() {
    $('system-message').classList.add('error');
    $('system-message').textContent='Unable to load current jobs. Please refresh later. We never show expired vacancies as live listings.';
    $('updated-label').textContent='Feed unavailable';
    $('results-summary').textContent='Live listings unavailable';
  }
  function loadJobs() {
    if(location.protocol==='file:' || location.protocol==='about:' || location.hostname==='localhost' || location.hostname==='127.0.0.1') { displayPreview();return; }
    fetch('/api/jobs',{credentials:'omit'}).then(function(resp){if(!resp.ok)throw new Error('HTTP '+resp.status);return resp.json();}).then(function(data){
      if(!data||!Array.isArray(data.jobs))throw new Error('Bad feed');
      state.jobs=data.jobs.filter(function(j){return j&&j.id&&j.title&&j.company&&safeUrl(j.url);});
      $('system-message').hidden=true;
      $('updated-label').textContent='Feed checked '+new Date(data.updatedAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      if(state.jobs.length===0) { $('system-message').hidden=false;$('system-message').classList.add('error');$('system-message').textContent='No creative job openings found in the current feeds. Check back soon.'; }
      render();
    }).catch(displayError);
  }
  loadJobs();
})();
