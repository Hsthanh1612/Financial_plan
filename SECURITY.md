# Chính sách bảo mật

## Báo cáo lỗ hổng
Vui lòng **không** mở issue công khai. Dùng mục "Report a vulnerability" (Security → Advisories) của repository này, hoặc liên hệ chủ repository qua email trên hồ sơ GitHub.

## Phạm vi
- Frontend tĩnh trên GitHub Pages; dữ liệu nằm trong Cloud Firestore, bảo vệ bằng Firebase Authentication và `firestore.rules`.
- Cấu hình Web của Firebase (`src/services/firebase/app.js`) là định danh công khai, không phải bí mật.
- Không có service-account key hoặc Admin SDK trong repository.
