// src/stores/slices/types.ts — contrato único del store (Entrega 2: partido por slice)
// Cada slice tiene su interfaz; CanvasState = la suma. Cero cambio en runtime.
import type { Camera, Vec2 } from '../../utils/coordinateTransform';
import { rad } from '../../utils/geometry';

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
export type Tool = 'move' | 'point' | 'segment' | 'circle' | 'ruler' | 'protractor' | 'polygon';
export type GridStyle = 'fine' | 'large' | 'circular' | 'diamond' | 'blank';
export interface Measurement {
  kind: 'distance' | 'angle' | 'perimeter';
  label: string;
  value: number;
  unit: string;
}
export interface Snapshot { points: Record<string, PointNode>; segments: SegmentNode[]; circles: CircleNode[]; }
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
export const emit = (e: CanvasEvent) => listeners.forEach((fn) => fn(e));

export const clone = (w: Snapshot): Snapshot => JSON.parse(JSON.stringify(w));
export const allDrawn = (w: Snapshot): Record<string, number> => {
  const d: Record<string, number> = {};
  Object.keys(w.points).forEach((k) => (d[k] = 1));
  w.segments.forEach((g) => (d[g.id] = 1));
  w.circles.forEach((c) => (d[c.id] = 1));
  return d;
};
export const normPts = (pts: Record<string, PointNode>) =>
  Object.fromEntries(Object.entries(pts).map(([k, p]) => [k, { ...p, locked: p.locked ?? false, showLabel: p.showLabel ?? true }]));

export const DEFAULT_WORLD = {
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

export type StoreSet = (p: Partial<CanvasState> | ((s: CanvasState) => Partial<CanvasState>)) => void;
export type StoreGet = () => CanvasState;

// ─── Cajón CÁMARA: viewport, zoom, pan ───────────────────────
export interface CameraSliceState {
  camera: Camera;
  viewport: { w: number; h: number };
  setViewport: (w: number, h: number) => void;
  fitView: () => void;
  panBy: (dx: number, dy: number) => void;
  zoomAtScreen: (pt: Vec2, zoom: number) => void;
}

// ─── Cajón OBJETOS: scene graph + herramientas ───────────────
export interface ObjectsSliceState {
  points: Record<string, PointNode>;
  segments: SegmentNode[];
  circles: CircleNode[];
  measures: Measures;
  hasTriangle: boolean;
  drawn: Record<string, number>;
  tool: Tool;
  pending: string[];
  cursorWorld: Vec2 | null;
  applyPoints: (pts: Record<string, PointNode>) => void;
  toggleVisible: (id: string) => void;
  setAngleDeg: (d: number) => void;
  setBase: (b: number) => void;
  setDrawn: (id: string, t: number) => void;
  resetConstruction: () => void;
  setTool: (t: Tool) => void;
  setCursorWorld: (p: Vec2 | null) => void;
  cancelPending: () => void;
  addPointAt: (world: Vec2) => void;
  clickPoint: (id: string) => void;
  loadWorld: (id: string | null) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleLabel: (id: string) => void;
  setPointPos: (id: string, x: number, y: number) => void;
  setSegmentLen: (id: string, len: number) => void;
  buildPerpendicular: (baseA: string, baseB: string, through: string, length: number) => void;
  buildParallel: (baseA: string, baseB: string, guideId: string, offset: number) => void;
  buildDistancePoint: (centerId: string, refId: string, radius: number) => void;
  buildCircle: (centerId: string, refId: string, radiusOverride?: number) => void;
  setCircleRadius: (id: string, r: number) => void;
  buildMidpoint: (segId: string) => void;
  buildBisector: (segId: string) => void;
  reflectPointAcross: (pointId: string, aId: string, bId: string) => void;
  rotatePointAround: (pointId: string, centerId: string, degAngle?: number) => void;
  buildCircleIntersection: (c1Id: string, c2Id: string) => void;
  /** Asistencia "fijar recto": endereza B a 90° sin modo global. Reemplaza el toggle cadena. */
  fixRight: () => void;
  buildIntersection: (c1Id: string, c2Id: string, r1: number, r2: number) => void;
}

// ─── Cajón HISTORIAL: undo/redo + guardado ───────────────────
export interface HistorySliceState {
  history: Snapshot[];
  future: Snapshot[];
  saves: SaveSlot[];
  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  saveWorld: () => void;
  loadSlot: (i: number) => void;
}

// ─── Cajón UI: interacción, escena IA, menús, toasts ─────────
export interface UISliceState {
  chain: boolean;
  dragId: string | null;
  hoverId: string | null;
  selectedId: string | null;
  pulseId: string | null;
  snapBadge: { label: string } | null;
  lockedAngle: number | null;
  aiCursor: { pos: Vec2; visible: boolean };
  subtitle: string | null;
  transcript: string[];
  playing: boolean;
  voiceOn: boolean;
  celebration: string | null;
  decimals: 2 | 4;
  setDecimals: (d: 2 | 4) => void;
  measurement: Measurement | null;
  setMeasurement: (m: Measurement | null) => void;
  gridMagnet: boolean;
  gridStyle: GridStyle;
  menu: { id: string; x: number; y: number } | null;
  viewMenu: { x: number; y: number } | null;
  toast: string | null;
  toastMsg: (t: string) => void;
  openMenu: (id: string, x: number, y: number) => void;
  closeMenu: () => void;
  openViewMenu: (x: number, y: number) => void;
  closeViewMenu: () => void;
  setHover: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  pulse: (id: string, ms?: number) => void;
  celebrate: (text: string) => void;
  beginDrag: (id: string) => void;
  dragTo: (id: string, world: Vec2) => void;
  endDrag: () => void;
  setAiCursor: (pos: Vec2 | null) => void;
  setSubtitle: (text: string | null) => void;
  setPlaying: (b: boolean) => void;
  setVoiceOn: (b: boolean) => void;
  setGridMagnet: (b: boolean) => void;
  setGridStyle: (s: GridStyle) => void;
  setChain: (b: boolean) => void;
}

// El contrato público sigue siendo UNO solo: la suma de los 4 cajones.
export type CanvasState = CameraSliceState & ObjectsSliceState & HistorySliceState & UISliceState;