import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutosaver } from '../../src/state/autosave.js';
import { AppError } from '../../src/services/errors.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('debounce: nhiều thay đổi liên tiếp chỉ ghi 1 lần', async () => {
  let saves = 0;
  const a = createAutosaver({ save: async () => { saves += 1; }, delay: 20 });
  a.markDirty(); a.markDirty(); a.markDirty();
  await wait(80);
  assert.equal(saves, 1);
});

test('thay đổi trong lúc đang ghi được ghi ở vòng sau, không ghi song song', async () => {
  let active = 0, maxActive = 0, saves = 0;
  const a = createAutosaver({
    delay: 5,
    save: async () => { active += 1; maxActive = Math.max(maxActive, active); saves += 1; await wait(30); active -= 1; },
  });
  a.markDirty();
  await wait(15);
  a.markDirty();
  await a.flush();
  await wait(40);
  assert.equal(maxActive, 1);
  assert.equal(saves, 2);
});

test('chỉ báo saved sau khi server xác nhận; lỗi quyền không retry', async () => {
  const states = [];
  let calls = 0;
  const a = createAutosaver({
    delay: 5,
    save: async () => { calls += 1; throw new AppError('permission', 'x'); },
    onStatus: (s) => states.push(s.state),
  });
  a.markDirty();
  await wait(50);
  assert.equal(calls, 1);
  assert.ok(!states.includes('saved'));
  assert.equal(states.at(-1), 'error');
  assert.equal(a.isDirty, true);
});

test('lỗi mạng retry có giới hạn rồi báo error', async () => {
  let calls = 0;
  const states = [];
  const a = createAutosaver({
    delay: 1, maxRetries: 2, retryDelay: 1,
    save: async () => { calls += 1; throw new AppError('network', 'x'); },
    onStatus: (s) => states.push(s.state),
  });
  a.markDirty();
  await wait(80);
  assert.equal(calls, 3);
  assert.equal(states.at(-1), 'error');
});

test('lỗi mạng rồi thành công: kết thúc saved', async () => {
  let calls = 0;
  const states = [];
  const a = createAutosaver({
    delay: 1, retryDelay: 1,
    save: async () => { calls += 1; if (calls === 1) throw new AppError('network', 'x'); },
    onStatus: (s) => states.push(s.state),
  });
  a.markDirty();
  await wait(60);
  assert.equal(states.at(-1), 'saved');
  assert.equal(a.isDirty, false);
});

test('xung đột: dừng, không ghi đè dữ liệu mới', async () => {
  let calls = 0;
  const states = [];
  const a = createAutosaver({
    delay: 1,
    save: async () => { calls += 1; throw new AppError('conflict', 'x'); },
    onStatus: (s) => states.push(s.state),
  });
  a.markDirty();
  await wait(30);
  a.markDirty();
  await wait(30);
  assert.equal(calls, 1);
  assert.equal(states.at(-1), 'conflict');
});
