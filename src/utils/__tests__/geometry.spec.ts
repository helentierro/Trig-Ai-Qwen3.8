import { describe, expect, it } from 'vitest';
import { circleIntersection, parallelPoint, perpendicularPoint, pointAtDistance } from '../geometry';

describe('construction helpers', () => {
  it('creates a perpendicular offset from a base segment', () => {
    const p = perpendicularPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, 5);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(5);
  });

  it('creates a point on a parallel line through a guide point', () => {
    const p = parallelPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 3, y: 4 }, 6);
    expect(p.x).toBeCloseTo(9);
    expect(p.y).toBeCloseTo(4);
  });

  it('creates a point at a fixed distance from a center', () => {
    const p = pointAtDistance({ x: 0, y: 0 }, { x: 10, y: 0 }, 7);
    expect(p.x).toBeCloseTo(7);
    expect(p.y).toBeCloseTo(0);
  });

  it('computes intersections between two circles', () => {
    const pts = circleIntersection({ x: 0, y: 0 }, 5, { x: 6, y: 0 }, 5);
    expect(pts).toHaveLength(2);
    expect(pts[0].x).toBeCloseTo(3);
    expect(pts[0].y).toBeCloseTo(4);
    expect(pts[1].x).toBeCloseTo(3);
    expect(pts[1].y).toBeCloseTo(-4);
  });

  it('returns a stable point for a degenerate segment', () => {
    const p = perpendicularPoint({ x: 2, y: 2 }, { x: 2, y: 2 }, 7);
    expect(p).toEqual({ x: 2 + 7, y: 2 });
  });
});
