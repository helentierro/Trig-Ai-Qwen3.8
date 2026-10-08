// src/utils/sheet.ts — motor Excel 2.0 vivo (ilimitado + formato + TSV + filas/cols)
// Sin dependencias: el parser propio (expr.ts) sigue siendo el único evaluador.
// Soporta: A..Z + AA..AZ (52 cols) x 200 filas iniciales con auto-crecimiento,
// $A$1 absolutos, texto, estadística ES/EN, CSV+TSV, variables vivas del lienzo.
import { evalExpr } from './expr';

function buildCols(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 26; i++) out.push(String.fromCharCode(65 + i));
  for (let i = 0; i < 26; i++) out.push('A' + String.fromCharCode(65 + i));
  return out;
}

export const COLS: readonly string[] = buildCols();
export const ROWS = 200;
export const MAX_COLS = 52;
export const MAX_ROWS = 1000;
export type Raw = Record<string, string>;
export interface GridResult {
  values: Record<string, number | null>;
  errors: Record<string, string>;
  texts: Record<string, string>;
}

export type CellFmt = {
  bold?: boolean; italic?: boolean; underline?: boolean;
  numFmt?: 'general' | 'numero' | 'moneda' | 'porciento';
  bg?: string;
};
export type FmtMap = Record<string, CellFmt>;

/** índice 0-based ← letra (A=0, Z=25, AA=26). -1 si inválida. */
export function colToIndex(c: string): number {
  const u = c.toUpperCase();
  if (/^[A-Z]$/.test(u)) return u.charCodeAt(0) - 65;
  if (/^A[A-Z]$/.test(u)) return 26 + (u.charCodeAt(1) - 65);
  return -1;
}
/** letra ← índice (clamp a 0..51). */
export function indexToCol(i: number): string {
  const n = Math.max(0, Math.min(MAX_COLS - 1, i));
  return COLS[n];
}
/** "B12" → {col:"B", row:12, ci:1} o null. Acepta $ y minúsculas. */
export function parseA1(id: string): { col: string; row: number; ci: number } | null {
  const m = /^\$?([A-Za-z]{1,2})\$?(\d+)$/.exec(id.trim());
  if (!m) return null;
  const col = m[1].toUpperCase();
  const ci = colToIndex(col);
  const row = +m[2];
  if (ci < 0 || row < 1 || row > MAX_ROWS) return null;
  return { col, row, ci };
}
export const a1 = (ci: number, row: number): string => `${indexToCol(ci)}${row}`;
const normCell = (c: string, r: number): string => `${c.toUpperCase()}${r}`;

// $AA$12 | $A1 | B$3 | c5  (1-2 letras)
const REF_RE = /(\$?)([A-Za-z]{1,2})(\$?)(\d+)/g;
const RANGE_RE = /([A-Za-z]+)\((\$?[A-Za-z]{1,2}\$?\d+):(\$?[A-Za-z]{1,2}\$?\d+)\)/g;

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
      const s = [...nums].sort((x, y) => x - y);
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
      const mean = nums.reduce((x, y) => x + y, 0) / nums.length;
      const variance = nums.reduce((x, y) => x + (y - mean) ** 2, 0) / (fn === 'stdev' ? nums.length - 1 : nums.length);
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
        if (!fn) return _m;
        const f = stripDollars(from), t = stripDollars(to);
        const mf = /^([A-Z]{1,2})(\d+)$/.exec(f), mt = /^([A-Z]{1,2})(\d+)$/.exec(t);
        if (!mf || !mt) return '(0/0)';
        const i1 = colToIndex(mf[1]), i2 = colToIndex(mt[1]);
        const r1 = +mf[2], r2 = +mt[2];
        if (i1 < 0 || i2 < 0) return '(0/0)';
        const vals: (number | null)[] = [];
        for (let ci = Math.min(i1, i2); ci <= Math.max(i1, i2); ci++) {
          for (let row = Math.min(r1, r2); row <= Math.max(r1, r2); row++) {
            if (row < 1 || row > MAX_ROWS) continue;
            vals.push(compute(normCell(indexToCol(ci), row), seen));
            if (vals.length > 5000) break;
          }
        }
        return aggregate(fn, vals);
      });
    expr = expr.replace(REF_RE, (_m, _d1: string, c: string, _d2: string, row: string) => {
      if (colToIndex(c) < 0) return _m; // no es celda (p.ej. sin, cos, theta) → deja al parser
      const v = compute(normCell(c, +row), seen);
      return v === null ? '0' : `(${v})`;
    });
    seen.delete(id);
    const v = evalExpr(expr, world);
    if (v === null) errors[id] = '#ERR';
    return (cache[id] = v);
  };

  const values: Record<string, number | null> = {};
  // Solo se materializan celdas con contenido + su vecindad: el grid virtual pide bajo demanda.
  // Para compatibilidad se exponen todas las usadas + A1 de referencia.
  const keys = Object.keys(raw);
  for (const k of keys) {
    const p = parseA1(k);
    if (!p) continue;
    values[k.toUpperCase()] = compute(k.toUpperCase(), new Set());
  }
  // Acceso perezoso: el componente lee values[id] ?? compute-on-demand via getCell().
  // Para no romper llamadas existentes (values[`${c}${r}`]), se devuelve un Proxy-like
  // materializando lo pedido en viewport mediante getValues().
  return { values, errors, texts };
}

