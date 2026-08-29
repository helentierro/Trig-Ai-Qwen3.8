// src/components/canvas/TriangleCanvas.tsx
import { useEffect, useRef, type ReactNode } from 'react';
import { useCanvasStore, initDefaultWorld, type GridStyle } from '../../stores/canvasStore';
import { useThemeStore } from '../../stores/themeStore';
import { type Camera, niceGridStep, screenToWorld, worldToScreen, fmtCoord } from '../../utils/coordinateTransform';
import { InteractionLayer } from './InteractionLayer';
import { ToolPalette } from './ToolPalette';
import { ContextMenu } from './ContextMenu';

interface Pal {
  bg: string; grid: string; axis: string; text: string; point: string;
  angle: string; ia: string; free: string; sel: string; hov: string;
  bubbleBg: string; bubbleBorder: string; bubbleText: string;
}
const PALS: Record<'dark' | 'light', Pal> = {
  dark: {
    bg: '#0d1117', grid: '#161b22', axis: '#30363d', text: '#8b949e', point: '#e2e8f0',
    angle: '#fbbf24', ia: '#a78bfa', free: '#94a3b8', sel: '#fbbf24', hov: '#38bdf8',
    bubbleBg: 'rgba(17,24,38,0.92)', bubbleBorder: '#2b3648', bubbleText: '#e2e8f0',
  },
  light: {
    bg: '#ffffff', grid: '#eef2f7', axis: '#c9d2dc', text: '#61708b', point: '#1f2937',
    angle: '#b45309', ia: '#7c3aed', free: '#64748b', sel: '#b45309', hov: '#0284c7',
    bubbleBg: 'rgba(255,255,255,0.95)', bubbleBorder: '#d7dee8', bubbleText: '#1f2937',
  },
};

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

/* Números de eje que NUNCA desaparecen: se pegan al borde visible (como GeoGebra). */
function axisNumbers(cam: Camera, vp: { w: number; h: number }, step: number, pal: Pal): ReactNode[] {
  const els: ReactNode[] = [];
  const tl = screenToWorld({ x: 0, y: 0 }, cam);
  const br = screenToWorld({ x: vp.w, y: vp.h }, cam);
  const o = worldToScreen({ x: 0, y: 0 }, cam);
  const dec = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
  const ny = Math.min(Math.max(o.y, 10), vp.h - 16) + 14;
  const nx = Math.min(Math.max(o.x, 4), vp.w - 34) + 6;
  for (let i = Math.ceil(tl.x / step); i * step <= br.x; i++) {
    const x = i * step;
    if (x === 0) continue;
    const sx = worldToScreen({ x, y: 0 }, cam).x;
    els.push(<text key={`vt${i}`} x={sx + 4} y={ny} fill={pal.text} fontSize={10}>{fmtCoord(x)}</text>);
  }
  for (let i = Math.ceil(br.y / step); i * step <= tl.y; i++) {
    const y = i * step;
    if (y === 0) continue;
    const sy = worldToScreen({ x: 0, y }, cam).y;
    els.push(<text key={`ht${i}`} x={nx} y={sy - 4} fill={pal.text} fontSize={10}>{fmtCoord(y)}</text>);
  }
  return els;
}

function axesLines(cam: Camera, vp: { w: number; h: number }, pal: Pal): ReactNode[] {
  const o = worldToScreen({ x: 0, y: 0 }, cam);
  return [
    <line key="axV" x1={o.x} y1={0} x2={o.x} y2={vp.h} stroke={pal.axis} />,
    <line key="axH" x1={0} y1={o.y} x2={vp.w} y2={o.y} stroke={pal.axis} />,
  ];
}

