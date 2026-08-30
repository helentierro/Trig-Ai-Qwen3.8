// src/components/canvas/layers/GridLayer.tsx — capa de grilla memoizada (perf + visibilidad Fase H)
import { memo, type ReactNode } from 'react';
import { type Camera, niceGridStep, screenToWorld, worldToScreen, fmtCoord } from '../../../utils/coordinateTransform';
import type { GridStyle } from '../../../stores/canvasStore';
import type { Pal } from '../../../stores/themeStore';

function axisNumbers(cam: Camera, vp: { w: number; h: number }, step: number, pal: Pal): ReactNode[] {
  const els: ReactNode[] = [];
  const tl = screenToWorld({ x: 0, y: 0 }, cam);
  const br = screenToWorld({ x: vp.w, y: vp.h }, cam);
  const o = worldToScreen({ x: 0, y: 0 }, cam);
  const ny = Math.min(Math.max(o.y, 10), vp.h - 16) + 14;
  const nx = Math.min(Math.max(o.x, 4), vp.w - 34) + 6;
  for (let i = Math.ceil(tl.x / step); i * step <= br.x; i++) {
    const x = i * step;
    if (x === 0) continue;
    els.push(<text key={`vt${i}`} x={worldToScreen({ x, y: 0 }, cam).x + 4} y={ny} fill={pal.text} fontSize={10}>{fmtCoord(x)}</text>);
  }
  for (let i = Math.ceil(br.y / step); i * step <= tl.y; i++) {
    const y = i * step;
    if (y === 0) continue;
    els.push(<text key={`ht${i}`} x={nx} y={worldToScreen({ x: 0, y }, cam).y - 4} fill={pal.text} fontSize={10}>{fmtCoord(y)}</text>);
  }
  return els;
}

function axes(cam: Camera, vp: { w: number; h: number }, pal: Pal): ReactNode[] {
  const o = worldToScreen({ x: 0, y: 0 }, cam);
  return [
    <line key="axV" x1={o.x} y1={0} x2={o.x} y2={vp.h} stroke={pal.axis} strokeWidth={1.4} />,
    <line key="axH" x1={0} y1={o.y} x2={vp.w} y2={o.y} stroke={pal.axis} strokeWidth={1.4} />,
  ];
}

function build(style: GridStyle, cam: Camera, vp: { w: number; h: number }, pal: Pal): ReactNode[] {
  const els: ReactNode[] = [];
  const tl = screenToWorld({ x: 0, y: 0 }, cam);
  const br = screenToWorld({ x: vp.w, y: vp.h }, cam);
  const o = worldToScreen({ x: 0, y: 0 }, cam);

  if (style === 'blank') return [...axes(cam, vp, pal), ...axisNumbers(cam, vp, niceGridStep(cam.zoom, 64), pal)];

  if (style === 'circular') {
    const step = niceGridStep(cam.zoom, 64);
    const maxR = Math.hypot(Math.max(Math.abs(tl.x), Math.abs(br.x)), Math.max(Math.abs(tl.y), Math.abs(br.y)));
    let k = 1;
    for (let r = step; r <= maxR; r += step, k++) {
      const major = k % 5 === 0;
      els.push(<circle key={`c${k}`} cx={o.x} cy={o.y} r={r * cam.zoom} fill="none"
        stroke={major ? pal.axis : pal.gridStrong} strokeWidth={major ? 1.4 : 1.1} />);
    }
    return [...els, ...axes(cam, vp, pal), ...axisNumbers(cam, vp, step, pal)];
  }

  if (style === 'diamond') {
    const step = niceGridStep(cam.zoom, 64);
    let k = 0;
    for (let c = Math.ceil((tl.y - br.x) / step) * step; c <= br.y - tl.x; c += step, k++) {
      const p1 = worldToScreen({ x: tl.x, y: tl.x + c }, cam);
      const p2 = worldToScreen({ x: br.x, y: br.x + c }, cam);
      els.push(<line key={`d1${k}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={k % 5 === 0 ? pal.axis : pal.gridStrong} strokeWidth={1.1} />);
    }
    k = 0;
    for (let c = Math.ceil((tl.y + tl.x) / step) * step; c <= br.y + br.x; c += step, k++) {
      const p1 = worldToScreen({ x: tl.x, y: -tl.x + c }, cam);
      const p2 = worldToScreen({ x: br.x, y: -br.x + c }, cam);
      els.push(<line key={`d2${k}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={k % 5 === 0 ? pal.axis : pal.gridStrong} strokeWidth={1.1} />);
    }
    return [...els, ...axes(cam, vp, pal), ...axisNumbers(cam, vp, step, pal)];
  }

  // fine | large — líneas mayores cada 5, más contraste (adiós borroso)
  const step = niceGridStep(cam.zoom, style === 'large' ? 170 : 64);
  let k = 0;
  for (let i = Math.ceil(tl.x / step); i * step <= br.x; i++, k++) {
    const x = i * step;
    const sx = worldToScreen({ x, y: 0 }, cam).x;
    const major = i % 5 === 0;
    els.push(<line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={vp.h}
      stroke={x === 0 ? pal.axis : major ? pal.gridStrong : pal.grid} strokeWidth={x === 0 ? 1.4 : major ? 1.2 : 1} />);
  }
  for (let i = Math.ceil(br.y / step); i * step <= tl.y; i++, k++) {
    const y = i * step;
    const sy = worldToScreen({ x: 0, y }, cam).y;
    const major = i % 5 === 0;
    els.push(<line key={`h${i}`} x1={0} y1={sy} x2={vp.w} y2={sy}
      stroke={y === 0 ? pal.axis : major ? pal.gridStrong : pal.grid} strokeWidth={y === 0 ? 1.4 : major ? 1.2 : 1} />);
  }
  return [...els, ...axisNumbers(cam, vp, step, pal)];
}

export const GridLayer = memo(function GridLayer({ cam, vp, style, pal }: {
  cam: Camera; vp: { w: number; h: number }; style: GridStyle; pal: Pal;
}) {
  return <>{build(style, cam, vp, pal)}</>;
});