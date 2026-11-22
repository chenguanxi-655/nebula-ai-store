import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

const port=23000+Math.floor(Math.random()*20000);
const base='http://127.0.0.1:'+port;
const child=spawn(process.execPath,['backend/server.mjs'],{env:{...process.env,PORT:String(port),ADMIN_ACCESS_CODE:'local-admin-test-secret',STUDIO_ACCESS_CODE:'local-studio-test-secret',ZHIPU_API_KEY:'',ALLOWED_ORIGIN:'http://localhost:5173'},stdio:'ignore'});
async function request(path,headers={},options={}){return fetch(base+path,{headers,...options})}
async function ready(){for(let i=0;i<50;i++){try{const r=await request('/health');if(r.ok)return}catch{}await delay(100)}throw Error('Server did not start')}
test('Nebula API integration: safe defaults and admin reads',async()=>{
 try{
  await ready();
  let r=await request('/health');assert.equal(r.status,200);assert.equal((await r.json()).imageConfigured,false);
  r=await request('/api/v1/templates');assert.equal(r.status,200);assert.ok((await r.json()).items.length>=2);
  r=await request('/api/admin/models');assert.equal(r.status,401);
  r=await request('/api/admin/models',{'X-Admin-Code':'wrong'});assert.equal(r.status,401);
  r=await request('/api/admin/models',{'X-Admin-Code':'local-admin-test-secret'});assert.equal(r.status,200);
  const models=(await r.json()).items;assert.ok(models.some(x=>x.id==='zhipu-image'));assert.ok(models.every(x=>!('env' in x)));
  r=await request('/api/admin/overview',{'X-Admin-Code':'local-admin-test-secret'});assert.equal(r.status,200);assert.equal((await r.json()).metrics.costCny,null);
  r=await request('/api/admin/virtual-models',{'X-Admin-Code':'local-admin-test-secret','Content-Type':'application/json'},{method:'POST',body:JSON.stringify({name:'测试虚拟模型',baseModelId:'zhipu-image',systemPrompt:'test'})});assert.equal(r.status,201);assert.equal((await r.json()).item.enabled,false);
  r=await request('/api/admin/virtual-models',{'X-Admin-Code':'local-admin-test-secret'});assert.equal((await r.json()).items.length,1);
  r=await request('/api/v1/tasks',{'X-Studio-Code':'local-studio-test-secret','Content-Type':'application/json'},{method:'POST',body:JSON.stringify({templateId:'video-trend',prompt:'test'})});assert.equal(r.status,409);
  r=await request('/api/v1/tasks',{'X-Studio-Code':'local-studio-test-secret','Content-Type':'application/json'},{method:'POST',body:JSON.stringify({templateId:'poster',prompt:''})});assert.equal(r.status,400);
  r=await request('/api/admin/models',{'X-Admin-Code':'local-admin-test-secret',Origin:'https://untrusted.example'});assert.equal(r.status,403);
  r=await request('/api/admin/models',{'X-Admin-Code':'local-admin-test-secret',Origin:'http://localhost:5173'});assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'http://localhost:5173');
 }finally{child.kill();if(child.exitCode===null && child.signalCode===null)await Promise.race([once(child,'exit').catch(()=>{}),delay(1500)])}
});
