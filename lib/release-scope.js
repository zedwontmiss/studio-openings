import {LOCAL_PATHS} from './local-cities.js';
// Review host is intentionally exact. Other deployments fail closed.
export const reviewHost=hostname=>hostname==='development.studio-openings.pages.dev';
const deferred=new Set(['/scene','/cities','/scene-guidelines','/scene-contributors',...LOCAL_PATHS]);
export function deferredPath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return false;
 let p=value.split(/[?#]/,1)[0];
 try{p=decodeURIComponent(p);}catch{return false;}
 p=p.replace(/\/+$/,'').replace(/\/index\.html$/i,'').replace(/\.html$/i,'').toLowerCase();
 return deferred.has(p)||/^\/(?:scene|cities)\/.+/.test(p);
}
export const sceneDirectoryCities=Object.freeze(LOCAL_PATHS.filter(p=>p!=='/mumbai'));
export function sceneDirectoryPath(path){if(typeof path!=='string')return false;let p=path.split(/[?#]/,1)[0];try{p=decodeURIComponent(p);}catch{return false;}p=p.replace(/\/+$/,'').replace(/\/index\.html$/i,'').replace(/\.html$/i,'').toLowerCase();return p==='/scene'||p==='/cities'||sceneDirectoryCities.includes(p);}
export function hiddenReleasePath(hostname,path){return deferredPath(path)&&!(reviewHost(hostname)&&sceneDirectoryPath(path));}
