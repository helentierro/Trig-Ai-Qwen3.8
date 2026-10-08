// src/components/panel/Spreadsheet.tsx — Excel 2.0 vivo y conectado.
// Full-espacio · teclado fiel a Excel real · ilimitado (A-AZ x auto-crecimiento) ·
// formato pro · portapapeles TSV · buscar/reemplazar · congelar · filtros ·
// bidireccional con el lienzo (lee theta/base/... y escribe con Vincular).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLS, computeGrid, exportCsv, importCsv, shiftFormula, cycleDollars, usedRange, usedBounds,
  visibleSize, colToIndex, indexToCol, parseA1, a1, insertRow, deleteRow, insertCol, deleteCol,
  findCells, replaceAll, formatValue, rangeToTsv, pasteTsv,
  type Raw, type FmtMap,
} from '../../utils/sheet';
import { fmtN } from '../../utils/expr';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';
import { SectionTitle, TextInput } from '../ui/primitives';

const SIGMA = [
  { fn: 'suma', label: 'Suma' }, { fn: 'media', label: 'Media' },
  { fn: 'mediana', label: 'Mediana' }, { fn: 'moda', label: 'Moda' },
  { fn: 'minimo', label: 'Mínimo' }, { fn: 'maximo', label: 'Máximo' },
  { fn: 'desv', label: 'Desviación típica' }, { fn: 'contar', label: 'Contar' },
  { fn: 'producto', label: 'Producto' },
];
type LinkTarget = 'theta' | 'base' | 'radio' | 'puntoX' | 'puntoY';
const LINKS: { id: LinkTarget; label: string }[] = [
  { id: 'theta', label: 'θ ángulo' }, { id: 'base', label: 'base' },
  { id: 'radio', label: 'radio del círculo seleccionado' },
  { id: 'puntoX', label: 'punto seleccionado X' }, { id: 'puntoY', label: 'punto seleccionado Y' },
];
const LS_RAW = 'trig-hoja-v2', LS_FMT = 'trig-hoja-fmt-v2';
const DEF_RAW: Raw = { A1: '1', A2: '2', A3: '=A1+A2', B1: '=A1*10', B2: '=A2*10', C1: '=sum(A1:A3)', F1: '=theta' };
function loadLS(k: string): Record<string, string> | null {
  try { const t = localStorage.getItem(k); return t ? JSON.parse(t) as Record<string, string> : null; } catch { return null; }
}

