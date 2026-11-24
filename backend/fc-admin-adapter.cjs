// Alibaba Cloud FC Node.js 20 custom adapter for Nebula admin API.
// This is an additive adapter: it does NOT replace the existing production index.js.
// Deployment must bundle admin.mjs and deliberately integrate the original legacy handler.
const {randomUUID}=require('node:crypto');
const models=[
{id:'zhipu-image',name:'CogView 3 Flash',provider:'zhipu',type:'image',env:'ZHIPU_API_KEY'},
{id:'zhipu-chat',name:'GLM 4 Flash',provider:'zhipu',type:'chat',env:'ZHIPU_API_KEY'},
{id:'openai-chat',name:'OpenAI',provider:'openai',type:'chat'},
{id:'doubao',name:'豆包',provider:'doubao',type:'chat'},
{id:'kling',name:'可灵',provider:'kling',type:'video'},
{id:'deepseek',name:'DeepSeek',provider:'deepseek',type:'chat'}
];
const virtualModels=new Map();
const events=[];
function result(status, data, origin=''){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 return {statusCode:status,headers,body:JSON.stringify(data),isBase64Encoded:false};
}
function parseEvent(event){
 let e=event;
 if(Buffer.isBuffer(e))e=JSON.parse(e.toString('utf8'));
 if(typeof e==='string')e=JSON.parse(e);
 const path=e.rawPath||e.path||e.requestContext?.http?.path||'/';
 const method=(e.httpMethod||e.requestContext?.http?.method||'GET').toUpperCase();
 const headers=Object.fromEntries(Object.entries(e.headers||{}).map(([k,v])=>[k.toLowerCase(),String(v)]));
 let payload=e.body;
 if(e.isBase64Encoded&&typeof payload==='string')payload=Buffer.from(payload,'base64').toString('utf8');
 return {path,method,headers,payload};
}
async function handler(event,context,legacyHandler){
 let req;
 try{req=parseEvent(event)}catch{return result(400,{error:'Invalid event'})}
 const allowed=process.env.ALLOWED_ORIGIN||'https://chenguanxi-655.github.io';
 const origin=req.headers.origin||'';
 if(origin&&origin!==allowed)return result(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return {statusCode:204,headers:{'Access-Control-Allow-Origin':origin===allowed?origin:'','Access-Control-Allow-Headers':'Content-Type, X-Admin-Code','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin'},body:''};
 if(!req.path.startsWith('/api/admin/')){
  if(typeof legacyHandler==='function')return legacyHandler(event,context);
  return result(404,{error:'This adapter handles admin endpoints only'},origin);
 }
 const secret=process.env.ADMIN_ACCESS_CODE||'';
 if(!secret||req.headers['x-admin-code']!==secret)return result(401,{error:'Administrator authentication required'},origin);
 let input=null;
 if(req.method==='POST'){
  if(typeof req.payload!=='string'||Buffer.byteLength(req.payload)>16384)return result(413,{error:'Invalid request size'},origin);
  try{input=JSON.parse(req.payload)}catch{return result(400,{error:'Invalid JSON'},origin)}
 }
 if(req.path==='/api/admin/overview'&&req.method==='GET')return result(200,{metrics:{requests:events.length,success:events.filter(x=>x.status==='succeeded').length,failed:events.filter(x=>x.status==='failed').length,costCny:null},notice:'FC instance-local only. Not an accurate cross-instance billing report.'},origin);
 if(req.path==='/api/admin/models'&&req.method==='GET')return result(200,{items:models.map(({env,...m})=>({...m,configured:env?Boolean(process.env[env]):false}))},origin);
 if(req.path==='/api/admin/events'&&req.method==='GET')return result(200,{items:events},origin);
 if(req.path==='/api/admin/virtual-models'&&req.method==='GET')return result(200,{items:[...virtualModels.values()]},origin);
 if(req.path==='/api/admin/virtual-models'&&req.method==='POST'){
  if(!input||typeof input.name!=='string'||input.name.trim().length<2||input.name.length>80)return result(400,{error:'Invalid name'},origin);
  if(!models.some(m=>m.id===input.baseModelId))return result(400,{error:'Unknown base model'},origin);
  const prompt=String(input.systemPrompt||'');
  if(prompt.length>2000)return result(400,{error:'System prompt too long'},origin);
  const item={id:randomUUID(),name:input.name.trim(),baseModelId:input.baseModelId,systemPrompt:prompt,enabled:false,createdAt:new Date().toISOString()};
  virtualModels.set(item.id,item);
  return result(201,{item,note:'Instance memory only; no persistent storage or execution routing'},origin);
 }
 return result(404,{error:'Unknown admin endpoint'},origin);
}
module.exports={handler};
