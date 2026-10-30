# Kiểm kê skills

Ngày: 2026-10-30. Agent: Claude Code. CLI: `skills` (npm global). Cài ở mức project vào `.claude/skills/` bằng `--copy`.
Hash từng skill nằm trong `skills-lock.json`.

## Trước khi cài
- Thư mục skill của người dùng: `~/.claude/skills/synced` (không động tới).
- Trong repo chưa có skill, `CLAUDE.md` hay `AGENTS.md`.

## Đã cài (74 skill, đếm từ `.claude/skills/`)

| Nguồn | Số skill | Ghi chú |
|---|---|---|
| mattpocock/skills | 38 | Cài toàn bộ, gồm `setup-matt-pocock-skills` |
| obra/superpowers | 15 | Cài toàn bộ qua `skills` CLI (không dùng plugin `agy`, vì agent là Claude Code) |
| vercel-labs/agent-skills | 9 | Cài toàn bộ, gồm `web-design-guidelines` |
| firebase/agent-skills | 10 / 13 | Không cài `firebase-hosting-basics`, `firebase-app-hosting-basics`, `xcode-project-setup` |
| cloudflare/security-audit-skill | 1 | `security-audit` |
| Seokwoooo/lucian-uxui | 1 | `lucian-uxui` |

## Không cài và lý do
- `firebase-hosting-basics`, `firebase-app-hosting-basics`: MASTER-PROMPT cấm Firebase Hosting/App Hosting.
- `xcode-project-setup`: không liên quan (dự án web).

## Cài nhưng không được dùng
- `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`: dự án không triển khai lên Vercel.
- `vercel-react-*`, `vercel-composition-patterns`, `vercel-react-native-skills`: chỉ dùng nếu stack là React/Next.js (chưa chọn).
- `firebase-crashlytics`, `firebase-data-connect`, `firebase-remote-config-basics`, `firebase-ai-logic-basics`, `extension-to-functions-codebase`: ngoài phạm vi Spark/Firestore. Chỉ lưu để đủ bộ, không dùng.

## Đã thực sự được dùng (gọi qua công cụ Skill, có kết quả)
| Skill | Dùng cho | Kết quả |
|---|---|---|
| `firebase-security-rules-auditor` | Kiểm toán `firestore.rules` | Điểm 4/5; sửa giới hạn map + kiểu `reasons`, thêm test hồi quy |
| `web-design-guidelines` | Rà soát UI theo Vercel Web Interface Guidelines (tải bản mới nhất) | 9 phát hiện, đã sửa: theme-color, text-wrap, name/autocomplete, xác nhận xóa, URL theo tab, cảnh báo rời trang khi chưa lưu |

## Đã nhận diện nhưng chưa dùng
Các skill còn lại được agent nhận diện (xuất hiện trong danh sách skill khả dụng sau khi cài) nhưng chưa được gọi, gồm `security-audit` (Cloudflare), `lucian-uxui`, `firebase-firestore`, `firestore-rules-creation`, `tdd`, `setup-matt-pocock-skills`, Superpowers. Lý do: giới hạn thời gian/tài nguyên máy (RAM thấp). Không ghi là "đã dùng".

## Lưu trữ
`.claude/skills/` không commit (mã bên thứ ba); khôi phục bằng `skills experimental_install` từ `skills-lock.json`.

## Chưa xác minh
- Agent đã nhận diện các skill này hay chưa: skill mới cài ở project thường cần khởi động lại phiên mới.
- Phiên bản/commit nguồn ngoài hash trong `skills-lock.json`.
- Chưa đọc nội dung từng skill để rà soát (CLI cảnh báo skill chạy với quyền đầy đủ của agent).

## Sự cố ghi nhận
- Lần cài hàng loạt đầu tiên bị bộ phân loại quyền của Claude Code từ chối; sau khi người dùng cho phép rõ ràng, cài lại từng nguồn thành công.
- Truyền danh sách skill Firebase bằng mảng PowerShell lần đầu không chọn đúng skill; đã sửa bằng `@array`.
