// src/stores/canvasStore.ts
import { create } from 'zustand';
import {
  type Camera, type Vec2, clamp, niceGridStep, screenToWorld,
  ZOOM_MIN, ZOOM_MAX, WORLD_LIMIT,
} from '../utils/coordinateTransform';
import { KNOWLEDGE, type WorldDef } from '../data/knowledge';

/* ─── Tipos ─────────────────────────────────────────────────── */
export interface PointNode {
  id: string; pos: Vec2;
  constraint: 'fixed' | 'horizontal' | 'free';
  role: string; visible: boolean; locked: boolean; showLabel: boolean;
}
export interface SegmentNode { id: string; a: string; b: string; color: string; visible: boolean; }
export interface CircleNode { id: string; c: string; r: number; visible: boolean; }
export interface Measures {
  base: number; height: number; hyp: number;
  angleDeg: number; angleB: number; angleA: number;
  area: number; rightAngle: boolean;
}
export type Tool = 'move' | 'point' | 'segment' | 'circle';
export type GridStyle = 'fine' | 'large' | 'circular' | 'diamond' | 'blank';

interface Snapshot { points: Record<string, PointNode>; segments: SegmentNode[]; circles: CircleNode[]; }
export interface SaveSlot { at: number; world: Snapshot; }

export type CanvasEvent =
  | { type: 'drag-start'; id: string }
  | { type: 'drag-end'; id: string; measures: Measures }
  | { type: 'snap-angle'; deg: number }
  | { type: 'view-fit' };

const listeners = new Set<(e: CanvasEvent) => void>();
export const onCanvasEvent = (fn: (e: CanvasEvent) => void) => {
  listeners.add(fn); return () => { listeners.delete(fn); };
};
const emit = (e: CanvasEvent) => listeners.forEach((fn) => fn(e));

/* ─── Constantes y geometría ────────────────────────────────── */
const SPECIAL_ANGLES = [15, 30, 45, 60, 75];
const SNAP_TOL_DEG = 2;
const SAVES_KEY = 'trig-ai-saves';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dist = (p: Vec2, q: Vec2) => Math.hypot(q.x - p.x, q.y - p.y);
const ZERO: Measures = { base: 0, height: 0, hyp: 0, angleDeg: 0, angleB: 0, angleA: 0, area: 0, rightAngle: false };

const angleAt = (P: Vec2, Q: Vec2, R: Vec2): number => {
  const v1 = { x: Q.x - P.x, y: Q.y - P.y };
  const v2 = { x: R.x - P.x, y: R.y - P.y };
  const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
  if (!l1 || !l2) return 0;
  return deg(Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / (l1 * l2), -1, 1)));
};

const measure = (pts: Record<string, PointNode>): Measures => {
  if (!pts.O || !pts.B || !pts.A) return ZERO;
  const O = pts.O.pos, B = pts.B.pos, A = pts.A.pos;
  const base = dist(O, B), height = dist(B, A), hyp = dist(O, A);
  const angleDeg = angleAt(O, B, A);
  const angleB = angleAt(B, O, A);
  const angleA = angleAt(A, O, B);
  const area = Math.abs((B.x - O.x) * (A.y - O.y) - (A.x - O.x) * (B.y - O.y)) / 2;
  return { base, height, hyp, angleDeg, angleB, angleA, area, rightAngle: Math.abs(angleB - 90) < 0.5 };
};

const hasTri = (pts: Record<string, PointNode>) => !!(pts.O && pts.B && pts.A);

const allDrawn = (w: Snapshot): Record<string, number> => {
  const d: Record<string, number> = {};
  Object.keys(w.points).forEach((k) => (d[k] = 1));
  w.segments.forEach((g) => (d[g.id] = 1));
  w.circles.forEach((c) => (d[c.id] = 1));
  return d;
};

const clone = (w: Snapshot): Snapshot => JSON.parse(JSON.stringify(w));
const normPts = (pts: Record<string, PointNode>) =>
  Object.fromEntries(Object.entries(pts).map(([k, p]) => [k, { locked: false, showLabel: true, ...p }]));

