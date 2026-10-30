# Đối chiếu mockup

Mockup là bảng tính (không có ảnh giao diện), nên "dựng mockup" được hiểu là dựng ứng dụng tương tác theo các sheet. Màn hình ↔ sheet:

| Sheet | Màn hình | Đáp ứng | Còn thiếu |
|---|---|---|---|
| Từ khóa | `src/domain/catalog.js` + Cài đặt | Danh mục, sản phẩm, năm, tuổi | Chưa cho người dùng sửa danh mục/sản phẩm |
| Mục tiêu bản thân | Mục tiêu, Cài đặt | Mục tiêu nợ/đầu tư, tỷ lệ tiết kiệm | Văn bản tự đánh giá (đích đến, gia đình, môi trường làm việc) |
| Mục tiêu tài chính | Mục tiêu | Phần 1, Phần 2 | Phần 3 (tích lũy theo sản phẩm) |
| Cân đối lộ trình nghề nghiệp | Mục tiêu (lộ trình) | Thu nhập cần có theo tuổi | Phân bổ tài sản, kỹ năng, thu nhập thực tế vs lộ trình |
| Kế hoạch thu nhập và chi tiêu | Thu chi | Kế hoạch theo khoản mục (mỗi tháng) | Mockup dùng 1 kế hoạch cho cả năm; app lưu theo tháng |
| T1..T12 | Thu chi | Nhật ký, tổng kết, chênh lệch | Lý do/Biện pháp; bảng phát triển bản thân |
| Dashboard | Tổng quan | Tổng năm, bảng tháng, lũy kế, biểu đồ thu/chi | Sinh lời ước tính (R6), tổng tiết kiệm cần đạt (L6), chi phát triển bản thân |
| Bảng khảo sát | — | — | Chưa làm |

## Dữ liệu/công thức chưa rõ
- I86 "TG sống dự kiến sau khi nghỉ hưu (năm)" được dùng làm số kỳ tháng trong PV → giữ nguyên công thức.
- Dashboard L6 chỉ cộng S9:S18 (bỏ 2 mục tiêu cuối) → chưa đưa lên UI vì nghi là lỗi phạm vi.
- `Dashboard!E102` lỗi `#REF!` và `F90:I90` nhập cứng 0.

## Rủi ro
- Tên khoản mục dùng làm khóa map trong Firestore; đổi tên danh mục sau này cần migration.
