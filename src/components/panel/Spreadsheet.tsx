// src/components/panel/Spreadsheet.tsx — Fase H: mini-Excel completo
import { useMemo, useState } from 'react';
import { COLS, ROWS, computeGrid, shiftFormula, type Raw } from '../../utils/sheet';
import { fmtN } from '../../utils/expr';
import { usePal } from '../../stores/themeStore';
import { SectionTitle, TextInput } from '../ui/primitives';

export function Spreadsheet() {
  const pal = usePal();
  const [raw, setRaw] = useState<Raw>({ A1: '1', A2: '2', A3: '=A1+A2', B1: '=A1*10', B2: '=A2*10', C1: '=sum(A1:A3)' });
  const [sel, setSel] = useState<string>('A1');
  const [fill, setFill] = useState<{ from: string; to: string } | null>(null);

  const { values, errors } = useMemo(() => computeGrid(raw), [raw]);

  const setCell = (id: string, v: string) => setRaw({ ...raw, [id]: v });

  const applyFill = () => {
    if (!fill || fill.to === fill.from) { setFill(null); return; }
    const src = raw[fill.from];
    if (src?.startsWith('=')) {
      const c1 = fill.from[0], r1 = +fill.from.slice(1);
      const c2 = fill.to[0], r2 = +fill.to.slice(1);
      const next = { ...raw };
      const ci1 = COLS.indexOf(c1 as typeof COLS[number]), ci2 = COLS.indexOf(c2 as typeof COLS[number]);
      for (let ci = Math.min(ci1, ci2); ci <= Math.max(ci1, ci2); ci++) {
        for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
          const id = `${COLS[ci]}${r}`;
          if (id !== fill.from) next[id] = shiftFormula(src, r - r1, ci - ci1);
        }
      }
      setRaw(next);
    }
    setFill(null);
  };

  const inFill = (id: string) => {
    if (!fill) return false;
    const c1 = fill.from[0], r1 = +fill.from.slice(1), c2 = fill.to[0], r2 = +fill.to.slice(1);
    const ci = COLS.indexOf(id[0] as typeof COLS[number]);
    return ci >= Math.min(COLS.indexOf(c1 as typeof COLS[number]), COLS.indexOf(c2 as typeof COLS[number]))
      && ci <= Math.max(COLS.indexOf(c1 as typeof COLS[number]), COLS.indexOf(c2 as typeof COLS[number]))
      && +id.slice(1) >= Math.min(r1, r2) && +id.slice(1) <= Math.max(r1, r2);
  };

  return (
    <div style={{ padding: 10 }} onMouseUp={applyFill}>
      <SectionTitle>Barra de fórmulas</SectionTitle>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: pal.accent, width: 30 }}>{sel}</span>
        <TextInput value={raw[sel] ?? ''} onChange={(v) => setCell(sel, v)} placeholder="ej: =A1*10 · =sum(A1:A5)" />
      </div>
      <div style={{ color: pal.faint, fontSize: 10.5, lineHeight: 1.6, marginBottom: 8 }}>
        Fórmulas con <code>=</code> · funciones: <code>sum avg min max</code> con rangos (A1:A5) ·
        operadores + - * / ^ · sin cos tan sqrt abs · Arrastra el <b style={{ color: '#7c3aed' }}>▾ morado</b> hacia
        abajo o la derecha: relleno estilo Excel sin copiar-pegar.
      </div>
      <div style={{ maxHeight: 380, overflow: 'auto', border: `1px solid ${pal.border}`, borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11.5, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: 4, border: `1px solid ${pal.border}`, background: pal.card, color: pal.faint, fontSize: 10 }}></th>
              {COLS.map((c) => (
                <th key={c} style={{ padding: 4, border: `1px solid ${pal.border}`, background: pal.card, color: pal.faint, fontSize: 10, minWidth: 64 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => (
              <tr key={row}>
                <td style={{ padding: 4, border: `1px solid ${pal.border}`, background: pal.card, color: pal.faint, fontSize: 10, textAlign: 'center' }}>{row}</td>
                {COLS.map((col) => {
                  const id = `${col}${row}`;
                  const v = values[id];
                  const err = errors[id];
                  const isFormula = raw[id]?.startsWith('=');
                  return (
                    <td key={id}
                      onClick={() => setSel(id)}
                      onMouseEnter={() => { if (fill) setFill({ ...fill, to: id }); }}
                      style={{
                        padding: '4px 6px', border: `1px solid ${pal.border}`, position: 'relative', cursor: 'cell',
                        background: sel === id ? 'rgba(124,58,237,.14)' : inFill(id) ? 'rgba(124,58,237,.07)' : pal.panelBg,
                        color: err ? '#f87171' : isFormula ? pal.accent : pal.bubbleText,
                        outline: sel === id ? '1px solid #7c3aed' : 'none',
                      }}>
                      {v === null ? (raw[id] && !isFormula ? raw[id] : err ?? '') : fmtN(v)}
                      {sel === id && isFormula && !err && (
                        <span onMouseDown={(e) => { e.stopPropagation(); setFill({ from: id, to: id }); }}
                          title="Rellenar (arrastra ↓ o →)"
                          style={{ position: 'absolute', right: 1, bottom: 1, width: 8, height: 8, background: '#7c3aed', borderRadius: 2, cursor: 'crosshair' }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}