import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInequality, clipSegment } from '../src/inequality-math.js';
import { initialInequalities } from '../src/inequalities.js';
import { buildScene, initialTable } from '../src/project.js';
import { toSVG, toTypst } from '../src/drawing.js';
const options={xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',title:'',showGrid:true};
const project=(rows=initialInequalities(),reverse=false)=>({version:1,mode:'inequalities',inequalities:rows,reverse,options});
const row=formula=>({formula,color:'#2755df',enabled:true});
test('affine parsing handles implicit multiplication, both sides, fractions and unicode relations',()=>{
 for(const input of ['2x + y <= 4','2*(x+y)-y ≤ 4','x + y/2 <= 2','4 >= 2x + y']){
  const p=parseInequality(input);assert.ok(Math.abs(p.a*1+p.b*2-p.c)<1e-12);assert.ok(p.a*0+p.b*0<p.c);assert.equal(p.strict,false);
 }
 assert.equal(parseInequality('y > -2x + 4').strict,true);
 const p=parseInequality('−x ≥ 1');assert.ok(p.a*(-2)<=p.c);assert.ok(p.a*2>p.c);
});
test('reject nonlinear, variable denominator, unsafe syntax, chained comparisons and constants',()=>{
 for(const s of ['x*y < 1','x^2+y<2','1/x+y>2','sin(x)<y','z+x<1','x=2','0<x<1','x<2; y<3','x/0<y','x-x+y-y<2','[x,y]<1','x.a<2'])assert.throws(()=>parseInequality(s),s);
});
test('segment clipping handles empty, parallel and corner intersections',()=>{
 assert.deepEqual(clipSegment([-2,0],[2,0],[{a:1,b:0,c:1}]),[[-2,0],[1,0]]);
 assert.equal(clipSegment([2,-2],[2,2],[{a:1,b:0,c:1}]),null);
 assert.equal(clipSegment([-2,0],[2,0],[{a:1,b:0,c:0},{a:-1,b:0,c:-1}]),null);
});
test('every hatch midpoint lies in an excluded half-plane normally or the shared region in reverse',()=>{
 for(const reverse of [false,true]){
  const s=buildScene(project(undefined,reverse)),planes=initialInequalities().map(r=>parseInequality(r.formula));
  const hatches=s.items.filter(p=>p.type==='line'&&p.width===.9);assert.ok(hatches.length>5);
  for(const h of hatches){
   const px=(h.x1+h.x2)/2,py=(h.y1+h.y2)/2;
   const x=options.xmin+(px-s.plot.left)/s.plot.unit,y=options.ymax-(py-s.plot.top)/s.plot.unit;
   const inside=planes.every(p=>p.a*x+p.b*y<=p.c+1e-8);
   assert.equal(inside,reverse);
   for(const [x,y] of [[h.x1,h.y1],[h.x2,h.y2]]){assert.ok(x>=s.plot.left-1e-8&&x<=s.plot.left+s.plot.width+1e-8);assert.ok(y>=s.plot.top-1e-8&&y<=s.plot.top+s.plot.height+1e-8);}
  }
 }
});
test('strict boundaries, disabled rows and export roundtrip',()=>{
 const p=project([row('x < 1'),{...row('invalid'),enabled:false}]);const s=buildScene(JSON.parse(JSON.stringify(p)));
 assert.equal(s.inequalityCount,1);assert.ok(s.items.some(i=>i.width===2&&i.dash));assert.match(toSVG(s),/stroke-dasharray/);assert.match(toTypst(s),/dash: "dashed"/);assert.match(toTypst(s),/\$x < 1\$/);
 assert.throws(()=>buildScene(project(Array(9).fill(row('x<1')))));
});
test('empty intersection, no active constraints and offscreen boundary are rendered correctly',()=>{
 assert.equal(buildScene(project([row('x<=0'),row('x>=1')],true)).items.filter(i=>i.width===.9).length,0);
 assert.equal(buildScene(project([{...row('x<1'),enabled:false}])).items.filter(i=>i.width===.9).length,0);
 assert.ok(buildScene(project([{...row('x<1'),enabled:false}],true)).items.some(i=>i.width===.9));
 assert.equal(buildScene(project([row('x<100')])).items.filter(i=>i.width===.9).length,0);
 assert.ok(buildScene(project([row('x>100')])).items.some(i=>i.width===.9));
});
test('both table modes omit empty titles in SVG and Typst while retaining custom titles',()=>{
 for(const mode of ['variation','custom'])for(const title of ['', '   ', 'Khảo sát hàm số']){
  const s=buildScene({version:1,mode,table:initialTable(),options:{...options,title}});
  assert.equal(s.items.some(i=>i.type==='text'&&i.y===30),Boolean(title.trim()));
  assert.equal(toTypst(s).includes('#at(450, 30,'),Boolean(title.trim()));
  assert.ok(!toSVG(s).includes('Bảng biến thiên'));
 }
});
