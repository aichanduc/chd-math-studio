const API='https://api.github.com';
export class BrokerCompiler {
  async request(path,options={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Không thể kết nối dịch vụ biên dịch.');return data;}
  async dispatch(project){return (await this.request('/api/jobs',{method:'POST',body:JSON.stringify(project)})).id;}
  status(id){return this.request(`/api/jobs/${id}`);}
}
export class GitHubCompiler {
  constructor({repo,branch='main',token}){
    if(!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo))throw new Error('Repository có dạng ten-tai-khoan/ten-du-an.');
    if(!token)throw new Error('Nhập token có quyền Actions: read and write.');
    this.repo=repo;this.branch=branch;this.token=token;
  }
  async api(path,options={}){
    const r=await fetch(`${API}/repos/${this.repo}${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${this.token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(25000)});
    if(!r.ok){let m='';try{m=(await r.json()).message||'';}catch{}throw new Error(`GitHub ${r.status}: ${m||'Không thể kết nối.'}`);}
    return r.status===204?null:r.json();
  }
  async dispatch(project){
    const id=crypto.randomUUID(),payload=JSON.stringify(project);
    if(new TextEncoder().encode(payload).length>45000)throw new Error('Dự án vượt giới hạn 45 KB của yêu cầu biên dịch.');
    await this.api('/actions/workflows/compile.yml/dispatches',{method:'POST',body:JSON.stringify({ref:this.branch,inputs:{job_id:id,project:payload}})});
    return id;
  }
  async status(id){
    const data=await this.api('/actions/workflows/compile.yml/runs?event=workflow_dispatch&per_page=50');
    const run=data.workflow_runs.find(r=>r.display_title===`Compile ${id}`);
    if(!run)return {status:'queued'};
    return {status:run.status,conclusion:run.conclusion,url:run.html_url,id:run.id};
  }
}
