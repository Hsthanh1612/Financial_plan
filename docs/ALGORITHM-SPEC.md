# Đặc tả thuật toán

Nguồn: công thức thô trong `Mockup.xlsx` (xem `docs/DATA-FLOW.md`). Code: `src/domain/`. Kỳ vọng kiểm thử lấy từ giá trị Excel đã tính.

| # | Quy tắc | Công thức Excel | Code | Kỳ vọng (test) |
|---|---|---|---|---|
| 1 | Số năm mục tiêu | `IF(KT−BĐ>−0.1, KT−BĐ+1, 0)` | `goalYears` | 2037–2052 → 16; KT<BĐ → 0 |
| 2 | Trả nợ/tháng | `IF(n=0,0,−PMT(ls/12, n·12, Giá trị − Đã trả))` | `monthlyDebtPayment` | 0,92492502694696199 |
| 3 | Lợi suất mục tiêu | `SUMPRODUCT(tỷ trọng, lợi suất)`; lợi suất tra theo tên sản phẩm (Từ khóa) | `goalReturn` | Du lịch 8,65%; Đám cưới 10,75%; Quỹ học 14,5% |
| 4 | Tiết kiệm/tháng | `IF(n=0,0,−PMT(ls/12, n·12, đã có, mục tiêu))` | `monthlySaving` | 0,8755; 1,6853; 1,6066; 6,8940; 2,9006; 2,6576 |
| 5 | Đích quỹ "cho con đi học" | `−PV(ls/12, I86, I87, I88)` (I86=30 dùng làm số kỳ — giữ nguyên mockup) | `summarizeGoal` kind `fund` | 724,30582410044906 → 0,6051/tháng |
| 6 | Mỗi năm | `tháng × 12` | — | 11,0991 |
| 7 | Lộ trình năm | AA = Σ tiền/THÁNG của mục tiêu có năm ∈ [BĐ, KT] | `buildSchedule` | 2023: 2,5609 |
| 8 | Thu nhập cần có | AB = AA ÷ tỷ lệ tiết kiệm (40%) | `buildSchedule` | 2023 6,4022; 2024 10,4187; 2028 28,5028; 2031 32,6432; 2037 17,7205; 2052 2,3123 |
| 9 | Thực tế theo khoản mục | `SUMIF(cột khoản mục, tên, số tiền)` | `actualByCategory` | — |
| 10 | Chênh lệch | Thu: thực tế − kế hoạch; Chi: kế hoạch − thực tế | `compareWithPlan` | T1 thu nhập khác: −6 |
| 11 | Tiết kiệm tháng | Tổng thu − Tổng chi | `summarizeMonth` | — |
| 12 | Lũy kế chênh lệch | F93 = KH1 − Chi1; G93 = F93 + KH2 − Chi2 | `summarizeYear` | 1; 0,3 |

## Điều kiện biên
- Đầu vào không phải số hữu hạn → `TypeError`; `nper = 0` → `RangeError`; lãi 0% → chia đều.
- Số tiền âm trong nhật ký → từ chối. Tỷ lệ tiết kiệm ≤ 0 → `RangeError`.
- Sản phẩm không có trong danh mục → bỏ qua khi tính lợi suất.

## Chưa triển khai (có trong mockup, chưa đủ thông tin/thời gian kiểm chứng)
- Phần 3 sheet "Mục tiêu tài chính": mô phỏng tích lũy lãi kép theo từng sản phẩm (hàng 153–182), gom theo nhóm tài sản (hàng 186–250) và "mức sinh lời cần thiết" (V251) → Dashboard R6.
- Sheet "Cân đối lộ trình nghề nghiệp": phân bổ cổ phiếu/trái phiếu/bảo hiểm/tiền gửi theo mốc tuổi và bảng thu nhập thực tế vs lộ trình (đang chỉ có "thu nhập cần có" theo năm/tuổi).
- "Bảng khảo sát" khả năng chịu rủi ro (chấm điểm) và kết luận.
- Bảng "Chi phí phát triển bản thân" theo tháng (Dashboard hàng 98–109).
