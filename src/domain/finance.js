// Hàm tài chính tái hiện công thức Excel trong Mockup.xlsx (sheet "Mục tiêu tài chính").
// Quy ước dấu giống Excel: PMT/PV trả về số âm khi là dòng tiền ra.

function assertFinite(name, v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new TypeError(`${name} phải là số hữu hạn, nhận được: ${String(v)}`);
  }
}

/** Excel PMT(rate, nper, pv, fv = 0, type = 0). */
export function pmt(rate, nper, pv, fv = 0, type = 0) {
  assertFinite('rate', rate);
  assertFinite('nper', nper);
  assertFinite('pv', pv);
  assertFinite('fv', fv);
  if (nper === 0) throw new RangeError('nper không được bằng 0');
  if (rate === 0) return -(pv + fv) / nper;
  const f = Math.pow(1 + rate, nper);
  return -(rate * (fv + pv * f)) / ((1 + rate * type) * (f - 1));
}

/** Excel PV(rate, nper, pmt, fv = 0, type = 0). */
export function pv(rate, nper, payment, fv = 0, type = 0) {
  assertFinite('rate', rate);
  assertFinite('nper', nper);
  assertFinite('payment', payment);
  assertFinite('fv', fv);
  if (rate === 0) return -(fv + payment * nper);
  const f = Math.pow(1 + rate, nper);
  return -(fv + payment * (1 + rate * type) * ((f - 1) / rate)) / f;
}

/** Số năm của mục tiêu: IF(kt - bd > -0.1, kt - bd + 1, 0). */
export function goalYears(startYear, endYear) {
  assertFinite('startYear', startYear);
  assertFinite('endYear', endYear);
  return endYear - startYear > -0.1 ? endYear - startYear + 1 : 0;
}

/** Tiền trả nợ mỗi tháng: IF(n=0,0,-PMT(ls/12, n*12, còn lại)). */
export function monthlyDebtPayment({ startYear, endYear, annualRate, totalDebt, alreadyPaid }) {
  const years = goalYears(startYear, endYear);
  const remaining = totalDebt - alreadyPaid;
  const monthly = years === 0 ? 0 : -pmt(annualRate / 12, years * 12, remaining);
  return { years, remaining, monthly, yearly: monthly * 12 };
}

/** Tiền tiết kiệm mỗi tháng: IF(n=0,0,-PMT(ls/12, n*12, đã có, mục tiêu)). */
export function monthlySaving({ startYear, endYear, annualRate, currentSaved = 0, target }) {
  const years = goalYears(startYear, endYear);
  const monthly = years === 0 ? 0 : -pmt(annualRate / 12, years * 12, currentSaved, target);
  return { years, monthly, yearly: monthly * 12 };
}

/** Lợi suất kỳ vọng = SUMPRODUCT(tỷ trọng, lợi suất). */
export function expectedReturn(products) {
  return products.reduce((s, p) => s + p.weight * p.return, 0);
}
