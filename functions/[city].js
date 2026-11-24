import {findLocal,localPage} from '../lib/local-page.js';
export async function onRequestGet(context){
 const city=findLocal(String(context.params?.city||''));
 if(!city)return context.next();
 return new Response(localPage(city),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
}
