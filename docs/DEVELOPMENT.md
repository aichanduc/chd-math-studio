# CHĐ Math Studio — phát triển và triển khai

PDF trên website hiện được biên dịch trực tiếp bằng Typst WebAssembly trong Worker, không cần token. Các chế độ Actions/broker bên dưới là tùy chọn nâng cao. Thiết kế bởi Chân Đức.

Xưởng hình vẽ Toán học bằng tiếng Việt, dành cho giáo viên. Nhập công thức → xem hình → sửa bảng → xuất SVG/PNG hoặc biên dịch Typst qua GitHub Actions.

## Chạy trên máy

Cần Node.js **22.12 trở lên** (khuyến nghị Node 24 LTS). Mở terminal trong thư mục chứa tệp này:

Trên Windows cũng có thể nhấp đúp `CHAY-TRANG-WEB.cmd`; lần đầu tệp này cài thư viện và mở trang trong trình duyệt. Giữ cửa sổ lệnh mở trong khi dùng.

```sh
npm ci
npm run dev
```

Mở địa chỉ Vite in ra, thường là http://127.0.0.1:5173. Trên PowerShell nếu bị chặn npm.ps1, dùng `npm.cmd` thay cho `npm`. Đây là dự án có module và bước build; không mở trực tiếp index.html bằng cách nhấp đúp.

```sh
npm test
npm run build
npm run preview
```

`dist/` là website tĩnh đã build. Cấu hình đường dẫn tương đối cho phép đặt tại GitHub Pages dưới tên repository bất kỳ. Font giao diện dùng Segoe UI/Arial của hệ thống. Không có analytics.

## Đã có gì?

- Đồ thị theo công thức; khung tọa độ, lưới, điểm dừng, màu nét, tiêu đề, phóng to/thu nhỏ.
- Tự động lập bảng cho đa thức bậc 0–4, phân thức `(ax+b)/(cx+d)`, `exp(x)`, `e^x`, `ln(x)`, `sqrt(x)`.
- Biểu thức đồ thị hỗ trợ x, e, pi, +, −, *, /, ^; sin, cos, tan, asin, acos, atan, exp, log/ln, sqrt, abs. Đạo hàm dùng mathjs.
- Bảng thủ công 2–10 mốc. Mỗi mốc có x, ký hiệu y′, y trái, y phải tại điểm ngắt. Mỗi khoảng có +, −, 0 hoặc ||. Có lựa chọn ngắt riêng dòng y, độc lập với dòng y′.
- Nhập ±∞ qua danh sách gợi ý; phân số `1/2`, căn `sqrt(2)`, hoặc nhãn tự do. Nhãn tự do được in nguyên văn, không được thực thi như mã Typst/HTML.
- Phác họa một đường cong minh họa từ bảng hợp lệ, có cảnh báo rõ ràng.
- Sơ đồ cây 31 nút, tối đa 6 cấp; nhập bằng thụt lề và nhãn nhánh.
- Light theme mặc định; dark theme và lựa chọn giao diện được nhớ trên máy.
- Xuất SVG vector, PNG 3× tức thì, mã Typst tự chứa; lưu/mở dự án JSON.
- Workflow GitHub Actions tạo **PDF + PNG + SVG + .typ + project.json**.
- Máy chủ Node tùy chọn để giữ token phía server và cho người dùng tải ZIP ngay trong trang.

## Giới hạn toán học cần hiểu đúng

1. **Bảng biến thiên không xác định duy nhất đồ thị.** Chức năng Phác họa dùng đường nối trơn đơn điệu từng đoạn (smoothstep). Những đầu mút vô cực được đưa về biên khung nhìn để minh họa. Nó không khôi phục công thức, độ cong hay tốc độ tiến đến tiệm cận, và không dùng làm chứng minh.
2. Bảng tự động dùng cấu trúc biểu thức, hệ số đa thức và giải nghiệm số của đạo hàm; không tuyên bố là CAS tổng quát. Các mốc hữu hạn làm tròn đến 7 chữ số có nghĩa. Các dạng ngoài danh sách, như `sin(x)`, `x+1/x`, hàm từng đoạn, chuyển sang bảng thủ công.
3. Đồ thị được lấy mẫu 1.500 đoạn trong miền xem. Bộ dựng cắt tại giá trị không xác định và kiểm tra bước nhảy để tránh nối qua cực. Hàm dao động rất nhanh, điểm gián đoạn hẹp hoặc hệ số cực lớn/nhỏ cần thu hẹp miền và kiểm tra lại. Hai trục dùng chung hệ số điểm ảnh/đơn vị; kích thước vùng vẽ thay đổi theo độ dài miền x và y.
4. Mẫu số bị triệt tiêu vẫn giữ điểm khuyết với dạng phân thức bậc nhất/bậc nhất; không coi đó là tiệm cận đứng.
5. Bảng thủ công cho phép nhãn ký hiệu tự do. Chức năng Phác họa yêu cầu x, y là biểu thức số hoặc vô cực và thứ tự/dấu phải nhất quán. Nhãn phân số/căn hợp lệ được dàn bằng MathJax SVG và Typst math; nhãn tự do vẫn in nguyên văn.
6. SVG/PNG tải nhanh do trình duyệt dựng; tệp trong gói Actions được biên dịch **thật bằng Typst**. Hai bộ xuất có thể hơi khác về font. PDF không được giả lập bằng nút in trình duyệt.

## Đưa lên GitHub

Repository chính: https://github.com/aichanduc/chd-math-studio. Khi triển khai bản riêng, đưa **nội dung thư mục math-typst-studio** làm gốc repository, gồm cả `.github/`, `package-lock.json` và `examples/`. Không đưa `.tools/`, `node_modules/`, `.env` lên GitHub.

