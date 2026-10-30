// Trạng thái phiên của một người dùng: plan + 12 tháng của năm đang xem, kèm tự động đồng bộ.
import { createAutosaver } from './autosave.js';

export function createSession({ repo, onChange, onStatus }) {
  const state = { plan: null, year: null, months: [], loading: true, loadError: null };
  const statuses = new Map(); // khóa saver -> trạng thái
  const savers = new Map();
  let disposed = false;

  const emit = () => { if (!disposed) onChange(state); };

  function overall() {
    const vals = [...statuses.values()];
    const pick = (s) => vals.find((v) => v.state === s);
    const hit = pick('conflict') ?? pick('error') ?? pick('saving') ?? pick('dirty');
    return hit ?? { state: vals.length ? 'saved' : 'idle' };
  }

  function saver(key, save) {
    if (!savers.has(key)) {
      savers.set(key, createAutosaver({
        save,
        onStatus: (s) => { statuses.set(key, s); if (!disposed) onStatus(overall()); },
      }));
    }
    return savers.get(key);
  }

  const planSaver = () => saver('plan', async () => {
    const snap = structuredClone(state.plan);
    state.plan.rev = await repo.savePlan(snap);
  });
  const monthSaver = (i) => saver(`month-${state.year}-${i}`, async () => {
    const m = state.months[i];
    const snap = structuredClone(m);
    m.rev = await repo.saveMonth(snap);
  });

  return {
    state,

    async init() {
      state.loading = true; state.loadError = null; emit();
      try {
        const { plan } = await repo.bootstrapPlan();
        state.plan = plan;
        state.year = plan.startYear;
        state.months = await repo.loadYear(state.year);
      } catch (e) {
        state.loadError = e;
      }
      state.loading = false;
      emit();
    },

    async setYear(year) {
      await this.flush();
      state.loading = true; emit();
      try {
        state.months = await repo.loadYear(year);
        state.year = year;
        state.loadError = null;
      } catch (e) {
        state.loadError = e;
      }
      state.loading = false;
      emit();
    },

    updatePlan(mutator) {
      mutator(state.plan);
      emit();
      planSaver().markDirty();
    },

    updateMonth(i, mutator) {
      mutator(state.months[i]);
      emit();
      monthSaver(i).markDirty();
    },

    async flush() {
      await Promise.all([...savers.values()].map((s) => s.flush()));
    },

    dispose() {
      disposed = true;
      savers.forEach((s) => s.dispose());
      savers.clear();
    },
  };
}
