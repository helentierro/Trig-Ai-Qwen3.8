// src/utils/geometry.ts — matemática pura, 100% testeable
import type { Vec2 } from './coordinateTransform';
import type { Measures, PointNode } from '../stores/slices/types';

export const SPECIAL_ANGLES = [15, 30, 45, 60, 75];
export const SNAP_TOL_DEG = 2;

export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
export const dist = (p: Vec2, q: Vec2) => Math.hypot(q.x - p.x, q.y - p.y);

export const ZERO: Measures = { base: 0, height: 0, hyp: 0, angleDeg: 0, angleB: 0, angleA: 0, area: 0, rightAngle: false };

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

export const hasTri = (pts: Record<string, PointNode>) => !!(pts.O && pts.B && pts.A);