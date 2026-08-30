// src/utils/sheet.ts — motor mini-Excel: referencias, rangos, ciclos, relleno
import { evalExpr } from './expr';

export const COLS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const ROWS = 20;
export type Raw = Record<string, string>;
export interface GridResult {
  values: Record<string, number | null>;
  errors: Record<string, string>;
}

const REF_RE = /([A-F])(\d+)/g;

function expandRange(fn: string, c1: string, r1: number, c2: string, r2: number, get: (id: string) => number | null): string {
  const vals: number[] = [];
  const i1 = COLS.indexOf(c1.toUpperCase() as typeof COLS[number]);
  const i2 = COLS.indexOf(c2.toUpperCase() as typeof COLS[number]);
  for (let ci = Math.min(i1, i2); ci <= Math.max(i1, i2); ci++) {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      const v = get(`${COLS[ci]}${r}`);
      vals.push(v ?? 0);
    }
  }
  if (!vals.length) return '0';
  if (fn === 'sum') return `(${vals.join('+')})`;
  if (fn === 'avg') return `((${vals.join('+')})/${vals.length})`;
  if (fn === 'min') return `Math.min(${vals.join(',')})`;
  return `Math.max(${vals.join(',')})`;
}

export function computeGrid(raw: Raw): GridResult {
  const cache: Record<string, number | null> = {};
  const errors: Record<string, string> = {};

  const compute = (id: string, seen: Set<string>): number | null => {
    if (id in cache) return cache[id];
    const r = raw[id];
    if (r === undefined || r.trim() === '') return (cache[id] = null);
    if (!r.startsWith('=')) {
      const n = Number(r.replace(',', '.'));
      return (cache[id] = isFinite(n) ? n : (errors[id] = '#ERR', null));
    }
    if (seen.has(id)) { errors[id] = '#CICLO'; return null; }
    seen.add(id);
    let expr = r.slice(1);
    expr = expr.replace(/(sum|avg|min|max)\(([A-F])(\d+):([A-F])(\d+)\)/gi,
      (_m, fn: string, c1: string, r1: string, c2: string, r2: string) =>
        expandRange(fn.toLowerCase(), c1, +r1, c2, +r2, (ref) => compute(ref, seen)));
    expr = expr.replace(REF_RE, (_m, c: string, row: string) => {
      const v = compute(`${c.toUpperCase()}${row}`, seen);
      return v === null ? '0' : `(${v})`;
    });
    seen.delete(id);
    const v = evalExpr(expr);
    if (v === null) errors[id] = '#ERR';
    return (cache[id] = v);
  };

  const values: Record<string, number | null> = {};
  for (const c of COLS) for (let i = 1; i <= ROWS; i++) values[`${c}${i}`] = compute(`${c}${i}`, new Set());
  return { values, errors };
}

/** Desplaza referencias al rellenar (↓ dRow, → dCol). */
export function shiftFormula(formula: string, dRow: number, dCol: number): string {
  return formula.replace(REF_RE, (_m, c: string, row: string) => {
    const ci = COLS.indexOf(c.toUpperCase() as typeof COLS[number]);
    const nc = COLS[Math.max(0, Math.min(COLS.length - 1, ci + dCol))];
    const nr = Math.max(1, Math.min(ROWS, +row + dRow));
    return `${nc}${nr}`;
  });
}