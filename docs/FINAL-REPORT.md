# Báo cáo nghiệm thu

Ngày: 2026-10-31. Trạng thái: **Đã xác minh** (có bằng chứng) · **Chưa xác minh** · **Bị chặn** · **Không áp dụng**.

## 1. Tổng quan
Ứng dụng web kế hoạch tài chính cá nhân dựng từ `Mockup.xlsx`: mục tiêu tài chính, tiền cần tiết kiệm/tháng (PMT/PV), lộ trình thu nhập cần có, thu chi 12 tháng, tự đồng bộ Cloud Firestore. Repo: https://github.com/Hsthanh1612/Finance-plan.

**Kết luận: CHƯA hoàn thành đầy đủ.** Code, test, CI/CD, Rules, Authentication và triển khai Pages đã đạt và dùng được trên production; còn thiếu một phần nghiệp vụ của mockup (mục 2 và 15) và còn dữ liệu thử cần dọn (mục 7).

## 2. Chức năng
| Chức năng | Trạng thái |
|---|---|
| Đăng nhập/đăng ký Email-Mật khẩu | Đã xác minh trên Emulator và trên production (smoke test) |
| Cài đặt kế hoạch; mục tiêu nợ/đầu tư/quỹ; lộ trình theo năm/tuổi | Đã xác minh (khớp Excel) |
| Thu chi theo tháng, kế hoạch/thực tế/chênh lệch, Tổng quan 12 tháng, biểu đồ | Đã xác minh (e2e) |
| Tự đồng bộ có debounce/transaction/xung đột | Đã xác minh (unit + integration + e2e) |
| Mô phỏng tích lũy theo sản phẩm, phân bổ tài sản, sinh lời cần thiết (F9) | **Chưa làm** |
| Khảo sát khả năng chịu rủi ro/hoàn cảnh (F10) | **Chưa làm** |
| Chi phí phát triển bản thân theo tháng (F11); Lý do/Biện pháp; thêm/xóa mục tiêu | **Chưa làm** |

## 3. Tài liệu nguồn đã kiểm tra
`Mockup.xlsx` (20 sheet; đọc công thức thô từ XML; Mục tiêu tài chính Phần 3 hàng 150–220, T2–T12 và phần sau Bảng khảo sát chỉ đọc mẫu; biểu đồ chưa phân tích), `MASTER-PROMPT.txt`. Chi tiết: `docs/DATA-FLOW.md`.

## 4. Kiến trúc/nghiệp vụ
`docs/ARCHITECTURE.md`, `docs/ALGORITHM-SPEC.md`, `docs/DATA-MODEL.md`.

## 5. Skills
Đã cài 74 skill (Matt Pocock 38, Superpowers 15, Vercel 9, Firebase 10, Cloudflare 1, Lucian 1) — **Đã xác minh** (có trong `skills-lock.json`, agent nhận diện). Đã **dùng thật**: `firebase-security-rules-auditor`, `web-design-guidelines`. Chưa dùng: `security-audit` (Cloudflare), `lucian-uxui` và các skill còn lại. Bỏ qua 3 skill Firebase Hosting/App Hosting/Xcode. Xem `docs/SKILLS-INVENTORY.md`.

## 6. Firebase
- Project ID `financial-plan-project-2a92e`; Firestore `(default)` Standard `FIRESTORE_NATIVE`, location **`asia-southeast1`** (Singapore), PITR tắt — **Đã xác minh** bằng `firestore:databases:get` (2026-10-31).
- Lịch sử: database đầu tiên do `deploy` tự tạo ở `nam5`; vì vùng không đổi được, đã xóa (database rỗng — Authentication chưa bật nên chưa ai ghi được dữ liệu) và tạo lại ở Singapore; Rules + indexes đã deploy lại.
- Web App `1:324357247643:web:e2d027f3eca3e5c416ac3e` — Đã xác minh.

## 7. Authentication, Rules, indexes
- Rules đã release lên production (`firebase deploy --only firestore`) — Đã xác minh; kiểm thử Emulator 17/17.
- Indexes: rỗng có chủ đích (không cần) — đã deploy.
- **Authentication: Đã xác minh** (2026-10-31): Email/Password đã bật (probe trả `INVALID_LOGIN_CREDENTIALS`). Smoke test trên production thật (`tests/e2e/production-smoke.mjs`): đăng ký → plan khởi tạo → mục tiêu tính đúng → tự lưu được server xác nhận → reload đọc lại đúng → không lỗi console: **6/6 đạt**.
- **Dữ liệu thử còn lại trên production**: tài khoản `smoke1793458169530@example.test` (Authentication) và tài liệu `users/<uid>/plan/main` của tài khoản đó. Lệnh dọn dẹp bị bộ phân loại quyền chặn nên chưa xóa; cần xóa thủ công trong Console (Authentication → Users; Firestore → users) hoặc cho phép mình xóa.

