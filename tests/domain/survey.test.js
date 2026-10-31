import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RISK_SURVEY, CIRCUMSTANCE_SURVEY, scoreSurvey, riskResult, circumstanceResult, surveyOutcome } from '../../src/domain/survey.js';
import { summarizeDevelopment, summarizeDevelopmentYear } from '../../src/domain/budget.js';
import { DEVELOPMENT_CATEGORIES } from '../../src/domain/catalog.js';

// Đáp án mẫu trong Mockup.xlsx (cột C đánh dấu "x") → tổng điểm F59 = 23 và F64:F125 = 36.
const RISK_SAMPLE = { 0: 4, 1: 4, 2: 2, 3: 2, 4: 1, 5: 1, 6: 2, 7: 1, 8: 0, 9: 1 };
const CIRC_SAMPLE = { 0: 2, 1: 2, 2: 0, 3: 4, 4: 2, 5: 4, 6: 3, 7: 3, 8: 0, 9: 1, 10: 2 };

test('khảo sát rủi ro mẫu: 23 điểm → trung lập (khớp F59 và A59)', () => {
  const s = scoreSurvey(RISK_SURVEY, RISK_SAMPLE);
  assert.equal(s.total, 23);
  assert.ok(s.complete);
  assert.match(surveyOutcome('risk', RISK_SAMPLE).result.text, /trung lập với rủi ro/);
});

test('khảo sát hoàn cảnh mẫu: 36 điểm → bình thường (khớp A126)', () => {
  const s = scoreSurvey(CIRCUMSTANCE_SURVEY, CIRC_SAMPLE);
  assert.equal(s.total, 36);
  assert.match(surveyOutcome('circumstance', CIRC_SAMPLE).result.text, /bình thường/);
});

test('ngưỡng kết quả rủi ro và hoàn cảnh đúng biên của công thức', () => {
  assert.equal(riskResult(6).level, 'low');
  assert.equal(riskResult(17).level, 'low');
  assert.equal(riskResult(18).level, 'medium');
  assert.equal(riskResult(27).level, 'medium');
  assert.equal(riskResult(28).level, 'high');
  assert.equal(circumstanceResult(11).level, 1);
  assert.equal(circumstanceResult(20).level, 1);
  assert.equal(circumstanceResult(21).level, 2);
  assert.equal(circumstanceResult(29).level, 2);
  assert.equal(circumstanceResult(30).level, 3);
  assert.equal(circumstanceResult(38).level, 3);
  assert.equal(circumstanceResult(39).level, 4);
  assert.equal(circumstanceResult(41).level, 4);
  assert.equal(circumstanceResult(42).level, 5);
});

test('quirk của mockup được giữ: câu 1 đáp án ">4" không có điểm', () => {
  assert.equal(RISK_SURVEY[0].options[4].score, 0);
  const all = { ...RISK_SAMPLE, 0: 2 }; // chọn "3" thay vì ">4": +3 điểm
  assert.equal(scoreSurvey(RISK_SURVEY, all).total, 26);
});

test('chưa trả lời đủ: không đưa kết luận; đáp án sai chỉ số bị bỏ qua', () => {
  const partial = surveyOutcome('risk', { 0: 1 });
  assert.equal(partial.result, null);
  assert.equal(partial.answered, 1);
  const bad = scoreSurvey(RISK_SURVEY, { 0: 99, 1: -1, 2: 'a', 3: 1.5 });
  assert.equal(bad.answered, 0);
  assert.equal(surveyOutcome('risk', undefined).result, null);
});

test('chi phát triển bản thân: thống kê theo danh mục và 12 tháng (T1: sách 0,1; khóa ngắn hạn 1 → 1,1)', () => {
  const t1 = [
    { category: 'Mua sách', amount: 0.1 },
    { category: 'Khóa học ngắn hạn', amount: 1 },
  ];
  const s = summarizeDevelopment(t1, DEVELOPMENT_CATEGORIES);
  assert.equal(s.byCategory['Mua sách'], 0.1);
  assert.ok(Math.abs(s.total - 1.1) < 1e-12);
  const months = Array.from({ length: 12 }, () => ({}));
  months[0] = { development: t1 };
  months[1] = { development: [{ category: 'Mua sách', amount: 0.5 }] };
  const y = summarizeDevelopmentYear(months, DEVELOPMENT_CATEGORIES);
  assert.equal(y.rows.find((r) => r.category === 'Mua sách').total, 0.6);
  assert.ok(Math.abs(y.total - 1.6) < 1e-12);
  assert.equal(y.monthTotals[5], 0);
  assert.throws(() => summarizeDevelopment([{ category: 'x', amount: -1 }], DEVELOPMENT_CATEGORIES), TypeError);
});
