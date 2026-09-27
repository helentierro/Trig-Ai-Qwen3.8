// src/components/panel/AlgebraPanel.tsx — Fase H: valores vivos y editables garantizados
import { useState, type ReactNode } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';
import { trigSummary } from '../../utils/geometry';
import { SectionTitle } from '../ui/primitives';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;
const nums = (t: string) => (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const displayName = (id: string) => (id === 'height' ? 'altura' : id);

function EditValue({ id, value, onCommit }: { id: string; value: string; onCommit: (v: string) => void }) {
  const pal = usePal();
  const [editing, setEditing] = useState(false);
  if (!editing) return (
    <span data-testid={`val-${id}`}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Clic para editar"
      style={{ color: pal.dim, cursor: 'text', borderBottom: `1px dashed ${pal.accent}` }}>
      {' '}= {value} <span style={{ opacity: 0.6, fontSize: 10 }}>✎</span>
    </span>
  );
  return (
    <input
      autoFocus defaultValue={value}
      data-testid={`edit-${id}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { onCommit((e.target as HTMLInputElement).value); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      onBlur={(e) => { onCommit(e.target.value); setEditing(false); }}
      style={{ width: 96, background: pal.card, border: `1px solid ${pal.accent}`, borderRadius: 4, color: pal.bubbleText, fontSize: 11.5, fontFamily: 'monospace', padding: '1px 4px' }}
    />
  );
}

function Row({ id, swatch, title, value, onCommit, canHide }: {
  id: string; swatch: ReactNode; title: string; value?: string; onCommit?: (v: string) => void; canHide?: boolean;
}) {
  const pal = usePal();
  const hoverId = useCanvasStore((s) => s.hoverId);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const pulseId = useCanvasStore((s) => s.pulseId);
  const setHover = useCanvasStore((s) => s.setHover);
  const setSelected = useCanvasStore((s) => s.setSelected);
  const visible = useCanvasStore((s) => {
    const obj = s.points[id] ?? s.segments.find((x) => x.id === id) ?? s.circles.find((x) => x.id === id);
    return obj ? obj.visible : true;
  });
  const active = hoverId === id || selectedId === id || pulseId === id;
  return (
    <div
      data-testid={`row-${id}`}
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      onClick={() => setSelected(selectedId === id ? null : id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, cursor: 'pointer',
        background: active ? 'rgba(56,189,248,0.10)' : 'transparent',
        border: active ? `1px solid ${pal.accent}` : '1px solid transparent',
        fontFamily: 'monospace', fontSize: 12.5, color: pal.bubbleText, opacity: visible ? 1 : 0.42,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 18 }}>{swatch}</div>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {title}
        {value !== undefined && (onCommit
          ? <EditValue id={id} value={value} onCommit={onCommit} />
          : <span style={{ color: pal.dim }}> = {value}</span>)}
      </span>
      {canHide && (
        <button
          onClick={(e) => { e.stopPropagation(); useCanvasStore.getState().toggleVisible(id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: visible ? 0.85 : 0.35, fontSize: 12.5, padding: 0, color: pal.dim }}
          title={visible ? 'Ocultar' : 'Mostrar'}
        >👁</button>
      )}
    </div>
  );
}

export function AlgebraBody() {
  const pal = usePal();
  const points = useCanvasStore((s) => s.points);
  const segments = useCanvasStore((s) => s.segments);
  const circles = useCanvasStore((s) => s.circles);
  const m = useCanvasStore((s) => s.measures);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);
  const chain = useCanvasStore((s) => s.chain);
  const pulse = useCanvasStore((s) => s.pulse);
  const st = () => useCanvasStore.getState();
  const trig = trigSummary(m);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px 0' }}>
      <div style={{ padding: '2px 8px 8px', color: pal.faint, fontSize: 10.5, lineHeight: 1.5 }}>
        Todo valor con ✎ es editable: escribes y la figura se mueve. Todo se actualiza EN VIVO.
      </div>

      <SectionTitle>Puntos</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.values(points).map((p) => (
          <Row key={p.id} id={p.id} canHide
            swatch={<span style={{ width: 10, height: 10, borderRadius: '50%', background: pal.panelBg, border: `2px solid ${pal.point}`, boxShadow: `0 0 0 2px ${pal.accent}20`, flexShrink: 0 }} />}
            title={p.id}
            value={`(${fmt(p.pos.x)}, ${fmt(p.pos.y)})`}
            onCommit={(v) => { const n = nums(v); if (n.length >= 2) st().setPointPos(p.id, n[0], n[1]); }} />
        ))}
      </div>

      <SectionTitle>Segmentos</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {segments.map((g) => {
          const pa = points[g.a]?.pos, pb = points[g.b]?.pos;
          const len = pa && pb ? Math.hypot(pb.x - pa.x, pb.y - pa.y) : 0;
          return (
            <Row key={g.id} id={g.id} canHide
              swatch={<span style={{ width: 18, height: 3, background: g.color, borderRadius: 999, flexShrink: 0 }} />}
              title={`${displayName(g.id)} = Seg(${g.a}, ${g.b})`}
              value={fmt(len)}
              onCommit={(v) => { const n = nums(v); if (n.length) st().setSegmentLen(g.id, n[0]); }} />
          );
        })}
      </div>

      {circles.length > 0 && (
        <>
          <SectionTitle>Círculos</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {circles.map((c) => (
              <Row key={c.id} id={c.id} canHide
                swatch={<span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${pal.free}`, display: 'inline-block', flexShrink: 0 }} />}
                title={`${c.id} = Círc(${c.c})`} value={`r ${fmt(c.r)}`} />
            ))}
          </div>
        </>
      )}

      {hasTriangle ? (
        <>
          <SectionTitle>Medidas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Row id="angleO" swatch={<span style={{ color: pal.angle, fontSize: 16 }}>∠</span>} title="θ (en O)" value={`${fmt(m.angleDeg)}°`}
              onCommit={chain ? (v) => { const n = nums(v); if (n.length) st().setAngleDeg(n[0]); } : undefined} />
            <Row id="angleB" swatch={<span style={{ color: pal.angle, fontSize: 16 }}>∟</span>} title="ángulo en B" value={`${fmt(m.angleB)}°`} />
            <Row id="angleA" swatch={<span style={{ color: pal.angle, fontSize: 16 }}>∠</span>} title="α (en A)" value={`${fmt(m.angleA)}°`} />
            <Row id="area" swatch={<span style={{ color: pal.accent, fontSize: 16 }}>▦</span>} title="área" value={fmt(m.area)} />
          </div>

          <div style={{ marginTop: 8, padding: '10px 10px 6px', borderTop: `1px solid ${pal.border}`, display: 'grid', gap: 6 }}>
            <div style={{ color: pal.faint, fontSize: 11, fontFamily: 'monospace' }}>
              {fmt(m.angleDeg)}° + {fmt(m.angleB)}° + {fmt(m.angleA)}° = 180° ✔
            </div>
            <div style={{ display: 'grid', gap: 4, color: pal.bubbleText, fontSize: 11.5, fontFamily: 'monospace' }}>
              <div>sin(θ) = op / hip = {fmt(m.height)} / {fmt(m.hyp)} = {trig.sin.toFixed(3)}</div>
              <div>cos(θ) = ady / hip = {fmt(m.base)} / {fmt(m.hyp)} = {trig.cos.toFixed(3)}</div>
              <div>tan(θ) = op / ady = {fmt(m.height)} / {fmt(m.base)} = {trig.tan.toFixed(3)}</div>
            </div>
          </div>

          <button onClick={() => { pulse('hyp', 1400); setTimeout(() => pulse('angleO', 1400), 1500); setTimeout(() => pulse('area', 1400), 3000); }}
            style={{ margin: '10px 8px 2px', padding: '9px 12px', borderRadius: 10, border: `1px solid ${pal.border}`, background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(167,139,250,0.08))', color: pal.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            ✨ Simular IA: «mira la figura»
          </button>
        </>
      ) : (
        <div style={{ padding: '12px 10px 0', color: pal.faint, fontSize: 11.5, lineHeight: 1.6 }}>
          Este mundo no tiene triángulo O-B-A.<br />Usa 🧹 para volver, o construye con 🛠.
        </div>
      )}
    </div>
  );
}

export function AlgebraPanel() {
  const pal = usePal();
  const [open, setOpen] = useState(true);
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: 30, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, color: pal.dim, cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}>
      ÁLGEBRA
    </button>
  );
  return (
    <aside style={{ width: 272, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, padding: '10px 8px 0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
        <strong style={{ fontSize: 13, letterSpacing: 1, color: pal.bubbleText }}>ÁLGEBRA</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer', fontSize: 16 }}>⟨</button>
      </div>
      <AlgebraBody />
    </aside>
  );
}