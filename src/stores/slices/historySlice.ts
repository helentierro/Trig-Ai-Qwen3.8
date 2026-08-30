// src/stores/slices/historySlice.ts — undo/redo (50 snapshots) + guardar/cargar (5 slots)
import { clone, normPts, allDrawn, type CanvasState, type SaveSlot, type StoreGet, type StoreSet } from './types';
import { hasTri, measure } from '../../utils/geometry';

const SAVES_KEY = 'trig-ai-saves';

const readSaves = (): SaveSlot[] => {
  try { return JSON.parse(localStorage.getItem(SAVES_KEY) || '[]'); } catch { return []; }
};

export const historySlice = (set: StoreSet, get: StoreGet) => ({
  history: [] as CanvasState['history'],
  future: [] as CanvasState['future'],
  saves: readSaves(),

  snapshot: () => set((s) => ({
    history: [...s.history.slice(-49), clone({ points: s.points, segments: s.segments, circles: s.circles })],
    future: [],
  })),

  undo: () => {
    const s = get();
    if (!s.history.length) return;
    const prev = s.history[s.history.length - 1];
    const cur = clone({ points: s.points, segments: s.segments, circles: s.circles });
    set({
      history: s.history.slice(0, -1), future: [...s.future, cur],
      points: prev.points, segments: prev.segments, circles: prev.circles,
      drawn: allDrawn(prev), measures: measure(prev.points), hasTriangle: hasTri(prev.points),
      pending: [], selectedId: null, menu: null, viewMenu: null,
    });
  },

  redo: () => {
    const s = get();
    if (!s.future.length) return;
    const next = s.future[s.future.length - 1];
    const cur = clone({ points: s.points, segments: s.segments, circles: s.circles });
    set({
      future: s.future.slice(0, -1), history: [...s.history, cur],
      points: next.points, segments: next.segments, circles: next.circles,
      drawn: allDrawn(next), measures: measure(next.points), hasTriangle: hasTri(next.points),
      pending: [], selectedId: null, menu: null, viewMenu: null,
    });
  },

  saveWorld: () => {
    const s = get();
    const slot: SaveSlot = { at: Date.now(), world: clone({ points: s.points, segments: s.segments, circles: s.circles }) };
    const saves = [slot, ...s.saves].slice(0, 5);
    try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves)); } catch { /* privado */ }
    set({ saves });
    s.toastMsg('💾 Mundo guardado');
  },

  loadSlot: (i: number) => {
    const s = get();
    const slot = s.saves[i];
    if (!slot) return;
    const w = { ...slot.world, points: normPts(slot.world.points) };
    s.snapshot();
    set({
      ...w, drawn: allDrawn(w), pending: [], selectedId: null,
      measures: measure(w.points), hasTriangle: hasTri(w.points),
    });
    get().fitView();
    s.toastMsg('📂 Mundo cargado');
  },
}) satisfies Partial<CanvasState>;