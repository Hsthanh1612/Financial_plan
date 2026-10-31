// Mô phỏng tích lũy theo sản phẩm và phân bổ nhóm tài sản (sheet "Mục tiêu tài chính" Phần 3,
// "Cân đối lộ trình nghề nghiệp" cột G–O). Xem docs/ALGORITHM-SPEC.md cho các điểm khác Excel.
import { summarizeGoal } from './goals.js';
import { PRODUCT_BY_NAME } from './catalog.js';

/**
 * Nhóm sản phẩm theo hàng 221 của Excel và lợi suất nhóm theo hàng 220 (AVERAGE lợi suất các sản phẩm trong nhóm).
 * Lợi suất nhóm "Cổ phiếu riêng lẻ" = AVERAGE(Z23:AB26) = (0,12+0+0+0)/4 vì 3 dòng "Sản phẩm 1–3" mẫu có lợi suất 0.
 */
export const GROUPS = [
  { id: 'etf', members: ['ETF - ETFVFM', 'ETF - ETFFINLEAD'], ret: (0.13 + 0.15) / 2, cls: 'stock' },
  { id: 'fund', members: ['DCBC', 'DCDS'], ret: (0.16 + 0.11) / 2, cls: 'stock' },
  { id: 'bondfund', members: ['DCBF', 'Trái phiếu Techcombank', 'Trái phiếu FE Credit'], ret: (0.09 + 0.105 + 0.1) / 3, cls: 'bond' },
  { id: 'insurance', members: ['Bảo hiểm thuần túy', 'BH liên kết đầu tư'], ret: (0.04 + 0.12) / 2, cls: 'insurance' },
  { id: 'finhay', members: ['Finhay'], ret: 0.06, cls: 'deposit' },
  { id: 'bank', members: ['Tiền gửi ngân hàng'], ret: 0.05, cls: 'deposit' },
  { id: 'single', members: ['Cổ phiếu riêng lẻ'], ret: (0.12 + 0 + 0 + 0) / 4, cls: 'other' },
];

export const CLASS_LABELS = { stock: 'Cổ phiếu', bond: 'Trái phiếu', insurance: 'Bảo hiểm', deposit: 'Tiền gửi' };
const GROUP_OF = new Map(GROUPS.flatMap((g) => g.members.map((m) => [m, g])));

/**
 * Số dư mỗi sản phẩm của từng mục tiêu theo năm:
 *   đang hoạt động: nạp (tiền/năm × tỷ trọng) + số dư năm trước × (1 + lợi suất sản phẩm)
 *   hết hạn: về 0 (đã chi cho mục tiêu) — hoặc giữ nguyên và sinh lãi nếu mục tiêu có `holdAfterEnd` (hưu trí, như cột AP của Excel).
 * Mục tiêu trả nợ không tham gia (không có sản phẩm đầu tư).
 */
export function simulate({ startYear, age, goals, untilAge = 59 }) {
  const years = [];
  for (let y = startYear; y - startYear + age <= untilAge; y += 1) years.push(y);
  const active = goals.filter((g) => g.kind !== 'debt' && g.products?.length);
  const state = active.map((g) => ({
    goal: g,
    yearly: summarizeGoal(g).yearly,
    balances: g.products.map(() => 0),
  }));

  return years.map((year) => {
    const byProduct = {};
    for (const s of state) {
      const { goal } = s;
      const on = year >= goal.startYear && year <= goal.endYear;
      goal.products.forEach((p, i) => {
        const info = PRODUCT_BY_NAME.get(p.name);
        if (!info) return; // sản phẩm không có trong danh mục: bỏ qua
        const grow = s.balances[i] * (1 + info.ret);
        if (on) s.balances[i] = s.yearly * p.weight + grow;
        else s.balances[i] = goal.holdAfterEnd && s.balances[i] > 0 ? grow : 0;
        byProduct[p.name] = (byProduct[p.name] ?? 0) + s.balances[i];
      });
    }
    const total = Object.values(byProduct).reduce((a, b) => a + b, 0);
    const groupBalance = Object.fromEntries(GROUPS.map((g) => [g.id, g.members.reduce((a, m) => a + (byProduct[m] ?? 0), 0)]));
    const share = (ids) => (total > 0 ? ids.reduce((a, id) => a + groupBalance[id], 0) / total : 0);
    const classShare = {
      stock: share(['etf', 'fund']),
      bond: share(['bondfund']),
      insurance: share(['insurance']),
      deposit: share(['finhay', 'bank']),
    };
    // SUMPRODUCT(lợi suất nhóm, tỷ trọng nhóm) — hàng 221 cột V
    const requiredReturn = total > 0 ? GROUPS.reduce((a, g) => a + g.ret * (groupBalance[g.id] / total), 0) : 0;
    return { year, age: age + (year - startYear), byProduct, total, classShare, requiredReturn };
  });
}

/** Dashboard R6 = AVERAGE(V221:W250): trung bình mức sinh lời cần thiết của 30 năm đầu (năm không có số dư tính 0). */
export function averageRequiredReturn(rows, horizon = 30) {
  const first = rows.slice(0, horizon);
  return first.length ? first.reduce((a, r) => a + r.requiredReturn, 0) / first.length : 0;
}

/** Các mốc tuổi của bảng "Lộ trình tài chính cá nhân tổng thể": tuổi hiện tại rồi +5 mỗi mốc (6 mốc). */
export function milestones(schedule, simRows, startAge, count = 6, step = 5) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const a = startAge + i * step;
    const sch = schedule.find((r) => r.age === a);
    const sim = simRows.find((r) => r.age === a);
    out.push({ age: a, incomeNeeded: sch?.incomeNeeded ?? 0, classShare: sim?.classShare ?? { stock: 0, bond: 0, insurance: 0, deposit: 0 }, requiredReturn: sim?.requiredReturn ?? 0 });
  }
  return out;
}

export { GROUP_OF };
