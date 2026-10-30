import { h, fmt, parseAmount, signClass } from '../dom.js';
import { numInput } from './goals.js';
import { compareWithPlan, summarizeMonth } from '../../domain/budget.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, MONTH_LABELS } from '../../domain/catalog.js';

const MAX_ENTRIES = 200; // khớp giới hạn trong Security Rules

export function budgetPage(ctx) {
  const { state } = ctx;
  let idx = Math.min(new Date().getMonth(), 11);
  const body = h('div');

  function entryForm(kind, categories) {
    const date = h('input', { type: 'date', name: `${kind}-date`, required: true, 'aria-label': 'Ngày', value: `${state.year}-${String(idx + 1).padStart(2, '0')}-01` });
    const cat = h('select', { name: `${kind}-category`, 'aria-label': 'Khoản mục' }, categories.map((c) => h('option', { value: c }, c)));
    const note = h('input', { type: 'text', name: `${kind}-note`, autocomplete: 'off', maxlength: 200, 'aria-label': 'Mô tả', placeholder: 'Ví dụ: Lương tháng 1…' });
    const amount = h('input', { type: 'text', name: `${kind}-amount`, autocomplete: 'off', inputmode: 'decimal', required: true, 'aria-label': 'Số tiền (triệu đồng)', placeholder: 'Ví dụ: 20…' });
    const err = h('span', { class: 'error', role: 'alert' });
    const list = state.months[idx][kind];
    const form = h('form', { class: 'row', onSubmit: (e) => {
      e.preventDefault();
      const n = parseAmount(amount.value);
      if (n === null || !date.value) { err.textContent = 'Nhập ngày và số tiền hợp lệ (số không âm).'; return; }
      if (list.length >= MAX_ENTRIES) { err.textContent = `Tối đa ${MAX_ENTRIES} dòng mỗi tháng.`; return; }
      err.textContent = '';
      ctx.updateMonth(idx, (m) => { m[kind] = [...m[kind], { date: date.value, category: cat.value, note: note.value.trim(), amount: n }]; });
      renderBody();
    } },
      h('label', {}, 'Ngày', date), h('label', {}, 'Khoản mục', cat), h('label', {}, 'Mô tả', note), h('label', {}, 'Số tiền', amount),
      h('button', { class: 'btn primary', type: 'submit', disabled: list.length >= MAX_ENTRIES }, 'Thêm'), err);
    return form;
  }

  function entryTable(kind) {
    const list = state.months[idx][kind];
    if (!list.length) return h('p', { class: 'empty' }, 'Chưa có dòng nào.');
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Ngày', 'Khoản mục', 'Mô tả', 'Số tiền', ''].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, list.map((e, i) => h('tr', {},
        h('td', {}, e.date), h('td', {}, e.category), h('td', {}, e.note), h('td', {}, fmt(e.amount)),
        h('td', {}, h('button', { class: 'btn', type: 'button', 'aria-label': `Xóa dòng ${e.category} ${fmt(e.amount)}`, onClick: () => {
          if (!window.confirm(`Xóa dòng "${e.category}" ${fmt(e.amount)} triệu ngày ${e.date}?`)) return;
          ctx.updateMonth(idx, (m) => { m[kind] = m[kind].filter((_, k) => k !== i); });
          renderBody();
        } }, 'Xóa')))))));
  }

  function compareTable(kind, categories, title) {
    const m = state.months[idx];
    const plan = kind === 'income' ? m.planIncome : m.planExpense;
    const rows = compareWithPlan({ entries: m[kind], plan, categories, kind });
    const totals = rows.reduce((a, r) => ({ p: a.p + r.planned, a: a.a + r.actual, v: a.v + r.variance }), { p: 0, a: 0, v: 0 });
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, title),
      h('thead', {}, h('tr', {}, ['Khoản mục', 'Kế hoạch', 'Thực tế', 'Chênh lệch'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rows.map((r) => h('tr', {},
        h('th', { scope: 'row' }, r.category),
        h('td', {}, numInput({ value: r.planned, label: `Kế hoạch ${r.category}`, onCommit: (v) => {
          ctx.updateMonth(idx, (mm) => { (kind === 'income' ? mm.planIncome : mm.planExpense)[r.category] = v; });
          renderBody();
        } })),
        h('td', {}, fmt(r.actual)), h('td', { class: signClass(r.variance) }, fmt(r.variance))))),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row' }, 'Tổng'), h('td', {}, fmt(totals.p)), h('td', {}, fmt(totals.a)), h('td', { class: signClass(totals.v) }, fmt(totals.v))))));
  }

  function renderBody() {
    const m = state.months[idx];
    const s = summarizeMonth(m);
    body.replaceChildren(
      h('div', { class: 'cards' },
        h('div', { class: 'card' }, h('div', { class: 'label' }, 'Tổng thu nhập'), h('div', { class: 'value' }, fmt(s.income))),
        h('div', { class: 'card' }, h('div', { class: 'label' }, 'Tổng chi phí'), h('div', { class: 'value' }, fmt(s.expense))),
        h('div', { class: 'card' }, h('div', { class: 'label' }, 'Tiết kiệm'), h('div', { class: `value ${signClass(s.saving)}` }, fmt(s.saving)))),
      h('h3', {}, 'Thu nhập'), entryForm('income', INCOME_CATEGORIES), entryTable('income'),
      compareTable('income', INCOME_CATEGORIES, 'Tổng kết thu nhập'),
      h('h3', {}, 'Chi tiêu'), entryForm('expense', EXPENSE_CATEGORIES), entryTable('expense'),
      compareTable('expense', EXPENSE_CATEGORIES, 'Tổng kết chi tiêu'));
  }

  const select = h('select', { 'aria-label': 'Chọn tháng', onChange: (e) => { idx = Number(e.target.value); renderBody(); } },
    MONTH_LABELS.map((l, i) => h('option', { value: i, selected: i === idx }, `${l}/${state.year}`)));

  renderBody();
  // Dữ liệu tháng thay đổi từ chỗ khác (đổi năm) → dựng lại; còn thay đổi do chính trang này đã được renderBody xử lý.
  return { el: h('section', {}, h('h2', {}, 'Thu chi theo tháng'), h('div', { class: 'row' }, h('label', {}, 'Tháng', select)), body), update() {} };
}
