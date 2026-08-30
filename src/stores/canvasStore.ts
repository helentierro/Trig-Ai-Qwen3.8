// src/stores/canvasStore.ts — composición de 4 slices (Fase H: escalabilidad)
import { create } from 'zustand';
import { cameraSlice } from './slices/cameraSlice';
import { objectsSlice } from './slices/objectsSlice';
import { historySlice } from './slices/historySlice';
import { uiSlice } from './slices/uiSlice';
import { type CanvasState, type StoreGet, type StoreSet, onCanvasEvent } from './slices/types';

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  ...cameraSlice(set as unknown as StoreSet, get as unknown as StoreGet),
  ...objectsSlice(set as unknown as StoreSet, get as unknown as StoreGet),
  ...historySlice(set as unknown as StoreSet, get as unknown as StoreGet),
  ...uiSlice(set as unknown as StoreSet, get as unknown as StoreGet),
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