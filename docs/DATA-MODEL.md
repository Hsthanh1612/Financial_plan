# Mô hình dữ liệu (Cloud Firestore)

Nguồn nghiệp vụ: `docs/DATA-FLOW.md` (từ Mockup.xlsx). Mọi dữ liệu thuộc về một người dùng đăng nhập bằng Firebase Authentication.
Trạng thái: **thiết kế**; các quy tắc dưới đây đã được viết thành `firestore.rules` và kiểm thử bằng emulator (xem `docs/SECURITY-REVIEW.md`).

## Đường dẫn

```
users/{uid}/plan/main            -- 1 document: hồ sơ + mục tiêu (sheet Từ khóa, Mục tiêu bản thân, Mục tiêu tài chính)
users/{uid}/months/{yyyy-mm}     -- 1 document/tháng: kế hoạch + nhật ký thu chi (sheet T1..T12, Kế hoạch thu chi)
```

Mọi đường dẫn khác bị từ chối mặc định. `uid` trong đường dẫn phải bằng `request.auth.uid`.
Không dùng trường quyền/role do client sửa; không có trang admin trong mockup.

## `users/{uid}/plan/main`

| Trường | Kiểu | Bắt buộc | Nguồn mockup | Ghi chú |
|---|---|---|---|---|
| `startYear` | int 2000–2100 | có | Từ khóa!E7 | Năm bắt đầu theo dõi |
| `age` | int 0–120 | có | Từ khóa!L7 | Tuổi tại `startYear` |
| `savingRate` | number (0, 1] | có | Mục tiêu bản thân!I24 | Tỷ lệ tiết kiệm mục tiêu (0.4) |
| `goals` | list<map> ≤ 20 | có | Mục tiêu bản thân I9:S20 | xem dưới |
| `survey` | map ≤ 2 khóa | không | Bảng khảo sát | `{risk: {qi: oi}, circumstance: {qi: oi}}` — chỉ số đáp án đã chọn |
| `career` | list ≤ 45 | không | Cân đối lộ trình Phần 2 | `{age, actual, path, skill}` theo tuổi |
| `rev` | int ≥ 0 | có | – | Tăng 1 mỗi lần ghi; dùng phát hiện xung đột |
| `updatedAt` | timestamp | có | – | `request.time` |

`goals[]`: `id`, `kind` ("debt"|"invest"|"fund"), `holdAfterEnd` (bool, tùy chọn), `name` (string ≤ 120), `age` (int), `amount` (number ≥ 0), `startYear`, `endYear` (int), `annualRate` (number 0–1), `alreadyPaid`/`currentSaved` (number ≥ 0), `products` (list ≤ 3 của `{name, weight}`).
Giữ ≤ 20 mục để tài liệu nhỏ hơn nhiều so với giới hạn 1 MiB.

## `users/{uid}/months/{yyyy-mm}`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `year`, `month` | int | khớp id tài liệu |
| `planIncome`, `planExpense` | map<string, number ≥ 0> | Kế hoạch theo khoản mục |
| `development` | list<map> ≤ 100 (tùy chọn) | `{date, category, note, amount, expected, actual}` — chi đầu tư phát triển bản thân |
| `income`, `expense` | list<map> ≤ 200 | `{date: string yyyy-mm-dd, category: string ≤ 80, note: string ≤ 200, amount: number ≥ 0}` |
| `reasons` | map ≤ 60 (tùy chọn) | Khóa dạng "loại, dấu gạch đứng, khoản mục" (loại là income hoặc expense), giá trị `{reason, measure}` |
| `rev`, `updatedAt` | như trên | |

Thực tế (cột W của sheet T*) và chênh lệch **không lưu**: tính từ nhật ký bằng `src/domain`.

## Truy vấn
- Đọc `plan/main` bằng `getDoc`.
- Đọc 12 tháng bằng `getDocs` trên `users/{uid}/months` với `orderBy(documentId())` và `limit(12)`. Không cần composite index (truy vấn theo một trường/documentId).
- `firestore.indexes.json` để rỗng có chủ đích.

## Đồng bộ và xung đột
- Ghi bằng `runTransaction`: đọc `rev`, so với bản đang giữ; khác nhau thì báo xung đột và không ghi đè âm thầm.
- Ghi tự động có debounce; chỉ báo "đã lưu" sau khi server xác nhận.
