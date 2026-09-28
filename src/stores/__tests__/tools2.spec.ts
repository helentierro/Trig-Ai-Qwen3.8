// src/stores/__tests__/tools2.spec.ts — Fase 2: medición, polígono y transformaciones.
import { describe, expect, it, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvasStore';
import { bisectorEndpoints, polygonPerimeter, reflectPoint, rotatePoint } from '../../utils/geometry';

const st = () => useCanvasStore.getState();

beforeEach(() => {
  st().loadWorld(null);
  useCanvasStore.setState({ chain: false, gridMagnet: false, tool: 'move', pending: [], measurement: null });
});

describe('regla y transportador', () => {
  it('ruler: 2 toques miden d(O,B) = base', () => {
    st().setTool('ruler');
    st().clickPoint('O');
    expect(st().pending).toEqual(['O']);
    st().clickPoint('B');
    const m = st().measurement;
    expect(m?.kind).toBe('distance');
    expect(m?.label).toBe('d(O, B)');
    expect(m?.value).toBeCloseTo(st().measures.base, 9);
    expect(st().pending).toEqual([]);
  });
  it('protractor: vértice es el 2º toque', () => {
    st().setTool('protractor');
    st().clickPoint('O');
    st().clickPoint('B');
    st().clickPoint('A');
    const m = st().measurement;
    expect(m?.kind).toBe('angle');
    expect(m?.label).toBe('∠OBA');
    expect(m?.value).toBeCloseTo(st().measures.angleB, 9);
  });
});

describe('polígono', () => {
  it('cerrar en el primero crea lados y mide el perímetro', () => {
    st().setTool('polygon');
    st().clickPoint('O');
    st().clickPoint('B');
    st().clickPoint('A');
    st().clickPoint('O');
    const m = st().measurement;
    expect(m?.kind).toBe('perimeter');
    const { base, height, hyp } = st().measures;
    expect(m?.value).toBeCloseTo(base + height + hyp, 6);
    expect(st().pending).toEqual([]);
  });
});

describe('construcción sobre la selección', () => {
  it('buildMidpoint crea el punto medio de base', () => {
    const n0 = Object.keys(st().points).length;
    st().buildMidpoint('base');
    const ids = Object.keys(st().points);
    expect(ids).toHaveLength(n0 + 1);
    const mid = st().points[ids[ids.length - 1]].pos;
    expect(mid.x).toBeCloseTo((st().points.O.pos.x + st().points.B.pos.x) / 2, 9);
  });
  it('buildBisector crea mediatriz perpendicular', () => {
    const nSeg = st().segments.length;
    st().buildBisector('base');
    expect(st().segments.length).toBe(nSeg + 1);
  });
  it('reflectPointAcross espeja A al otro lado de O→B', () => {
    const y0 = st().points.A.pos.y;
    st().reflectPointAcross('A', 'O', 'B');
    const ids = Object.keys(st().points);
    const last = st().points[ids[ids.length - 1]].pos;
    expect(last.y).toBeCloseTo(-y0, 6);
  });
  it('rotatePointAround gira B 90° sobre O', () => {
    st().rotatePointAround('B', 'O', 90);
    const ids = Object.keys(st().points);
    const last = st().points[ids[ids.length - 1]].pos;
    expect(last.x).toBeCloseTo(st().points.O.pos.x, 6);
    expect(last.y).toBeCloseTo(st().measures.base, 3);
  });
  it('buildCircleIntersection: radios medidos, sin magia', () => {
    const nC = st().circles.length;
    st().buildCircleIntersection('O', 'B');
    expect(st().circles.length).toBe(nC + 2);
    const [c1, c2] = st().circles.slice(-2);
    expect(c1.r).toBeCloseTo(st().measures.base, 9);
    expect(c2.r).toBeCloseTo(st().measures.base, 9);
  });
});

describe('geometría pura de transformaciones', () => {
  it('reflectPoint sobre el eje X invierte y', () => {
    expect(reflectPoint({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toEqual({ x: 3, y: -4 });
  });
  it('rotatePoint 90° antihorario', () => {
    const p = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(1, 9);
  });
  it('bisectorEndpoints: perpendicular centrada', () => {
    const [e1, e2] = bisectorEndpoints({ x: 0, y: 0 }, { x: 4, y: 0 });
    expect(e1).toEqual({ x: 2, y: 2 });
    expect(e2).toEqual({ x: 2, y: -2 });
  });
  it('polygonPerimeter del cuadrado = 4', () => {
    expect(polygonPerimeter([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }])).toBeCloseTo(4, 9);
  });
});
