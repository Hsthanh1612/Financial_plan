// Chuẩn hóa dữ liệu plan đọc từ Firestore và tạo mục tiêu mới.

let counter = 0;
export function newId() {
  counter += 1;
  return `g${Date.now().toString(36)}${counter}`;
}

/** Bảo đảm mỗi mục tiêu có `id` ổn định (tài liệu cũ chưa có) và các trường tùy chọn có giá trị mặc định. */
export function normalizePlan(plan) {
  return {
    ...plan,
    goals: (plan.goals ?? []).map((g, i) => ({ ...g, id: g.id ?? `g${i + 1}` })),
    survey: plan.survey ?? {},
    career: plan.career ?? [],
  };
}

export const MAX_GOALS = 20; // khớp Security Rules

export function newGoal(kind, startYear) {
  const base = { id: newId(), kind, name: kind === 'debt' ? 'Khoản nợ mới' : 'Mục tiêu mới', amount: 0, startYear, endYear: startYear };
  if (kind === 'debt') return { ...base, alreadyPaid: 0, annualRate: 0.08 };
  return { ...base, currentSaved: 0, products: [{ name: 'Tiền gửi ngân hàng', weight: 1 }] };
}
