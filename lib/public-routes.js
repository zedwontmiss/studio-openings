import {ARTICLE_PATHS} from './editorial-routes.js';
import {STUDIO_PATHS} from './studio-routes.js';
import {STUDIO_LOCATION_PATHS} from './studio-locations.js';
import {DISCIPLINE_SLUGS} from './discipline-pages.js';

export const INDEXABLE_PAGE_PATHS = Object.freeze([
 '/','/privacy','/coverage','/post-a-job','/advertise','/about','/contact','/terms',
 '/studio','/article',...ARTICLE_PATHS,...STUDIO_PATHS,...STUDIO_LOCATION_PATHS,
 ...DISCIPLINE_SLUGS.map(slug=>'/disciplines/'+slug)
]);

// Only explicit public aliases; never redirect operator, API or arbitrary paths.
export function canonicalAlias(pathname,publicPaths){
 if(pathname==='/cities'||pathname==='/cities.html')return '/scene';
 if(pathname==='/index.html')return '/';
 if(!pathname.endsWith('.html'))return '';
 const path=pathname.slice(0,-5);
 return publicPaths.has(path)?path:'';
}
export function publicLink(value){
 if(typeof value!=='string')return value;
 return value.replace(/^\/cities(?:\.html)?(?=$|[?#])/,'/scene').replace(/^\/(about|coverage|contact|privacy|terms|post-a-job)\.html(?=$|[?#])/,'/$1');
}

// Studio profiles preserve the directory when visitors follow external links.
export function studioExternalLink(value,origin){
 try{const u=new URL(value,origin);return ['http:','https:'].includes(u.protocol)&&u.origin!==new URL(origin).origin&&!['s-o.app','www.s-o.app','studio-openings.pages.dev','development.studio-openings.pages.dev'].includes(u.hostname);}catch{return false;}
}
