'use strict';
// Alibaba Cloud FC entrypoint. Keep the original FC index.js unchanged and
// copy it to legacy-index.js when assembling the deployment package.
// Do not deploy this file without the original legacy module.
const {handler: adminHandler}=require('../fc-admin-adapter.cjs');
let legacy;
try { legacy=require('./legacy-index.js'); }
catch(e){ throw new Error('Missing legacy-index.js: export the existing Alibaba FC index.js before packaging. '+e.message); }
if(typeof legacy.handler!=='function')throw new Error('Legacy FC module must export handler');
exports.handler=async(event,context)=>adminHandler(event,context,legacy.handler);
