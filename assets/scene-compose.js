(function(){
 'use strict';
 var forms=document.querySelectorAll('.scene-form'),loader=null;
 function challenge(){
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(!loader)loader=new Promise(function(resolve,reject){
   var script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
   script.onload=function(){if(window.turnstile)resolve(window.turnstile);else reject(Error('Verification unavailable'));};
   script.onerror=function(){reject(Error('Verification unavailable'));};document.head.appendChild(script);
  }).catch(function(e){loader=null;throw e;});
  return loader;
 }
 Array.prototype.forEach.call(forms,function(form){
  var details=form.parentNode,button=form.querySelector('button'),feedback=form.querySelector('.scene-feedback'),widget=null,proof='',busy=false,loading=false,complete=false;
  var kind=form.getAttribute('data-kind');
  function sync(){button.disabled=busy||complete||!proof;}
  function reset(){proof='';sync();if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
  function prepare(){
   if(!details.open||loading||widget!==null||complete)return;
   loading=true;
   challenge().then(function(t){widget=t.render(form.querySelector('.scene-challenge'),{sitekey:form.getAttribute('data-sitekey'),action:'scene_'+kind,callback:function(value){proof=value;sync();},'expired-callback':function(){proof='';sync();},'error-callback':function(){proof='';sync();feedback.textContent='Verification unavailable. Close and reopen the form to try again.';}});loading=false;},function(){loading=false;feedback.textContent='Verification unavailable. Close and reopen the form to try again.';});
  }
  details.addEventListener('toggle',prepare);
  form.addEventListener('submit',function(event){
   event.preventDefault();if(busy||complete||!proof)return;
   var input={kind:kind,city:form.getAttribute('data-city'),challenge:proof};
   if(kind==='topic')input.title=form.elements.title.value;
   if(kind!=='report')input.body=form.elements.body.value;
   if(kind!=='topic')input.topicId=form.getAttribute('data-topic');
   if(kind==='report'){input.reason=form.elements.reason.value;var reply=form.getAttribute('data-reply');if(reply)input.replyId=reply;}
   busy=true;sync();feedback.textContent='Submitting…';
   fetch('/api/scene',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}).then(function(response){return response.json().then(function(data){if(!response.ok||!data.ok)throw Error(data.error||'Submission unavailable');return data;});}).then(function(){complete=true;busy=false;proof='';form.reset();sync();feedback.textContent=kind==='report'?'Report received for review.':'Submitted for moderation. It will not appear publicly until approved.';if(widget!==null&&window.turnstile)window.turnstile.remove(widget);},function(error){busy=false;feedback.textContent=error.message||'Submission unavailable';reset();});
  });
 });
})();
