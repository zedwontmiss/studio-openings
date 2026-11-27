/* Staged Preview-only worker; dashboard deployment and Cron not activated. */
export default {
 async scheduled(_event,env){
  if(typeof env.INVENTORY_SYNC_TOKEN!=='string'||env.INVENTORY_SYNC_TOKEN.length<32)throw Error('Missing inventory token');
  const r=await fetch('https://development.studio-openings.pages.dev/api/refresh-inventory-snapshot',{method:'POST',headers:{authorization:'Bearer '+env.INVENTORY_SYNC_TOKEN},redirect:'error'});
  if(!r.ok)throw Error('Inventory refresh HTTP '+r.status);
 },
 async fetch(){return new Response('Scheduled worker only',{status:404});}
};
