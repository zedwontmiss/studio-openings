export function vacancyLinkKey(job){
    if(!job||!job.url)return '';
    try{
      var link=new URL(job.url);
      if(link.protocol!=='https:'||link.username||link.password)return '';
      link.hash='';
      var keys=[];link.searchParams.forEach(function(_,k){if(/^utm_|^gh_src$/i.test(k))keys.push(k);});
      keys.forEach(function(k){link.searchParams.delete(k);});
      if(link.hostname==='boards.greenhouse.io')link.hostname='job-boards.greenhouse.io';
      if(/^(?:job-boards\.greenhouse\.io|jobs\.(?:eu\.)?lever\.co|jobs\.ashbyhq\.com)$/.test(link.hostname) && link.pathname.split('/').filter(Boolean).length>=2){
        return link.origin+link.pathname.replace(/\/apply\/?$|\/$/,'');
      }
      return link.href+'|'+String(job.title||'').trim().toLowerCase()+'|'+String(job.location||'').trim().toLowerCase();
    }catch(e){return '';}
  }
