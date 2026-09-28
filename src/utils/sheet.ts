// src/utils/sheet.ts — motor mini-Excel AVANZADO (Fase 3: hoja viva)
// Referencias absolutas $A$1 · texto en celdas · estadística (suma/media/mediana/moda/
// desv/contar/producto + alias en español) · CSV · variables del mundo (lienzo→hoja).
// Sin dependencias: el parser propio (expr.ts) sigue siendo el único evaluador.
import { evalExpr } from './expr';

export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const ROWS = 30;
export type Raw = Record<string, string>;
export interface GridResult {
  values: Record<string, number | null>;
  errors: Record<string, string>;
  texts: Record<string, string>;
}

type ColId = (typeof COLS)[number];
const colIndex = (c: string): number => COLS.indexOf(c.toUpperCase() as ColId);
const normCell = (c: string, r: number): string => `${c.toUpperCase()}${r}`;

// $A$1 | $A1 | A$1 | A1
const REF_RE = /(\$?)([A-Ja-j])(\$?)(\d+)/g;
const RANGE_RE = /([A-Za-z]+)\((\$?[A-Ja-j]\$?\d+):(\$?[A-Ja-j]\$?\d+)\)/g;

/** Nombre canónico ← alias en inglés/español (el motor minusculiza todo). */
const FN_ALIAS: Record<string, string> = {
  sum: 'sum', suma: 'sum',
  avg: 'avg', media: 'avg', promedio: 'avg',
  median: 'median', mediana: 'median',
  mode: 'mode', moda: 'mode',
  min: 'min', minimo: 'min',
  max: 'max', maximo: 'max',
  stdev: 'stdev', desv: 'stdev', desvest: 'stdev', desviacion: 'stdev',
  stdevp: 'stdevp', desvestp: 'stdevp',
  count: 'count', contar: 'count', cuenta: 'count',
  product: 'product', producto: 'product',
};

const stripDollars = (ref: string): string => ref.replace(/\$/g, '').toUpperCase();

function aggregate(fn: string, vals: (number | null)[]): string {
  const nums = vals.filter((v): v is number => v !== null);
  switch (fn) {
    case 'sum': return `(${(vals.map((v) => v ?? 0)).join('+') || '0'})`;
    case 'avg': return vals.length ? `((${(vals.map((v) => v ?? 0)).join('+')})/${vals.length})` : '(0/0)';
    case 'min': return nums.length ? `Math.min(${nums.join(',')})` : '(0/0)';
    case 'max': return nums.length ? `Math.max(${nums.join(',')})` : '(0/0)';
    case 'count': return `${nums.length}`;
    case 'product': return nums.length ? `(${(nums.map((v) => `(${v})`)).join('*')})` : '(0/0)';
    case 'median': {
      if (!nums.length) return '(0/0)';
      const s = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return `(${s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2})`;
    }
    case 'mode': {
      if (!nums.length) return '(0/0)';
      const freq = new Map<number, number>();
      for (const v of nums) freq.set(v, (freq.get(v) ?? 0) + 1);
      let best = nums[0], bestN = 0;
      for (const [v, n] of freq) if (n > bestN) { best = v; bestN = n; }
      return `(${best})`;
    }
    case 'stdev':
    case 'stdevp': {
      if (nums.length < (fn === 'stdev' ? 2 : 1)) return '(0/0)';
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (fn === 'stdev' ? nums.length - 1 : nums.length);
      return `(${Math.sqrt(variance)})`;
    }
    default: return '(0/0)';
  }
}

