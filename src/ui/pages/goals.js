import { h, fmt, parseAmount } from '../dom.js';
import { buildSchedule } from '../../domain/goals.js';
import { PRODUCTS } from '../../domain/catalog.js';

/** Ô nhập số: chỉ ghi nhận khi hợp lệ, ngược lại đánh dấu lỗi và KHÔNG thay đổi dữ liệu. */
export function numInput({ value, label, onCommit, scale = 1, step = 'any', integer = false, max = Infinity }) {
  const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', name: label, 'aria-label': label, value: String(value * scale === 0 ? '0' : +(value * scale).toFixed(6)) });
  input.addEventListener('change', () => {
    const n = parseAmount(input.value);
    const ok = n !== null && n <= max && (!integer || Number.isInteger(n));
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (ok) onCommit(n / scale);
  });
  return input;
}

export function goalsPage(ctx) {
  const { state } = ctx;
  const resultCells = [];
  const scheduleBody = h('tbody');
  const scheduleHint = h('p', { class: 'status' });
  let error = '';
  const errorBox = h('p', { class: 'error', role: 'alert' });

  const kindLabel = { debt: 'Trả nợ', invest: 'Đầu tư', fund: 'Quỹ' };

  function productEditor(goal) {
    if (goal.kind === 'debt') return null;
    const rows = Array.from({ length: 3 }, (_, i) => {
      const cur = goal.products?.[i] ?? { name: '', weight: 0 };
      const sel = h('select', { 'aria-label': `Sản phẩm ${i + 1} của ${goal.name}` },
        h('option', { value: '' }, '— không chọn —'),
        PRODUCTS.map((p) => h('option', { value: p.name, selected: p.name === cur.name }, p.name)));
      const w = numInput({
        value: cur.weight, scale: 100, label: `Tỷ trọng % sản phẩm ${i + 1} của ${goal.name}`, max: 100,
        onCommit: (v) => commit(i, sel.value, v),
      });
      sel.addEventListener('change', () => commit(i, sel.value, parseAmount(w.value) === null ? 0 : parseAmount(w.value) / 100));
      return h('div', { class: 'row' }, sel, w, h('span', {}, '%'));
    });
    function commit(i, name, weight) {
      ctx.updatePlan((plan) => {
        const g = plan.goals.find((x) => x.name === goal.name);
        const prods = [0, 1, 2].map((k) => g.products?.[k] ?? { name: '', weight: 0 });
        prods[i] = { name, weight: name ? weight : 0 };
        g.products = prods.filter((p) => p.name);
      });
    }
    return h('details', {}, h('summary', {}, 'Danh mục sản phẩm đầu tư'), rows);
  }

  const goalRows = state.plan.goals.map((g, gi) => {
    const set = (field) => (v) => ctx.updatePlan((p) => { p.goals[gi][field] = v; });
    const years = h('td'); const monthly = h('td'); const yearly = h('td'); const rate = h('td');
    resultCells.push({ years, monthly, yearly, rate });
    return h('tr', {},
      h('th', { scope: 'row' }, h('div', {}, g.name), h('small', { class: 'status' }, kindLabel[g.kind] ?? g.kind), productEditor(g)),
      h('td', {}, numInput({ value: g.amount, label: `Giá trị ${g.name}`, onCommit: set('amount') })),
      h('td', {}, numInput({ value: g.startYear, label: `Năm bắt đầu ${g.name}`, integer: true, max: 2100, onCommit: set('startYear') })),
      h('td', {}, numInput({ value: g.endYear, label: `Năm kết thúc ${g.name}`, integer: true, max: 2100, onCommit: set('endYear') })),
      h('td', {}, g.kind === 'debt'
        ? numInput({ value: g.annualRate, scale: 100, label: `Lãi suất % ${g.name}`, max: 100, onCommit: set('annualRate') })
        : null),
      h('td', {}, g.kind === 'debt'
        ? numInput({ value: g.alreadyPaid ?? 0, label: `Đã thanh toán ${g.name}`, onCommit: set('alreadyPaid') })
        : numInput({ value: g.currentSaved ?? 0, label: `Tích lũy hiện có ${g.name}`, onCommit: set('currentSaved') })),
      rate, years, monthly, yearly);
  });

  function update() {
    error = '';
    let result;
    try {
      result = buildSchedule(state.plan);
    } catch (e) {
      error = 'Không tính được: ' + (e.message ?? 'dữ liệu không hợp lệ');
    }
    errorBox.textContent = error;
    if (!result) return;
    result.summaries.forEach((s, i) => {
      const c = resultCells[i];
      c.rate.textContent = `${fmt(s.annualRate * 100)}%`;
      c.years.textContent = String(s.years);
      c.monthly.textContent = fmt(s.monthly);
      c.yearly.textContent = fmt(s.yearly);
    });
    scheduleBody.replaceChildren(...result.rows.filter((r) => r.monthlyTotal > 0).map((r) =>
      h('tr', {}, h('th', { scope: 'row' }, String(r.year)), h('td', {}, String(r.age)), h('td', {}, fmt(r.monthlyTotal)), h('td', {}, fmt(r.incomeNeeded)))));
    scheduleHint.textContent = `Thu nhập cần có = tổng tiền/tháng ÷ tỷ lệ tiết kiệm (${fmt(state.plan.savingRate * 100)}%).`;
  }

  const el = h('section', {},
    h('h2', {}, 'Mục tiêu tài chính'),
    errorBox,
    h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Kế hoạch từng mục tiêu (triệu đồng)'),
      h('thead', {}, h('tr', {}, ['Mục tiêu', 'Giá trị', 'Năm BĐ', 'Năm KT', 'Lãi vay %', 'Đã trả / tích lũy', 'Lợi suất', 'Số năm', 'Mỗi tháng', 'Mỗi năm']
        .map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, goalRows))),
    h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Lộ trình theo năm'),
      h('thead', {}, h('tr', {}, ['Năm', 'Tuổi', 'Cần tiết kiệm / tháng', 'Thu nhập cần có / tháng'].map((t) => h('th', { scope: 'col' }, t)))),
      scheduleBody)),
    scheduleHint);
  update();
  return { el, update };
}
