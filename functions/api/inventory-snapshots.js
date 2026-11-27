import {readSnapshots} from '../../lib/feed-snapshot.js';
export async function onRequestGet(context){return new Response(JSON.stringify(await readSnapshots(context)),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});}
