import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {applyOutreachPolicy} from '../lib/outreach-policy.js';

const pages = new Set(['/', '/privacy', '/coverage', '/post-a-job', '/about', '/contact', '/terms', '/studio', '/article', '/article/creative-job-search-checklist',
  ...DISCIPLINE_SLUGS.map(slug => '/disciplines/' + slug)]);

export async function onRequest(context) {
  const {hostname, pathname} = new URL(context.request.url);
  const response = await applyOutreachPolicy(await context.next(),pathname);
  const headers = new Headers(response.headers);
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const publicPage = pages.has(path) || /^\/jobs\/SO-[A-Z0-9-]{6,45}$/i.test(path) || /^\/openings\/[a-z0-9-]{8,160}$/i.test(path);
  if (hostname !== 's-o.app' || response.status >= 400 || (!publicPage && !['/robots.txt','/sitemap.xml'].includes(path))) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (publicPage && response.status === 200) {
    headers.set('Link', '<https://s-o.app' + path + '>; rel="canonical"');
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  const output = new Response(response.body, {status:response.status, statusText:response.statusText, headers});
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
