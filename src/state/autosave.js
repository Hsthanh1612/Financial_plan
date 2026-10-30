// Tự động lưu có debounce, tuần tự hóa ghi, chống ghi trùng và retry có giới hạn.
// Trạng thái: idle | dirty | saving | saved | error | conflict

const RETRYABLE = new Set(['network']);

/**
 * @param {{save: () => Promise<void>, delay?: number, maxRetries?: number, retryDelay?: number,
 *          onStatus?: (s: {state: string, error?: Error}) => void}} opts
 * `save` phải ghi snapshot MỚI NHẤT mỗi lần được gọi và ném lỗi nếu server không xác nhận.
 */
export function createAutosaver({ save, delay = 800, maxRetries = 3, retryDelay = 1000, onStatus = () => {} }) {
  let timer = null;
  let running = null;
  let dirty = false;
  let stopped = false;

  const set = (state, error) => onStatus({ state, error });

  async function run() {
    if (running || stopped) return running;
    running = (async () => {
      let attempt = 0;
      while (dirty && !stopped) {
        dirty = false; // thay đổi đến trong lúc đang ghi sẽ đặt lại cờ và được ghi ở vòng sau
        set('saving');
        try {
          await save();
          attempt = 0;
        } catch (e) {
          if (e?.kind === 'conflict') {
            stopped = true;
            set('conflict', e);
            break;
          }
          dirty = true;
          if (RETRYABLE.has(e?.kind) && attempt < maxRetries) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, retryDelay * attempt));
            continue;
          }
          // Lỗi quyền/dữ liệu/hết lượt thử: không retry vô hạn, giữ dirty để người dùng thấy chưa đồng bộ.
          set('error', e);
          break;
        }
      }
      if (!dirty && !stopped) set('saved');
      running = null;
    })();
    return running;
  }

  return {
    /** Gọi mỗi khi dữ liệu thay đổi. */
    markDirty() {
      if (stopped) return;
      dirty = true;
      set('dirty');
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    /** Ghi ngay (đổi tab, đóng trang, bấm nút Lưu); đợi ghi đang chạy xong. */
    async flush() {
      clearTimeout(timer);
      if (dirty) await run();
      else await running;
    },
    /** Cho phép lưu lại sau khi người dùng xử lý lỗi/xung đột. */
    resume() {
      stopped = false;
      if (dirty) this.markDirty();
    },
    dispose() {
      stopped = true;
      clearTimeout(timer);
    },
    get isDirty() {
      return dirty;
    },
  };
}
