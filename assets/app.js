/* Studio Openings v0.5 — small browser-only interface. No libraries, accounts or payment systems. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var roleLabels = {
    architecture:'Architecture / Landscape', interior:'Interior / Spatial', industrial:'Industrial / Physical Product',
    product:'Product / UX / UI', visual:'Graphic / Brand', motion:'Motion / 3D', fashion:'Fashion / Photography',
    web:'Web / Creative Tech', museum:'Museum / Exhibition', culture:'Arts / Cultural Production'
  };
  var state = {jobs:[], selectedRoles:[], keywords:[], keywordMatch:'any', query:'', region:'all', type:'all', mode:'all', hasPay:false, sort:'relevant', onlySaved:false, savedPeriod:'all', visible:10, review:false};
  // Category landing pages link to the existing filtered job board.
  // Only allow known disciplines; never use unchecked query input as HTML.
  try {
    var requestedDiscipline=new URL(window.location.href).searchParams.get('discipline')||'';
    if(Object.prototype.hasOwnProperty.call(roleLabels,requestedDiscipline)){
      state.selectedRoles=[requestedDiscipline];
      var selectedCheckbox=document.querySelector('input[name="discipline"][value="'+requestedDiscipline+'"]');
      if(selectedCheckbox)selectedCheckbox.checked=true;
    }
  }catch(e){}
  // Tags are a publication requirement: 1–3 verified role/skill labels per job.
  // No user search counts, guessed qualifications, or random tag promotion.
  var PREFERENCES_KEY='studio-openings.keywords.v05';
  try {
    var pref=JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}');
    if(pref && Array.isArray(pref.keywords)) {
      var oldNames={Graphic:'Graphic Design',Product:'Product Design',Motion:'Motion Design',Industrial:'Industrial Design',Landscape:'Landscape Architecture',Adobe:'Adobe Creative Cloud'};
      state.keywords=pref.keywords.filter(function(x){return typeof x==='string' && x.length<35;}).map(function(x){return oldNames[x]||x;}).filter(function(x,i,a){return a.indexOf(x)===i;}).slice(0,15);
    }
    if(pref && pref.match==='all')state.keywordMatch='all';
  }catch(e){}
  // Consistent typography for titles coming from every feed, including curated jobs.
  // Only all-uppercase titles change; employer names and existing mixed-case remain untouched.
  function displayTitle(value){
    var title=String(value||'').trim();
    if(!/[A-Z]/.test(title)||/[a-z]/.test(title))return title;
    var acronyms={BIM:1,CAD:1,CADD:1,UX:1,UI:1,'UX/UI':1,'UI/UX':1,'3D':1,'2D':1,VFX:1,CGI:1,
      AI:1,IT:1,HR:1,'FF&E':1,LEED:1,AIA:1,RIBA:1,NYC:1,US:1,UK:1,UAE:1,EU:1,
      APAC:1,EMEA:1,MEP:1,GIS:1,VR:1,AR:1,HVAC:1,'R&D':1,ERP:1,SAP:1,USA:1,QA:1,II:1,III:1,IV:1};
    var connectors={and:1,or:1,of:1,for:1,in:1,to:1,at:1,the:1,with:1,on:1,by:1,a:1,an:1};
    return title.toLowerCase().replace(/[a-z0-9]+(?:[&/+.-][a-z0-9]+)*/gi,function(part,index){
      if(acronyms[part.toUpperCase()])return part.toUpperCase();
      if(index>0&&connectors[part])return part;
      return part.slice(0,1).toUpperCase()+part.slice(1);
    });
  }
  function persistKeywords(){try{localStorage.setItem(PREFERENCES_KEY,JSON.stringify({keywords:state.keywords,match:state.keywordMatch}));}catch(e){}}
  var ROLE_TAG={architecture:'Architecture',interior:'Interior',industrial:'Industrial Design',product:'Product Design',visual:'Graphic Design',motion:'Motion Design',fashion:'Fashion',web:'Web Design',museum:'Exhibition',culture:'Creative Arts'};
  // Creative leadership taxonomy. Source title establishes the exact role.
  // Adjacent skills are searchable only when the original posting supports them.
  function directionTagProfile(job){
    var title=String(job.title||'').toLowerCase();
    var creative=/\bcreative[\s/-]+director\b|\bdirector[\s,-]+(?:of[\s-]+)?creative\b/.test(title);
    var art=!creative&&(/\bart[\s/-]+director\b|\bdirector[\s,-]+of[\s-]+art\b/.test(title));
    if(!creative&&!art)return null;
    var detail=String(job.description||job.summary||'').toLowerCase().slice(0,12000);
    var source=title+' '+detail;
    var senior=/\bsenior\b|\bsr[.]?\b/.test(title);
    var executive=/\b(?:chief|executive|c-level)\b/.test(title);
    var visible=creative?['Creative','Creative Direction',executive?'Executive':'Director']:
      ['Design','Art Direction',senior?'Senior':'Lead'];
    var searchable=visible.slice();
    function add(label,yes){if(yes&&searchable.indexOf(label)<0)searchable.push(label);}
    add('Creative',true);add('Design',true);
    add(creative?'Creative Director':'Art Director',true);
    add('Visual Design',art||/\bvisual design\b/.test(source));
    add('Management',creative||/\b(?:lead|manag)(?:e|es|ing|ement)?\s+(?:the\s+)?(?:creative\s+|design\s+|art\s+)?team\b/.test(source));
    add('Senior',senior);
    add('Executive',executive);
    add('Brand Strategy',/\bbrand[\s-]+strateg(?:y|ic)\b/.test(source));
    add('Branding',/\bbranding\b|\bbrand[\s-]+identity\b/.test(source));
    add('Marketing',/\bmarketing\b/.test(source));
    add('Advertising',/\badvertis(?:ing|ement|ements)\b|\bad[\s-]+agency\b/.test(source));
    add('Campaigns',/\bcampaigns?\b/.test(source));
    add('Graphic Design',/\bgraphic[\s-]+design\b/.test(source));
    return {visible:visible,searchable:searchable};
  }
  function jobKeywords(job){
    var role=categoryFor(job);
    if(!ROLE_TAG[role])return [];
    var title=String(job.title||'').toLowerCase();
    var details=(title+' '+String(job.description||job.summary||'')).toLowerCase().slice(0,12000);
    var direction=role==='visual'?directionTagProfile(job):null;
    if(direction)return direction.visible;
    var primary=ROLE_TAG[role];
    if(role==='fashion' && /\b(?:photograph(?:er|y)|retoucher|photo (?:editor|stylist|producer))\b/.test(title))primary='Photography';
    if(role==='web' && /\bcreative (?:developer|technologist|technology)\b/.test(title))primary='Creative Technology';
    var tags=[primary];
    if(primary==='Photography' && /\bretoucher\b/.test(title))tags.push('Retouching');
    if(primary==='Photography' && /\bfashion\b/.test(title))tags.push('Fashion');
    function add(label,condition){if(condition && tags.indexOf(label)<0)tags.push(label);}
    // Source-normalized backend tags can be used if they are recognized and concise.
    var allowable={Architecture:1,'Interior':1,'Industrial Design':1,'Product Design':1,'Graphic Design':1,'Motion Design':1,'Fashion':1,'Web Design':1,'Exhibition':1,'Creative Arts':1,'Preservation':1,'Urban Planning':1,'Landscape Architecture':1,'CAD':1,'UX/UI':1,'Branding':1,'Illustration':1,'3D':1,'Photography':1,'Sound':1,'Revit':1,'AutoCAD':1,'BIM':1,'Figma':1,'Rhino':1,'SketchUp':1,'Adobe Creative Cloud':1,'Vectorworks':1,'Archicad':1,'Grasshopper':1,'Civil 3D':1,'Blender':1,'Cinema 4D':1,'After Effects':1,'Photoshop':1,'Illustrator':1,'InDesign':1,'Enscape':1,'Lumion':1,'V-Ray':1,'Public Sector':1};
    if(Array.isArray(job.tags))job.tags.forEach(function(t){if(t==='Landscape')t='Landscape Architecture';if(t==='Adobe')t='Adobe Creative Cloud';if(allowable[t]&&(t!==ROLE_TAG[role]||primary===t))add(t,true);});
    // Detect specialties from the role title. A bare 'architect' is NOT enough
    // unless backend classification verified it as a physical design role.
    add('Preservation',/\b(?:preservation|historic preservation|heritage)\b/.test(title));
    add('Urban Planning',/\b(?:urban|regional|city|town)\s+plann?|\bplanning coordinator\b/.test(title));
    add('Landscape Architecture',/\blandscape\b/.test(title));
    add('CAD',/\bcadd?\b|\bdraft(?:er|ing|sperson)?\b/.test(title));
    add('UX/UI',/\bux\b|\bui\b|user experience|user interface|interaction design/.test(title));
    add('Branding',/\bbrand(?:ing)?\b|identity design/.test(title));
    add('Illustration',/illustrat/.test(title));
    add('3D',/\b3d\b|visuali[sz]ation|\bvfx\b/.test(title));
    add('Photography',/photograph/.test(title));
    add('Sound',/sound design|audio design/.test(title));
    // Every accepted role has one role-level tag. It describes a category,
    // not a claimed software skill or a guessed applicant requirement.
    add(primary,true);
    // Only show software/production skills explicitly mentioned in the source.
    add('Revit',/\brevit\b/.test(details));
    add('AutoCAD',/\bautocad\b/.test(details));
    add('BIM',/\bbim\b/.test(details));
    add('Figma',/\bfigma\b/.test(details));
    add('Rhino',/\brhino\b/.test(details));
    add('SketchUp',/\bsketchup\b/.test(details));
    add('Adobe Creative Cloud',/adobe creative cloud|adobe creative suite/.test(details));
    add('Photoshop',/\bphotoshop\b/.test(details));
    add('Illustrator',/\billustrator\b/.test(details));
    add('InDesign',/\bindesign\b/.test(details));
    add('After Effects',/\bafter effects\b/.test(details));
    add('Vectorworks',/\bvectorworks\b/.test(details));
    add('Archicad',/\barchicad\b/.test(details));
    add('Grasshopper',/\bgrasshopper\b/.test(details));
    add('Civil 3D',/\bcivil 3d\b/.test(details));
    add('Blender',/\bblender\b/.test(details));
    add('Cinema 4D',/\bcinema 4d\b/.test(details));
    add('Enscape',/\benscape\b/.test(details));
    add('Lumion',/\blumion\b/.test(details));
    add('V-Ray',/\bv[ -]?ray\b/.test(details));
    if(job.source==='NYC Open Data')add('Public Sector',true);
    return tags.slice(0,3);
  }
  function jobSearchTags(job){
    var shown=jobKeywords(job),lead=categoryFor(job)==='visual'?directionTagProfile(job):null;
    return lead?lead.searchable:shown;
  }
  // One explicitly assigned colour per editorial tag; never random hash collisions.
  // No tag uses the baby-yellow Featured job row background.
  var TAG_PALETTE={
    'Creative':'#c1b4ec','Design':'#abd8d5','Creative Direction':'#d8a8cc','Art Direction':'#9dcee4','Director':'#becad7','Lead':'#c0cda9','Senior':'#edc3aa','Executive':'#c0bbdf',
   'Architecture':'#b9d5ff','Landscape Architecture':'#9cd9b0','Interior':'#ffbcb0',
   'Industrial Design':'#c6bdff','Product Design':'#a0d9e2','Graphic Design':'#ffc0da',
   'Motion Design':'#b2bbe8','Fashion':'#f2a9db','Web Design':'#a4e2d0',
   'Exhibition':'#d4b69f','Creative Arts':'#c1df9e','Preservation':'#c6a5ec',
   'Urban Planning':'#82cfbd','CAD':'#a9bde2','UX/UI':'#e6adce',
   'Branding':'#efa79f','Illustration':'#c9b2db','3D':'#8fc9e7',
   'Retouching':'#e4bbac','Creative Technology':'#9ddbd0','Photography':'#f9b58f','Sound':'#99cfdb','Revit':'#86d7cf',
   'AutoCAD':'#eba2a9','BIM':'#d0a1e9','Figma':'#d0bd9c',
   'Rhino':'#b6b1ee','SketchUp':'#dcb0af','Adobe Creative Cloud':'#a9d2a0',
   'Public Sector':'#b3c1d1','Vectorworks':'#a6d9bf','Archicad':'#cba5c1',
   'Grasshopper':'#acc69c','Civil 3D':'#b4a6da','Blender':'#dbb5a5',
   'Cinema 4D':'#adc6e4','After Effects':'#bea3d4','Photoshop':'#a9cce9',
   'Illustrator':'#e9b1b8','InDesign':'#c5c8a1','Enscape':'#aac9d1',
   'Lumion':'#d4c2a6','V-Ray':'#c2a8dd'
  };
  // Compact labels are visual aliases only; canonical terms remain stored,
  // searchable, screen-reader friendly and tied to the original tag palette.
  var SHORT_TAG_LABELS={
    'Architecture':'Arch',
    'Art Direction':'AD',
    'Creative Direction':'CD',
    'Product Design':'Product',
    'Graphic Design':'Graphic',
    'Motion Design':'Motion',
    'Industrial Design':'Industrial',
    'Landscape Architecture':'Landscape',
    'Urban Planning':'Urban',
    'Web Design':'Web',
    'Creative Arts':'Arts',
    'Photography':'Photo',
    'Adobe Creative Cloud':'Adobe CC',
    'Public Sector':'Public'
  };
  function shortTagLabel(word){
    return Object.prototype.hasOwnProperty.call(SHORT_TAG_LABELS,word)
      ? SHORT_TAG_LABELS[word] : word;
  }
  function tagColorFor(word){return TAG_PALETTE[word]||'#cad9e6';}
  function styleTag(tag,word){tag.style.backgroundColor=tagColorFor(word);}
  function displayableJob(job){
    if(!job||!job.id||!job.title||!job.company)return false;
    if(job.expiresAt && !(Date.parse(job.expiresAt)>Date.now()))return false;
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
    state.jobs.forEach(function(job){jobSearchTags(job).forEach(function(word){if(allKeywords.indexOf(word)<0)allKeywords.push(word);});});
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
  // Sponsored campaigns lead each relevant filtered feed, with stable daily
  // rotation inside Featured; campaign eligibility is verified independently.
  var featuredById=Object.create(null);
  function utcDay(s){
    if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;
    var t=Date.parse(s+'T00:00:00Z');
    return isFinite(t)&&new Date(t).toISOString().slice(0,10)===s?t:NaN;
  }
  function setFeaturedConfig(data){
    featuredById=Object.create(null);
    if(!data||!Array.isArray(data.placements))return;
    var now=Date.now(), seen=Object.create(null);
    data.placements.slice(0,250).forEach(function(p){
      if(!p||p.approved!==true)return;
      var id=String(p.jobId||''),start=utcDay(p.startsOn),end=utcDay(p.endsOn);
      // Only curated, first-party job IDs; syndicated listings are ineligible.
      if(!/^(direct|firm)-[a-z0-9-]{3,120}$/i.test(id)||seen[id])return;
      // Exactly 90 calendar days at most (inclusive end date).
      if(!isFinite(start)||!isFinite(end)||end<start||end-start>89*86400000)return;
      if(now<start||now>=end+86400000)return;
      featuredById[id]={start:start,end:end+86400000};seen[id]=true;
    });
  }
  function isActiveFeatured(job){
    if(!job||!job.id)return false;
    var p=featuredById[String(job.id)];
    if(!p||Date.now()<p.start||Date.now()>=p.end)return false;
    if(job.closesOn){var close=utcDay(String(job.closesOn));if(isFinite(close)&&Date.now()>=close+86400000)return false;}
    return true;
  }
  function isFeatured(job){
    // Shared by listings, details and Saved Jobs. An archive alone never
    // proves an active paid campaign.
    return isActiveFeatured(job);
  }
  function rotateKey(job,day){
    var s=day+'|'+String(job.id),h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
    h=Math.imul(h,0x846ca68b);h^=h>>>16;
    return h>>>0;
  }
  function rankedFeed(eligibleJobs){
    // Only jobs already matching every active filter can enter this function.
    var ordered=eligibleJobs.slice().sort(sortJobs);
    if(!ordered.length)return ordered;
    var premium=ordered.filter(isActiveFeatured);
    if(!premium.length)return ordered;
    // Rotate among paying Featured employers once each UTC day in Best match.
    if(state.sort==='relevant'){
      var day=Math.floor(Date.now()/86400000);
      premium.sort(function(a,b){
        return rotateKey(a,day)-rotateKey(b,day)||String(a.id).localeCompare(String(b.id));
      });
    }
    // Paid placement outranks normal rows even when another sort is chosen;
    // the chosen sort still applies inside each of these two groups.
    var standard=ordered.filter(function(job){return !isActiveFeatured(job);});
    return premium.concat(standard);
  }
  function loadFeaturedConfig(){
    // v0.13: prefer vetted, server-stored campaigns. Static empty fallback
    // preserves the existing safe behavior until migration/configuration.
    function fallback(){return fetch('/assets/featured-jobs.json',{cache:'no-store',credentials:'omit'}).then(function(r){
      if(!r.ok)throw Error('No featured configuration');return r.json();
    });}
    return fetch('/api/featured-jobs',{cache:'no-store',credentials:'omit'}).then(function(r){
      if(!r.ok)throw Error('Premium inventory unavailable');return r.json();
    }).catch(fallback).then(setFeaturedConfig).catch(function(){setFeaturedConfig(null);});
  }

  // Saved jobs v0.9.1: lightweight snapshots in this browser, not a cloud account.
  // Old v0.5 ID-only bookmarks are imported once, without inventing saved dates.
  var STORAGE_KEY='studio-openings.saved.v091', LEGACY_STORAGE_KEY='studio-openings.saved.v05';
  var saved=[], savedStorageOk=true;
  function savedRecord(entry){
    if(typeof entry==='string')entry={id:entry};
    if(!entry||typeof entry!=='object'||!entry.id)return null;
    function field(key,max){return String(entry[key]||'').slice(0,max);}
    var rawDate=field('savedAt',40);
    var date=rawDate&&!isNaN(Date.parse(rawDate))?new Date(rawDate).toISOString():'';
    var rawUrl=field('url',700);
    // Cached fields allow saved vacancies to be filtered when their live feed
    // disappears; do not invent metadata for historical ID-only bookmarks.
    var tags=Array.isArray(entry.tags)?entry.tags.filter(function(t){return typeof t==='string'&&t.length<=40;}).slice(0,3):[];
    return {id:field('id',240),title:field('title',160),company:field('company',120),
      source:field('source',100),url:safeUrl(rawUrl)?rawUrl:'',savedAt:date,
      role:field('role',24),location:field('location',160),mode:field('mode',30),
      type:field('type',50),salary:field('salary',75),eligibility:field('eligibility',170),
      seniority:field('seniority',65),tags:tags};
  }
  function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));savedStorageOk=true;return true;}catch(e){savedStorageOk=false;return false;}}
  try{
    var source=localStorage.getItem(STORAGE_KEY),oldSource=source===null?localStorage.getItem(LEGACY_STORAGE_KEY):null;
    var raw=JSON.parse(source!==null?source:(oldSource||'[]'));
    if(Array.isArray(raw)){
      var seenSaved=Object.create(null);
      raw.slice(0,300).forEach(function(item){var entry=savedRecord(item);if(entry&&!seenSaved[entry.id]){saved.push(entry);seenSaved[entry.id]=true;}});
    }
    if(source===null&&oldSource!==null)persist();
  }catch(e){saved=[];savedStorageOk=false;}
  function savedIndex(id){for(var n=0;n<saved.length;n++)if(saved[n].id===String(id))return n;return -1;}
  // v0.9.2: per-browser job states. Viewed = details opened; Opened = application action clicked.
  // Show only the highest-priority state: Saved > Opened > Viewed.
  var VIEWED_KEY='studio-openings.viewed.v092', OPENED_KEY='studio-openings.opened.v092';
  function readJobHistory(key){
    var ids=[];
    try{
      var raw=JSON.parse(localStorage.getItem(key)||'[]');
      if(Array.isArray(raw))raw.slice(-300).forEach(function(value){
        if(typeof value==='string'&&value.length<=240&&ids.indexOf(value)<0)ids.push(value);
      });
    }catch(e){}
    return ids;
  }
  var viewedIds=readJobHistory(VIEWED_KEY), openedIds=readJobHistory(OPENED_KEY);
  function jobStatus(id){
    id=String(id);
    if(savedIndex(id)>=0)return 'Saved';
    if(openedIds.indexOf(id)>=0)return 'Opened';
    if(viewedIds.indexOf(id)>=0)return 'Viewed';
    return '';
  }
  function updateJobMarker(row,id){
    var marker=row.querySelector('.job-state-marker');
    if(!marker)return;
    var status=jobStatus(id);
    marker.textContent=status;
    marker.className='job-state-marker'+(status?' is-'+status.toLowerCase():'');
    marker.hidden=!status;
    row.classList.toggle('has-status',!!status);
    var age=row.querySelector('.job-age');
    var ageGroup=row.querySelector('.job-age-group');
    if(ageGroup)ageGroup.hidden=!status&&(!age||age.hidden);
  }
  function refreshJobMarkers(){
    Array.prototype.forEach.call(document.querySelectorAll('.job-row[data-job-id]'),function(row){
      updateJobMarker(row,row.getAttribute('data-job-id'));
    });
  }
  function recordJobHistory(key,ids,id){
    id=String(id||'');if(!id)return;
    var old=ids.indexOf(id);
    if(old>=0)ids.splice(old,1);
    ids.push(id);
    if(ids.length>300)ids.splice(0,ids.length-300);
    try{localStorage.setItem(key,JSON.stringify(ids));}catch(e){}
    refreshJobMarkers();
  }
  function markJobViewed(id){recordJobHistory(VIEWED_KEY,viewedIds,id);}
  function markJobOpened(id){recordJobHistory(OPENED_KEY,openedIds,id);}
  function snapshotForJob(job,old){
    var link=String(job.url||'');
    return {id:String(job.id),title:String(job.title||'').slice(0,160),company:String(job.company||'').slice(0,120),
      source:String(job.source||'').slice(0,100),url:safeUrl(link)?link:'',savedAt:old?old.savedAt:new Date().toISOString(),
      // Same canonical category / tag calculation used by the live job feed.
      role:categoryFor(job),location:String(job.location||'').slice(0,160),
      mode:String(job.mode||'').slice(0,30),type:String(job.type||'').slice(0,50),
      salary:String(job.salary||'').slice(0,75),eligibility:String(job.eligibility||'').slice(0,170),
      seniority:String(job.seniority||'').slice(0,65),tags:jobKeywords(job)};
  }
  var liveAliases=Object.create(null);
  function hydrateSavedEntries(){
    var updates=false;
    saved.forEach(function(record,index){
      var job=state.jobs.filter(function(item){return String(item.id)===(liveAliases[record.id]||record.id);})[0];
      if(!job)return;
      var recent=snapshotForJob(job,record);
      if(JSON.stringify(record)!==JSON.stringify(recent)){saved[index]=recent;updates=true;}
    });
    if(updates){saved=saved.filter(function(entry,i){return saved.findIndex(function(other){return entry.id===other.id;})===i;});persist();}
  }
  // Saved Jobs remains a separate shortlist but honors the same active filters.
  // Stored bookmarks are never deleted by filtering.
  var resultsToolbar=document.querySelector('.results-toolbar');
  var resultsSortLabel=resultsToolbar.querySelector('label');
  var savedShortcut=document.createElement('button');
  savedShortcut.type='button';savedShortcut.id='saved-shortcut';savedShortcut.className='saved-shortcut';
  savedShortcut.setAttribute('aria-pressed','false');
  resultsToolbar.insertBefore(savedShortcut,resultsSortLabel);
  var savedPanel=document.createElement('section');savedPanel.id='saved-library';savedPanel.className='saved-library';savedPanel.hidden=true;
  var savedHead=document.createElement('div');savedHead.className='saved-library-head';
  var savedTitle=document.createElement('h2');savedTitle.textContent='Saved jobs';
  var savedBack=document.createElement('button');savedBack.type='button';savedBack.textContent='Back to all jobs';savedBack.className='saved-back';
  savedHead.appendChild(savedTitle);savedHead.appendChild(savedBack);savedPanel.appendChild(savedHead);
  var savedExplain=document.createElement('p');savedExplain.className='saved-explain';
  savedExplain.textContent='Saved privately in this browser only. No account or cross-device sync.';savedPanel.appendChild(savedExplain);
  var savedTabs=document.createElement('div');savedTabs.className='saved-tabs';savedTabs.setAttribute('role','group');savedTabs.setAttribute('aria-label','Saved date range');
  var savedAll=document.createElement('button'),savedWeek=document.createElement('button');
  [savedAll,savedWeek].forEach(function(b){b.type='button';savedTabs.appendChild(b);});
  savedAll.textContent='All saved';savedWeek.textContent='Last 7 days';savedPanel.appendChild(savedTabs);
  var savedFilterInfo=document.createElement('p');savedFilterInfo.className='saved-filter-info';savedFilterInfo.hidden=true;
  savedPanel.appendChild(savedFilterInfo);
  var savedListing=document.createElement('div');savedListing.className='saved-listing';savedPanel.appendChild(savedListing);
  $('job-list').parentNode.insertBefore(savedPanel,$('job-list'));
  function toggleSavedView(force){state.onlySaved=typeof force==='boolean'?force:!state.onlySaved;state.visible=10;render();}
  savedShortcut.addEventListener('click',function(){toggleSavedView();});
  savedBack.addEventListener('click',function(){toggleSavedView(false);});
  savedAll.addEventListener('click',function(){state.savedPeriod='all';render();});
  savedWeek.addEventListener('click',function(){state.savedPeriod='week';render();});
  function savedDateLabel(date){
    if(!date)return 'Saved before this update (date unknown)';
    var t=Date.parse(date);if(isNaN(t))return 'Saved date unknown';
    var days=Math.max(0,Math.floor((Date.now()-t)/86400000));
    return days===0?'Saved today':days===1?'Saved yesterday':'Saved '+new Date(t).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
  }
  function savedHasActiveFilters(){
    return !!(state.selectedRoles.length||state.keywords.length||state.query||
      state.region!=='all'||state.mode!=='all'||state.type!=='all'||state.hasPay);
  }
  function savedMatchesFilters(item,job){
    if(job)return eligible(job);
    // An archived job with saved category/tag metadata can still be filtered.
    if(roleLabels[item.role])return eligible(item,item.role,item.tags||[]);
    // Legacy bookmarks can have no role/location/tags. Never classify their
    // unknown metadata as Culture or claim to match a skill or work arrangement.
    if(state.selectedRoles.length||state.keywords.length||
       state.region!=='all'||state.mode!=='all'||state.type!=='all'||state.hasPay)return false;
    if(!state.query)return true;
    var text=[item.title,item.company,item.source].join(' ').toLowerCase();
    return state.query.toLowerCase().split(/\s+/).every(function(part){return text.indexOf(part)!==-1;});
  }
  function orderSavedEntries(entries,jobIndex){
    // Apply current filters first. Prioritize only currently active paid jobs;
    // a stale saved snapshot cannot prolong a sponsored campaign.
    return entries.sort(function(a,b){
      var aJob=jobIndex[a.id],bJob=jobIndex[b.id];
      var aPremium=aJob&&isFeatured(aJob)?1:0,bPremium=bJob&&isFeatured(bJob)?1:0;
      if(aPremium!==bPremium)return bPremium-aPremium;
      return (Date.parse(b.savedAt)||0)-(Date.parse(a.savedAt)||0);
    });
  }
  function renderSavedPanel(){
    savedListing.textContent='';
    savedAll.setAttribute('aria-pressed',String(state.savedPeriod==='all'));
    savedWeek.setAttribute('aria-pressed',String(state.savedPeriod==='week'));
    var weekCutoff=Date.now()-7*86400000;
    var jobIndex=Object.create(null);
    state.jobs.forEach(function(job){jobIndex[String(job.id)]=job;});
    var periodEntries=saved.filter(function(item){return state.savedPeriod==='all'||(item.savedAt&&Date.parse(item.savedAt)>=weekCutoff);});
    var entries=periodEntries.filter(function(item){return savedMatchesFilters(item,jobIndex[item.id]);});
    var filtered=savedHasActiveFilters();
    savedFilterInfo.hidden=!filtered;
    savedFilterInfo.textContent=filtered?entries.length+' of '+periodEntries.length+' saved jobs match the current filters.':'';
    orderSavedEntries(entries,jobIndex);
    if(!entries.length){
      var empty=document.createElement('p');empty.className='saved-empty';
      empty.textContent=saved.length===0?'No saved jobs yet. Open a vacancy and click Save job.':
        !periodEntries.length?'No jobs saved in the last 7 days. Try All saved.':
        filtered?'No saved jobs match these filters. Change or clear filters to see more.':
        'No saved jobs in this view.';
      savedListing.appendChild(empty);return;
    }
    entries.forEach(function(item){
      var job=jobIndex[item.id],activeFeatured=!!job&&isFeatured(job);
      var row=document.createElement('article');row.className='saved-entry';
      if(activeFeatured)row.classList.add('is-featured');
      var title=document.createElement(job?'button':'strong');title.className='saved-entry-title';
      title.textContent=displayTitle((job&&job.title)||item.title||'Previously saved vacancy');
      if(activeFeatured){
        var star=document.createElement('span');star.className='job-featured-star saved-featured-star';
        star.textContent='★';star.title='Featured · Sponsored';
        star.setAttribute('aria-label','Featured sponsored listing');
        title.appendChild(star);
        title.setAttribute('aria-label','Featured sponsored listing: '+displayTitle(job.title));
      }
      if(job){title.type='button';title.addEventListener('click',function(){openDrawer(job,title);});}
      row.appendChild(title);
      var company=document.createElement('p');company.className='saved-entry-company';company.textContent=(job&&job.company)||item.company||'Employer information unavailable';row.appendChild(company);
      var meta=document.createElement('p');meta.className='saved-entry-meta';
      meta.textContent=savedDateLabel(item.savedAt)+(item.source?' · '+item.source:'');row.appendChild(meta);
      var status=document.createElement('p');status.className=job?'saved-entry-status':'saved-entry-status is-unavailable';
      status.textContent=job?'In current listings':'Not in current listings — vacancy status unverified';row.appendChild(status);
      var actions=document.createElement('div');actions.className='saved-entry-actions';
      if(job){
        var review=document.createElement('button');review.type='button';review.textContent='Review job';
        review.addEventListener('click',function(){openDrawer(job,review);});actions.appendChild(review);
      }else if(safeUrl(item.url)){
        var original=document.createElement('a');original.href=item.url;original.target='_blank';original.rel='noopener noreferrer';
        original.textContent='Check original listing ↗';original.setAttribute('aria-label','Check original listing (availability unverified, opens new tab)');
        actions.appendChild(original);
      }
      var remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.className='saved-remove';
      remove.setAttribute('aria-label','Remove saved job: '+((job&&job.title)||item.title||item.id));
      remove.addEventListener('click',function(){var pos=savedIndex(item.id);if(pos>=0){saved.splice(pos,1);persist();render();}});
      actions.appendChild(remove);row.appendChild(actions);savedListing.appendChild(row);
    });
  }
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
    if(/\barchitect(?:s|ure|ural)?\b/.test(t)){
      if(/\b(?:ai|genai|generative|artificial intelligence|llm|machine learning|ml|sap|salesforce|servicenow|erp|aws|azure|cloud|software|solutions?|enterprise|data|database|systems?|network|security|platform|infrastructure|devops|api|applications?|integrations?|deployment|messaging|sms|email|implementation|technical|technology|information|it)\b/.test(t))return 'not-creative';
      if(r==='architecture'&&!/\b(?:landscape architect|interior architect|residential architect|building architect|project architect|design architect|architectural|building design|bim|revit|urban design)\b/.test(t)){
        var d=trim(job.description).toLowerCase();
        if(!/\b(?:revit|autocad|building codes?|floor plans?|construction drawings?|architectural projects?|building design|facade|façade|landscape architecture|bim coordination)\b/.test(d))return 'not-creative';
        if(/\b(?:deployment|messaging|email\/sms|integration architecture|enterprise customers|cloud infrastructure|software architect|data flows)\b/.test(d))return 'not-creative';
      }
    }
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
  // Compact only exact lists of eligible European countries. Do not infer that
  // Europe as a whole is eligible, and leave the full source text in the drawer.
  // Only display compaction: never overwrite source-reported office locations,
  // citizenship eligibility, or applicant restrictions.
  function compactJobLocation(job){
    var raw=trim(job.location);
    if(!raw)return 'Region not stated';
    if(job.locationKind!=='eligibility'&&!/^eligible\s*:/i.test(raw)){
      // ATS often lists offices as "Chicago, IL; Miami, FL; New York, NY",
      // not "... United States" on each segment.
      var offices=raw.split(/\s*;\s*|\s+\|\s+/).map(function(s){return s.trim();}).filter(Boolean);
      if(offices.length>3){
        var usCodes=/,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY|DC|PR)(?=\s*(?:$|[,/()\-]))/;
        var usNames=/,\s*(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)(?=\s*(?:$|[,/()\-]))/i;
        var usCountry=/\b(?:United States(?: of America)?|USA)\b|\bU\.S\.A?\./i;
        var foreign=/\b(?:Canada|United Kingdom|UK|Germany|France|Italy|Spain|Portugal|Netherlands|Belgium|Switzerland|Austria|Sweden|Norway|Denmark|Finland|Ireland|Poland|Australia|New Zealand|Singapore|Japan|China|India|United Arab Emirates|UAE|Hong Kong|Taiwan|South Korea|Indonesia|Malaysia|Philippines|Brazil|Mexico|South Africa)\b/i;
        var caProvince=/,\s*(?:ON|BC|QC|AB|NS|NB|MB|SK|NL|NT|NU|YT)(?=\s*(?:$|[,/()\-]))/;
        var knownUS=0,knownForeign=0;
        offices.forEach(function(part){
          if(foreign.test(part)||caProvince.test(part))knownForeign++;
          else if(usCountry.test(part)||usCodes.test(part)||usNames.test(part))knownUS++;
        });
        var unclassified=offices.length-knownUS-knownForeign;
        if(!knownForeign&&(knownUS===offices.length||
           (knownUS>=4&&unclassified<=1&&(String(job.geoCountry||'').toUpperCase()==='US'||usCountry.test(raw)))))
          return 'United States (selected)';
        return 'Multiple locations (selected)';
      }
      return raw;
    }
    // Remote eligibility is a separate policy: never infer worldwide access
    // from an office/location display shortcut.
    var list=raw.replace(/^eligible\s*:\s*/i,'').split(/\s*[,;]\s*/).map(function(s){return s.trim().toLowerCase();}).filter(Boolean);
    if(list.length<4)return raw;
    var europe={belgium:1,france:1,germany:1,ireland:1,italy:1,netherlands:1,poland:1,portugal:1,spain:1,'united kingdom':1,uk:1,austria:1,sweden:1,norway:1,finland:1,denmark:1,iceland:1,luxembourg:1,switzerland:1,greece:1,cyprus:1,czechia:1,'czech republic':1,estonia:1,latvia:1,lithuania:1,croatia:1,malta:1,romania:1,slovakia:1,slovenia:1,hungary:1,bulgaria:1};
    return list.every(function(s){return !!europe[s];})?'Eligible: Europe (selected countries)':raw;
  }
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
  function eligible(job,verifiedRole,verifiedTags){
    var role=(typeof verifiedRole==='string'&&roleLabels[verifiedRole])?verifiedRole:categoryFor(job);
    if(role==='not-creative')return false;
    if(state.selectedRoles.length&&state.selectedRoles.indexOf(role)<0)return false;
    
    if(state.region==='us'&&!usMatch(trim(job.location)))return false;
    if(state.region==='worldwide'&&!worldwideMatch(trim(job.location)))return false;
    if(state.mode!=='all'&&trim(job.mode).toLowerCase()!==state.mode)return false;
    if(!matchesType(job,state.type))return false;
    if(state.hasPay&&!trim(job.salary))return false;
    if(state.keywords.length){
      var tags=Array.isArray(verifiedTags)&&verifiedTags.every(function(t){return typeof t==='string';})?verifiedTags:jobSearchTags(job);
      var matched=state.keywordMatch==='all' ? state.keywords.every(function(k){return tags.indexOf(k)>=0;}) : state.keywords.some(function(k){return tags.indexOf(k)>=0;});
      if(!matched)return false;
    }
    var hay=[job.title,job.company,job.location,job.type,job.mode,job.eligibility,roleLabels[role],job.seniority].join(' ').toLowerCase();
    return !state.query||state.query.toLowerCase().split(/\s+/).every(function(part){return hay.indexOf(part)!==-1;});
  }
  function sortJobs(a,b){
    // Organic quality/date ranking; sponsored spacing is handled by rankedFeed().
    if(state.sort==='review')return (a.reviewOrder||0)-(b.reviewOrder||0);
    if(state.sort==='az')return a.title.localeCompare(b.title);
    if(state.sort==='company')return a.company.localeCompare(b.company);
    if(state.sort==='relevant'){
      // Career-first default: confirmed permanent/full-time > unknown > part-time/intern > hourly/contract.
      // Never infer full-time from missing metadata; explicit sorts remain independent.
      var typeRank=function(job){
        var t=trim(job.type).toLowerCase();
        if(/\b(contract|contractor|freelanc(?:e|er)|hourly|temporary|fixed[ -]?term)\b/.test(t))return 3;
        if(/\bfull[ -]?time\b|\bfulltime\b|\bpermanent\b/.test(t))return 0;
        if(/\bpart[ -]?time\b|\bparttime\b|\bintern(?:ship)?\b/.test(t))return 2;
        return 1;
      };
      var typeDiff=typeRank(a)-typeRank(b);
      if(typeDiff)return typeDiff;
      var score=function(job){
        var quality=Number(job.qualityScore);
        if(isFinite(quality)&&quality>0)return quality;
        var n=Number(job.relevance);
        if(isFinite(n)&&n>0)return n;
        return /direct|curated/i.test(trim(job.source))?96:0;
      };
      var diff=score(b)-score(a);
      if(diff!==0)return diff;
      // Geographic priority breaks quality ties; it never outranks relevance.
      var tier=function(j){var n=Number(j.geoTier);return n===1||n===2?n:9;};
      var geoDiff=tier(a)-tier(b);if(geoDiff)return geoDiff;
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
  // Stable, opaque public handle: no encoded source URL or provider name.
  // This is a URL alias, NOT encryption or a security boundary.
  // The original job id stays available internally for API matching and saving.
  function publicJobHandle(id){
    var value=String(id||''),a=2166136261,b=3339675911,i,n;
    for(i=0;i<value.length;i++){
      n=value.charCodeAt(i);
      a=Math.imul(a^n,16777619)>>>0;
      b=Math.imul(b^(n+((i&255)<<8)),2246822519)>>>0;
    }
    return 'so-'+a.toString(36).padStart(7,'0')+b.toString(36).padStart(7,'0');
  }
  function jobLinkFor(id){
    var url=new URL(window.location.href);
    if(id)url.searchParams.set('job',publicJobHandle(id));
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
    var job=state.jobs.filter(function(candidate){
      return String(candidate.id)===(liveAliases[id]||id) || publicJobHandle(candidate.id)===id;
    })[0];
    if(job){
      // Legacy long source URLs continue to open; replace them in the address
      // bar with the new short public identifier without adding history.
      if(id!==publicJobHandle(job.id))updateJobUrl(job.id,'replace');
      // Do not change history or rerender the list on a browser Back/Forward event.
      if(!activeJob || String(activeJob.id)!==String(job.id))openDrawer(job,null,true);
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
    var selected=!!activeJob&&savedIndex(activeJob.id)>=0;
    $('drawer-save').textContent=selected?'Saved ✓':'Save job';
    $('drawer-save').setAttribute('aria-pressed',String(selected));
  }
  // Structured, safe job details. The API returns plain text, not trusted HTML.
  // Keep original paragraph/bullet boundaries; reconstruct cautious breaks in
  // flattened upstream excerpts without changing job requirements or claims.
  function descriptionParagraphs(raw){
    var text=String(raw||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ');
    // Decode only character entities; display is always textContent, never HTML.
    function decode(s){
      var map={lt:'<',gt:'>',amp:'&',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',bull:'•'};
      return s.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi,function(m,k){
        if(k.charAt(0)==='#'){var n=k.charAt(1).toLowerCase()==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>=32&&n<=0x10ffff?String.fromCodePoint(n):' ';}
        return Object.prototype.hasOwnProperty.call(map,k.toLowerCase())?map[k.toLowerCase()]:m;
      });
    }
    for(var di=0;di<3;di++){var next=decode(text);if(next===text)break;text=next;}
    text=text.replace(/<(?:script|style|iframe)\b[^>]*>[\s\S]*?<\/(?:script|style|iframe)\s*>/gi,' ')
      .replace(/<br\b[^>]*\/?>/gi,'\n').replace(/<li\b[^>]*>/gi,'\n• ')
      .replace(/<\/li\s*>/gi,'\n')
      .replace(/<\/?(?:p|div|section|article|h[1-6]|ul|ol|blockquote)\b[^>]*>/gi,'\n\n')
      .replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*)?\/?>/gi,' ').replace(/\n{3,}/g,'\n\n').trim();
    // Some copied descriptions glue a new sentence directly to a full stop.
    // Only split before a capitalized ordinary word; avoid .NET, version IDs, URLs.
    text=text.replace(/([.!?]["'’”)]?)([A-Z][a-z])/g,'$1\n\n$2');
    // Separate common vacancy section labels even in flattened feed text.
    text=text.replace(/([.!?])\s*((?:Key |Main |Minimum |Preferred )?(?:Responsibilities|Duties|Requirements|Qualifications|Benefits|Role overview|Overview|About the role|About you|What you[’']ll do|What we offer|How to apply)\s*:)/gi,'$1\n\n$2\n');
    text=text.replace(/[ \t]*\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
    var result=[];
    if(!text)return result;
    function pieces(line){
      // Only infer a paragraph when a collapsed block is noticeably long.
      if(line.length<350)return [line];
      var spans=[],last=0,rx=/([.!?]["'’”)]?)(\s+)(?=[A-Z])/g,m;
      while((m=rx.exec(line))!==null){
        var before=line.slice(Math.max(0,m.index-15),m.index+1);
        // Ignore abbreviations, initials and short technical notation.
        if(/(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|No|Fig|Inc|Ltd|Co|etc|e\.g|i\.e|U\.S|U\.K)\.|\b[A-Z]\.)$/i.test(before))continue;
        var part=line.slice(last,m.index+m[1].length).trim();
        if(part)spans.push(part);
        last=m.index+m[0].length;
      }
      var tail=line.slice(last).trim();if(tail)spans.push(tail);
      if(spans.length<3)return [line];
      var grouped=[],chunk='';
      spans.forEach(function(sentence){
        if(chunk&&chunk.length+sentence.length>285){grouped.push(chunk);chunk='';}
        chunk+=(chunk?' ':'')+sentence;
      });
      if(chunk)grouped.push(chunk);
      return grouped;
    }
    text.split(/\n\n+/).forEach(function(block){
      var lines=block.split('\n'),list=[];
      function flushList(){if(list.length){result.push({type:'list',items:list});list=[];}}
      lines.forEach(function(rawLine){
        var line=rawLine.trim();if(!line)return;
        var bullet=line.match(/^(?:[•*\-–]\s+|\d{1,2}[.)]\s+)(.+)$/);
        if(bullet){list.push(bullet[1]);return;}
        flushList();
        if(line.length<82 && /^(?:Key |Main |Minimum |Preferred )?(?:Responsibilities|Duties|Requirements|Qualifications|Benefits|Role overview|Overview|About(?: the role| you| us)?|What you[’']ll do|What we offer|How to apply)\s*:?$/i.test(line)){
          result.push({type:'heading',text:line.replace(/:$/,'')});return;
        }
        pieces(line).forEach(function(part){result.push({type:'paragraph',text:part});});
      });
      flushList();
    });
    return result;
  }
  function renderJobDescription(raw){
    var target=$('drawer-description-text');
    if(!target)return;
    // Existing index.html uses a <p>. Swap to <div> at runtime to support
    // semantic paragraphs and lists without changing the About-section HTML.
    if(target.tagName.toLowerCase()==='p'){
      var replacement=document.createElement('div');replacement.id=target.id;
      replacement.className='so-description-body';target.parentNode.replaceChild(replacement,target);
      target=replacement;
    }
    target.textContent='';
    var items=descriptionParagraphs(raw);
    if(!items.length){
      var none=document.createElement('p');none.textContent='A detailed description is not included in this listing data.';target.appendChild(none);return;
    }
    items.forEach(function(item){
      var node;
      if(item.type==='heading'){
        node=document.createElement('h4');node.textContent=item.text;
      }else if(item.type==='list'){
        node=document.createElement('ul');
        item.items.forEach(function(value){var li=document.createElement('li');li.textContent=value;node.appendChild(li);});
      }else{node=document.createElement('p');node.textContent=item.text;}
      target.appendChild(node);
    });
  }
  function openDrawer(job,opener,fromUrl){
    var method=job.applicationMethod||'external';
    if(method==='external'&&!safeUrl(job.url))return;
    activeJob=job;lastOpener=opener||null;
    $('job-drawer').setAttribute('data-swatch',swatchFor(job));
    $('job-link-message').hidden=true;
    if(!fromUrl)updateJobUrl(job.id,'push');
    // Disclosure is integrated into the title: no extra row above it.
    var drawerTitle=$('drawer-title');
    drawerTitle.textContent=displayTitle(job.title);
    if(isFeatured(job)){
      var drawerStar=document.createElement('span');
      drawerStar.className='job-featured-star drawer-featured-star';
      drawerStar.textContent='★';
      drawerStar.title='Featured · Sponsored';
      drawerStar.setAttribute('aria-label','Featured sponsored listing');
      drawerTitle.appendChild(drawerStar);
    }
    $('drawer-company').textContent=job.company;
    var meta=$('drawer-meta');meta.textContent='';
    var shortLocation=compactJobLocation(job);
    [shortLocation,niceMode(job.mode),trim(job.type)].filter(function(v){return v&&v!=='Not specified';}).forEach(function(value,i){
      if(i){var separator=document.createElement('span');separator.textContent='|';separator.className='drawer-divider';meta.appendChild(separator);}
      var item=document.createElement('span');item.textContent=value;
      if(i===0&&shortLocation!==trim(job.location))item.title='Source-reported locations: '+trim(job.location);
      meta.appendChild(item);
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
    renderJobDescription(excerpt);
    $('drawer-description-note').textContent=excerpt?(job.descriptionKind==='editorial-summary'?'Editorial summary based on the linked vacancy. Always check the full original job description and eligibility.':job.descriptionKind==='source-excerpt'?'Excerpt from the original vacancy. Open the original listing for the complete requirements.':'Description supplied by the hiring source. Confirm current requirements on the original listing.'):'Read the original vacancy for responsibilities, qualifications, eligibility and application instructions.';
    $('drawer-check-date').textContent=dateLabel(job).label;
    // The source credit is a real link. Always keep third-party applicants on
    // the original API application URL; never silently reroute them to us.
    var source=trim(job.source),sourceHolder=$('drawer-source-label');
    sourceHolder.textContent='';
    if(source){
      sourceHolder.appendChild(document.createTextNode('Source: '));
      var sourceUrl=trim(job.sourceUrl||'');
      if(source==='Himalayas'){
        // Himalayas permits a link to its domain when a job URL is unavailable.
        sourceUrl=safeUrl(job.url)?job.url:'https://himalayas.app/';
      }else if(source==='Jobicy'){
        sourceUrl=safeUrl(job.url)?job.url:'https://jobicy.com/';
      }else if(!safeUrl(sourceUrl)&&/^Official careers/.test(source)){
        sourceUrl=safeUrl(job.url)?job.url:'';
      }
      if(safeUrl(sourceUrl)){
        var credit=document.createElement('a');
        credit.href=sourceUrl;credit.target='_blank';credit.rel='noopener noreferrer';
        credit.textContent=source;credit.setAttribute('aria-label','Open source: '+source+' (new tab)');
        sourceHolder.appendChild(credit);
      }else sourceHolder.appendChild(document.createTextNode(source));
    }
    if(detailPath(job)){
      var sep=document.createTextNode(' · ');sourceHolder.appendChild(sep);
      var jobPage=document.createElement('a');jobPage.href=job.detailUrl;jobPage.textContent='View job page';
      sourceHolder.appendChild(jobPage);
    }
    var apply=$('drawer-apply');
    apply.hidden=false;
    apply.dataset.method=method;
    apply.setAttribute('data-apply-job',/^direct-so-/i.test(job.id)?job.id.slice(7).toUpperCase():/^registry-/.test(job.id)?job.id:'');
    // For sourced jobs, use ONLY the original applicationLink/url from the API.
    apply.href=method==='external'?job.url:method==='email'?'mailto:'+encodeURIComponent(job.applicationEmail||'')+'?subject='+encodeURIComponent('Application: '+job.title):'#apply';
    var externalOrigin='Apply for job';
    apply.textContent=method==='native'?'Apply on Studio Openings':method==='email'?'Apply by email':externalOrigin;
    apply.setAttribute('aria-label',method==='external'?apply.textContent+' (opens a new tab)':apply.textContent);
    if(method==='email'&&!job.applicationEmail){apply.hidden=true;}
    if(method==='external'&&/^(Himalayas|Jobicy)$/.test(source)){
      $('drawer-description-note').textContent += ' Applications continue through the original source listing; Studio Openings does not collect them.';
    }

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
    markJobViewed(job.id);
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
  function detailPath(job){
    var path=String(job&&job.detailUrl||'');
    return /^\/(?:jobs\/SO-[A-Z0-9-]{6,45}|openings\/[a-z0-9-]{8,160})$/i.test(path)?path:'';
  }
  function rowFor(job){
    var frag=$('job-template').content.cloneNode(true),row=frag.querySelector('.job-row'),open=row.querySelector('.job-open'),head=row.querySelector('.job-open-head');
    row.setAttribute('data-swatch',swatchFor(job));
    row.setAttribute('data-job-id',String(job.id));
    if(isFeatured(job))row.classList.add('is-featured');

    if(detailPath(job)){
      var link=document.createElement('a');link.href=detailPath(job);link.className=head.className;
      link.setAttribute('aria-haspopup','dialog');link.appendChild(head.firstElementChild);
      head.parentNode.replaceChild(link,head);head=link;
    }
    var titleNode=head.querySelector('.job-title');
    titleNode.textContent=displayTitle(job.title);
    if(isFeatured(job)){
      // Inline star follows the visible title text, preserving title/date alignment.
      var titleText=document.createElement('span');
      titleText.className='job-title-text';
      titleText.textContent=displayTitle(job.title);
      titleNode.textContent='';titleNode.appendChild(titleText);
      var star=document.createElement('span');
      star.className='job-featured-star';
      star.textContent='★';
      star.title='Featured · Sponsored';
      star.setAttribute('aria-label','Featured sponsored listing');
      titleNode.appendChild(star);
    }
    // Preserve the complete title on hover; existing aria-label already gives the full title and company.
    head.title=displayTitle(job.title);
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
      // Compact visible tag, keep the canonical taxonomy for search and filtering.
      chip.textContent=shortTagLabel(word);
      chip.setAttribute('aria-label',word);
      chip.setAttribute('aria-pressed',String(state.keywords.indexOf(word)>=0));
      styleTag(chip,word);
      chip.title=state.keywords.indexOf(word)>=0?'Remove '+word+' from preferences':'Add '+word+' to preferences';
      chip.addEventListener('click',function(event){event.stopPropagation();toggleKeyword(word);});
      keywordContainer.appendChild(chip);
    });
    // Omit unverified metadata rather than repeating "Not specified" on every row.
    var meta=open.querySelector('.job-meta');meta.textContent='';
    var items=[compactJobLocation(job),niceMode(job.mode),trim(job.type)]
      .filter(function(value){return value&&value!=='Not specified';});
    items.forEach(function(value,index){
      if(index){var divider=document.createElement('span');divider.className='job-divider';divider.textContent='|';divider.setAttribute('aria-hidden','true');meta.appendChild(divider);}
      var span=document.createElement('span');span.textContent=value;meta.appendChild(span);
      if(index===0&&(job.locationKind==='eligibility'||value!==trim(job.location)))span.title=(job.locationKind==='eligibility'?'Source-reported eligibility: ':'Source-reported locations: ')+trim(job.location);
    });
    var salary=open.querySelector('.job-salary');salary.textContent=trim(job.salary)||'Salary not disclosed';
    if(!trim(job.salary))salary.classList.add('missing');
    var notice=eligibilityLabel(job);
    var noticeNode=open.querySelector('.job-notice');noticeNode.textContent=notice;noticeNode.hidden=!notice;
    noticeNode.title=trim(job.eligibility||job.notice)||'';
    // Place the passive status immediately BEFORE the job's posting age.
    // Do not add a third row, change employer placement or change the job date itself.
    var ageGroup=document.createElement('span');ageGroup.className='job-age-group';
    var marker=document.createElement('span');marker.className='job-state-marker';marker.hidden=true;
    var headline=document.createElement('div');headline.className='job-headline';
    head.parentNode.insertBefore(headline,head);headline.appendChild(head);headline.appendChild(ageGroup);
    ageGroup.appendChild(marker);
    ageGroup.appendChild(age);
    updateJobMarker(row,job.id);
    var disclosurePrefix=isFeatured(job)?'Featured sponsored listing. ':'';
    open.setAttribute('aria-label',disclosurePrefix+'View details: '+displayTitle(job.title)+' at '+job.company);
    head.setAttribute('aria-label',disclosurePrefix+'View details: '+displayTitle(job.title)+' at '+job.company);
    employer.setAttribute('aria-label',disclosurePrefix+'View details: '+displayTitle(job.title)+' at '+job.company);
    open.addEventListener('click',function(){openDrawer(job,open);});
    head.addEventListener('click',function(e){
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault();openDrawer(job,head);
    });
    employer.addEventListener('click',function(){openDrawer(job,employer);});
    return frag;
  }
  // A short reveal pause is intentional; native scrolling is never throttled.
  var feedJobs=[],feedBusy=false,feedTimer=null,feedVersion=0;
  function feedControls(){
    var more=!state.onlySaved&&state.visible<feedJobs.length;
    $('scroll-sentinel').hidden=!more;
    $('feed-progress').hidden=!more||!feedBusy;
    $('feed-end').hidden=state.onlySaved||!state.jobs.length||!feedJobs.length||more;
  }
  function appendFeed(){
    if(feedBusy||state.onlySaved||state.visible>=feedJobs.length||!$('job-drawer').hidden)return;
    if($('scroll-sentinel').hidden||$('scroll-sentinel').getBoundingClientRect().top>window.innerHeight+160)return;
    feedBusy=true;var version=feedVersion;
    feedControls();
    feedTimer=setTimeout(function(){
      feedTimer=null;
      if(version!==feedVersion||state.onlySaved||!$('job-drawer').hidden){feedBusy=false;feedControls();return;}
      var next=Math.min(feedJobs.length,state.visible+8),frag=document.createDocumentFragment();
      feedJobs.slice(state.visible,next).forEach(function(job){frag.appendChild(rowFor(job));});
      $('job-list').appendChild(frag);
      state.visible=next;feedBusy=false;feedControls();
      // Only auto-extend if there is genuinely not enough content to scroll.
      if(document.documentElement.scrollHeight<=window.innerHeight+10&&state.visible<feedJobs.length)appendFeed();
    },450);
  }
  function render(){
    feedVersion++;
    if(feedTimer!==null){clearTimeout(feedTimer);feedTimer=null;}
    feedBusy=false;
    renderKeywords();
    $('saved-count').textContent=saved.length;
    savedShortcut.textContent='Saved jobs ('+saved.length+')';
    savedShortcut.setAttribute('aria-pressed',String(state.onlySaved));
    savedShortcut.classList.toggle('active',state.onlySaved);
    $('saved-toggle').setAttribute('aria-pressed',String(state.onlySaved));
    $('saved-toggle').classList.toggle('active',state.onlySaved);
    var selected=state.selectedRoles.length;
    $('filter-indicator').textContent=selected?selected+' selected':(document.querySelector('.sidebar').classList.contains('expanded')?'−':'+');
    $('clear-disciplines').textContent=selected?'clear ('+selected+')':'all';
    // Array.filter passes (job, index, array). Do not forward index/array as
    // Saved Jobs' optional verified role and tags override parameters.
    var list=rankedFeed(state.jobs.filter(function(job){return eligible(job);}));
    $('system-message').hidden=state.onlySaved||state.jobs.length>0;
    $('list-footnote').hidden=state.onlySaved;
    savedExplain.textContent=savedStorageOk?'Saved privately in this browser only. No account or cross-device sync.':'Browser storage is unavailable. Saves may disappear when you close this page.';
    $('results-summary').textContent=state.onlySaved?'Your shortlist':state.review?'Official firm source review · 17 Nov 2026':'Current listings';
    var wasOpen=!$('job-drawer').hidden;
    closeDrawer(true);
    if(wasOpen)updateJobUrl(null,'replace');
    savedPanel.hidden=!state.onlySaved;
    $('job-list').hidden=state.onlySaved;
    $('empty-state').hidden=state.onlySaved||!(list.length===0&&state.jobs.length>0);
    feedJobs=list;
    feedControls();
    resultsSortLabel.hidden=state.onlySaved;
    $('preferences-bar').hidden=state.onlySaved||!state.keywords.length;
    if(state.onlySaved){renderSavedPanel();return;}
    var root=$('job-list');root.textContent='';var fragment=document.createDocumentFragment();
    list.slice(0,state.visible).forEach(function(job){fragment.appendChild(rowFor(job));});root.appendChild(fragment);
    feedControls();
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
  $('saved-toggle').addEventListener('click',function(){toggleSavedView();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  // One visitor scroll triggers one eight-job reveal; no observer cascade.
  window.addEventListener('scroll',appendFeed,{passive:true});
  window.addEventListener('resize',function(){
    if(document.documentElement.scrollHeight<=window.innerHeight+10)appendFeed();
  });
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
    // Employer-approved vacancies already have server-rendered SEO pages.
    // Share that canonical page rather than the homepage drawer deep-link.
    // Third-party feed jobs still use stable opaque short links.
    var path=detailPath(job);
    if(!shareReviewMode()&&path){
      return new URL(path,window.location.origin).href;
    }
    return jobLinkFor(job.id);
  }
  function shareText(job){return displayTitle(job.title)+' — '+job.company+' | Studio Openings';}
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
    if(!activeJob)return;
    if(activeJob.expiresAt && !(Date.parse(activeJob.expiresAt)>Date.now())){
      e.preventDefault();closeDrawer();state.jobs=state.jobs.filter(displayableJob);render();return;
    }
    var method=activeJob.applicationMethod||'external';
    if(method==='external'&&!safeUrl(activeJob.url))return;
    if(method==='email'&&!activeJob.applicationEmail)return;
    // 'Opened' records an application-link click, NOT a completed application.
    markJobOpened(activeJob.id);
    if(method!=='native')return;
    e.preventDefault();
    var job=activeJob;
    closeDrawer(false);
    window.dispatchEvent(new CustomEvent('studio:apply',{detail:{job:job}}));
  });
  $('drawer-copy').addEventListener('click',function(){copyJobUrl(this);});
  $('drawer-save').addEventListener('click',function(){
    if(!activeJob)return;
    var pos=savedIndex(activeJob.id);
    if(pos>=0)saved.splice(pos,1);
    else saved.push(snapshotForJob(activeJob,null));
    persist();updateDrawerSaved();
    $('saved-count').textContent=saved.length;savedShortcut.textContent='Saved jobs ('+saved.length+')';
    refreshJobMarkers();
    if(state.onlySaved){closeDrawer(false);render();}
  });
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
    // Offline preview only. Production always reads the operator-controlled file.
    setFeaturedConfig(window.STUDIO_OPENINGS_FEATURED_PREVIEW||null);
    state.jobs=(window.STUDIO_OPENINGS_REVIEW_JOBS||[]).filter(displayableJob).map(function(j,i){j.reviewOrder=i;return j;});
    $('system-message').hidden=false;$('system-message').textContent='REVIEW SNAPSHOT · Official firm vacancies reviewed 17 Nov 2026. Their availability may change.';
    $('updated-label').textContent='Offline source review';
    $('list-footnote').textContent='Click a listing to open its details without changing the results layout. The complete description and application steps remain on the original site. Snapshot status can change.';
    hydrateSavedEntries();render();
    syncJobFromUrl();
  }
  function vacancyLinkKey(job){
    if(!job.url)return '';
    try{
      var link=new URL(job.url);
      link.hash='';
      var keys=[];link.searchParams.forEach(function(_,k){if(/^utm_|^gh_src$/i.test(k))keys.push(k);});
      keys.forEach(function(k){link.searchParams.delete(k);});
      if(link.hostname==='boards.greenhouse.io')link.hostname='job-boards.greenhouse.io';
      if(/^(?:job-boards\.greenhouse\.io|jobs\.(?:eu\.)?lever\.co|jobs\.ashbyhq\.com)$/.test(link.hostname) && link.pathname.split('/').filter(Boolean).length>=2){
        return link.origin+link.pathname.replace(/\/apply\/?$|\/$/,'');
      }
      return link.href+'|'+trim(job.title).toLowerCase()+'|'+trim(job.location).toLowerCase();
    }catch(e){return '';}
  }
  function loadLive(){
    var urls=['/api/approved-jobs','/api/indexed-jobs','/api/firm-jobs','/api/editorial-jobs','/api/jobs','/api/source-jobs','/api/ai-jobs?shard=0','/api/ai-jobs?shard=1','/api/ai-jobs?shard=2','/api/ai-jobs?shard=3','/api/ai-jobs?shard=4','/api/ai-jobs?shard=5','/api/ai-jobs?shard=6','/api/ai-jobs?shard=7','/api/source-jobs?shard=1','/api/source-jobs?shard=2','/api/source-jobs?shard=3','/api/direct-jobs?shard=0','/api/direct-jobs?shard=1'];
    Promise.all([loadFeaturedConfig(),Promise.all(urls.map(function(url){return fetch(url,{credentials:'omit'}).then(function(response){if(!response.ok)throw Error(url+' unavailable');return response.json();}).then(function(value){return {status:'fulfilled',value:value};},function(){return {status:'rejected'};});}))]).then(function(all){
      var items=all[1];
      var seen=Object.create(null),links=Object.create(null),records=[],latest=null,success=0;
      items.forEach(function(outcome){
        if(outcome.status!=='fulfilled'||!outcome.value||!Array.isArray(outcome.value.jobs))return;
        success++;
        outcome.value.jobs.forEach(function(j){
          if(!displayableJob(j)||seen[j.id])return;
          var key=vacancyLinkKey(j);
          if(key && links[key]){
            liveAliases[j.id]=links[key];liveAliases[publicJobHandle(j.id)]=links[key];return;
          }
          records.push(j);seen[j.id]=true;if(key)links[key]=j.id;
        });
        if(outcome.value.updatedAt)latest=outcome.value.updatedAt;
      });
      if(!success)throw Error('No current feeds available');
      state.jobs=records;
      $('system-message').hidden=state.jobs.length>0;
      if(!state.jobs.length)$('system-message').textContent='No current creative vacancies were returned by the connected feeds.';
      $('updated-label').textContent='Feed fetched '+new Date(latest||Date.now()).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
      hydrateSavedEntries();render();syncJobFromUrl();
    }).catch(function(){
      $('system-message').hidden=false;
      $('updated-label').textContent='Feed unavailable';
      $('system-message').textContent='Current jobs could not be loaded. Please try later. Offline review records are not substituted for current vacancies.';
      $('results-summary').textContent='Feed unavailable';
    });
  }
  if(window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')loadReview();else loadLive();
})();
