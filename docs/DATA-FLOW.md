# Phân tích luồng dữ liệu của Mockup.xlsx

Nguồn: `Mockup.xlsx` (20 sheet, ~2.000 công thức). Đơn vị tiền: triệu đồng.
Trích xuất bằng cách giải nén XML của xlsx và đọc công thức thô (không suy diễn từ tên sheet).

## 1. Phân loại sheet

| Nhóm | Sheet | Vai trò |
|---|---|---|
| Cấu hình | Từ khóa | Danh mục dùng chung, năm bắt đầu (E7=2023), tuổi (L7=21), bảng sản phẩm đầu tư (tên, lợi suất TB 5 năm Z:AB, rủi ro AC) |
| Nhập liệu | Mục tiêu bản thân | Đích đến, mục tiêu nợ (I9:S11), mục tiêu đầu tư (I14:S20), tỷ lệ tiết kiệm mục tiêu (I24 = 40%) |
| Nhập liệu | Kế hoạch thu nhập và chi tiêu | Kế hoạch tháng: thu L11:L18, chi L26:L40 |
| Nhập liệu | T1…T12 | Nhật ký thu (N27:N36), chi (N42:N82) theo ngày; lý do, biện pháp |
| Nhập liệu | Bảng khảo sát | Đánh dấu X; cột E = điểm đáp án, F = điểm nếu chọn |
| Tính toán | Mục tiêu tài chính | Lõi thuật toán (PMT/PV, lịch năm, danh mục đầu tư, giá trị tích lũy) |
| Tính toán | Cân đối lộ trình nghề nghiệp | Tổng hợp theo mốc tuổi, so sánh thu nhập thực tế với lộ trình |
| Hiển thị | Dashboard | Tổng hợp 12 tháng, biểu đồ |

## 2. Sơ đồ luồng

```
Từ khóa ──(danh mục chi/thu)──────────────► T1..T12 (cột P: tên khoản mục)
Từ khóa ──(sản phẩm, lợi suất, rủi ro)───► Mục tiêu tài chính (SUMIF theo tên sản phẩm)

Kế hoạch thu chi ──(kế hoạch)────────────► T1..T12 (cột T: Kế hoạch)
T1..T12: nhật ký ──SUMIF theo khoản mục──► cột W (Thực tế) ──► X (chênh lệch)
T1..T12 ──W27:W34, W42:W56, AE92:AE101──► Dashboard (bảng thu / chi / phát triển bản thân)
Dashboard: Tiết kiệm = Tổng thu − Tổng chi (theo tháng, và năm)

Bảng khảo sát ──(điểm)──► kết luận A59 (rủi ro), A126 (hoàn cảnh) ──► Mục tiêu bản thân K49, K52

Mục tiêu bản thân (nợ / mục tiêu đầu tư: tuổi, nội dung, giá trị) ──► Mục tiêu tài chính (tiêu đề + giá trị)
Từ khóa (năm bắt đầu, tuổi) ──► Mục tiêu tài chính (lịch năm/tuổi)

Mục tiêu tài chính:
   mỗi mục tiêu → số tiền cần/tháng (PMT) → lịch năm 107..145 (cột G..Y) → AA = tổng/năm
   AB = AA / Mục tiêu bản thân!I24  (= "thu nhập cần có", tức tiết kiệm/tỷ lệ tiết kiệm)
   → phân bổ theo sản phẩm (hàng 153+) → gom theo nhóm tài sản (hàng 186+, 221+)
   → V221.. = mức sinh lời cần thiết; V251 = trung bình → Dashboard R6

Cân đối lộ trình: SUMIF theo tuổi (mốc 21, +5, +5…) lấy AB (thu nhập cần có), tỷ trọng cổ phiếu/TP/BH/tiền gửi (Y,Z,AA,AB 221+), V (sinh lời cần thiết)
   G40.. = Mục tiêu tài chính!AB107.. ("số tiền cần có") so với F (thu nhập thực tế) và H (lộ trình nghề nghiệp)
Dashboard L6 = SUM(Mục tiêu bản thân!S9:T18) (tổng giá trị mục tiêu, tức 2.850 — chỉ gồm S9:S18, không gồm mục tiêu 9, 10)
```

## 3. Công thức lõi (nguồn: XML)

- Số năm: `O = IF(NămKT − NămBĐ > −0.1, NămKT − NămBĐ + 1, 0)`
- Tiền trả/tháng (nợ): `O15 = IF(O14=0,0,−PMT(LS/12, O14*12, GiáTrịCònLại))`, `GiáTrịCònLại = GiáTrị − ĐãTrả`
- Tiền tiết kiệm/tháng (mục tiêu đầu tư): `−PMT(LS/12, năm*12, TíchLũyHiệnCó, MụcTiêu)`; MụcTiêu cần đạt = `Giá trị − Tích lũy hiện có`
- Hàng năm: `= tháng * 12`
- Lợi suất kỳ vọng: `U44 = SUMPRODUCT(tỷ trọng, lợi suất)` (fallback IFERROR khi ô trống); tra lợi suất/rủi ro bằng `SUMIF` theo tên sản phẩm trong Từ khóa
- Rủi ro mỗi sản phẩm: `SUMIF` cột AC của Từ khóa
- Hưu trí: `O87 = −PV(LS/12, TG sống sau hưu (tháng?), chi/tháng, để lại)`; `O97 = Chi phí năm / số tháng dự phòng`
- Lịch năm: giá trị mỗi năm = số tiền/tháng×12 nếu năm nằm trong [BĐ, KT], ngược lại 0 (có ô điều kiện M107=0…)
- Giá trị tích lũy theo sản phẩm: `F154 = IF(M108=0,0, Pmt*TỷTrọng + F153*(1+LS))` (cộng dồn lãi kép theo năm); giai đoạn hưu trí rút `−I87*12*tỷ trọng`
- Nhóm tài sản (hàng 220): Cổ phiếu/ETF (F,H…), Trái phiếu, Bảo hiểm, Tiền gửi — lợi suất nhóm là AVERAGE các sản phẩm trong nhóm

## 4. Vấn đề/giả định chưa xác minh

1. Các `SUMIF` tra lợi suất dùng phạm vi 3 cột (`Từ khóa!W:Y`, `Z:AB`) nhưng dữ liệu chỉ nằm ở cột đầu của mỗi phạm vi (W, Z). Cách khớp theo vị trí tương ứng này cần giữ khi cài đặt.
2. Mục tiêu hưu trí: đơn vị của `I86` ("TG sống dự kiến sau hưu (năm)") được dùng trực tiếp làm `nper` của `PV` với lãi/12 — nếu là năm thì đang trộn đơn vị. **Chưa xác minh**, giữ y nguyên công thức khi cài đặt và ghi nhận.
3. Dashboard `L6` bỏ qua hai mục tiêu cuối (S19, S20) và chỉ lấy S9:S18 → khác tổng 3.850. Là hành vi của mockup; giữ nguyên.
4. `Dashboard!E102` lỗi `#REF!` (nhãn "Khóa học dài hạn" liên kết hỏng), và `F90:I90` nhập cứng 0.
5. Phạm vi chưa đọc từng ô: Phần 3 hàng 150–220 của sheet Mục tiêu tài chính (chỉ đọc mẫu công thức), T2–T12 (cùng cấu trúc T1, đã xác nhận qua Dashboard), Bảng khảo sát hàng 21–126 (chỉ đọc 20 hàng đầu và công thức điểm).
6. Biểu đồ (chart1.xml…) chưa phân tích chi tiết kiểu/series.
