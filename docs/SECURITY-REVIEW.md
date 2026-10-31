# Rà soát bảo mật

## Mô hình tin cậy
- Client (trình duyệt) **không** đáng tin. Firebase Web config là định danh công khai.
- Ranh giới bảo mật duy nhất: Firebase Authentication (`request.auth.uid`) + `firestore.rules`.
- Không có backend, Admin SDK, service-account key hay vai trò admin (mockup không yêu cầu).

## Security Rules (`firestore.rules`)
- `users/{uid}/plan/main` và `users/{uid}/months/{yyyy-mm}`: chỉ `request.auth.uid == uid`.
- Kiểm tra: `hasOnly`/`hasAll` trường, kiểu (`int`, số, `list`, `map`), phạm vi (năm 2000–2100, tuổi 0–120, tỷ lệ (0,1], tháng 1–12), kích thước (goals ≤ 20, mỗi danh sách thu/chi ≤ 200, map kế hoạch ≤ 30 khóa, reasons ≤ 60), id tháng khớp `year-month`, `updatedAt == request.time`, `rev` tạo = 0 và cập nhật = cũ + 1, không đổi year/month, cấm xóa.
- `/{document=**}`: từ chối mặc định.
- Đã triển khai lên `financial-plan-project-2a92e` bằng `firebase deploy --only firestore` (2026-10-31, "released rules firestore.rules to cloud.firestore").

## Kết quả kiểm thử Rules (Emulator, `@firebase/rules-unit-testing`)
17/17 đạt (`npm run test:rules`), gồm: chưa đăng nhập bị từ chối; chủ sở hữu CRUD đúng; người khác không đọc/sửa/xóa; không ghi dưới uid người khác; sai kiểu/thiếu/thừa trường/metadata giả bị từ chối; `rev` sai bị từ chối; xóa bị cấm; id tháng sai; tháng ngoài phạm vi; danh sách/map quá lớn; query của người khác bị từ chối; đường dẫn chưa thiết kế bị từ chối; repository: xung đột không ghi đè, cách ly tài khoản.

Hạn chế: nhiều ca bị từ chối do lỗi đánh giá (trường thiếu) thay vì `false` tường minh — kết quả vẫn là từ chối. Phần tử bên trong list (goals, income, expense) không được Rules kiểm tra kiểu (Rules không lặp được list); giới hạn bằng số phần tử + 1 MiB/tài liệu + validation ở client. Chỉ ảnh hưởng dữ liệu của chính người dùng.

## Kiểm toán bằng skill
- `firebase-security-rules-auditor`: điểm **4/5** (minor). Phát hiện: map không giới hạn, `reasons` không kiểm kiểu → **đã sửa** + test hồi quy. Phần tử list không kiểm kiểu → chấp nhận (lý do ở trên).
- `security-audit` (Cloudflare): **chưa chạy toàn bộ quy trình** (chế độ full audit cần nhiều agent và tệp báo cáo riêng, chưa được yêu cầu rõ). Đã chạy ở **chế độ tập trung** (đọc mã, không thực thi) trên: `src/` (tìm sink DOM: không có `innerHTML/eval/document.write`), `firestore.rules` (owner-only, `hasOnly`, rev, deny mặc định, không delete), `.github/` (mọi action ghim SHA, `permissions` tối thiểu, không `pull_request_target`; `${{ }}` chỉ dùng cho tên repo/ref không do kẻ tấn công điều khiển). Kết quả: **không có phát hiện đã xác nhận** vượt ranh giới tin cậy.
- **Full audit (skill security-audit, profile standard, chỉ đọc mã, 18 lần gọi agent, 11 đơn vị phủ):** 0 phát hiện xác nhận; 1 hướng cần kiểm chứng (Rules không giới hạn nội dung phần tử + đăng ký mở → rủi ro hạn mức Spark, phụ thuộc App Check/quota ngoài mã); 1 ứng viên bị bác (lịch sử git: không có credential). Trạng thái incomplete: hai bộ kiểm tra của skill không chạy được trên Windows (thiếu O_NOFOLLOW) và không có sandbox nên không thực thi mã đích. Báo cáo đầy đủ nằm ngoài repo (thư mục chạy của kiểm toán); lưu ý Mockup.xlsx và MASTER-PROMPT.txt đã gỡ khỏi cây ở commit 475561f nhưng vẫn còn trong lịch sử git công khai. Ghi nhận không phải lỗ hổng: phần tử trong list không kiểm kiểu — chỉ tác động tới dữ liệu của chính chủ.

## Rà soát thủ công
- XSS: UI dựng DOM bằng `textContent`/`setAttribute`, không `innerHTML` (`src/ui/dom.js`).
- Secrets: quét working tree — chỉ có Firebase Web API key (công khai theo thiết kế). Không có token/private key. `.gitignore` chặn `.env*`, `*-key.json`, `serviceAccount*.json`, log.
- Dependencies: `npm audit` = 0 lỗ hổng sau khi ép `@grpc/grpc-js` ≥ 1.14.7 (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4; chỉ ảnh hưởng gRPC phía Node, bundle trình duyệt không dùng). Toàn bộ test chạy lại đạt.
- Emulator/production: bản build production không chứa kết nối emulator hay projectId demo (đã kiểm tra `dist/`).
- Đổi tài khoản: session cũ bị hủy, DOM xóa sạch.

## GitHub Actions
- `permissions: contents: read` mặc định; chỉ job deploy có `pages: write` + `id-token: write`.
- Mọi action pin theo full commit SHA (đã tra bằng GitHub API); `persist-credentials: false`; không dùng `pull_request_target`; không secret; không dùng dữ liệu PR trong lệnh shell.
- `firebase-tools@15.34.2` cài với phiên bản cố định; `npm ci` theo lockfile; Dependabot cho npm + actions.

## Rủi ro còn tồn tại
- Email/Password provider phải được bật thủ công trong Console (chưa xác minh trên production).
- Không có App Check (tùy chọn; chưa cấu hình).
- Trạng thái Billing của project **chưa xác minh bằng công cụ** (CLI không cung cấp lệnh đọc billing); người dùng xác nhận là Spark.

