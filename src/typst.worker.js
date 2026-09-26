import { createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { loadFonts } from '@myriaddreamin/typst.ts/options.init';
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/wasm?url';

let ready;
async function getCompiler(fontUrl){
  if(!ready)ready=(async()=>{
    const compiler=createTypstCompiler();
    await compiler.init({getModule:()=>compilerWasm,beforeBuild:[loadFonts([fontUrl],{assets:false})]});
    return compiler;
  })().catch(error=>{ready=null;throw error;});
  return ready;
}
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.then(async()=>{
  const {id,source,fontUrl}=data;
  try{
    if(typeof source!=='string'||source.length>500000)throw new Error('Mã Typst quá lớn.');
    self.postMessage({id,status:'loading'});
    const compiler=await getCompiler(fontUrl);
    self.postMessage({id,status:'compiling'});
    compiler.addSource('/figure.typ',source);
    const output=await compiler.runWithWorld({mainFilePath:'/figure.typ'},world=>world.pdf({diagnostics:'full'}));
    if(!output.result?.length)throw new Error(output.diagnostics?.map(d=>typeof d==='string'?d:d.message).join('\n')||'Typst chưa tạo được PDF.');
    const bytes=new Uint8Array(output.result);
    self.postMessage({id,status:'done',bytes},[bytes.buffer]);
  }catch(error){self.postMessage({id,status:'error',error:error.message||String(error)});}
});};
