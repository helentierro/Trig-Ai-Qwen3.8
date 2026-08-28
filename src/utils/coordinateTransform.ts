export interface Vec2 { x: number; y: number }
export interface Camera { zoom: number; panX: number; panY: number } // screen = world*zoom + pan (y invertida)

export const worldToScreen = (p: Vec2, c: Camera): Vec2 => ({
  x: p.x * c.zoom + c.panX,
  y: -p.y * c.zoom + c.panY,
});

export const screenToWorld = (p: Vec2, c: Camera): Vec2 => ({
  x: (p.x - c.panX) / c.zoom,
  y: -(p.y - c.panY) / c.zoom,
});

/** Paso de grilla 1/2/5×10^n para que la celda mida ~targetPx en pantalla */
export function niceGridStep(zoom: number, targetPx = 64): number {
  const raw = targetPx / zoom;
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (pow * m >= raw) return pow * m;
  return pow * 10;
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));