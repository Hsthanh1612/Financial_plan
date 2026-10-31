# Đối chiếu mockup

Mockup là bảng tính (không có ảnh giao diện), nên "dựng mockup" được hiểu là dựng ứng dụng tương tác theo các sheet. Màn hình ↔ sheet:

| Sheet | Màn hình | Đáp ứng | Còn thiếu |
|---|---|---|---|
| Từ khóa | `src/domain/catalog.js` + Cài đặt | Danh mục, sản phẩm, năm, tuổi | Chưa cho người dùng sửa danh mục/sản phẩm |
| Mục tiêu bản thân | Mục tiêu, Cài đặt | Mục tiêu nợ/đầu tư, tỷ lệ tiết kiệm | Văn bản tự đánh giá (đích đến, gia đình, môi trường làm việc) |
| Mục tiêu tài chính | Mục tiêu | Phần 1, 2, 3 (mô phỏng tích lũy) | Mục tiêu 9 dùng quy tắc đều đặn thay vì công thức làm tay của Excel |
| Cân đối lộ trình nghề nghiệp | Lộ trình | Phần 1 (phân bổ, sinh lời cần thiết, kỹ năng), Phần 2 (thực tế/lộ trình/cần có) | Biểu đồ |
| Kế hoạch thu nhập và chi tiêu | Thu chi | Kế hoạch theo khoản mục (mỗi tháng) | Mockup dùng 1 kế hoạch cho cả năm; app lưu theo tháng |
| T1..T12 | Thu chi | Nhật ký, tổng kết, chênh lệch, Lý do/Biện pháp, bảng phát triển bản thân | — |
| Dashboard | Tổng quan | Tổng năm, bảng tháng, lũy kế, biểu đồ thu/chi, sinh lời cần thiết (R6), chi phát triển | Tổng tiết kiệm cần đạt (L6) |
| Bảng khảo sát | Khảo sát | 2 khảo sát, điểm và kết luận | — |

## Dữ liệu/công thức chưa rõ
- I86 "TG sống dự kiến sau khi nghỉ hưu (năm)" được dùng làm số kỳ tháng trong PV → giữ nguyên công thức.
- Dashboard L6 chỉ cộng S9:S18 (bỏ 2 mục tiêu cuối) → chưa đưa lên UI vì nghi là lỗi phạm vi.
- `Dashboard!E102` lỗi `#REF!` và `F90:I90` nhập cứng 0.

## Rủi ro
- Tên khoản mục dùng làm khóa map trong Firestore; đổi tên danh mục sau này cần migration.
