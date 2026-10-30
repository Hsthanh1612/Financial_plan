import { h } from '../dom.js';
import { numInput } from './goals.js';

export function settingsPage(ctx) {
  const { plan } = ctx.state;
  const yearInput = numInput({ value: ctx.state.year, label: 'Năm xem dữ liệu', integer: true, max: 2100, onCommit: (v) => ctx.setYear(v) });
  return {
    el: h('section', {},
      h('h2', {}, 'Cài đặt kế hoạch'),
      h('div', { class: 'row' },
        h('label', {}, 'Năm bắt đầu theo dõi', numInput({ value: plan.startYear, label: 'Năm bắt đầu theo dõi', integer: true, max: 2100, onCommit: (v) => ctx.updatePlan((p) => { p.startYear = v; }) })),
        h('label', {}, 'Tuổi tại năm bắt đầu', numInput({ value: plan.age, label: 'Tuổi tại năm bắt đầu', integer: true, max: 120, onCommit: (v) => ctx.updatePlan((p) => { p.age = v; }) })),
        h('label', {}, 'Tỷ lệ tiết kiệm mục tiêu (%)', numInput({ value: plan.savingRate, scale: 100, label: 'Tỷ lệ tiết kiệm mục tiêu', max: 100, onCommit: (v) => { if (v > 0) ctx.updatePlan((p) => { p.savingRate = v; }); } })),
        h('label', {}, 'Năm đang xem', yearInput)),
      h('p', { class: 'status' }, 'Mọi thay đổi được tự động lưu lên Cloud Firestore sau khi bạn nhập xong.')),
    update() {},
  };
}
