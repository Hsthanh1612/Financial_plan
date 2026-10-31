import { h } from '../dom.js';
import { RISK_SURVEY, CIRCUMSTANCE_SURVEY, surveyOutcome } from '../../domain/survey.js';

const SECTIONS = [
  { kind: 'risk', title: 'Khảo sát 1: Khả năng chịu đựng rủi ro đầu tư', questions: RISK_SURVEY },
  { kind: 'circumstance', title: 'Khảo sát 2: Hoàn cảnh', questions: CIRCUMSTANCE_SURVEY },
];

/** Bảng khảo sát: mỗi câu chọn 1 đáp án (radio) thay cho việc đánh dấu "x" trong Excel; điểm và kết luận tính theo công thức của sheet. */
export function surveyPage(ctx) {
  const { state } = ctx;
  const results = new Map();

  function refresh(kind) {
    const o = surveyOutcome(kind, state.plan.survey?.[kind]);
    const box = results.get(kind);
    box.replaceChildren(
      h('strong', {}, o.result ? `Kết quả: ${o.result.text}` : `Chưa hoàn thành: đã trả lời ${o.answered}/${o.questions} câu.`),
      h('span', { class: 'status' }, ` (tổng điểm ${o.total})`));
  }

  const sections = SECTIONS.map(({ kind, title, questions }) => {
    const resultBox = h('p', { role: 'status', 'aria-live': 'polite' });
    results.set(kind, resultBox);
    const qs = questions.map((q, qi) => {
      const chosen = state.plan.survey?.[kind]?.[qi];
      return h('fieldset', { class: 'q' },
        h('legend', {}, `${qi + 1}. ${q.q}`),
        q.options.map((opt, oi) => h('label', { class: 'check' },
          h('input', {
            type: 'radio', name: `${kind}-${qi}`, value: oi, checked: chosen === oi,
            onChange: () => {
              ctx.updatePlan((p) => {
                const cur = { ...(p.survey ?? {}) };
                cur[kind] = { ...(cur[kind] ?? {}), [qi]: oi };
                p.survey = cur;
              });
              refresh(kind);
            },
          }), opt.label)));
    });
    refresh(kind);
    return h('section', {}, h('h3', {}, title), qs, resultBox);
  });

  return {
    el: h('section', {}, h('h2', {}, 'Bảng khảo sát đánh giá bản thân'), h('p', { class: 'status' }, 'Chỉ chọn 1 đáp án cho mỗi câu hỏi. Kết quả chỉ hiển thị khi đã trả lời đủ các câu.'), sections),
    update() {},
  };
}