/* 5 estilos de cuadrícula, todos adaptativos al zoom (feature 4–4.4). */
function gridElements(style: GridStyle, cam: Camera, vp: { w: number; h: number }, pal: Pal): ReactNode[] {
  const els: ReactNode[] = [];
  const tl = screenToWorld({ x: 0, y: 0 }, cam);
  const br = screenToWorld({ x: vp.w, y: vp.h }, cam);
  const o = worldToScreen({ x: 0, y: 0 }, cam);

  if (style === 'blank') return [...axesLines(cam, vp, pal), ...axisNumbers(cam, vp, niceGridStep(cam.zoom, 64), pal)];

  if (style === 'circular') {
    const step = niceGridStep(cam.zoom, 64);
    const maxR = Math.hypot(Math.max(Math.abs(tl.x), Math.abs(br.x)), Math.max(Math.abs(tl.y), Math.abs(br.y)));
    for (let r = step; r <= maxR; r += step) {
      els.push(<circle key={`c${r}`} cx={o.x} cy={o.y} r={r * cam.zoom} fill="none" stroke={pal.grid} />);
    }
    return [...els, ...axesLines(cam, vp, pal), ...axisNumbers(cam, vp, step, pal)];
  }

  if (style === 'diamond') {
    const step = niceGridStep(cam.zoom, 64);
    for (let c = Math.ceil((tl.y - br.x) / step) * step; c <= br.y - tl.x; c += step) {
      const p1 = worldToScreen({ x: tl.x, y: tl.x + c }, cam);
      const p2 = worldToScreen({ x: br.x, y: br.x + c }, cam);
      els.push(<line key={`d1${c}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={pal.grid} />);
    }
    for (let c = Math.ceil((tl.y + tl.x) / step) * step; c <= br.y + br.x; c += step) {
      const p1 = worldToScreen({ x: tl.x, y: -tl.x + c }, cam);
      const p2 = worldToScreen({ x: br.x, y: -br.x + c }, cam);
      els.push(<line key={`d2${c}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={pal.grid} />);
    }
    return [...els, ...axesLines(cam, vp, pal), ...axisNumbers(cam, vp, step, pal)];
  }

  // fine | large
  const step = niceGridStep(cam.zoom, style === 'large' ? 170 : 64);
  for (let i = Math.ceil(tl.x / step); i * step <= br.x; i++) {
    const x = i * step;
    const sx = worldToScreen({ x, y: 0 }, cam).x;
    els.push(<line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={vp.h} stroke={x === 0 ? pal.axis : pal.grid} />);
  }
  for (let i = Math.ceil(br.y / step); i * step <= tl.y; i++) {
    const y = i * step;
    const sy = worldToScreen({ x: 0, y }, cam).y;
    els.push(<line key={`h${i}`} x1={0} y1={sy} x2={vp.w} y2={sy} stroke={y === 0 ? pal.axis : pal.grid} />);
  }
  return [...els, ...axisNumbers(cam, vp, step, pal)];
}

export function TriangleCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const s = useCanvasStore();
  const resolved = useThemeStore((t) => t.resolved);
  const C = PALS[resolved];
  const { camera: cam, viewport, points, segments, circles, measures, hoverId, dragId, snapBadge,
    selectedId, pulseId, drawn, aiCursor, subtitle, hasTriangle, pending, cursorWorld, tool, gridStyle } = s;

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

  // colores de segmentos legibles según tema (hyp blanca → tinta en claro)
  const ink = (color: string) => (resolved === 'light' && color === '#e2e8f0' ? '#334155' : color);

  const SP: Record<string, { x: number; y: number }> = {};
  Object.values(points).forEach((p) => { if (p.id) SP[p.id] = worldToScreen(p.pos, cam); });
  const tri = hasTriangle && !!SP.O && !!SP.B && !!SP.A;
  const norm = (v: { x: number; y: number }) => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
  const u = tri ? norm({ x: SP.O.x - SP.B.x, y: SP.O.y - SP.B.y }) : { x: 0, y: 0 };
  const v = tri ? norm({ x: SP.A.x - SP.B.x, y: SP.A.y - SP.B.y }) : { x: 0, y: 0 };
  const sz = 12, r = 30;
  const th = (measures.angleDeg * Math.PI) / 180;
  const lit = (id: string) => hoverId === id || selectedId === id || pulseId === id;
  const vis = (id: string) => segments.find((g) => g.id === id)?.visible ?? true;
  const done = (drawn['hyp'] ?? 1) >= 1;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', background: C.bg, userSelect: 'none' }}>
      <InteractionLayer>
        <svg width={viewport.w} height={viewport.h}>
          {gridElements(gridStyle, cam, viewport, C)}
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
                <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={col} strokeWidth={t >= 1 && lit(seg.id) ? 3.5 : 2.5} strokeLinecap="round" />
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
          {tri && done && (
            <path d={`M ${SP.O.x + r} ${SP.O.y} A ${r} ${r} 0 0 0 ${SP.O.x + r * Math.cos(th)} ${SP.O.y - r * Math.sin(th)}`}
              fill="none" stroke={C.angle} strokeWidth={lit('angleO') ? 3.5 : 2} />
          )}
          {tri && done && (
            <text x={SP.O.x + (r + 16) * Math.cos(th / 2)} y={SP.O.y - (r + 16) * Math.sin(th / 2)} fill={C.angle} fontSize={13} fontFamily="monospace">
              {fmt(measures.angleDeg)}°
            </text>
          )}
          {tri && done && vis('base') && <text x={(SP.O.x + SP.B.x) / 2} y={SP.O.y + 20} fill="#38bdf8" fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.base)}</text>}
          {tri && done && vis('height') && <text x={SP.B.x + 24} y={(SP.B.y + SP.A.y) / 2} fill={resolved === 'light' ? '#c2410c' : '#fb923c'} fontSize={12} fontFamily="monospace">{fmt(measures.height)}</text>}
          {tri && done && vis('hyp') && <text x={(SP.O.x + SP.A.x) / 2 - 14} y={(SP.O.y + SP.A.y) / 2 - 10} fill={ink('#e2e8f0')} fontSize={12} fontFamily="monospace" textAnchor="middle">{fmt(measures.hyp)}</text>}
          {Object.values(points).filter((p) => p.visible && p.id && SP[p.id] && (drawn[p.id] ?? 1) > 0).map((p) => {
            const sp = SP[p.id];
            const pop = drawn[p.id] ?? 1;
            const active = hoverId === p.id || dragId === p.id;
            const off = { O: { x: -18, y: 18 }, B: { x: 10, y: 18 }, A: { x: -5, y: -12 } }[p.id as 'O' | 'B' | 'A'] ?? { x: 8, y: -12 };
            return (
              <g key={p.id}>
                {(active || selectedId === p.id || pulseId === p.id) && (
                  <circle cx={sp.x} cy={sp.y} r={13} fill="none" stroke={selectedId === p.id ? C.sel : C.hov}
                    strokeOpacity={0.6} strokeWidth={2} className={pulseId === p.id ? 'glow-pulse' : undefined} />
                )}
                <circle data-testid={`pt-${p.id}`} cx={sp.x} cy={sp.y} r={(active ? 8 : 6) * pop} fill={C.bg} stroke={p.locked ? '#fbbf24' : C.point} strokeWidth={2.5} />
                {pop >= 1 && p.showLabel && <text x={sp.x + off.x} y={sp.y + off.y} fill={C.text} fontSize={12} fontFamily="monospace">{p.id}</text>}
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