export function Spreadsheet() {
  const pal = usePal();
  const st = () => useCanvasStore.getState();
  const [raw, setRaw] = useState<Raw>(() => (loadLS(LS_RAW) as unknown as Raw) ?? DEF_RAW);
  const [fmt, setFmt] = useState<FmtMap>(() => (loadLS(LS_FMT) as unknown as FmtMap) ?? {});
  const [sel, setSel] = useState({ ci: 0, row: 1 });
  const [range, setRange] = useState<{ c1: number; r1: number; c2: number; r2: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSigma, setShowSigma] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findQ, setFindQ] = useState('');
  const [findRep, setFindRep] = useState('');
  const [matches, setMatches] = useState<string[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [showFormulas, setShowFormulas] = useState(false);
  const [chartCol, setChartCol] = useState('A');
  const [chartCol2, setChartCol2] = useState('');
  const [link, setLink] = useState<LinkTarget>('theta');
  const [colW] = useState<Record<number, number>>({});
  const [freeze, setFreeze] = useState(true);
  const [filtersOn, setFiltersOn] = useState(false);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [clip, setClip] = useState<{ c1: number; r1: number; c2: number; r2: number; cut: boolean } | null>(null);
  const [bottomTab, setBottomTab] = useState<'graf' | 'link'>('graf');
  const fileRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const fxRef = useRef<HTMLInputElement>(null);
  const histRef = useRef<{ raw: Raw; fmt: FmtMap }[]>([]);
  const redoRef = useRef<{ raw: Raw; fmt: FmtMap }[]>([]);

  useEffect(() => { try { localStorage.setItem(LS_RAW, JSON.stringify(raw)); } catch { /* noop */ } }, [raw]);
  useEffect(() => { try { localStorage.setItem(LS_FMT, JSON.stringify(fmt)); } catch { /* noop */ } }, [fmt]);

  // Mundo vivo: la hoja lee el lienzo (recalcula al mover la figura).
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

  const memo = useMemo(() => computeGrid(raw, world), [raw, world]);
  const { values, errors, texts } = memo;
  const valOf = useCallback((ci: number, r: number): number | null => {
    const id = `${indexToCol(ci)}${r}`;
    if (id in values) return values[id];
    const v = raw[id];
    if (v === undefined || v === '') return null;
    if (!v.startsWith('=')) {
      const n = Number(v.replace(',', '.'));
      return isFinite(n) ? n : null;
    }
    return null; // fórmula fuera de caché mínima → se recalcula en computeGrid al commitear
  }, [raw, values]);

  const size = useMemo(() => visibleSize(raw), [raw]);
  const selId = a1(sel.ci, sel.row);
  const effRange = range ?? { c1: sel.ci, r1: sel.row, c2: sel.ci, r2: sel.row };
  const inSel = (ci: number, r: number) =>
    ci >= Math.min(effRange.c1, effRange.c2) && ci <= Math.max(effRange.c1, effRange.c2) &&
    r >= Math.min(effRange.r1, effRange.r2) && r <= Math.max(effRange.r1, effRange.r2);

  const commit = useCallback((next: Raw, nextFmt?: FmtMap) => {
    histRef.current.push({ raw, fmt });
    if (histRef.current.length > 60) histRef.current.shift();
    redoRef.current = [];
    setRaw(next);
    if (nextFmt) setFmt(nextFmt);
  }, [raw, fmt]);

  const undo = useCallback(() => {
    const h = histRef.current.pop();
    if (!h) return;
    redoRef.current.push({ raw, fmt });
    setRaw(h.raw); setFmt(h.fmt);
  }, [raw, fmt]);
  const redo = useCallback(() => {
    const h = redoRef.current.pop();
    if (!h) return;
    histRef.current.push({ raw, fmt });
    setRaw(h.raw); setFmt(h.fmt);
  }, [raw, fmt]);

  const setCell = (id: string, v: string) => {
    const next = { ...raw };
    if (v === '') delete next[id]; else next[id] = v;
    commit(next);
  };

  const gotoCell = (ci: number, r: number, extend = false) => {
    const nc = Math.max(0, Math.min(COLS.length - 1, ci));
    const nr = Math.max(1, Math.min(1000, r));
    if (extend) {
      setRange({ c1: sel.ci, r1: sel.row, c2: nc, r2: nr });
      setSel({ ci: nc, row: nr });
    } else {
      setSel({ ci: nc, row: nr });
      setRange(null);
    }
    setEditing(false);
    requestAnimationFrame(() => gridRef.current?.focus());
  };

  // ─── Portapapeles (TSV interoperable con Excel real) ───
  const doCopy = async (cut: boolean) => {
    const tsv = rangeToTsv(raw, effRange.c1, effRange.r1, effRange.c2, effRange.r2);
    setClip({ ...effRange, cut });
    try { await navigator.clipboard.writeText(tsv); } catch { /* portapapeles bloqueado: queda interno */ }
    st().toastMsg(cut ? '✂️ Cortado (Ctrl+V para pegar)' : '📋 Copiado');
  };
  const doPaste = async () => {
    let tsv = '';
    try { tsv = await navigator.clipboard.readText(); } catch { /* sin permiso */ }
    if (!tsv && clip) {
      // mover/copiar interno
      const src = rangeToTsv(raw, clip.c1, clip.r1, clip.c2, clip.r2);
      let next = pasteTsv(raw, sel.ci, sel.row, src);
      if (clip.cut) {
        next = { ...next };
        for (let r = Math.min(clip.r1, clip.r2); r <= Math.max(clip.r1, clip.r2); r++)
          for (let c = Math.min(clip.c1, clip.c2); c <= Math.max(clip.c1, clip.c2); c++)
            delete next[`${indexToCol(c)}${r}`];
        setClip(null);
      }
      commit(next);
      st().toastMsg('📥 Pegado');
      return;
    }
    if (!tsv) { st().toastMsg('⚠️ Portapapeles vacío'); return; }
    commit(pasteTsv(raw, sel.ci, sel.row, tsv));
    st().toastMsg('📥 Pegado');
  };

  // ─── Relleno estilo Excel ───
  const fillDown = () => {
    const c1 = Math.min(effRange.c1, effRange.c2), c2 = Math.max(effRange.c1, effRange.c2);
    const r1 = Math.min(effRange.r1, effRange.r2), r2 = Math.max(effRange.r1, effRange.r2);
    const next = { ...raw };
    for (let c = c1; c <= c2; c++) {
      const src = raw[`${indexToCol(c)}${r1}`];
      if (src?.startsWith('=')) for (let r = r1 + 1; r <= r2; r++) next[`${indexToCol(c)}${r}`] = shiftFormula(src, r - r1, 0);
      else if (src !== undefined) for (let r = r1 + 1; r <= r2; r++) next[`${indexToCol(c)}${r}`] = src;
    }
    commit(next);
  };
  const fillRight = () => {
    const c1 = Math.min(effRange.c1, effRange.c2), c2 = Math.max(effRange.c1, effRange.c2);
    const r1 = Math.min(effRange.r1, effRange.r2), r2 = Math.max(effRange.r1, effRange.r2);
    const next = { ...raw };
    for (let r = r1; r <= r2; r++) {
      const src = raw[`${indexToCol(c1)}${r}`];
      if (src?.startsWith('=')) for (let c = c1 + 1; c <= c2; c++) next[`${indexToCol(c)}${r}`] = shiftFormula(src, 0, c - c1);
      else if (src !== undefined) for (let c = c1 + 1; c <= c2; c++) next[`${indexToCol(c)}${r}`] = src;
    }
    commit(next);
  };

  const autoSum = () => {
    const col = indexToCol(sel.ci);
    const rg = usedRange(raw, col);
    let expr: string;
    if (rg && sel.row > rg.to) expr = `=suma(${col}${rg.from}:${col}${rg.to})`;
    else if (rg) expr = `=suma(${col}${rg.from}:${col}${rg.to})`;
    else expr = `=suma(${col}1:${col}${Math.max(1, sel.row - 1)})`;
    setCell(selId, expr);
  };

  const insertSigma = (fn: string) => {
    const col = indexToCol(sel.ci);
    const rg = usedRange(raw, col);
    const arg = rg ? `${col}${rg.from}:${col}${rg.to}` : `${col}1:${col}5`;
    setCell(selId, `=${fn}(${arg})`);
    setShowSigma(false);
    requestAnimationFrame(() => gridRef.current?.focus());
  };

  const downloadCsv = () => {
    const blob = new Blob([exportCsv(raw)], { type: 'text/csv;charset=utf-8' });
    const u = document.createElement('a');
    u.href = URL.createObjectURL(blob);
    u.download = 'hoja-trig.csv';
    u.click();
    setTimeout(() => URL.revokeObjectURL(u.href), 2000);
    st().toastMsg('💾 CSV descargado (Ctrl+S también guarda local)');
  };
  const uploadCsv = (file: File) => {
    void file.text().then((text) => {
      try { commit(importCsv(text)); st().toastMsg(`📥 CSV cargado: ${file.name}`); }
      catch { st().toastMsg('⚠️ Ese CSV no se pudo leer'); }
    });
  };
  const saveLocal = () => {
    try { localStorage.setItem(LS_RAW, JSON.stringify(raw)); localStorage.setItem(LS_FMT, JSON.stringify(fmt)); } catch { /* noop */ }
    st().toastMsg('💾 Hoja guardada en este navegador');
  };

  const applyLink = () => {
    const targets = range
      ? [`${indexToCol(Math.min(effRange.c1, effRange.c2))}${Math.min(effRange.r1, effRange.r2)}`]
      : [selId];
    const id = targets[0];
    const v = values[id] ?? valOf(sel.ci, sel.row);
    if (v === null || !isFinite(v)) { st().toastMsg(`⚠️ ${id} no tiene un número para vincular`); return; }
    const s = st();
    if (link === 'theta') { s.setAngleDeg(v); s.toastMsg(`🔗 ${id} (${fmtN(v)}) → θ`); }
    else if (link === 'base') { s.setBase(v); s.toastMsg(`🔗 ${id} (${fmtN(v)}) → base`); }
    else if (link === 'radio') {
      const c = s.circles.find((x) => x.id === selectedId);
      if (!c) { s.toastMsg('👆 Selecciona primero un círculo'); return; }
      s.setCircleRadius(c.id, v); s.toastMsg(`🔗 ${id} (${fmtN(v)}) → radio ${c.id}`);
    } else {
      const p = selectedId ? s.points[selectedId] : undefined;
      if (!p) { s.toastMsg('👆 Selecciona primero un punto'); return; }
      s.setPointPos(p.id, link === 'puntoX' ? v : p.pos.x, link === 'puntoY' ? v : p.pos.y);
      s.toastMsg(`🔗 ${id} (${fmtN(v)}) → ${p.id}.${link === 'puntoX' ? 'x' : 'y'}`);
    }
  };

  // ─── Teclado fiel a Excel ───
  const onGridKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    if (editing) {
      if (k === 'Enter' && !e.shiftKey) { e.preventDefault(); setEditing(false); gotoCell(sel.ci, sel.row + 1); }
      else if (k === 'Enter') { e.preventDefault(); setEditing(false); gotoCell(sel.ci, sel.row - 1); }
      else if (k === 'Tab') { e.preventDefault(); setEditing(false); gotoCell(sel.ci + (e.shiftKey ? -1 : 1), sel.row); }
      else if (k === 'Escape') { e.preventDefault(); setEditing(false); gridRef.current?.focus(); }
      else if (k === 'F4') {
        e.preventDefault();
        const cur = editRef.current?.value ?? raw[selId] ?? '';
        if (cur.startsWith('=')) {
          const nx = cycleDollars(cur);
          setCell(selId, nx);
        }
      }
      return;
    }
    // No editando: navegación y comandos
    if (k === 'F2') { e.preventDefault(); setEditing(true); requestAnimationFrame(() => editRef.current?.select()); }
    else if (k === 'F4') { e.preventDefault(); st().toastMsg('🔁 Repetir: usa Ctrl+D / Ctrl+R para rellenar'); }
    else if (k === 'F5') { e.preventDefault(); const t = prompt('Ir a (ej: C12):', selId); if (t) { const p = parseA1(t); if (p) gotoCell(p.ci, p.row); } }
    else if (k === 'F9') { e.preventDefault(); setRaw({ ...raw }); st().toastMsg('🔄 Recalculado'); }
    else if (k === 'ArrowUp') { e.preventDefault(); gotoCell(sel.ci, sel.row - 1, e.shiftKey); }
    else if (k === 'ArrowDown') { e.preventDefault(); gotoCell(sel.ci, sel.row + 1, e.shiftKey); }
    else if (k === 'ArrowLeft') { e.preventDefault(); gotoCell(sel.ci - 1, sel.row, e.shiftKey); }
    else if (k === 'ArrowRight') { e.preventDefault(); gotoCell(sel.ci + 1, sel.row, e.shiftKey); }
    else if (k === 'Tab') { e.preventDefault(); gotoCell(sel.ci + (e.shiftKey ? -1 : 1), sel.row, false); }
    else if (k === 'Enter') { e.preventDefault(); gotoCell(sel.ci, sel.row + (e.shiftKey ? -1 : 1), false); }
    else if (k === 'Escape') { setRange(null); setShowSigma(false); setShowFind(false); }
    else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault();
      const next = { ...raw };
      for (let r = Math.min(effRange.r1, effRange.r2); r <= Math.max(effRange.r1, effRange.r2); r++)
        for (let c = Math.min(effRange.c1, effRange.c2); c <= Math.max(effRange.c1, effRange.c2); c++)
          delete next[`${indexToCol(c)}${r}`];
      commit(next);
    }
    else if (k === ' ' && (ctrl || e.shiftKey)) {
      e.preventDefault();
      if (ctrl && !e.shiftKey) setRange({ c1: sel.ci, r1: 1, c2: sel.ci, r2: size.rows });
      else if (e.shiftKey && !ctrl) setRange({ c1: 0, r1: sel.row, c2: size.cols - 1, r2: sel.row });
      else setRange({ c1: 0, r1: 1, c2: size.cols - 1, r2: size.rows });
    }
    else if (k === 'Home' && ctrl) { e.preventDefault(); gotoCell(0, 1); }
    else if (k === 'Home') { e.preventDefault(); gotoCell(0, sel.row, e.shiftKey); }
    else if (k === 'End' && ctrl) {
      e.preventDefault();
      const b = usedBounds(raw);
      if (b) gotoCell(b.c2, b.r2); else gotoCell(0, 1);
    }
    else if (k === 'PageUp') { e.preventDefault(); gotoCell(sel.ci, sel.row - 20, e.shiftKey); }
    else if (k === 'PageDown') { e.preventDefault(); gotoCell(sel.ci, sel.row + 20, e.shiftKey); }
    else if (k === '`' && ctrl) { e.preventDefault(); setShowFormulas((v) => !v); }
    else if ((k === 'a' || k === 'A') && ctrl) { e.preventDefault(); setRange({ c1: 0, r1: 1, c2: size.cols - 1, r2: size.rows }); }
    else if ((k === 'c' || k === 'C') && ctrl && !e.shiftKey) { e.preventDefault(); void doCopy(false); }
    else if ((k === 'x' || k === 'X') && ctrl) { e.preventDefault(); void doCopy(true); }
    else if ((k === 'v' || k === 'V') && ctrl) { e.preventDefault(); void doPaste(); }
    else if ((k === 'z' || k === 'Z') && ctrl && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (((k === 'y' || k === 'Y') && ctrl) || ((k === 'z' || k === 'Z') && ctrl && e.shiftKey)) { e.preventDefault(); redo(); }
    else if ((k === 'd' || k === 'D') && ctrl) { e.preventDefault(); fillDown(); }
    else if ((k === 'r' || k === 'R') && ctrl) { e.preventDefault(); fillRight(); }
    else if ((k === 's' || k === 'S') && ctrl) { e.preventDefault(); saveLocal(); }
    else if ((k === 'o' || k === 'O') && ctrl) { e.preventDefault(); fileRef.current?.click(); }
    else if ((k === 'f' || k === 'F') && ctrl && !e.shiftKey) { e.preventDefault(); setShowFind(true); }
    else if ((k === 'h' || k === 'H') && ctrl) { e.preventDefault(); setShowFind(true); }
    else if ((k === 'b' || k === 'B') && ctrl && !e.shiftKey) {
      e.preventDefault();
      const id = selId;
      const cur = fmt[id];
      commit(raw, { ...fmt, [id]: { ...cur, bold: !cur?.bold } });
    }
    else if ((k === 'i' || k === 'I') && ctrl) {
      e.preventDefault();
      const id = selId;
      const cur = fmt[id];
      commit(raw, { ...fmt, [id]: { ...cur, italic: !cur?.italic } });
    }
    else if ((k === 'u' || k === 'U') && ctrl) {
      e.preventDefault();
      const id = selId;
      const cur = fmt[id];
      commit(raw, { ...fmt, [id]: { ...cur, underline: !cur?.underline } });
    }
    else if (k === '=' && !ctrl) { e.preventDefault(); setEditing(true); requestAnimationFrame(() => { if (editRef.current) { editRef.current.value = '='; editRef.current.focus(); } }); }
    else if (k.length === 1 && !ctrl && !e.altKey && !e.metaKey) {
      e.preventDefault();
      setCell(selId, k);
      setEditing(true);
      requestAnimationFrame(() => editRef.current?.focus());
    }
  };

  // ─── Buscar ───
  useEffect(() => {
    if (!showFind || !findQ) { setMatches([]); return; }
    setMatches(findCells(raw, findQ, memo));
    setMatchIdx(0);
  }, [showFind, findQ, raw, memo]);
  const jumpMatch = (d: number) => {
    if (!matches.length) return;
    const i = (matchIdx + d + matches.length) % matches.length;
    setMatchIdx(i);
    const p = parseA1(matches[i]);
    if (p) { setSel({ ci: p.ci, row: p.row }); setRange(null); }
  };

  // ─── Formato rápido ───
  const setNumFmt = (f: NonNullable<FmtMap[string]['numFmt']>) => {
    const nf: FmtMap = { ...fmt };
    for (let r = Math.min(effRange.r1, effRange.r2); r <= Math.max(effRange.r1, effRange.r2); r++)
      for (let c = Math.min(effRange.c1, effRange.c2); c <= Math.max(effRange.c1, effRange.c2); c++) {
        const id = `${indexToCol(c)}${r}`;
        nf[id] = { ...nf[id], numFmt: f };
      }
    commit(raw, nf);
  };

  // ─── Estadística de selección (barra de estado) ───
  const stats = useMemo(() => {
    const nums: number[] = [];
    for (let r = Math.min(effRange.r1, effRange.r2); r <= Math.max(effRange.r1, effRange.r2); r++)
      for (let c = Math.min(effRange.c1, effRange.c2); c <= Math.max(effRange.c1, effRange.c2); c++) {
        const v = valOf(c, r);
        if (v !== null && isFinite(v)) nums.push(v);
      }
    if (!nums.length) return null;
    const s = nums.reduce((x, y) => x + y, 0);
    return { n: nums.length, suma: s, media: s / nums.length };
  }, [effRange, valOf]);

  // ─── Gráfica ───
  const series = useMemo(() => {
    const grab = (col: string) => {
      const out: { x: number; y: number }[] = [];
      const ci = colToIndex(col);
      if (ci < 0) return out;
      for (let r = 1; r <= size.rows; r++) {
        const v = valOf(ci, r);
        if (v !== null && isFinite(v)) out.push({ x: r, y: v });
      }
      return out;
    };
    const s1 = grab(chartCol);
    const s2 = chartCol2 ? grab(chartCol2) : [];
    const all = [...s1, ...s2].map((p) => p.y);
    if (!all.length) return null;
    const minY = Math.min(...all), maxY = Math.max(...all);
    const W = 260, H = 90;
    const span = Math.max(maxY - minY, 1e-9);
    const px = (x: number) => ((x - 1) / Math.max(size.rows - 1, 1)) * (W - 8) + 4;
    const py = (y: number) => H - 6 - ((y - minY) / span) * (H - 12);
    const line = (s: { x: number; y: number }[]) => s.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ');
    return { W, H, line1: line(s1), line2: s2.length ? line(s2) : null, minY, maxY };
  }, [valOf, chartCol, chartCol2, size.rows]);

  const cellBg = (ci: number, r: number) => {
    const id = `${indexToCol(ci)}${r}`;
    if (sel.ci === ci && sel.row === r) return 'rgba(124,58,237,.22)';
    if (inSel(ci, r)) return 'rgba(124,58,237,.10)';
    if (clip && ci >= Math.min(clip.c1, clip.c2) && ci <= Math.max(clip.c1, clip.c2) && r >= Math.min(clip.r1, clip.r2) && r <= Math.max(clip.r1, clip.r2)) return 'rgba(56,189,248,.10)';
    if (findQ && matches.includes(id)) return 'rgba(251,191,36,.25)';
    return fmt[id]?.bg ?? pal.panelBg;
  };

  const rows = useMemo(() => {
    const out: number[] = [];
    for (let r = 1; r <= size.rows; r++) {
      if (!filtersOn) { out.push(r); continue; }
      let hide = false;
      for (const [cStr, q] of Object.entries(filters)) {
        if (!q) continue;
        const ci = +cStr;
        const id = `${indexToCol(ci)}${r}`;
        const disp = String(values[id] ?? texts[id] ?? raw[id] ?? '').toLowerCase();
        if (!disp.includes(q.toLowerCase())) { hide = true; break; }
      }
      if (!hide) out.push(r);
    }
    return out;
  }, [size.rows, filtersOn, filters, values, texts, raw]);

  const tbBtn: React.CSSProperties = {
    padding: '5px 9px', borderRadius: 7, border: `1px solid ${pal.border}`,
    background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 11.5, whiteSpace: 'nowrap',
  };

  const grid = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: pal.panelBg }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', flexWrap: 'wrap', borderBottom: `1px solid ${pal.border}` }}>
        <button onClick={saveLocal} title="Guardar (Ctrl+S)" style={tbBtn}>💾</button>
        <button onClick={() => fileRef.current?.click()} title="Abrir CSV (Ctrl+O)" style={tbBtn}>📥</button>
        <button onClick={downloadCsv} title="Descargar CSV" style={tbBtn}>⬇️</button>
        <button onClick={undo} title="Deshacer (Ctrl+Z)" style={tbBtn}>↶</button>
        <button onClick={redo} title="Rehacer (Ctrl+Y)" style={tbBtn}>↷</button>
        <button onClick={autoSum} title="Autosuma (Alt+=)" style={tbBtn}>Σ</button>
        <button onClick={() => setShowFind((v) => !v)} title="Buscar (Ctrl+F) · Reemplazar (Ctrl+H)" style={tbBtn}>🔍</button>
        <button onClick={() => setShowFormulas((v) => !v)} title="Ver fórmulas (Ctrl+`)" style={{ ...tbBtn, borderColor: showFormulas ? pal.accent : pal.border }}>fx</button>
        <button onClick={() => setFiltersOn((v) => !v)} title="Filtros (Ctrl+Shift+L)" style={{ ...tbBtn, borderColor: filtersOn ? pal.accent : pal.border }}>⧩</button>
        <button onClick={() => setFreeze((v) => !v)} title="Congelar primera fila/columna" style={{ ...tbBtn, borderColor: freeze ? pal.accent : pal.border }}>🧊</button>
        <select
          title="Formato numérico"
          value={fmt[selId]?.numFmt ?? 'general'}
          onChange={(e) => setNumFmt(e.target.value as NonNullable<FmtMap[string]['numFmt']>)}
          style={{ ...tbBtn, padding: '5px 6px' }}>
          <option value="general">General</option>
          <option value="numero">Número</option>
          <option value="moneda">Moneda</option>
          <option value="porciento">%</option>
        </select>
        <button onClick={() => { const id = selId; commit(raw, { ...fmt, [id]: { ...fmt[id], bold: !fmt[id]?.bold } }); }} title="Negrita (Ctrl+B)" style={{ ...tbBtn, fontWeight: 800 }}>B</button>
        <button onClick={() => { const id = selId; commit(raw, { ...fmt, [id]: { ...fmt[id], italic: !fmt[id]?.italic } }); }} title="Cursiva (Ctrl+I)" style={{ ...tbBtn, fontStyle: 'italic' }}>I</button>
        <button onClick={() => commit(insertRow(raw, sel.row))} title="Insertar fila arriba" style={tbBtn}>+fila</button>
        <button onClick={() => commit(deleteRow(raw, sel.row))} title="Eliminar fila" style={tbBtn}>−fila</button>
        <button onClick={() => commit(insertCol(raw, sel.ci))} title="Insertar columna" style={tbBtn}>+col</button>
        <button onClick={() => commit(deleteCol(raw, sel.ci))} title="Eliminar columna" style={tbBtn}>−col</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => setShowHelp(true)} title="Atajos de teclado (?)" style={tbBtn}>?</button>
        <button onClick={() => setExpanded((v) => !v)} title={expanded ? 'Salir de pantalla completa' : 'Pantalla completa ⛶'} style={tbBtn}>{expanded ? '⛶ salir' : '⛶'}</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCsv(f); e.target.value = ''; }} />
      </div>

      {/* Barra de fórmulas */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', borderBottom: `1px solid ${pal.border}` }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: pal.accent, minWidth: 44, textAlign: 'center', border: `1px solid ${pal.border}`, borderRadius: 6, padding: '5px 4px', background: pal.card }}>{selId}</span>
        <span style={{ color: pal.faint, fontSize: 13, fontStyle: 'italic' }}>fx</span>
        <TextInput
          value={raw[selId] ?? ''} onChange={(v) => setCell(selId, v)}
          placeholder="Escribe un número o una fórmula (=A1*10 · =suma(A1:A5) · =theta*2)"
        />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSigma(!showSigma)} title="Funciones (Shift+F3)"
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${pal.border}`, background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>Σ</button>
          {showSigma && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 30, background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 10, padding: 4, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}>
              {SIGMA.map((f) => (
                <button key={f.fn} onClick={() => insertSigma(f.fn)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: pal.bubbleText, cursor: 'pointer', fontSize: 12, padding: '7px 10px', borderRadius: 6 }}>{f.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buscar / reemplazar */}
      {showFind && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${pal.border}`, flexWrap: 'wrap' }}>
          <TextInput value={findQ} onChange={setFindQ} onEnter={() => jumpMatch(1)} placeholder="Buscar (Ctrl+F)…" style={{ maxWidth: 180 }} />
          <TextInput value={findRep} onChange={setFindRep} placeholder="Reemplazar con…" style={{ maxWidth: 160 }} />
          <button onClick={() => jumpMatch(1)} style={tbBtn}>↓ {matches.length ? `${matchIdx + 1}/${matches.length}` : '0'}</button>
          <button onClick={() => jumpMatch(-1)} style={tbBtn}>↑</button>
          <button onClick={() => { if (findQ) { commit(replaceAll(raw, findQ, findRep)); st().toastMsg('🔁 Reemplazado'); } }} style={tbBtn}>Reemplazar todo</button>
          <button onClick={() => setShowFind(false)} style={tbBtn}>✕</button>
        </div>
      )}

      {/* Grid: ocupa todo el espacio restante */}
      <div
        ref={gridRef} tabIndex={0} role="grid" aria-label={`Hoja de cálculo, celda ${selId}`}
        onKeyDown={onGridKey}
        style={{ flex: 1, minHeight: 0, overflow: 'auto', outline: 'none', fontSize: `${zoom}%` }}
      >
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'monospace', fontSize: 12, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 3, padding: 4, border: `1px solid ${pal.border}`, background: pal.card, color: pal.faint, fontSize: 10, minWidth: 40 }}>◧</th>
              {Array.from({ length: size.cols }, (_, ci) => (
                <th key={ci}
                  onClick={() => setRange({ c1: ci, r1: 1, c2: ci, r2: size.rows })}
                  title={`${indexToCol(ci)} — clic: seleccionar columna · Ctrl+Espacio`}
                  style={{
                    position: 'sticky', top: 0, zIndex: 2, padding: '4px 6px', border: `1px solid ${pal.border}`,
                    background: effRange && sel.ci === ci ? 'rgba(124,58,237,.18)' : pal.card,
                    color: pal.faint, fontSize: 10, minWidth: colW[ci] ?? 76, cursor: 'pointer',
                  }}>
                  {indexToCol(ci)}
                </th>
              ))}
            </tr>
            {filtersOn && (
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: pal.card, border: `1px solid ${pal.border}` }}>⧩</th>
                {Array.from({ length: size.cols }, (_, ci) => (
                  <th key={ci} style={{ padding: 2, border: `1px solid ${pal.border}`, background: pal.card }}>
                    <input
                      value={filters[ci] ?? ''} placeholder="filtrar…"
                      onChange={(e) => setFilters({ ...filters, [ci]: e.target.value })}
                      style={{ width: '100%', fontSize: 10, background: pal.panelBg, color: pal.bubbleText, border: `1px solid ${pal.border}`, borderRadius: 4, padding: '2px 4px', outline: 'none' }} />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td
                  onClick={() => setRange({ c1: 0, r1: r, c2: size.cols - 1, r2: r })}
                  title={`Fila ${r} — clic: seleccionar fila · Shift+Espacio`}
                  style={{
                    position: freeze ? 'sticky' : undefined, left: freeze ? 0 : undefined, zIndex: 1,
                    padding: 4, border: `1px solid ${pal.border}`, background: pal.card, color: pal.faint,
                    fontSize: 10, textAlign: 'center', cursor: 'pointer', minWidth: 40,
                  }}>{r}</td>
                {Array.from({ length: size.cols }, (_, ci) => {
                  const id = `${indexToCol(ci)}${r}`;
                  const v = values[id] ?? valOf(ci, r);
                  const err = errors[id];
                  const txt = texts[id];
                  const isFormula = raw[id]?.startsWith('=');
                  const isSel = sel.ci === ci && sel.row === r;
                  const f = fmt[id];
                  const live = isFormula && /theta|base|hyp|area|altura|angle|_x|_y/i.test(raw[id] ?? '');
                  return (
                    <td key={id} role="gridcell" aria-selected={isSel}
                      onClick={(e) => { if (e.shiftKey) setRange({ c1: sel.ci, r1: sel.row, c2: ci, r2: r }); else { setSel({ ci, row: r }); setRange(null); } gridRef.current?.focus(); }}
                      onDoubleClick={() => { setSel({ ci, row: r }); setEditing(true); requestAnimationFrame(() => editRef.current?.select()); }}
                      style={{
                        padding: '5px 7px', border: `1px solid ${pal.border}`, cursor: 'cell', position: 'relative',
                        minWidth: colW[ci] ?? 76,
                        background: cellBg(ci, r),
                        color: err ? '#f87171' : isFormula ? pal.accent : pal.bubbleText,
                        outline: isSel ? '2px solid #7c3aed' : 'none', outlineOffset: -2,
                        fontWeight: f?.bold ? 800 : 400, fontStyle: f?.italic ? 'italic' : 'normal',
                        textDecoration: f?.underline ? 'underline' : live ? 'underline dotted' : 'none',
                      }}
                      title={live ? '🔴 Viva: lee el lienzo en tiempo real' : id}>
                      {isSel && editing ? (
                        <input
                          ref={editRef}
                          defaultValue={raw[id] ?? ''}
                          autoFocus
                          onBlur={(e) => { setCell(id, e.target.value); setEditing(false); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); setCell(id, e.currentTarget.value); setEditing(false); gotoCell(ci, r + (e.shiftKey ? -1 : 1)); }
                            else if (e.key === 'Tab') { e.preventDefault(); setCell(id, e.currentTarget.value); setEditing(false); gotoCell(ci + (e.shiftKey ? -1 : 1), r); }
                            else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); gridRef.current?.focus(); }
                            else if (e.key === 'F4') { e.preventDefault(); e.currentTarget.value = cycleDollars(e.currentTarget.value); }
                            e.stopPropagation();
                          }}
                          style={{ width: '100%', minWidth: 60, font: 'inherit', background: pal.card, color: pal.bubbleText, border: 'none', outline: 'none' }}
                        />
                      ) : showFormulas && isFormula ? raw[id]
                        : v === null || v === undefined ? (txt ?? err ?? '')
                        : formatValue(v, f?.numFmt ?? 'general')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra de estado */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 10px', borderTop: `1px solid ${pal.border}`, fontSize: 11, color: pal.faint, fontFamily: 'monospace', flexWrap: 'wrap' }}>
        <span style={{ color: pal.accent, fontWeight: 700 }}>{range ? `${indexToCol(Math.min(effRange.c1, effRange.c2))}${Math.min(effRange.r1, effRange.r2)}:${indexToCol(Math.max(effRange.c1, effRange.c2))}${Math.max(effRange.r1, effRange.r2)}` : selId}</span>
        {stats && <span>Suma {formatValue(stats.suma)} · Media {formatValue(stats.media)} · Contar {stats.n}</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setZoom((z) => Math.max(70, z - 10))} style={tbBtn} title="Reducir zoom">−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(160, z + 10))} style={tbBtn} title="Ampliar zoom">+</button>
        </span>
      </div>

      {/* Panel inferior vivo */}
      <div style={{ borderTop: `1px solid ${pal.border}`, padding: '6px 10px 10px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {(['graf', 'link'] as const).map((t) => (
            <button key={t} onClick={() => setBottomTab(t)} style={{
              padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
              border: `1px solid ${bottomTab === t ? pal.accent : pal.border}`,
              background: bottomTab === t ? 'rgba(56,189,248,.10)' : pal.card,
              color: bottomTab === t ? pal.accent : pal.dim,
            }}>{t === 'graf' ? '📈 Gráfica' : '🔗 Lienzo vivo'}</button>
          ))}
        </div>
        {bottomTab === 'graf' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {[{ v: chartCol, set: setChartCol }, { v: chartCol2, set: setChartCol2 }].map((s, i) => (
              <select key={i} value={s.v} onChange={(e) => s.set(e.target.value)}
                style={{ background: pal.card, color: pal.bubbleText, border: `1px solid ${pal.border}`, borderRadius: 6, padding: '4px 6px', fontSize: 11.5 }}>
                {i === 1 && <option value="">—</option>}
                {COLS.slice(0, size.cols).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ))}
            {series ? (
              <>
                <svg width={series.W} height={series.H} style={{ background: pal.card, borderRadius: 8, border: `1px solid ${pal.border}` }}>
                  <polyline points={series.line1} fill="none" stroke={pal.accent} strokeWidth={2} />
                  {series.line2 && <polyline points={series.line2} fill="none" stroke="#fb923c" strokeWidth={2} />}
                </svg>
                <span style={{ color: pal.faint, fontSize: 10.5, fontFamily: 'monospace' }}>min {fmtN(series.minY)} · max {fmtN(series.maxY)}</span>
              </>
            ) : <span style={{ color: pal.faint, fontSize: 11 }}>Escribe números en {chartCol} para verlos aquí.</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: pal.accent }}>{selId}={values[selId] === undefined ? '…' : values[selId] === null ? '…' : fmtN(values[selId]!)}</span>
            <select value={link} onChange={(e) => setLink(e.target.value as LinkTarget)}
              style={{ flex: 1, minWidth: 160, background: pal.card, color: pal.bubbleText, border: `1px solid ${pal.border}`, borderRadius: 6, padding: '5px 6px', fontSize: 11.5 }}>
              {LINKS.map((l) => <option key={l.id} value={l.id}>→ {l.label}</option>)}
            </select>
            <button onClick={applyLink} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #7c3aed', background: 'rgba(124,58,237,.12)', color: pal.bubbleText, cursor: 'pointer', fontSize: 11.5, fontWeight: 700 }}>🔗 Aplicar (Enter vincula)</button>
          </div>
        )}
      </div>

      {/* Ayuda de atajos (el texto fijo se quitó; vive aquí con ?) */}
      {showHelp && (
        <div onClick={() => setShowHelp(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 12, padding: 16, maxWidth: 520, width: '100%', maxHeight: '80vh', overflow: 'auto', fontSize: 12, color: pal.bubbleText }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <strong>Atajos de Excel</strong>
              <button onClick={() => setShowHelp(false)} style={{ ...tbBtn, marginLeft: 'auto' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontFamily: 'monospace', fontSize: 11 }}>
              {[
                ['←↑→↓ / Tab / Enter', 'moverse (Shift: extender)'], ['F2 / = / Enter / Esc', 'editar · confirmar · cancelar'],
                ['Ctrl+C/X/V · Ctrl+Z/Y', 'copiar · cortar · pegar · deshacer'], ['Ctrl+D / Ctrl+R', 'rellenar abajo / derecha'],
                ['Ctrl+A · Shift+Espacio', 'todo · fila (Ctrl+Espacio: columna)'], ['Ctrl+Home / Ctrl+End', 'A1 · última usada'],
                ['F5 · Ctrl+F / Ctrl+H', 'ir a · buscar / reemplazar'], ['Alt+= · Ctrl+` · F9', 'autosuma · ver fórmulas · recalcular'],
                ['F4', 'ciclar $A$1 en fórmula'], ['Ctrl+B/I/U · Ctrl+S/O', 'formato · guardar / abrir'],
                ['Ctrl+flechas · PgUp/PgDn', 'saltos · pantallas'], ['Supr', 'borrar selección'],
              ].map(([a, b]) => <div key={a} style={{ padding: '3px 0', borderBottom: `1px solid ${pal.border}` }}><b style={{ color: pal.accent }}>{a}</b><br /><span style={{ color: pal.dim }}>{b}</span></div>)}
            </div>
            <p style={{ color: pal.faint, fontSize: 11, lineHeight: 1.5 }}>Fórmulas: suma media mediana moda minimo maximo desv contar producto · + - * / ^ · sin cos tan · <b>$A$1</b> fija al rellenar · mundo vivo: <code>theta base hyp area o_x…</code> (subrayado punteado morado).</p>
          </div>
        </div>
      )}
      <div ref={fxRef} style={{ display: 'none' }} />
    </div>
  );

  if (expanded) {
    return (
      <div style={{ position: 'fixed', inset: 12, zIndex: 80, border: `1px solid ${pal.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', background: pal.panelBg }}>
        {grid}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1 }}>
      {grid}
      <SectionTitle>Viva y conectada</SectionTitle>
      <div style={{ color: pal.faint, fontSize: 10.5, padding: '0 10px 10px', lineHeight: 1.5 }}>
        Lee la figura en vivo (<code>=theta</code>) y escribe con 🔗. Pulsa <b>?</b> para ver todos los atajos.
      </div>
    </div>
  );
}
