/** Studio Openings V0.9 — explicitly serve XML at /sitemap.xml.
 * This avoids the Cloudflare Pages SPA homepage fallback at this important URL.
 * No third-party feed jobs are represented as indexed standalone postings.
 */
const XML = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>https://s-o.app/</loc></url>\n  <url><loc>https://s-o.app/privacy.html</loc></url>\n</urlset>\n";
export function onRequestGet() {
  return new Response(XML, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
