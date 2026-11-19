/** Studio Openings launch index policy: canonical production host only; preview never indexed. */
const FALLBACK_HOST='studio-openings.pages.dev';
export async function onRequest(context){
 const u=new URL(context.request.url),response=await context.next(),headers=new Headers(response.headers);
 const configured=String(context.env?.PUBLIC_CANONICAL_HOST||FALLBACK_HOST).trim().toLowerCase();
 const canonicalHost=/^[a-z0-9.-]+$/.test(configured)?configured:FALLBACK_HOST;
 const isProduction=u.hostname.toLowerCase()===canonicalHost;
 const path=u.pathname;
 const isPrivate=path==='/operator.html'||path==='/operator'||path.startsWith('/api/')||path.startsWith('/assets/')||path.startsWith('/functions/');
 const isPage=path==='/'||path==='/index.html'||path==='/privacy.html'||path==='/coverage.html'||path==='/post-a-job.html'||path==='/about.html'||path==='/suggest-a-job.html'||/^\/jobs\/SO-[A-Z0-9-]{6,45}$/i.test(path);
 if(!isProduction||isPrivate||(!isPage && path!=='/robots.txt'&&path!=='/sitemap.xml'))headers.set('X-Robots-Tag','noindex, nofollow');
 if(isProduction&&response.status===200&&isPage){
   const target=path==='/index.html'?'/':path;
   const canonical='<https://'+canonicalHost+target+'>; rel="canonical"';
   const old=headers.get('Link');headers.set('Link',old?old+', '+canonical:canonical);
 }
 headers.set('X-Content-Type-Options','nosniff');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
