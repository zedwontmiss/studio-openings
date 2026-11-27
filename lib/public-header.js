// Shared public navigation. Keep primary destinations in one place.
export const HEADER_CSS='<link rel="stylesheet" href="/assets/public-design.css?v=20261125-masthead">';
export function publicHeader(active=''){
 const link=(path,label,key,id='')=>'<a href="'+path+'"'+(id?' id="'+id+'"':'')+(active===key?' aria-current="page"':'')+'>'+label+'</a>';
 const section=({jobs:'jobs',studio:'studio',article:'article',scene:'scene',about:'about',contact:'contact',coverage:'coverage',post:'advertise',advertise:'advertise',privacy:'privacy',terms:'terms'})[active]||'';
 return '<header class="so-public-header" id="top"><div class="so-header-shell"><div class="so-masthead"><a class="so-brand" href="/about"'+(active==='about'?' aria-current="page"':'')+'>studio openings</a>'+(section?'<span class="so-section"> / '+section+'</span>':'')+'</div><nav class="so-primary" aria-label="Main navigation">'+link('/','jobs','jobs')+link('/studio','studio','studio')+link('/article','article','article')+link('/scene','scene','scene')+'</nav><nav class="so-utility" aria-label="Advertising"><a href="/advertise" id="nav-submit" class="so-advertise"'+(active==='post'||active==='advertise'?' aria-current="page"':'')+'>advertise</a></nav><a class="so-about-mark" href="/contact" aria-label="Contact Studio Openings" title="Contact"'+(active==='contact'?' aria-current="page"':'')+'>S/O</a></div></header>';
}
