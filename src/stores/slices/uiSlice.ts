// src/stores/slices/uiSlice.ts — interacción (drag/cadena/imán), escena IA, menús, toasts
// FIX TS2459: Vec2 viene de coordinateTransform (types no lo re-exporta)
import { clamp, niceGridStep, WORLD_LIMIT, type Vec2 } from '../../utils/coordinateTransform';
import { deg, hasTri, measure, rad, SPECIAL_ANGLES, SNAP_TOL_DEG } from '../../utils/geometry';
import { emit, type CanvasState, type GridStyle, type PointNode, type StoreGet, type StoreSet } from './types';

export const uiSlice = (set: StoreSet, get: StoreGet) => {
  let badgeTimer: ReturnType<typeof setTimeout> | undefined;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const flashBadge = (label: string) => {
    set({ snapBadge: { label } });
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => set({ snapBadge: null }), 900);
  };

  return {
    chain: false,
    dragId: null, hoverId: null, selectedId: null, pulseId: null,
    snapBadge: null, lockedAngle: null,
    aiCursor: { pos: { x: 0, y: 0 }, visible: false },
    subtitle: null, transcript: [] as string[], playing: false, voiceOn: false,
    celebration: null, gridMagnet: false, gridStyle: 'fine' as GridStyle,
    menu: null, viewMenu: null, toast: null,

    toastMsg: (t: string) => {
      set({ toast: t });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => set({ toast: null }), 2200);
    },

    setHover: (id) => set({ hoverId: id }),
    setSelected: (id) => set({ selectedId: id }),

    pulse: (id: string, ms = 1500) => {
      set({ pulseId: id });
      setTimeout(() => set((s) => (s.pulseId === id ? { pulseId: null } : {})), ms);
    },

    celebrate: (text: string) => {
      set({ celebration: text });
      setTimeout(() => set({ celebration: null }), 2800);
    },

    setGridMagnet: (b) => set({ gridMagnet: b }),
    setGridStyle: (s) => set({ gridStyle: s }),

    setChain: (b: boolean) => {
      const s = get();
      s.snapshot();
      if (b && s.hasTriangle) {
        const pts = {
          ...s.points,
          B: { ...s.points.B, pos: { x: s.points.B.pos.x, y: s.points.O.pos.y } },
          A: { ...s.points.A, pos: { x: s.points.B.pos.x, y: s.points.A.pos.y } },
        };
        s.applyPoints(pts);
      }
      set({ chain: b });
      get().toastMsg(b ? '⛓️ Cadena rectangular ON' : '🕊️ Modo libre');
    },

    beginDrag: (id: string) => {
      get().snapshot();
      set({ dragId: id, selectedId: id });
      emit({ type: 'drag-start', id });
    },

    /* Reglas Fase G: libre = libre; cadena solo O/B/A; el candado MANDA. */
    dragTo: (id: string, world: Vec2) => {
      const s = get();
      const p = s.points[id];
      if (!p || p.locked) return;
      const step = niceGridStep(s.camera.zoom, 56);
      const g = (v: number) => (s.gridMagnet ? Math.round(v / step) * step : v);
      const w: Vec2 = { x: clamp(world.x, -WORLD_LIMIT, WORLD_LIMIT), y: clamp(world.y, -WORLD_LIMIT, WORLD_LIMIT) };
      const isBaseTri = id === 'O' || id === 'B' || id === 'A';

      if (s.chain && hasTri(s.points) && isBaseTri) {
        const O = s.points.O.pos, B = s.points.B.pos;
        if (id === 'A') {
          let h = g(w.y) - B.y;
          const b = B.x - O.x;
          const theta = deg(Math.atan2(h, b));
          const locked = SPECIAL_ANGLES.find((a) => Math.abs(theta - a) <= SNAP_TOL_DEG) ?? null;
          if (locked !== null) h = b * Math.tan(rad(locked));
          const pts = { ...s.points, A: { ...s.points.A, pos: { x: B.x, y: B.y + h } } };
          const wasLocked = s.lockedAngle;
          set({ points: pts, measures: measure(pts), lockedAngle: locked });
          if (locked !== null && locked !== wasLocked) {
            emit({ type: 'snap-angle', deg: locked });
            flashBadge(`⚡ ${locked}°`);
          }
          return;
        }
        if (id === 'B') {
          const nb = { x: g(w.x), y: O.y };
          const pts: Record<string, PointNode> = { ...s.points, B: { ...s.points.B, pos: nb } };
          if (!s.points.A.locked) pts.A = { ...s.points.A, pos: { x: nb.x, y: s.points.A.pos.y } };
          s.applyPoints(pts);
          return;
        }
        if (id === 'O') {
          const d = { x: w.x - O.x, y: w.y - O.y };
          const pts = { ...s.points };
          (['O', 'B', 'A'] as const).forEach((k) => {
            if (!pts[k].locked) pts[k] = { ...pts[k], pos: { x: pts[k].pos.x + d.x, y: pts[k].pos.y + d.y } };
          });
          s.applyPoints(pts);
          return;
        }
      }
      s.applyPoints({ ...s.points, [id]: { ...p, pos: { x: g(w.x), y: g(w.y) } } });
    },

    endDrag: () => {
      const { dragId, measures } = get();
      if (dragId) emit({ type: 'drag-end', id: dragId, measures });
      set({ dragId: null });
    },

    setAiCursor: (pos) => set((s) => ({ aiCursor: pos ? { pos, visible: true } : { ...s.aiCursor, visible: false } })),
    setSubtitle: (text) => set((s) => ({ subtitle: text, transcript: text ? [...s.transcript, text] : s.transcript })),
    setPlaying: (b) => set({ playing: b }),
    setVoiceOn: (b) => set({ voiceOn: b }),

    openMenu: (id, x, y) => set({ menu: { id, x, y }, viewMenu: null, selectedId: id }),
    closeMenu: () => set({ menu: null }),
    openViewMenu: (x, y) => set({ viewMenu: { x, y }, menu: null }),
    closeViewMenu: () => set({ viewMenu: null }),
  } satisfies Partial<CanvasState>;
};