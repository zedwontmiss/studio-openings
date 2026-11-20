/* Studio Openings Operator Inspector regression; run:
 * node tests/operator-inspect-regression.cjs
 */
'use strict';
const fs=require('fs'),path=require('path');
const file=fs.readFileSync(path.join(__dirname,'..','assets','operator.js'),'utf8');
const i=file.indexOf(' function jumpToSourceBlock(node){'),j=file.indexOf(' function sourceGet(url){',i);
if(i<0||j<i)throw Error('Source inspection handlers not found');
const body=file.slice(i,j);
const assert=(ok,message)=>{if(!ok)throw Error('Failed: '+message);};
function node(){return {
 _text:'',children:[],hidden:true,disabled:false,value:'',attributes:{},
 get textContent(){return this._text;},set textContent(t){this._text=String(t);this.children=[];},
 appendChild(n){this.children.push(n);return n;},
 setAttribute(k,v){this.attributes[k]=v;},
 getBoundingClientRect(){return {top:1250};}
};}
const slots={};
for(const k of ['source-review','source-map-form','source-review-title','source-locations','source-raw-location','source-country','source-region','source-city','source-map-save','source-selected-city','source-city-options'])slots[k]=node();
const scrolls=[],win={pageYOffset:200,scrollTo(x,y){scrolls.push(y);}};
const src={id:'src-12345678-aaaa-4444-bbbb-cccccccccccc',employerName:'Wight & Company',officialURL:'https://job-boards.greenhouse.io/wight'};
let mode='ok',release;
const data={totalPublished:13,creativeTitles:7,locations:[{rawLocation:'Darien, Illinois, United States',count:3},{rawLocation:'Darien or Chicago, Illinois',count:2}]};
function sourceAPI(){return mode==='error'?Promise.reject(Error('Official ATS unavailable (HTTP 502)')):mode==='slow'?new Promise(done=>{release=done;}):Promise.resolve(data);}
function make(tag,cls,text){const v=node();v.className=cls||'';v.textContent=text||'';return v;}
function button(parent,label,callback){const v=make('button','',label);v.onclick=callback;parent.appendChild(v);return v;}
function link(parent,url,label){const a=make('a','quiet-link',label);a.href=url;parent.appendChild(a);}
const engine=new Function('$','window','document','sourceAPI','sourceButton','el','sourceState','linkText',
'var sourceInspectRevision=0,sourceInspectButton=null,selectedSource=null,selectedRaw=null,selectedCity=null;\n'+body+'\nreturn {inspectSource};')(
name=>slots[name],win,{documentElement:{scrollTop:0}},sourceAPI,button,make,{maps:[]},link);
async function run(){
 const trigger=make('button','','Inspect locations');
 const first=engine.inspectSource(src,trigger);
 assert(slots['source-review'].hidden===false,'reveals location panel');
 assert(trigger.disabled&&trigger.textContent==='Inspecting…','disables loading button');
 assert(slots['source-locations'].attributes['aria-busy']==='true','aria loading state');
 assert(scrolls[0]>1400,'scrolls to result section');
 await first;
 assert(slots['source-locations'].children.length===3,'rendered two raw locations');
 assert(!trigger.disabled&&trigger.textContent==='Inspect locations','restores button');
 assert(slots['source-locations'].attributes['aria-busy']==='false','busy state cleared');
 slots['source-locations'].children[2].children[1].onclick();
 assert(slots['source-map-form'].hidden===false,'mapping form opens');
 assert(/multiple cities/.test(slots['source-selected-city'].textContent),'warns against fake city');
 assert(scrolls.length>1,'scrolls to mapping form');
 mode='error';
 await engine.inspectSource(src,trigger);
 assert(slots['source-locations'].children.some(c=>c.textContent.includes('HTTP 502')),'error visible near result');
 assert(slots['source-locations'].children.some(c=>c.textContent==='Retry inspection'),'retry available');
 assert(slots['source-locations'].children.some(c=>c.textContent==='Check official careers ↗'),'source link available');
 mode='slow';
 const stale=engine.inspectSource(src,trigger);
 mode='ok';await engine.inspectSource(src,trigger);
 release({totalPublished:2,creativeTitles:0,locations:[]});await stale;
 assert(slots['source-locations'].children.length===3,'stale response ignored');
 console.log('PASS: 14 operator inspect regressions');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
