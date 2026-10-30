# Luồng người dùng

1. **Đăng ký/Đăng nhập** — Email + mật khẩu (≥ 6 ký tự). Nút bị khóa trong lúc gửi; lỗi hiển thị ngay dưới form.
2. **Lần đầu** — plan mặc định từ mockup được tạo một lần trên Firestore; tháng chưa có dữ liệu hiển thị rỗng.
3. **Tổng quan** (`#overview`) — thẻ tổng thu/chi/tiết kiệm năm, biểu đồ cột 12 tháng, bảng tháng + lũy kế chênh lệch. Trạng thái rỗng khi chưa có thu chi.
4. **Mục tiêu** (`#goals`) — sửa giá trị/năm/lãi/đã trả/tích lũy và danh mục sản phẩm; kết quả và lộ trình tính lại ngay; dữ liệu tự lưu. Ô nhập sai được đánh dấu `aria-invalid` và không ghi.
5. **Thu chi** (`#budget`) — chọn tháng; thêm dòng thu/chi (validation: ngày + số không âm, tối đa 200 dòng); xóa dòng có hộp xác nhận; nhập kế hoạch theo khoản mục; bảng kế hoạch/thực tế/chênh lệch.
6. **Cài đặt** (`#settings`) — năm bắt đầu, tuổi, tỷ lệ tiết kiệm, năm đang xem.
7. **Đồng bộ** — thanh trên hiển thị: Có thay đổi chưa lưu… → Đang lưu… → Đã lưu lên máy chủ; hoặc lỗi/xung đột. Rời trang khi chưa lưu → trình duyệt cảnh báo.
8. **Đăng xuất / đổi tài khoản** — lưu nốt, xóa toàn bộ dữ liệu khỏi màn hình, quay về đăng nhập.
