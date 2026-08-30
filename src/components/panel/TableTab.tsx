// src/components/panel/TableTab.tsx — Fase H: tabla dinámica + calculadora real + gráfica
import { useMemo, useState } from 'react';
import { evalExpr, fmtN } from '../../utils/expr';
import { usePal } from '../../stores/themeStore';
import { SectionTitle, TextInput, Btn } from '../ui/primitives';

export function TableTab() {
  const pal = usePal();
  const [calc, setCalc] = useState('sin(45) * 10');
  const [hist, setHist] = useState<{ e: string; r: number }[]>([]);
  const [fx, setFx] = useState('tan(x)');
  const [gx, setGx] = useState('');
  const [from, setFrom] = useState('0');
  const [to, setTo] = useState('80');
  const [step, setStep] = useState('10');

  const calcRes = useMemo(() => evalExpr(calc), [calc]);
  const rows = useMemo(() => {
    const a = evalExpr(from) ?? 0, b = evalExpr(to) ?? 10, h = Math.abs(evalExpr(step) ?? 1) || 1;
    const out: { x: number; f: number | null; g: number | null }[] = [];
    for (let x = a; x <= b + 1e-9 && out.length < 200; x += h) {
      out.push({ x, f: evalExpr(fx, { x }), g: gx.trim() ? evalExpr(gx, { x }) : null });
    }
    return out;
  }, [fx, gx, from, to, step]);

  // mini-gráfica SVG (normalizada)
  const graph = useMemo(() => {
    const pts = (key: 'f' | 'g') => rows.filter((r) => r[key] !== null) as { x: number; f: number | null; g: number | null }[];
    const all = rows.flatMap((r) => [r.f, r.g]).filter((v): v is number => v !== null);
    if (!rows.length || !all.length) return null;
    const xs = rows.map((r) => r.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...all), maxY = Math.max(...all);
    const W = 240, H = 90;
    const px = (x: number) => ((x - minX) / Math.max(maxX - minX, 1e-9)) * (W - 8) + 4;
    const py = (y: number) => H - 6 - ((y - minY) / Math.max(maxY - minY, 1e-9)) * (H - 12);
    const line = (key: 'f' | 'g') => pts(key).map((r) => `${px(r.x)},${py(r[key] as number)}`).join(' ');
    return { W, H, lineF: line('f'), lineG: gx.trim() ? line('g') : null };
  }, [rows, gx]);

  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionTitle>Calculadora de álgebra</SectionTitle>
      <TextInput value={calc} onChange={setCalc}
        onEnter={() => { if (calcRes !== null) setHist([{ e: calc, r: calcRes }, ...hist].slice(0, 8)); }}
        placeholder="ej: sin(45) * 10 · sqrt(2)^2 · tan(30)" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 15, color: calcRes === null ? pal.faint : pal.accent }}>
          = {calcRes === null ? '…' : fmtN(calcRes)}
        </span>
        <Btn onClick={() => { if (calcRes !== null) setHist([{ e: calc, r: calcRes }, ...hist].slice(0, 8)); }}>＝ guardar</Btn>
      </div>
      {hist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {hist.map((h, i) => (
            <button key={i} onClick={() => setCalc(h.e)} style={{ background: 'none', border: 'none', textAlign: 'left', color: pal.dim, fontSize: 11, fontFamily: 'monospace', cursor: 'pointer', padding: '1px 4px' }}>
              {h.e} = <span style={{ color: pal.accent }}>{fmtN(h.r)}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{ color: pal.faint, fontSize: 10.5 }}>sin cos tan (grados) · asin acos atan · sqrt abs round log ln · pi, e · ^</div>

      <SectionTitle>Tabla de funciones</SectionTitle>
      <TextInput value={fx} onChange={setFx} placeholder="f(x) = ej: tan(x)" />
      <TextInput value={gx} onChange={setGx} placeholder="g(x) opcional = ej: x^2 / 100" />
      <div style={{ display: 'flex', gap: 6 }}>
        <TextInput value={from} onChange={setFrom} placeholder="desde" />
        <TextInput value={to} onChange={setTo} placeholder="hasta" />
        <TextInput value={step} onChange={setStep} placeholder="paso" style={{ width: 56 }} />
      </div>

      {graph && (
        <svg width={graph.W} height={graph.H} style={{ background: pal.card, borderRadius: 8, border: `1px solid ${pal.border}` }}>
          <polyline points={graph.lineF} fill="none" stroke={pal.accent} strokeWidth={2} />
          {graph.lineG && <polyline points={graph.lineG} fill="none" stroke="#fb923c" strokeWidth={2} />}
        </svg>
      )}

      <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${pal.border}`, borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
          <thead>
            <tr style={{ color: pal.faint }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${pal.border}` }}>x</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${pal.border}` }}>f(x)</th>
              {gx.trim() && <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${pal.border}` }}>g(x)</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ color: pal.bubbleText }}>
                <td style={{ padding: '4px 10px', borderBottom: `1px solid ${pal.border}` }}>{fmtN(r.x)}</td>
                <td style={{ padding: '4px 10px', borderBottom: `1px solid ${pal.border}`, color: r.f === null ? pal.faint : pal.accent }}>{r.f === null ? '—' : fmtN(r.f)}</td>
                {gx.trim() && <td style={{ padding: '4px 10px', borderBottom: `1px solid ${pal.border}`, color: r.g === null ? pal.faint : '#fb923c' }}>{r.g === null ? '—' : fmtN(r.g)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}