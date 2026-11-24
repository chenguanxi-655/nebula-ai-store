// Development-stage admin API: secrets never returned to clients.
// Persistence, sessions and accounting reconciliation are required before production.
const models=[
 {id:'zhipu-image',name:'CogView 3 Flash',provider:'zhipu',type:'image',status:'configured_by_env',env:'ZHIPU_API_KEY'},
 {id:'zhipu-chat',name:'GLM 4 Flash',provider:'zhipu',type:'chat',status:'configured_by_env',env:'ZHIPU_API_KEY'},
 {id:'openai-chat',name:'OpenAI',provider:'openai',type:'chat',status:'not_integrated'},
 {id:'doubao',name:'豆包',provider:'doubao',type:'chat',status:'not_integrated'},
 {id:'kling',name:'可灵',provider:'kling',type:'video',status:'not_integrated'},
 {id:'deepseek',name:'DeepSeek',provider:'deepseek',type:'chat',status:'not_integrated'}
];
const virtualModels=new Map();
const events=[];
export function recordEvent(entry){
 events.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),...entry});
 if(events.length>300)events.pop();
}
export function adminHandler(req,path,input){
 const key=process.env.ADMIN_ACCESS_CODE||'';
 // Separate administrator credential, not the customer-side access code.
 if(!key || req.headers['x-admin-code']!==key)return {status:401,data:{error:'Administrator authentication required'}};
 if(path==='/api/admin/overview'&&req.method==='GET'){
   const success=events.filter(e=>e.status==='succeeded').length;
   return {status:200,data:{metrics:{requests:events.length,success,failed:events.filter(e=>e.status==='failed').length,costCny:null},notice:'Development-only in-memory metrics. Costs unavailable until provider billing is integrated.',providers:[...new Set(models.map(m=>m.provider))].map(id=>({id,configured:id==='zhipu'&&Boolean(process.env.ZHIPU_API_KEY)}))}};
 }
 if(path==='/api/admin/models'&&req.method==='GET')return {status:200,data:{items:models.map(({env,...m})=>({...m,configured:env?Boolean(process.env[env]):false}))}};
 if(path==='/api/admin/events'&&req.method==='GET')return {status:200,data:{items:events.slice(0,100)}};
 if(path==='/api/admin/virtual-models'&&req.method==='GET')return {status:200,data:{items:[...virtualModels.values()]}};
 if(path==='/api/admin/virtual-models'&&req.method==='POST'){
   if(!input||typeof input.name!=='string'||input.name.trim().length<2||input.name.length>80)return {status:400,data:{error:'Invalid name'}};
   if(!models.some(m=>m.id===input.baseModelId))return {status:400,data:{error:'Unknown base model'}};
   const prompt=String(input.systemPrompt||'');
   if(prompt.length>2000)return {status:400,data:{error:'System prompt too long'}};
   const item={id:crypto.randomUUID(),name:input.name.trim(),baseModelId:input.baseModelId,systemPrompt:prompt,enabled:false,createdAt:new Date().toISOString()};
   virtualModels.set(item.id,item);
   return {status:201,data:{item,note:'Saved in memory only; execution routing not yet enabled'}};
 }
 return {status:404,data:{error:'Unknown admin endpoint'}};
}
