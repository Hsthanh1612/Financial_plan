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

## Mô phỏng tích lũy và phân bổ tài sản (Phần 3, Cân đối lộ trình)
| # | Quy tắc | Nguồn Excel | Code |
|---|---|---|---|
| 13 | Số dư sản phẩm mỗi mục tiêu: đang hoạt động = nạp (tiền/năm × tỷ trọng) + số dư năm trước × (1 + lợi suất sản phẩm); hết hạn = 0 | F154, X160, AD154… | `simulate` |
| 14 | Mục tiêu có cờ `holdAfterEnd` (mặc định bật cho Hưu trí): sau khi kết thúc giữ số dư và sinh lãi, không nạp thêm | AP154 | `simulate` |
| 15 | Nhóm tài sản: Cổ phiếu = ETF + DCBC + DCDS; Trái phiếu = DCBF + TP Techcombank + TP FE Credit; Bảo hiểm = BH thuần túy + BH liên kết; Tiền gửi = Finhay + Tiền gửi NH | hàng 221, Y–AB | `GROUPS`, `classShare` |
| 16 | Mức sinh lời cần thiết = Σ (lợi suất nhóm × tỷ trọng nhóm); lợi suất nhóm = trung bình lợi suất các sản phẩm trong nhóm (Cổ phiếu riêng lẻ = (0,12+0+0+0)/4) | hàng 220, V221 | `requiredReturn` |
| 17 | Trung bình 30 năm đầu (năm không có số dư tính 0) | V251 → Dashboard R6 | `averageRequiredReturn` |
| 18 | Mốc tuổi: tuổi hiện tại, +5 … (6 mốc) | Cân đối E24:E29 | `milestones` |

Đối chiếu Excel (unit test): tiền gửi của Du lịch 2023/2024/2025 = 5,2533 / 10,7692 / 16,5609 (F153–F155); tiền gửi của Khởi nghiệp 2028 = 41,3638 và 2030 = 130,3995 (X153, X160).

### Điểm KHÁC Excel (quyết định thiết kế có chủ đích, vì công thức Excel không tổng quát hóa được)
1. **Năm đầu tiên**: Excel cộng khoản nạp của các mục tiêu 7–10 (Khởi nghiệp, Mua chung cư, Quỹ học, Hưu trí) vào năm 2023 dù chưa bắt đầu (công thức hàng 153 không kiểm tra năm). Đã xác minh bằng số: giả thuyết này tái hiện đúng phân bổ năm 2023 của Excel (cổ phiếu 0,2357; trái phiếu 0,3454; bảo hiểm 0,0851; tiền gửi 0,3338). App **không sao chép lỗi này**.
2. **Mục tiêu 9 (Quỹ học)**: Excel nạp mọi năm bất kể thời gian mục tiêu, rồi từ hàng 171 rút/nạp xen kẽ theo từng hàng làm số dư âm (AJ179 = −80,5). Hành vi này không xác định được từ mockup, nên app áp dụng quy tắc đều đặn (13) cho mục tiêu này.
3. Do (1) và (2), phân bổ và mức sinh lời cần thiết của app **không trùng** số trong Excel (ví dụ mức sinh lời trung bình khác 9,97% của Dashboard R6). Giao diện ghi rõ đây là ước tính.
4. **Bảng lộ trình nghề nghiệp**: cột "Số tiền cần có" của Excel lệch tuổi (G40 ứng với tuổi 25 lại lấy dữ liệu năm 2023 tuổi 21). App xếp đúng theo tuổi.

## Khảo sát
| # | Quy tắc | Nguồn | Code |
|---|---|---|---|
| 19 | Điểm = tổng điểm đáp án đã chọn (cột E); Khảo sát 1 (10 câu), Khảo sát 2 (11 câu) | F5:F58, F64:F125 | `scoreSurvey` |
| 20 | Rủi ro: 6–17 ngại rủi ro; 18–27 trung lập; còn lại chấp nhận rủi ro | A59 | `riskResult` |
| 21 | Hoàn cảnh: 11–20 không thuận lợi; 21–29 ít thuận lợi; 30–38 bình thường; 39–41 thuận lợi; còn lại cực kỳ thuận lợi | A126 | `circumstanceResult` |

Giữ đúng quirk của mockup: Khảo sát 1 câu 1, đáp án "4" và ">4" không có điểm (cột E trống) nên tính 0 — đây chính là điều kiện cho tổng mẫu 23 điểm. Mẫu mockup: 23 điểm → trung lập; 36 điểm → bình thường (test khớp A59, A126). App chỉ đưa kết luận khi đã trả lời đủ (Excel trả "chấp nhận rủi ro" cho khảo sát trống do ngưỡng "còn lại").

## Chi phí phát triển bản thân
Nhật ký riêng theo tháng (ngày, danh mục, mô tả, số tiền, kết quả dự kiến/thực tế); thống kê theo danh mục = SUMIF (T*!AE92:AE101) và bảng 12 tháng (Dashboard 98–109). Danh mục: Mua sách, Khóa học ngắn hạn, Khóa học dài hạn, Tham gia các buổi diễn thuyết, Chi phát triển bản thân khác (dòng #REF! của mockup bị loại).

## Chưa triển khai
- Tổng tiết kiệm cần đạt (Dashboard L6 = SUM(S9:T18), chỉ cộng 8 trong 10 mục tiêu của mockup — nghi lỗi phạm vi, mockup không giải thích).
- Văn bản tự đánh giá trong sheet "Mục tiêu bản thân" (đích đến, gia đình, môi trường làm việc).
- Các biểu đồ khác của Excel (app chỉ có biểu đồ thu/chi).
