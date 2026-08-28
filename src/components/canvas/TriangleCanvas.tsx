import { useEffect, useRef, type ReactNode } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { niceGridStep, screenToWorld, worldToScreen } from '../../utils/coordinateTransform';
import { InteractionLayer } from './InteractionLayer';

const C = { bg: '#0d1117', grid: '#161b22', axis: '#30363d', text: '#8b949e', angle: '#fbbf24' };
const fmt = (n: number) => `${Number(n.toFixed(2))}`;

export function TriangleCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const s = useCanvasStore();
  const { camera: cam, viewport, points, segments, measures, hoverId, dragId, snapBadge, selectedId, pulseId } = s;

  useEffect(() => {
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

  // ── Grilla adaptativa + ejes ──
  const step = niceGridStep(cam.zoom, 64);
  const dec = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
  const tl = screenToWorld({ x: 0, y: 0 }, cam);
  const br = screenToWorld({ x: viewport.w, y: viewport.h }, cam);
  const o = worldToScreen({ x: 0, y: 0 }, cam);
  const gridEls: ReactNode[] = [];
  for (let i = Math.ceil(tl.x / step); i * step <= br.x; i++) {
    const x = i * step;
    const sx = worldToScreen({ x, y: 0 }, cam).x;
    gridEls.push(<line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={viewport.h} stroke={x === 0 ? C.axis : C.grid} />);
    if (x !== 0) gridEls.push(<text key={`vt${i}`} x={sx + 4} y={Math.min(Math.max(o.y, 10), viewport.h - 16) + 14} fill={C.text} fontSize={10}>{x.toFixed(dec)}</text>);
  }
  for (let i = Math.ceil(br.y / step); i * step <= tl.y; i++) {
    const y = i * step;
    const sy = worldToScreen({ x: 0, y }, cam).y;
    gridEls.push(<line key={`h${i}`} x1={0} y1={sy} x2={viewport.w} y2={sy} stroke={y === 0 ? C.axis : C.grid} />);
    if (y !== 0) gridEls.push(<text key={`ht${i}`} x={Math.min(Math.max(o.x, 4), viewport.w - 30) + 6} y={sy - 4} fill={C.text} fontSize={10}>{y.toFixed(dec)}</text>);
  }

  // ── Triángulo vivo ──
  const S = { O: worldToScreen(points.O.pos, cam), B: worldToScreen(points.B.pos, cam), A: worldToScreen(points.A.pos, cam) };
  const norm = (v: { x: number; y: number }) => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
  const u = norm({ x: S.O.x - S.B.x, y: S.O.y - S.B.y });
  const v = norm({ x: S.A.x - S.B.x, y: S.A.y - S.B.y });
  const sz = 12;
  const r = 30;
  const th = (measures.angleDeg * Math.PI) / 180;
  const lit = (id: string) => hoverId === id || selectedId === id || pulseId === id;
  const vis = (id: string) => segments.find((g) => g.id === id)?.visible ?? true;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', background: C.bg, userSelect: 'none' }}>
      <InteractionLayer>
        <svg width={viewport.w} height={viewport.h}>
          {gridEls}

          {lit('area') && (
            <polygon points={`${S.O.x},${S.O.y} ${S.B.x},${S.B.y} ${S.A.x},${S.A.y}`} fill="#38bdf8" fillOpacity={0.12} />
          )}

          {/* lados con brillo cuando el panel o la IA los señala */}
          {segments.filter((g) => g.visible).map((seg) => {
            const P = S[seg.a as 'O' | 'B' | 'A'];
            const Q = S[seg.b as 'O' | 'B' | 'A'];
            return (
              <g key={seg.id}>
                {lit(seg.id) && (
                  <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={seg.color} strokeWidth={9} strokeLinecap="round"
                        className={pulseId === seg.id ? 'glow-pulse' : undefined}
                        strokeOpacity={pulseId === seg.id ? undefined : 0.3} />
                )}
                <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={seg.color} strokeWidth={lit(seg.id) ? 3.5 : 2.5} strokeLinecap="round" />
              </g>
            );
          })}

          {/* marcador de ángulo recto en B */}
          <path d={`M ${S.B.x + u.x * sz} ${S.B.y + u.y * sz} L ${S.B.x + (u.x + v.x) * sz} ${S.B.y + (u.y + v.y) * sz} L ${S.B.x + v.x * sz} ${S.B.y + v.y * sz}`}
                fill="none" stroke={lit('angleB') ? C.angle : C.text} strokeWidth={1.5} />

          {/* arco del ángulo θ en O */}
          <path d={`M ${S.O.x + r} ${S.O.y} A ${r} ${r} 0 0 0 ${S.O.x + r * Math.cos(th)} ${S.O.y - r * Math.sin(th)}`}
                fill="none" stroke={C.angle} strokeWidth={lit('angleO') ? 3.5 : 2} />
          <text x={S.O.x + (r + 16) * Math.cos(th / 2)} y={S.O.y - (r + 16) * Math.sin(th / 2)} fill={C.angle} fontSize={13} fontFamily="monospace">
            {fmt(measures.angleDeg)}°
          </text>

          {/* labels de lados (respetan visibilidad) */}
          {vis('base') && <text x={(S.O.x + S.B.x) / 2} y={S.O.y + 20} fill="#38bdf8" fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.base)}</text>}
          {vis('height') && <text x={S.B.x + 24} y={(S.B.y + S.A.y) / 2} fill="#fb923c" fontSize={12} fontFamily="monospace">{fmt(measures.height)}</text>}
          {vis('hyp') && <text x={(S.O.x + S.A.x) / 2 - 14} y={(S.O.y + S.A.y) / 2 - 10} fill="#e2e8f0" fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.hyp)}</text>}

          {/* vértices arrastrables con letra */}
          {Object.values(points).filter((p) => p.visible).map((p) => {
            const sp = S[p.id as 'O' | 'B' | 'A'];
            const active = hoverId === p.id || dragId === p.id;
            const off = { O: { x: -18, y: 18 }, B: { x: 10, y: 18 }, A: { x: -5, y: -12 } }[p.id as 'O' | 'B' | 'A']!;
            return (
              <g key={p.id}>
                {(active || selectedId === p.id || pulseId === p.id) && (
                  <circle cx={sp.x} cy={sp.y} r={13} fill="none" stroke={selectedId === p.id ? '#fbbf24' : '#38bdf8'}
                          strokeOpacity={0.6} strokeWidth={2} className={pulseId === p.id ? 'glow-pulse' : undefined} />
                )}
                <circle cx={sp.x} cy={sp.y} r={active ? 8 : 6} fill={C.bg} stroke="#e2e8f0" strokeWidth={2.5} />
                <text x={sp.x + off.x} y={sp.y + off.y} fill="#8b949e" fontSize={12} fontFamily="monospace">{p.id}</text>
              </g>
            );
          })}
        </svg>
      </InteractionLayer>

      {snapBadge && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#111', fontWeight: 700, fontFamily: 'monospace', padding: '4px 14px', borderRadius: 999, fontSize: 15, pointerEvents: 'none' }}>
          ⚡ {snapBadge.label}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, left: 12, color: C.text, fontSize: 11, pointerEvents: 'none' }}>
        arrastra los vértices · rueda/pinch = zoom · doble clic = encuadrar
      </div>
    </div>
  );
}