import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, averageRequiredReturn, milestones, GROUPS } from '../../src/domain/simulation.js';
import { buildSchedule } from '../../src/domain/goals.js';
import { createDefaultPlan } from '../../src/domain/defaultPlan.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const plan = createDefaultPlan();
const at = (rows, y) => rows.find((r) => r.year === y);

// Giá trị kỳ vọng lấy từ ô Excel đã tính (sheet "Mục tiêu tài chính" Phần 3).
test('khớp Excel: Du lịch Thái Lan, tiền gửi năm 2024 = F154 = 10.769172296075029', () => {
  // chỉ có Du lịch + Quỹ dự phòng hoạt động năm 2023–2024; tách riêng để cô lập sản phẩm "Tiền gửi ngân hàng"
  const only = { ...plan, goals: [plan.goals[1]] };
  const rows = simulate(only);
  close(at(rows, 2023).byProduct['Tiền gửi ngân hàng'], 5.2532547785731847);
  close(at(rows, 2024).byProduct['Tiền gửi ngân hàng'], 10.769172296075029);
  close(at(rows, 2025).byProduct['Tiền gửi ngân hàng'], 16.560885689451965);
});

test('khớp Excel: Khởi nghiệp, tiền gửi năm 2030 = X160 = 130.39952384311175; hết hạn về 0', () => {
  const only = { ...plan, goals: [plan.goals[4]] };
  const rows = simulate(only);
  assert.equal(at(rows, 2027).total, 0); // chưa bắt đầu: không có số dư (không sao chép lỗi "năm đầu" của Excel)
  close(at(rows, 2028).byProduct['Tiền gửi ngân hàng'], 41.363845786871295);
  close(at(rows, 2030).byProduct['Tiền gửi ngân hàng'], 130.39952384311175);
  assert.equal(at(rows, 2033).total, 0); // sau 2032 về 0
});

test('hưu trí giữ số dư và sinh lãi sau khi kết thúc; không có cờ thì về 0', () => {
  const retire = plan.goals[7];
  const held = simulate({ ...plan, goals: [retire] });
  const end = at(held, 2040).total;
  assert.ok(end > 0);
  close(at(held, 2041).total, at(held, 2040).byProduct['Tiền gửi ngân hàng'] * 1.05 + at(held, 2040).byProduct['BH liên kết đầu tư'] * 1.12);
  const reset = simulate({ ...plan, goals: [{ ...retire, holdAfterEnd: false }] });
  assert.equal(at(reset, 2041).total, 0);
});

test('tỷ trọng nhóm tài sản cộng lại bằng 1 khi có số dư; lợi suất cần thiết nằm trong khoảng lợi suất nhóm', () => {
  const rows = simulate(plan);
  for (const r of rows.filter((x) => x.total > 0)) {
    const s = Object.values(r.classShare).reduce((a, b) => a + b, 0);
    close(s, 1, 1e-9);
    const rets = GROUPS.map((g) => g.ret);
    assert.ok(r.requiredReturn >= Math.min(...rets) - 1e-9 && r.requiredReturn <= Math.max(...rets) + 1e-9);
  }
});

test('năm không có số dư: tỷ trọng 0, lợi suất 0; trung bình tính cả năm 0', () => {
  const rows = simulate({ ...plan, goals: [] });
  assert.ok(rows.every((r) => r.total === 0 && r.requiredReturn === 0));
  assert.equal(averageRequiredReturn(rows), 0);
  assert.equal(averageRequiredReturn([]), 0);
  const some = [{ requiredReturn: 0.1 }, { requiredReturn: 0 }];
  close(averageRequiredReturn(some), 0.05);
});

test('sản phẩm lạ và mục tiêu nợ bị bỏ qua, không làm hỏng mô phỏng', () => {
  const g = { ...plan.goals[1], products: [{ name: 'Không tồn tại', weight: 1 }] };
  const rows = simulate({ ...plan, goals: [plan.goals[0], g] });
  assert.ok(rows.every((r) => r.total === 0));
});

test('các mốc tuổi: tuổi hiện tại, +5, … và dùng thu nhập cần có từ lộ trình', () => {
  const sch = buildSchedule(plan).rows;
  const m = milestones(sch, simulate(plan), plan.age);
  assert.deepEqual(m.map((x) => x.age), [21, 26, 31, 36, 41, 46]);
  close(m[1].incomeNeeded, 28.502822755933906 / 1 * 1); // tuổi 26 = năm 2028
  assert.ok(m[0].classShare.stock >= 0);
});
