// src/components/panel/Spreadsheet.tsx — Fase 3: hoja AVANZADA y viva.
// Σ con estadística · CSV in/out · gráfica desde columna · bidireccional con el lienzo:
// la hoja LEE el mundo en vivo (o_x, theta, base…) y ESCRIBE con Vincular (θ/base/radio/punto).
import { useMemo, useRef, useState } from 'react';
import { COLS, ROWS, computeGrid, exportCsv, importCsv, shiftFormula, usedRange, type Raw } from '../../utils/sheet';
import { fmtN } from '../../utils/expr';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';
import { SectionTitle, TextInput } from '../ui/primitives';

const SIGMA: { fn: string; label: string }[] = [
  { fn: 'suma', label: 'Suma' },
  { fn: 'media', label: 'Media' },
  { fn: 'mediana', label: 'Mediana' },
  { fn: 'moda', label: 'Moda' },
  { fn: 'minimo', label: 'Mínimo' },
  { fn: 'maximo', label: 'Máximo' },
  { fn: 'desv', label: 'Desviación típica' },
  { fn: 'contar', label: 'Contar' },
  { fn: 'producto', label: 'Producto' },
];

type LinkTarget = 'theta' | 'base' | 'radio' | 'puntoX' | 'puntoY';
const LINKS: { id: LinkTarget; label: string }[] = [
  { id: 'theta', label: 'θ ángulo' },
  { id: 'base', label: 'base' },
  { id: 'radio', label: 'radio del círculo seleccionado' },
  { id: 'puntoX', label: 'punto seleccionado X' },
  { id: 'puntoY', label: 'punto seleccionado Y' },
];

