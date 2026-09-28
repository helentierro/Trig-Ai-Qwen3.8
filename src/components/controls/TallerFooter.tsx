// src/components/controls/TallerFooter.tsx — Fase 1: footer del Taller
// extraído de App.tsx sin cambios de lógica (sliders θ/base, atajos, fórmula viva).
import type { CSSProperties } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';

export function TallerFooter() {
  const pal = usePal();
  const m = useCanvasStore((s) => s.measures);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);
  const chain = useCanvasStore((s) => s.chain);
  const setChain = useCanvasStore((s) => s.setChain);
  const setAngleDeg = useCanvasStore((s) => s.setAngleDeg);
  const setBase = useCanvasStore((s) => s.setBase);
  const playing = useCanvasStore((s) => s.playing);

  const btn: CSSProperties = {
    padding: '6px 12px', borderRadius: 8, border: `1px solid ${pal.border}`,
    background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 12,
  };

  return (
    <footer style={{ borderTop: `1px solid ${pal.border}`, padding: '10px 16px', display: 'flex', gap: 24, alignItems: 'center', fontFamily: 'monospace', fontSize: 13 }}>
      {hasTriangle ? (
        <>
          <button
            style={{ ...btn, borderColor: chain ? pal.accent : pal.border, color: chain ? pal.accent : pal.dim }}
            onClick={() => setChain(!chain)} title="Modo triángulo rectángulo"
          >
            ⛓️ {chain ? 'ENCENDIDO' : 'APAGADO'}
          </button>
          <label htmlFor="slider-theta" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: chain ? 1 : 0.4 }}>
            θ
            <input id="slider-theta" name="slider-theta" type="range" min={1} max={89} value={Math.round(m.angleDeg)} disabled={playing || !chain} onChange={(e) => setAngleDeg(+e.target.value)} />
            {m.angleDeg.toFixed(0)}°
          </label>
          <label htmlFor="slider-base" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: chain ? 1 : 0.4 }}>
            base
            <input id="slider-base" name="slider-base" type="range" min={5} max={120} value={Math.round(m.base)} disabled={playing || !chain} onChange={(e) => setBase(+e.target.value)} />
            {m.base.toFixed(0)}
          </label>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[30, 45, 60].map((angle) => (
              <button key={angle} disabled={playing || !chain} onClick={() => setAngleDeg(angle)} style={{ ...btn, padding: '4px 8px', opacity: playing || !chain ? 0.45 : 1 }}>
                {angle}°
              </button>
            ))}
          </span>
          <span style={{ marginLeft: 'auto', color: pal.dim }}>
            {(chain || m.rightAngle)
              ? `tan(${m.angleDeg.toFixed(0)}°) = ${m.height.toFixed(2)} / ${m.base.toFixed(2)}`
              : `${m.angleDeg.toFixed(0)}° + ${m.angleB.toFixed(0)}° + ${m.angleA.toFixed(0)}° = 180° ✔`}
          </span>
        </>
      ) : (
        <span style={{ color: pal.dim }}>Mundo libre: construye con 🛠 · vuelve al triángulo · abre mundos con historia</span>
      )}
    </footer>
  );
}
