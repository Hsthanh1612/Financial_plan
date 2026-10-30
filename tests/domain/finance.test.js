import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pmt, pv, goalYears, monthlyDebtPayment, monthlySaving, expectedReturn } from '../../src/domain/finance.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// GiÃ¡ trá»‹ ká»³ vá»ng láº¥y tá»« Ã´ Ä‘Ã£ tÃ­nh trong Mockup.xlsx (sheet "Má»¥c tiÃªu tÃ i chÃ­nh").
test('ná»£ chung cÆ°: O14=16, O15=0.92492502694696199, O16=11.099100323363544', () => {
  const r = monthlyDebtPayment({ startYear: 2037, endYear: 2052, annualRate: 0.08, totalDebt: 500, alreadyPaid: 400 });
  assert.equal(r.years, 16);
  assert.equal(r.remaining, 100);
  close(r.monthly, 0.92492502694696199);
  close(r.yearly, 11.099100323363544);
});

test('du lá»‹ch ThÃ¡i Lan: O43=0.87554246309553085', () => {
  const rate = expectedReturn([
    { weight: 0.5, return: 0.05 },
    { weight: 0.2, return: 0.15 },
    { weight: 0.3, return: 0.105 },
  ]);
  close(rate, 0.0865);
  const r = monthlySaving({ startYear: 2023, endYear: 2026, annualRate: rate, currentSaved: 0, target: 50 });
  assert.equal(r.years, 4);
  close(r.monthly, 0.87554246309553085);
  close(r.yearly, 10.506509557146369);
});

test('khá»Ÿi nghiá»‡p, mua chung cÆ°, hÆ°u trÃ­ khá»›p Excel', () => {
  close(monthlySaving({ startYear: 2028, endYear: 2032, annualRate: 0.075, target: 500 }).monthly, 6.8939742978118819);
  close(monthlySaving({ startYear: 2025, endYear: 2037, annualRate: 0.16, target: 1500 }).monthly, 2.900567205760193);
  close(monthlySaving({ startYear: 2031, endYear: 2040, annualRate: 0.085, target: 500 }).monthly, 2.6576177770588902);
});

test('hÆ°u trÃ­: O87 = -PV(ls/12, 30, 15, 500) = 724.30582410044906 (giá»¯ nguyÃªn cÃ´ng thá»©c mockup)', () => {
  close(-pv(0.145 / 12, 30, 15, 500), 724.30582410044906);
});

test('biÃªn: nÄƒm káº¿t thÃºc < nÄƒm báº¯t Ä‘áº§u cho 0 nÄƒm vÃ  0 tiá»n', () => {
  assert.equal(goalYears(2030, 2020), 0);
  assert.equal(monthlySaving({ startYear: 2030, endYear: 2020, annualRate: 0.1, target: 100 }).monthly, 0);
});

test('biÃªn: lÃ£i 0% chia Ä‘á»u; nper=0 vÃ  Ä‘áº§u vÃ o sai kiá»ƒu bá»‹ tá»« chá»‘i', () => {
  close(pmt(0, 12, 120), -10);
  assert.throws(() => pmt(0.01, 0, 100), RangeError);
  assert.throws(() => pmt('0.01', 12, 100), TypeError);
  assert.throws(() => pmt(NaN, 12, 100), TypeError);
});