export function Spreadsheet() {
  const pal = usePal();
  const st = () => useCanvasStore.getState();
  const [raw, setRaw] = useState<Raw>({ A1: '1', A2: '2', A3: '=A1+A2', B1: '=A1*10', B2: '=A2*10', C1: '=sum(A1:A3)', F1: '=theta' });
  const [sel, setSel] = useState<string>('A1');
  const [fill, setFill] = useState<{ from: string; to: string } | null>(null);
  const [showSigma, setShowSigma] = useState(false);
  const [chartCol, setChartCol] = useState<string>('A');
  const [chartCol2, setChartCol2] = useState<string>('');
  const [link, setLink] = useState<LinkTarget>('theta');
  const fileRef = useRef<HTMLInputElement>(null);

  // Mundo vivo: la hoja lee el lienzo (se recalcula al mover la figura).
  const points = useCanvasStore((s) => s.points);
  const measures = useCanvasStore((s) => s.measures);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const world = useMemo<Record<string, number>>(() => {
    const w: Record<string, number> = {
      base: measures.base, altura: measures.height, hyp: measures.hyp,
      theta: measures.angleDeg, angleb: measures.angleB, anglea: measures.angleA, area: measures.area,
    };
    for (const [id, p] of Object.entries(points)) {
      w[`${id.toLowerCase()}_x`] = p.pos.x;
      w[`${id.toLowerCase()}_y`] = p.pos.y;
    }
    return w;
  }, [points, measures]);

  const { values, errors, texts } = useMemo(() => computeGrid(raw, world), [raw, world]);

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

  const insertSigma = (fn: string) => {
    const col = sel[0];
    const range = usedRange(raw, col);
    const arg = range ? `${col}${range.from}:${col}${range.to}` : `${col}1:${col}5`;
    setCell(sel, `=${fn}(${arg})`);
    setShowSigma(false);
  };

  const downloadCsv = () => {
    const blob = new Blob([exportCsv(raw)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hoja-trig.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    st().toastMsg('💾 CSV descargado (hoja-trig.csv)');
  };

  const uploadCsv = (file: File) => {
    void file.text().then((text) => {
      try {
        setRaw(importCsv(text));
        st().toastMsg(`📥 CSV cargado: ${file.name}`);
      } catch {
        st().toastMsg('⚠️ Ese CSV no se pudo leer');
      }
    });
  };

  const applyLink = () => {
    const v = values[sel];
    if (v === null || !isFinite(v)) { st().toastMsg(`⚠️ ${sel} no tiene un número para vincular`); return; }
    const s = st();
    if (link === 'theta') { s.setAngleDeg(v); s.toastMsg(`🔗 ${sel} (${v}) → θ`); }
    else if (link === 'base') { s.setBase(v); s.toastMsg(`🔗 ${sel} (${v}) → base`); }
    else if (link === 'radio') {
      const c = s.circles.find((x) => x.id === selectedId);
      if (!c) { s.toastMsg('👆 Selecciona primero un círculo'); return; }
      s.setCircleRadius(c.id, v); s.toastMsg(`🔗 ${sel} (${v}) → radio ${c.id}`);
    } else {
      const p = selectedId ? s.points[selectedId] : undefined;
      if (!p) { s.toastMsg('👆 Selecciona primero un punto'); return; }
      s.setPointPos(p.id, link === 'puntoX' ? v : p.pos.x, link === 'puntoY' ? v : p.pos.y);
      s.toastMsg(`🔗 ${sel} (${v}) → ${p.id}.${link === 'puntoX' ? 'x' : 'y'}`);
    }
  };

  // Gráfica desde columna(s): valores numéricos por nº de fila.
  const series = useMemo(() => {
    const grab = (col: string): { x: number; y: number }[] => {
      const out: { x: number; y: number }[] = [];
      for (let r = 1; r <= ROWS; r++) {
        const v = values[`${col}${r}`];
        if (v !== null && isFinite(v)) out.push({ x: r, y: v });
      }
      return out;
    };
    const s1 = grab(chartCol);
    const s2 = chartCol2 ? grab(chartCol2) : [];
    const all = [...s1, ...s2].map((p) => p.y);
    if (!all.length) return null;
    const minY = Math.min(...all), maxY = Math.max(...all);
    const W = 240, H = 90;
    const span = Math.max(maxY - minY, 1e-9);
    const px = (x: number) => ((x - 1) / Math.max(ROWS - 1, 1)) * (W - 8) + 4;
    const py = (y: number) => H - 6 - ((y - minY) / span) * (H - 12);
    const line = (s: { x: number; y: number }[]) => s.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
    return { W, H, line1: line(s1), line2: s2.length ? line(s2) : null, minY, maxY };
  }, [values, chartCol, chartCol2]);

  return (
    <div style={{ padding: 10 }} onMouseUp={applyFill}>
      <SectionTitle>Barra de fórmulas</SectionTitle>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: pal.accent, width: 30 }}>{sel}</span>
        <TextInput value={raw[sel] ?? ''} onChange={(v) => setCell(sel, v)} placeholder="ej: =A1*10 · =suma(A1:A5) · =theta*2" />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSigma(!showSigma)} title="Funciones (como el Σ de GeoGebra)"
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${pal.border}`, background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
            Σ
          </button>
          {showSigma && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 10, padding: 4, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>
              {SIGMA.map((f) => (
                <button key={f.fn} onClick={() => insertSigma(f.fn)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: pal.bubbleText, cursor: 'pointer', fontSize: 12, padding: '7px 10px', borderRadius: 6 }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ color: pal.faint, fontSize: 10.5, lineHeight: 1.6, marginBottom: 8 }}>
        = fórmulas · suma media mediana moda minimo maximo desv desvestp contar producto ·
        + - * / ^ · sin cos tan · <b>$A$1</b> fija al rellenar · mundo vivo: <code>o_x theta base hyp area…</code> ·
        Arrastra el <b style={{ color: '#7c3aed' }}>▾ morado</b> para rellenar.
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button onClick={downloadCsv} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${pal.border}`, background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 11.5 }}>💾 CSV</button>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${pal.border}`, background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 11.5 }}>📥 CSV</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCsv(f); e.target.value = ''; }} />
      </div>
      <div style={{ maxHeight: 300, overflow: 'auto', border: `1px solid ${pal.border}`, borderRadius: 8 }}>
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
                  const txt = texts[id];
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
                      {v === null ? (txt ?? err ?? '') : fmtN(v)}
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

      <SectionTitle>Gráfica de columna</SectionTitle>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
        {[{ v: chartCol, set: setChartCol }, { v: chartCol2, set: setChartCol2 }].map((s, i) => (
          <select key={i} value={s.v} onChange={(e) => s.set(e.target.value)}
            style={{ background: pal.card, color: pal.bubbleText, border: `1px solid ${pal.border}`, borderRadius: 6, padding: '4px 6px', fontSize: 11.5 }}>
            {i === 1 && <option value="">—</option>}
            {COLS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ))}
        {series && <span style={{ color: pal.faint, fontSize: 10.5, fontFamily: 'monospace' }}>min {fmtN(series.minY)} · max {fmtN(series.maxY)}</span>}
      </div>
      {series ? (
        <svg width={series.W} height={series.H} style={{ background: pal.card, borderRadius: 8, border: `1px solid ${pal.border}` }}>
          <polyline points={series.line1} fill="none" stroke={pal.accent} strokeWidth={2} />
          {series.line2 && <polyline points={series.line2} fill="none" stroke="#fb923c" strokeWidth={2} />}
        </svg>
      ) : (
        <div style={{ color: pal.faint, fontSize: 11 }}>Escribe números en {chartCol} para verlos aquí.</div>
      )}

      <SectionTitle>Vincular al lienzo</SectionTitle>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: pal.accent }}>{sel}={values[sel] === null ? '…' : fmtN(values[sel]!)}</span>
        <select value={link} onChange={(e) => setLink(e.target.value as LinkTarget)}
          style={{ flex: 1, background: pal.card, color: pal.bubbleText, border: `1px solid ${pal.border}`, borderRadius: 6, padding: '5px 6px', fontSize: 11.5 }}>
          {LINKS.map((l) => <option key={l.id} value={l.id}>→ {l.label}</option>)}
        </select>
        <button onClick={applyLink} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid #7c3aed`, background: 'rgba(124,58,237,.12)', color: pal.bubbleText, cursor: 'pointer', fontSize: 11.5, fontWeight: 700 }}>🔗 Aplicar</button>
      </div>
      <div style={{ color: pal.faint, fontSize: 10.5, marginTop: 6, lineHeight: 1.5 }}>
        La hoja lee la figura en vivo (=theta, =o_x…); con Aplicar escribes una celda en la figura.
      </div>
    </div>
  );
}
