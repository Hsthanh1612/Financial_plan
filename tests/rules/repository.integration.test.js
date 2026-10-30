import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createPlanRepository } from '../../src/services/planRepository.js';
import { summarizeYear } from '../../src/domain/budget.js';

// Chạy với Firestore Emulator + Rules thật; projectId giả nên không chạm production.
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-financial-plan-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const repoFor = (uid) => createPlanRepository(env.authenticatedContext(uid).firestore(), uid);

test('bootstrap: tạo plan từ mockup một lần, chạy lại không ghi đè/trùng', async () => {
  const repo = repoFor('alice');
  assert.equal(await repo.loadPlan(), null);
  const first = await repo.bootstrapPlan();
  assert.equal(first.created, true);
  assert.equal(first.plan.goals.length, 8);
  const edited = { ...first.plan, age: 22 };
  await repo.savePlan(edited);
  const second = await repo.bootstrapPlan();
  assert.equal(second.created, false);
  assert.equal(second.plan.age, 22);       // không bị ghi đè bằng mặc định
  assert.equal(second.plan.rev, 1);
});

test('savePlan tăng rev; rev cũ bị báo xung đột và không ghi đè', async () => {
  const repo = repoFor('alice');
  const { plan } = await repo.bootstrapPlan();
  const rev1 = await repo.savePlan({ ...plan, savingRate: 0.5 });
  assert.equal(rev1, 1);
  await assert.rejects(repo.savePlan({ ...plan, savingRate: 0.9 }), (e) => e.kind === 'conflict');
  const reloaded = await repo.loadPlan();
  assert.equal(reloaded.savingRate, 0.5);
});

test('tháng: lưu, reload đúng dữ liệu, tổng hợp năm', async () => {
  const repo = repoFor('alice');
  const months = await repo.loadYear(2023);
  assert.equal(months.length, 12);
  assert.ok(months.every((m) => m.rev === -1));
  const jan = { ...months[0], income: [{ date: '2023-01-05', category: 'Lương từ công ty', note: '', amount: 20 }],
    expense: [{ date: '2023-01-06', category: 'Mua thực phẩm', note: '', amount: 5.5 }], planExpense: { 'Mua thực phẩm': 6 } };
  const rev = await repo.saveMonth(jan);
  assert.equal(rev, 0);
  const again = await repo.loadYear(2023);
  assert.equal(again[0].rev, 0);
  assert.equal(again[0].income[0].amount, 20);
  assert.equal(again[1].rev, -1);
  const y = summarizeYear(again);
  assert.equal(y.totalSaving, 14.5);
});

test('loadYear chỉ trả tháng của đúng năm', async () => {
  const repo = repoFor('alice');
  const y23 = await repo.loadYear(2023);
  const y24 = await repo.loadYear(2024);
  await repo.saveMonth({ ...y23[0], income: [{ date: '2023-01-01', category: 'a', note: '', amount: 1 }] });
  await repo.saveMonth({ ...y24[0], income: [{ date: '2024-01-01', category: 'a', note: '', amount: 2 }] });
  assert.equal((await repo.loadYear(2023))[0].income[0].amount, 1);
  assert.equal((await repo.loadYear(2024))[0].income[0].amount, 2);
});

test('hai tài khoản: dữ liệu tách biệt, tài khoản khác không đọc được', async () => {
  const alice = repoFor('alice');
  await alice.bootstrapPlan();
  const bobReadsAlice = createPlanRepository(env.authenticatedContext('bob').firestore(), 'alice');
  await assert.rejects(bobReadsAlice.loadPlan(), (e) => e.kind === 'permission');
  assert.equal(await repoFor('bob').loadPlan(), null);
});

test('dữ liệu sai kiểu bị Rules từ chối và báo lỗi, không báo thành công', async () => {
  const repo = repoFor('alice');
  const { plan } = await repo.bootstrapPlan();
  await assert.rejects(repo.savePlan({ ...plan, savingRate: 'abc' }), (e) => e.kind === 'permission');
  assert.equal((await repo.loadPlan()).rev, 0);
});
