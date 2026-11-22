import test from 'node:test';
import assert from 'node:assert/strict';
import adapter from './fc-admin-adapter.cjs';
const call=(path,method='GET',headers={},body)=>adapter.handler({path,httpMethod:method,headers,body},null,()=>({statusCode:299,body:'legacy'}));
test('FC adapter delegates legacy requests and blocks unconfigured admin access',async()=>{
 const old=process.env.ADMIN_ACCESS_CODE;delete process.env.ADMIN_ACCESS_CODE;
 try{assert.equal((await call('/health')).statusCode,299);assert.equal((await call('/api/admin/models')).statusCode,401)}
 finally{if(old===undefined)delete process.env.ADMIN_ACCESS_CODE;else process.env.ADMIN_ACCESS_CODE=old}
});
test('FC adapter validates admin credentials and hides provider secrets',async()=>{
 const old=process.env.ADMIN_ACCESS_CODE;process.env.ADMIN_ACCESS_CODE='test-admin-secret';
 try{
  assert.equal((await call('/api/admin/models')).statusCode,401);
  const r=await call('/api/admin/models','GET',{'X-Admin-Code':'test-admin-secret'});
  assert.equal(r.statusCode,200);
  const data=JSON.parse(r.body);
  assert.ok(data.items.some(x=>x.id==='zhipu-image'));
  assert.ok(data.items.every(x=>!('env' in x)));
  assert.equal((await call('/api/admin/virtual-models','POST',{'X-Admin-Code':'test-admin-secret'},JSON.stringify({name:'测试模型',baseModelId:'zhipu-image'}))).statusCode,201);
 }finally{if(old===undefined)delete process.env.ADMIN_ACCESS_CODE;else process.env.ADMIN_ACCESS_CODE=old}
});
