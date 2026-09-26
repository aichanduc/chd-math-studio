# Kết quả xác minh

Ngày: 26/09/2026. Kiểm tra trên Windows, Node.js, Python 3.12, Typst Python binding 0.14.2.

## Đã kiểm tra

- `npm test`: 21 kiểm thử đạt, 0 thất bại.
- `npm run build`: thành công. JavaScript sản phẩm khoảng 416 KB trước gzip, khoảng 124 KB sau gzip.
- Bộ mẫu: bậc ba, bảng bậc ba, bảng trùng phương, bảng phân thức, sơ đồ cây, phác họa từ bảng.
- Biên dịch Typst native trên máy: mỗi mẫu xuất được PDF, PNG và SVG, tổng cộng 18 tệp; đã xem ảnh của bảng thường và bảng có tiệm cận để kiểm tra bố cục, dấu, mũi tên.
- Trình duyệt: giao diện xuất hiện đúng; chuyển đồ thị/bảng/cây; nhập công thức sai thì hiện lỗi và chặn xuất; bảng phân thức có hai giới hạn khác nhau; bật tùy chỉnh và thêm giới hạn phải; chuyển light/dark; kiểm tra ở chiều rộng 390 px không bị tràn ngang.
- Nút tải PNG đã tạo tệp `figure.png` cho sơ đồ cây trong thư mục Downloads (193.491 byte). Bộ theo dõi sự kiện tải của công cụ kiểm tra bị timeout, nhưng tệp tải thật tồn tại và giao diện không ghi lỗi JavaScript.
- Kiểm thử API bằng mock: dispatch JSON, ghép UUID đúng run, lỗi 403, lỗi quota, repository/token không hợp lệ.
- Broker chạy trên máy; `/api/config` trả trạng thái chưa cấu hình đúng. Kiểm thử HTTP thực với cấu hình giả: không lộ token, chặn origin lạ, job không tồn tại và path traversal.
- Cài thư viện cập nhật xong: npm báo 0 lỗ hổng tại thời điểm cài đặt.
- Ảnh kiểm chứng: `preview-light.jpg`, `preview-dark.jpg` trong thư mục này.

## Chưa thể xác minh ở giai đoạn này

- Chưa tạo repository, push, chạy workflow trên tài khoản GitHub, hoặc xuất bản URL công cộng — đúng theo yêu cầu để bước đó ở giai đoạn sau.
- Chưa kiểm tra GitHub PAT/GitHub App thật, quyền repository, hàng đợi Actions, quota tài khoản, URL artifact thật hoặc một lần tải qua broker tới GitHub thật. Các bước đó cần repository và cấu hình hợp lệ.
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
