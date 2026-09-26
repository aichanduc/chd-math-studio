import test from 'node:test';
import assert from 'node:assert/strict';
import {panRange,zoomRange,simplify,validRange} from '../src/viewport.js';
import {mathLabel,typstLabel} from '../src/math-typeset.js';
import {buildScene,initialTable} from '../src/project.js';
import {toSVG,toTypst} from '../src/drawing.js';
const o={xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',title:''};
test('pan changes viewport by screen displacement without changing span',()=>{const p=panRange(o,100,50,800,500);assert.deepEqual(p,{xmin:-5,xmax:3,ymin:-3,ymax:7});assert.equal(p.xmax-p.xmin,8);});
test('zoom anchors the same coordinate under pointer and bounds extreme ranges',()=>{const z=zoomRange(o,.5,2,3);assert.equal((2-z.xmin)/(z.xmax-z.xmin),(2-o.xmin)/8);assert.ok(!validRange(zoomRange(o,1e-9)));});
test('curve simplification preserves endpoints and curved geometry',()=>{assert.deepEqual(simplify([[0,0],[1,1],[2,2]]),[[0,0],[2,2]]);assert.equal(simplify([[0,0],[1,3],[2,0]]).length,3);});
test('math typesetting uses vector paths and safe native math',()=>{assert.match(mathLabel('sqrt(2)/2').code,/frac\(sqrt\(2\), 2\)/);assert.match(mathLabel('x^2').body,/<path/);assert.equal(mathLabel('#read("secret")'),null);assert.match(typstLabel('#read("secret")'),/^text\(/);});
test('interactive handles do not leak into SVG or Typst exports',()=>{const s=buildScene({version:1,mode:'variation',table:initialTable(),options:o});assert.ok(s.hits.some(h=>h.key==='split'));assert.ok(!toSVG(s).includes('button'));const typ=toTypst(s);assert.match(typ,/#let bbt/);assert.match(typ,/xs: \(/);assert.ok(typ.length<6500);});

test('scientific notation remains a power of ten in Typst',()=>assert.match(mathLabel('1e-9').code,/times 10\^\(-9\)/));
