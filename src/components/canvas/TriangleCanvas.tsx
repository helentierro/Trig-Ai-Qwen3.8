// src/components/canvas/TriangleCanvas.tsx — Entrega 3: selectores + botón cancelar
import { useEffect, useRef } from 'react';
import { useCanvasStore, initDefaultWorld } from '../../stores/canvasStore';
import { useThemeStore, usePal } from '../../stores/themeStore';
import { worldToScreen } from '../../utils/coordinateTransform';
import { cancelScene } from '../../services/scenePlayer';
import { InteractionLayer } from './InteractionLayer';
import { ToolPalette } from './ToolPalette';
import { ContextMenu } from './ContextMenu';
import { GridLayer } from './layers/GridLayer';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

export function TriangleCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Entrega 3: selectores individuales → solo re-renderiza lo que cambió
  const cam = useCanvasStore((s) => s.camera);
  const viewport = useCanvasStore((s) => s.viewport);
  const points = useCanvasStore((s) => s.points);
  const segments = useCanvasStore((s) => s.segments);
  const circles = useCanvasStore((s) => s.circles);
  const measures = useCanvasStore((s) => s.measures);
  const hoverId = useCanvasStore((s) => s.hoverId);
  const dragId = useCanvasStore((s) => s.dragId);
  const snapBadge = useCanvasStore((s) => s.snapBadge);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const pulseId = useCanvasStore((s) => s.pulseId);
  const drawn = useCanvasStore((s) => s.drawn);
  const aiCursor = useCanvasStore((s) => s.aiCursor);
  const subtitle = useCanvasStore((s) => s.subtitle);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);
  const pending = useCanvasStore((s) => s.pending);
  const cursorWorld = useCanvasStore((s) => s.cursorWorld);
  const tool = useCanvasStore((s) => s.tool);
  const gridStyle = useCanvasStore((s) => s.gridStyle);
  const playing = useCanvasStore((s) => s.playing);
  const resolved = useThemeStore((t) => t.resolved);
  const C = usePal();

  useEffect(() => {
    initDefaultWorld();
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const st = useCanvasStore.getState();
      const first = st.viewport.w === 0;
      st.setViewport(r.width, r.height);
      if (first) st.fitView();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ink = (color: string) => (resolved === 'light' && color === '#e2e8f0' ? '#334155' : color);
  const SP: Record<string, { x: number; y: number }> = {};
  Object.values(points).forEach((p) => { if (p.id) SP[p.id] = worldToScreen(p.pos, cam); });
  const tri = hasTriangle && !!SP.O && !!SP.B && !!SP.A;
  const norm = (v: { x: number; y: number }) => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
  const u = tri ? norm({ x: SP.O.x - SP.B.x, y: SP.O.y - SP.B.y }) : { x: 0, y: 0 };
  const v = tri ? norm({ x: SP.A.x - SP.B.x, y: SP.A.y - SP.B.y }) : { x: 0, y: 0 };
  const sz = 12, r = 30;
  const lit = (id: string) => hoverId === id || selectedId === id || pulseId === id;
  const vis = (id: string) => segments.find((g) => g.id === id)?.visible ?? true;
  const done = (drawn['hyp'] ?? 1) >= 1;

  const angleArc = () => {
    if (!tri || !done) return null;
    const a1 = Math.atan2(-(SP.B.y - SP.O.y), SP.B.x - SP.O.x);
    const a2 = Math.atan2(-(SP.A.y - SP.O.y), SP.A.x - SP.O.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const sweep = d > 0 ? 0 : 1;
    const p1 = { x: SP.O.x + r * Math.cos(a1), y: SP.O.y - r * Math.sin(a1) };
    const p2 = { x: SP.O.x + r * Math.cos(a2), y: SP.O.y - r * Math.sin(a2) };
    const am = a1 + d / 2;
    return (
      <>
        <path d={`M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`} fill="none" stroke={C.angle} strokeWidth={lit('angleO') ? 3.5 : 2} />
        <text x={SP.O.x + (r + 16) * Math.cos(am)} y={SP.O.y - (r + 16) * Math.sin(am)} fill={C.angle} fontSize={13} fontFamily="monospace">
          {fmt(measures.angleDeg)}°
        </text>
      </>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', background: C.bg, userSelect: 'none' }}>
      <InteractionLayer>
        <svg width={viewport.w} height={viewport.h} style={{ shapeRendering: 'geometricPrecision' }}>
          <GridLayer cam={cam} vp={viewport} style={gridStyle} pal={C} />
          {tri && done && lit('area') && (
            <polygon points={`${SP.O.x},${SP.O.y} ${SP.B.x},${SP.B.y} ${SP.A.x},${SP.A.y}`} fill="#38bdf8" fillOpacity={0.12} />
          )}
          {circles.filter((c) => c.visible && SP[c.c]).map((c) => (
            <circle key={c.id} cx={SP[c.c].x} cy={SP[c.c].y} r={Math.max(1, c.r * cam.zoom)}
              fill="none" stroke={C.free} strokeWidth={lit(c.id) ? 3 : 1.5} />
          ))}
          {segments.filter((g) => g.visible && SP[g.a] && SP[g.b] && (drawn[g.id] ?? 1) > 0).map((seg) => {
            const P = SP[seg.a];
            const Qf = SP[seg.b];
            const t = drawn[seg.id] ?? 1;
            const Q = { x: P.x + (Qf.x - P.x) * t, y: P.y + (Qf.y - P.y) * t };
            const col = ink(seg.color);
            return (
              <g key={seg.id}>
                {t >= 1 && lit(seg.id) && (
                  <line x1={P.x} y1={P.y} x2={Qf.x} y2={Qf.y} stroke={col} strokeWidth={9} strokeLinecap="round"
                    className={pulseId === seg.id ? 'glow-pulse' : undefined}
                    strokeOpacity={pulseId === seg.id ? undefined : 0.3} />
                )}
                <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={col} strokeWidth={t >= 1 && lit(seg.id) ? 3.5 : 3} strokeLinecap="round" />
              </g>
            );
          })}
          {pending.length > 0 && cursorWorld && SP[pending[0]] && (
            <line x1={SP[pending[0]].x} y1={SP[pending[0]].y}
              x2={worldToScreen(cursorWorld, cam).x} y2={worldToScreen(cursorWorld, cam).y}
              stroke={C.ia} strokeDasharray="5 5" strokeWidth={1.5} />
          )}
          {tri && done && measures.rightAngle && (
            <path d={`M ${SP.B.x + u.x * sz} ${SP.B.y + u.y * sz} L ${SP.B.x + (u.x + v.x) * sz} ${SP.B.y + (u.y + v.y) * sz} L ${SP.B.x + v.x * sz} ${SP.B.y + v.y * sz}`}
              fill="none" stroke={lit('angleB') ? C.angle : C.text} strokeWidth={1.5} />
          )}
          {angleArc()}
          {tri && done && vis('base') && <text x={(SP.O.x + SP.B.x) / 2} y={SP.O.y + 20} fill="#38bdf8" fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.base)}</text>}
          {tri && done && vis('height') && <text x={SP.B.x + 24} y={(SP.B.y + SP.A.y) / 2} fill={resolved === 'light' ? '#c2410c' : '#fb923c'} fontSize={12} fontFamily="monospace">{fmt(measures.height)}</text>}
          {tri && done && vis('hyp') && <text x={(SP.O.x + SP.A.x) / 2 - 14} y={(SP.O.y + SP.A.y) / 2 - 10} fill={ink('#e2e8f0')} fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.hyp)}</text>}
          {Object.values(points).filter((p) => p.visible && p.id && SP[p.id] && (drawn[p.id] ?? 1) > 0).map((p) => {
            const sp = SP[p.id];
            const pop = drawn[p.id] ?? 1;
            const active = hoverId === p.id || dragId === p.id;
            const off = { O: { x: -18, y: 18 }, B: { x: 10, y: 24 }, A: { x: -5, y: -12 } }[p.id as 'O' | 'B' | 'A'] ?? { x: 8, y: -12 };
            return (
              <g key={p.id}>
                {(active || selectedId === p.id || pulseId === p.id) && (
                  <circle cx={sp.x} cy={sp.y} r={13} fill="none" stroke={selectedId === p.id ? C.sel : C.hov}
                    strokeOpacity={0.6} strokeWidth={2} className={pulseId === p.id ? 'glow-pulse' : undefined} />
                )}
                <circle data-testid={`pt-${p.id}`} cx={sp.x} cy={sp.y} r={(active ? 8 : 6) * pop} fill={C.bg} stroke={p.locked ? '#fbbf24' : C.point} strokeWidth={2.5} />
                {/* Diana invisible: el hit usa el DOM real, nunca matemática duplicada */}
                <circle data-hit={p.id} cx={sp.x} cy={sp.y} r={16} fill="transparent" />
                {pop >= 1 && p.showLabel && <text data-hit={p.id} x={sp.x + off.x} y={sp.y + off.y} fill={C.text} fontSize={12} fontFamily="monospace">{p.id}</text>}
                {p.locked && <text x={sp.x + 10} y={sp.y - 10} fontSize={11}>🔒</text>}
              </g>
            );
          })}
          {aiCursor.visible && (() => {
            const c = worldToScreen(aiCursor.pos, cam);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <path d={`M ${c.x} ${c.y} l 14 5 l -8 3 l -3 8 Z`} fill={C.ia} stroke="#fff" strokeWidth={1} />
                <text x={c.x + 16} y={c.y + 20} fill={C.ia} fontSize={11} fontFamily="monospace" fontWeight={700}>IA</text>
              </g>
            );
          })()}
        </svg>
      </InteractionLayer>
      <ToolPalette />
      <ContextMenu />
      {playing && (
        <button onClick={cancelScene}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 6, padding: '8px 16px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.card, color: '#f87171',
            fontWeight: 800, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>
          ⏹ Cancelar
        </button>
      )}
      {subtitle && (
        <div key={subtitle} className="subtitle" style={{
          position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)',
          background: C.bubbleBg, border: `1px solid ${C.bubbleBorder}`, color: C.bubbleText,
          padding: '8px 14px', borderRadius: 12, fontSize: 13, maxWidth: '70%', pointerEvents: 'none',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ color: C.ia, fontWeight: 700 }}>IA</span> {subtitle}
        </div>
      )}
      {snapBadge && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#111', fontWeight: 700, fontFamily: 'monospace', padding: '4px 14px', borderRadius: 999, fontSize: 15, pointerEvents: 'none' }}>
          ⚡ {snapBadge.label}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, left: 12, color: C.text, fontSize: 11, pointerEvents: 'none' }}>
        {tool === 'move' ? 'clic = menú del punto · arrastrar = mover · clic derecho = estilo de vista'
          : tool === 'point' ? '📍 clic en el vacío crea un punto · Esc = mover'
          : tool === 'segment' ? '📏 clic en dos puntos para unirlos · Esc = cancelar'
          : '⭕ clic en el centro y clic en el radio · Esc = cancelar'}
      </div>
    </div>
  );
}