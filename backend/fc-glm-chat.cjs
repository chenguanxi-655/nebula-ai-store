// Isolated GLM chat handler for staging FC integration. Never expose ZHIPU_API_KEY to browsers.
// Call handleChat(event) from the deployed FC entrypoint after its CORS/preflight handling.
const MAX_BYTES=8192;
async function handleChat(event){
 const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),String(v)]));
 const origin=headers.origin||'';
 const allowed=process.env.ALLOWED_ORIGIN||process.env.aLLOWED_ORIGIN||'https://chenguanxi-655.github.io';
 const cors={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':origin===allowed?allowed:'','Access-Control-Allow-Headers':'Content-Type, X-Studio-Code','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const out=(statusCode,data)=>({statusCode,headers:cors,body:JSON.stringify(data)});
 if(origin&&origin!==allowed)return out(403,{error:'Origin not allowed'});
 const method=(event.httpMethod||event.requestContext?.http?.method||'GET').toUpperCase();
 if(method==='OPTIONS')return {statusCode:204,headers:cors,body:''};
 if(method!=='POST')return out(405,{error:'Method not allowed'});
 const access=process.env.STUDIO_ACCESS_CODE||process.env.sTUDIO_ACCESS_CODE||'';
 if(!access||headers['x-studio-code']!==access)return out(401,{error:'Studio authorization required'});
 const apiKey=process.env.ZHIPU_API_KEY||process.env.zHIPU_API_KEY||'';
 if(!apiKey)return out(503,{error:'Zhipu provider not configured'});
 let raw=event.body||'';
 if(event.isBase64Encoded)raw=Buffer.from(raw,'base64').toString('utf8');
 if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX_BYTES)return out(413,{error:'Request too large'});
 let data;try{data=JSON.parse(raw)}catch{return out(400,{error:'Invalid JSON'})}
 const prompt=typeof data.prompt==='string'?data.prompt.trim():'';
 if(!prompt||prompt.length>2000)return out(400,{error:'Prompt must be 1-2000 characters'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:'glm-4-flash-250414',messages:[{role:'user',content:prompt}],stream:false,max_tokens:512}),signal:controller.signal});
  if(!response.ok)return out(502,{error:'Model provider request failed',providerStatus:response.status});
  const json=await response.json(),answer=json?.choices?.[0]?.message?.content;
  if(typeof answer!=='string')return out(502,{error:'Invalid provider response'});
  return out(200,{answer,model:'glm-4-flash-250414'});
 }catch{return out(502,{error:'Model provider temporarily unavailable'})}finally{clearTimeout(timer)}
}
module.exports={handleChat};
