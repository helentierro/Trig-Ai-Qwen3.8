// src/stores/__tests__/canvasStore.spec.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvasStore';

const st = () => useCanvasStore.getState();

beforeEach(() => {
  st().loadWorld(null);
  useCanvasStore.setState({ chain: false, gridMagnet: false });
});

describe('geometría viva', () => {
  it('mundo default: 30-60-90', () => {
    const m = st().measures;
    expect(m.base).toBeCloseTo(50, 1);
    expect(m.angleDeg).toBeCloseTo(30, 0);
    expect(m.rightAngle).toBe(true);
  });

  it('libre: arrastrar A NO mueve B (bug G1)', () => {
    st().dragTo('A', { x: 50, y: 80 });
    expect(st().points.A.pos.y).toBeCloseTo(80);
    expect(st().points.B.pos).toEqual({ x: 50, y: 0 });
  });

  it('libre: O se mueve a cualquier cuadrante (bug G2/G5)', () => {
    st().dragTo('O', { x: -200, y: -150 });
    expect(st().points.O.pos).toEqual({ x: -200, y: -150 });
  });

  it('cadena: B arrastra A.x; candado manda (G3)', () => {
    st().setChain(true);
    st().dragTo('B', { x: 70, y: 0 });
    expect(st().points.A.pos.x).toBe(70);
    st().toggleLock('A');
    st().dragTo('B', { x: 90, y: 0 });
    expect(st().points.A.pos.x).toBe(70);
    expect(st().points.B.pos.x).toBe(90);
  });

  it('undo/redo restauran el mundo', () => {
    const before = st().points.A.pos.y;
    st().dragTo('A', { x: 50, y: 99 });
    st().undo();
    expect(st().points.A.pos.y).toBeCloseTo(before);
    st().redo();
    expect(st().points.A.pos.y).toBeCloseTo(99);
  });

  it('borrar punto elimina sus segmentos en cascada', () => {
    st().addPointAt({ x: 10, y: 10 });
    st().addPointAt({ x: 40, y: 10 });
    st().setTool('segment');
    st().clickPoint('P1');
    st().clickPoint('P2');
    expect(st().segments.some((g) => g.id === 's1')).toBe(true);
    st().deleteObject('P1');
    expect(st().segments.some((g) => g.id === 's1')).toBe(false);
  });
});