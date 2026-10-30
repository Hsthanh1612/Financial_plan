import { h, fmt, signClass } from '../dom.js';
import { summarizeYear } from '../../domain/budget.js';
import { MONTH_LABELS } from '../../domain/catalog.js';

function chart(rows) {
  const W = 720, H = 220, pad = 28;
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expense]));
  const bw = (W - pad * 2) / 12;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Biểu đồ cột thu nhập và chi tiêu theo tháng');
  const rect = (x, y, w, hgt, fill) => {
    const r = document.createElementNS(ns, 'rect');
    for (const [k, v] of Object.entries({ x, y, width: w, height: hgt, fill })) r.setAttribute(k, v);
    return r;
  };
  rows.forEach((r, i) => {
    const x = pad + i * bw;
    const hi = (r.income / max) * (H - pad * 2);
    const he = (r.expense / max) * (H - pad * 2);
    svg.append(rect(x + 2, H - pad - hi, bw / 2 - 3, hi, 'var(--ux-good)'));
    svg.append(rect(x + bw / 2, H - pad - he, bw / 2 - 3, he, 'var(--ux-bad)'));
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', x + bw / 2); t.setAttribute('y', H - 10); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '11'); t.setAttribute('fill', 'var(--ux-muted)');
    t.textContent = String(i + 1);
    svg.append(t);
  });
  return svg;
}

export function overviewPage(ctx) {
  const { state } = ctx;
  const y = summarizeYear(state.months);
  const empty = state.months.every((m) => m.rev === -1);
  const card = (label, value, cls = '') => h('div', { class: 'card' }, h('div', { class: 'label' }, label), h('div', { class: `value ${cls}` }, fmt(value)));
  const headers = ['', ...MONTH_LABELS, 'Tổng'];
  const rowOf = (label, key, total) => h('tr', {}, h('th', { scope: 'row' }, label),
    ...y.rows.map((r) => h('td', { class: key === 'saving' ? signClass(r[key]) : '' }, fmt(r[key]))), h('td', {}, fmt(total)));

  return h('section', {},
    h('h2', {}, `Theo dõi tài chính năm ${state.year}`),
    h('div', { class: 'cards' },
      card(`Tổng thu nhập ${state.year}`, y.totalIncome),
      card(`Tổng chi tiêu ${state.year}`, y.totalExpense),
      card(`Tiết kiệm ${state.year}`, y.totalSaving, signClass(y.totalSaving)),
    ),
    empty ? h('p', { class: 'empty' }, 'Chưa có dữ liệu thu chi cho năm này. Vào mục "Thu chi" để nhập.') : null,
    chart(y.rows),
    h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Thu – chi – tiết kiệm theo tháng (triệu đồng)'),
      h('thead', {}, h('tr', {}, headers.map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {},
        rowOf('Thu nhập', 'income', y.totalIncome),
        rowOf('Chi tiêu', 'expense', y.totalExpense),
        rowOf('Tiết kiệm', 'saving', y.totalSaving),
        rowOf('Kế hoạch chi', 'planExpense', y.rows.reduce((a, r) => a + r.planExpense, 0)),
        h('tr', {}, h('th', { scope: 'row' }, 'Lũy kế chênh lệch'),
          ...y.cumulativeVariance.map((v) => h('td', { class: signClass(v) }, fmt(v))), h('td', {}, '')),
      ),
    )),
  );
}
