// E2E trên trình duyệt thật (Microsoft Edge có sẵn) + Firebase Emulator (Auth + Firestore).
// Chạy: npm run test:e2e  — không chạm Firebase production (app kết nối emulator ở chế độ dev).
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

process.env.VITE_USE_EMULATOR = '1'; // chỉ có hiệu lực ở dev server (import.meta.env.DEV)
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error', mode: 'development' });
await server.listen();
const url = 'http://localhost:5199/';
// Dùng trình duyệt cài sẵn trên máy (Edge trên Windows, Chrome trên runner CI) để không phải tải Chromium.
const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || 'msedge', headless: true });
const consoleErrors = [];
const failed = [];
const results = [];
let currentPage = null;

async function step(name, fn) {
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    results.push(`✖ ${name}: ${e.message.split('\n')[0]}`);
    const text = currentPage ? await currentPage.locator('body').innerText().catch(() => '') : '';
    results.push(`  màn hình: ${text.replace(/\s+/g, ' ').slice(0, 600)}`);
    throw e;
  }
}

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  currentPage = page;
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
  const email1 = `a${Date.now()}@example.test`;
  const email2 = `b${Date.now()}@example.test`;

  await step('mở ứng dụng hiển thị màn hình đăng nhập', async () => {
    await page.goto(url);
    await page.getByRole('heading', { name: 'Kế hoạch tài chính cá nhân' }).waitFor();
  });

  await step('validation: mật khẩu sai báo lỗi dễ hiểu, không đăng nhập', async () => {
    await page.getByLabel('Email').fill(email1);
    await page.getByLabel('Mật khẩu').fill('wrongpass');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.getByRole('alert').filter({ hasText: /không đúng|không hợp lệ|xác thực/ }).waitFor();
  });

  await step('đăng ký → plan khởi tạo từ mockup, mục tiêu khớp Excel', async () => {
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByRole('heading', { name: 'Theo dõi tài chính năm 2023' }).waitFor();
    await page.getByRole('button', { name: 'Mục tiêu', exact: true }).click();
    const row = page.getByRole('row').filter({ has: page.getByLabel('Giá trị Vay mua chung cư', { exact: true }) });
    await row.getByText('0,92', { exact: true }).waitFor();
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('10,42', { exact: true }).waitFor();
  });

  await step('sửa tỷ lệ tiết kiệm → tự lưu → lộ trình tính lại', async () => {
    await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
    const rate = page.getByLabel('Tỷ lệ tiết kiệm mục tiêu', { exact: true });
    await rate.fill('50');
    await rate.press('Tab');
    await page.getByText('Đã lưu lên máy chủ').waitFor();
    await page.getByRole('button', { name: 'Mục tiêu', exact: true }).click();
    // 2024: 4,1675 / 0,5 = 8,33
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('8,33', { exact: true }).waitFor();
  });

  await step('nhập thu nhập tháng 1 → tự lưu → tổng quan cập nhật', async () => {
    await page.getByRole('button', { name: 'Thu chi', exact: true }).click();
    await page.getByLabel('Chọn tháng').selectOption('0');
    const incomeForm = page.locator('form').first();
    await incomeForm.getByLabel('Số tiền (triệu đồng)').fill('-5');
    await incomeForm.getByRole('button', { name: 'Thêm' }).click();
    await incomeForm.getByRole('alert').filter({ hasText: 'không âm' }).waitFor();
    await incomeForm.getByLabel('Mô tả').fill('Lương T1');
    await incomeForm.getByLabel('Số tiền (triệu đồng)').fill('20');
    await incomeForm.getByRole('button', { name: 'Thêm' }).click();
    await page.getByRole('cell', { name: 'Lương T1' }).waitFor();
    await page.getByText('Đã lưu lên máy chủ').waitFor();
  });

  await step('reload → dữ liệu vẫn đúng (đọc lại từ Firestore)', async () => {
    await page.reload();
    // URL giữ tab đang xem (#budget) → sau reload app mở lại đúng tab đó.
    await page.getByRole('heading', { name: 'Thu chi theo tháng' }).waitFor();
    await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
    await page.getByRole('heading', { name: 'Theo dõi tài chính năm 2023' }).waitFor();
    const card = page.locator('.card').filter({ hasText: 'Tổng thu nhập 2023' });
    assert.equal((await card.locator('.value').textContent()).trim(), '20');
    await page.getByRole('button', { name: 'Mục tiêu', exact: true }).click();
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('8,33', { exact: true }).waitFor();
  });


  await step('khảo sát: trả lời đủ theo mẫu mockup → kết luận đúng; reload vẫn giữ', async () => {
    await page.getByRole('button', { name: 'Khảo sát', exact: true }).click();
    await page.getByText(/Chưa hoàn thành: đã trả lời 0\/10 câu/).first().waitFor();
    const risk = { 0: 4, 1: 4, 2: 2, 3: 2, 4: 1, 5: 1, 6: 2, 7: 1, 8: 0, 9: 1 };
    const circ = { 0: 2, 1: 2, 2: 0, 3: 4, 4: 2, 5: 4, 6: 3, 7: 3, 8: 0, 9: 1, 10: 2 };
    for (const [q, o] of Object.entries(risk)) await page.locator(`input[name="risk-${q}"][value="${o}"]`).check();
    for (const [q, o] of Object.entries(circ)) await page.locator(`input[name="circumstance-${q}"][value="${o}"]`).check();
    await page.getByText(/trung lập với rủi ro/).waitFor();
    await page.getByText(/điều kiện bình thường/).waitFor();
    await page.getByText(/tổng điểm 23/).waitFor();
    await page.getByText(/tổng điểm 36/).waitFor();
    await page.getByText('Đã lưu lên máy chủ').waitFor();
    await page.reload();
    await page.getByText(/trung lập với rủi ro/).waitFor();
    assert.equal(await page.locator('input[name="risk-0"][value="4"]').isChecked(), true);
    await page.getByRole('button', { name: 'Mục tiêu', exact: true }).click();
    await page.getByText(/Bạn là người trung lập với rủi ro/).waitFor(); // kết luận hiện cả ở trang Mục tiêu
  });

  await step('mục tiêu: thêm rồi xóa (có xác nhận)', async () => {
    await page.getByRole('button', { name: 'Thêm mục tiêu đầu tư' }).click();
    await page.getByLabel('Giá trị Mục tiêu mới', { exact: true }).waitFor();
    await page.getByLabel('Giá trị Mục tiêu mới', { exact: true }).fill('abc');
    await page.getByLabel('Giá trị Mục tiêu mới', { exact: true }).press('Tab');
    assert.equal(await page.getByLabel('Giá trị Mục tiêu mới', { exact: true }).getAttribute('aria-invalid'), 'true');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Xóa mục tiêu Mục tiêu mới' }).click();
    await page.getByLabel('Giá trị Mục tiêu mới', { exact: true }).waitFor({ state: 'detached' });
    await page.getByText('Đã lưu lên máy chủ').waitFor();
  });

  await step('chi phát triển bản thân: thêm dòng → thống kê → Tổng quan', async () => {
    await page.getByRole('button', { name: 'Thu chi', exact: true }).click();
    await page.getByLabel('Chọn tháng').selectOption('0');
    const form = page.locator('form').nth(2);
    await form.getByLabel('Mô tả').fill('Sách tài chính');
    await form.getByLabel('Số tiền (triệu đồng)').fill('0,5');
    await form.getByLabel('Kết quả tạo ra dự kiến').fill('Bổ sung kiến thức');
    await form.getByRole('button', { name: 'Thêm' }).click();
    await page.getByRole('cell', { name: 'Bổ sung kiến thức' }).waitFor();
    await page.getByRole('row').filter({ hasText: 'Tổng số tiền đã chi' }).getByText('0,5', { exact: true }).waitFor();
    await page.getByText('Đã lưu lên máy chủ').waitFor();
    await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
    await page.getByRole('row').filter({ hasText: /^Mua sách/ }).getByText('0,5', { exact: true }).first().waitFor();
  });

  await step('lộ trình: phân bổ tài sản, mức sinh lời cần thiết, thu nhập lộ trình vs cần có', async () => {
    await page.getByRole('button', { name: 'Lộ trình', exact: true }).click();
    await page.getByRole('columnheader', { name: 'Mức sinh lời cần thiết' }).waitFor();
    await page.getByRole('columnheader', { name: 'Cổ phiếu' }).waitFor();
    const path30 = page.getByLabel('Thu nhập theo lộ trình nghề nghiệp tuổi 30');
    await path30.fill('30');
    await path30.press('Tab');
    // tuổi 30 = năm 2032: 13,0573 / 50% (đã đổi ở bước trước) = 26,11 → 30 − 26,11 = 3,89
    await page.getByRole('row').filter({ hasText: /^30/ }).getByText('3,89', { exact: true }).waitFor();
    await page.getByText('Đã lưu lên máy chủ').waitFor();
  });

  await step('đăng xuất → đổi tài khoản → không thấy dữ liệu người trước', async () => {
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản' }).waitFor();
    assert.equal(await page.getByText(email1).count(), 0);
    await page.getByLabel('Email').fill(email2);
    await page.getByLabel('Mật khẩu').fill('secret123');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByText(email2).waitFor(); // header đã đổi sang tài khoản mới
    await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
    await page.getByRole('heading', { name: 'Theo dõi tài chính năm 2023' }).waitFor();
    const card = page.locator('.card').filter({ hasText: 'Tổng thu nhập 2023' });
    assert.equal((await card.locator('.value').textContent()).trim(), '0');
    await page.getByRole('button', { name: 'Thu chi', exact: true }).click();
    await page.getByLabel('Chọn tháng').selectOption('0');
    assert.equal(await page.getByRole('cell', { name: 'Lương T1' }).count(), 0);
  });

  await step('responsive 375px: không tràn ngang trang', async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const tab of ['Tổng quan', 'Mục tiêu', 'Lộ trình', 'Khảo sát', 'Thu chi', 'Cài đặt']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const over = document.documentElement.scrollWidth - window.innerWidth;
        // Phần tử vượt mép phải nằm ngoài vùng cuộn riêng (.table-wrap) → là thủ phạm gây tràn trang.
        const culprits = [...document.querySelectorAll('body *')]
          .filter((e) => !e.closest('.table-wrap') && e.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 3)
          .map((e) => `${e.tagName.toLowerCase()}${e.className ? '.' + e.className : ''}[${Math.round(e.getBoundingClientRect().right)}]`);
        return { over, culprits };
      });
      assert.ok(r.over <= 1, `trang "${tab}" tràn ngang ${r.over}px; phần tử: ${r.culprits.join(', ')}`);
    }
  });

  await step('không có lỗi console / request thất bại', async () => {
    const relevant = consoleErrors.filter((t) => !/auth\/(invalid-credential|wrong-password|user-not-found)|400 \(Bad Request\)/.test(t));
    assert.deepEqual(relevant, []);
    assert.deepEqual(failed.filter((f) => !/Listen\/channel|ERR_ABORTED/.test(f)), []);
  });
} finally {
  console.log(results.join('\n'));
  if (consoleErrors.length) console.log('console errors (incl. expected):\n- ' + consoleErrors.map((t) => t.slice(0, 300)).join('\n- '));
  await browser.close();
  await server.close();
}
