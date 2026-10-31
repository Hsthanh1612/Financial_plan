// Smoke test trên bản production thật (GitHub Pages + Firebase). KHÔNG chạy trong CI.
// Tạo 1 tài khoản thử, đi qua luồng chính, rồi in uid để script dọn dẹp xóa dữ liệu thử.
// Chạy: node tests/e2e/production-smoke.mjs <url>
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const url = process.argv[2] ?? 'https://hsthanh1612.github.io/Finance-plan/';
const email = `smoke${Date.now()}@example.test`;
const password = 'Smoke-test-12345';
const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || 'msedge', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
const out = [];
const ok = (s) => out.push(`✔ ${s}`);

try {
  await page.goto(url);
  await page.getByRole('heading', { name: 'Kế hoạch tài chính cá nhân' }).waitFor();
  ok('trang production mở được, hiện màn hình đăng nhập');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await page.getByRole('heading', { name: /Theo dõi tài chính năm 2023/ }).waitFor({ timeout: 45000 });
  ok('đăng ký thành công, plan khởi tạo, hiện Tổng quan');

  await page.getByRole('button', { name: 'Mục tiêu' }).click();
  await page.getByRole('row').filter({ hasText: 'Vay mua chung cư' }).getByText('0,92', { exact: true }).waitFor();
  ok('mục tiêu tính đúng (0,92 triệu/tháng trả nợ)');

  await page.getByRole('button', { name: 'Cài đặt' }).click();
  const rate = page.getByLabel('Tỷ lệ tiết kiệm mục tiêu', { exact: true });
  await rate.fill('50');
  await rate.press('Tab');
  await page.getByText('Đã lưu lên máy chủ').waitFor({ timeout: 45000 });
  ok('tự lưu lên Firestore production được máy chủ xác nhận');

  await page.reload();
  await page.getByRole('heading', { name: 'Cài đặt kế hoạch' }).waitFor({ timeout: 45000 });
  const saved = await page.getByLabel('Tỷ lệ tiết kiệm mục tiêu', { exact: true }).inputValue();
  assert.equal(saved, '50');
  ok('reload → đọc lại từ Firestore production đúng (50%)');

  const relevant = errors.filter((e) => !/favicon/.test(e));
  assert.deepEqual(relevant, [], 'lỗi console: ' + relevant.join(' | '));
  ok('không có lỗi console');
} catch (e) {
  out.push(`✖ ${e.message.split('\n')[0]}`);
  out.push('  màn hình: ' + (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400));
  process.exitCode = 1;
} finally {
  console.log(out.join('\n'));
  console.log(`SMOKE_EMAIL=${email}`);
  console.log(`SMOKE_PASSWORD=${password}`);
  await browser.close();
}
