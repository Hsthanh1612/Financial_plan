import { h, parseAmount } from './dom.js';

/** Ô nhập số: chỉ ghi nhận khi hợp lệ, ngược lại đánh dấu lỗi và KHÔNG thay đổi dữ liệu. */
export function numInput({ value, label, onCommit, scale = 1, integer = false, max = Infinity }) {
  const shown = value * scale === 0 ? '0' : String(+(value * scale).toFixed(6));
  const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', name: label, 'aria-label': label, value: shown });
  input.addEventListener('change', () => {
    const n = parseAmount(input.value);
    const ok = n !== null && n <= max && (!integer || Number.isInteger(n));
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (ok) onCommit(n / scale);
  });
  return input;
}

/** Ô nhập chữ giới hạn độ dài (khớp giới hạn dữ liệu); ghi nhận khi rời ô. */
export function textInput({ value = '', label, onCommit, maxlength = 200, placeholder }) {
  const input = h('input', { type: 'text', autocomplete: 'off', name: label, 'aria-label': label, maxlength, placeholder, value });
  input.addEventListener('change', () => onCommit(input.value.trim().slice(0, maxlength)));
  return input;
}
