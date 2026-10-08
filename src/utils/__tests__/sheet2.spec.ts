// src/utils/__tests__/sheet2.spec.ts — Fase 3: hoja avanzada (refs $, texto, estadística, CSV, mundo).
import { describe, expect, it } from 'vitest';
import { computeGrid, exportCsv, importCsv, shiftFormula, usedRange } from '../sheet';

describe('referencias absolutas', () => {
  it('$A$1 no se mueve al rellenar', () => {
    expect(shiftFormula('=$A$1*10', 2, 3)).toBe('=$A$1*10');
    expect(shiftFormula('=$A1*10', 2, 1)).toBe('=$A3*10');
    expect(shiftFormula('=A$1*10', 2, 1)).toBe('=B$1*10');
  });
  it('$A$1 calcula igual que A1', () => {
    const { values } = computeGrid({ A1: '7', B1: '=$A$1*2' });
    expect(values.B1).toBe(14);
  });
});

describe('texto en celdas', () => {
  it('el texto se muestra y vale 0 al referenciar', () => {
    const { values, texts, errors } = computeGrid({ A1: 'hola mundo', B1: '=A1*2' });
    expect(texts.A1).toBe('hola mundo');
    expect(values.B1).toBe(0);
    expect(errors.A1).toBeUndefined();
  });
});

describe('estadística y alias en español', () => {
  const data = { A1: '4', A2: '2', A3: '4', A4: '8' };
  it('mediana/moda/stdev/count/product', () => {
    const { values } = computeGrid({
      ...data, B1: '=median(A1:A4)', B2: '=mode(A1:A4)',
      B3: '=stdev(A1:A4)', B4: '=count(A1:A4)', B5: '=product(A1:A4)',
    });
    expect(values.B1).toBe(4);
    expect(values.B2).toBe(4);
    expect(values.B3).toBeCloseTo(2.51661, 4);
    expect(values.B4).toBe(4);
    expect(values.B5).toBe(256);
  });
  it('alias: suma/media/mediana/minimo/maximo/desv/contar/producto', () => {
    const { values } = computeGrid({
      ...data, C1: '=suma(A1:A4)', C2: '=media(A1:A4)', C3: '=mediana(A1:A4)',
      C4: '=minimo(A1:A4)', C5: '=maximo(A1:A4)', C6: '=desv(A1:A4)',
      C7: '=contar(A1:A4)', C8: '=producto(A1:A4)',
    });
    expect(values.C1).toBe(18);
    expect(values.C2).toBeCloseTo(4.5, 9);
    expect(values.C3).toBe(4);
    expect(values.C4).toBe(2);
    expect(values.C5).toBe(8);
    expect(values.C6).toBeCloseTo(2.51661, 4);
    expect(values.C7).toBe(4);
    expect(values.C8).toBe(256);
  });
  it('estadística sin datos → #ERR honesto', () => {
    const { errors } = computeGrid({ B1: '=mediana(Z1:Z3)' });
    expect(errors.B1).toBe('#ERR');
  });
});

describe('variables del mundo (lienzo→hoja)', () => {
  it('=theta*2 y =o_x leen la figura en vivo', () => {
    const world = { theta: 30, o_x: 5, base: 50 };
    const { values } = computeGrid({ A1: '=theta*2', A2: '=o_x+base' }, world);
    expect(values.A1).toBe(60);
    expect(values.A2).toBe(55);
  });
});

describe('CSV ida y vuelta', () => {
  it('exporta solo hasta la última fila usada y cita comas/comillas', () => {
    const csv = exportCsv({ A1: '1', B1: 'hola, mundo', C1: 'dice "hi"', A3: 'x' });
    // Excel 2.0: recorta columnas vacías al final (interoperable con Excel real)
    expect(csv).toBe('1,"hola, mundo","dice ""hi"""\n,,\nx,,');
  });
  it('importa respetando citas y límites de la grilla', () => {
    const raw = importCsv('1,"a,b"\n=c1*2,');
    expect(raw.A1).toBe('1');
    expect(raw.B1).toBe('a,b');
    expect(raw.A2).toBe('=c1*2');
    expect(raw.B2).toBeUndefined();
  });
  it('usado de columna para plantillas Σ', () => {
    expect(usedRange({ B2: '1', B5: '2' }, 'B')).toEqual({ from: 2, to: 5 });
    expect(usedRange({}, 'B')).toBeNull();
  });
});
