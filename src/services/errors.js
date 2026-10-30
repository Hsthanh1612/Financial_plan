// Phân loại lỗi theo mục 7.2: thông báo dễ hiểu cho người dùng, giữ `cause` để gỡ lỗi.

export class AppError extends Error {
  constructor(kind, message, cause) {
    super(message);
    this.name = 'AppError';
    this.kind = kind; // config | data | auth | permission | network | query | conflict | unknown
    this.cause = cause;
  }
}

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  'auth/operation-not-allowed': 'Chưa bật đăng nhập Email/Mật khẩu trong Firebase Console.',
  'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng đợi rồi thử lại.',
  'auth/network-request-failed': 'Mất kết nối mạng.',
};

export function toAppError(e) {
  if (e instanceof AppError) return e;
  const code = e?.code ?? '';
  if (code.startsWith('auth/')) {
    const kind = code === 'auth/network-request-failed' ? 'network' : 'auth';
    return new AppError(kind, AUTH_MESSAGES[code] ?? 'Không thể xác thực. Vui lòng thử lại.', e);
  }
  if (code === 'permission-denied') return new AppError('permission', 'Bạn không có quyền thực hiện thao tác này.', e);
  if (code === 'unavailable') return new AppError('network', 'Không kết nối được máy chủ. Dữ liệu chưa được lưu.', e);
  if (code === 'failed-precondition') return new AppError('query', 'Truy vấn chưa sẵn sàng (có thể thiếu index).', e);
  if (code === 'invalid-argument') return new AppError('data', 'Dữ liệu không hợp lệ.', e);
  return new AppError('unknown', 'Đã xảy ra lỗi không xác định.', e);
}
