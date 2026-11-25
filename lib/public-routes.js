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
