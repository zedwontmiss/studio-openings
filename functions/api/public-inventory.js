import {readInventory} from '../../lib/public-inventory.js';
export async function onRequestGet(context){
 const data=await readInventory(context);
 return new Response(JSON.stringify(data),{status:data.sources.every(s=>s.failed)?503:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
