# Yêu cầu

Nguồn duy nhất về nghiệp vụ: `Mockup.xlsx` (phân tích ở `docs/DATA-FLOW.md`).

## Chức năng
| Mã | Yêu cầu | Nguồn mockup | Trạng thái |
|---|---|---|---|
| F1 | Đăng nhập; mỗi người chỉ thấy dữ liệu của mình | (yêu cầu dữ liệu cá nhân + MASTER-PROMPT) | Đã làm |
| F2 | Cài đặt: năm bắt đầu, tuổi, tỷ lệ tiết kiệm mục tiêu | Từ khóa E7, L7; Mục tiêu bản thân I24 | Đã làm |
| F3 | Mục tiêu trả nợ và đầu tư: giá trị, năm BĐ/KT, lãi vay, đã trả/tích lũy, danh mục ≤3 sản phẩm | Mục tiêu bản thân, Mục tiêu tài chính Phần 1 | Đã làm (sửa; chưa thêm/xóa mục tiêu) |
| F4 | Tính tiền cần trả/tiết kiệm mỗi tháng, mỗi năm, lợi suất kỳ vọng | Mục tiêu tài chính Phần 1 | Đã làm |
| F5 | Lộ trình theo năm/tuổi: tổng tiền/tháng, thu nhập cần có | Mục tiêu tài chính Phần 2; Cân đối lộ trình cột F | Đã làm |
| F6 | Kế hoạch thu/chi theo khoản mục mỗi tháng | Kế hoạch thu nhập và chi tiêu; T1..T12 cột T | Đã làm (theo từng tháng) |
| F7 | Nhật ký thu/chi theo ngày; tổng kết kế hoạch/thực tế/chênh lệch | T1..T12 | Đã làm (chưa có cột Lý do/Biện pháp trên UI) |
| F8 | Dashboard năm: tổng thu/chi/tiết kiệm, bảng 12 tháng, lũy kế chênh lệch, biểu đồ | Dashboard | Đã làm (một phần, xem dưới) |
| F9 | Mô phỏng tích lũy theo sản phẩm, phân bổ tài sản theo tuổi, sinh lời cần thiết | Mục tiêu tài chính Phần 3; Cân đối lộ trình G–O | **Chưa làm** |
| F10 | Khảo sát khả năng chịu rủi ro, khảo sát hoàn cảnh | Bảng khảo sát | **Chưa làm** |
| F11 | Chi phí phát triển bản thân theo tháng | Dashboard 98–109; T* AE92 | **Chưa làm** |

## Phi chức năng
- Tự động đồng bộ Firestore, không mất/ghi đè dữ liệu (rev + transaction), báo trạng thái thật.
- Bảo mật bằng Auth + Security Rules; không secret trong repo.
- Chi phí 0: Spark, không Hosting/Functions/Billing.
- Responsive (≥ 375 px), light/dark, bàn phím, `prefers-reduced-motion`.

## Tiêu chí nghiệm thu
Kết quả tính khớp Excel (unit test), Rules test đạt, e2e đạt trên CI, deploy Pages thành công và mở được.
