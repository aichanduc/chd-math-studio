import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScene,initialTable} from '../src/project.js';
import {toSVG,toTypst} from '../src/drawing.js';
const options={xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',title:'',showGrid:true};
test('equal units on axes for square, tall and wide ranges',()=>{for(const bounds of [{},{xmin:-20,xmax:20,ymin:-2,ymax:2},{xmin:0,xmax:1,ymin:-8,ymax:8}]){const o={...options,...bounds},s=buildScene({version:1,mode:'graph',formula:'x',options:o});assert.ok(Math.abs(s.plot.width/(o.xmax-o.xmin)-s.plot.height/(o.ymax-o.ymin))<1e-9);}});
test('multiple curves share one plot and retain distinct colors and legend in exports',()=>{const p={version:1,mode:'graph',formula:'x',options,multi:true,curves:[{formula:'-x',color:'#d06b38',enabled:true},{formula:'x^2',color:'#188779',enabled:true}]},s=buildScene(p);for(const c of ['#2755df','#d06b38','#188779'])assert.ok(s.items.some(i=>i.type==='polyline'&&i.color===c));assert.match(toSVG(s),/#188779/);assert.match(toTypst(s),/#d06b38/);assert.equal(s.items.filter(i=>i.type==='text'&&i.label.startsWith('y =')).length,3);});
test('hidden additional curves are excluded and bad active curves fail clearly',()=>{const p={version:1,mode:'graph',formula:'x',options,multi:true,curves:[{formula:'bad',color:'#188779',enabled:false}]};assert.doesNotThrow(()=>buildScene(p));p.curves[0].enabled=true;assert.throws(()=>buildScene(p));p.curves=Array(6).fill({formula:'x',color:'#188779'});assert.throws(()=>buildScene(p));});
test('custom tables roundtrip as projects and can be illustrated',()=>{const p=JSON.parse(JSON.stringify({version:1,mode:'custom',table:initialTable(),options}));assert.match(toTypst(buildScene(p)),/#let bbt/);assert.ok(buildScene({...p,mode:'illustration'}).plot);});
