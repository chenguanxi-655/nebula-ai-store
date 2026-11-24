#!/usr/bin/env node
// Usage: node backend/fc-deploy/build.mjs /private/path/original-index.js /private/path/original-package.json
// Writes a deployment directory outside the repository; never commits legacy source or credentials.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const [legacyPath,packagePath]=process.argv.slice(2);
if(!legacyPath||!packagePath){console.error('Usage: node backend/fc-deploy/build.mjs <legacy-index.js> <package.json>');process.exitCode=2}
else{
 const root=resolve(import.meta.dirname,'..');
 const legacy=await readFile(resolve(legacyPath),'utf8');
 const pkg=await readFile(resolve(packagePath),'utf8');
 if(!legacy.includes('module.exports')||!legacy.includes('handler'))throw Error('Original FC code does not appear to export a handler; inspect manually.');
 const parsed=JSON.parse(pkg);
 if(parsed.type==='module')throw Error('Legacy FC entry is CommonJS; package type=module is not supported by this adapter.');
 const original=await readFile(join(root,'fc-deploy','index.js'),'utf8');
 const adapter=await readFile(join(root,'fc-admin-adapter.cjs'),'utf8');
 const dest=resolve(process.cwd(),'nebula-fc-staging');
 await mkdir(dest,{recursive:true});
 await writeFile(join(dest,'index.js'),original.replace("require('../fc-admin-adapter.cjs')","require('./fc-admin-adapter.cjs')"));
 await writeFile(join(dest,'legacy-index.js'),legacy);
 await writeFile(join(dest,'fc-admin-adapter.cjs'),adapter);
 await writeFile(join(dest,'package.json'),pkg);
 console.log('Staging directory created:',dest);
 console.log('Contains private original source. Do not commit, upload publicly, or deploy before testing.');
}