1. Tạo repository, nhánh mặc định `main`, đẩy mã nguồn lên.
2. Trong **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
3. Bật Actions trong repository. Workflow `pages.yml` chạy kiểm thử, build và xuất bản website. `ci.yml` còn biên dịch các mẫu Typst để phát hiện lỗi xuất bản.
4. Nếu dùng nhánh mặc định khác `main`, đổi các điều kiện nhánh trong `pages.yml`, `ci.yml` và nhập đúng nhánh khi biên dịch.
5. `compile.yml` phải tồn tại trên nhánh mặc định để nhận `workflow_dispatch`.

### Cách A — Actions nâng cao, dùng repository cá nhân

Mở GitHub Actions trên giao diện → nhập `owner/repo`, nhánh và fine-grained PAT được giới hạn vào **repository đó**, quyền **Actions: read and write**. Giao diện gửi `workflow_dispatch`, theo dõi lần chạy theo UUID, thông báo thành công/thất bại.

Token chỉ tồn tại trong bộ nhớ trang; không đưa vào localStorage, tệp JSON hay mã nguồn. Ô token được xóa sau khi gửi thành công. Khi tác vụ hoàn tất, mở liên kết GitHub, vào **Artifacts**, tải `figure-<UUID>` chứa các định dạng. GitHub có thể yêu cầu đăng nhập để tải artifact. Lần chạy lỗi có liên kết đến log. Artifact được giữ 7 ngày.

Đây là cách dùng cá nhân; **không** đặt token của chủ dự án vào JavaScript công khai để phục vụ khách truy cập.

### Cách B — Người dùng công cộng không cần token

Đã có máy chủ trung gian `server/index.mjs`. Máy chủ giữ token qua biến môi trường, gọi Actions và chuyển gói ZIP về người dùng. Máy chủ cũng phục vụ `dist/`, nên frontend/API cùng origin:

```sh
npm ci
npm run build
# Sao chép .env.example thành .env, điền cấu hình ở máy chủ
npm run server
```

Ví dụ biến môi trường:

```dotenv
HOST=127.0.0.1
PORT=8787
PUBLIC_ORIGIN=https://your-domain.example
GITHUB_REPOSITORY=your-account/math-typst-studio
GITHUB_REF=main
GITHUB_TOKEN=your-server-side-token
COMPILES_PER_IP_HOUR=5
COMPILES_PER_HOUR=30
TRUST_PROXY=0
```

Triển khai Node sau reverse proxy HTTPS. `PUBLIC_ORIGIN` phải đúng origin trang, không có dấu `/` cuối. Chỉ bật `TRUST_PROXY=1` khi proxy do bạn quản lý **ghi đè** X-Forwarded-For và người dùng không truy cập trực tiếp Node. Với môi trường container cần lắng nghe ngoài loopback, đặt HOST=0.0.0.0.

Trang tự phát hiện `/api/config`; nếu broker hoạt động thì ẩn các ô token/repository và tải ZIP trực tiếp. Dịch vụ từ chối dữ liệu quá 45 KB, giới hạn số lần biên dịch, dùng job UUID khó đoán, không nhận mã Typst tùy ý và không nội suy công thức vào shell. Token không đi theo redirect sang kho artifact.

**GitHub Pages không chạy được máy chủ Node.** Muốn giữ Pages làm frontend và dùng API ở origin khác, cần bổ sung cấu hình origin/CORS và frontend API URL; bản hiện tại chủ động dùng cùng origin cho cách B.

Trạng thái job và quota của broker hiện lưu trong bộ nhớ một tiến trình, hết hạn sau 1 giờ. Khởi động lại server sẽ mất liên kết job đang theo dõi. Khi mở dịch vụ quy mô lớn, cần thay bằng kho bền vững, đăng nhập/GitHub App, quota theo tài khoản, chống spam và chính sách lưu tệp. Theo dõi hạn mức và chi phí Actions của tài khoản trước khi mở rộng.

## Biên dịch Typst trên máy

Python 3.12 và gói `typst==0.14.2` được dùng đồng nhất trong workflow:

```sh
python -m pip install typst==0.14.2
npm run samples
node scripts/render.mjs examples/cubic.json
python scripts/compile.py
```

Kết quả ở `outputs/figure.pdf`, `.png`, `.svg`. Tệp `.typ` dùng `place`, `curve`, `line`, `text`, `circle`, `rect` của Typst, không nhúng ảnh raster, không cần CeTZ hoặc tải gói Typst bên ngoài. Có thể sửa tệp `.typ` tải về và biên dịch bằng CLI Typst >= 0.14.2; workflow hiện nhận dự án JSON, không nhận mã đã sửa tùy ý.

## Cấu trúc

```text
src/math.js         Phân tích biểu thức, bảng tự động, kiểm tra bảng
src/drawing.js      Mô hình hình vẽ → SVG hoặc mã Typst native
src/project.js      Kiểm tra dữ liệu dự án và điều phối dựng hình
src/main.js         Giao diện và tương tác
src/style.css       Responsive, light/dark
src/github.js      Kết nối Actions cá nhân / broker
server/index.mjs    Máy chủ biên dịch tùy chọn
scripts/           Sinh mã và biên dịch thật
examples/          Sáu dự án mẫu
tests/             Kiểm thử toán học, đầu vào, giao thức
.github/workflows/ Pages, CI, biên dịch theo yêu cầu
docs/              Nghiên cứu và kết quả xác minh
```

Xem `docs/RESEARCH.md` để biết quyết định thiết kế và nguồn tài liệu chính thức. Xem `docs/VERIFICATION.md` để biết những gì đã/ chưa được kiểm tra.