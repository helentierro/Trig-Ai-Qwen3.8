// src/utils/expr.ts — matemática con whitelist: el usuario escribe, el sandbox evalúa.
const FUNCS: Record<string, (v: number) => number> = {
  sin: (d) => Math.sin((d * Math.PI) / 180),
  cos: (d) => Math.cos((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  asin: (v) => (Math.asin(v) * 180) / Math.PI,
  acos: (v) => (Math.acos(v) * 180) / Math.PI,
  atan: (v) => (Math.atan(v) * 180) / Math.PI,
  sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, log: Math.log10, ln: Math.log,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export function evalExpr(src: string, vars: Record<string, number> = {}): number | null {
  let s = src.toLowerCase().replace(/\s+/g, '').replace(/\^/g, '**').replace(/×/g, '*').replace(/÷/g, '/');
  if (!s) return null;
  if (!/^[0-9a-z+\-*/().,**]*$/.test(s)) return null;
  const ids = s.match(/[a-z]+/g) || [];
  for (const id of ids) {
    if (!(id in FUNCS) && !(id in CONSTS) && !(id in vars)) return null;
  }
  try {
    const fn = new Function(
      ...Object.keys(FUNCS), ...Object.keys(CONSTS), ...Object.keys(vars),
      `"use strict"; return (${s});`,
    );
    const val = fn(...Object.values(FUNCS), ...Object.values(CONSTS), ...Object.values(vars));
    return typeof val === 'number' && isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

export const fmtN = (n: number): string => {
  if (Math.abs(n) >= 1_000_000 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(3);
  return String(Number(n.toFixed(4)));
};