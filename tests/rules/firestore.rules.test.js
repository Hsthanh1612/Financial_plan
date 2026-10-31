import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

// Test chạy trên Firestore Emulator với projectId giả, không chạm production.
const PROJECT_ID = 'demo-financial-plan-test';
let env;

const plan = (over = {}) => ({
  startYear: 2023, age: 21, savingRate: 0.4, goals: [], rev: 0, updatedAt: serverTimestamp(), ...over,
});
const month = (over = {}) => ({
  year: 2023, month: 1, planIncome: {}, planExpense: {}, income: [], expense: [],
  rev: 0, updatedAt: serverTimestamp(), ...over,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('chưa đăng nhập: không đọc/ghi được', async () => {
  await assertFails(getDoc(doc(anon(), 'users/alice/plan/main')));
  await assertFails(setDoc(doc(anon(), 'users/alice/plan/main'), plan()));
});

test('chủ sở hữu tạo, đọc, cập nhật plan', async () => {
  const ref = doc(alice(), 'users/alice/plan/main');
  await assertSucceeds(setDoc(ref, plan()));
  const snap = await assertSucceeds(getDoc(ref));
  assert.equal(snap.data().startYear, 2023);
  await assertSucceeds(setDoc(ref, plan({ rev: 1, age: 22 })));
});

test('người khác không đọc/sửa/xóa dữ liệu của alice', async () => {
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'users/alice/plan/main'), { ...plan(), updatedAt: new Date() });
  });
  const ref = doc(bob(), 'users/alice/plan/main');
  await assertFails(getDoc(ref));
  await assertFails(setDoc(ref, plan({ rev: 1 })));
  await assertFails(deleteDoc(ref));
});

test('alice không tạo dữ liệu dưới uid của bob', async () => {
  await assertFails(setDoc(doc(alice(), 'users/bob/plan/main'), plan()));
});

test('dữ liệu sai cấu trúc bị từ chối', async () => {
  const ref = doc(alice(), 'users/alice/plan/main');
  await assertFails(setDoc(ref, plan({ startYear: '2023' })));            // sai kiểu
  await assertFails(setDoc(ref, plan({ savingRate: 0 })));                // ngoài phạm vi
  await assertFails(setDoc(ref, plan({ savingRate: 1.5 })));
  await assertFails(setDoc(ref, plan({ extra: 'x' })));                   // trường thừa (hasOnly)
  await assertFails(setDoc(ref, plan({ goals: new Array(21).fill({}) }))); // vượt giới hạn
  const { age, ...thieu } = plan();
  await assertFails(setDoc(ref, thieu));                                  // thiếu trường
  await assertFails(setDoc(ref, plan({ updatedAt: new Date('2000-01-01') }))); // metadata giả
});

test('rev: tạo phải rev=0; cập nhật phải tăng đúng 1 (chống ghi đè dữ liệu cũ)', async () => {
  const ref = doc(alice(), 'users/alice/plan/main');
  await assertFails(setDoc(ref, plan({ rev: 5 })));
  await assertSucceeds(setDoc(ref, plan()));
  await assertFails(setDoc(ref, plan({ rev: 0 })));
  await assertFails(setDoc(ref, plan({ rev: 2 })));
  await assertSucceeds(setDoc(ref, plan({ rev: 1 })));
});

test('plan: survey/career tùy chọn hợp lệ được ghi; sai kiểu hoặc quá lớn bị từ chối', async () => {
  const ref = doc(alice(), 'users/alice/plan/main');
  await assertSucceeds(setDoc(ref, plan({ survey: { risk: { 0: 1 }, circumstance: {} }, career: [{ age: 22, actual: 10, path: 12 }] })));
  await assertFails(setDoc(ref, plan({ rev: 1, survey: 'x' })));
  await assertFails(setDoc(ref, plan({ rev: 1, survey: { a: {}, b: {}, c: {} } })));
  await assertFails(setDoc(ref, plan({ rev: 1, career: new Array(46).fill({}) })));
  await assertFails(setDoc(ref, plan({ rev: 1, career: 'x' })));
  await assertSucceeds(setDoc(ref, plan({ rev: 1, career: new Array(45).fill({ age: 1 }) })));
});

test('months: development tùy chọn ≤ 100 dòng; sai kiểu hoặc vượt giới hạn bị từ chối', async () => {
  const ref = doc(alice(), 'users/alice/months/2023-01');
  await assertSucceeds(setDoc(ref, month({ development: [{ category: 'Mua sách', amount: 0.1 }] })));
  await assertFails(setDoc(ref, month({ rev: 1, development: 'x' })));
  await assertFails(setDoc(ref, month({ rev: 1, development: new Array(101).fill({}) })));
  await assertFails(setDoc(ref, month({ rev: 1, unknownField: 1 })));
  await assertSucceeds(setDoc(ref, month({ rev: 1, development: new Array(100).fill({ amount: 1 }) })));
});

test('plan không cho xóa; doc id khác main bị từ chối', async () => {
  const ref = doc(alice(), 'users/alice/plan/main');
  await assertSucceeds(setDoc(ref, plan()));
  await assertFails(deleteDoc(ref));
  await assertFails(setDoc(doc(alice(), 'users/alice/plan/other'), plan()));
});

test('months: id phải khớp year-month; không đổi year/month sau khi tạo', async () => {
  const ref = doc(alice(), 'users/alice/months/2023-01');
  await assertSucceeds(setDoc(ref, month()));
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-1'), month()));
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-02'), month()));
  await assertFails(setDoc(ref, month({ rev: 1, month: 2 })));
  await assertSucceeds(setDoc(ref, month({ rev: 1, income: [{ amount: 20 }] })));
});

test('months: tháng ngoài 1..12 và danh sách quá lớn bị từ chối', async () => {
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-13'), month({ month: 13 })));
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-01'), month({ income: new Array(201).fill({}) })));
  const bigMap = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, 1]));
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-01'), month({ planExpense: bigMap })));
  await assertFails(setDoc(doc(alice(), 'users/alice/months/2023-01'), month({ reasons: 'not-a-map' })));
  await assertSucceeds(setDoc(doc(alice(), 'users/alice/months/2023-01'), month({ reasons: { a: 'b' } })));
});

test('query tháng: chủ đọc được danh sách của mình, người khác thì không', async () => {
  await assertSucceeds(setDoc(doc(alice(), 'users/alice/months/2023-01'), month()));
  const own = await assertSucceeds(getDocs(collection(alice(), 'users/alice/months')));
  assert.equal(own.size, 1);
  await assertFails(getDocs(collection(bob(), 'users/alice/months')));
  await assertFails(getDocs(collection(anon(), 'users/alice/months')));
});

test('đường dẫn chưa thiết kế quyền bị từ chối mặc định', async () => {
  await assertFails(setDoc(doc(alice(), 'users/alice/secret/x'), { a: 1 }));
  await assertFails(setDoc(doc(alice(), 'admins/alice'), { role: 'admin' }));
  await assertFails(getDoc(doc(alice(), 'users/alice')));
});
