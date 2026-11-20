/* Standalone scheduled Cloudflare Worker. Preview only. Secrets via dashboard. */
export default {
 async scheduled(_event,env){
  const u=new URL(env.SYNC_TARGET_URL||'https://invalid.invalid/');
  if(u.protocol!=='https:'||u.hostname!=='development.studio-openings.pages.dev'||
     u.pathname!=='/api/ingest-sources'||u.search||u.hash||!env.SYNC_TOKEN)
   throw Error('Invalid Preview source-sync configuration');
  const r=await fetch(u.href,{method:'POST',headers:{
   authorization:'Bearer '+env.SYNC_TOKEN,'content-type':'application/json'
  },body:'{}'});
  if(!r.ok)throw Error('Source sync failed: HTTP '+r.status);
 },
 async fetch(){return new Response('Scheduled worker only',{status:404});}
};
