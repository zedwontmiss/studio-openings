const origin='https://development.studio-openings.pages.dev';
const tasks=Object.freeze({snapshot:{path:'/api/refresh-inventory-snapshot',secret:'SNAPSHOT_SECRET'},ingest:{path:'/api/ingest-sources',secret:'INGEST_SECRET'}});
export async function runMaintenance(task,env,fetcher=fetch){
 if(!Object.hasOwn(tasks,task))throw Error('Unknown maintenance task');
 const spec=tasks[task],key=env[spec.secret];
 if(typeof key!=='string'||key.length<32)throw Error('Missing dedicated maintenance secret: '+spec.secret);
 const response=await fetcher(origin+spec.path,{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:'{}',redirect:'error',signal:AbortSignal.timeout(90000)});
 let data;try{data=await response.json();}catch{throw Error('Maintenance returned invalid JSON (HTTP '+response.status+')');}
 // Do not log credentials, arbitrary remote response content or vacancy data.
 if(!response.ok||data?.ok!==true)throw Error('Maintenance failed (HTTP '+response.status+')');
 if(task==='ingest'&&data.status==='no-approved-source')return {task,status:'no-approved-source'};
 const count=task==='snapshot'?data.count:data.indexed;
 if(!Number.isSafeInteger(count)||count<0||count>100)throw Error('Unexpected maintenance result');
 return {task,status:'ok',count};
}
