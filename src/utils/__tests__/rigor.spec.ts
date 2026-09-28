// src/utils/__tests__/rigor.spec.ts — Fase 1: candados matemáticos que fijan el examen.
// H1: identidades op/hip solo valen en triángulo rectángulo.
// H2: la suma de ángulos se juzga sobre valores precisos, no redondeados.
import { describe, expect, it, beforeEach } from 'vitest';
import { evalExpr, extractNums } from '../expr';
import { measure, rad } from '../geometry';
import { useCanvasStore } from '../../stores/canvasStore';

const st = () => useCanvasStore.getState();
beforeEach(() => { st().loadWorld(null); });

describe('extractNums valida entrada del Álgebra', () => {
  it('"(50, 60)" → [50, 60]', () => {
    expect(extractNums('(50, 60)')).toEqual([50, 60]);
  });
  it('texto sin números → [] (el panel debe avisar, no ignorar)', () => {
    expect(extractNums('hola')).toEqual([]);
    expect(extractNums('')).toEqual([]);
  });
  it('negativos y decimales', () => {
    expect(extractNums('(99.32, -41.78)')).toEqual([99.32, -41.78]);
  });
});

describe('evalExpr modo angular explícito', () => {
  it('grados por defecto (aula): sin(30) = 0.5', () => {
    expect(evalExpr('sin(30)')).toBeCloseTo(0.5, 9);
  });
  it('radianes: sin(pi/2) = 1, asin(1) = pi/2', () => {
    expect(evalExpr('sin(pi/2)', {}, { angle: 'rad' })).toBeCloseTo(1, 9);
    expect(evalExpr('asin(1)', {}, { angle: 'rad' })).toBeCloseTo(Math.PI / 2, 9);
    expect(evalExpr('cos(pi)', {}, { angle: 'rad' })).toBeCloseTo(-1, 9);
  });
  it('los modos difieren donde deben: sin(45)', () => {
    const deg = evalExpr('sin(45)')!;
    const radm = evalExpr('sin(45)', {}, { angle: 'rad' })!;
    expect(Math.abs(deg - radm)).toBeGreaterThan(0.1);
  });
});

const pt = (id: string, x: number, y: number) => ({
  id, pos: { x, y }, constraint: 'free' as const, role: 'libre',
  visible: true, locked: false, showLabel: true,
});

describe('H1: op/hip solo en rectángulo', () => {
  it('rectángulo 3-4-5: height/base == tan(θ) (identidad afirmable)', () => {
    const m = measure({ O: pt('O', 0, 0), B: pt('B', 4, 0), A: pt('A', 4, 3) });
    expect(m.rightAngle).toBe(true);
    expect(m.height / m.base).toBeCloseTo(Math.tan(rad(m.angleDeg)), 9);
    expect(m.height / m.hyp).toBeCloseTo(Math.sin(rad(m.angleDeg)), 9);
  });
  it('captura del examen: height/base (0.42441) != tan(θ) (0.43042) → NO afirmar', () => {
    const m = measure({ O: pt('O', 0, 0), B: pt('B', 100.43, 0.83), A: pt('A', 99.32, -41.78) });
    expect(m.rightAngle).toBe(false);
    expect(Math.abs(m.height / m.base - Math.tan(rad(m.angleDeg)))).toBeGreaterThan(0.001);
  });
});

describe('H2: suma sobre valores precisos', () => {
  it('captura del examen: suma precisa ≈ 180 aunque el display sumaba 180.01', () => {
    const m = measure({ O: pt('O', 0, 0), B: pt('B', 100.43, 0.83), A: pt('A', 99.32, -41.78) });
    expect(m.angleDeg + m.angleB + m.angleA).toBeCloseTo(180, 6);
    // Tripleta literal mostrada en la captura: redondear sumandos rompe la igualdad.
    const shown = [23.29, 88.04, 68.68];
    expect(shown[0] + shown[1] + shown[2]).toBeCloseTo(180.01, 6);
    expect(Math.abs(shown[0] + shown[1] + shown[2] - 180)).toBeGreaterThan(0.001);
  });
});

describe('store rigor: precisión y círculos editables', () => {
  it('decimales por defecto 2 y cambian a 4', () => {
    expect(st().decimals).toBe(2);
    st().setDecimals(4);
    expect(st().decimals).toBe(4);
    st().setDecimals(2);
  });
  it('setCircleRadius edita y rechaza inválidos sin romper', () => {
    st().buildCircle('O', 'B');
    const id = st().circles[0].id;
    const before = st().circles[0].r;
    expect(before).toBeGreaterThan(0);
    st().setCircleRadius(id, 99);
    expect(st().circles[0].r).toBe(99);
    st().setCircleRadius(id, -5);
    expect(st().circles[0].r).toBe(99);
    st().setCircleRadius('inexistente', 10);
    expect(st().circles).toHaveLength(1);
  });
});
