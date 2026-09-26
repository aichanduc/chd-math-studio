import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { buildScene } from '../src/project.js';
import { toTypst, toSVG } from '../src/drawing.js';

const raw=process.env.PROJECT_JSON || await readFile(process.argv[2]||'examples/cubic.json','utf8');
if(Buffer.byteLength(raw)>45000)throw new Error('Project exceeds 45 KB.');
const drawing=buildScene(JSON.parse(raw));
await mkdir('outputs',{recursive:true});
await writeFile('outputs/figure.typ',toTypst(drawing));
await writeFile('outputs/preview.svg',toSVG(drawing));
await writeFile('outputs/project.json',raw);
console.log(`Generated native Typst source: ${drawing.width} × ${drawing.height}`);