/** Lectura puntual con caché compartida (para viewport virtual sin materializar 10k celdas). */
export function getCell(raw: Raw, world: Record<string, number>, id: string, memo: GridResult): number | null {
  const up = id.toUpperCase();
  if (up in memo.values) return memo.values[up];
  if (up in memo.texts || up in memo.errors) return null;
  const { values, errors, texts } = computeGrid({ ...raw, [up]: raw[up] ?? '' }, world);
  if (up in values) { memo.values[up] = values[up]; return values[up]; }
  if (errors[up]) memo.errors[up] = errors[up];
  if (texts[up]) memo.texts[up] = texts[up];
  return null;
}

/** Desplaza referencias al rellenar (↓ dRow, → dCol). Respeta $ absolutos. Soporta AA. */
export function shiftFormula(formula: string, dRow: number, dCol: number): string {
  return formula.replace(REF_RE, (_m, dc: string, c: string, dr: string, row: string) => {
    const ci = colToIndex(c);
    if (ci < 0) return _m;
    const nc = indexToCol(ci + (dc ? 0 : dCol));
    const nr = Math.max(1, Math.min(MAX_ROWS, +row + (dr ? 0 : dRow)));
    return `${dc}${nc}${dr}${nr}`;
  });
}

/** Cicla $A$1 → A$1 → $A1 → A1 sobre la primera referencia (F4 de Excel). */
export function cycleDollars(formula: string): string {
  let done = false;
  return formula.replace(REF_RE, (m, dc: string, c: string, dr: string, row: string) => {
    if (done || colToIndex(c) < 0) return m;
    done = true;
    if (dc && dr) return `${c}$${row}`;
    if (!dc && dr) return `$${c}${row}`;
    if (dc && !dr) return `${c}${row}`;
    return `$${c}$${row}`;
  });
}

/** Rango usado de una columna (primera..última fila con contenido). Null si vacía. */
export function usedRange(raw: Raw, col: string): { from: number; to: number } | null {
  let from = -1, to = -1;
  const u = col.toUpperCase();
  for (const k of Object.keys(raw)) {
    const p = parseA1(k);
    if (p && p.col === u && raw[k].trim() !== '') {
      if (from < 0) from = p.row;
      from = Math.min(from, p.row); to = Math.max(to === -1 ? p.row : to, p.row);
    }
  }
  return from < 0 ? null : { from, to };
}

/** Caja usada global {c1,r1,c2,r2} para Ctrl+End, autosuma y status. */
export function usedBounds(raw: Raw): { c1: number; r1: number; c2: number; r2: number } | null {
  let c1 = 1e9, r1 = 1e9, c2 = -1, r2 = -1;
  for (const k of Object.keys(raw)) {
    if (!raw[k] || !raw[k].trim()) continue;
    const p = parseA1(k);
    if (!p) continue;
    c1 = Math.min(c1, p.ci); r1 = Math.min(r1, p.row);
    c2 = Math.max(c2, p.ci); r2 = Math.max(r2, p.row);
  }
  return c2 < 0 ? null : { c1, r1, c2, r2 };
}

/** Tamaño visible = usado + margen (auto-crecimiento ilimitado hasta MAX). */
export function visibleSize(raw: Raw): { cols: number; rows: number } {
  const b = usedBounds(raw);
  const cols = Math.max(12, Math.min(MAX_COLS, (b ? b.c2 + 1 : 0) + 4));
  const rows = Math.max(40, Math.min(MAX_ROWS, (b ? b.r2 : 0) + 20));
  return { cols, rows };
}

