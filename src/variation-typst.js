import { typstLabel } from './math-typeset.js';
import { numericLabel, rightValue } from './math.js';
export function variationTypst(t,{color='#2755df',title=''}={},width=900){
 const nums=t.points.flatMap(p=>[numericLabel(p.y),numericLabel(rightValue(p))]).filter(Number.isFinite),lo=Math.min(...nums),hi=Math.max(...nums);
 const level=v=>{const n=numericLabel(v);return n===Infinity?204:n===-Infinity?303:Number.isFinite(n)?hi===lo?253:284-(n-lo)/(hi-lo)*62:253;};
 const tuple=a=>'('+a.join(', ')+',)';
 return `// CHĐ Math Studio · Thiết kế bởi Chân Đức
// Sửa dữ liệu ba hàng ở cuối tệp. Không cần gói Typst bên ngoài.
#set page(width: ${width}pt, height: 370pt, margin: 0pt, fill: white)
#set text(font: "Libertinus Serif", size: 21pt, fill: rgb("#24334b"))
#show math.equation: set text(font: "New Computer Modern Math")
#let at(x, y, body, w: 100, alignment: center) = place(top + left,
  dx: (x - w/2)*1pt, dy: (y - 22)*1pt,
  box(width: w*1pt, height: 44pt, align(alignment + horizon, body)))
#let segment(x1, y1, x2, y2, paint: rgb("#24334b")) = place(top + left,
  line(start: (x1*1pt, y1*1pt), end: (x2*1pt, y2*1pt), stroke: 1.2pt + paint))
#let double(x, top, bottom) = {
  segment(x - 3, top, x - 3, bottom)
  segment(x + 3, top, x + 3, bottom)
}
#let arrow(x1, y1, x2, y2) = {
  let a = calc.atan2(y2 - y1, x2 - x1)
  segment(x1, y1, x2, y2, paint: rgb("${color}"))
  for d in (-0.45rad, 0.45rad) {
    segment(x2, y2, x2 - 8*calc.cos(a + d), y2 - 8*calc.sin(a + d), paint: rgb("${color}"))
  }
}
#let bbt(xs: (), marks: (), ys: (), signs: ()) = {
  let n = xs.len()
  let x(i) = 165 + i*(${width} - 260)/(n - 1)
  for y in (125, 178) { segment(55, y, ${width-50}, y) }
  segment(120, 75, 120, 325)
  at(86, 100, $x$); at(86, 152, $y'$); at(86, 248, $y$)
  for i in range(n) {
    at(x(i), 100, xs.at(i))
    if marks.at(i) == none { double(x(i), 130, 177) } else { at(x(i), 152, marks.at(i)) }
    let p = ys.at(i)
    if p.split {
      double(x(i), 178, 325)
      if i > 0 { at(x(i) - 49, p.low, p.left, w: 72, alignment: right) }
      if i < n - 1 { at(x(i) + 49, p.high, p.right, w: 72, alignment: left) }
    } else { at(x(i), p.low, p.left) }
  }
  for i in range(n - 1) {
    let a = ys.at(i); let b = ys.at(i + 1)
    at((x(i) + x(i + 1))/2, 152, if signs.at(i) == none {$||$} else {signs.at(i)})
    if signs.at(i) != none {
      arrow(x(i) + if a.split {70} else {38}, a.high,
        x(i + 1) - if b.split {70} else {38}, if signs.at(i) == $0$ {a.high} else {b.low})
    }
  }
}
${title.trim()?`#at(${width/2}, 30, text(${JSON.stringify(title)}), w: ${width-60})`:""}

// Hàng x, y′, y và dấu trên từng khoảng:
#bbt(
  xs: ${tuple(t.points.map(p=>typstLabel(p.x)))},
  marks: ${tuple(t.points.map(p=>p.mark==='||'?'none':p.mark?typstLabel(p.mark):'[]'))},
  ys: (\n${t.points.map(p=>`    (left: ${typstLabel(p.y)}, right: ${typstLabel(rightValue(p))}, split: ${p.split??(p.mark==='||')}, low: ${level(p.y)}, high: ${level(rightValue(p))}),`).join('\n')}\n  ),
  signs: ${tuple(t.signs.map(s=>s==='||'?'none':typstLabel(s)))},
)
`;
}
