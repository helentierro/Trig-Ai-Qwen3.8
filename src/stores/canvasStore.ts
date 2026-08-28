import { create } from 'zustand';
import { type Camera, type Vec2, clamp, niceGridStep, screenToWorld } from '../utils/coordinateTransform';
import { KNOWLEDGE, type WorldDef } from '../data/knowledge';

export interface PointNode { id: string; pos: Vec2; constraint: 'fixed' | 'horizontal' | 'free'; role: string; visible: boolean }
export interface SegmentNode { id: string; a: string; b: string; color: string; visible: boolean }
export interface CircleNode { id: string; c: string; r: number; visible: boolean }
export interface Measures { base: number; height: number; hyp: number; angleDeg: number; area: number }
export type Tool = 'move' | 'point' | 'segment' | 'circle';

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
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const ZERO: Measures = { base: 0, height: 0, hyp: 0, angleDeg: 0, area: 0 };

// BLINDADO: si no hay triángulo, no hay medida (antes explotaba aquí al arrancar)
const measure = (pts: Record<string, PointNode>): Measures => {
  if (!pts.O || !pts.B || !pts.A) return ZERO;
  const b = pts.B.pos.x - pts.O.pos.x;
  const h = pts.A.pos.y;
  return { base: b, height: h, hyp: Math.hypot(b, h), angleDeg: deg(Math.atan2(h, b)), area: (b * h) / 2 };
};
const hasTri = (pts: Record<string, PointNode>) => !!(pts.O && pts.B && pts.A);

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
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  let badgeTimer: ReturnType<typeof setTimeout> | undefined;
  let pointN = 1, objN = 1;
  const flashBadge = (label: string) => {
    set({ snapBadge: { label } });
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => set({ snapBadge: null }), 900);
  };

  const applyPoints = (pts: Record<string, PointNode>) =>
    set({ points: pts, measures: measure(pts), hasTriangle: hasTri(pts) });

  return {
    points: {}, segments: [], circles: [],
    camera: { zoom: 8, panX: 120, panY: 400 },
    viewport: { w: 0, h: 0 },
    measures: { ...ZERO },   // ✅ antes: measure({}) → crash al arrancar
    hasTriangle: false,
    dragId: null, hoverId: null, selectedId: null, pulseId: null,
    snapBadge: null, lockedAngle: null,
    drawn: {}, aiCursor: { pos: { x: 0, y: 0 }, visible: false },
    subtitle: null, transcript: [], playing: false, voiceOn: false,
    tool: 'move', pending: [], cursorWorld: null, celebration: null,

    setViewport: (w, h) => set({ viewport: { w, h } }),

    fitView: () => {
      const { points, viewport } = get();
      const ps = Object.values(points).map((p) => p.pos);
      if (!ps.length) return;
      const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
      const minY = Math.min(...ps.map((p) => p.y)), maxY = Math.max(...ps.map((p) => p.y));
      const pad = 90;
      const zoom = clamp(Math.min((viewport.w - pad * 2) / Math.max(maxX - minX, 1),
                                  (viewport.h - pad * 2) / Math.max(maxY - minY, 1)), 3, 140);
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      set({ camera: { zoom, panX: viewport.w / 2 - cx * zoom, panY: viewport.h / 2 + cy * zoom } });
      emit({ type: 'view-fit' });
    },

    panBy: (dx, dy) => set((s) => ({ camera: { ...s.camera, panX: s.camera.panX + dx, panY: s.camera.panY + dy } })),

    zoomAtScreen: (pt, zoom) => {
      const z = clamp(zoom, 3, 140);
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

    beginDrag: (id) => { set({ dragId: id, selectedId: id }); emit({ type: 'drag-start', id }); },

    dragTo: (id, world) => {
      const { points, camera } = get();
      if (id === 'O' || !points[id]) return;
      const step = niceGridStep(camera.zoom, 56);

      if (id === 'A' && points.B && points.O) {
        let b = points.B.pos.x;
        let h = points.A.pos.y;
        let locked: number | null = null;
        const bSnap = Math.max(step, Math.round(clamp(world.x, step, 1000) / step) * step);
        h = clamp(world.y, step, 1000);
        const theta = deg(Math.atan2(h, bSnap));
        locked = SPECIAL_ANGLES.find((s) => Math.abs(theta - s) <= SNAP_TOL_DEG) ?? null;
        b = bSnap;
        h = locked !== null ? bSnap * Math.tan(rad(locked)) : Math.max(step, Math.round(h / step) * step);
        const pts = { ...points, B: { ...points.B, pos: { x: b, y: 0 } }, A: { ...points.A, pos: { x: b, y: h } } };
        const wasLocked = get().lockedAngle;
        set({ points: pts, measures: measure(pts), lockedAngle: locked });
        if (locked !== null && locked !== wasLocked) { emit({ type: 'snap-angle', deg: locked }); flashBadge(`${locked}°`); }
        return;
      }
      if (id === 'B' && points.O) {
        const b = Math.max(step, Math.round(clamp(world.x, step, 1000) / step) * step);
        applyPoints({ ...points, B: { ...points.B, pos: { x: b, y: 0 } } });
        return;
      }
      const pos = { x: Math.round(world.x / step) * step, y: Math.round(world.y / step) * step };
      applyPoints({ ...points, [id]: { ...points[id], pos } });
    },

    endDrag: () => {
      const { dragId, measures } = get();
      if (dragId) emit({ type: 'drag-end', id: dragId, measures });
      set({ dragId: null });
    },

    setAngleDeg: (d) => {
      const s = get();
      if (!s.hasTriangle) return;
      const b = s.measures.base;
      const h = clamp(b * Math.tan(rad(clamp(d, 1, 89))), 0.5, 2000);
      applyPoints({ ...s.points, A: { ...s.points.A, pos: { x: b, y: h } } });
      set({ lockedAngle: null });
    },

    setBase: (b) => {
      const s = get();
      if (!s.hasTriangle) return;
      const h = s.measures.height;
      applyPoints({
        ...s.points,
        B: { ...s.points.B, pos: { x: b, y: 0 } },
        A: { ...s.points.A, pos: { x: b, y: h } },
      });
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

    addPointAt: (world) => {
      const s = get();
      const step = niceGridStep(s.camera.zoom, 56);
      const id = `P${pointN++}`;
      const pos = { x: Math.round(world.x / step) * step, y: Math.round(world.y / step) * step };
      set({ points: { ...s.points, [id]: { id, pos, constraint: 'free', role: 'libre', visible: true } }, drawn: { ...s.drawn, [id]: 1 } });
    },

    clickPoint: (id) => {
      const s = get();
      if (s.tool === 'segment') {
        if (s.pending.length === 0) return set({ pending: [id] });
        if (s.pending[0] === id) return set({ pending: [] });
        const sid = `s${objN++}`;
        set({ segments: [...s.segments, { id: sid, a: s.pending[0], b: id, color: '#94a3b8', visible: true }], drawn: { ...s.drawn, [sid]: 1 }, pending: [] });
      } else if (s.tool === 'circle') {
        if (s.pending.length === 0) return set({ pending: [id] });
        const c = s.points[s.pending[0]];
        const r = Math.hypot(s.points[id].pos.x - c.pos.x, s.points[id].pos.y - c.pos.y);
        const cid = `c${objN++}`;
        set({ circles: [...s.circles, { id: cid, c: s.pending[0], r, visible: true }], drawn: { ...s.drawn, [cid]: 1 }, pending: [] });
      }
    },

    loadWorld: (id) => {
      const src = (id && KNOWLEDGE[id]?.world) || DEFAULT_WORLD;
      const points: Record<string, PointNode> = {};
      for (const p of src.points) {
        const constraint = p.id === 'O' ? 'fixed' : p.id === 'B' ? 'horizontal' : 'free';
        const role = p.id === 'O' ? 'origen' : p.id === 'B' ? 'base' : p.id === 'A' ? 'apice' : 'libre';
        points[p.id] = { id: p.id, pos: { x: p.x, y: p.y }, constraint, role, visible: true };
      }
      const segments: SegmentNode[] = src.segments.map((g) => ({
        id: g.id ?? `${g.a}${g.b}`, a: g.a, b: g.b, color: g.color ?? '#94a3b8', visible: true,
      }));
      const circles: CircleNode[] = (src.circles ?? []).map((c) => ({ ...c, visible: true }));
      const drawn: Record<string, number> = {};
      Object.keys(points).forEach((k) => (drawn[k] = 1));
      segments.forEach((g) => (drawn[g.id] = 1));
      circles.forEach((c) => (drawn[c.id] = 1));
      set({ points, segments, circles, drawn, pending: [], selectedId: null, pulseId: null, lockedAngle: null,
            measures: measure(points), hasTriangle: hasTri(points) });
      get().fitView();
    },

    celebrate: (text) => {
      set({ celebration: text });
      setTimeout(() => set({ celebration: null }), 2800);
    },
  };
});

export function initDefaultWorld() {
  const s = useCanvasStore.getState();
  if (!Object.keys(s.points).length) s.loadWorld(null);
}