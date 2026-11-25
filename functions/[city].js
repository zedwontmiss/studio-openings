import {reviewHost,sceneDirectoryCities} from '../lib/release-scope.js';
import {findLocal} from '../lib/local-page.js';
import {cityDirectory} from '../lib/scene-directory.js';
export async function onRequestGet(context){
 const city=findLocal(String(context.params?.city||''));
 if(!city)return context.next();
 if(!reviewHost(new URL(context.request.url).hostname)||!sceneDirectoryCities.includes('/'+city.slug))return new Response('Not found',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
 // Read-only editorial directory. Community submissions are manual, not forum writes.
 return new Response(cityDirectory(city),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
}
