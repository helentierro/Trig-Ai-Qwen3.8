// src/stores/canvasStore.ts — composición de 4 slices
// Entrega 2 FINAL: sin casts peligrosos y sin imports muertos (TS6133).
import { create } from 'zustand';
import { cameraSlice } from './slices/cameraSlice';
import { objectsSlice } from './slices/objectsSlice';
import { historySlice } from './slices/historySlice';
import { uiSlice } from './slices/uiSlice';
import { type CanvasState, onCanvasEvent } from './slices/types';

// El set/get de zustand YA encaja con StoreSet/StoreGet: no hacen falta casts.
export const useCanvasStore = create<CanvasState>()((set, get) => ({
  ...cameraSlice(set, get),
  ...objectsSlice(set, get),
  ...historySlice(set, get),
  ...uiSlice(set, get),
}));

export function initDefaultWorld() {
  const s = useCanvasStore.getState();
  if (!Object.keys(s.points).length) s.loadWorld(null);
}

// re-exports estables (componentes/services no cambian sus imports)
export { onCanvasEvent };
export type {
  PointNode, SegmentNode, CircleNode, Measures, Tool, GridStyle, Snapshot, SaveSlot, CanvasEvent, CanvasState,
} from './slices/types';
export { DEFAULT_WORLD } from './slices/types';