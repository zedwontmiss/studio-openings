import {reviewHost} from '../lib/release-scope.js';
import {sceneDirectory} from '../lib/scene-directory.js';
export function onRequestGet({request}){if(!reviewHost(new URL(request.url).hostname))return new Response('Not found',{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});return new Response(sceneDirectory(),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});}
