// Mọi truy cập Firestore của ứng dụng đi qua module này (UI không tự gọi Firestore).
import { doc, getDoc, getDocs, collection, query, where, orderBy, limit, runTransaction, serverTimestamp, documentId } from 'firebase/firestore';
import { AppError, toAppError } from './errors.js';
import { createDefaultPlan } from '../domain/defaultPlan.js';

export const monthId = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

/** Chuyển document Firestore thành dữ liệu thuần (bỏ updatedAt Timestamp). */
function plain(data) {
  const { updatedAt, ...rest } = data;
  return rest;
}

function emptyMonth(year, month) {
  return { year, month, planIncome: {}, planExpense: {}, income: [], expense: [], reasons: {}, rev: -1 };
}

/**
 * Ghi có kiểm soát xung đột: chỉ ghi khi rev trên server đúng bằng rev local (hoặc tài liệu chưa tồn tại).
 * Trả về rev mới do server xác nhận.
 */
async function writeVersioned(db, ref, localRev, data) {
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const serverRev = snap.exists() ? snap.data().rev : -1;
      if (serverRev !== localRev) {
        throw new AppError('conflict', 'Dữ liệu đã được thay đổi ở nơi khác. Hãy tải lại.');
      }
      const rev = serverRev + 1;
      tx.set(ref, { ...data, rev, updatedAt: serverTimestamp() });
      return rev;
    });
  } catch (e) {
    throw toAppError(e);
  }
}

export function createPlanRepository(db, uid) {
  if (!uid) throw new AppError('auth', 'Chưa đăng nhập.');
  const planRef = doc(db, 'users', uid, 'plan', 'main');
  const monthRef = (year, month) => doc(db, 'users', uid, 'months', monthId(year, month));

  return {
    /** Đọc plan; nếu chưa có thì KHÔNG tự ghi — trả null để tầng trên quyết định (tránh ghi đè khi lỗi đọc). */
    async loadPlan() {
      try {
        const snap = await getDoc(planRef);
        return snap.exists() ? plain(snap.data()) : null;
      } catch (e) {
        throw toAppError(e);
      }
    },

    /** Khởi tạo plan mặc định từ mockup, chạy lại không ghi đè (idempotent). */
    async bootstrapPlan() {
      const existing = await this.loadPlan();
      if (existing) return { plan: existing, created: false };
      const base = createDefaultPlan();
      const rev = await writeVersioned(db, planRef, -1, base);
      return { plan: { ...base, rev }, created: true };
    },

    savePlan(plan) {
      const { rev, ...data } = plan;
      return writeVersioned(db, planRef, rev, data);
    },

    /** Đọc tối đa 12 tháng của một năm, theo thứ tự documentId; trả mảng 12 phần tử (tháng chưa có = rỗng, rev -1). */
    async loadYear(year) {
      try {
        // Chỉ đọc đúng 12 tài liệu của năm (khoảng documentId) để tiết kiệm quota.
        const q = query(
          collection(db, 'users', uid, 'months'),
          where(documentId(), '>=', monthId(year, 1)),
          where(documentId(), '<=', monthId(year, 12)),
          orderBy(documentId()),
          limit(12),
        );
        const snap = await getDocs(q);
        const byMonth = new Map();
        snap.forEach((d) => {
          const data = plain(d.data());
          byMonth.set(data.month, data);
        });
        return Array.from({ length: 12 }, (_, i) => byMonth.get(i + 1) ?? emptyMonth(year, i + 1));
      } catch (e) {
        throw toAppError(e);
      }
    },

    saveMonth(month) {
      const { rev, ...data } = month;
      return writeVersioned(db, monthRef(month.year, month.month), rev, data);
    },
  };
}
