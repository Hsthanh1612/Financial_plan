import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule, summarizeGoal, goalReturn } from '../../src/domain/goals.js';
import { createDefaultPlan } from '../../src/domain/defaultPlan.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const plan = createDefaultPlan();

test('lợi suất kỳ vọng và tiền/tháng từng mục tiêu khớp Excel', () => {
  const [debt, travel, reserve, wedding, startup, house, fund, retire] = plan.goals.map(summarizeGoal);
  close(debt.monthly, 0.92492502694696199);
  close(travel.annualRate, 0.0865);
  close(travel.monthly, 0.87554246309553085);
  close(reserve.monthly, 1.6853379751904034);
  close(wedding.annualRate, 0.1075);
  close(wedding.monthly, 1.6065875988014868);
  close(startup.monthly, 6.8939742978118819);
  close(house.monthly, 2.900567205760193);
  close(fund.annualRate, 0.145);
  close(fund.target, 724.30582410044906);
  close(fund.monthly, 0.60510772376746558);
  close(retire.monthly, 2.6576177770588902);
});

test('lịch theo năm: thu nhập cần có (AB) khớp các hàng Excel', () => {
  const { rows } = buildSchedule(plan);
  const at = (y) => rows.find((r) => r.year === y);
  close(at(2023).monthlyTotal, 2.5608804382859343);
  close(at(2023).incomeNeeded, 6.402201095714835);
  close(at(2024).incomeNeeded, 10.418670092718552);
  close(at(2028).incomeNeeded, 28.502822755933906);
  close(at(2031).incomeNeeded, 32.643167510996079);
  close(at(2037).incomeNeeded, 17.720544333833775);
  close(at(2052).incomeNeeded, 2.312312567367405);
  close(at(2053).incomeNeeded, 0);
  assert.equal(rows[0].age, 21);
  assert.equal(rows.at(-1).age, 59);
});

test('biên: không có mục tiêu, tỷ lệ tiết kiệm sai, sản phẩm lạ', () => {
  const empty = buildSchedule({ startYear: 2023, age: 21, savingRate: 0.4, goals: [] });
  assert.ok(empty.rows.every((r) => r.incomeNeeded === 0));
  assert.throws(() => buildSchedule({ ...plan, savingRate: 0 }), RangeError);
  assert.equal(goalReturn([{ name: 'Không tồn tại', weight: 1 }]), 0);
});
