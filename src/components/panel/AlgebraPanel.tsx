import { useState, type ReactNode } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;
const nums = (t: string) => (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);

const H = ({ children }: { children: ReactNode }) => (
  <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 1.5, padding: '8px 10px 2px', textTransform: 'uppercase' }}>{children}</div>
);

function EditValue({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (!editing) return (
    <span onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Clic para editar" style={{ color: '#8b949e', cursor: 'text', borderBottom: '1px dashed #3b4654' }}> = {value}</span>
  );
  return (
    <input
      autoFocus defaultValue={value}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter') { onCommit((e.target as HTMLInputElement).value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
      onBlur={(e) => { onCommit(e.target.value); setEditing(false); }}
      style={{ width: 90, background: '#111826', border: '1px solid #38bdf8', borderRadius: 4, color: '#e2e8f0', fontSize: 11.5, fontFamily: 'monospace', padding: '1px 4px' }}
    />
  );
}

function Row({ id, swatch, title, value, onCommit, canHide }: {
  id: string; swatch: ReactNode; title: string; value?: string; onCommit?: (v: string) => void; canHide?: boolean;
}) {
  const hoverId = useCanvasStore((s) => s.hoverId);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const pulseId = useCanvasStore((s) => s.pulseId);
  const setHover = useCanvasStore((s) => s.setHover);
  const setSelected = useCanvasStore((s) => s.setSelected);
  const visible = useCanvasStore((s) => {
    const p = s.points[id];
    const g = s.segments.find((x) => x.id === id);
    const c = s.circles.find((x) => x.id === id);
    const obj = p ?? g ?? c;
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
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
        outline: selectedId === id ? '1px solid rgba(56,189,248,0.5)' : 'none',
        fontFamily: 'monospace', fontSize: 12.5, color: '#e2e8f0', opacity: visible ? 1 : 0.4,
      }}
    >
      {swatch}
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
        {value !== undefined && (onCommit
          ? <EditValue value={value} onCommit={onCommit} />
          : <span style={{ color: '#8b949e' }}> = {value}</span>)}
      </span>
      {canHide && (
        <button
          onClick={(e) => { e.stopPropagation(); useCanvasStore.getState().toggleVisible(id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: visible ? 0.9 : 0.35, fontSize: 13, padding: 0 }}
          title={visible ? 'Ocultar' : 'Mostrar'}
        >👁</button>
      )}
    </div>
  );
}

export function AlgebraPanel() {
  const points = useCanvasStore((s) => s.points);
  const segments = useCanvasStore((s) => s.segments);
  const circles = useCanvasStore((s) => s.circles);
  const m = useCanvasStore((s) => s.measures);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);
  const chain = useCanvasStore((s) => s.chain);
  const pulse = useCanvasStore((s) => s.pulse);
  const [open, setOpen] = useState(true);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{ width: 30, borderRight: '1px solid #1f2630', background: '#0a0e14', color: '#8b949e', cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}
    >ÁLGEBRA</button>
  );

  const st = () => useCanvasStore.getState();

  return (
    <aside style={{ width: 272, borderRight: '1px solid #1f2630', background: '#0a0e14', padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
        <strong style={{ fontSize: 13, letterSpacing: 1 }}>ÁLGEBRA</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>⟨</button>
      </div>
      <div style={{ padding: '0 10px 6px', color: '#64748b', fontSize: 10.5 }}>Los valores con guion son editables ✏️</div>

      <H>Puntos</H>
      {Object.values(points).map((p) => (
        <Row key={p.id} id={p.id} canHide
          swatch={<span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0a0e14', border: '2px solid #e2e8f0', flexShrink: 0 }} />}
          title={p.id}
          value={`(${fmt(p.pos.x)}, ${fmt(p.pos.y)})`}
          onCommit={(v) => { const n = nums(v); if (n.length >= 2) st().setPointPos(p.id, n[0], n[1]); }} />
      ))}

      <H>Segmentos</H>
      {segments.map((g) => {
        const pa = points[g.a]?.pos, pb = points[g.b]?.pos;
        const len = pa && pb ? Math.hypot(pb.x - pa.x, pb.y - pa.y) : 0;
        return (
          <Row key={g.id} id={g.id} canHide
            swatch={<span style={{ width: 14, height: 3, background: g.color, borderRadius: 2, flexShrink: 0 }} />}
            title={`${g.id} = Seg(${g.a}, ${g.b})`}
            value={fmt(len)}
            onCommit={(v) => { const n = nums(v); if (n.length) st().setSegmentLen(g.id, n[0]); }} />
        );
      })}

      {circles.length > 0 && (
        <>
          <H>Círculos</H>
          {circles.map((c) => (
            <Row key={c.id} id={c.id} canHide
              swatch={<span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #94a3b8', flexShrink: 0 }} />}
              title={`${c.id} = Círc(${c.c})`} value={`r ${fmt(c.r)}`} />
          ))}
        </>
      )}

      {hasTriangle ? (
        <>
          <H>Medidas</H>
          <Row id="angleO" swatch={<span style={{ color: '#fbbf24' }}>∠</span>} title="θ (en O)" value={`${fmt(m.angleDeg)}°`}
            onCommit={chain ? (v) => { const n = nums(v); if (n.length) st().setAngleDeg(n[0]); } : undefined} />
          <Row id="angleB" swatch={<span style={{ color: '#fbbf24' }}>∟</span>} title="ángulo en B" value={`${fmt(m.angleB)}°`} />
          <Row id="angleA" swatch={<span style={{ color: '#fbbf24' }}>∠</span>} title="α (en A)" value={`${fmt(m.angleA)}°`} />
          <Row id="area" swatch={<span style={{ color: '#38bdf8' }}>▦</span>} title="área" value={fmt(m.area)} />
          <button onClick={() => { pulse('hyp', 1400); setTimeout(() => pulse('angleO', 1400), 1500); setTimeout(() => pulse('area', 1400), 3000); }}
            style={{ margin: '10px 10px 4px', padding: 8, borderRadius: 8, border: '1px solid #1f2630', background: '#111826', color: '#38bdf8', cursor: 'pointer', fontSize: 12 }}>
            ✨ Simular IA: «mira la figura»
          </button>
          <div style={{ padding: '8px 10px', color: '#64748b', fontSize: 11, fontFamily: 'monospace', borderTop: '1px solid #141a23', marginTop: 6 }}>
            {fmt(m.angleDeg)}° + {fmt(m.angleB)}° + {fmt(m.angleA)}° = 180° ✔
          </div>
        </>
      ) : (
        <div style={{ padding: '10px', color: '#64748b', fontSize: 11.5, lineHeight: 1.5 }}>
          Este mundo no tiene triángulo O-B-A.<br />Usa 🧹 para volver, o construye con 🛠.
        </div>
      )}
    </aside>
  );
}