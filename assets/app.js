/* Studio Openings v0.5 — small browser-only interface. No libraries, accounts or payment systems. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var roleLabels = {
    architecture:'Architecture / Landscape', interior:'Interior / Spatial', industrial:'Industrial / Physical Product',
    product:'Product / UX / UI', visual:'Graphic / Brand', motion:'Motion / 3D', fashion:'Fashion / Photography',
    web:'Web / Creative Tech', museum:'Museum / Exhibition', culture:'Arts / Cultural Production'
  };
  var state = {jobs:[], selectedRoles:[], keywords:[], keywordMatch:'any', query:'', region:'all', type:'all', mode:'all', hasPay:false, sort:'relevant', onlySaved:false, visible:10, review:false};
  // Tags are a publication requirement: 1–3 verified role/skill labels per job.
  // No user search counts, guessed qualifications, or random tag promotion.
  var PREFERENCES_KEY='studio-openings.keywords.v05';
  try {
    var pref=JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}');
    if(pref && Array.isArray(pref.keywords)) {
      var oldNames={Graphic:'Graphic Design',Product:'Product Design',Motion:'Motion Design',Industrial:'Industrial Design'};
      state.keywords=pref.keywords.filter(function(x){return typeof x==='string' && x.length<35;}).map(function(x){return oldNames[x]||x;}).filter(function(x,i,a){return a.indexOf(x)===i;}).slice(0,15);
    }
    if(pref && pref.match==='all')state.keywordMatch='all';
  }catch(e){}
  function persistKeywords(){try{localStorage.setItem(PREFERENCES_KEY,JSON.stringify({keywords:state.keywords,match:state.keywordMatch}));}catch(e){}}
  var ROLE_TAG={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',product:'Product Design',visual:'Graphic Design',motion:'Motion Design',fashion:'Fashion',web:'Web Design',museum:'Exhibition',culture:'Creative Arts'};
  function jobKeywords(job){
    var role=categoryFor(job);
    if(!ROLE_TAG[role])return [];
    var title=String(job.title||'').toLowerCase();
    var details=(title+' '+String(job.description||job.summary||'')).toLowerCase().slice(0,12000);
    var tags=[];
    function add(label,condition){if(condition && tags.indexOf(label)<0)tags.push(label);}
    // Source-normalized backend tags can be used if they are recognized and concise.
    var allowable={Architecture:1,'Interior':1,'Industrial Design':1,'Product Design':1,'Graphic Design':1,'Motion Design':1,'Fashion':1,'Web Design':1,'Exhibition':1,'Creative Arts':1,'Preservation':1,'Urban Planning':1,'Landscape':1,'CAD':1,'UX/UI':1,'Branding':1,'Illustration':1,'3D':1,'Photography':1,'Sound':1,'Revit':1,'AutoCAD':1,'BIM':1,'Figma':1,'Rhino':1,'SketchUp':1,'Adobe':1,'Public Sector':1};
    if(Array.isArray(job.tags))job.tags.forEach(function(t){if(allowable[t])add(t,true);});
    // Detect specialties from the role title. A bare 'architect' is NOT enough
    // unless backend classification verified it as a physical design role.
    add('Preservation',/\b(?:preservation|historic preservation|heritage)\b/.test(title));
    add('Urban Planning',/\b(?:urban|regional|city|town)\s+plann?|\bplanning coordinator\b/.test(title));
    add('Landscape',/\blandscape\b/.test(title));
    add('CAD',/\bcadd?\b|\bdraft(?:er|ing|sperson)?\b/.test(title));
    add('UX/UI',/\bux\b|\bui\b|user experience|user interface|interaction design/.test(title));
    add('Branding',/\bbrand(?:ing)?\b|identity design/.test(title));
    add('Illustration',/illustrat/.test(title));
    add('3D',/\b3d\b|visuali[sz]ation|\bvfx\b/.test(title));
    add('Photography',/photograph/.test(title));
    add('Sound',/sound design|audio design/.test(title));
    // Every accepted role has one role-level tag. It describes a category,
    // not a claimed software skill or a guessed applicant requirement.
    add(ROLE_TAG[role],true);
    // Only show software/production skills explicitly mentioned in the source.
    add('Revit',/\brevit\b/.test(details));
    add('AutoCAD',/\bautocad\b/.test(details));
    add('BIM',/\bbim\b/.test(details));
    add('Figma',/\bfigma\b/.test(details));
    add('Rhino',/\brhino\b/.test(details));
    add('SketchUp',/\bsketchup\b/.test(details));
    add('Adobe',/adobe (?:creative|illustrator|photoshop|indesign)/.test(details));
    if(job.source==='NYC Open Data')add('Public Sector',true);
    return tags.slice(0,3);
  }
  function tagColorFor(word){
    var s=String(word||'').trim().toLowerCase(),h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    h=h>>>0;
    var mixed=h;mixed^=mixed>>>16;mixed=Math.imul(mixed,0x7feb352d);
    mixed^=mixed>>>15;mixed=Math.imul(mixed,0x846ca68b);mixed^=mixed>>>16;
    var hue=(mixed>>>0)%360,sat=64+((h>>>12)%12),light=84+((h>>>20)%6);
    return 'hsl('+hue+', '+sat+'%, '+light+'%)';
  }
  function styleTag(tag,word){tag.style.backgroundColor=tagColorFor(word);}
  function displayableJob(job){
    if(!job||!job.id||!job.title||!job.company)return false;
    if((job.applicationMethod||'external')==='external'&&!safeUrl(job.url))return false;
    return categoryFor(job)!=='not-creative'&&jobKeywords(job).length>0;
  }
  function toggleKeyword(label){
    var i=state.keywords.indexOf(label);
    if(i>=0)state.keywords.splice(i,1);else if(state.keywords.length<15)state.keywords.push(label);
    state.visible=10;persistKeywords();render();
  }
  function renderKeywords(){
    var active=state.keywords.length>0;
    $('preferences-bar').hidden=!active;
    $('keyword-match').value=state.keywordMatch;
    var picker=$('add-keyword');picker.textContent='';
    var blank=document.createElement('option');blank.value='';blank.textContent='+ Add keyword';picker.appendChild(blank);
    var allKeywords=[];
    state.jobs.forEach(function(job){jobKeywords(job).forEach(function(word){if(allKeywords.indexOf(word)<0)allKeywords.push(word);});});
    allKeywords.sort().forEach(function(word){
      if(state.keywords.indexOf(word)>=0)return;
      var option=document.createElement('option');option.value=word;option.textContent=word;picker.appendChild(option);
    });
    var el=$('selected-keywords');el.textContent='';
    state.keywords.forEach(function(word){
      var button=document.createElement('button');button.type='button';button.className='keyword-selected';
      button.textContent=word+' ×';button.title='Remove '+word+' preference';
      styleTag(button,word);
      button.setAttribute('aria-label','Remove '+word+' preference');
      button.addEventListener('click',function(){toggleKeyword(word);});el.appendChild(button);
    });
  }
  var STORAGE_KEY='studio-openings.saved.v05';
  var saved=[];
  try {saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(saved))saved=[];} catch(e) {saved=[];}
  function persist() {try {localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){}}
  function trim(v) {return String(v||'').trim();}
  function safeUrl(url) {
    try {
      var u=new URL(url),h=u.hostname.toLowerCase();
      return u.protocol==='https:'&&!u.username&&!u.password&&h.indexOf('.')>0 &&
        !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(h);
    }catch(e){return false;}
  }
  // One restrained print-style highlight per broad creative-discipline group.
  function swatchFor(job){
    var role=categoryFor(job);
    if(role==='architecture'||role==='interior'||role==='industrial')return 'built';
    if(role==='museum'||role==='culture')return 'arts';
    return 'visual';
  }
  function categoryFor(job) {
    var r=trim(job.role).toLowerCase(), t=trim(job.title).toLowerCase();
    if(r==='other'){
      if(/museum|exhibit|gallery|curat|heritage|archiv/.test(t))return 'museum';
      return 'culture';
    }
    if(r==='product'&&/\bindustrial\b|physical product|furniture design/.test(t))return 'industrial';
    if(/\barchitect(?:s|ure|ural)?\b/.test(t)&&/\b(?:sap|s\/4hana|salesforce|servicenow|oracle|erp|aws|azure|cloud|software|solution(?:s)?|enterprise|data|database|systems?|network|cybersecurity|security|platform|infrastructure|devops|api|application|integration|technical|technology|information|it)\b/.test(t))return 'not-creative';
    return roleLabels[r]?r:'culture';
  }
  function dateLabel(job) {
    var src=trim(job.posted), d=src?new Date(src):null;
    var action=job.dateKind==='updated'?'Updated':job.dateKind==='added'||/direct|curated/i.test(trim(job.source))?'Added':'Posted';
    if(d&&!isNaN(d.getTime())&&d.getTime()<=Date.now()+86400000)
      return {label:action+' '+d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}),date:src};
    var checked=trim(job.verifiedAt);
    d=checked?new Date(checked+'T12:00:00'):null;
    if(d&&!isNaN(d.getTime()))return {label:'Checked '+d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),date:checked};
    return {label:'Date unavailable',date:''};
  }
  // Compact eligibility labels are display-only. Preserve the original source text
  // in the title attribute; never infer citizenship or broad regional eligibility
  // from a physical worksite location alone.
  function eligibilityLabel(job){
    var raw=trim(job.eligibility||job.notice);
    var source=raw.toLowerCase();
    var loc=trim(job.location).toLowerCase();
    if(/u\.?s\.?\s+citizens?\s*\/\s*nationals?|u\.?s\.?\s+citizens?\s+or\s+nationals?/.test(source))return 'US citizens/nationals';
    if(/u\.?s\.?\s+citizenship|required.*u\.?s\.?\s+citizenship|u\.?s\.?\s+citizens?\b/.test(source))return 'US citizens';
    if(/federal hiring eligibility|check.*eligibility/.test(source))return 'Check eligibility';
    if(/civil service exam|eligible list|exam\/list/.test(source))return 'Exam/list';
    if(/us work authorization|work authorization.*united states/.test(source))return 'US work auth.';
    if(/nyc residency/.test(source))return 'NYC residency';
    if(/worldwide|globally|open globally|open worldwide/.test(source)||/^(worldwide|global|anywhere)$/.test(loc))return 'Worldwide';
    if(/\bapac\b|asia.pacific/.test(source)||/^(apac|asia.pacific)( only)?$/.test(loc))return 'APAC only';
    if(/\bemea\b|\bsmea\b/.test(source)||/^(emea|smea)( only)?$/.test(loc))return 'EMEA';
    if(/\blatam\b|latin america/.test(source)||/^(latam|latin america)( only)?$/.test(loc))return 'LATAM';
    if(/^(united states|u\.?s\.?a?\.?)( only)?$/.test(loc)||/u\.?s\.?-based applicants/.test(source))return 'US only';
    if(/^(united arab emirates|uae)( only)?$/.test(loc)||/uae-based applicants/.test(source))return 'UAE only';
    if(/^(us\s*\/\s*uk\s*\/\s*india only)$/.test(loc))return 'US/UK/IN only';
    if(/^(philippines\s*\/\s*south africa only)$/.test(loc))return 'PH/ZA only';
    if(/^(americas only)$/.test(loc)||/americas-based applicants/.test(source))return 'Americas only';
    if(/^(canada only)$/.test(loc)||/canada-based applicants/.test(source))return 'CA only';
    if(/^(poland|poland only)$/.test(loc)||/poland only/.test(source))return 'PL only';
    if(/^(united kingdom|uk)( only)?$/.test(loc)||/uk-based applicants/.test(source))return 'UK only';
    if(!raw)return '';
    return 'Restricted';
  }
  // Compact eligibility labels are display-only. Preserve the original source text
  // in the title attribute; never infer citizenship or broad regional eligibility
  // from a physical worksite location alone.
  function usMatch(loc) {return /\b(us|usa|united states|washington|california|new york|ny|dc|norfolk|salisbury|americas|worldwide|global)\b/i.test(loc);}
  function worldwideMatch(loc){return /\b(worldwide|anywhere|all countries|global)\b/i.test(loc);}
  function matchesType(job,value){
    var t=trim(job.type).toLowerCase();
    if(value==='all')return true;
    if(value==='contract')return /contract|freelan/.test(t);
    if(value==='full-time')return /full[\s-]?time/.test(t);
    if(value==='part-time')return /part[\s-]?time/.test(t);
    return t.indexOf(value)!==-1;
  }
  function eligible(job){
    var role=categoryFor(job);
    if(role==='not-creative')return false;
    if(state.selectedRoles.length&&state.selectedRoles.indexOf(role)<0)return false;
    if(state.onlySaved&&saved.indexOf(job.id)<0)return false;
    if(state.region==='us'&&!usMatch(trim(job.location)))return false;
    if(state.region==='worldwide'&&!worldwideMatch(trim(job.location)))return false;
    if(state.mode!=='all'&&trim(job.mode).toLowerCase()!==state.mode)return false;
    if(!matchesType(job,state.type))return false;
    if(state.hasPay&&!trim(job.salary))return false;
    if(state.keywords.length){
      var tags=jobKeywords(job);
      var matched=state.keywordMatch==='all' ? state.keywords.every(function(k){return tags.indexOf(k)>=0;}) : state.keywords.some(function(k){return tags.indexOf(k)>=0;});
      if(!matched)return false;
    }
    var hay=[job.title,job.company,job.location,job.type,job.mode,job.eligibility,roleLabels[role],job.seniority].join(' ').toLowerCase();
    return !state.query||state.query.toLowerCase().split(/\s+/).every(function(part){return hay.indexOf(part)!==-1;});
  }
  function sortJobs(a,b){
    if(state.sort==='review')return (a.reviewOrder||0)-(b.reviewOrder||0);
    if(state.sort==='az')return a.title.localeCompare(b.title);
    if(state.sort==='company')return a.company.localeCompare(b.company);
    if(state.sort==='relevant'){
      var score=function(job){
        var quality=Number(job.qualityScore);
        if(isFinite(quality)&&quality>0)return quality;
        var n=Number(job.relevance);
        if(isFinite(n)&&n>0)return n;
        return /direct|curated/i.test(trim(job.source))?96:0;
      };
      var diff=score(b)-score(a);
      if(diff!==0)return diff;
    }
    var ad=a.posted?Date.parse(a.posted):0, bd=b.posted?Date.parse(b.posted):0;
    return (isFinite(bd)?bd:0)-(isFinite(ad)?ad:0);
  }
  var activeJob=null,lastOpener=null;
  // A shareable vacancy address keeps the existing list layout unchanged.
  // The query parameter is a job identifier, never a URL or HTML fragment.
  function jobIdFromUrl(){
    try { return new URL(window.location.href).searchParams.get('job') || ''; }
    catch(e){ return ''; }
  }
  function jobLinkFor(id){
    var url=new URL(window.location.href);
    if(id) url.searchParams.set('job',String(id));
    else url.searchParams.delete('job');
    return url.href;
  }
  function updateJobUrl(id,method){
    if(!window.history || !window.history.pushState || !window.history.replaceState) return;
    try {
      var target=jobLinkFor(id);
      if(target!==window.location.href){
        window.history[method==='push'?'pushState':'replaceState']({studioJob:id||null},'',target);
      }
    }catch(e){}
  }
  function syncJobFromUrl(){
    var id=jobIdFromUrl();
    if(!id){ closeDrawer(true); return; }
    var job=state.jobs.filter(function(candidate){return String(candidate.id)===id;})[0];
    if(job){
      // Do not change history or rerender the list on a browser Back/Forward event.
      if(!activeJob || String(activeJob.id)!==id)openDrawer(job,null,true);
      $('job-link-message').hidden=true;
    }else{
      closeDrawer(true);
      // A source may have removed or expired the shared vacancy.
      $('job-link-message').textContent='This shared job is not in the current listings. It may have expired or been removed.';
      $('job-link-message').hidden=false;
    }
  }
  function niceMode(value){return ({onsite:'On-site',remote:'Remote',hybrid:'Hybrid'})[trim(value).toLowerCase()]||'Not specified';}
  function updateDrawerSaved(){
    var selected=!!activeJob&&saved.indexOf(activeJob.id)>=0;
    $('drawer-save').textContent=selected?'Saved ✓':'Save job';
    $('drawer-save').setAttribute('aria-pressed',String(selected));
  }
  function openDrawer(job,opener,fromUrl){
    var method=job.applicationMethod||'external';
    if(method==='external'&&!safeUrl(job.url))return;
    activeJob=job;lastOpener=opener||null;
    $('job-drawer').setAttribute('data-swatch',swatchFor(job));
    $('job-link-message').hidden=true;
    if(!fromUrl)updateJobUrl(job.id,'push');
    $('drawer-title').textContent=job.title;
    $('drawer-company').textContent=job.company;
    var meta=$('drawer-meta');meta.textContent='';
    [trim(job.location)||'Region not stated',niceMode(job.mode),trim(job.type)].filter(function(v){return v&&v!=='Not specified';}).forEach(function(value,i){
      if(i){var separator=document.createElement('span');separator.textContent='|';separator.className='drawer-divider';meta.appendChild(separator);}
      var item=document.createElement('span');item.textContent=value;meta.appendChild(item);
    });
    var salary=trim(job.salary);$('drawer-pay').textContent=salary||'Not disclosed';
    var eligibility=eligibilityLabel(job);
    $('drawer-eligibility').textContent=eligibility;
    $('drawer-eligibility').hidden=!eligibility;
    $('drawer-eligibility').title=trim(job.eligibility||job.notice)||'';
    var aux=$('drawer-aux');aux.textContent='';
    [[job.seniority,'Seniority'],[job.listingId,'Official job ID'],[job.closesOn,'Posting closes']].forEach(function(entry){
      if(!trim(entry[0]))return;
      var p=document.createElement('p');var strong=document.createElement('strong');strong.textContent=entry[1]+': ';
      p.appendChild(strong);p.appendChild(document.createTextNode(trim(entry[0])));aux.appendChild(p);
    });
    var excerpt=trim(job.description||job.summary);
    $('drawer-description-text').textContent=excerpt||'A detailed description is not included in this listing data.';
    $('drawer-description-note').textContent=excerpt?(job.descriptionKind==='editorial-summary'?'Editorial summary based on the linked vacancy. Always check the full original job description and eligibility.':'This is a source-provided excerpt. See the original listing for requirements and full details.'):'Read the original vacancy for responsibilities, qualifications, eligibility and application instructions.';
    $('drawer-check-date').textContent=dateLabel(job).label;
    $('drawer-source-label').textContent=trim(job.source)?'Source: '+trim(job.source):'';
    var apply=$('drawer-apply');
    apply.hidden=false;
    apply.dataset.method=method;
    apply.href=method==='external'?job.url:method==='email'?'mailto:'+encodeURIComponent(job.applicationEmail||'')+'?subject='+encodeURIComponent('Application: '+job.title):'#apply';
    apply.textContent=method==='native'?'Apply on Studio Openings':method==='email'?'Apply by email':'View full job & apply';
    if(method==='email'&&!job.applicationEmail){apply.hidden=true;}

    updateDrawerSaved();
    closeShareMenu();
    configureShareOptions(job);
    $('drawer-backdrop').hidden=false;
    $('job-drawer').hidden=false;
    // Preserve the results width when locking body scroll (scrollbar disappears).
    var scrollbarWidth=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
    document.body.style.paddingRight=scrollbarWidth?scrollbarWidth+'px':'';
    document.body.classList.add('drawer-open');
    $('drawer-close').focus();
  }
  function closeDrawer(fromUrl){
    closeShareMenu();
    if(!fromUrl)updateJobUrl(null,'replace');
    if($('job-drawer').hidden)return;
    $('job-drawer').hidden=true;
    $('drawer-backdrop').hidden=true;
    document.body.classList.remove('drawer-open');
    document.body.style.paddingRight='';
    activeJob=null;
    if(lastOpener&&document.contains(lastOpener))lastOpener.focus();
    lastOpener=null;
  }
  function rowFor(job){
    var frag=$('job-template').content.cloneNode(true),row=frag.querySelector('.job-row'),open=row.querySelector('.job-open'),head=row.querySelector('.job-open-head');
    row.setAttribute('data-swatch',swatchFor(job));
    head.querySelector('.job-title').textContent=job.title;
    // Preserve the complete title on hover; existing aria-label already gives the full title and company.
    head.title=job.title;
    var employer=row.querySelector('.job-open-company');
    employer.querySelector('.job-company').textContent=job.company;
    var age=row.querySelector('.job-age'),dateValue=trim(job.posted);
    if(dateValue){
      var date=new Date(dateValue),milliseconds=date.getTime();
      if(!isNaN(milliseconds)){
        var diff=Date.now()-milliseconds;
        if(diff>=-24*60*60*1000){
          var days=Math.max(0,Math.floor(diff/86400000));
          age.textContent=days===0?'Today':days<30?days+'d':days<365?Math.floor(days/30)+'mo':Math.floor(days/365)+'y';
          age.dateTime=date.toISOString();
          age.title=dateLabel(job).label;
          age.setAttribute('aria-label',age.title);age.hidden=false;
        }
      }
    }
    var keywordContainer=row.querySelector('.job-keywords');
    jobKeywords(job).forEach(function(word){
      var chip=document.createElement('button');chip.type='button';chip.className='job-keyword';
      if(state.keywords.indexOf(word)>=0)chip.classList.add('selected');
      chip.textContent=word;chip.setAttribute('aria-pressed',String(state.keywords.indexOf(word)>=0));
      styleTag(chip,word);
      chip.title=state.keywords.indexOf(word)>=0?'Remove '+word+' from preferences':'Add '+word+' to preferences';
      chip.addEventListener('click',function(event){event.stopPropagation();toggleKeyword(word);});
      keywordContainer.appendChild(chip);
    });
    // Omit unverified metadata rather than repeating "Not specified" on every row.
    var meta=open.querySelector('.job-meta');meta.textContent='';
    var items=[trim(job.location)||'Region not stated',niceMode(job.mode),trim(job.type)]
      .filter(function(value){return value&&value!=='Not specified';});
    items.forEach(function(value,index){
      if(index){var divider=document.createElement('span');divider.className='job-divider';divider.textContent='|';divider.setAttribute('aria-hidden','true');meta.appendChild(divider);}
      var span=document.createElement('span');span.textContent=value;meta.appendChild(span);
      if(index===0&&job.locationKind==='eligibility')span.title='Remote applicant eligibility region; not the employer office address';
    });
    var salary=open.querySelector('.job-salary');salary.textContent=trim(job.salary)||'Salary not disclosed';
    if(!trim(job.salary))salary.classList.add('missing');
    var notice=eligibilityLabel(job);
    var noticeNode=open.querySelector('.job-notice');noticeNode.textContent=notice;noticeNode.hidden=!notice;
    noticeNode.title=trim(job.eligibility||job.notice)||'';
    open.setAttribute('aria-label','View details: '+job.title+' at '+job.company);
    head.setAttribute('aria-label','View details: '+job.title+' at '+job.company);
    employer.setAttribute('aria-label','View details: '+job.title+' at '+job.company);
    open.addEventListener('click',function(){openDrawer(job,open);});
    head.addEventListener('click',function(){openDrawer(job,head);});
    employer.addEventListener('click',function(){openDrawer(job,employer);});
    return frag;
  }
  function render(){
    renderKeywords();
    $('saved-count').textContent=saved.length;
    $('saved-toggle').setAttribute('aria-pressed',String(state.onlySaved));
    $('saved-toggle').classList.toggle('active',state.onlySaved);
    var selected=state.selectedRoles.length;
    $('filter-indicator').textContent=selected?selected+' selected':(document.querySelector('.sidebar').classList.contains('expanded')?'−':'+');
    $('clear-disciplines').textContent=selected?'clear ('+selected+')':'all';
    var list=state.jobs.filter(eligible).sort(sortJobs);
    $('results-summary').textContent=state.review?'Real-job review · 16 Nov 2026':'Current listings';
    var wasOpen=!$('job-drawer').hidden;
    closeDrawer(true);
    if(wasOpen)updateJobUrl(null,'replace');
    var root=$('job-list');root.textContent='';var fragment=document.createDocumentFragment();
    list.slice(0,state.visible).forEach(function(job){fragment.appendChild(rowFor(job));});root.appendChild(fragment);
    $('empty-state').hidden=!(list.length===0&&state.jobs.length>0);
    $('more').hidden=list.length<=state.visible;
  }
  function reset(){
    state.keywords=[];state.keywordMatch='any';persistKeywords();state.selectedRoles=[];state.query='';state.region='all';state.type='all';state.mode='all';state.hasPay=false;state.onlySaved=false;state.sort=state.review?'review':'relevant';state.visible=10;
    $('search').value='';$('region').value='all';$('job-type').value='all';$('work-mode').value='all';$('has-pay').checked=false;$('sort').value=state.sort;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="discipline"]'),function(c){c.checked=false;});
    render();
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="discipline"]'),function(c){c.addEventListener('change',function(){
    state.selectedRoles=Array.prototype.filter.call(document.querySelectorAll('input[name="discipline"]'),function(x){return x.checked;}).map(function(x){return x.value;});state.visible=10;render();
  });});
  $('clear-disciplines').addEventListener('click',function(){state.selectedRoles=[];Array.prototype.forEach.call(document.querySelectorAll('input[name="discipline"]'),function(c){c.checked=false;});state.visible=10;render();});
  $('mobile-filter-toggle').addEventListener('click',function(){var expanded=$('mobile-filter-toggle').getAttribute('aria-expanded')==='true';$('mobile-filter-toggle').setAttribute('aria-expanded',String(!expanded));document.querySelector('.sidebar').classList.toggle('expanded',!expanded);render();});
  $('clear-keywords').addEventListener('click',function(){state.keywords=[];state.visible=10;persistKeywords();render();});
  $('add-keyword').addEventListener('change',function(){if(this.value)toggleKeyword(this.value);});
  $('keyword-match').addEventListener('change',function(){state.keywordMatch=this.value==='all'?'all':'any';state.visible=10;persistKeywords();render();});
  $('search').addEventListener('input',function(){state.query=this.value.trim();state.visible=10;render();});
  $('region').addEventListener('change',function(){state.region=this.value;state.visible=10;render();});
  $('job-type').addEventListener('change',function(){state.type=this.value;state.visible=10;render();});
  $('work-mode').addEventListener('change',function(){state.mode=this.value;state.visible=10;render();});
  $('has-pay').addEventListener('change',function(){state.hasPay=this.checked;state.visible=10;render();});
  $('sort').addEventListener('change',function(){state.sort=this.value;render();});
  $('saved-toggle').addEventListener('click',function(){state.onlySaved=!state.onlySaved;state.visible=10;render();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  $('more').addEventListener('click',function(){state.visible+=20;render();});
  $('drawer-close').addEventListener('click',function(){closeDrawer(false);});
  $('drawer-backdrop').addEventListener('click',function(){closeDrawer(false);});
  window.addEventListener('popstate',syncJobFromUrl);
  function clipboardFallback(textValue){
    var input=document.createElement('textarea');input.value=textValue;
    input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';
    document.body.appendChild(input);input.select();
    var ok=false;
    try{ok=document.execCommand('copy');}catch(e){}
    document.body.removeChild(input);
    return ok;
  }
  function closeShareMenu(){
    $('drawer-share-menu').hidden=true;
    $('drawer-share').setAttribute('aria-expanded','false');
  }
  function publicShareUrl(job){
    if(shareReviewMode())return jobLinkFor(job.id);
    return jobLinkFor(job.id);
  }
  function shareText(job){return job.title+' — '+job.company+' | Studio Openings';}
  function shareReviewMode(){return window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';}
  function configureShareOptions(job){
    var url=publicShareUrl(job), textValue=shareText(job), encodedUrl=encodeURIComponent(url),encodedText=encodeURIComponent(textValue);
    $('share-whatsapp').href='https://api.whatsapp.com/send?text='+encodeURIComponent(textValue+'\n'+url);
    $('share-x').href='https://x.com/intent/tweet?text='+encodedText+'&url='+encodedUrl;
    $('share-reddit').href='https://www.reddit.com/submit?url='+encodedUrl+'&title='+encodedText;
    $('share-linkedin').href='https://www.linkedin.com/sharing/share-offsite/?url='+encodedUrl;
    $('share-email').href='mailto:?subject='+encodedText+'&body='+encodeURIComponent(textValue+'\n'+url);
    $('share-native').hidden=typeof navigator.share!=='function';
    $('share-status').hidden=!shareReviewMode();
    $('share-status').textContent=shareReviewMode()?'Offline preview links are not public. Sharing works after deployment.':'';
  }
  function copyJobUrl(button){
    if(!activeJob)return;
    var url=publicShareUrl(activeJob);
    function feedback(ok){
      var normal=button.id==='drawer-copy'?'Copy link':'Copy link';
      button.textContent=ok?'Copied': 'Copy failed';
      window.setTimeout(function(){button.textContent=normal;},1800);
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){feedback(true);},function(){feedback(clipboardFallback(url));});
    }else feedback(clipboardFallback(url));
  }
  $('drawer-share').addEventListener('click',function(){
    if(!activeJob)return;
    var opening=$('drawer-share-menu').hidden;
    $('drawer-share-menu').hidden=!opening;
    this.setAttribute('aria-expanded',String(opening));
    if(opening&&shareReviewMode())$('share-status').hidden=false;
  });
  $('share-copy').addEventListener('click',function(){copyJobUrl(this);});
  $('share-native').addEventListener('click',function(){
    if(!activeJob||typeof navigator.share!=='function')return;
    var title=shareText(activeJob), url=publicShareUrl(activeJob);
    // User gesture is required to invoke the native share sheet.
    try{var p=navigator.share({title:title,text:title,url:url});
      if(p&&typeof p.then==='function')p.then(function(){closeShareMenu();},function(error){if(error&&error.name!=='AbortError'){$('share-status').textContent='Device sharing unavailable. Try another option.';$('share-status').hidden=false;}});
    }catch(e){$('share-status').textContent='Device sharing unavailable. Try another option.';$('share-status').hidden=false;}
  });
  document.addEventListener('click',function(e){
    if($('drawer-share-menu').hidden)return;
    if(!$('drawer-share-menu').contains(e.target)&&!$('drawer-share').contains(e.target))closeShareMenu();
  });
  $('drawer-apply').addEventListener('click',function(e){
    if(!activeJob||activeJob.applicationMethod!=='native')return;
    e.preventDefault();
    var job=activeJob;
    closeDrawer(false);
    window.dispatchEvent(new CustomEvent('studio:apply',{detail:{job:job}}));
  });
  $('drawer-copy').addEventListener('click',function(){copyJobUrl(this);});
  $('drawer-save').addEventListener('click',function(){if(!activeJob)return;var pos=saved.indexOf(activeJob.id);if(pos>=0)saved.splice(pos,1);else saved.push(activeJob.id);persist();updateDrawerSaved();$('saved-count').textContent=saved.length;if(state.onlySaved){closeDrawer(false);render();}});
  document.addEventListener('keydown',function(e){
    if(!$('job-drawer').hidden){
      if(e.key==='Escape'){e.preventDefault();if(!$('drawer-share-menu').hidden){closeShareMenu();$('drawer-share').focus();}else closeDrawer();return;}
      if(e.key==='Tab'){
        var focusable=Array.prototype.slice.call($('job-drawer').querySelectorAll('button:not([disabled]),a[href]')).filter(function(el){return !el.hidden && (!$('drawer-share-menu').contains(el)||!$('drawer-share-menu').hidden);});
        if(focusable.length){var first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
      }
      return;
    }
    if(e.key==='/'&&['INPUT','TEXTAREA','SELECT'].indexOf(e.target.tagName)<0){e.preventDefault();$('search').focus();}
  });
  function loadReview(){
    state.review=true;state.sort='review';
    var o=document.createElement('option');o.value='review';o.textContent='Review mix';$('sort').insertBefore(o,$('sort').firstChild);$('sort').value='review';
    state.jobs=(window.STUDIO_OPENINGS_REVIEW_JOBS||[]).filter(displayableJob).map(function(j,i){j.reviewOrder=i;return j;});
    $('system-message').hidden=false;$('system-message').textContent='REVIEW SNAPSHOT · Published vacancies checked 16 Nov 2026. Application status may change.';
    $('updated-label').textContent='Offline source review';
    $('list-footnote').textContent='Click a listing to open its details without changing the results layout. The complete description and application steps remain on the original site. Snapshot status can change.';
    render();
    syncJobFromUrl();
  }
  function loadLive(){
    var urls=['/api/jobs','/api/approved-jobs'];
    Promise.allSettled(urls.map(function(url){return fetch(url,{credentials:'omit'}).then(function(response){if(!response.ok)throw Error(url+' unavailable');return response.json();});})).then(function(items){
      var seen={},records=[],latest=null,success=0;
      items.forEach(function(outcome){
        if(outcome.status!=='fulfilled'||!outcome.value||!Array.isArray(outcome.value.jobs))return;
        success++;
        outcome.value.jobs.forEach(function(j){
          if(displayableJob(j)&&!seen[j.id]){records.push(j);seen[j.id]=true;}
        });
        if(outcome.value.updatedAt)latest=outcome.value.updatedAt;
      });
      if(!success)throw Error('No current feeds available');
      state.jobs=records;
      $('system-message').hidden=state.jobs.length>0;
      if(!state.jobs.length)$('system-message').textContent='No current creative vacancies were returned by the connected feeds.';
      $('updated-label').textContent='Feed fetched '+new Date(latest||Date.now()).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
      render();syncJobFromUrl();
    }).catch(function(){
      $('system-message').hidden=false;
      $('updated-label').textContent='Feed unavailable';
      $('system-message').textContent='Current jobs could not be loaded. Please try later. Offline review records are not substituted for current vacancies.';
      $('results-summary').textContent='Feed unavailable';
    });
  }
  if(window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')loadReview();else loadLive();
})();
