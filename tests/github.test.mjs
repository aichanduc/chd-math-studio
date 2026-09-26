import test from 'node:test';
import assert from 'node:assert/strict';
import {GitHubCompiler,BrokerCompiler} from '../src/github.js';
test('GitHub dispatch sends structured JSON and matches a unique run',async()=>{
 const old=globalThis.fetch,calls=[];
 try{globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:204};};
 const client=new GitHubCompiler({repo:'teacher/math',branch:'main',token:'test-token'});
 const project={formula:'x^2; $(not-a-shell)',version:1};const id=await client.dispatch(project);
 const body=JSON.parse(calls[0].options.body);assert.equal(body.inputs.job_id,id);assert.deepEqual(JSON.parse(body.inputs.project),project);
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({workflow_runs:[{id:1,display_title:'Compile someone-else'},{id:2,display_title:`Compile ${id}`,status:'completed',conclusion:'success',html_url:'https://github.com/teacher/math/actions/runs/2'}]})});
 assert.equal((await client.status(id)).id,2);
 }finally{globalThis.fetch=old;}
});
test('GitHub failures remain failures',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async()=>({ok:false,status:403,json:async()=>({message:'Resource not accessible'})});const c=new GitHubCompiler({repo:'a/b',token:'t'});await assert.rejects(c.dispatch({}),/403/);}finally{globalThis.fetch=old;}});
test('repository validation and no empty token',()=>{assert.throws(()=>new GitHubCompiler({repo:'https://github.com/a/b',token:'t'}));assert.throws(()=>new GitHubCompiler({repo:'a/b',token:''}));});
test('broker uses same-origin API and propagates quota errors',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async(url)=>{assert.equal(url,'/api/jobs');return {ok:false,json:async()=>({error:'Quota exceeded'})};};await assert.rejects(new BrokerCompiler().dispatch({}),/Quota exceeded/);}finally{globalThis.fetch=old;}});
