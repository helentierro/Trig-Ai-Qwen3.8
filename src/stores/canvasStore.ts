import { create } from 'zustand';
import { type Camera, type Vec2, clamp, niceGridStep, screenToWorld } from '../utils/coordinateTransform';

// ── Scene graph: objetos con id, manipulables por el usuario Y por la IA ──
export interface PointNode {
  id: string;
  pos: Vec2;
  constraint: 'fixed' | 'horizontal' | 'free';
  role: string;
  visible: boolean;
}
export interface SegmentNode { id: string; a: string; b: string; color: string; visible: boolean }
export interface Measures { base: number; height: number; hyp: number; angleDeg: number; area: number }

// ── Interaction bus: semilla de los "momentos enseñables" ─────────────────
export type CanvasEvent =
  | { type: 'drag-start'; id: string }
  | { type: 'drag-end'; id: string; measures: Measures }
  | { type: 'snap-angle'; deg: number }
  | { type: 'view-fit' };

const listeners = new Set<(e: CanvasEvent) => void>();
export const onCanvasEvent = (fn: (e: CanvasEvent) => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const emit = (e: CanvasEvent) => listeners.forEach((fn) => fn(e));

const SPECIAL_ANGLES = [15, 30, 45, 60, 75];
const SNAP_TOL_DEG = 2;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

const measure = (pts: Record<string, PointNode>): Measures => {
  const b = pts.B.pos.x - pts.O.pos.x;
  const h = pts.A.pos.y;
  return { base: b, height: h, hyp: Math.hypot(b, h), angleDeg: deg(Math.atan2(h, b)), area: (b * h) / 2 };
};

const initialPoints = (): Record<string, PointNode> => ({
  O: { id: 'O', pos: { x: 0, y: 0 }, constraint: 'fixed', role: 'origen', visible: true },
  B: { id: 'B', pos: { x: 50, y: 0 }, constraint: 'horizontal', role: 'base', visible: true },
  A: { id: 'A', pos: { x: 50, y: 50 * Math.tan(rad(30)) }, constraint: 'free', role: 'apice', visible: true },
});

interface CanvasState {
  points: Record<string, PointNode>;
  segments: SegmentNode[];
  camera: Camera;
  viewport: { w: number; h: number };
  measures: Measures;
  dragId: string | null;
  hoverId: string | null;
  selectedId: string | null;
  pulseId: string | null;
  snapBadge: { label: string } | null;
  lockedAngle: number | null;

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
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  let badgeTimer: ReturnType<typeof setTimeout> | undefined;
  const flashBadge = (label: string) => {
    set({ snapBadge: { label } });
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => set({ snapBadge: null }), 900);
  };

  return {
    points: initialPoints(),
    segments: [
      { id: 'base', a: 'O', b: 'B', color: '#38bdf8', visible: true },
      { id: 'height', a: 'B', b: 'A', color: '#fb923c', visible: true },
      { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0', visible: true },
    ],
    camera: { zoom: 8, panX: 120, panY: 400 },
    viewport: { w: 0, h: 0 },
    measures: measure(initialPoints()),
    dragId: null,
    hoverId: null,
    selectedId: null,
    pulseId: null,
    snapBadge: null,
    lockedAngle: null,

    setViewport: (w, h) => set({ viewport: { w, h } }),

    fitView: () => {
      const { points, viewport } = get();
      const ps = Object.values(points).map((p) => p.pos);
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
      return { points, segments: s.segments.map((g) => (g.id === id ? { ...g, visible: !g.visible } : g)) };
    }),

    // El dedo de la IA: señala un objeto y brilla en canvas Y panel a la vez
    pulse: (id, ms = 1500) => {
      set({ pulseId: id });
      setTimeout(() => set((s) => (s.pulseId === id ? { pulseId: null } : {})), ms);
    },

    beginDrag: (id) => { set({ dragId: id, selectedId: id }); emit({ type: 'drag-start', id }); },

    dragTo: (id, world) => {
      const { points, camera } = get();
      const step = niceGridStep(camera.zoom, 56);
      let b = points.B.pos.x;
      let h = points.A.pos.y;
      let locked: number | null = null;

      if (id === 'A') {
        const bSnap = Math.max(step, Math.round(clamp(world.x, step, 1000) / step) * step);
        h = clamp(world.y, step, 1000);
        const theta = deg(Math.atan2(h, bSnap));
        locked = SPECIAL_ANGLES.find((s) => Math.abs(theta - s) <= SNAP_TOL_DEG) ?? null;
        b = bSnap;
        h = locked !== null ? bSnap * Math.tan(rad(locked)) : Math.max(step, Math.round(h / step) * step);
      } else if (id === 'B') {
        b = Math.max(step, Math.round(clamp(world.x, step, 1000) / step) * step);
      } else return;

      const pts = {
        ...points,
        B: { ...points.B, pos: { x: b, y: 0 } },
        A: { ...points.A, pos: { x: b, y: h } },
      };
      const wasLocked = get().lockedAngle;
      set({ points: pts, measures: measure(pts), lockedAngle: locked });
      if (locked !== null && locked !== wasLocked) {
        emit({ type: 'snap-angle', deg: locked });
        flashBadge(`${locked}°`);
      }
    },

    endDrag: () => {
      const { dragId, measures } = get();
      if (dragId) emit({ type: 'drag-end', id: dragId, measures });
      set({ dragId: null });
    },

    setAngleDeg: (d) => {
      const b = get().measures.base;
      const h = clamp(b * Math.tan(rad(clamp(d, 1, 89))), 0.5, 2000);
      const pts = { ...get().points, A: { ...get().points.A, pos: { x: b, y: h } } };
      set({ points: pts, measures: measure(pts), lockedAngle: null });
    },

    setBase: (b) => {
      const h = get().measures.height;
      const pts = {
        ...get().points,
        B: { ...get().points.B, pos: { x: b, y: 0 } },
        A: { ...get().points.A, pos: { x: b, y: h } },
      };
      set({ points: pts, measures: measure(pts) });
    },
  };
});