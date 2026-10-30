# Financial_plan — Kế hoạch tài chính cá nhân

Ứng dụng web dựng từ `Mockup.xlsx`: lập mục tiêu tài chính, tính số tiền cần tiết kiệm mỗi tháng (công thức PMT/PV giống Excel), lộ trình thu nhập cần có theo năm/tuổi, và theo dõi thu chi 12 tháng. Dữ liệu lưu trên Cloud Firestore, tự động đồng bộ.

## Stack
- HTML/CSS/JavaScript thuần (ES modules) + Vite để build.
- Firebase Web SDK: Authentication (Email/Mật khẩu) + Cloud Firestore. Gói **Spark**, không Cloud Functions, **không Firebase Hosting**.
- Triển khai web tĩnh bằng **GitHub Pages** qua GitHub Actions.

Kiến trúc: `docs/ARCHITECTURE.md`. Công thức: `docs/ALGORITHM-SPEC.md`. Dữ liệu: `docs/DATA-MODEL.md`.

## Chạy local
```bash
npm ci
npm run dev                      # dùng Firebase production (cần đăng nhập)
```
Chạy với emulator (không chạm production):
```bash
firebase emulators:start --only firestore,auth --project demo-financial-plan-test
# terminal khác (PowerShell): $env:VITE_USE_EMULATOR="1"; npm run dev
```

## Kiểm thử
| Lệnh | Nội dung |
|---|---|
| `npm run test:unit` | Công thức tài chính, lộ trình, thu chi, autosave (đối chiếu số Excel) |
| `npm run test:rules` | Security Rules + repository trên Firestore Emulator (cần Java 21 + firebase-tools) |
| `npm run test:e2e` | Trình duyệt thật (Edge/Chrome) + Emulator Auth/Firestore |
| `npm run build` | Build production vào `dist/` |

Máy ít RAM: đặt `JAVA_TOOL_OPTIONS="-Xmx160m -XX:+UseSerialGC"` và `NODE_OPTIONS="--max-old-space-size=192"` trước khi chạy test emulator.

## Firebase
- Project: `financial-plan-project-2a92e`, database `(default)` Standard.
- Rules: `firestore.rules` — chỉ chủ sở hữu (`users/{uid}/…`), mặc định từ chối mọi đường dẫn khác. Indexes: `firestore.indexes.json` (rỗng có chủ đích).
- Triển khai Rules/indexes: `firebase deploy --only firestore`.
- Plan được khởi tạo tự động ở lần đăng nhập đầu từ dữ liệu mockup (`src/domain/defaultPlan.js`), chạy lại không ghi đè.
- **Bật đăng nhập Email/Mật khẩu**: Firebase Console → Authentication → Sign-in method → Email/Password (bắt buộc trước khi dùng bản production).

## Triển khai
Push lên `main` → workflow `Deploy GitHub Pages` chạy test (unit, rules, e2e) rồi build và deploy. Không cần secret.

## Điều cấm (chi phí 0 đồng)
Không chuyển Spark → Blaze, không liên kết Billing Account, không dùng Firebase Hosting/App Hosting, Cloud Functions, Phone Auth hay tính năng cần billing (backup/PITR/TTL).

## Lỗi thường gặp
- `auth/operation-not-allowed`: chưa bật Email/Password trong Console.
- `permission-denied`: dữ liệu sai cấu trúc hoặc không phải của bạn (xem Rules).
- "Dữ liệu đã thay đổi ở nơi khác": có phiên khác đã ghi — tải lại trang (chống ghi đè bằng `rev`).
- Emulator báo thiếu bộ nhớ Java: xem mục Kiểm thử.
