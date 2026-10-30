// Danh mục lấy nguyên từ sheet "Từ khóa" của Mockup.xlsx.

export const EXPENSE_CATEGORIES = [
  'Mua thực phẩm',
  'Mua đồ dùng trong nhà',
  'Đi ăn ở ngoài',
  'Chi tiền phát triển bản thân',
  'Chi tiền bảo hiểm',
  'Chi tiền điện, nước, internet, điện thoại, xăng xe',
  'Chi tiền giải trí, quà tặng',
  'Chi tiền cho con',
  'Chi tiền trả nợ',
  'Chi tiền cho tặng gia đình',
];

export const INCOME_CATEGORIES = ['Lương từ công ty', 'Thu nhập khác'];

export const DEVELOPMENT_CATEGORIES = [
  'Mua sách',
  'Khóa học ngắn hạn',
  'Khóa học dài hạn',
  'Tham gia các buổi diễn thuyết',
  'Chi phát triển bản thân khác',
];

// Lợi suất trung bình 5 năm và rủi ro của sản phẩm đầu tư (Từ khóa!W12:AC23).
export const PRODUCTS = [
  { name: 'ETF - ETFVFM', ret: 0.13, risk: 0.18 },
  { name: 'ETF - ETFFINLEAD', ret: 0.15, risk: 0.2 },
  { name: 'DCBC', ret: 0.16, risk: 0.2 },
  { name: 'DCDS', ret: 0.11, risk: 0.1 },
  { name: 'DCBF', ret: 0.09, risk: 0.08 },
  { name: 'Trái phiếu Techcombank', ret: 0.105, risk: 0.06 },
  { name: 'Trái phiếu FE Credit', ret: 0.1, risk: 0.08 },
  { name: 'Finhay', ret: 0.06, risk: 0.07 },
  { name: 'Bảo hiểm thuần túy', ret: 0.04, risk: 0.05 },
  { name: 'BH liên kết đầu tư', ret: 0.12, risk: 0.05 },
  { name: 'Tiền gửi ngân hàng', ret: 0.05, risk: 0.02 },
  { name: 'Cổ phiếu riêng lẻ', ret: 0.12, risk: 0.06 },
];

export const PRODUCT_BY_NAME = new Map(PRODUCTS.map((p) => [p.name, p]));

export const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
