// Optional public compiler broker. Tokens stay on the server, never in Vite or the client.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { buildScene } from '../src/project.js';

const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';
const origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN,branch=process.env.GITHUB_REF||'main';
const configured=!!(repo&&token&&/^[\w.-]+\/[\w.-]+$/.test(repo));
const jobs=new Map(),rates=new Map();let hourly={count:0,at:Date.now()};
const headers={'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
const error=(message,status=400)=>Object.assign(new Error(message),{status});
async function api(path,options={}){
 const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{...options,headers,signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw error(`GitHub trả về ${r.status}. Kiểm tra quyền Actions và workflow trên máy chủ.`,502);
 return r.status===204?null:r.json();
}
function quota(ip){
 const now=Date.now();if(now-hourly.at>3600000)hourly={count:0,at:now};
 if(rates.size>10000)throw error('Máy chủ đang bận.',429);
 const item=rates.get(ip)||{count:0,at:now};if(now-item.at>3600000){item.count=0;item.at=now;}
 if(item.count>=Number(process.env.COMPILES_PER_IP_HOUR||5)||hourly.count>=Number(process.env.COMPILES_PER_HOUR||30))throw error('Đã đạt hạn mức biên dịch trong giờ này. Vui lòng thử lại sau.',429);
 item.count++;hourly.count++;rates.set(ip,item);
}
async function body(req){let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>45000)throw error('Dự án quá 45 KB.',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks));}catch{throw error('JSON không hợp lệ.');}}
async function status(id,job){
 if(job.cached&&Date.now()-job.checked<5000)return job.cached;
 const data=await api('/actions/workflows/compile.yml/runs?event=workflow_dispatch&per_page=100');
 const run=data.workflow_runs.find(r=>r.display_title===`Compile ${id}`);
 const result=run?{status:run.status,conclusion:run.conclusion,id:run.id}:{status:'queued'};
 if(run?.conclusion==='success')result.url=`/api/jobs/${id}/artifact`;
 job.cached=result;job.checked=Date.now();return result;
}
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.github.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
 function json(data,code=200){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 try{
  const url=new URL(req.url,origin);
  if(url.pathname==='/api/config'&&req.method==='GET'){json({broker:configured});return;}
  if(url.pathname.startsWith('/api/')){
   if(!configured)throw error('Máy chủ chưa kết nối GitHub.',503);
   if(req.method==='POST'&&url.pathname==='/api/jobs'){
    if(req.headers.origin!==origin)throw error('Origin không hợp lệ.',403);
    if(!req.headers['content-type']?.startsWith('application/json'))throw error('Cần Content-Type application/json.',415);
    // Ignore forwarded IP headers unless a trusted reverse proxy is explicitly configured.
    const ip=process.env.TRUST_PROXY==='1'?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
    quota(ip);const project=await body(req);buildScene(project);const id=randomUUID();
    await api('/actions/workflows/compile.yml/dispatches',{method:'POST',body:JSON.stringify({ref:branch,inputs:{job_id:id,project:JSON.stringify(project)}})});
    jobs.set(id,{created:Date.now()});json({id},202);return;
   }
   const match=url.pathname.match(/^\/api\/jobs\/([a-f0-9-]{36})(\/artifact)?$/);
   if(!match||req.method!=='GET')throw error('Không tìm thấy.',404);
   const [,id,artifact]=match,job=jobs.get(id);if(!job)throw error('Tác vụ không tồn tại hoặc đã hết hạn. Tác vụ được giữ trong 1 giờ.',404);
   const result=await status(id,job);
   if(!artifact){json(result);return;}
   if(result.conclusion!=='success')throw error('Tác vụ chưa hoàn thành.',409);
   const list=await api(`/actions/runs/${result.id}/artifacts`),file=list.artifacts.find(a=>a.name===`figure-${id}`&&!a.expired);
   if(!file)throw error('Chưa tìm thấy tệp kết quả.',404);
   const redirect=await fetch(`https://api.github.com/repos/${repo}/actions/artifacts/${file.id}/zip`,{headers,redirect:'manual',signal:AbortSignal.timeout(25000)});
   const location=redirect.headers.get('location');if(redirect.status!==302||!location||!location.startsWith('https://'))throw error('Không lấy được tệp từ GitHub.',502);
   // Do not forward GitHub Authorization to the signed storage URL.
   const zip=await fetch(location,{signal:AbortSignal.timeout(30000)});if(!zip.ok)throw error('Không tải được kết quả.',502);
   const bytes=Buffer.from(await zip.arrayBuffer());if(bytes.length>30*1024*1024)throw error('Tệp kết quả quá lớn.',413);
   res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="figure-${id}.zip"`,'Cache-Control':'no-store'});res.end(bytes);return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD')throw error('Method not allowed.',405);
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep))throw error('Không tìm thấy.',404);
  const data=await readFile(path).catch(()=>{throw error('Không tìm thấy tệp. Chạy npm run build trước.',404);});
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.wasm':'application/wasm','.otf':'font/otf'};
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);
 }catch(err){json({error:err.status?err.message:'Dữ liệu không hợp lệ hoặc dịch vụ đang bận.'},err.status||400);}
});
setInterval(()=>{const now=Date.now();for(const [id,job]of jobs)if(now-job.created>3600000)jobs.delete(id);for(const [ip,item]of rates)if(now-item.at>3600000)rates.delete(ip);},60000).unref();
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(port,host,()=>console.log(`Do Thi Studio: http://${host}:${port} — broker ${configured?'enabled':'not configured'}`));
