import { mathLabel } from './math-typeset.js';
import { graph } from './drawing.js';
import { parseInequality, clipSegment, rectanglePlanes } from './inequality-math.js';

export const initialInequalities = () => [
  { formula: 'x >= 0', color: '#2755df', enabled: true },
  { formula: 'y >= 0', color: '#188779', enabled: true },
  { formula: 'x + y <= 4', color: '#d06b38', enabled: true },
];
const pale = hex => '#' + hex.slice(1).match(/../g).map(v => Math.round(parseInt(v, 16) * .42 + 255 * .58).toString(16).padStart(2, '0')).join('');
export function inequalityScene(rows, options, reverse = false) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 8) throw new Error('Nhập từ 1 đến 8 bất phương trình.');
  if (typeof reverse !== 'boolean') throw new Error('Tùy chọn đảo miền không hợp lệ.');
  const active = [];
  rows.forEach((row, i) => {
    if (!row || typeof row.formula !== 'string' || row.formula.length > 160 || !/^#[0-9a-f]{6}$/i.test(row.color)) throw new Error(`Dữ liệu bất phương trình ${i + 1} không hợp lệ.`);
    if (row.enabled === false) return;
    try { active.push({ ...parseInequality(row.formula), color: row.color, index: i + 1 }); }
    catch (err) { throw new Error(`BPT ${i + 1}: ${err.message}`); }
  });
  // Reuse the same equal-unit axes and viewport geometry as function graphs.
  const s = graph({ source: '', evaluate: () => NaN }, null, { ...options, showPoints: false });
  s.items = s.items.filter(p => !(p.type === 'text' && p.y === 25));
  if (options.title.trim()) s.items.push({ type: 'text', x: s.width / 2, y: 25, label: options.title, size: 20, color: '#24334b', anchor: 'middle' });
  const { left: L, top: T, width: W, height: H, unit } = s.plot, R = L + W, B = T + H;
  const bounds = rectanglePlanes(L, T, R, B);
  const planes = active.map(p => ({ a: p.a, b: -p.b, c: unit * (p.c - p.a * options.xmin - p.b * options.ymax) + p.a * L - p.b * T }));
  const hatches = [], boundaries = [];
  const addLine = (target, segment, color, width, dash = false) => {
    if (!segment) return;
    const [[x1, y1], [x2, y2]] = segment;
    target.push({ type: 'line', x1, y1, x2, y2, color, width, dash });
  };
  function hatch(clip, color, slope = -1, phase = 0) {
    for (let offset = -W + phase; offset <= H + W; offset += 13) {
      const start = [L, T + offset], end = [R, T + offset + slope * W];
      addLine(hatches, clipSegment(start, end, [...bounds, ...clip]), color, .9);
    }
  }
  if (reverse) hatch(planes, pale(options.color));
  else planes.forEach((p, i) => hatch([{ a: -p.a, b: -p.b, c: -p.c }], pale(active[i].color), i % 2 ? 1 : -1, i * 2));
  planes.forEach((p, i) => {
    const norm2 = p.a * p.a + p.b * p.b;
    const distance = (p.c - p.a * (L + W / 2) - p.b * (T + H / 2)) / norm2;
    const center = [L + W / 2 + p.a * distance, T + H / 2 + p.b * distance];
    const span = 2 * Math.hypot(W, H);
    addLine(boundaries, clipSegment([center[0] - p.b * span, center[1] + p.a * span], [center[0] + p.b * span, center[1] - p.a * span], bounds), active[i].color, 2, active[i].strict);
  });
  s.items = [...hatches, ...s.items, ...boundaries];
  const note = active.length ? (reverse ? 'Vùng gạch: miền nghiệm chung' : 'Vùng trắng: miền nghiệm chung') : (reverse ? 'Không bật BPT: toàn bộ mặt phẳng được gạch' : 'Không bật BPT: toàn bộ mặt phẳng là nghiệm');
  s.items.push({ type: 'text', x: s.width / 2, y: B + 48, label: note, size: 15, color: '#24334b', anchor: 'middle' });
  active.forEach((p, i) => {
    const y = B + 80 + i * 30;
    addLine(s.items, [[L, y], [L + 25, y]], p.color, 2, p.strict);
    s.items.push({ type: 'text', x: L + 38, y, label: p.source, size: Math.min(16, (s.width - L - 60) / (mathLabel(p.source)?.width || p.source.length * .6)), color: p.color, anchor: 'start' });
  });
  s.height = B + 105 + active.length * 30;
  s.inequalityCount = active.length;
  return s;
}