export const DEFAULT_WORLD: WorldDef = {
  points: [
    { id: 'O', x: 0, y: 0 },
    { id: 'B', x: 50, y: 0 },
    { id: 'A', x: 50, y: 50 * Math.tan(rad(30)) },
  ],
  segments: [
    { id: 'base', a: 'O', b: 'B', color: '#38bdf8' },
    { id: 'height', a: 'B', b: 'A', color: '#fb923c' },
    { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0' },
  ],
};

/* ─── Estado ────────────────────────────────────────────────── */
export interface CanvasState {
  points: Record<string, PointNode>;
  segments: SegmentNode[];
  circles: CircleNode[];
  camera: Camera;
  viewport: { w: number; h: number };
  measures: Measures;
  hasTriangle: boolean;
  chain: boolean;
  dragId: string | null;
  hoverId: string | null;
  selectedId: string | null;
  pulseId: string | null;
  snapBadge: { label: string } | null;
  lockedAngle: number | null;
  drawn: Record<string, number>;
  aiCursor: { pos: Vec2; visible: boolean };
  subtitle: string | null;
  transcript: string[];
  playing: boolean;
  voiceOn: boolean;
  tool: Tool;
  pending: string[];
  cursorWorld: Vec2 | null;
  celebration: string | null;
  gridMagnet: boolean;
  gridStyle: GridStyle;
  history: Snapshot[];
  future: Snapshot[];
  menu: { id: string; x: number; y: number } | null;
  viewMenu: { x: number; y: number } | null;
  toast: string | null;
  saves: SaveSlot[];

  setViewport: (w: number, h: number) => void;
  fitView: () => void;
  panBy: (dx: number, dy: number) => void;
  zoomAtScreen: (pt: Vec2, zoom: number) => void;
  setHover: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  toggleVisible: (id: string) => void;
  pulse: (id: string, ms?: number) => void;
  beginDrag: (id: string) => void;
  dragTo: (id: string, world: Vec2) => void;
  endDrag: () => void;
  setAngleDeg: (d: number) => void;
  setBase: (b: number) => void;
  setDrawn: (id: string, t: number) => void;
  setAiCursor: (pos: Vec2 | null) => void;
  setSubtitle: (text: string | null) => void;
  setPlaying: (b: boolean) => void;
  setVoiceOn: (b: boolean) => void;
  resetConstruction: () => void;
  setTool: (t: Tool) => void;
  setCursorWorld: (p: Vec2 | null) => void;
  cancelPending: () => void;
  addPointAt: (world: Vec2) => void;
  clickPoint: (id: string) => void;
  loadWorld: (id: string | null) => void;
  celebrate: (text: string) => void;
  setGridMagnet: (b: boolean) => void;
  setGridStyle: (s: GridStyle) => void;
  setChain: (b: boolean) => void;
  undo: () => void;
  redo: () => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleLabel: (id: string) => void;
  setPointPos: (id: string, x: number, y: number) => void;
  setSegmentLen: (id: string, len: number) => void;
  saveWorld: () => void;
  loadSlot: (i: number) => void;
  toastMsg: (t: string) => void;
  openMenu: (id: string, x: number, y: number) => void;
  closeMenu: () => void;
  openViewMenu: (x: number, y: number) => void;
  closeViewMenu: () => void;
}

/* ─── Store ─────────────────────────────────────────────────── */
export const useCanvasStore = create<CanvasState>()((set, get) => {
  let badgeTimer: ReturnType<typeof setTimeout> | undefined;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let pointN = 1, objN = 1;

  const flashBadge = (label: string) => {
    set({ snapBadge: { label } });
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => set({ snapBadge: null }), 900);
  };

  const snapshot = () => set((s) => ({
    history: [...s.history.slice(-49), clone({ points: s.points, segments: s.segments, circles: s.circles })],
    future: [],
  }));

  const applyPoints = (pts: Record<string, PointNode>) =>
    set({ points: pts, measures: measure(pts), hasTriangle: hasTri(pts) });

  const readSaves = (): SaveSlot[] => {
    try { return JSON.parse(localStorage.getItem(SAVES_KEY) || '[]'); } catch { return []; }
  };

  return {
    points: {}, segments: [], circles: [],
    camera: { zoom: 8, panX: 120, panY: 400 },
    viewport: { w: 0, h: 0 },
    measures: { ...ZERO }, hasTriangle: false, chain: false,
    dragId: null, hoverId: null, selectedId: null, pulseId: null,
    snapBadge: null, lockedAngle: null,
    drawn: {}, aiCursor: { pos: { x: 0, y: 0 }, visible: false },
    subtitle: null, transcript: [], playing: false, voiceOn: false,
    tool: 'move', pending: [], cursorWorld: null, celebration: null,
    gridMagnet: false, gridStyle: 'fine',
    history: [], future: [], menu: null, viewMenu: null,
    toast: null, saves: readSaves(),

    setViewport: (w, h) => set({ viewport: { w, h } }),

    toastMsg: (t) => {
      set({ toast: t });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => set({ toast: null }), 2200);
    },

    fitView: () => {
      const { points, viewport } = get();
      const ps = Object.values(points).map((p) => p.pos);
      if (!ps.length) return;
      const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
      const minY = Math.min(...ps.map((p) => p.y)), maxY = Math.max(...ps.map((p) => p.y));
      const pad = 90;
      const zoom = clamp(
        Math.min(
          (viewport.w - pad) / Math.max(maxX - minX, 1),
          (viewport.h - pad) / Math.max(maxY - minY, 1),
        ),
        ZOOM_MIN, ZOOM_MAX,
      );
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      set({ camera: { zoom, panX: viewport.w / 2 - cx * zoom, panY: viewport.h / 2 + cy * zoom } });
      emit({ type: 'view-fit' });
    },

    panBy: (dx, dy) =>
      set((s) => ({ camera: { ...s.camera, panX: s.camera.panX + dx, panY: s.camera.panY + dy } })),

    zoomAtScreen: (pt, zoom) => {
      const z = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
      const w = screenToWorld(pt, get().camera);
      set({ camera: { zoom: z, panX: pt.x - w.x * z, panY: pt.y + w.y * z } });
    },

    setHover: (id) => set({ hoverId: id }),
    setSelected: (id) => set({ selectedId: id }),

    toggleVisible: (id) => set((s) => {
      const points = { ...s.points };
      if (points[id]) points[id] = { ...points[id], visible: !points[id].visible };
      return {
        points,
        segments: s.segments.map((g) => (g.id === id ? { ...g, visible: !g.visible } : g)),
        circles: s.circles.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
      };
    }),

    pulse: (id, ms = 1500) => {
      set({ pulseId: id });
      setTimeout(() => set((s) => (s.pulseId === id ? { pulseId: null } : {})), ms);
    },

    beginDrag: (id) => {
      snapshot();
      set({ dragId: id, selectedId: id });
      emit({ type: 'drag-start', id });
    },

    /* ═══════════════════════════════════════════════════════════
       FIX FASE G (G1–G5):
       • Sin cadena → CUALQUIER punto (O, B, A, P1…) es 100% libre.
       • Con cadena → SOLO O/B/A tienen reglas; el resto sigue libre.
       • El CANDADO gana sobre la cadena en todas las ramas.
       • Mundo ±5,000,000: los 4 cuadrantes sin paredes.
    ═══════════════════════════════════════════════════════════ */
    dragTo: (id, world) => {
      const { points, chain, gridMagnet } = get();
      const p = points[id];
      if (!p || p.locked) return; // 🔒 candado sagrado (G3)

      const step = niceGridStep(get().camera.zoom, 56);
      const g = (v: number) => (gridMagnet ? Math.round(v / step) * step : v);
      const w: Vec2 = {
        x: clamp(world.x, -WORLD_LIMIT, WORLD_LIMIT),
        y: clamp(world.y, -WORLD_LIMIT, WORLD_LIMIT),
      };

      const isBaseTri = id === 'O' || id === 'B' || id === 'A';

      if (chain && hasTri(points) && isBaseTri) {
        const O = points.O.pos, B = points.B.pos;

        if (id === 'A') {
          // A desliza vertical sobre B. B NUNCA se mueve. (G1)
          let h = g(w.y) - B.y;
          const b = B.x - O.x;
          const theta = deg(Math.atan2(h, b));
          const locked = SPECIAL_ANGLES.find((s) => Math.abs(theta - s) <= SNAP_TOL_DEG) ?? null;
          if (locked !== null) h = b * Math.tan(rad(locked));
          const pts = { ...points, A: { ...points.A, pos: { x: B.x, y: B.y + h } } };
          const wasLocked = get().lockedAngle;
          set({ points: pts, measures: measure(pts), lockedAngle: locked });
          if (locked !== null && locked !== wasLocked) {
            emit({ type: 'snap-angle', deg: locked });
            flashBadge(`⚡ ${locked}°`);
          }
          return;
        }

        if (id === 'B') {
          // B horizontal; A sigue en x SOLO si no está candado. (G3)
          const nb = { x: g(w.x), y: O.y };
          const pts: Record<string, PointNode> = { ...points, B: { ...points.B, pos: nb } };
          if (!points.A.locked) pts.A = { ...points.A, pos: { x: nb.x, y: points.A.pos.y } };
          applyPoints(pts);
          return;
        }

        if (id === 'O') {
          // O traslada el triángulo completo (respetando candados). (G2)
          const d = { x: w.x - O.x, y: w.y - O.y };
          const pts = { ...points };
          (['O', 'B', 'A'] as const).forEach((k) => {
            if (!pts[k].locked) {
              pts[k] = { ...pts[k], pos: { x: pts[k].pos.x + d.x, y: pts[k].pos.y + d.y } };
            }
          });
          applyPoints(pts);
          return;
        }
      }

      // LIBRE: cualquier punto, cualquier cuadrante, fluido. (G2, G4, G5)
      applyPoints({ ...points, [id]: { ...p, pos: { x: g(w.x), y: g(w.y) } } });
    },

    endDrag: () => {
      const { dragId, measures } = get();
      if (dragId) emit({ type: 'drag-end', id: dragId, measures });
      set({ dragId: null });
    },

    setAngleDeg: (d) => {
      const s = get();
      if (!s.hasTriangle) return;
      snapshot();
      const O = s.points.O.pos;
      const b = (s.points.B.pos.x - O.x) || 50;
      const h = clamp(b * Math.tan(rad(clamp(d, 1, 89))), 0.5, 2000);
      applyPoints({
        ...s.points,
        B: { ...s.points.B, pos: { x: O.x + b, y: O.y } },
        A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } },
      });
      set({ lockedAngle: null });
    },

    setBase: (b) => {
      const s = get();
      if (!s.hasTriangle) return;
      snapshot();
      const O = s.points.O.pos;
      const h = s.points.A.pos.y - s.points.B.pos.y;
      applyPoints({
        ...s.points,
        B: { ...s.points.B, pos: { x: O.x + b, y: O.y } },
        A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } },
      });
    },

    setPointPos: (id, x, y) => {
      const s = get();
      if (!s.points[id]) return;
      snapshot();
      applyPoints({ ...s.points, [id]: { ...s.points[id], pos: { x, y } } });
    },

    setSegmentLen: (id, len) => {
      const s = get();
      const seg = s.segments.find((x) => x.id === id);
      if (!seg || !s.points[seg.a] || !s.points[seg.b]) return;
      snapshot();

      if (s.chain && s.hasTriangle) {
        const O = s.points.O.pos;
        if (id === 'base') { get().setBase(len); return; }
        if (id === 'height') {
          applyPoints({ ...s.points, A: { ...s.points.A, pos: { x: s.points.B.pos.x, y: s.points.B.pos.y + len } } });
          return;
        }
        if (id === 'hyp') {
          const b = s.measures.base;
          const h = Math.sqrt(Math.max(len * len - b * b, 1));
          applyPoints({ ...s.points, A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } } });
          return;
        }
      }

      const pa = s.points[seg.a].pos, pb = s.points[seg.b].pos;
      const d = dist(pa, pb);
      if (!d) return;
      const np = { x: pa.x + ((pb.x - pa.x) / d) * len, y: pa.y + ((pb.y - pa.y) / d) * len };
      applyPoints({ ...s.points, [seg.b]: { ...s.points[seg.b], pos: np } });
    },

    setDrawn: (id, t) => set((s) => ({ drawn: { ...s.drawn, [id]: clamp(t, 0, 1) } })),
    setAiCursor: (pos) => set((s) => ({ aiCursor: pos ? { pos, visible: true } : { ...s.aiCursor, visible: false } })),
    setSubtitle: (text) => set((s) => ({ subtitle: text, transcript: text ? [...s.transcript, text] : s.transcript })),
    setPlaying: (b) => set({ playing: b }),
    setVoiceOn: (b) => set({ voiceOn: b }),

    resetConstruction: () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const s = get();
      const zero: Record<string, number> = {};
      Object.values(s.points).forEach((p) => (zero[p.id] = 0));
      s.segments.forEach((g) => (zero[g.id] = 0));
      set({ drawn: zero, subtitle: null, selectedId: null, pulseId: null, pending: [], aiCursor: { pos: { x: 0, y: 0 }, visible: false } });
    },

    setTool: (t) => set({ tool: t, pending: [] }),
    setCursorWorld: (p) => set({ cursorWorld: p }),
    cancelPending: () => set({ pending: [] }),

    setChain: (b) => {
      const s = get();
      snapshot();
      if (b && s.hasTriangle) {
        const pts = {
          ...s.points,
          B: { ...s.points.B, pos: { x: s.points.B.pos.x, y: s.points.O.pos.y } },
          A: { ...s.points.A, pos: { x: s.points.B.pos.x, y: s.points.A.pos.y } },
        };
        applyPoints(pts);
      }
      set({ chain: b });
      get().toastMsg(b ? '⛓️ Cadena rectangular ON' : '🕊️ Modo libre');
    },

    addPointAt: (world) => {
      const s = get();
      const step = niceGridStep(s.camera.zoom, 56);
      const id = `P${pointN++}`;
      const pos = s.gridMagnet
        ? { x: Math.round(world.x / step) * step, y: Math.round(world.y / step) * step }
        : { x: world.x, y: world.y };
      snapshot();
      set({
        points: { ...s.points, [id]: { id, pos, constraint: 'free', role: 'libre', visible: true, locked: false, showLabel: true } },
      });
    },

    clickPoint: (id) => {
      const s = get();
      if (s.tool === 'segment') {
        if (s.pending.length === 0) return set({ pending: [id] });
        if (s.pending[0] === id) return set({ pending: [] });
        const sid = `s${objN++}`;
        snapshot();
        set({
          segments: [...s.segments, { id: sid, a: s.pending[0], b: id, color: '#94a3b8', visible: true }],
          drawn: { ...s.drawn, [sid]: 1 },
          pending: [],
        });
      } else if (s.tool === 'circle') {
        if (s.pending.length === 0) return set({ pending: [id] });
        const c = s.points[s.pending[0]];
        if (!c) return set({ pending: [] });
        const r = Math.hypot(s.points[id].pos.x - c.pos.x, s.points[id].pos.y - c.pos.y);
        const cid = `c${objN++}`;
        snapshot();
        set({
          circles: [...s.circles, { id: cid, c: s.pending[0], r, visible: true }],
          drawn: { ...s.drawn, [cid]: 1 },
          pending: [],
        });
      }
    },

    loadWorld: (id) => {
      const src: WorldDef = (id && KNOWLEDGE[id]?.world) || DEFAULT_WORLD;
      const points: Record<string, PointNode> = {};
      for (const p of src.points) {
        const role = p.id === 'O' ? 'origen' : p.id === 'B' ? 'base' : p.id === 'A' ? 'ápice' : 'libre';
        points[p.id] = {
          id: p.id, pos: { x: p.x, y: p.y },
          constraint: 'free', role, visible: true, locked: false, showLabel: true,
        };
      }
      const segments: SegmentNode[] = src.segments.map((g) => ({
        id: g.id ?? `${g.a}-${g.b}`, a: g.a, b: g.b, color: g.color ?? '#94a3b8', visible: true,
      }));
      const circles: CircleNode[] = (src.circles ?? []).map((c) => ({ ...c, visible: true }));
      const w: Snapshot = { points, segments, circles };
      snapshot();
      set({
        ...w, drawn: allDrawn(w), pending: [], selectedId: null, pulseId: null, lockedAngle: null,
        measures: measure(points), hasTriangle: hasTri(points),
      });
      get().fitView();
    },

    celebrate: (text) => {
      set({ celebration: text });
      setTimeout(() => set({ celebration: null }), 2800);
    },

    setGridMagnet: (b) => set({ gridMagnet: b }),
    setGridStyle: (s) => set({ gridStyle: s }),

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

    deleteObject: (id) => {
      const s = get();
      snapshot();
      if (s.points[id]) {
        const points = { ...s.points };
        delete points[id];
        set({
          points,
          segments: s.segments.filter((g) => g.a !== id && g.b !== id),
          circles: s.circles.filter((c) => c.c !== id),
          measures: measure(points), hasTriangle: hasTri(points),
          selectedId: null, menu: null,
        });
      } else if (s.segments.some((g) => g.id === id)) {
        set({ segments: s.segments.filter((g) => g.id !== id), selectedId: null, menu: null });
      } else if (s.circles.some((c) => c.id === id)) {
        set({ circles: s.circles.filter((c) => c.id !== id), selectedId: null, menu: null });
      }
    },

    duplicateObject: (id) => {
      const s = get();
      snapshot();
      if (s.points[id]) {
        const p = s.points[id];
        const nid = `P${pointN++}`;
        set({
          points: { ...s.points, [nid]: { ...p, id: nid, pos: { x: p.pos.x + 5, y: p.pos.y + 5 }, locked: false, role: 'libre' } },
          menu: null,
        });
      } else if (s.segments.some((g) => g.id === id)) {
        const g = s.segments.find((x) => x.id === id)!;
        const pa = s.points[g.a], pb = s.points[g.b];
        if (!pa || !pb) return;
        const a2 = `P${pointN++}`, b2 = `P${pointN++}`, sid = `s${objN++}`;
        set({
          points: {
            ...s.points,
            [a2]: { ...pa, id: a2, pos: { x: pa.pos.x + 5, y: pa.pos.y + 5 }, locked: false, role: 'libre' },
            [b2]: { ...pb, id: b2, pos: { x: pb.pos.x + 5, y: pb.pos.y + 5 }, locked: false, role: 'libre' },
          },
          segments: [...s.segments, { id: sid, a: a2, b: b2, color: g.color, visible: true }],
          menu: null,
        });
      } else if (s.circles.some((c) => c.id === id)) {
        const c = s.circles.find((x) => x.id === id)!;
        const cp = s.points[c.c];
        if (!cp) return;
        const nc = `P${pointN++}`, cid = `c${objN++}`;
        set({
          points: { ...s.points, [nc]: { ...cp, id: nc, pos: { x: cp.pos.x + 5, y: cp.pos.y + 5 }, locked: false, role: 'libre' } },
          circles: [...s.circles, { id: cid, c: nc, r: c.r, visible: true }],
          menu: null,
        });
      }
    },

    toggleLock: (id) => {
      const s = get();
      if (!s.points[id]) return;
      snapshot();
      set({ points: { ...s.points, [id]: { ...s.points[id], locked: !s.points[id].locked } }, menu: null });
    },

    toggleLabel: (id) => {
      const s = get();
      if (!s.points[id]) return;
      snapshot();
      set({ points: { ...s.points, [id]: { ...s.points[id], showLabel: !s.points[id].showLabel } }, menu: null });
    },

    saveWorld: () => {
      const s = get();
      const slot: SaveSlot = { at: Date.now(), world: clone({ points: s.points, segments: s.segments, circles: s.circles }) };
      const saves = [slot, ...s.saves].slice(0, 5);
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
      set({ saves });
      s.toastMsg('💾 Mundo guardado');
    },

    loadSlot: (i) => {
      const s = get();
      const slot = s.saves[i];
      if (!slot) return;
      const w: Snapshot = { ...slot.world, points: normPts(slot.world.points) };
      snapshot();
      set({
        ...w, drawn: allDrawn(w), pending: [], selectedId: null,
        measures: measure(w.points), hasTriangle: hasTri(w.points),
      });
      get().fitView();
      s.toastMsg('📂 Mundo cargado');
    },

    openMenu: (id, x, y) => set({ menu: { id, x, y }, viewMenu: null, selectedId: id }),
    closeMenu: () => set({ menu: null }),
    openViewMenu: (x, y) => set({ viewMenu: { x, y }, menu: null }),
    closeViewMenu: () => set({ viewMenu: null }),
  };
});

export function initDefaultWorld() {
  const s = useCanvasStore.getState();
  if (!Object.keys(s.points).length) s.loadWorld(null);
}