## 8. Khởi tạo plan
Cơ chế: `bootstrapPlan` tạo plan mặc định từ mockup ở lần đăng nhập đầu, chạy lại không ghi đè — Đã xác minh trên Emulator (integration + e2e). Trên production: Đã xác minh bằng smoke test (đăng ký → plan mặc định hiện đúng và lưu/reload được).

## 9. Tự đồng bộ
Debounce, ghi tuần tự, `rev`+transaction, retry mạng có giới hạn, không retry lỗi quyền, dừng khi xung đột — Đã xác minh (6 unit test, 6 integration, e2e reload).

## 10–11. Kết quả kiểm thử
Xem `docs/TEST-REPORT.md`: unit 19/19, Rules+repository 17/17, e2e 9/9 (Edge local, Chrome CI), build đạt, `npm audit` 0.

## 12. GitHub và CI/CD
- Repo `Hsthanh1612/Finance-plan` (public; đổi tên từ `Financial_plan` theo yêu cầu, remote đã cập nhật). Push `main` fast-forward, không force.
- CI và Deploy: **success** trên `f35cb7e` (lần đầu thất bại do 2 lỗi thật, đã sửa — xem TEST-REPORT).
- Workflow: `permissions: contents: read`; chỉ job deploy có `pages: write`/`id-token: write`; actions pin full SHA; không secret; không `pull_request_target`.
- Ruleset `protect-main`: chặn xóa và force push, yêu cầu check `test-build`; admin repo được bypass (để chủ repo push trực tiếp) — Đã xác minh tạo thành công.
- Secret scanning + push protection bật; Dependabot (cấu hình file) bật cho npm/actions; `default_workflow_permissions=read`. Dependabot security updates **chưa bật**; private vulnerability reporting **chưa xác minh** (lệnh không trả kết quả).
- Quét secret trong working tree và `git grep` — chỉ có Firebase Web API key (công khai theo thiết kế). Lịch sử Git chỉ có 4 commit của dự án này.

## 13. Triển khai
https://hsthanh1612.github.io/Finance-plan/ — Đã xác minh sau khi đổi tên repo (commit `ba01659`, CI + Deploy success): HTTP 200, JS/CSS tải đúng, bundle trỏ project production, asset tải đúng, bundle trỏ project production, không chứa emulator/localhost. Luồng đăng ký/lưu/reload đã chạy thật trên URL này (mục 7).

## 14. Billing/Spark
Không liên kết Billing, không nâng Blaze, không Hosting/Functions — **Đã xác minh** trong thao tác của mình (chỉ dùng `projects:create`, `apps:create`, `deploy --only firestore`). Trạng thái Billing của project **Chưa xác minh bằng công cụ** (CLI không có lệnh đọc billing); gói Spark là thông tin do người dùng cung cấp.

## 15. Lỗi còn tồn tại / chưa kiểm tra
- Dữ liệu thử trên production chưa dọn (mục 7).
- Nghiệp vụ chưa làm: F9, F10, F11 và một số mục trong `docs/MOCKUP-REVIEW.md`.
- Phần tử bên trong list (goals/income/expense) không được Rules kiểm kiểu (giới hạn bằng số phần tử).
- Chưa chạy trọn quy trình skill `security-audit`; chưa test e2e xung đột/mất mạng trên trình duyệt; smoke test production chỉ chạy một lần, thủ công, không nằm trong CI.
- Bundle 593 kB chưa tách chunk.

## 16. Việc cần quyền/hành động của người dùng
1. Xóa tài khoản/dữ liệu thử (mục 7) hoặc cho phép mình xóa.
2. Tùy chọn: chuyển repo sang private (Pages cần public trên gói GitHub Free — hiện repo là public và chứa `Mockup.xlsx` + `MASTER-PROMPT.txt`; xem xét có nên giữ công khai không).
3. Xác nhận Billing của project là chưa liên kết (Firebase Console → Usage and billing).

## 17. Giới hạn vận hành
Spark: 50.000 đọc/ngày, 20.000 ghi/ngày, 1 GiB (xác minh lại tại trang giá khi vận hành). Không có listener realtime; hai thiết bị cùng sửa sẽ nhận cảnh báo xung đột và phải tải lại.
