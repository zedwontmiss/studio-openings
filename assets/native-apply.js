/* Browser-side native candidate application. Never persists candidate PII locally. */
(function(){'use strict';
 var $=id=>document.getElementById(id), panel=$('apply-panel'),backdrop=$('apply-backdrop'),form=$('apply-form');
 if(!panel)return;
 var current=null,siteKey='',widget=null,token='',preview=window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:',previousFocus=null;
 function msg(t){$('apply-message').textContent=t;}
 function close(){panel.hidden=true;backdrop.hidden=true;document.body.classList.remove('submission-open');form.reset();token='';current=null;if(previousFocus&&document.contains(previousFocus))previousFocus.focus();}
 function setup(){
   if(preview){msg('OFFLINE REVIEW: application data is not sent or stored.');return;}
   msg('Loading secure verification…');
   fetch('/api/submission-config',{credentials:'omit',cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Service unavailable');return r.json();}).then(function(config){
     if(!config.enabled||!config.siteKey)throw Error('Verification is not configured');
     siteKey=config.siteKey;
     function render(){widget=window.turnstile.render('#apply-turnstile',{sitekey:siteKey,action:'apply_job',theme:'light',callback:function(t){token=t;msg('Verification complete.');},'expired-callback':function(){token='';msg('Verification expired. Try again.');}});msg('Verify before submitting.');}
     if(window.turnstile){render();return;}
     var script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=render;script.onerror=function(){msg('Security verification unavailable.');};document.head.appendChild(script);
   }).catch(function(e){msg('Applications unavailable: '+e.message);});
 }
 function open(job){if(!job||job.applicationMethod!=='native')return;previousFocus=document.activeElement;current=job;panel.hidden=false;backdrop.hidden=false;form.hidden=false;$('apply-result').hidden=true;document.body.classList.add('submission-open');$('apply-job-label').textContent=job.title+' — '+job.company;msg('');$('apply-close').focus();if(widget!==null&&window.turnstile){window.turnstile.remove(widget);widget=null;}setup();}
 window.addEventListener('studio:apply',function(e){open(e.detail.job);});
 $('apply-close').addEventListener('click',close);backdrop.addEventListener('click',close);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
 form.addEventListener('submit',async function(e){e.preventDefault();if(!current)return;
   var f=new FormData(form),v=k=>String(f.get(k)||'').trim(),name=v('name'),email=v('email'),portfolio=v('portfolio'),intro=v('introduction');
   if(name.length<2||!email||!f.get('consent')){msg('Name, valid email, and consent are required.');return;}
   if(portfolio){try{var u=new URL(portfolio);if(u.protocol!=='https:')throw Error();}catch{msg('Portfolio must be a HTTPS link.');return;}}
   if(preview){form.hidden=true;$('apply-result').hidden=false;$('apply-result-title').textContent='Offline preview only';$('apply-result-description').textContent='No application was sent or stored. On the live site, applications are held privately for manual forwarding to the employer.';$('apply-reference').textContent='';return;}
   if(!token){msg('Complete the security verification.');return;}
   var button=$('apply-submit');button.disabled=true;button.textContent='Submitting…';
   try {var response=await fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({jobId:current.id,name,email,portfolio,introduction:intro,consent:true,turnstileToken:token})});var result=await response.json();if(!response.ok||!result.ok)throw Error(result.message||'Application not accepted');form.hidden=true;$('apply-result').hidden=false;$('apply-result-title').textContent='Application received by Studio Openings';$('apply-result-description').textContent='Stored privately for manual forwarding. It has not been delivered directly to the employer.';$('apply-reference').textContent='Reference: '+result.reference;
   }catch(err){msg(err.message||'Submission failed');token='';if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}finally{button.disabled=false;button.textContent='Submit application';}
 });
})();
