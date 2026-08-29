import { create } from 'zustand';
import { type Camera, type Vec2, clamp, niceGridStep, screenToWorld } from '../utils/coordinateTransform';
import { KNOWLEDGE, type WorldDef } from '../data/knowledge';

export interface PointNode { id: string; pos: Vec2; constraint: 'fixed' | 'horizontal' | 'free'; role: string; visible: boolean; locked: boolean; showLabel: boolean }
export interface SegmentNode { id: string; a: string; b: string; color: string; visible: boolean }
export interface CircleNode { id: string; c: string; r: number; visible: boolean }
export interface Measures { base: number; height: number; hyp: number; angleDeg: number; angleB: number; angleA: number; area: number; rightAngle: boolean }
export type Tool = 'move' | 'point' | 'segment' | 'circle';
interface Snapshot { points: Record<string, PointNode>; segments: SegmentNode[]; circles: CircleNode[] }
export interface SaveSlot { at: number; world: Snapshot }

export type CanvasEvent =
  | { type: 'drag-start'; id: string }
  | { type: 'drag-end'; id: string; measures: Measures }
  | { type: 'snap-angle'; deg: number }
  | { type: 'view-fit' };

const listeners = new Set<(e: CanvasEvent) => void>();
export const onCanvasEvent = (fn: (e: CanvasEvent) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const emit = (e: CanvasEvent) => listeners.forEach((fn) => fn(e));

const SPECIAL_ANGLES = [15, 30, 45, 60, 75];
const SNAP_TOL_DEG = 2;
const SAVES_KEY = 'trig-ai-saves';
const ZOOM_MIN = 0.02, ZOOM_MAX = 50000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dist = (p: Vec2, q: Vec2) => Math.hypot(q.x - p.x, q.y - p.y);
const ZERO: Measures = { base: 0, height: 0, hyp: 0, angleDeg: 0, angleB: 0, angleA: 0, area: 0, rightAngle: false };

const angleAt = (P: Vec2, Q: Vec2, R: Vec2) => {
  const v1 = { x: Q.x - P.x, y: Q.y - P.y }, v2 = { x: R.x - P.x, y: R.y - P.y };
  const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
  if (!l1 || !l2) return 0;
  return deg(Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / (l1 * l2), -1, 1)));
};
const measure = (pts: Record<string, PointNode>): Measures => {
  if (!pts.O || !pts.B || !pts.A) return ZERO;
  const O = pts.O.pos, B = pts.B.pos, A = pts.A.pos;
  const base = dist(O, B), height = dist(B, A), hyp = dist(O, A);
  const angleDeg = angleAt(O, B, A), angleB = angleAt(B, O, A), angleA = angleAt(A, O, B);
  const area = Math.abs((B.x - O.x) * (A.y - O.y) - (A.x - O.x) * (B.y - O.y)) / 2;
  return { base, height, hyp, angleDeg, angleB, angleA, area, rightAngle: Math.abs(angleB - 90) < 0.5 };
};
const hasTri = (pts: Record<string, PointNode>) => !!(pts.O && pts.B && pts.A);
const allDrawn = (w: Snapshot) => {
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
  points: [{ id: 'O', x: 0, y: 0 }, { id: 'B', x: 50, y: 0 }, { id: 'A', x: 50, y: 50 * Math.tan(rad(30)) }],
  segments: [
    { id: 'base', a: 'O', b: 'B', color: '#38bdf8' },
    { id: 'height', a: 'B', b: 'A', color: '#fb923c' },
    { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0' },
  ],
};

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
  history: Snapshot[];
  future: Snapshot[];
  menu: { id: string; x: number; y: number } | null;
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
  setChain: (b: boolean) => void;
  undo: () => void;
  redo: () => void;
  deleteObject: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleLabel: (id: string) => void;
  setPointPos: (id: string, x: number, y: number) => void;
  setSegmentLen: (id: string, len: number) => void;
  saveWorld: () => void;
  loadSlot: (i: number) => void;
  toastMsg: (t: string) => void;
  openMenu: (id: string, x: number, y: number) => void;
  closeMenu: () => void;
}

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
    gridMagnet: false, history: [], future: [], menu: null,
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
      const zoom = clamp(Math.min((viewport.w - pad * 2) / Math.max(maxX - minX, 1),
                                  (viewport.h - pad * 2) / Math.max(maxY - minY, 1)), ZOOM_MIN, ZOOM_MAX);
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      set({ camera: { zoom, panX: viewport.w / 2 - cx * zoom, panY: viewport.h / 2 + cy * zoom } });
      emit({ type: 'view-fit' });
    },

    panBy: (dx, dy) => set((s) => ({ camera: { ...s.camera, panX: s.camera.panX + dx, panY: s.camera.panY + dy } })),

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

    beginDrag: (id) => { snapshot(); set({ dragId: id, selectedId: id }); emit({ type: 'drag-start', id }); },

    dragTo: (id, world) => {
      const { points, chain, gridMagnet } = get();
      const p = points[id];
      if (!p || p.locked) return;
      const step = niceGridStep(get().camera.zoom, 56);
      const g = (v: number) => (gridMagnet ? Math.round(v / step) * step : v);
      const W = { x: clamp(world.x, -100000, 100000), y: clamp(world.y, -100000, 100000) };

      if (chain && hasTri(points)) {
        const O = points.O.pos, B = points.B.pos, A = points.A.pos;
        if (id === 'A') {
          // A solo se desliza vertical: B NUNCA se mueve.
          // FIX: esparcir el NODO completo (points.A), no solo su posición.
          let h = g(W.y) - B.y;
          const b = B.x - O.x || 1;
          const theta = deg(Math.atan2(h, b));
          const locked = SPECIAL_ANGLES.find((s) => Math.abs(theta - s) <= SNAP_TOL_DEG) ?? null;
          if (locked !== null) h = b * Math.tan(rad(locked));
          const pts = { ...points, A: { ...points.A, pos: { x: B.x, y: B.y + h } } };
          const wasLocked = get().lockedAngle;
          set({ points: pts, measures: measure(pts), lockedAngle: locked });
          if (locked !== null && locked !== wasLocked) { emit({ type: 'snap-angle', deg: locked }); flashBadge(`${locked}°`); }
          return;
        }
        if (id === 'B') {
          // FIX: nodos completos → los ids sobreviven → sin crash de render.
          const nb = { x: g(W.x), y: O.y };
          const pts: Record<string, PointNode> = { ...points, B: { ...points.B, pos: nb } };
          if (!points.A.locked) pts.A = { ...points.A, pos: { x: nb.x, y: points.A.pos.y } };
          applyPoints(pts);
          return;
        }
        if (id === 'O') {
          const d = { x: W.x - O.x, y: W.y - O.y };
          const pts = { ...points };
          (['O', 'B', 'A'] as const).forEach((k) => {
            if (!pts[k].locked) pts[k] = { ...pts[k], pos: { x: pts[k].pos.x + d.x, y: pts[k].pos.y + d.y } };
          });
          applyPoints(pts);
          return;
        }
      }

      // LIBRE: cualquier punto, cualquier cuadrante, fluido
      applyPoints({ ...points, [id]: { ...p, pos: { x: g(W.x), y: g(W.y) } } });
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
      if (!seg || len <= 0) return;
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
      const d = dist(pa, pb) || 1;
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
        const O = s.points.O.pos;
        const pts = {
          ...s.points,
          B: { ...s.points.B, pos: { x: s.points.B.pos.x, y: O.y } },
          A: { ...s.points.A, pos: { x: s.points.B.pos.x, y: s.points.A.pos.y } },
        };
        applyPoints(pts);
      }
      set({ chain: b });
      get().toastMsg(b ? '⛓️ Cadena rectángula ON' : '🕊️ Modo libre');
    },

    addPointAt: (world) => {
      const s = get();
      const step = niceGridStep(s.camera.zoom, 56);
      const id = `P${pointN++}`;
      const pos = s.gridMagnet
        ? { x: Math.round(world.x / step) * step, y: Math.round(world.y / step) * step }
        : { x: world.x, y: world.y };
      snapshot();
      set({ points: { ...s.points, [id]: { id, pos, constraint: 'free', role: 'libre', visible: true, locked: false, showLabel: true } }, drawn: { ...s.drawn, [id]: 1 } });
    },

    clickPoint: (id) => {
      const s = get();
      if (s.tool === 'segment') {
        if (s.pending.length === 0) return set({ pending: [id] });
        if (s.pending[0] === id) return set({ pending: [] });
        const sid = `s${objN++}`;
        snapshot();
        set({ segments: [...s.segments, { id: sid, a: s.pending[0], b: id, color: '#94a3b8', visible: true }], drawn: { ...s.drawn, [sid]: 1 }, pending: [] });
      } else if (s.tool === 'circle') {
        if (s.pending.length === 0) return set({ pending: [id] });
        const c = s.points[s.pending[0]];
        const r = Math.hypot(s.points[id].pos.x - c.pos.x, s.points[id].pos.y - c.pos.y);
        const cid = `c${objN++}`;
        snapshot();
        set({ circles: [...s.circles, { id: cid, c: s.pending[0], r, visible: true }], drawn: { ...s.drawn, [cid]: 1 }, pending: [] });
      }
    },

    loadWorld: (id) => {
      const src = (id && KNOWLEDGE[id]?.world) || DEFAULT_WORLD;
      const points: Record<string, PointNode> = {};
      for (const p of src.points) {
        const role = p.id === 'O' ? 'origen' : p.id === 'B' ? 'base' : p.id === 'A' ? 'apice' : 'libre';
        points[p.id] = { id: p.id, pos: { x: p.x, y: p.y }, constraint: 'free', role, visible: true, locked: false, showLabel: true };
      }
      const segments: SegmentNode[] = src.segments.map((g) => ({
        id: g.id ?? `${g.a}${g.b}`, a: g.a, b: g.b, color: g.color ?? '#94a3b8', visible: true,
      }));
      const circles: CircleNode[] = (src.circles ?? []).map((c) => ({ ...c, visible: true }));
      const w: Snapshot = { points, segments, circles };
      snapshot();
      set({ ...w, drawn: allDrawn(w), pending: [], selectedId: null, pulseId: null, lockedAngle: null,
            measures: measure(points), hasTriangle: hasTri(points) });
      get().fitView();
    },

    celebrate: (text) => {
      set({ celebration: text });
      setTimeout(() => set({ celebration: null }), 2800);
    },

    setGridMagnet: (b) => set({ gridMagnet: b }),

    undo: () => {
      const s = get();
      if (!s.history.length) return;
      const prev = s.history[s.history.length - 1];
      const cur = clone({ points: s.points, segments: s.segments, circles: s.circles });
      set({
        history: s.history.slice(0, -1), future: [...s.future, cur],
        points: prev.points, segments: prev.segments, circles: prev.circles,
        drawn: allDrawn(prev), measures: measure(prev.points), hasTriangle: hasTri(prev.points),
        pending: [], selectedId: null, menu: null,
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
        pending: [], selectedId: null, menu: null,
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
          measures: measure(points), hasTriangle: hasTri(points), selectedId: null, menu: null,
        });
      } else if (s.segments.some((g) => g.id === id)) {
        set({ segments: s.segments.filter((g) => g.id !== id), selectedId: null, menu: null });
      } else if (s.circles.some((c) => c.id === id)) {
        set({ circles: s.circles.filter((c) => c.id !== id), selectedId: null, menu: null });
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
      set({ ...w, drawn: allDrawn(w), pending: [], selectedId: null,
            measures: measure(w.points), hasTriangle: hasTri(w.points) });
      get().fitView();
      s.toastMsg('📂 Mundo cargado');
    },

    openMenu: (id, x, y) => set({ menu: { id, x, y }, selectedId: id }),
    closeMenu: () => set({ menu: null }),
  };
});

export function initDefaultWorld() {
  const s = useCanvasStore.getState();
  if (!Object.keys(s.points).length) s.loadWorld(null);
}