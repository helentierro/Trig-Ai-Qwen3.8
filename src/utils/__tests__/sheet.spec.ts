// src/utils/__tests__/sheet.spec.ts
import { describe, expect, it } from 'vitest';
import { computeGrid, shiftFormula } from '../sheet';
import { evalExpr } from '../expr';

describe('calculadora (expr)', () => {
  it('opera en grados y potencias', () => {
    expect(evalExpr('sin(30)')).toBeCloseTo(0.5);
    expect(evalExpr('2^10')).toBe(1024);
    expect(evalExpr('tan(45)')).toBeCloseTo(1);
  });
  it('rechaza identidades desconocidas', () => {
    expect(evalExpr('hack(1)')).toBeNull();
  });
});

describe('mini-excel', () => {
  it('referencias y aritmética', () => {
    const { values } = computeGrid({ A1: '2', A2: '3', B1: '=A1*A2' });
    expect(values.B1).toBe(6);
  });
  it('sum de rango', () => {
    const { values } = computeGrid({ A1: '1', A2: '2', A3: '3', C1: '=sum(A1:A3)' });
    expect(values.C1).toBe(6);
  });
  it('detecta ciclos', () => {
    const { errors } = computeGrid({ A1: '=B1', B1: '=A1' });
    expect(errors.A1).toBe('#CICLO');
  });
  it('shiftFormula desplaza referencias', () => {
    expect(shiftFormula('=A1*10', 2, 0)).toBe('=A1*10'.replace('A1', 'A3'));
    expect(shiftFormula('=A1+B1', 0, 1)).toBe('=B1+C1');
  });
});