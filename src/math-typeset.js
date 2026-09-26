import { expression } from './math.js';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const doc=mathjax.document('',{InputJax:new TeX({packages:['base']}),OutputJax:new SVG({fontCache:'none'})});
const cache=new Map();
function typ(n){
 if(n.isParenthesisNode)return `(${typ(n.content)})`;
 if(n.isConstantNode){const s=String(n.value),m=s.match(/^(.+)e([+-]?\d+)$/i);return m?`${m[1]} times 10^(${Number(m[2])})`:s;}
 if(n.isSymbolNode)return n.name;
 if(n.isFunctionNode){const name={log:'ln',asin:'arcsin',acos:'arccos',atan:'arctan'}[n.fn.name]||n.fn.name;return `${name}(${typ(n.args[0])})`;}
 const a=n.args.map(typ);
 if(a.length===1)return `${n.op}${a[0]}`;
 if(n.op==='/')return `frac(${a[0]}, ${a[1]})`;
 if(n.op==='^')return `${n.args[0].isSymbolNode||n.args[0].isConstantNode?a[0]:'('+a[0]+')'}^(${a[1]})`;
 return `${a[0]} ${n.op==='*'?'dot':n.op} ${a[1]}`;
}
export function mathLabel(source){
 const key=String(source);if(cache.has(key))return cache.get(key);
 let tex,code;
 try{
  const s=key.trim().replace(/−/g,'-');
  if(/^[+-]?(∞|oo|infinity)$/.test(s)){const sign=s.startsWith('-')?'-':s.startsWith('+')?'+':'';tex=sign+'\\infty';code=sign+'oo';}
  else if(s==='y′'||s==="y'"){tex="y'";code="y'";}
  else if(['x','y','+','-','0'].includes(s)){tex=s;code=s;}
  else {const eq=/^y\s*=/.test(s),ex=expression(s,false);tex=(eq?'y=':'')+ex.ast.toTex();code=(eq?'y = ':'')+typ(ex.ast);}
  const node=doc.convert(tex,{display:false}),svg=adaptor.firstChild(node),v=adaptor.getAttribute(svg,'viewBox').split(' ').map(Number);
  const result={code,body:adaptor.innerHTML(svg),viewBox:v,width:v[2]/1000,height:v[3]/1000};
  if(cache.size>500)cache.clear();cache.set(key,result);return result;
 }catch{cache.set(key,null);return null;}
}
export function typstLabel(s){const m=mathLabel(s);return m?`$${m.code}$`:`text(${JSON.stringify(String(s))})`;}
export function formulaSVG(source,size=22){const m=mathLabel(source);if(!m)return '';return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox.join(' ')}" width="${m.width*size}" height="${m.height*size}" aria-label="Công thức toán">${m.body}</svg>`;}
