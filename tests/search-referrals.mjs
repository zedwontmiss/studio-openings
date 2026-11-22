import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync('assets/traffic.js','utf8');
function view(referrer){
  const page=new URL('https://s-o.app/disciplines/web');
  let event;
  const fetch=async(path,options)=>{event=JSON.parse(options.body);};
  runInNewContext(script,{URL,location:page,navigator:{},window:{fetch},fetch,
    sessionStorage:{getItem(){return null;},setItem(){}},
    document:{referrer,addEventListener(){}}});
  return event;
}
for(const host of ['www.google.co.id','google.co.uk','www.google.com','www.bing.com','duckduckgo.com']){
  assert.deepEqual(view('https://'+host+'/search?q=designer'),{event:'view',referral:'search',job:'',entry:true});
}
for(const host of ['mail.google.com','docs.google.com','google.com.example.org']){
  assert.equal(view('https://'+host+'/').referral,'other');
}
assert.equal(view('').referral,'direct');
console.log('Regional search referrals, non-search services and direct visits passed.');
