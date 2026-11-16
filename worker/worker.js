// Cloudflare Worker — private image generation beta
// Configure OPENAI_API_KEY and STUDIO_ACCESS_CODE as encrypted Worker secrets.
// Never place secrets in GitHub Pages, client JavaScript, or wrangler.toml.
const SITE = "https://chenguanxi-655.github.io";
const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":SITE,"Cache-Control":"no-store"}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":SITE,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-Studio-Code","Access-Control-Max-Age":"600"}});
  if(url.pathname!=="/generate-image"||request.method!=="POST")return json({error:"Not found"},404);
  if(request.headers.get("Origin")!==SITE)return json({error:"Origin not allowed"},403);
  if(!env.OPENAI_API_KEY||!env.STUDIO_ACCESS_CODE)return json({error:"Server secrets are not configured"},503);
  if(request.headers.get("X-Studio-Code")!==env.STUDIO_ACCESS_CODE)return json({error:"Access code incorrect"},401);
  if(Number(request.headers.get("Content-Length")||0)>6000)return json({error:"Request too large"},413);
  let body;try{body=await request.json()}catch{return json({error:"Invalid JSON"},400)}
  const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
  if(!prompt||prompt.length>1200)return json({error:"Prompt must be 1–1200 characters"},400);
  const size=["1024x1024","1024x1536","1536x1024"].includes(body.size)?body.size:"1024x1024";
  try{
   const resp=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-image-1",prompt,size,n:1,quality:"low"}),signal:AbortSignal.timeout(120000)});
   const data=await resp.json();
   if(!resp.ok)return json({error:"Image provider error",provider_status:resp.status,detail:data.error?.message||"Please check API access and billing"},502);
   const b64=data.data?.[0]?.b64_json;
   if(!b64)return json({error:"No image returned"},502);
   return json({image:"data:image/png;base64,"+b64});
  }catch(e){return json({error:"Request failed or timed out"},504)}
 }
};