// src/utils/geometry.ts — matemática pura, 100% testeable
import type { Vec2 } from './coordinateTransform';
import type { Measures, PointNode } from '../stores/slices/types';

export const SPECIAL_ANGLES = [15, 30, 45, 60, 75];
export const SNAP_TOL_DEG = 2;

export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
export const dist = (p: Vec2, q: Vec2) => Math.hypot(q.x - p.x, q.y - p.y);

export const ZERO: Measures = { base: 0, height: 0, hyp: 0, angleDeg: 0, angleB: 0, angleA: 0, area: 0, rightAngle: false };

export interface TrigSummary {
  angleDeg: number;
  sin: number;
  cos: number;
  tan: number;
  csc: number;
  sec: number;
  cot: number;
}

export const trigSummary = (m: Measures): TrigSummary => {
  const angleDeg = Number.isFinite(m.angleDeg) ? m.angleDeg : 0;
  const r = rad(angleDeg);
  const sin = Math.sin(r);
  const cos = Math.cos(r);
  const tan = Math.abs(cos) < 1e-9 ? 0 : Math.tan(r);
  return {
    angleDeg,
    sin,
    cos,
    tan,
    csc: Math.abs(sin) < 1e-9 ? 0 : 1 / sin,
    sec: Math.abs(cos) < 1e-9 ? 0 : 1 / cos,
    cot: Math.abs(tan) < 1e-9 ? 0 : 1 / tan,
  };
};

export const angleAt = (P: Vec2, Q: Vec2, R: Vec2): number => {
  const v1 = { x: Q.x - P.x, y: Q.y - P.y };
  const v2 = { x: R.x - P.x, y: R.y - P.y };
  const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
  if (!l1 || !l2) return 0;
  return deg(Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)))));
};

export const measure = (pts: Record<string, PointNode>): Measures => {
  if (!pts.O || !pts.B || !pts.A) return ZERO;
  const O = pts.O.pos, B = pts.B.pos, A = pts.A.pos;
  const base = dist(O, B), height = dist(B, A), hyp = dist(O, A);
  const angleDeg = angleAt(O, B, A);
  const angleB = angleAt(B, O, A);
  const angleA = angleAt(A, O, B);
  const area = Math.abs((B.x - O.x) * (A.y - O.y) - (A.x - O.x) * (B.y - O.y)) / 2;
  return { base, height, hyp, angleDeg, angleB, angleA, area, rightAngle: Math.abs(angleB - 90) < 0.5 };
};

export const perpendicularPoint = (A: Vec2, B: Vec2, offset: number): Vec2 => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { x: A.x + Math.abs(offset), y: A.y };
  const nx = -dy / len;
  const ny = dx / len;
  return { x: A.x + nx * offset, y: A.y + ny * offset };
};

export const parallelPoint = (A: Vec2, B: Vec2, guide: Vec2, offset: number): Vec2 => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { x: guide.x + Math.abs(offset), y: guide.y };
  const ux = dx / len;
  const uy = dy / len;
  return {
    x: guide.x + ux * offset,
    y: guide.y + uy * offset,
  };
};

export const pointAtDistance = (center: Vec2, ref: Vec2, radius: number): Vec2 => {
  const dx = ref.x - center.x;
  const dy = ref.y - center.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { x: center.x + Math.abs(radius), y: center.y };
  return {
    x: center.x + (dx / len) * radius,
    y: center.y + (dy / len) * radius,
  };
};

export const circleIntersection = (c1: Vec2, r1: number, c2: Vec2, r2: number): Vec2[] => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = Math.max(r1 * r1 - a * a, 0);
  const h = Math.sqrt(hSq);
  const x2 = c1.x + (dx / d) * a;
  const y2 = c1.y + (dy / d) * a;
  const rx = -dy / d;
  const ry = dx / d;
  return [
    { x: x2 + rx * h, y: y2 + ry * h },
    { x: x2 - rx * h, y: y2 - ry * h },
  ];
};

export const pointOnSegment = (A: Vec2, B: Vec2, t: number): Vec2 => ({
  x: A.x + (B.x - A.x) * t,
  y: A.y + (B.y - A.y) * t,
});

export const hasTri = (pts: Record<string, PointNode>) => !!(pts.O && pts.B && pts.A);