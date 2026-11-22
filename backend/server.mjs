// Nebula AI API gateway (Node.js 20+, no dependencies).
// Run: ZHIPU_API_KEY=... STUDIO_ACCESS_CODE=... node backend/server.mjs
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 9000);
const KEY = process.env.ZHIPU_API_KEY || '';
const ACCESS = process.env.STUDIO_ACCESS_CODE || '';
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://chenguanxi-655.github.io';
const MAX_DAILY = Math.max(1, Number(process.env.DAILY_LIMIT || 40));
const MAX_BODY = 16 * 1024;
const tasks = new Map(); // temporary development storage; replace with persistent DB
const counts = new Map(); // development-only in-memory quota
const templates = Object.freeze([
  {id:'poster',title:'AI 创意海报',type:'image',status:'available',provider:'zhipu',model:'cogview-3-flash',credits:null},
  {id:'portrait',title:'AI 写真灵感',type:'image',status:'available',provider:'zhipu',model:'cogview-3-flash',credits:null},
  {id:'video-trend',title:'热门图生视频',type:'video',status:'coming_soon',provider:null,model:null,credits:null}
]);
function send(res,status,data,origin=''){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':origin===ORIGIN?ORIGIN:'','Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, X-Studio-Code','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});
  res.end(JSON.stringify(data));
}
async function body(req){
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Error('Request too large');chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Error('Invalid JSON')}
}
function authorized(req){return ACCESS && req.headers['x-studio-code']===ACCESS}
function rateKey(req){return String(req.socket.remoteAddress||'unknown')+':'+new Date().toISOString().slice(0,10)}
async function createImage(prompt){
  if(!KEY)throw Error('Image provider is not configured');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  try{
    const response=await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations',{
      method:'POST',headers:{Authorization:'Bearer '+KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:'cogview-3-flash',prompt}),signal:controller.signal
    });
    const data=await response.json();
    if(!response.ok)throw Error('Provider request failed: '+response.status);
    const url=data?.data?.[0]?.url;
    if(typeof url!=='string'||!url.startsWith('https://'))throw Error('Provider returned no image URL');
    return url;
  }finally{clearTimeout(timer)}
}
createServer(async(req,res)=>{
  const origin=String(req.headers.origin||'');
  const path=new URL(req.url||'/', 'http://localhost').pathname;
  const reply=(status,data)=>send(res,status,data,origin);
  if(req.method==='OPTIONS'){return reply(origin===ORIGIN?204:403,{})}
  if(origin && origin!==ORIGIN)return reply(403,{error:'Origin not allowed'});
  if(path==='/health'&&req.method==='GET')return reply(200,{ok:true,service:'nebula-ai-gateway',imageConfigured:Boolean(KEY),authConfigured:Boolean(ACCESS)});
  if(path==='/api/v1/templates'&&req.method==='GET')return reply(200,{items:templates});
  if(!authorized(req))return reply(401,{error:'Unauthorized'});
  if(path==='/api/v1/tasks'&&req.method==='POST'){
    let input;try{input=await body(req)}catch(e){return reply(400,{error:e.message})}
    const template=templates.find(t=>t.id===input.templateId);
    if(!template)return reply(404,{error:'Unknown template'});
    if(template.status!=='available')return reply(409,{error:'Template not yet available'});
    const prompt=typeof input.prompt==='string'?input.prompt.trim():'';
    if(!prompt||prompt.length>1000)return reply(400,{error:'Prompt must be 1-1000 characters'});
    const k=rateKey(req),used=counts.get(k)||0;
    if(used>=MAX_DAILY)return reply(429,{error:'Daily quota reached'});
    counts.set(k,used+1);
    const id=randomUUID(),task={id,templateId:template.id,status:'processing',createdAt:new Date().toISOString()};
    tasks.set(id,task);
    // Run async; client polls task endpoint. No automatic retries to avoid surprise spend.
    void createImage(prompt).then(url=>{task.status='succeeded';task.outputUrl=url}).catch(()=>{task.status='failed';task.error='Image generation failed'}); 
    return reply(202,{task});
  }
  const match=path.match(/^\/api\/v1\/tasks\/([a-f0-9-]{36})$/);
  if(match&&req.method==='GET'){const task=tasks.get(match[1]);return task?reply(200,{task}):reply(404,{error:'Task not found'})}
  return reply(404,{error:'Not found'});
}).listen(PORT,'0.0.0.0',()=>console.log('Nebula gateway listening on '+PORT));
