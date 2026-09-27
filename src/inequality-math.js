import { parse } from 'mathjs/number';

// Reduce a restricted AST to ax + by + c, never evaluate arbitrary input.
export function parseInequality(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > 160) throw new Error('Nhập bất phương trình từ 1 đến 160 ký tự.');
  const source = input.trim().replace(/−/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/π/g, 'pi');
  const parts = source.split(/(<=|>=|<|>)/);
  if (parts.length !== 3 || parts.some(s => !s.trim())) throw new Error('Dùng một dấu <, >, <= hoặc >=. Ví dụ: 2x + y <= 4.');
  let count = 0;
  const scalar = p => p[0] === 0 && p[1] === 0;
  const scale = (p, k) => p.map(v => v * k);
  function affine(n) {
    if (++count > 100) throw new Error('Biểu thức quá phức tạp.');
    let p;
    if (n.isParenthesisNode) return affine(n.content);
    if (n.isConstantNode && typeof n.value === 'number') p = [0, 0, n.value];
    else if (n.isSymbolNode && ['x', 'y', 'pi', 'e'].includes(n.name)) p = n.name === 'x' ? [1, 0, 0] : n.name === 'y' ? [0, 1, 0] : [0, 0, n.name === 'pi' ? Math.PI : Math.E];
    else if (n.isOperatorNode && ['+', '-', '*', '/'].includes(n.op)) {
      const a = affine(n.args[0]), b = n.args.length === 2 ? affine(n.args[1]) : null;
      if (n.op === '+' || n.op === '-') p = b ? a.map((v, i) => v + (n.op === '+' ? 1 : -1) * b[i]) : scale(a, n.op === '+' ? 1 : -1);
      else if (n.op === '*' && b && (scalar(a) || scalar(b))) p = scalar(a) ? scale(b, a[2]) : scale(a, b[2]);
      else if (n.op === '/' && b && scalar(b) && b[2] !== 0) p = scale(a, 1 / b[2]);
    }
    if (!p || !p.every(Number.isFinite)) throw new Error('Chỉ nhận biểu thức bậc nhất theo x, y; dùng số, ngoặc, +, −, *, / (mẫu số là hằng số khác 0).');
    return p;
  }
  let left, right;
  try { left = parse(parts[0]); right = parse(parts[2]); } catch { throw new Error('Biểu thức chưa hợp lệ. Ví dụ: x/2 + y >= 1.'); }
  const l = affine(left), r = affine(right), sign = parts[1].startsWith('>') ? -1 : 1;
  const [a, b, k] = l.map((v, i) => sign * (v - r[i]));
  const norm = Math.hypot(a, b);
  if (!Number.isFinite(norm) || norm === 0 || !Number.isFinite(k / norm)) throw new Error('Sau khi rút gọn, cần ít nhất một hệ số x hoặc y khác 0.');
  return { a: a / norm, b: b / norm, c: -k / norm, strict: parts[1].length === 1, source, left, right, operator: parts[1] };
}

// Intersect a segment with closed half-planes ax + by <= c.
// Strictness is represented by a dashed boundary; it does not change hatch area.
export function clipSegment(start, end, planes) {
  let lo = 0, hi = 1;
  const dx = end[0] - start[0], dy = end[1] - start[1];
  for (const { a, b, c } of planes) {
    const q = c - a * start[0] - b * start[1], d = a * dx + b * dy;
    if (Math.abs(d) < 1e-12) { if (q < -1e-9) return null; continue; }
    const t = q / d;
    if (d > 0) hi = Math.min(hi, t); else lo = Math.max(lo, t);
    if (lo > hi) return null;
  }
  if (hi - lo < 1e-10) return null;
  return [[start[0] + lo * dx, start[1] + lo * dy], [start[0] + hi * dx, start[1] + hi * dy]];
}

export function rectanglePlanes(left, top, right, bottom) {
  return [{ a: -1, b: 0, c: -left }, { a: 1, b: 0, c: right }, { a: 0, b: -1, c: -top }, { a: 0, b: 1, c: bottom }];
}

export function lineIntersections(planes) {
  const result = [];
  for (let i = 0; i < planes.length; i++) for (let j = i + 1; j < planes.length; j++) {
    const p = planes[i], q = planes[j], det = p.a * q.b - q.a * p.b;
    if (Math.abs(det) < 1e-12) continue; // parallel or coincident boundaries
    const x = (p.c * q.b - q.c * p.b) / det, y = (p.a * q.c - q.a * p.c) / det;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (!result.some(v => Math.hypot(v.x - x, v.y - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)))) result.push({ x, y });
  }
  return result;
}
