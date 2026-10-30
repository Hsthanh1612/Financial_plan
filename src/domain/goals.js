// Mục tiêu tài chính và lịch theo năm (sheet "Mục tiêu tài chính" Phần 1–2).
import { monthlyDebtPayment, monthlySaving, expectedReturn, pv } from './finance.js';
import { PRODUCT_BY_NAME } from './catalog.js';

/** Lợi suất kỳ vọng của một mục tiêu theo danh mục sản phẩm; sản phẩm không có trong catalog bị bỏ qua. */
export function goalReturn(products = []) {
  return expectedReturn(
    products
      .filter((p) => p.weight > 0 && PRODUCT_BY_NAME.has(p.name))
      .map((p) => ({ weight: p.weight, return: PRODUCT_BY_NAME.get(p.name).ret })),
  );
}

/** Tính số tiền phải trả/tiết kiệm mỗi tháng cho một mục tiêu. */
export function summarizeGoal(goal) {
  if (goal.kind === 'debt') {
    const r = monthlyDebtPayment({
      startYear: goal.startYear,
      endYear: goal.endYear,
      annualRate: goal.annualRate,
      totalDebt: goal.amount,
      alreadyPaid: goal.alreadyPaid ?? 0,
    });
    return { ...r, annualRate: goal.annualRate };
  }
  const annualRate = goal.annualRate ?? goalReturn(goal.products);
  // Mục tiêu 9 (quỹ học/hưu): đích = -PV(ls/12, tháng, cần/tháng, để lại) — O87; nper dùng nguyên giá trị mockup.
  const target =
    goal.kind === 'fund'
      ? -pv(annualRate / 12, goal.lifeYears, goal.monthlyNeed, goal.leaveBehind)
      : goal.amount - (goal.currentSaved ?? 0);
  const r = monthlySaving({
    startYear: goal.startYear,
    endYear: goal.endYear,
    annualRate,
    currentSaved: goal.currentSaved ?? 0,
    target,
  });
  return { ...r, annualRate, target };
}

/**
 * Lịch theo năm: mỗi năm = tổng số tiền/THÁNG của các mục tiêu đang hoạt động
 * (cột AA = SUM(G:Z)); `incomeNeeded` = AA / tỷ lệ tiết kiệm (cột AB).
 */
export function buildSchedule({ startYear, age, savingRate, goals, untilAge = 59 }) {
  if (!(savingRate > 0)) throw new RangeError('savingRate phải > 0');
  const summaries = goals.map((g) => ({ goal: g, ...summarizeGoal(g) }));
  const rows = [];
  for (let year = startYear; year - startYear + age <= untilAge; year += 1) {
    const perGoal = summaries.map((s) =>
      s.years > 0 && year >= s.goal.startYear && year <= s.goal.endYear ? s.monthly : 0,
    );
    const monthlyTotal = perGoal.reduce((a, b) => a + b, 0);
    rows.push({ year, age: age + (year - startYear), perGoal, monthlyTotal, incomeNeeded: monthlyTotal / savingRate });
  }
  return { rows, summaries };
}
