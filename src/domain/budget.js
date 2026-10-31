// Tổng hợp thu chi theo tháng (sheet T1..T12 và Dashboard).

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

function assertEntry(e) {
  if (!e || typeof e.category !== 'string' || typeof e.amount !== 'number' || !Number.isFinite(e.amount) || e.amount < 0) {
    throw new TypeError('Khoản thu/chi không hợp lệ');
  }
}

/** SUMIF theo khoản mục: Thực tế = tổng các dòng nhật ký có category khớp. */
export function actualByCategory(entries, categories) {
  entries.forEach(assertEntry);
  return Object.fromEntries(categories.map((c) => [c, sum(entries.filter((e) => e.category === c).map((e) => e.amount))]));
}

/** Một tháng: tổng thu, chi, tiết kiệm. Khoản ngoài danh mục vẫn được tính vào tổng nhật ký. */
export function summarizeMonth(month) {
  month.income.forEach(assertEntry);
  month.expense.forEach(assertEntry);
  const income = sum(month.income.map((e) => e.amount));
  const expense = sum(month.expense.map((e) => e.amount));
  return {
    income,
    expense,
    saving: income - expense,
    planIncome: sum(Object.values(month.planIncome ?? {})),
    planExpense: sum(Object.values(month.planExpense ?? {})),
  };
}

/** Bảng so sánh kế hoạch/thực tế/chênh lệch cho từng khoản mục. */
export function compareWithPlan({ entries, plan, categories, kind }) {
  const actual = actualByCategory(entries, categories);
  return categories.map((category) => {
    const planned = plan?.[category] ?? 0;
    const a = actual[category];
    // Thu: chênh lệch = thực tế − kế hoạch (X27=W27−T27); chi: kế hoạch − thực tế (X42=T42−W42).
    const variance = kind === 'income' ? a - planned : planned - a;
    return { category, planned, actual: a, variance };
  });
}

/** Dashboard 12 tháng; `months` là mảng theo tháng 1..12 (phần tử thiếu = tháng chưa có dữ liệu). */
export function summarizeYear(months) {
  const rows = Array.from({ length: 12 }, (_, i) => {
    const m = months[i];
    return m ? summarizeMonth(m) : { income: 0, expense: 0, saving: 0, planIncome: 0, planExpense: 0 };
  });
  let cumulative = 0;
  const cumulativeVariance = rows.map((r) => {
    cumulative += r.planExpense - r.expense; // F93 = F92−F91; G93 = F93+G92−G91
    return cumulative;
  });
  return {
    rows,
    cumulativeVariance,
    totalIncome: sum(rows.map((r) => r.income)),
    totalExpense: sum(rows.map((r) => r.expense)),
    totalSaving: sum(rows.map((r) => r.saving)),
  };
}

/** Thống kê chi phát triển bản thân theo danh mục (T*!AE92:AE101); dòng thiếu danh mục hợp lệ bị từ chối. */
export function summarizeDevelopment(entries, categories) {
  entries.forEach(assertEntry);
  const byCategory = actualByCategory(entries, categories);
  return { byCategory, total: sum(entries.map((e) => e.amount)) };
}

/** Bảng 12 tháng × danh mục (Dashboard hàng 98–109). `months` là mảng 12 tháng (có thể thiếu `development`). */
export function summarizeDevelopmentYear(months, categories) {
  const perMonth = Array.from({ length: 12 }, (_, i) => summarizeDevelopment(months[i]?.development ?? [], categories));
  const rows = categories.map((c) => {
    const values = perMonth.map((m) => m.byCategory[c]);
    return { category: c, values, total: sum(values) };
  });
  return { rows, monthTotals: perMonth.map((m) => m.total), total: sum(perMonth.map((m) => m.total)) };
}
