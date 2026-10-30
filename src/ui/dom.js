// Dựng DOM an toàn: mọi chuỗi đi qua textContent/setAttribute, không dùng innerHTML.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
export const fmt = (n) => nf.format(Number.isFinite(n) ? n : 0);

/** Đọc số không âm từ ô nhập; trả null nếu không hợp lệ. */
export function parseAmount(text) {
  const t = String(text).trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export const signClass = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
