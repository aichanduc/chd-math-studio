# Nghiên cứu và lựa chọn kiến trúc

Ngày nghiên cứu: 26/09/2026.

## Typst đảm nhiệm phần nào?

Typst là bộ dàn trang/biên dịch. Việc nhập công thức rồi suy ra tập xác định, nghiệm đạo hàm, giới hạn và tính đơn điệu là công việc của một tầng toán học riêng. Dự án dùng mathjs để phân tích cú pháp, tính giá trị và đạo hàm; bảng tự động được giới hạn ở những họ hàm có thuật toán đã triển khai và kiểm thử.

- [Typst Documentation](https://typst.app/docs/)
- [Typst line](https://typst.app/docs/reference/visualize/line/)
- [Typst curve](https://typst.app/docs/reference/visualize/curve/)
- [Typst place](https://typst.app/docs/reference/layout/place/)
- [Typst export and preview](https://typst.app/docs/web-app/export-and-preview/)
- [mathjs expression parsing](https://mathjs.org/docs/expressions/parsing.html)
- [mathjs derivative](https://mathjs.org/docs/reference/functions/derivative.html)

## Tại sao không phụ thuộc CeTZ ngay từ đầu?

[CeTZ](https://typst.app/universe/package/cetz) rất phù hợp cho hình vẽ phong phú bằng mã Typst. Phiên bản đầu dùng primitive Typst native để giảm bước tải package trên runner và giữ mã sinh ra tự chứa. Cùng một mô hình hình học được xuất sang SVG xem trước hoặc Typst. Vì vậy không có bộ tọa độ thứ hai dễ lệch nhau. Sau này có thể thêm một bộ xuất CeTZ cho người dùng muốn mã ngắn, cấp cao hơn.

## Hai đường xuất tệp

1. Xem trước và xuất SVG/PNG trên trình duyệt: nhanh, không cần GitHub, phù hợp chỉnh hình liên tục.
2. Xuất Typst chính thức: JSON dự án → kiểm tra schema/biểu thức → primitive Typst → compiler → artifact gồm PDF, SVG, PNG. Khi nhấn biên dịch mới dùng Actions, không tốn một runner mỗi lần gõ phím.

Workflow ghim `typst==0.14.2`, là phiên bản thực tế đã dùng biên dịch thử trong dự án. Đây là lựa chọn tái lập được, không phải tuyên bố đó là phiên bản Typst mới nhất.

## GitHub Actions và website công cộng

- [Workflow dispatch qua API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
- [Quản lý workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs)
- [Artifacts API](https://docs.github.com/en/rest/actions/artifacts)
- [Triển khai GitHub Pages bằng workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Gửi workflow yêu cầu quyền trên repository. Trang tĩnh không thể giữ bí mật token dùng chung. Vì vậy có hai chế độ: PAT cá nhân trong bộ nhớ trình duyệt; hoặc broker Node giữ token phía máy chủ. Broker chỉ chấp nhận dữ liệu dựng hình có cấu trúc, không nhận shell hay mã Typst tùy ý. API và workflow trao đổi qua JSON và biến môi trường, không nối chuỗi dữ liệu người dùng vào lệnh shell.

Mỗi yêu cầu mang UUID, được đặt vào run-name và tên artifact để tránh tải nhầm kết quả của người khác. Hàng đợi có độ trễ và có thể hết quota; giao diện hiển thị trạng thái chờ/chạy/thành công/thất bại, không dùng thông báo thành công giả.

## Bảng biến thiên và đồ thị

Một bảng chỉ mô tả các mốc, dấu đạo hàm, giới hạn và xu hướng. Vô số hàm khác nhau có thể cùng bảng. Phác họa không thể xác định đúng duy nhất đồ thị; ứng dụng ghi rõ tính minh họa. Không tự tính dấu/giới hạn toàn trục cho các hàm chưa hỗ trợ bằng cách lấy vài mẫu rồi coi đó là kết luận chính xác.

## Hướng mở rộng phù hợp

- Phân tích biểu thức hữu tỉ tổng quát bằng CAS có kiểm soát, vẫn giữ tập xác định trước rút gọn.
- Hàm từng đoạn, log/mũ biến đổi, lượng giác theo khoảng hữu hạn, chú thích miền khảo sát.
- Dàn công thức nhãn nhiều tầng bằng Typst math; preset đề thi và cùng tỉ lệ trục.
- GitHub App, hàng đợi và kho trạng thái bền vững để mở rộng biên dịch công cộng.
- Xuất thêm CeTZ, nhiều hình trong một trang, preset phông/kích thước cho đề thi.
