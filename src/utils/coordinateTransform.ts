// src/utils/coordinateTransform.ts
// Zoom extremo (0.0005× → 2,000,000×) + grilla fluida 1-2-5×10ⁿ a cualquier escala.

export interface Vec2 { x: number; y: number; }
export interface Camera { zoom: number; panX: number; panY: number; }

export const ZOOM_MIN = 0.0005;
export const ZOOM_MAX = 2_000_000;
export const WORLD_LIMIT = 5_000_000; // libertad total: los 4 cuadrantes y más (bug G5)

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** world → screen */
export function worldToScreen(p: Vec2, cam: Camera): Vec2 {
  return { x: p.x * cam.zoom + cam.panX, y: -p.y * cam.zoom + cam.panY };
}

/** screen → world */
export function screenToWorld(p: Vec2, cam: Camera): Vec2 {
  return { x: (p.x - cam.panX) / cam.zoom, y: -(p.y - cam.panY) / cam.zoom };
}

/** Paso de grilla "bonito" (1-2-5×10ⁿ) que apunta a ~targetPx píxeles. */
export function niceGridStep(zoom: number, targetPx = 64): number {
  const raw = targetPx / Math.max(zoom, 1e-12);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const res = raw / mag;
  if (res <= 1) return mag;
  if (res <= 2) return 2 * mag;
  if (res <= 5) return 5 * mag;
  return 10 * mag;
}

/** Formato inteligente de coordenadas (enteros limpios, notación en extremos). */
export function fmtCoord(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1_000_000 || a < 0.001) return v.toExponential(2);
  if (Number.isInteger(v)) return v.toLocaleString('es');
  const decimals = a < 1 ? 4 : a < 10 ? 3 : a < 100 ? 2 : 1;
  return v.toLocaleString('es', { maximumFractionDigits: decimals });
}