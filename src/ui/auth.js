import { h } from './dom.js';

/** Màn hình đăng nhập/đăng ký bằng Firebase Authentication (Email/Mật khẩu). */
export function authScreen({ onSignIn, onSignUp }) {
  const email = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', spellcheck: 'false', id: 'email' });
  const pass = h('input', { type: 'password', name: 'password', required: true, minlength: 6, autocomplete: 'current-password', id: 'pass' });
  const err = h('p', { class: 'error', role: 'alert' });
  const busy = { v: false };
  async function run(fn, btn) {
    if (busy.v) return; // chống bấm nhiều lần
    busy.v = true; btn.disabled = true; err.textContent = '';
    try { await fn(email.value.trim(), pass.value); } catch (e) { err.textContent = e.message; }
    busy.v = false; btn.disabled = false;
  }
  const inBtn = h('button', { class: 'btn primary', type: 'submit' }, 'Đăng nhập');
  const upBtn = h('button', { class: 'btn', type: 'button', onClick: () => run(onSignUp, upBtn) }, 'Tạo tài khoản');
  return h('main', { class: 'auth', id: 'main' },
    h('h1', {}, 'Kế hoạch tài chính cá nhân'),
    h('form', { onSubmit: (e) => { e.preventDefault(); run(onSignIn, inBtn); } },
      h('label', { for: 'email' }, 'Email', email),
      h('label', { for: 'pass' }, 'Mật khẩu', pass),
      err, inBtn, upBtn));
}
