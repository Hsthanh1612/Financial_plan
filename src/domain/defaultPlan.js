// Kế hoạch khởi tạo lấy từ Mockup.xlsx (Mục tiêu bản thân + Mục tiêu tài chính + Từ khóa).
// Người dùng sửa được mọi giá trị sau khi khởi tạo.

const p = (name, weight) => ({ name, weight });

export function createDefaultPlan() {
  return {
    startYear: 2023,
    age: 21,
    savingRate: 0.4,
    goals: [
      { kind: 'debt', name: 'Vay mua chung cư', amount: 500, alreadyPaid: 400, annualRate: 0.08, startYear: 2037, endYear: 2052 },
      { kind: 'invest', name: 'Du lịch xuyên Thái Lan', amount: 50, currentSaved: 0, startYear: 2023, endYear: 2026,
        products: [p('Tiền gửi ngân hàng', 0.5), p('ETF - ETFFINLEAD', 0.2), p('Trái phiếu Techcombank', 0.3)] },
      { kind: 'invest', name: 'Quỹ dự phòng tài chính', amount: 100, currentSaved: 0, startYear: 2023, endYear: 2026,
        products: [p('Trái phiếu Techcombank', 1)] },
      { kind: 'invest', name: 'Đám cưới', amount: 200, currentSaved: 0, startYear: 2024, endYear: 2030,
        products: [p('ETF - ETFFINLEAD', 0.3), p('Trái phiếu Techcombank', 0.5), p('Tiền gửi ngân hàng', 0.2)] },
      { kind: 'invest', name: 'Khởi nghiệp', amount: 500, currentSaved: 0, startYear: 2028, endYear: 2032,
        products: [p('Tiền gửi ngân hàng', 0.5), p('Trái phiếu FE Credit', 0.5)] },
      { kind: 'invest', name: 'Mua chung cư', amount: 1500, currentSaved: 0, startYear: 2025, endYear: 2037,
        products: [p('DCBC', 1)] },
      { kind: 'fund', name: 'Cho con đi học đại học', amount: 500, currentSaved: 0, startYear: 2030, endYear: 2048,
        lifeYears: 30, monthlyNeed: 15, leaveBehind: 500,
        products: [p('ETF - ETFVFM', 0.5), p('DCBC', 0.5)] },
      { kind: 'invest', name: 'Hưu trí', amount: 500, currentSaved: 0, startYear: 2031, endYear: 2040,
        products: [p('Tiền gửi ngân hàng', 0.5), p('BH liên kết đầu tư', 0.5)] },
    ],
  };
}
