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
    await page.getByRole('button', { name: 'Mục tiêu' }).click();
    const row = page.getByRole('row').filter({ hasText: 'Vay mua chung cư' });
    await row.getByText('0,92', { exact: true }).waitFor();
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('10,42', { exact: true }).waitFor();
  });

  await step('sửa tỷ lệ tiết kiệm → tự lưu → lộ trình tính lại', async () => {
    await page.getByRole('button', { name: 'Cài đặt' }).click();
    const rate = page.getByLabel('Tỷ lệ tiết kiệm mục tiêu', { exact: true });
    await rate.fill('50');
    await rate.press('Tab');
    await page.getByText('Đã lưu lên máy chủ').waitFor();
    await page.getByRole('button', { name: 'Mục tiêu' }).click();
    // 2024: 4,1675 / 0,5 = 8,33
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('8,33', { exact: true }).waitFor();
  });

  await step('nhập thu nhập tháng 1 → tự lưu → tổng quan cập nhật', async () => {
    await page.getByRole('button', { name: 'Thu chi' }).click();
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
    await page.getByRole('heading', { name: 'Theo dõi tài chính năm 2023' }).waitFor();
    const card = page.locator('.card').filter({ hasText: 'Tổng thu nhập 2023' });
    assert.equal((await card.locator('.value').textContent()).trim(), '20');
    await page.getByRole('button', { name: 'Mục tiêu' }).click();
    await page.getByRole('row').filter({ hasText: /^2024/ }).getByText('8,33', { exact: true }).waitFor();
  });

  await step('đăng xuất → đổi tài khoản → không thấy dữ liệu người trước', async () => {
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản' }).waitFor();
    assert.equal(await page.getByText(email1).count(), 0);
    await page.getByLabel('Email').fill(email2);
    await page.getByLabel('Mật khẩu').fill('secret123');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByRole('heading', { name: 'Theo dõi tài chính năm 2023' }).waitFor();
    const card = page.locator('.card').filter({ hasText: 'Tổng thu nhập 2023' });
    assert.equal((await card.locator('.value').textContent()).trim(), '0');
    await page.getByRole('button', { name: 'Thu chi' }).click();
    await page.getByLabel('Chọn tháng').selectOption('0');
    assert.equal(await page.getByRole('cell', { name: 'Lương T1' }).count(), 0);
  });

  await step('responsive 375px: không tràn ngang trang', async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `trang tràn ngang ${overflow}px`);
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
