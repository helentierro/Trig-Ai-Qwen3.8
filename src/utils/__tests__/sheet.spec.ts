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
  // Paso 3 (PROBE_RESULT=OK 50/50 en sandbox node:20-slim): blindaje validado de forma aislada.
  it('división por cero y dominios inválidos → null seguro', () => {
    expect(evalExpr('1/0')).toBeNull();
    expect(evalExpr('0/0')).toBeNull();
    expect(evalExpr('5%0')).toBeNull();
    expect(evalExpr('sqrt(-1)')).toBeNull();
    expect(evalExpr('log(0)')).toBeNull();
    expect(evalExpr('log(-5)')).toBeNull();
    expect(evalExpr('10^400')).toBeNull();
  });
  it('texto inválido y sintaxis rota → null', () => {
    expect(evalExpr('')).toBeNull();
    expect(evalExpr('   ')).toBeNull();
    expect(evalExpr('2+')).toBeNull();
    expect(evalExpr('(2+3')).toBeNull();
    expect(evalExpr('2..3')).toBeNull();
    expect(evalExpr('hola')).toBeNull();
    expect(evalExpr('sin()')).toBeNull();
    expect(evalExpr('sin(1,2)')).toBeNull();
    expect(evalExpr('min()')).toBeNull();
  });
  it('expresiones maliciosas no se ejecutan → null', () => {
    for (const evil of [
      'process.exit(1)',
      "require('fs')",
      'globalThis',
      'constructor',
      '__proto__',
      '__proto__+1',
      "eval('2+2')",
      'console.log(1)',
      '1;2',
      'a=1',
      "fetch('http://x')",
      'while(true){}',
      '2+2; rm -rf /',
      '${7*7}',
      '`test`',
    ]) {
      expect(evalExpr(evil)).toBeNull();
    }
    expect((globalThis as Record<string, unknown>).pwned).toBeUndefined();
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