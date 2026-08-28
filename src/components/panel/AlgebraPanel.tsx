import { useState, type ReactNode } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

const H = ({ children }: { children: ReactNode }) => (
  <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 1.5, padding: '8px 10px 2px', textTransform: 'uppercase' }}>{children}</div>
);

function Row({ id, swatch, title, value, canHide }: {
  id: string; swatch: ReactNode; title: string; value?: string; canHide?: boolean;
}) {
  const hoverId = useCanvasStore((s) => s.hoverId);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const pulseId = useCanvasStore((s) => s.pulseId);
  const setHover = useCanvasStore((s) => s.setHover);
  const setSelected = useCanvasStore((s) => s.setSelected);
  const visible = useCanvasStore((s) => {
    const p = s.points[id];
    const g = s.segments.find((x) => x.id === id);
    return p ? p.visible : g ? g.visible : true;
  });
  const active = hoverId === id || selectedId === id || pulseId === id;

  return (
    <div
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
        {title}{value !== undefined && <span style={{ color: '#8b949e' }}> = {value}</span>}
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
  const m = useCanvasStore((s) => s.measures);
  const pulse = useCanvasStore((s) => s.pulse);
  const [open, setOpen] = useState(true);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{ width: 30, borderRight: '1px solid #1f2630', background: '#0a0e14', color: '#8b949e', cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}
    >ÁLGEBRA</button>
  );

  const len: Record<string, number> = { base: m.base, height: m.height, hyp: m.hyp };
  const demoIA = () => {
    pulse('hyp', 1400);
    setTimeout(() => pulse('angleO', 1400), 1500);
    setTimeout(() => pulse('area', 1400), 3000);
  };

  return (
    <aside style={{ width: 272, borderRight: '1px solid #1f2630', background: '#0a0e14', padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
        <strong style={{ fontSize: 13, letterSpacing: 1 }}>ÁLGEBRA</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>⟨</button>
      </div>

      <H>Puntos</H>
      {Object.values(points).map((p) => (
        <Row key={p.id} id={p.id} canHide
          swatch={<span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0a0e14', border: '2px solid #e2e8f0', flexShrink: 0 }} />}
          title={`${p.id} = (${fmt(p.pos.x)}, ${fmt(p.pos.y)})`} />
      ))}

      <H>Segmentos</H>
      {segments.map((g) => (
        <Row key={g.id} id={g.id} canHide
          swatch={<span style={{ width: 14, height: 3, background: g.color, borderRadius: 2, flexShrink: 0 }} />}
          title={`${g.id} = Seg(${g.a}, ${g.b})`} value={fmt(len[g.id])} />
      ))}

      <H>Medidas</H>
      <Row id="angleO" swatch={<span style={{ color: '#fbbf24' }}>∠</span>} title="θ (en O)" value={`${fmt(m.angleDeg)}°`} />
      <Row id="angleB" swatch={<span style={{ color: '#fbbf24' }}>∟</span>} title="ángulo en B" value="90°" />
      <Row id="angleA" swatch={<span style={{ color: '#fbbf24' }}>∠</span>} title="α (en A)" value={`${fmt(90 - m.angleDeg)}°`} />
      <Row id="area" swatch={<span style={{ color: '#38bdf8' }}>▦</span>} title="área" value={fmt(m.area)} />

      <button onClick={demoIA} style={{ margin: '10px 10px 4px', padding: 8, borderRadius: 8, border: '1px solid #1f2630', background: '#111826', color: '#38bdf8', cursor: 'pointer', fontSize: 12 }}>
        ✨ Simular IA: «mira la figura»
      </button>

      <div style={{ padding: '8px 10px', color: '#64748b', fontSize: 11, fontFamily: 'monospace', borderTop: '1px solid #141a23', marginTop: 6 }}>
        {fmt(m.angleDeg)}° + 90° + {fmt(90 - m.angleDeg)}° = 180° ✔
      </div>
    </aside>
  );
}