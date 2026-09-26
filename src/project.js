import { expression, autoVariation, validateTable } from './math.js';
import { graph, variation, tree, illustration } from './drawing.js';

export const initialTable=()=>({points:[{x:'−∞',y:'−∞',mark:''},{x:'−1',y:'3',mark:'0'},{x:'1',y:'−1',mark:'0'},{x:'+∞',y:'+∞',mark:''}],signs:['+','−','+']});
export const initialTree='Phép thử\n  A | 0.6\n    B | 0.7\n    B̄ | 0.3\n  Ā | 0.4\n    B | 0.2\n    B̄ | 0.8';
export function buildScene(p){
  if(!p||p.version!==1||!['graph','variation','tree','illustration'].includes(p.mode))throw new Error('Dự án không đúng định dạng phiên bản 1.');
  if(p.table!==undefined)validateTable(p.table);
  if(p.formula!==undefined&&typeof p.formula!=='string')throw new Error('Công thức phải là chuỗi ký tự.');
  const o=p.options||{};
  if(!/^#[0-9a-f]{6}$/i.test(o.color||''))throw new Error('Màu không hợp lệ.');
  if(typeof o.title!=='string'||o.title.length>100)throw new Error('Tiêu đề tối đa 100 ký tự.');
  if(p.mode==='tree'){if(typeof p.tree!=='string'||p.tree.length>4000)throw new Error('Nội dung sơ đồ quá dài.');return tree(p.tree,o);}
  if(p.mode==='illustration')return illustration(validateTable(p.table),o);
  if(p.mode==='variation')return variation(validateTable(p.table),o);
  const ex=expression(p.formula);return graph(ex,autoVariation(ex),o);
}