// ─── Filas / columnas ──────────────────────────────────────
function shiftKeysForInsert(raw: Raw, axis: 'row' | 'col', at: number, delta: number): Raw {
  const next: Raw = {};
  for (const [k, v] of Object.entries(raw)) {
    const p = parseA1(k);
    if (!p) { next[k] = v; continue; }
    if (axis === 'row' && p.row >= at) {
      const nr = p.row + delta;
      if (nr >= 1 && nr <= MAX_ROWS) next[`${p.col}${nr}`] = shiftRefs(v, axis, at, delta);
    } else if (axis === 'col' && p.ci >= at) {
      const nc = p.ci + delta;
      if (nc >= 0 && nc < MAX_COLS) next[`${indexToCol(nc)}${p.row}`] = shiftRefs(v, axis, at, delta);
    } else {
      next[k.toUpperCase()] = shiftRefs(v, axis, at, delta);
    }
  }
  return next;
}
function shiftRefs(formula: string, axis: 'row' | 'col', at: number, delta: number): string {
  if (!formula.startsWith('=')) return formula;
  return formula.replace(REF_RE, (m, dc: string, c: string, dr: string, row: string) => {
    const ci = colToIndex(c);
    if (ci < 0) return m;
    if (axis === 'row' && !dr) {
      const r = +row;
      if ((delta > 0 && r >= at) || (delta < 0 && r > at)) return `${dc}${c.toUpperCase()}${dr}${r + delta}`;
    }
    if (axis === 'col' && !dc) {
      if ((delta > 0 && ci >= at) || (delta < 0 && ci > at)) return `${dc}${indexToCol(ci + delta)}${dr}${row}`;
    }
    return m;
  });
}
export const insertRow = (raw: Raw, at: number): Raw => shiftKeysForInsert(raw, 'row', at, 1);
export const deleteRow = (raw: Raw, at: number): Raw => {
  const next: Raw = {};
  for (const [k, v] of Object.entries(raw)) {
    const p = parseA1(k);
    if (p && p.row === at) continue;
    next[k] = v;
  }
  return shiftKeysForInsert(next, 'row', at, -1);
};
export const insertCol = (raw: Raw, atCi: number): Raw => shiftKeysForInsert(raw, 'col', atCi, 1);
export const deleteCol = (raw: Raw, atCi: number): Raw => {
  const next: Raw = {};
  for (const [k, v] of Object.entries(raw)) {
    const p = parseA1(k);
    if (p && p.ci === atCi) continue;
    next[k] = v;
  }
  return shiftKeysForInsert(next, 'col', atCi, -1);
};

// ─── Buscar / reemplazar ───────────────────────────────────
export function findCells(raw: Raw, q: string, memo: GridResult): string[] {
  const needle = q.toLowerCase();
  if (!needle) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(raw)) {
    const p = parseA1(k);
    if (!p) continue;
    const disp = String(memo.values[k.toUpperCase()] ?? memo.texts[k.toUpperCase()] ?? v).toLowerCase();
    if (v.toLowerCase().includes(needle) || disp.includes(needle)) out.push(k.toUpperCase());
  }
  return out.slice(0, 200);
}
export function replaceAll(raw: Raw, q: string, rep: string): Raw {
  if (!q) return raw;
  const next: Raw = { ...raw };
  for (const k of Object.keys(next)) {
    if (next[k].includes(q)) next[k] = next[k].split(q).join(rep);
  }
  return next;
}

// ─── Formato numérico ──────────────────────────────────────
export function formatValue(v: number, fmt?: CellFmt['numFmt']): string {
  if (!isFinite(v)) return '—';
  switch (fmt) {
    case 'moneda': return `$${v.toLocaleString('es-MX', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
    case 'porciento': return `${(v * 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })}%`;
    case 'numero': return v.toLocaleString('es-MX', { maximumFractionDigits: 2 });
    default:
      if (Math.abs(v) >= 1_000_000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(3);
      return String(Number(v.toFixed(4)));
  }
}

// ─── CSV / TSV (portapapeles interoperable con Excel real) ──
function csvQuote(cell: string): string {
  return /[",\n\r\t]|^\s|\s$/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function exportCsv(raw: Raw): string {
  const b = usedBounds(raw);
  if (!b) return '';
  const lines: string[] = [];
  for (let r = b.r1; r <= b.r2; r++) {
    const row: string[] = [];
    for (let ci = b.c1; ci <= b.c2; ci++) row.push(csvQuote(raw[`${indexToCol(ci)}${r}`] ?? ''));
    lines.push(row.join(','));
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
    if (ri >= MAX_ROWS) return;
    if (cells.length === 1 && cells[0] === '') return;
    cells.forEach((v, ci) => {
      if (ci >= MAX_COLS) return;
      if (v !== '') raw[`${indexToCol(ci)}${ri + 1}`] = v;
    });
  });
  return raw;
}

/** Rango → TSV (Ctrl+C). values/texts ya resueltos por el llamador. */
export function rangeToTsv(raw: Raw, c1: number, r1: number, c2: number, r2: number): string {
  const lines: string[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    const cells: string[] = [];
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      cells.push(raw[`${indexToCol(c)}${r}`] ?? '');
    }
    lines.push(cells.join('\t'));
  }
  return lines.join('\n');
}

/** TSV → raw a partir de ancla (Ctrl+V). Respeta $ al pegar fórmulas (las desplaza). */
export function pasteTsv(raw: Raw, anchorCi: number, anchorRow: number, tsv: string): Raw {
  const next = { ...raw };
  const rows = tsv.replace(/\r\n?/g, '\n').split('\n');
  rows.forEach((line, dr) => {
    const cells = line.split('\t');
    cells.forEach((v, dc) => {
      const ci = anchorCi + dc, r = anchorRow + dr;
      if (ci < 0 || ci >= MAX_COLS || r < 1 || r > MAX_ROWS) return;
      next[`${indexToCol(ci)}${r}`] = v.startsWith('=') && (dr !== 0 || dc !== 0)
        ? shiftFormula(v, dr, dc)
        : v;
    });
  });
  return next;
}
