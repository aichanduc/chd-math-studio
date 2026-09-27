import { initialInequalities } from '../src/inequalities.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { expression,autoVariation } from '../src/math.js';
import { initialTable,initialTree,buildScene } from '../src/project.js';
import {toTypst,toSVG} from '../src/drawing.js';
const options={xmin:-4,xmax:4,ymin:-4,ymax:6,color:'#2755df',title:'',showGrid:true,showPoints:true};
await mkdir('examples',{recursive:true});
await mkdir('outputs/samples',{recursive:true});
for(const [name,mode,formula] of [['cubic','graph','x^3-3*x+1'],['variation','variation','x^3-3*x+1'],['rational','variation','(2*x+1)/(x-1)'],['quartic','variation','x^4-2*x^2'],['tree','tree','x'],['illustration','illustration','x']]){
 const p={version:1,mode,formula,table:autoVariation(expression(formula))||initialTable(),tree:initialTree,options};
 if(mode==='illustration')p.table=initialTable();
 const s=buildScene(p);
 await writeFile(`examples/${name}.json`,JSON.stringify(p,null,2));
 await writeFile(`outputs/samples/${name}.typ`,toTypst(s));
 await writeFile(`outputs/samples/${name}.svg`,toSVG(s));
}
for(const reverse of [false,true]){
 const name=reverse?'inequalities-reverse':'inequalities';
 const p={version:1,mode:'inequalities',inequalities:initialInequalities(),reverse,options};
 p.inequalities[2].formula='x + y < 4';
 const s=buildScene(p);
 await writeFile(`examples/${name}.json`,JSON.stringify(p,null,2));
 await writeFile(`outputs/samples/${name}.typ`,toTypst(s));
 await writeFile(`outputs/samples/${name}.svg`,toSVG(s));
}
await writeFile('examples/bbt.typ',toTypst(buildScene({version:1,mode:'variation',table:initialTable(),options})));
console.log('Eight sample projects and native Typst sources generated.');
