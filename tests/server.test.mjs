import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

test('broker blocks cross-origin dispatch and keeps tokens out of configuration',async()=>{
 process.env.GITHUB_REPOSITORY='teacher/math';process.env.GITHUB_TOKEN='test-secret-not-for-client';process.env.PUBLIC_ORIGIN='https://studio.example';
 const {server}=await import('../server/index.mjs');server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const config=await (await fetch(base+'/api/config')).json();assert.deepEqual(config,{broker:true});assert.ok(!JSON.stringify(config).includes('test-secret'));
  const response=await fetch(base+'/api/jobs',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(response.status,403);
  const missing=await fetch(base+'/api/jobs/11111111-1111-1111-1111-111111111111');assert.equal(missing.status,404);
  const traversal=await fetch(base+'/%2e%2e%2fpackage.json');assert.equal(traversal.status,404);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
