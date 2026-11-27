import {reviewHost,hiddenReleasePath,deferredPath} from '../lib/release-scope.js';
import {LOCAL_PATHS} from '../lib/local-cities.js';
import {seedStudioJobs} from '../lib/studio-jobs.js';
import {canonicalAlias,publicLink,studioExternalLink} from '../lib/public-routes.js';
import {seedHomepage} from '../lib/public-inventory.js';
import {STUDIO_LOCATION_PATHS} from '../lib/studio-locations.js';
import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {applyOutreachPolicy} from '../lib/outreach-policy.js';

const pages = new Set(['/', '/privacy', '/coverage', '/scene', '/scene-guidelines', '/scene-contributors', '/post-a-job', '/advertise', '/about', '/contact', '/terms', '/studio', '/article', ...ARTICLE_PATHS, ...STUDIO_PATHS, ...STUDIO_LOCATION_PATHS, ...LOCAL_PATHS,
  ...DISCIPLINE_SLUGS.map(slug => '/disciplines/' + slug)]);

export async function onRequest(context) {
  const {hostname, pathname} = new URL(context.request.url);
  if(/^\/weekly(?:\.html|\/index\.html|\/)?$/i.test(pathname)&&!reviewHost(hostname))return new Response('Not found',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
  if(hiddenReleasePath(hostname,pathname))return new Response('Not found',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
  if(reviewHost(hostname)&&/^\/weekly(?:\.html|\/index\.html|\/)?$/i.test(pathname)&&['GET','HEAD'].includes(context.request.method)){const u=new URL(context.request.url);u.pathname='/signal';return new Response(null,{status:308,headers:{location:u.href,'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});}
  const alias=canonicalAlias(pathname,pages);
  if(alias&&['GET','HEAD'].includes(context.request.method)){
    const destination=new URL(context.request.url);destination.pathname=alias;
    return new Response(null,{status:308,headers:{location:destination.href,'cache-control':'no-store','x-robots-tag':hostname==='s-o.app'?'noindex':'noindex, nofollow'}});
  }
  let response = await applyOutreachPolicy(await context.next(),pathname);
  if ((pathname==='/'||pathname==='/index.html') && !new URL(context.request.url).searchParams.has('city') && context.request.method==='GET' && (hostname!=='s-o.app'||context.env?.PUBLIC_INVENTORY_ENABLED==='true')) response=await seedHomepage(response,context);
  if (context.request.method==='GET' && STUDIO_PATHS.includes(pathname) && (hostname==='development.studio-openings.pages.dev'||context.env?.STUDIO_ASSOCIATIONS_ENABLED==='true')) response=await seedStudioJobs(response,context,pathname.slice('/studio/'.length));
  const headers = new Headers(response.headers);
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const publicPage = pages.has(path) || /^\/jobs\/SO-[A-Z0-9-]{6,45}$/i.test(path) || /^\/openings\/[a-z0-9-]{8,160}$/i.test(path);
  if ((path==='/scene'||path==='/scene-guidelines'||path==='/scene-contributors') || LOCAL_PATHS.includes(path) || hostname !== 's-o.app' || response.status >= 400 || (!publicPage && !['/robots.txt','/sitemap.xml'].includes(path))) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (publicPage && response.status === 200) {
    headers.set('Link', '<https://s-o.app' + path + '>; rel="canonical"');
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  let output = new Response(response.body, {status:response.status, statusText:response.statusText, headers});
  if(response.status===200&&headers.get('content-type')?.startsWith('text/html')&&typeof HTMLRewriter!=='undefined'){
    headers.delete('content-length');headers.delete('etag');
    headers.set('cache-control','no-store');
    const rewriter=new HTMLRewriter();
    if(STUDIO_PATHS.includes(path))rewriter.on('.studio-careers',{element(el){el.remove();}});
    output=rewriter.on('a[href]',{element(el){
      const href=el.getAttribute('href'),next=publicLink(href);
      if(hiddenReleasePath(hostname,next)){
        if(LOCAL_PATHS.includes(next.split(/[?#]/,1)[0]))el.setAttribute('href','/?filters=1&city='+encodeURIComponent(next.split(/[?#]/,1)[0].slice(1))+'#jobs');
        else el.remove();
        return;
      }
      if(next!==href)el.setAttribute('href',next);
      if((path==='/studio'||STUDIO_PATHS.includes(path))&&studioExternalLink(next,context.request.url)){
        el.setAttribute('target','_blank');
        el.setAttribute('rel','noopener noreferrer');
      }
    }}).on('[data-signal-contact]',{element(el){if(!reviewHost(hostname))el.remove();}}).transform(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
  }
  // Newsletter overlay on browsing pages only; no employer, checkout, application or operator forms.
  if(reviewHost(hostname)&&context.request.method==='GET'&&response.status===200&&headers.get('content-type')?.startsWith('text/html')&&typeof HTMLRewriter!=='undefined'&&(path==='/'||path==='/studio'||path==='/article'||STUDIO_PATHS.includes(path)||ARTICLE_PATHS.includes(path)||path==='/scene'||LOCAL_PATHS.includes(path)||path.startsWith('/disciplines/'))){
    output=new HTMLRewriter().on('head',{element(el){el.append('<link rel="stylesheet" href="/assets/weekly-overlay.css?v=4">',{html:true});}}).on('body',{element(el){el.append("<div id=\"weekly-overlay\" hidden><section class=\"weekly-dialog\" role=\"dialog\" aria-modal=\"true\" aria-label=\"SIGNAL.\"><button id=\"weekly-close\" type=\"button\" aria-label=\"Close newsletter\"><svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M3 3L17 17M17 3L3 17\" stroke=\"currentColor\" stroke-width=\"3.5\" fill=\"none\"/></svg></button><iframe id=\"weekly-frame\" title=\"Newsletter subscription\" src=\"about:blank\"></iframe></section></div>"+'<script defer src="/assets/weekly-overlay.js?v=4"></script>',{html:true});}}).transform(output);
  }
  const previewReady = hostname === 'development.studio-openings.pages.dev' && context.env?.PREVIEW_D1_ISOLATED === 'true';
  if (publicPage && response.status === 200 && context.request.method === 'GET' &&
      context.env?.TRAFFIC_ENABLED === 'true' && (hostname === 's-o.app' || previewReady) &&
      headers.get('content-type')?.startsWith('text/html') &&
      context.request.headers.get('DNT') !== '1' && context.request.headers.get('Sec-GPC') !== '1') {
    return new HTMLRewriter().on('head',{element(head){
      head.append('<script defer src="/assets/traffic.js"></script>',{html:true});
    }}).transform(output);
  }
  return output;
}
