import {runMaintenance} from './preview-maintenance-core.mjs';
try{console.log(JSON.stringify(await runMaintenance(process.env.TASK,process.env)));}catch(error){console.error(error instanceof Error?error.message:'Maintenance failed');process.exitCode=1;}
