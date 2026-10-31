import { h, fmt, parseAmount, signClass } from '../dom.js';
import { numInput, textInput } from '../inputs.js';
import { compareWithPlan, summarizeMonth, summarizeDevelopment } from '../../domain/budget.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEVELOPMENT_CATEGORIES, MONTH_LABELS } from '../../domain/catalog.js';

const MAX_ENTRIES = { income: 200, expense: 200, development: 100 }; // khớp giới hạn trong Security Rules

export function budgetPage(ctx) {
  const { state } = ctx;
  let idx = Math.min(new Date().getMonth(), 11);
  const body = h('div');

  function entryForm(kind, categories) {
    const dev = kind === 'development';
    const list = state.months[idx][kind];
    const date = h('input', { type: 'date', name: `${kind}-date`, required: true, 'aria-label': 'Ngày', value: `${state.year}-${String(idx + 1).padStart(2, '0')}-01` });
    const cat = h('select', { name: `${kind}-category`, 'aria-label': 'Khoản mục' }, categories.map((c) => h('option', { value: c }, c)));
    const note = h('input', { type: 'text', name: `${kind}-note`, autocomplete: 'off', maxlength: 200, 'aria-label': 'Mô tả', placeholder: 'Ví dụ: Lương tháng 1…' });
    const amount = h('input', { type: 'text', name: `${kind}-amount`, autocomplete: 'off', inputmode: 'decimal', required: true, 'aria-label': 'Số tiền (triệu đồng)', placeholder: 'Ví dụ: 20…' });
    const expected = dev ? h('input', { type: 'text', name: 'dev-expected', autocomplete: 'off', maxlength: 120, 'aria-label': 'Kết quả tạo ra dự kiến', placeholder: 'Ví dụ: Bổ sung kiến thức…' }) : null;
    const actual = dev ? h('input', { type: 'text', name: 'dev-actual', autocomplete: 'off', maxlength: 120, 'aria-label': 'Kết quả tạo ra thực tế', placeholder: 'Ví dụ: Nâng cao chuyên môn…' }) : null;
    const err = h('span', { class: 'error', role: 'alert' });
    return h('form', { class: 'row', onSubmit: (e) => {
      e.preventDefault();
      const n = parseAmount(amount.value);
      if (n === null || !date.value) { err.textContent = 'Nhập ngày và số tiền hợp lệ (số không âm).'; return; }
      if (list.length >= MAX_ENTRIES[kind]) { err.textContent = `Tối đa ${MAX_ENTRIES[kind]} dòng mỗi tháng.`; return; }
      err.textContent = '';
      const row = { date: date.value, category: cat.value, note: note.value.trim(), amount: n };
      if (dev) { row.expected = expected.value.trim(); row.actual = actual.value.trim(); }
      ctx.updateMonth(idx, (m) => { m[kind] = [...m[kind], row]; });
      renderBody();
    } },
    h('label', {}, 'Ngày', date), h('label', {}, 'Khoản mục', cat), h('label', {}, 'Mô tả', note), h('label', {}, 'Số tiền', amount),
    dev ? h('label', {}, 'Kết quả dự kiến', expected) : null, dev ? h('label', {}, 'Kết quả thực tế', actual) : null,
    h('button', { class: 'btn primary', type: 'submit', disabled: list.length >= MAX_ENTRIES[kind] }, 'Thêm'), err);
  }

  function entryTable(kind) {
    const dev = kind === 'development';
    const list = state.months[idx][kind];
    if (!list.length) return h('p', { class: 'empty' }, 'Chưa có dòng nào.');
    const heads = ['Ngày', 'Khoản mục', 'Mô tả', 'Số tiền', ...(dev ? ['Kết quả dự kiến', 'Kết quả thực tế'] : []), ''];
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, heads.map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, list.map((e, i) => h('tr', {},
        h('td', {}, e.date), h('td', {}, e.category), h('td', {}, e.note), h('td', {}, fmt(e.amount)),
        dev ? h('td', {}, e.expected ?? '') : null, dev ? h('td', {}, e.actual ?? '') : null,
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
    const reasonOf = (cat) => m.reasons?.[`${kind}|${cat}`] ?? {};
    const setReason = (cat, patch) => ctx.updateMonth(idx, (mm) => {
      const key = `${kind}|${cat}`;
      const next = { ...(mm.reasons?.[key] ?? {}), ...patch };
      const reasons = { ...(mm.reasons ?? {}) };
      if (!next.reason && !next.measure) delete reasons[key]; else reasons[key] = next;
      mm.reasons = reasons;
    });
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, title),
      h('thead', {}, h('tr', {}, ['Khoản mục', 'Kế hoạch', 'Thực tế', 'Chênh lệch', 'Lý do', 'Biện pháp'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rows.map((r) => h('tr', {},
        h('th', { scope: 'row' }, r.category),
        h('td', {}, numInput({ value: r.planned, label: `Kế hoạch ${r.category}`, onCommit: (v) => {
          ctx.updateMonth(idx, (mm) => { (kind === 'income' ? mm.planIncome : mm.planExpense)[r.category] = v; });
          renderBody();
        } })),
        h('td', {}, fmt(r.actual)), h('td', { class: signClass(r.variance) }, fmt(r.variance)),
        h('td', {}, textInput({ value: reasonOf(r.category).reason ?? '', label: `Lý do chênh lệch ${r.category}`, maxlength: 200, onCommit: (v) => setReason(r.category, { reason: v }) })),
        h('td', {}, textInput({ value: reasonOf(r.category).measure ?? '', label: `Biện pháp ${r.category}`, maxlength: 200, onCommit: (v) => setReason(r.category, { measure: v }) }))))),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row' }, 'Tổng'), h('td', {}, fmt(totals.p)), h('td', {}, fmt(totals.a)), h('td', { class: signClass(totals.v) }, fmt(totals.v)), h('td'), h('td')))));
  }

  function developmentStats() {
    const s = summarizeDevelopment(state.months[idx].development, DEVELOPMENT_CATEGORIES);
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Thống kê các khoản chi đầu tư phát triển bản thân'),
      h('thead', {}, h('tr', {}, ['Danh mục', 'Giá trị đầu tư'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, DEVELOPMENT_CATEGORIES.map((c) => h('tr', {}, h('th', { scope: 'row' }, c), h('td', {}, fmt(s.byCategory[c]))))),
      h('tfoot', {}, h('tr', {}, h('th', { scope: 'row' }, 'Tổng số tiền đã chi'), h('td', {}, fmt(s.total))))));
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
      compareTable('expense', EXPENSE_CATEGORIES, 'Tổng kết chi tiêu'),
      h('h3', {}, 'Đầu tư phát triển bản thân'), entryForm('development', DEVELOPMENT_CATEGORIES), entryTable('development'), developmentStats());
  }

  const select = h('select', { name: 'month', 'aria-label': 'Chọn tháng', onChange: (e) => { idx = Number(e.target.value); renderBody(); } },
    MONTH_LABELS.map((l, i) => h('option', { value: i, selected: i === idx }, `${l}/${state.year}`)));

  renderBody();
  return { el: h('section', {}, h('h2', {}, 'Thu chi theo tháng'), h('div', { class: 'row' }, h('label', {}, 'Tháng', select)), body), update() {} };
}
