// src/components/panel/TableTab.tsx
import { useMemo, useState } from 'react';
import { evalExpr, fmtN } from '../../utils/expr';
import { usePal } from '../../stores/themeStore';

const inp = (pal: ReturnType<typeof usePal>): React.CSSProperties => ({
  background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 6,
  color: pal.bubbleText, fontSize: 12, fontFamily: 'monospace', padding: '5px 8px', outline: 'none', width: '100%',
});

export function TableTab() {
  const pal = usePal();
  const [calc, setCalc] = useState('sin(45) * 10');
  const [fx, setFx] = useState('tan(x)');
  const [from, setFrom] = useState('0');
  const [to, setTo] = useState('80');
  const [step, setStep] = useState('10');

  const calcRes = useMemo(() => evalExpr(calc), [calc]);
  const rows = useMemo(() => {
    const a = evalExpr(from) ?? 0, b = evalExpr(to) ?? 10, h = Math.abs(evalExpr(step) ?? 1) || 1;
    const out: { x: number; y: number | null }[] = [];
    for (let x = a; x <= b + 1e-9 && out.length < 200; x += h) {
      out.push({ x, y: evalExpr(fx, { x }) });
    }
    return out;
  }, [fx, from, to, step]);

  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Calculadora</div>
      <input value={calc} onChange={(e) => setCalc(e.target.value)} style={inp(pal)} placeholder="ej: sin(45) * 10" />
      <div style={{ fontFamily: 'monospace', fontSize: 15, color: calcRes === null ? pal.faint : pal.accent, padding: '2px 4px' }}>
        = {calcRes === null ? '…' : fmtN(calcRes)}
      </div>
      <div style={{ color: pal.faint, fontSize: 10.5, lineHeight: 1.5 }}>
        Funciones: sin cos tan (grados) · asin acos atan · sqrt abs round log ln · constantes: pi, e · operador ^
      </div>

      <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6 }}>Tabla de f(x)</div>
      <input value={fx} onChange={(e) => setFx(e.target.value)} style={inp(pal)} placeholder="f(x) = ej: tan(x)" />
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={from} onChange={(e) => setFrom(e.target.value)} style={inp(pal)} title="desde" />
        <input value={to} onChange={(e) => setTo(e.target.value)} style={inp(pal)} title="hasta" />
        <input value={step} onChange={(e) => setStep(e.target.value)} style={{ ...inp(pal), width: 56 }} title="paso" />
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto', border: `1px solid ${pal.border}`, borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
          <thead>
            <tr style={{ color: pal.faint }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${pal.border}` }}>x</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${pal.border}` }}>f(x)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ color: pal.bubbleText }}>
                <td style={{ padding: '4px 10px', borderBottom: `1px solid ${pal.border}` }}>{fmtN(r.x)}</td>
                <td style={{ padding: '4px 10px', borderBottom: `1px solid ${pal.border}`, color: r.y === null ? pal.faint : pal.accent }}>
                  {r.y === null ? '—' : fmtN(r.y)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}