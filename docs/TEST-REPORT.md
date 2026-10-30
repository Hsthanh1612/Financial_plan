# Báo cáo kiểm thử

Ngày: 2026-10-31. Kết quả lấy từ lần chạy thật; CI = GitHub Actions run trên commit `f35cb7e` (kết luận `success`).

| Lệnh | Phạm vi | Kết quả | Nơi chạy |
|---|---|---|---|
| `npm run test:unit` | 19 test: công thức PMT/PV, mục tiêu, lộ trình, thu chi, autosave | 19/19 đạt | Local + CI |
| `npm run test:rules` | 17 test: Security Rules (11) + repository ↔ Firestore Emulator (6) | 17/17 đạt | Local + CI |
| `npm run test:e2e` | 9 bước trên trình duyệt thật + Emulator Auth/Firestore | 9/9 đạt | Local (Edge) + CI (Chrome) |
| `npm run build` | Build production | Đạt | Local + CI |
| `npm audit` | Dependency | 0 lỗ hổng | Local + CI (`--omit=dev --audit-level=high`) |

## Đối chiếu số liệu với Excel
Tiền trả/tháng của 8 mục tiêu và "thu nhập cần có" các năm 2023, 2024, 2028, 2031, 2037, 2052 khớp giá trị Excel (sai số < 1e-9). Xem `docs/ALGORITHM-SPEC.md`.

## Lỗi tìm thấy bằng test và đã sửa
1. **Trang Tổng quan hiện chữ `undefined` sau đăng ký** — `overviewPage` trả về phần tử thay vì `{el, update}`. Unit test không bắt được; e2e bắt được (lần CI đầu thất bại). Đã sửa.
2. **Tràn ngang 24px ở 375px** trên trang Thu chi (chỉ xảy ra trên Chrome/Linux của CI). Đã sửa bằng CSS (`min-width`, `max-width`, `flex-basis` cho ô form); CI lần sau đạt. Test hiện đo cả 4 trang và in phần tử gây tràn.
3. Rules: map kế hoạch không giới hạn, `reasons` không kiểm kiểu (từ kiểm toán skill) — đã sửa kèm test hồi quy.
4. Lỗ hổng gRPC (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4) qua dependency của Firebase SDK — ép `@grpc/grpc-js` ≥ 1.14.7, chạy lại toàn bộ test.

## Chưa kiểm thử / hạn chế
- **Đăng nhập thật trên production**: Authentication chưa được khởi tạo trong project (probe Identity Toolkit trả `CONFIGURATION_NOT_FOUND`), nên luồng đăng ký/đăng nhập, đọc/ghi dữ liệu thật qua trang GitHub Pages **chưa chạy được và chưa kiểm thử**.
- Rules production đã deploy nhưng chưa được kiểm tra bằng người dùng thật (chỉ kiểm thử qua Emulator).
- Missing-index: không có composite index; truy vấn tháng chỉ dùng documentId nên chưa cần.
- Hiệu năng/bundle: JS 593 kB (gzip ~179 kB), chưa tối ưu tách chunk. Chưa đo trên thiết bị yếu.
- Test Rules: nhiều ca bị từ chối do lỗi đánh giá chứ không phải `false` tường minh.
- Chưa có test trình duyệt cho: xung đột `rev` giữa hai phiên, mất mạng giữa chừng (chỉ có unit test cho autosave và test repository).
- Môi trường dev RAM thấp (~600 MB trống) khiến vài lần chạy local lỗi OOM; đã chạy lại bằng cấu hình bộ nhớ thấp (ghi trong README).
