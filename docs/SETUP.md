# Thiết lập

## Công cụ (đã kiểm tra trên Windows 11)
Node 24, npm 11, Git, GitHub CLI, firebase-tools 15.34.2, Java 21 (Microsoft OpenJDK, cho Emulator), Microsoft Edge (e2e local).

## Firebase (đã thực hiện)
1. `firebase login` (tài khoản chủ project).
2. Project `financial-plan-project-2a92e` ("Financial-plan project"), gói Spark.
3. `firebase use financial-plan-project-2a92e --alias default` → `.firebaserc`.
4. Web App: `firebase apps:create WEB "Financial plan web"` → appId `1:324357247643:web:e2d027f3eca3e5c416ac3e`; config đặt trong `src/services/firebase/app.js`.
5. Firestore `(default)` Standard, vùng `asia-southeast1`: `firebase firestore:databases:create "(default)" --location asia-southeast1 --edition standard`, rồi `firebase deploy --only firestore` (Rules + indexes). Vùng không đổi được sau khi tạo; nếu `deploy` tự tạo database thì vùng mặc định là `nam5`, vì vậy hãy tạo database trước.
6. **Việc người dùng cần làm**: Console → Authentication → Get started → Sign-in method → bật **Email/Password**.

Xác minh: `firebase firestore:databases:get "(default)"` → STANDARD, FIRESTORE_NATIVE, asia-southeast1.

## GitHub
1. `gh auth login` (scope `repo`, `workflow`).
2. Repository riêng tư; push `main` → CI + Deploy Pages.
3. Settings → Pages → Source: **GitHub Actions** (workflow tự cấu hình qua `configure-pages`).
4. Branch protection cho `main`: yêu cầu job `test-build` đạt, chặn force push/xóa.

## Không làm
Không `firebase init hosting`, không `firebase deploy --only hosting`, không liên kết Billing.
