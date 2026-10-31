import { h, fmt } from '../dom.js';
import { numInput, textInput } from '../inputs.js';
import { buildSchedule } from '../../domain/goals.js';
import { PRODUCTS } from '../../domain/catalog.js';
import { MAX_GOALS, newGoal } from '../../domain/plan.js';
import { surveyOutcome } from '../../domain/survey.js';

export { numInput };

const KIND_LABEL = { debt: 'Trả nợ', invest: 'Đầu tư', fund: 'Quỹ' };

export function goalsPage(ctx) {
  const { state } = ctx;
  const errorBox = h('p', { class: 'error', role: 'alert' });
  const tableHost = h('div');
  const scheduleBody = h('tbody');
  const scheduleHint = h('p', { class: 'status' });
  const surveyBox = h('div', { class: 'cards' });
  let resultCells = [];

  function surveySummary() {
    const mk = (kind, title) => {
      const o = surveyOutcome(kind, state.plan.survey?.[kind]);
      const text = o.result ? o.result.text : `Chưa hoàn thành khảo sát (${o.answered}/${o.questions} câu).`;
      return h('div', { class: 'card' }, h('div', { class: 'label' }, title), h('div', {}, text));
    };
    surveyBox.replaceChildren(mk('risk', 'Khảo sát khả năng chịu đựng rủi ro'), mk('circumstance', 'Khảo sát hoàn cảnh'),
      h('div', { class: 'card' }, h('a', { href: '#survey' }, 'Làm hoặc sửa khảo sát')));
  }

  function productEditor(goal) {
    if (goal.kind === 'debt') return null;
    const commit = (i, name, weight) => ctx.updatePlan((plan) => {
      const g = plan.goals.find((x) => x.id === goal.id);
      const prods = [0, 1, 2].map((k) => g.products?.[k] ?? { name: '', weight: 0 });
      prods[i] = { name, weight: name ? weight : 0 };
      g.products = prods.filter((p) => p.name);
    });
    const rows = [0, 1, 2].map((i) => {
      const cur = goal.products?.[i] ?? { name: '', weight: 0 };
      const sel = h('select', { name: `sp-${goal.id}-${i}`, 'aria-label': `Sản phẩm ${i + 1} của ${goal.name}` },
        h('option', { value: '' }, '— không chọn —'),
        PRODUCTS.map((p) => h('option', { value: p.name, selected: p.name === cur.name }, p.name)));
      const w = numInput({ value: cur.weight, scale: 100, label: `Tỷ trọng % sản phẩm ${i + 1} của ${goal.name}`, max: 100, onCommit: (v) => commit(i, sel.value, v) });
      sel.addEventListener('change', () => commit(i, sel.value, Number(w.value.replace(',', '.')) / 100 || 0));
      return h('div', { class: 'row' }, sel, w, h('span', {}, '%'));
    });
    const hold = h('label', { class: 'check' },
      h('input', { type: 'checkbox', name: `hold-${goal.id}`, checked: goal.holdAfterEnd === true, onChange: (e) => ctx.updatePlan((plan) => { plan.goals.find((x) => x.id === goal.id).holdAfterEnd = e.target.checked; }) }),
      'Giữ số dư và sinh lãi sau khi kết thúc (như Hưu trí)');
    return h('details', {}, h('summary', {}, 'Danh mục sản phẩm đầu tư'), rows, hold);
  }

  function buildTable() {
    resultCells = [];
    const goals = state.plan.goals;
    const rows = goals.map((g) => {
      const set = (field) => (v) => ctx.updatePlan((p) => { p.goals.find((x) => x.id === g.id)[field] = v; });
      const cells = { years: h('td'), monthly: h('td'), yearly: h('td'), rate: h('td') };
      resultCells.push({ id: g.id, ...cells });
      return h('tr', {},
        h('th', { scope: 'row' },
          textInput({ value: g.name, label: `Tên mục tiêu ${g.name}`, maxlength: 120, onCommit: (v) => { if (v) ctx.updatePlan((p) => { p.goals.find((x) => x.id === g.id).name = v; }); } }),
          h('small', { class: 'status' }, KIND_LABEL[g.kind] ?? g.kind), productEditor(g)),
        h('td', {}, numInput({ value: g.amount, label: `Giá trị ${g.name}`, onCommit: set('amount') })),
        h('td', {}, numInput({ value: g.startYear, label: `Năm bắt đầu ${g.name}`, integer: true, max: 2100, onCommit: set('startYear') })),
        h('td', {}, numInput({ value: g.endYear, label: `Năm kết thúc ${g.name}`, integer: true, max: 2100, onCommit: set('endYear') })),
        h('td', {}, g.kind === 'debt' ? numInput({ value: g.annualRate, scale: 100, label: `Lãi suất % ${g.name}`, max: 100, onCommit: set('annualRate') }) : null),
        h('td', {}, g.kind === 'debt'
          ? numInput({ value: g.alreadyPaid ?? 0, label: `Đã thanh toán ${g.name}`, onCommit: set('alreadyPaid') })
          : numInput({ value: g.currentSaved ?? 0, label: `Tích lũy hiện có ${g.name}`, onCommit: set('currentSaved') })),
        cells.rate, cells.years, cells.monthly, cells.yearly,
        h('td', {}, h('button', { class: 'btn', type: 'button', 'aria-label': `Xóa mục tiêu ${g.name}`, onClick: () => {
          if (!window.confirm(`Xóa mục tiêu "${g.name}"?`)) return;
          ctx.updatePlan((p) => { p.goals = p.goals.filter((x) => x.id !== g.id); });
          rebuild();
        } }, 'Xóa')));
    });
    const full = goals.length >= MAX_GOALS;
    const add = (kind, label) => h('button', { class: 'btn', type: 'button', disabled: full, onClick: () => {
      ctx.updatePlan((p) => { p.goals = [...p.goals, newGoal(kind, p.startYear)]; });
      rebuild();
    } }, label);
    tableHost.replaceChildren(
      h('div', { class: 'table-wrap' }, h('table', {},
        h('caption', {}, 'Kế hoạch từng mục tiêu (triệu đồng)'),
        h('thead', {}, h('tr', {}, ['Mục tiêu', 'Giá trị', 'Năm BĐ', 'Năm KT', 'Lãi vay %', 'Đã trả / tích lũy', 'Lợi suất', 'Số năm', 'Mỗi tháng', 'Mỗi năm', ''].map((t) => h('th', { scope: 'col' }, t)))),
        goals.length ? h('tbody', {}, rows) : h('tbody', {}, h('tr', {}, h('td', { colspan: 11 }, 'Chưa có mục tiêu nào.'))))),
      h('div', { class: 'row' }, add('invest', 'Thêm mục tiêu đầu tư'), add('debt', 'Thêm khoản nợ'),
        full ? h('span', { class: 'status' }, `Tối đa ${MAX_GOALS} mục tiêu.`) : null));
  }

  function update() {
    surveySummary();
    let result;
    try {
      result = buildSchedule(state.plan);
      errorBox.textContent = '';
    } catch (e) {
      errorBox.textContent = `Không tính được: ${e.message ?? 'dữ liệu không hợp lệ'}`;
      return;
    }
    const byId = new Map(result.summaries.map((s) => [s.goal.id, s]));
    for (const c of resultCells) {
      const s = byId.get(c.id);
      if (!s) continue;
      c.rate.textContent = `${fmt(s.annualRate * 100)}%`;
      c.years.textContent = String(s.years);
      c.monthly.textContent = fmt(s.monthly);
      c.yearly.textContent = fmt(s.yearly);
    }
    scheduleBody.replaceChildren(...result.rows.filter((r) => r.monthlyTotal > 0).map((r) =>
      h('tr', {}, h('th', { scope: 'row' }, String(r.year)), h('td', {}, String(r.age)), h('td', {}, fmt(r.monthlyTotal)), h('td', {}, fmt(r.incomeNeeded)))));
    scheduleHint.textContent = `Thu nhập cần có = tổng tiền/tháng ÷ tỷ lệ tiết kiệm (${fmt(state.plan.savingRate * 100)}%).`;
  }

  function rebuild() { buildTable(); update(); }

  const el = h('section', {},
    h('h2', {}, 'Mục tiêu tài chính'), surveyBox, errorBox, tableHost,
    h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Lộ trình theo năm'),
      h('thead', {}, h('tr', {}, ['Năm', 'Tuổi', 'Cần tiết kiệm / tháng', 'Thu nhập cần có / tháng'].map((t) => h('th', { scope: 'col' }, t)))),
      scheduleBody)),
    scheduleHint);
  rebuild();
  return { el, update };
}
