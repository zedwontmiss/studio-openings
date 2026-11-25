import {LOCAL_PATHS} from '../lib/local-cities.js';
import {seedStudioJobs} from '../lib/studio-jobs.js';
import {canonicalAlias,publicLink} from '../lib/public-routes.js';
import {seedHomepage} from '../lib/public-inventory.js';
import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {applyOutreachPolicy} from '../lib/outreach-policy.js';

const pages = new Set(['/', '/privacy', '/coverage', '/scene', '/scene-guidelines', '/scene-contributors', '/post-a-job', '/advertise', '/about', '/contact', '/terms', '/studio', '/article', ...ARTICLE_PATHS, ...STUDIO_PATHS, ...LOCAL_PATHS,
  ...DISCIPLINE_SLUGS.map(slug => '/disciplines/' + slug)]);

export async function onRequest(context) {
  const {hostname, pathname} = new URL(context.request.url);
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
  if(publicPage&&response.status===200&&headers.get('content-type')?.startsWith('text/html')&&typeof HTMLRewriter!=='undefined'){
    output=new HTMLRewriter().on('a[href]',{element(el){const href=el.getAttribute('href'),next=publicLink(href);if(next!==href)el.setAttribute('href',next);}}).transform(output);
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
