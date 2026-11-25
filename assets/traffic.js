(function(){
  'use strict';
  if (navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.globalPrivacyControl===true || !window.fetch) return;
  var source='direct', fresh=false;
  try {
    var landing=new URL(location.href), tag=landing.searchParams.get('utm_source');
    var ref=document.referrer ? new URL(document.referrer) : null;
    var host=ref ? ref.hostname.toLowerCase() : '';
    var external=ref && ref.origin!==location.origin;
    if (tag==='reddit' || tag==='x') source=tag;
    else if (external) {
      if (/(^|\.)reddit\.com$/.test(host) || host==='redd.it') source='reddit';
      else if (/^(?:www\.)?(x\.com|twitter\.com|t\.co)$/.test(host)) source='x';
      else if (/^(?:www\.)?(?:google\.(?:com|co\.id|co\.uk|com\.au|co\.jp|co\.in|ca|de|fr|it|es|nl|ch|se|dk|ie)|bing\.com|duckduckgo\.com)$/.test(host)) source='search';
      else source='other';
    }
    try {
      var previous=sessionStorage.getItem('so-referral');
      fresh=!previous || (!!external && previous!==source) || ((tag==='reddit' || tag==='x') && previous!==tag);
      if(previous && !external && !tag) source=previous;
      sessionStorage.setItem('so-referral',source);
    } catch(ignore){}
  } catch(ignore){return;}
  function record(event,job) {
    fetch('/api/traffic',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,
      headers:{'Content-Type':'application/json'},body:JSON.stringify({event:event,referral:source,job:job||'',entry:event==='view'&&fresh})}).catch(function(){});
  }
  var path=location.pathname.match(/^\/(?:jobs|openings)\/([a-z0-9-]+)$/i);
  record('view',path?path[1]:'');
  window.SOAPPTraffic={jobView:function(id){record('listing',id||'');}};
  document.addEventListener('click',function(e){
    var link=e.target.closest && e.target.closest('[data-apply-job]');
    if(link && e.isTrusted && e.button===0 && !link.hidden) record('apply',link.getAttribute('data-apply-job'));
  });
})();
