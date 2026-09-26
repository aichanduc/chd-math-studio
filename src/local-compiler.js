let worker,pending=new Map(),serial=0;
function reset(message){worker?.terminate();worker=null;for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error(message));}pending.clear();}
export function compilePDF(source,onStatus=()=>{}){
  if(!worker){
    worker=new Worker(new URL('./typst.worker.js',import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;if(data.status==='done'||data.status==='error'){clearTimeout(p.timer);pending.delete(data.id);data.status==='done'?p.resolve(data.bytes):p.reject(new Error(data.error));}else p.onStatus(data.status);};
    worker.onerror=()=>reset('Không tải được bộ biên dịch Typst. Kiểm tra mạng rồi thử lại.');
  }
  const id=++serial;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reset('Biên dịch quá 90 giây. Vui lòng giảm độ phức tạp và thử lại.'),90000);
    pending.set(id,{resolve,reject,timer,onStatus});
    worker.postMessage({id,source,fontUrl:new URL(import.meta.env.BASE_URL+'fonts/LibertinusSerif-Regular.otf',location.href).href});
  });
}
