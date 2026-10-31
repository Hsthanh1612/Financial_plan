import { h, fmt, signClass } from '../dom.js';
import { numInput, textInput } from '../inputs.js';
import { buildSchedule } from '../../domain/goals.js';
import { simulate, milestones, CLASS_LABELS } from '../../domain/simulation.js';

const FIRST_INCOME_AGE = 22; // mockup: "Tuổi bắt đầu có thu nhập là 22 tuổi"
const LAST_AGE = 59;
const pct = (x) => `${fmt(x * 100)}%`;

/** Cân đối lộ trình nghề nghiệp: phần 1 (phân bổ tài sản theo mốc tuổi) và phần 2 (thu nhập thực tế vs lộ trình vs số tiền cần có). */
export function careerPage(ctx) {
  const { state } = ctx;
  const host = h('div');
  const errorBox = h('p', { class: 'error', role: 'alert' });

  const entry = (age) => state.plan.career.find((c) => c.age === age) ?? { age, actual: 0, path: 0, skill: '' };
  function setEntry(age, patch) {
    ctx.updatePlan((p) => {
      const list = [...(p.career ?? [])];
      const i = list.findIndex((c) => c.age === age);
      const next = { ...(i >= 0 ? list[i] : { age, actual: 0, path: 0, skill: '' }), ...patch };
      const empty = !next.actual && !next.path && !next.skill;
      if (i >= 0) { if (empty) list.splice(i, 1); else list[i] = next; } else if (!empty) list.push(next);
      p.career = list.sort((a, b) => a.age - b.age);
    });
  }

  function render() {
    let schedule; let sim;
    try {
      schedule = buildSchedule(state.plan).rows;
      sim = simulate(state.plan);
      errorBox.textContent = '';
    } catch (e) {
      errorBox.textContent = `Không tính được: ${e.message ?? 'dữ liệu không hợp lệ'}`;
      return;
    }
    const ms = milestones(schedule, sim, state.plan.age);
    const part1 = h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Phần 1: Lộ trình tài chính cá nhân tổng thể'),
      h('thead', {}, h('tr', {}, ['Tuổi', 'Thu nhập cần có / tháng', ...Object.values(CLASS_LABELS), 'Mức sinh lời cần thiết', 'Kỹ năng cần thiết'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, ms.map((m) => h('tr', {},
        h('th', { scope: 'row' }, String(m.age)), h('td', {}, fmt(m.incomeNeeded)),
        ...Object.keys(CLASS_LABELS).map((k) => h('td', {}, pct(m.classShare[k]))),
        h('td', {}, pct(m.requiredReturn)),
        h('td', {}, textInput({ value: entry(m.age).skill ?? '', label: `Kỹ năng cần thiết tuổi ${m.age}`, maxlength: 120, onCommit: (v) => setEntry(m.age, { skill: v }) })))))));

    const byAge = new Map(schedule.map((r) => [r.age, r]));
    const rows = [];
    for (let age = Math.max(FIRST_INCOME_AGE, state.plan.age); age <= LAST_AGE; age += 1) {
      const e = entry(age);
      const need = byAge.get(age)?.incomeNeeded ?? 0;
      const diff = h('td', { class: signClass((e.path ?? 0) - need) }, fmt((e.path ?? 0) - need));
      const showDiff = (path) => { diff.textContent = fmt(path - need); diff.className = signClass(path - need); };
      rows.push(h('tr', {},
        h('th', { scope: 'row' }, String(age)),
        h('td', {}, numInput({ value: e.actual ?? 0, label: `Thu nhập thực tế tuổi ${age}`, onCommit: (v) => setEntry(age, { actual: v }) })),
        h('td', {}, fmt(need)),
        h('td', {}, numInput({ value: e.path ?? 0, label: `Thu nhập theo lộ trình nghề nghiệp tuổi ${age}`, onCommit: (v) => { setEntry(age, { path: v }); showDiff(v); } })),
        diff));
    }
    const part2 = h('div', { class: 'table-wrap' }, h('table', {},
      h('caption', {}, 'Phần 2: Lộ trình nghề nghiệp chi tiết (triệu đồng / tháng)'),
      h('thead', {}, h('tr', {}, ['Tuổi', 'Thu nhập thực tế', 'Số tiền cần có để đạt mục tiêu', 'Thu nhập theo lộ trình', 'Lộ trình − cần có'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, rows)));
    host.replaceChildren(part1, part2);
  }

  render();
  return {
    el: h('section', {}, h('h2', {}, 'Cân đối lộ trình nghề nghiệp'), errorBox, host,
      h('p', { class: 'status' }, 'Phân bổ tài sản và mức sinh lời cần thiết là ước tính từ số dư tích lũy các mục tiêu (xem docs/ALGORITHM-SPEC.md). Số tiền cần có được xếp theo đúng tuổi.')),
    update() { /* nhập liệu tại chỗ; tính lại khi mở trang hoặc đổi dữ liệu mục tiêu */ },
  };
}