/** Calcula la grilla. `world` son variables vivas del lienzo (o_x, theta, base…). */
export function computeGrid(raw: Raw, world: Record<string, number> = {}): GridResult {
  const cache: Record<string, number | null> = {};
  const errors: Record<string, string> = {};
  const texts: Record<string, string> = {};

  const compute = (id: string, seen: Set<string>): number | null => {
    if (id in cache) return cache[id];
    const r = raw[id];
    if (r === undefined || r.trim() === '') return (cache[id] = null);
    if (!r.startsWith('=')) {
      const n = Number(r.replace(',', '.'));
      if (isFinite(n)) return (cache[id] = n);
      texts[id] = r; // texto: se muestra, vale 0 al referenciar
      return (cache[id] = null);
    }
    if (seen.has(id)) { errors[id] = '#CICLO'; return null; }
    seen.add(id);
    let expr = r.slice(1);
    expr = expr.replace(RANGE_RE,
      (_m, fnRaw: string, from: string, to: string) => {
        const fn = FN_ALIAS[String(fnRaw).toLowerCase()];
        if (!fn) return _m; // función desconocida → #ERR abajo
        const [c1, r1] = [stripDollars(from).replace(/\d+/, ''), +(stripDollars(from).replace(/[A-Z]+/, ''))];
        const [c2, r2] = [stripDollars(to).replace(/\d+/, ''), +(stripDollars(to).replace(/[A-Z]+/, ''))];
        const vals: (number | null)[] = [];
        const i1 = colIndex(c1), i2 = colIndex(c2);
        if (i1 < 0 || i2 < 0) return '(0/0)';
        for (let ci = Math.min(i1, i2); ci <= Math.max(i1, i2); ci++) {
          for (let row = Math.min(r1, r2); row <= Math.max(r1, r2); row++) {
            if (row < 1 || row > ROWS) continue;
            vals.push(compute(normCell(COLS[ci], row), seen));
          }
        }
        return aggregate(fn, vals);
      });
    expr = expr.replace(REF_RE, (_m, _d1: string, c: string, _d2: string, row: string) => {
      const v = compute(normCell(c, +row), seen);
      return v === null ? '0' : `(${v})`;
    });
    seen.delete(id);
    const v = evalExpr(expr, world);
    if (v === null) errors[id] = '#ERR';
    return (cache[id] = v);
  };

  const values: Record<string, number | null> = {};
  for (const c of COLS) for (let i = 1; i <= ROWS; i++) values[`${c}${i}`] = compute(`${c}${i}`, new Set());
  return { values, errors, texts };
}

/** Desplaza referencias al rellenar (↓ dRow, → dCol). Respeta $ absolutos. */
export function shiftFormula(formula: string, dRow: number, dCol: number): string {
  return formula.replace(REF_RE, (_m, dc: string, c: string, dr: string, row: string) => {
    const ci = colIndex(c);
    const nc = COLS[Math.max(0, Math.min(COLS.length - 1, ci + (dc ? 0 : dCol)))];
    const nr = Math.max(1, Math.min(ROWS, +row + (dr ? 0 : dRow)));
    return `${dc}${nc}${dr}${nr}`;
  });
}

/** Rango usado de una columna (primera..última fila con contenido). Null si vacía. */
export function usedRange(raw: Raw, col: string): { from: number; to: number } | null {
  let from = -1, to = -1;
  for (let r = 1; r <= ROWS; r++) {
    const v = raw[`${col.toUpperCase()}${r}`];
    if (v !== undefined && v.trim() !== '') { if (from < 0) from = r; to = r; }
  }
  return from < 0 ? null : { from, to };
}

// ─── CSV (sin dependencias) ──────────────────────────────────

function csvQuote(cell: string): string {
  return /[",\n\r]|^\s|\s$/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function exportCsv(raw: Raw): string {
  let lastRow = 0;
  for (let r = 1; r <= ROWS; r++) {
    for (const c of COLS) {
      const v = raw[`${c}${r}`];
      if (v !== undefined && v !== '') { lastRow = r; break; }
    }
  }
  const lines: string[] = [];
  for (let r = 1; r <= lastRow; r++) {
    lines.push(COLS.map((c) => csvQuote(raw[`${c}${r}`] ?? '')).join(','));
  }
  return lines.join('\n');
}

export function importCsv(text: string): Raw {
  const raw: Raw = {};
  const rows: string[][] = [];
  let cur = '', row: string[] = [], inQ = false;
  const pushCell = () => { row.push(cur); cur = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  const s = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') pushCell();
    else if (ch === '\n') { pushCell(); pushRow(); }
    else cur += ch;
  }
  pushCell(); pushRow();
  rows.forEach((cells, ri) => {
    if (ri >= ROWS) return;
    if (cells.length === 1 && cells[0] === '') return;
    cells.forEach((v, ci) => {
      if (ci >= COLS.length) return;
      if (v !== '') raw[`${COLS[ci]}${ri + 1}`] = v;
    });
  });
  return raw;
}
