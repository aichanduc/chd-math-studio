// CHĐ Math Studio · Thiết kế bởi Chân Đức
// Sửa dữ liệu ba hàng ở cuối tệp. Không cần gói Typst bên ngoài.
#set page(width: 900pt, height: 370pt, margin: 0pt, fill: white)
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
  segment(x1, y1, x2, y2, paint: rgb("#2755df"))
  for d in (-0.45rad, 0.45rad) {
    segment(x2, y2, x2 - 8*calc.cos(a + d), y2 - 8*calc.sin(a + d), paint: rgb("#2755df"))
  }
}
#let bbt(xs: (), marks: (), ys: (), signs: ()) = {
  let n = xs.len()
  let x(i) = 165 + i*(900 - 260)/(n - 1)
  for y in (75, 125, 178, 325) { segment(55, y, 850, y) }
  for v in (55, 120, 850) { segment(v, 75, v, 325) }
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
#at(450, 30, text("Bảng biến thiên"), w: 840)

// Hàng x, y′, y và dấu trên từng khoảng:
#bbt(
  xs: ($-oo$, $-1$, $1$, $+oo$,),
  marks: ([], $0$, $0$, [],),
  ys: (
    (left: $-oo$, right: $-oo$, split: false, low: 303, high: 303),
    (left: $3$, right: $3$, split: false, low: 222, high: 222),
    (left: $-1$, right: $-1$, split: false, low: 284, high: 284),
    (left: $+oo$, right: $+oo$, split: false, low: 204, high: 204),
  ),
  signs: ($+$, $-$, $+$,),
)
