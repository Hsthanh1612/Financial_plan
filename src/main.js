import { watchAuth, signIn, signUp, logOut } from './services/firebase/authService.js';
import { db } from './services/firebase/app.js';
import { createPlanRepository } from './services/planRepository.js';
import { createSession } from './state/session.js';
import { authScreen } from './ui/auth.js';
import { h } from './ui/dom.js';
import { overviewPage } from './ui/pages/overview.js';
import { goalsPage } from './ui/pages/goals.js';
import { budgetPage } from './ui/pages/budget.js';
import { settingsPage } from './ui/pages/settings.js';
import { careerPage } from './ui/pages/career.js';
import { surveyPage } from './ui/pages/survey.js';

const root = document.getElementById('app');
const PAGES = [
  { id: 'overview', label: 'Tổng quan', build: overviewPage },
  { id: 'goals', label: 'Mục tiêu', build: goalsPage },
  { id: 'career', label: 'Lộ trình', build: careerPage },
  { id: 'survey', label: 'Khảo sát', build: surveyPage },
  { id: 'budget', label: 'Thu chi', build: budgetPage },
  { id: 'settings', label: 'Cài đặt', build: settingsPage },
];
const STATUS_TEXT = {
  idle: '', dirty: 'Có thay đổi chưa lưu…', saving: 'Đang lưu…', saved: 'Đã lưu lên máy chủ',
  error: 'Chưa đồng bộ được — dữ liệu chưa lưu. Kiểm tra mạng rồi thử lại.',
  conflict: 'Dữ liệu đã thay đổi ở nơi khác. Hãy tải lại trang để tránh ghi đè.',
};

let session = null;
let currentUid = null;
const pageFromHash = () => (PAGES.some((p) => `#${p.id}` === location.hash) ? location.hash.slice(1) : 'overview');
let pageId = pageFromHash();
let page = null;
let syncState = 'idle';
let showPage = null;

function teardown() {
  session?.dispose();
  session = null; page = null; showPage = null; syncState = 'idle';
  root.replaceChildren(); // không để dữ liệu người dùng cũ còn trên màn hình
}

function showAuth() {
  teardown();
  root.append(authScreen({ onSignIn: signIn, onSignUp: signUp }));
}

function startSession(user) {
  teardown();
  const status = h('span', { class: 'status', role: 'status', 'aria-live': 'polite', 'data-state': 'idle' });
  const main = h('main', { id: 'main' }, h('p', { class: 'empty' }, 'Đang tải dữ liệu…'));
  const nav = h('nav', { 'aria-label': 'Chức năng' });
  const header = h('header', { class: 'top' }, h('h1', {}, 'Kế hoạch tài chính'), nav, status,
    h('span', { class: 'status' }, user.email),
    h('button', { class: 'btn', type: 'button', onClick: async () => { try { await session?.flush(); } finally { await logOut(); } } }, 'Đăng xuất'));
  root.append(header, main);

  const repo = createPlanRepository(db, user.uid);
  const mine = createSession({
    repo,
    onChange: () => { if (session === mine) page?.update?.(); },
    onStatus: (s) => {
      if (session !== mine) return;
      syncState = s.state;
      status.dataset.state = s.state;
      status.textContent = STATUS_TEXT[s.state] ?? '';
    },
  });
  session = mine;
  const ctx = {
    get state() { return mine.state; },
    updatePlan: (f) => mine.updatePlan(f),
    updateMonth: (i, f) => mine.updateMonth(i, f),
    setYear: async (y) => { await mine.setYear(y); show(pageId); },
  };

  function show(id) {
    pageId = id;
    if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`); // tab phản ánh lên URL
    nav.replaceChildren(...PAGES.map((p) => h('button', { type: 'button', 'aria-current': p.id === id ? 'page' : null, onClick: () => show(p.id) }, p.label)));
    if (mine.state.loading) return;
    if (mine.state.loadError) {
      main.replaceChildren(h('p', { class: 'error', role: 'alert' }, mine.state.loadError.message ?? 'Không tải được dữ liệu.'),
        h('button', { class: 'btn', type: 'button', onClick: init }, 'Thử lại'));
      return;
    }
    page = PAGES.find((p) => p.id === id).build(ctx);
    main.replaceChildren(page.el);
  }

  showPage = show;
  async function init() {
    main.replaceChildren(h('p', { class: 'empty' }, 'Đang tải dữ liệu…'));
    await mine.init();
    if (session === mine) show(pageId);
  }
  init();
}

watchAuth((user) => {
  if (!user) { currentUid = null; showAuth(); return; }
  if (user.uid === currentUid) return;
  currentUid = user.uid;
  startSession(user);
});

window.addEventListener('hashchange', () => { if (session && showPage) showPage(pageFromHash()); });

// Cảnh báo khi rời trang mà dữ liệu chưa được server xác nhận.
window.addEventListener('beforeunload', (e) => {
  if (session && ['dirty', 'saving', 'error'].includes(syncState)) {
    session.flush();
    e.preventDefault();
  }
});
