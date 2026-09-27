// src/stores/slices/objectsSlice.ts — scene graph: puntos/segmentos/círculos + herramientas
import { clamp, niceGridStep } from '../../utils/coordinateTransform';
import { circleIntersection, dist, hasTri, measure, parallelPoint, perpendicularPoint, pointAtDistance, pointOnSegment, rad } from '../../utils/geometry';
import { KNOWLEDGE } from '../../data/knowledge';
import { allDrawn, DEFAULT_WORLD, type CircleNode, type PointNode, type SegmentNode, type CanvasState, type StoreGet, type StoreSet } from './types';

export const objectsSlice = (set: StoreSet, get: StoreGet) => {
  let pointN = 1, objN = 1;

  return {
    points: {} as Record<string, PointNode>,
    segments: [] as SegmentNode[],
    circles: [] as CircleNode[],
    measures: measure({}),
    hasTriangle: false,
    drawn: {} as Record<string, number>,
    tool: 'move' as CanvasState['tool'],
    pending: [] as string[],
    cursorWorld: null,

    applyPoints: (pts: Record<string, PointNode>) =>
      set({ points: pts, measures: measure(pts), hasTriangle: hasTri(pts) }),

    toggleVisible: (id: string) => set((s) => {
      const points = { ...s.points };
      if (points[id]) points[id] = { ...points[id], visible: !points[id].visible };
      return {
        points,
        segments: s.segments.map((g) => (g.id === id ? { ...g, visible: !g.visible } : g)),
        circles: s.circles.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
      };
    }),

    setTool: (t) => set({ tool: t, pending: [] }),
    setCursorWorld: (p) => set({ cursorWorld: p }),
    cancelPending: () => set({ pending: [] }),

    setAngleDeg: (d: number) => {
      const s = get();
      if (!s.hasTriangle) return;
      s.snapshot();
      const O = s.points.O.pos;
      const b = (s.points.B.pos.x - O.x) || 50;
      const h = clamp(b * Math.tan(rad(clamp(d, 1, 89))), 0.5, 2000);
      s.applyPoints({
        ...s.points,
        B: { ...s.points.B, pos: { x: O.x + b, y: O.y } },
        A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } },
      });
      set({ lockedAngle: null });
    },

    setBase: (b: number) => {
      const s = get();
      if (!s.hasTriangle) return;
      s.snapshot();
      const O = s.points.O.pos;
      const h = s.points.A.pos.y - s.points.B.pos.y;
      s.applyPoints({
        ...s.points,
        B: { ...s.points.B, pos: { x: O.x + b, y: O.y } },
        A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } },
      });
    },

    setPointPos: (id: string, x: number, y: number) => {
      const s = get();
      if (!s.points[id]) return;
      s.snapshot();
      s.applyPoints({ ...s.points, [id]: { ...s.points[id], pos: { x, y } } });
    },

    setSegmentLen: (id: string, len: number) => {
      const s = get();
      const seg = s.segments.find((x) => x.id === id);
      if (!seg || !s.points[seg.a] || !s.points[seg.b]) return;
      s.snapshot();
      if (s.chain && s.hasTriangle) {
        const O = s.points.O.pos;
        if (id === 'base') { s.setBase(len); return; }
        if (id === 'height') {
          s.applyPoints({ ...s.points, A: { ...s.points.A, pos: { x: s.points.B.pos.x, y: s.points.B.pos.y + len } } });
          return;
        }
        if (id === 'hyp') {
          const b = s.measures.base;
          const h = Math.sqrt(Math.max(len * len - b * b, 1));
          s.applyPoints({ ...s.points, A: { ...s.points.A, pos: { x: O.x + b, y: O.y + h } } });
          return;
        }
      }
      const pa = s.points[seg.a].pos, pb = s.points[seg.b].pos;
      const d = dist(pa, pb);
      if (!d) return;
      const np = { x: pa.x + ((pb.x - pa.x) / d) * len, y: pa.y + ((pb.y - pa.y) / d) * len };
      s.applyPoints({ ...s.points, [seg.b]: { ...s.points[seg.b], pos: np } });
    },

    buildPerpendicular: (baseA: string, baseB: string, through: string, length: number) => {
      const s = get();
      const A = s.points[baseA];
      const B = s.points[baseB];
      const C = s.points[through];
      if (!A || !B || !C) return;
      s.snapshot();
      const foot = perpendicularPoint(A.pos, B.pos, length);
      const q = pointOnSegment(A.pos, B.pos, 0.5);
      const newPointId = `P${pointN++}`;
      const newSegId = `s${objN++}`;
      const newPoint = {
        id: newPointId,
        pos: { x: q.x + (foot.x - A.pos.x), y: q.y + (foot.y - A.pos.y) },
        constraint: 'free',
        role: 'libre',
        visible: true,
        locked: false,
        showLabel: true,
      } as const;
      s.applyPoints({ ...s.points, [newPointId]: newPoint });
      set({
        segments: [...s.segments, { id: newSegId, a: through, b: newPointId, color: '#fbbf24', visible: true }],
        drawn: { ...s.drawn, [newSegId]: 1 },
      });
    },

    buildParallel: (baseA: string, baseB: string, guideId: string, offset: number) => {
      const s = get();
      const A = s.points[baseA];
      const B = s.points[baseB];
      const guide = s.points[guideId];
      if (!A || !B || !guide) return;
      s.snapshot();
      const p = parallelPoint(A.pos, B.pos, guide.pos, offset);
      const newPointId = `P${pointN++}`;
      const newSegId = `s${objN++}`;
      const newPoint = {
        id: newPointId,
        pos: p,
        constraint: 'free',
        role: 'libre',
        visible: true,
        locked: false,
        showLabel: true,
      } as const;
      s.applyPoints({ ...s.points, [newPointId]: newPoint });
      set({
        segments: [...s.segments, { id: newSegId, a: guideId, b: newPointId, color: '#a78bfa', visible: true }],
        drawn: { ...s.drawn, [newSegId]: 1 },
      });
    },

    buildDistancePoint: (centerId: string, refId: string, radius: number) => {
      const s = get();
      const center = s.points[centerId];
      const ref = s.points[refId];
      if (!center || !ref) return;
      s.snapshot();
      const p = pointAtDistance(center.pos, ref.pos, radius);
      const newPointId = `P${pointN++}`;
      const newSegId = `s${objN++}`;
      const newPoint = {
        id: newPointId,
        pos: p,
        constraint: 'free',
        role: 'libre',
        visible: true,
        locked: false,
        showLabel: true,
      } as const;
      s.applyPoints({ ...s.points, [newPointId]: newPoint });
      set({
        segments: [...s.segments, { id: newSegId, a: centerId, b: newPointId, color: '#f59e0b', visible: true }],
        drawn: { ...s.drawn, [newSegId]: 1 },
      });
    },

    buildCircle: (centerId: string, refId: string, radiusOverride?: number) => {
      const s = get();
      const center = s.points[centerId];
      const ref = s.points[refId];
      if (!center || !ref) return;
      const radius = radiusOverride ?? dist(center.pos, ref.pos);
      const id = `c${objN++}`;
      s.snapshot();
      set({
        circles: [...s.circles, { id, c: centerId, r: radius, visible: true }],
        drawn: { ...s.drawn, [id]: 1 },
      });
    },

    buildIntersection: (c1Id: string, c2Id: string, r1: number, r2: number) => {
      const s = get();
      const c1 = s.points[c1Id];
      const c2 = s.points[c2Id];
      if (!c1 || !c2) return;
      const inter = circleIntersection(c1.pos, r1, c2.pos, r2);
      if (!inter.length) return;
      s.snapshot();
      const add = inter.map((p) => {
        const id = `P${pointN++}`;
        return { id, pos: p, constraint: 'free', role: 'libre', visible: true, locked: false, showLabel: true } as const;
      });
      const points = { ...s.points };
      for (const p of add) points[p.id] = p;
      s.applyPoints(points);
    },

    addPointAt: (world) => {
      const s = get();
      const step = niceGridStep(s.camera.zoom, 56);
      const id = `P${pointN++}`;
      const pos = s.gridMagnet
        ? { x: Math.round(world.x / step) * step, y: Math.round(world.y / step) * step }
        : { x: world.x, y: world.y };
      s.snapshot();
      set({
        points: { ...s.points, [id]: { id, pos, constraint: 'free', role: 'libre', visible: true, locked: false, showLabel: true } },
      });
    },

    clickPoint: (id: string) => {
      const s = get();
      if (s.tool === 'segment') {
        if (s.pending.length === 0) return set({ pending: [id] });
        if (s.pending[0] === id) return set({ pending: [] });
        const sid = `s${objN++}`;
        s.snapshot();
        set({
          segments: [...s.segments, { id: sid, a: s.pending[0], b: id, color: '#94a3b8', visible: true }],
          drawn: { ...s.drawn, [sid]: 1 }, pending: [],
        });
      } else if (s.tool === 'circle') {
        if (s.pending.length === 0) return set({ pending: [id] });
        const c = s.points[s.pending[0]];
        if (!c) return set({ pending: [] });
        const r = Math.hypot(s.points[id].pos.x - c.pos.x, s.points[id].pos.y - c.pos.y);
        const cid = `c${objN++}`;
        s.snapshot();
        set({
          circles: [...s.circles, { id: cid, c: s.pending[0], r, visible: true }],
          drawn: { ...s.drawn, [cid]: 1 }, pending: [],
        });
      }
    },

    loadWorld: (id: string | null) => {
      const src = (id && KNOWLEDGE[id]?.world) || DEFAULT_WORLD;
      const points: Record<string, PointNode> = {};
      for (const p of src.points) {
        const role = p.id === 'O' ? 'origen' : p.id === 'B' ? 'base' : p.id === 'A' ? 'ápice' : 'libre';
        points[p.id] = { id: p.id, pos: { x: p.x, y: p.y }, constraint: 'free', role, visible: true, locked: false, showLabel: true };
      }
      const segments: SegmentNode[] = src.segments.map((g) => ({
        id: g.id ?? `${g.a}-${g.b}`, a: g.a, b: g.b, color: g.color ?? '#94a3b8', visible: true,
      }));
      const circles: CircleNode[] = ((src as { circles?: CircleNode[] }).circles ?? []).map((c) => ({ ...c, visible: true }));
      const w = { points, segments, circles };
      get().snapshot();
      set({
        ...w, drawn: allDrawn(w), pending: [], selectedId: null, pulseId: null, lockedAngle: null,
        measures: measure(points), hasTriangle: hasTri(points),
      });
      get().fitView();
    },

    deleteObject: (id: string) => {
      const s = get();
      s.snapshot();
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

    duplicateObject: (id: string) => {
      const s = get();
      s.snapshot();
      if (s.points[id]) {
        const p = s.points[id];
        const nid = `P${pointN++}`;
        set({ points: { ...s.points, [nid]: { ...p, id: nid, pos: { x: p.pos.x + 5, y: p.pos.y + 5 }, locked: false, role: 'libre' } }, menu: null });
      } else if (s.segments.some((g) => g.id === id)) {
        const g = s.segments.find((x) => x.id === id)!;
        const pa = s.points[g.a], pb = s.points[g.b];
        if (!pa || !pb) return;
        const a2 = `P${pointN++}`, b2 = `P${pointN++}`, sid = `s${objN++}`;
        set({
          points: {
            ...s.points,
            [a2]: { ...pa, id: a2, pos: { x: pa.pos.x + 5, y: pa.pos.y + 5 }, locked: false, role: 'libre' },
            // FIX TS2339: pb.pos.x (no pb.x)
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

    toggleLock: (id: string) => {
      const s = get();
      if (!s.points[id]) return;
      s.snapshot();
      set({ points: { ...s.points, [id]: { ...s.points[id], locked: !s.points[id].locked } }, menu: null });
    },

    toggleLabel: (id: string) => {
      const s = get();
      if (!s.points[id]) return;
      s.snapshot();
      set({ points: { ...s.points, [id]: { ...s.points[id], showLabel: !s.points[id].showLabel } }, menu: null });
    },

    setDrawn: (id: string, t: number) => set((s) => ({ drawn: { ...s.drawn, [id]: clamp(t, 0, 1) } })),

    resetConstruction: () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const s = get();
      const zero: Record<string, number> = {};
      Object.values(s.points).forEach((p) => (zero[p.id] = 0));
      s.segments.forEach((g) => (zero[g.id] = 0));
      set({ drawn: zero, subtitle: null, selectedId: null, pulseId: null, pending: [], aiCursor: { pos: { x: 0, y: 0 }, visible: false } });
    },
  } satisfies Partial<CanvasState>;
};