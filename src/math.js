import { parse, derivative } from 'mathjs/number';

const allowed = new Set(['sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'abs', 'asin', 'acos', 'atan']);
export const fmt = n => !Number.isFinite(n) ? (n < 0 ? '−∞' : '+∞') : Math.abs(n) < 1e-10 ? '0' : String(Number(n.toPrecision(7)));
export const rightValue = p => (p.split??(p.mark==='||')) ? (p.right??p.y) : p.y;
export function expression(input, differentiate=true) {
  const source = String(input).trim().replace(/^y\s*=\s*/i, '').replace(/²/g, '^2').replace(/³/g, '^3').replace(/−/g, '-').replace(/π/g, 'pi').replace(/\bln\s*\(/g, 'log(');
  if (!source || source.length > 240) throw new Error('Nhập công thức từ 1 đến 240 ký tự.');
  let ast;
  try { ast = parse(source); } catch { throw new Error('Công thức chưa hợp lệ. Ví dụ: x^3 - 3*x + 1.'); }
  let count = 0;
  ast.traverse(n => {
    if (++count > 100) throw new Error('Công thức quá phức tạp.');
    if (n.isSymbolNode && !['x', 'e', 'pi', ...allowed].includes(n.name)) throw new Error(`Không hỗ trợ ký hiệu “${n.name}”. Chỉ dùng biến x.`);
    if (n.isOperatorNode && !['+', '-', '*', '/', '^'].includes(n.op)) throw new Error('Chỉ hỗ trợ +, −, *, / và ^.');
    if (n.isFunctionNode && (!allowed.has(n.fn.name) || n.args.length !== 1)) throw new Error('Hàm chưa hỗ trợ hoặc sai số đối số.');
    if (!['ConstantNode','SymbolNode','OperatorNode','FunctionNode','ParenthesisNode'].includes(n.type)) throw new Error('Không hỗ trợ phép gán, truy cập thuộc tính hoặc danh sách.');
    if (n.isConstantNode && (typeof n.value !== 'number' || !Number.isFinite(n.value))) throw new Error('Hằng số không hợp lệ.');
  });
  const compiled = ast.compile();
  const evaluate = x => { try { const v = compiled.evaluate({x}); return typeof v === 'number' && Number.isFinite(v) ? v : NaN; } catch { return NaN; } };
  let diff = 'Chưa hỗ trợ đạo hàm';
  if(differentiate)try { diff = derivative(ast, 'x').toString(); } catch { /* plot remains available */ }
  return {source, ast, evaluate, diff};
}
const trim = a => { while (a.length > 1 && a.at(-1) === 0) a.pop(); return a; };
const add = (a,b,s=1) => trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+s*(b[i]||0)));
const mul = (a,b) => { const out=Array(a.length+b.length-1).fill(0); a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]+=v*w)); return trim(out); };
const value = (p,x) => p.reduceRight((s,c)=>s*x+c,0);
const diffPoly = p => p.length===1?[0]:p.slice(1).map((v,i)=>v*(i+1));
function polynomial(n) {
  if(n.isParenthesisNode) return polynomial(n.content);
  if(n.isConstantNode) return [n.value];
  if(n.isSymbolNode) return n.name==='x'?[0,1]:n.name==='pi'?[Math.PI]:n.name==='e'?[Math.E]:null;
  if(!n.isOperatorNode) return null;
  const a=polynomial(n.args[0]), b=n.args[1]&&polynomial(n.args[1]);
  if(!a || (n.args.length===2&&!b)) return null;
  let out;
  if(n.op==='+') out=b?add(a,b):a;
  if(n.op==='-') out=b?add(a,b,-1):a.map(v=>-v);
  if(n.op==='*') out=mul(a,b);
  if(n.op==='/'&&b?.length===1&&b[0]!==0) out=a.map(v=>v/b[0]);
  if(n.op==='^'&&b?.length===1&&Number.isInteger(b[0])&&b[0]>=0&&b[0]<=4) {out=[1];for(let i=0;i<b[0];i++)out=mul(out,a);}
  return out&&out.length<=5&&out.every(Number.isFinite)?trim(out):null;
}
// All real roots up to cubic: derivative partition + bounded bisection handles repeated roots.
export function roots(p) {
  p=trim([...p]); if(p.length<2)return [];
  if(p.length===2)return [-p[0]/p[1]];
  const bound=1+Math.max(...p.slice(0,-1).map(c=>Math.abs(c/p.at(-1))));
  const turning=roots(diffPoly(p)).filter(x=>x>-bound&&x<bound);
  const stops=[-bound,...turning,bound], out=[];
  const scale=x=>p.reduce((s,c,i)=>s+Math.abs(c)*Math.abs(x)**i,0);
  for(const x of turning) if(Math.abs(value(p,x))<=1e-12*Math.max(1,scale(x)))out.push(x);
  for(let i=0;i<stops.length-1;i++) {
    let a=stops[i],b=stops[i+1],fa=value(p,a),fb=value(p,b);
    if(fa*fb>=0)continue;
    for(let j=0;j<100;j++){const c=(a+b)/2,fc=value(p,c);if(fc===0){a=b=c;break;}if(Math.sign(fc)===Math.sign(fa)){a=c;fa=fc;}else b=c;}
    out.push((a+b)/2);
  }
  return out.sort((a,b)=>a-b).filter((x,i,a)=>!i||Math.abs(x-a[i-1])>1e-7*Math.max(1,Math.abs(x)));
}
export function autoVariation(ex) {
  const p=polynomial(ex.ast);
  if(p){
    const dp=diffPoly(p), xs=roots(dp), degree=p.length-1, lead=p.at(-1);
    const limit=side=>degree===0?fmt(p[0]):fmt(Math.sign(lead)*(side<0&&degree%2?-1:1)*Infinity);
    const points=[{x:'−∞',y:limit(-1),mark:''},...xs.map(x=>({x:fmt(x),y:fmt(ex.evaluate(x)),mark:'0'})),{x:'+∞',y:limit(1),mark:''}];
    const boundaries=[-Infinity,...xs,Infinity];
    const signs=boundaries.slice(0,-1).map((a,i)=>{const b=boundaries[i+1];const x=!Number.isFinite(a)?(!Number.isFinite(b)?0:b-Math.max(1,Math.abs(b))):!Number.isFinite(b)?a+Math.max(1,Math.abs(a)):(a+b)/2;const v=value(dp,x);return v===0?'0':v>0?'+':'−';});
    return {points,signs,kind:`Đa thức bậc ${degree}`,domain:'ℝ',poles:[],note:'Các mốc hữu hạn được làm tròn đến 7 chữ số có nghĩa.'};
  }
  let n=ex.ast;while(n.isParenthesisNode)n=n.content;
  if(n.isOperatorNode&&n.op==='/'){
    const a=polynomial(n.args[0]),b=polynomial(n.args[1]);
    if(a&&b&&a.length<=2&&b.length===2&&b[1]!==0){
      const pole=-b[0]/b[1],det=(a[1]||0)*b[0]-a[0]*b[1],lim=(a[1]||0)/b[1],res=value(a,pole)/b[1];
      const sign=det===0?'0':det>0?'+':'−';
      return {points:[{x:'−∞',y:fmt(lim),mark:''},{x:fmt(pole),y:det===0?fmt(lim):fmt(-Math.sign(res)*Infinity),right:det===0?fmt(lim):fmt(Math.sign(res)*Infinity),mark:'||'},{x:'+∞',y:fmt(lim),mark:''}],signs:[sign,sign],kind:'Phân thức bậc nhất / bậc nhất',domain:`ℝ ∖ {${fmt(pole)}}`,poles:det===0?[]:[pole],holes:det===0?[{x:pole,y:lim}]:[],note:det===0?'Điểm khuyết vẫn bị loại khỏi tập xác định.':'Hai giới hạn một phía được giữ riêng tại tiệm cận đứng.'};
    }
  }
  const compact=ex.source.replace(/\s/g,'');
  if(['exp(x)','e^x','log(x)','sqrt(x)'].includes(compact)){
    const isExp=['exp(x)','e^x'].includes(compact),isLog=compact==='log(x)';
    return {points:[{x:isExp?'−∞':'0',y:isLog?'−∞':'0',mark:isExp?'':'||',split:isLog},{x:'+∞',y:'+∞',mark:''}],signs:['+'],kind:isExp?'Hàm mũ':isLog?'Hàm logarit':'Hàm căn bậc hai',domain:isExp?'ℝ':isLog?'(0; +∞)':'[0; +∞)',poles:isLog?[0]:[],note:'Phân tích toàn bộ tập xác định của dạng hàm cơ bản.'};
  }
  return null;
}
export function numericLabel(s) {
  const t=String(s).trim().replace(/−/g,'-');
  if(/^\+?(∞|infinity|inf)$/i.test(t))return Infinity;
  if(/^-(∞|infinity|inf)$/i.test(t))return -Infinity;
  try {const ex=expression(t,false);let variable=false;ex.ast.traverse(n=>{if(n.isSymbolNode&&n.name==='x')variable=true;});if(variable)return NaN;return ex.evaluate(0);}catch{return NaN;}
}
export function validateTable(t) {
  if(!t||!Array.isArray(t.points)||t.points.length<2||t.points.length>10||!Array.isArray(t.signs)||t.signs.length!==t.points.length-1)throw new Error('Bảng cần 2–10 mốc và một dấu cho mỗi khoảng.');
  t.points.forEach(p=>{for(const k of ['x','y'])if(typeof p[k]!=='string'||p[k].length>40)throw new Error('Nhãn của mỗi ô tối đa 40 ký tự.');if(p.right!==undefined&&(typeof p.right!=='string'||p.right.length>40))throw new Error('Giới hạn phải không hợp lệ.');if(!['','0','||'].includes(p.mark))throw new Error('Ký hiệu tại mốc không hợp lệ.');});
  if(t.signs.some(s=>!['+','−','0','||'].includes(s)))throw new Error('Dấu trên khoảng không hợp lệ.');
  if(t.points.some(p=>p.split!==undefined&&typeof p.split!=='boolean'))throw new Error('Trạng thái ngắt dòng y không hợp lệ.');
  return t;
}
export function tableWarnings(t) {
  const warnings=[];
  const xs=t.points.map(p=>numericLabel(p.x));
  if(xs.some(Number.isNaN))warnings.push('Có mốc x dạng ký hiệu: chưa thể dựng đường cong minh họa.');
  else if(xs.some((x,i)=>i&&x<=xs[i-1]))warnings.push('Các mốc x cần tăng nghiêm ngặt từ trái sang phải.');
  t.signs.forEach((s,i)=>{const a=numericLabel(rightValue(t.points[i])),b=numericLabel(t.points[i+1].y);if(!Number.isNaN(a)&&!Number.isNaN(b)&&((s==='+'&&a>=b)||(s==='−'&&a<=b)||(s==='0'&&a!==b)))warnings.push(`Khoảng ${i+1}: dấu y′ chưa khớp với hai giá trị y.`);});
  return warnings;
}
