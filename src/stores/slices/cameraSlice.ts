// src/stores/slices/cameraSlice.ts — cámara y viewport (zoom poderoso 0.0005×–2,000,000×)
import { clamp, screenToWorld, ZOOM_MIN, ZOOM_MAX } from '../../utils/coordinateTransform';
import { emit, type CanvasState, type StoreGet, type StoreSet } from './types';

export const cameraSlice = (set: StoreSet, _get: StoreGet) => ({
  camera: { zoom: 8, panX: 120, panY: 400 },
  viewport: { w: 0, h: 0 },

  setViewport: (w: number, h: number) => set({ viewport: { w, h } }),

  fitView: () => {
    const { points, viewport } = _get();
    const ps = Object.values(points).map((p) => p.pos);
    if (!ps.length) return;
    const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
    const minY = Math.min(...ps.map((p) => p.y)), maxY = Math.max(...ps.map((p) => p.y));
    const pad = 90;
    const zoom = clamp(
      Math.min((viewport.w - pad) / Math.max(maxX - minX, 1), (viewport.h - pad) / Math.max(maxY - minY, 1)),
      ZOOM_MIN, ZOOM_MAX,
    );
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    set({ camera: { zoom, panX: viewport.w / 2 - cx * zoom, panY: viewport.h / 2 + cy * zoom } });
    emit({ type: 'view-fit' });
  },

  panBy: (dx: number, dy: number) =>
    set((s) => ({ camera: { ...s.camera, panX: s.camera.panX + dx, panY: s.camera.panY + dy } })),

  zoomAtScreen: (pt: { x: number; y: number }, zoom: number) => {
    const z = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    const w = screenToWorld(pt, _get().camera);
    set({ camera: { zoom: z, panX: pt.x - w.x * z, panY: pt.y + w.y * z } });
  },
}) satisfies Partial<CanvasState>;