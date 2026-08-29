// src/components/panel/Spreadsheet.tsx
import { useMemo, useState } from 'react';
import { evalExpr, fmtN } from '../../utils/expr';
import { usePal } from '../../stores/themeStore';

const COLS = ['A', 'B', 'C', 'D'] as const;
const ROWS = 12;
type CellId = string; // "A1"

export function Spreadsheet() {
  const pal = usePal();
  const [raw, setRaw] = useState<Record<CellId, string>>({ A1: '1', A2: '2', B1: '=A1*10', B2: '=A2*10' });
  const [sel, setSel] = useState<CellId | null>(null);
  const [fill, setFill] = useState<{ col: string; from: number; to: number } | null>(null);

  const values = useMemo(() => {
    const cache: Record<CellId, number | null> = {};
    const compute = (id: CellId, seen: Set<CellId>): number | null => {
      if (id in cache) return cache[id];
      const r = raw[id];
      if (r === undefined || r === '') return (cache[id] = null);
      if (!r.startsWith('=')) {
        const n = Number(r.replace(',', '.'));
        return (cache[id] = isFinite(n) ? n : null);
      }
      if (seen.has(id)) return null; // ciclo
      seen.add(id);
      const expr = r.slice(1).replace(/([a-dA-D])(\d+)/g, (_m, c: string, row: string) => {
        const v = compute(`${c.toUpperCase()}${row}`, seen);
        return v === null ? '0' : `(${v})`;
      });
      const v = evalExpr(expr);
      seen.delete(id);
      return (cache[id] = v);
    };
    const out: Record<CellId, number | null> = {};
    for (const c of COLS) for (let i = 1; i <= ROWS; i++) out[`${c}${i}`] = compute(`${c}${i}`, new Set());
    return out;
  }, [raw]);

  const shiftFormula = (formula: string, dRow: number) =>
    formula.replace(/([a-dA-D])(\d+)/g, (_m, c, row) => `${c.toUpperCase()}${Math.max(1, Math.min(ROWS, +row + dRow))}`);

  const applyFill = () => {
    if (!fill || fill.to === fill.from) { setFill(null); return; }
    const src = `${fill.col}${fill.from}`;
    const formula = raw[src];
    if (formula && formula.startsWith('=')) {
      const next = { ...raw };
      const lo = Math.min(fill.from, fill.to), hi = Math.max(fill.from, fill.to);
      for (let i = lo; i <= hi; i++) if (i !== fill.from) next[`${fill.col}${i}`] = shiftFormula(formula, i - fill.from);
      setRaw(next);
    }
    setFill(null);
  };

  const cellStyle = (id: CellId): React.CSSProperties => ({
    width: '25%', padding: '5px 6px', fontFamily: 'monospace', fontSize: 11.5,
    border: `1px solid ${pal.border}`, background: sel === id ? 'rgba(124,58,237,.12)' : pal.panelBg,
    color: pal.bubbleText, position: 'relative',
  });

  return (
    <div style={{ padding: 10 }} onMouseUp={applyFill}>
      <div style={{ color: pal.faint, fontSize: 10.5, lineHeight: 1.5, marginBottom: 8 }}>
        Fórmulas con <code>=</code> (ej: <code>=A1*10</code>, <code>=A1+A2</code>).
        Selecciona una celda con fórmula y <b>arrastra el cuadrito morado ▾ hacia abajo</b>: la fórmula se aplica a todas, estilo Excel.
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{COLS.map((c) => (
            <th key={c} style={{ padding: 4, fontSize: 10, color: pal.faint, border: `1px solid ${pal.border}`, background: pal.card }}>{c}</th>
          ))}</tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => (
            <tr key={row}>
              {COLS.map((col) => {
                const id = `${col}${row}`;
                const v = values[id];
                const isFormula = raw[id]?.startsWith('=');
                const showHandle = sel === id && isFormula;
                return (
                  <td key={id} style={cellStyle(id)}
                    onClick={() => setSel(id)}
                    onMouseEnter={() => { if (fill) setFill({ ...fill, to: row }); }}
                    onDoubleClick={() => {
                      const next = prompt(`Editar ${id}:`, raw[id] ?? '');
                      if (next !== null) setRaw({ ...raw, [id]: next });
                    }}>
                    {sel === id
                      ? <input autoFocus value={raw[id] ?? ''} onChange={(e) => setRaw({ ...raw, [id]: e.target.value })}
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: `1px solid ${pal.accent}`, color: pal.bubbleText, fontFamily: 'monospace', fontSize: 11.5, padding: 0 }} />
                      : <span style={{ color: isFormula ? pal.accent : pal.bubbleText }}>{v === null ? '' : fmtN(v)}</span>}
                    {showHandle && (
                      <span
                        onMouseDown={(e) => { e.stopPropagation(); setFill({ col, from: row, to: row }); }}
                        title="Arrastra hacia abajo para rellenar"
                        style={{ position: 'absolute', right: 1, bottom: 1, width: 8, height: 8, background: '#7c3aed', borderRadius: 2, cursor: 'crosshair' }} />
                    )}
                    {fill && fill.col === col && row >= Math.min(fill.from, fill.to) && row <= Math.max(fill.from, fill.to) && (
                      <span style={{ position: 'absolute', inset: 0, border: '1px dashed #7c3aed', pointerEvents: 'none' }} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}