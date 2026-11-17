/**
 * Studio Openings V0.8.6 — public/preview indexing guard.
 * No dependencies, database reads, cookies, or external services.
 * Google should index the real domain only after it is connected to Pages.
 */
const CANONICAL_HOST = 's-o.app';
const CANONICAL_ORIGIN = 'https://' + CANONICAL_HOST;

export async function onRequest(context) {
  const requestURL = new URL(context.request.url);
  const response = await context.next();
  const headers = new Headers(response.headers);
  const path = requestURL.pathname;
  const isPublicDomain = requestURL.hostname.toLowerCase() === CANONICAL_HOST;
  const isAPI = path === '/api' || path.startsWith('/api/');

  // Preview URLs, older *.pages.dev domains and APIs are not search results.
  // Unlike robots.txt Disallow, an HTTP noindex directive can be read by crawlers.
  if (!isPublicDomain || isAPI) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // A single canonical address for the site's two stable public pages.
  // We don't publish JobPosting markup or a sitemap of third-party feed URLs.
  let canonicalPath = '';
  if (path === '/' || path === '/index.html') canonicalPath = '/';
  else if (path === '/privacy.html') canonicalPath = '/privacy.html';
  if (canonicalPath && isPublicDomain) {
    const canonicalLink = '<' + CANONICAL_ORIGIN + canonicalPath + '>; rel="canonical"';
    const oldLink = headers.get('Link');
    headers.set('Link', oldLink ? oldLink + ', ' + canonicalLink : canonicalLink);
  }

  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
