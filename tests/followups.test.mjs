import test from 'node:test';
import assert from 'node:assert/strict';
import {lineIntersections,parseInequality} from '../src/inequality-math.js';
import {buildScene} from '../src/project.js';
import {illustration,toTypst,toSVG} from '../src/drawing.js';
const options={xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',title:'',showGrid:true};
test('boundary intersections deduplicate concurrent lines and skip parallel/coincident lines',()=>{
 const points=lineIntersections(['x>=0','y>=0','x+y<=0','2x>=0','x>=2'].map(parseInequality));
 assert.equal(points.length,3);assert.ok(points.some(p=>p.x===0&&p.y===0));
 assert.equal(lineIntersections(['x>=0','2x>=0','x>=1'].map(parseInequality)).length,0);
});
test('intersection option includes infeasible intersections, respects active lines and exports dots/labels',()=>{
 const p={version:1,mode:'inequalities',inequalities:['x>=0','y>=0','x+y<=-1'].map(formula=>({formula,color:'#2755df'})),options:{...options,showIntersections:true}};
 const s=buildScene(p);assert.equal(s.intersections.length,3);assert.match(toSVG(s),/\(0; 0\)/);assert.match(toTypst(s),/circle\(/);
 p.inequalities[2].enabled=false;assert.equal(buildScene(p).intersections.length,1);
 p.options.showIntersections=false;assert.equal(buildScene(p).intersections.length,0);
});
const splitTable={points:[{x:'-2',y:'-1',mark:''},{x:'0.123',y:'1',right:'1.1',mark:'||',split:true},{x:'2',y:'3',mark:''}],signs:['+','+']};
test('illustration never bridges a split even when the jump is small and between sample locations',()=>{
 const s=illustration(splitTable,options),cut=s.plot.left+(.123-options.xmin)*s.plot.unit;
 for(const p of s.items.filter(i=>i.type==='polyline'))assert.ok(p.points.every(([x])=>x<cut)||p.points.every(([x])=>x>cut));
 assert.equal(s.items.filter(i=>i.type==='circle'&&i.open).length,2);
});
test('illustrated shape is invariant under viewport changes and undefined intervals remain empty',()=>{
 const t={points:[{x:'-∞',y:'-∞',mark:''},{x:'0',y:'0',mark:'0'},{x:'+∞',y:'+∞',mark:''}],signs:['+','+']};
 const a=illustration(t,options),b=illustration(t,{...options,xmin:-10,xmax:10,ymin:-20,ymax:20});
 for(const x of [-7,-1,0,.5,8])assert.equal(a.illustrationEvaluate(x),b.illustrationEvaluate(x));
 const gap=illustration({...splitTable,signs:['||','+']},options);assert.ok(Number.isNaN(gap.illustrationEvaluate(-1)));
 const literal=structuredClone(splitTable);literal.points[1].y='||';assert.doesNotThrow(()=>illustration(literal,options));
});
