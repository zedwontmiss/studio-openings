// Balanced element extraction tolerates nested formatting without importing a DOM parser.
export function elementAt(html,start){
  const open=html.slice(start).match(/^<([a-z][\w-]*)\b[^>]*>/i);if(!open)return '';
  const tag=open[1],tokens=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');tokens.lastIndex=start;
  let depth=0,m;while((m=tokens.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(!depth)return html.slice(start,tokens.lastIndex);}
  return '';
}
