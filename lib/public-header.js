// Shared public navigation. Keep primary destinations in one place.
export const HEADER_CSS='<link rel="stylesheet" href="/assets/public-design.css?v=20261124">';
export function publicHeader(active=''){
 const link=(path,label,key,id='')=>'<a href="'+path+'"'+(id?' id="'+id+'"':'')+(active===key?' aria-current="page"':'')+'>'+label+'</a>';
 const secondary=link('/about.html','about','about')+link('/coverage.html','bring to your city','coverage')+link('/contact.html','contact','contact');
 return '<header class="so-public-header" id="top"><div class="so-header-shell"><a class="so-brand" href="/">studio openings</a><nav class="so-primary" aria-label="Main navigation">'+link('/','jobs','jobs')+link('/studio','studio','studio')+link('/article','article','article')+'</nav><nav class="so-utility" aria-label="Site information">'+link('/post-a-job.html','post a job','post','nav-submit')+'<span class="so-utility-desktop">'+secondary+'</span><details class="so-utility-more"><summary>more</summary><div class="so-utility-pop">'+secondary+'</div></details></nav></div></header>';
}
