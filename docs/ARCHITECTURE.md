# Kiến trúc

```
UI (src/ui, src/main.js) ──► State (src/state/session.js, autosave.js)
        ▲                         │
        │                         ▼
   Domain (src/domain: finance, goals, budget, catalog, defaultPlan) — thuần, không I/O
                                  │
                                  ▼
   Service (src/services/planRepository.js) ──► Firebase SDK (src/services/firebase) ──► Cloud Firestore
                                                         Auth ──► request.auth.uid ──► firestore.rules
```

- **Domain**: công thức tái hiện Excel; test đơn vị đối chiếu số Excel.
- **Repository**: điểm duy nhất truy cập Firestore. Ghi qua `runTransaction`: đọc `rev` trên server, chỉ ghi khi bằng `rev` local, ghi `rev+1` + `updatedAt = serverTimestamp()`. Rules bắt buộc `rev` tăng đúng 1 → dữ liệu cũ không âm thầm ghi đè dữ liệu mới.
- **Đồng bộ tự động** (`autosave.js`): debounce 800 ms, tuần tự hóa ghi (không ghi song song), thay đổi trong lúc đang ghi được ghi ở vòng sau, retry có giới hạn (3 lần) chỉ với lỗi mạng; lỗi quyền/dữ liệu không retry; xung đột thì dừng và báo người dùng tải lại. Chỉ báo "Đã lưu lên máy chủ" sau khi transaction thành công. Cảnh báo `beforeunload` khi còn thay đổi chưa xác nhận.
- **Đọc dữ liệu**: `getDoc` cho plan; một query 12 tài liệu/năm theo khoảng documentId. Không dùng listener realtime (ứng dụng một người dùng/phiên; tiết kiệm quota) — phiên khác thay đổi sẽ được phát hiện bằng xung đột `rev`.
- **Offline**: không bật persistence (an toàn cho thiết bị dùng chung). Mất mạng → trạng thái "Chưa đồng bộ được", dữ liệu giữ trong bộ nhớ, retry giới hạn.
- **Đổi tài khoản**: hủy session, xóa DOM, tạo session mới theo uid → không còn dữ liệu người trước.
- **Lỗi**: `services/errors.js` phân loại config/data/auth/permission/network/query/conflict/unknown; UI chỉ hiển thị thông báo thân thiện.
- **Môi trường**: emulator chỉ khi `vite dev` + `VITE_USE_EMULATOR=1`, khi đó projectId đổi sang `demo-financial-plan-test`; bản build production không chứa đường kết nối emulator.

## Quota (Spark)
Mở app: 1 đọc plan + ≤12 đọc tháng. Mỗi lần lưu: 1 đọc + 1 ghi (transaction). Debounce gộp thao tác gõ liên tiếp.

## Triển khai
GitHub Actions: `ci.yml` (PR/push: audit, unit, rules, build, e2e) và `deploy-pages.yml` (main: test → build → GitHub Pages). Quyền mặc định `contents: read`; chỉ job deploy có `pages: write`, `id-token: write`. Actions pin theo full SHA.
