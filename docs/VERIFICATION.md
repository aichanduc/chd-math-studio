# Kết quả xác minh

Ngày: 26/09/2026. Kiểm tra trên Windows, Node.js, Python 3.12, Typst Python binding 0.14.2.

## Đã kiểm tra

- PDF Typst WebAssembly trong trình duyệt: đồ thị và bảng biến thiên đã tải thật, có chữ ký PDF-1.7 và EOF hợp lệ; không nhập token.

- `npm test`: 21 kiểm thử đạt, 0 thất bại.
- `npm run build`: thành công. JavaScript chính khoảng 419 KB trước gzip, khoảng 125 KB sau gzip. Typst Worker tải WASM khoảng 28 MB theo nhu cầu.
- Bộ mẫu: bậc ba, bảng bậc ba, bảng trùng phương, bảng phân thức, sơ đồ cây, phác họa từ bảng.
- Biên dịch Typst native trên máy: mỗi mẫu xuất được PDF, PNG và SVG, tổng cộng 18 tệp; đã xem ảnh của bảng thường và bảng có tiệm cận để kiểm tra bố cục, dấu, mũi tên.
- Trình duyệt: giao diện xuất hiện đúng; chuyển đồ thị/bảng/cây; nhập công thức sai thì hiện lỗi và chặn xuất; bảng phân thức có hai giới hạn khác nhau; bật tùy chỉnh và thêm giới hạn phải; chuyển light/dark; kiểm tra ở chiều rộng 390 px không bị tràn ngang.
- Nút tải PNG đã tạo tệp `figure.png` cho sơ đồ cây trong thư mục Downloads (193.491 byte). Bộ theo dõi sự kiện tải của công cụ kiểm tra bị timeout, nhưng tệp tải thật tồn tại và giao diện không ghi lỗi JavaScript.
- Kiểm thử API bằng mock: dispatch JSON, ghép UUID đúng run, lỗi 403, lỗi quota, repository/token không hợp lệ.
- Broker chạy trên máy; `/api/config` trả trạng thái chưa cấu hình đúng. Kiểm thử HTTP thực với cấu hình giả: không lộ token, chặn origin lạ, job không tồn tại và path traversal.
- Cài thư viện cập nhật xong: npm báo 0 lỗ hổng tại thời điểm cài đặt.
- Ảnh kiểm chứng: `preview-light.jpg`, `preview-dark.jpg` trong thư mục này.

## Triển khai công khai ngày 26/09/2026

- Repository công khai: https://github.com/aichanduc/chd-math-studio.
- Pages và CI đã chạy thành công: https://github.com/aichanduc/chd-math-studio/actions/runs/36250997143 và https://github.com/aichanduc/chd-math-studio/actions/runs/36250997205.
- Website: https://aichanduc.github.io/chd-math-studio/.
- Trên URL công khai: nhập `(2*x+1)/(x-1)`, chuyển Bảng biến thiên, tải PDF trực tiếp thành công; xác minh tệp tải thật.
## Giới hạn kiểm tra

- Chưa kiểm tra chế độ người dùng nhập GitHub PAT/GitHub App thật, quyền repository, hàng đợi Actions, quota tài khoản, URL artifact thật hoặc một lần tải qua broker tới GitHub thật. Các bước đó cần repository và cấu hình hợp lệ.
- Chưa chạy broker công cộng qua HTTPS/reverse proxy, kiểm thử tải đồng thời hoặc mô hình nhiều máy chủ.
- Các kiểm thử không phải chứng minh đúng với mọi biểu thức hoặc mọi điều kiện số học. Phạm vi và giới hạn nêu trong README.

## Lặp lại

```sh
npm ci
npm test
npm run build
npm run samples
python -m pip install typst==0.14.2
python scripts/compile.py outputs/samples/cubic.typ
python scripts/compile.py outputs/samples/variation.typ
python scripts/compile.py outputs/samples/rational.typ
python scripts/compile.py outputs/samples/quartic.typ
python scripts/compile.py outputs/samples/tree.typ
python scripts/compile.py outputs/samples/illustration.typ
```


## Bản 1.1 — 27/09/2026

- 27 kiểm thử: thêm phép đổi miền khi rê, thu/phóng quanh con trỏ, đơn giản hóa đường, công thức vector, ký hiệu khoa học và mã bảng tự chứa.
- Sáu mẫu biên dịch native thành công ra PDF/PNG/SVG.
- Trình duyệt bản build: kéo chuột thực tế thay đổi miền x/y đúng, giữ nguyên công thức; nút thu/phóng đổi miền; khôi phục trả về khung ban đầu.
- Bấm ô y trực tiếp trên bảng, nhập sqrt(2)/2, áp dụng và tải PDF WebAssembly thành công.
- Bố cục 390 px không tràn ngang.
- npm audit sau bản vá phụ thuộc: 0 lỗ hổng tại thời điểm kiểm tra.
- MathJax làm JavaScript chính tăng lên khoảng 2 MB (694 KB gzip); WASM Typst vẫn chỉ tải khi xuất PDF.


## Bản 1.2 — 27/09/2026

- 31 kiểm thử đạt: thêm nhiều hàm, ẩn hàm, giới hạn số hàm, bảng tùy chỉnh, và tỉ lệ đơn vị bằng nhau ở miền vuông/ngang/dọc.
- Sáu mẫu Typst biên dịch thành công PDF, PNG, SVG bằng Typst 0.14.2.
- Trình duyệt: PDF hai hàm biên dịch thành công; sửa trực tiếp ô bảng riêng, phác họa rồi trở lại bảng, đổi tab vẫn giữ giá trị tùy chỉnh.
