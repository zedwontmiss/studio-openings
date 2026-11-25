import {operatorAuthorized,sceneReply} from './scene-core.js';
import {reviewHost} from './release-scope.js';
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export const validId=id=>typeof id==='string'&&/^SO-[A-Z0-9-]{6,45}$/i.test(id);
export const managementEnabled=(req,env)=>reviewHost(new URL(req.url).hostname)&&env?.PREVIEW_D1_ISOLATED==='true'&&!!env?.JOBS_DB&&typeof env.OPERATOR_ACCESS_TOKEN==='string'&&env.OPERATOR_ACCESS_TOKEN.length>=32;
async function signature(id,expiry,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode('studio-openings:employer-management:preview:v1:'+id+':'+expiry)));}
export async function createCapability(id,secret,now=Date.now()){if(!validId(id))throw Error('Invalid reference');const expiry=Math.floor(now/1000)+120*86400;return expiry+'.'+await signature(id,expiry,secret);}
export async function verifyCapability(id,token,secret,now=Date.now()){if(!validId(id)||typeof token!=='string'||!/^\d{10}\.\w{64}$/.test(token))return false;const [expiry,sig]=token.split('.'),n=Number(expiry);if(n<=Math.floor(now/1000)||n>Math.floor(now/1000)+120*86400)return false;const expected=await signature(id,n,secret);let diff=0;for(let i=0;i<64;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
export const employerRow=(db,id)=>db.prepare("SELECT s.id,s.status,s.job_title,s.company,o.status AS payment_status FROM job_submissions s JOIN job_orders o ON o.submission_id=s.id WHERE s.id=? AND s.submission_type='employer' AND o.status='paid' AND o.published_at IS NOT NULL").bind(id).first();
export {operatorAuthorized,sceneReply};
