/** Public-only config. NEVER return the Turnstile secret or database credentials. */
export async function onRequestGet({env}){
  const key=String(env?.TURNSTILE_SITE_KEY||'').trim();
  const contact=String(env?.SUPPORT_EMAIL||'').trim();
  const supportEmail=/^[^\s@]{1,64}@[^\s@]{1,120}\.[a-z]{2,24}$/i.test(contact)?contact:'';
  const enabled=Boolean(env?.JOBS_DB&&env?.TURNSTILE_SECRET_KEY&&key&&supportEmail);
  return new Response(JSON.stringify({enabled,siteKey:enabled?key:null,nativeApplyEnabled:enabled&&env.NATIVE_APPLY_ENABLED==='true',supportEmail}),{
    status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
  });
}
