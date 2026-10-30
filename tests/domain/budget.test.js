import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actualByCategory, summarizeMonth, compareWithPlan, summarizeYear } from '../../src/domain/budget.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

const t1 = {
  income: [{ category: 'Lương từ công ty', amount: 20 }, { category: 'Thu nhập khác', amount: 4 }],
  expense: [{ category: 'Mua thực phẩm', amount: 5.5 }, { category: 'Mua thực phẩm', amount: 0 }, { category: 'Chi tiền trả nợ', amount: 6.5 }],
  planIncome: { 'Lương từ công ty': 20, 'Thu nhập khác': 10 },
  planExpense: { 'Mua thực phẩm': 6, 'Chi tiền trả nợ': 6.5 },
};

test('SUMIF theo khoản mục và tổng tháng 1 (I9=24, chênh lệch thu −6)', () => {
  const a = actualByCategory(t1.income, ['Lương từ công ty', 'Thu nhập khác', 'Khác']);
  assert.deepEqual(a, { 'Lương từ công ty': 20, 'Thu nhập khác': 4, Khác: 0 });
  const s = summarizeMonth(t1);
  close(s.income, 24);
  close(s.expense, 12);
  close(s.saving, 12);
  const rows = compareWithPlan({ entries: t1.income, plan: t1.planIncome, categories: ['Lương từ công ty', 'Thu nhập khác'], kind: 'income' });
  assert.equal(rows[1].variance, -6);
});

test('chi: chênh lệch = kế hoạch − thực tế', () => {
  const rows = compareWithPlan({ entries: t1.expense, plan: t1.planExpense, categories: ['Mua thực phẩm'], kind: 'expense' });
  close(rows[0].variance, 0.5);
});

test('năm: tháng thiếu tính 0; lũy kế chênh lệch cộng dồn (F93, G93)', () => {
  const m = (planExpense, expense) => ({ income: [], expense: [{ category: 'x', amount: expense }], planIncome: {}, planExpense: { x: planExpense } });
  const y = summarizeYear([m(18.5, 17.5), m(18.5, 19.2)]);
  close(y.cumulativeVariance[0], 1);
  close(y.cumulativeVariance[1], 0.3000000000000007, 1e-9);
  assert.equal(y.rows.length, 12);
  assert.equal(y.rows[11].expense, 0);
  close(y.totalExpense, 36.7);
});

test('dữ liệu sai bị từ chối', () => {
  assert.throws(() => summarizeMonth({ ...t1, expense: [{ category: 'x', amount: '5' }] }), TypeError);
  assert.throws(() => summarizeMonth({ ...t1, expense: [{ category: 'x', amount: -1 }] }), TypeError);
  assert.throws(() => actualByCategory([{ category: 'x', amount: NaN }], ['x']), TypeError);
});
