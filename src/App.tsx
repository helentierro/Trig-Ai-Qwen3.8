// src/App.tsx
import { useEffect, useState } from 'react';
import { TriangleCanvas } from './components/canvas/TriangleCanvas';
import { SidePanel } from './components/panel/SidePanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { DiscoverWorkspace } from './components/panel/DiscoverWorkspace';
import { useCanvasStore } from './stores/canvasStore';
import { useThemeStore, usePal } from './stores/themeStore';
import { runConstruction } from './services/scenePlayer';
import { useTeachableMoments } from './hooks/useTeachableMoments';
import { startChallengeWatcher } from './stores/challengeStore';

export default function App() {
  useTeachableMoments();
  useEffect(() => { startChallengeWatcher(); }, []);
  const pal = usePal();
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);
  const [ws, setWs] = useState<'graph' | 'discover'>('graph');

  const m = useCanvasStore((s) => s.measures);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);
  const chain = useCanvasStore((s) => s.chain);
  const setChain = useCanvasStore((s) => s.setChain);
  const setAngleDeg = useCanvasStore((s) => s.setAngleDeg);
  const setBase = useCanvasStore((s) => s.setBase);
  const voiceOn = useCanvasStore((s) => s.voiceOn);
  const setVoiceOn = useCanvasStore((s) => s.setVoiceOn);
  const playing = useCanvasStore((s) => s.playing);
  const celebration = useCanvasStore((s) => s.celebration);
  const toast = useCanvasStore((s) => s.toast);

  const btn: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 8, border: `1px solid ${pal.border}`,
    background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 12,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: pal.bg, color: pal.bubbleText }}>
      <header style={{ padding: '10px 16px', borderBottom: `1px solid ${pal.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ background: pal.accent, color: '#fff', fontWeight: 800, borderRadius: 8, padding: '2px 10px' }}>Δ</span>
        <strong>Tutor de IA de trigonometría</strong>
        <span style={{ color: pal.dim, fontSize: 12 }}>mundo libre — toca, construye, descubre</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={{ ...btn, color: ws === 'graph' ? pal.accent : pal.dim, borderColor: ws === 'graph' ? pal.accent : pal.border }} onClick={() => setWs('graph')}>📐 Gráfica</button>
          <button style={{ ...btn, color: ws === 'discover' ? '#fbbf24' : pal.dim, borderColor: ws === 'discover' ? '#fbbf24' : pal.border }} onClick={() => setWs('discover')}>📚 Descubrir</button>
          <button style={btn} onClick={() => setVoiceOn(!voiceOn)}>{voiceOn ? '🔊 Voz on' : '🔇 Voz off'}</button>
          <button style={btn} onClick={cycle} title={`Tema: ${mode}`}>{mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}</button>
          <button style={{ ...btn, color: pal.ia }} disabled={playing || (ws === 'graph' && !hasTriangle)} onClick={runConstruction}>
            🎬 {playing ? 'Construyendo…' : 'Construcción IA'}
          </button>
        </span>
      </header>

      {ws === 'graph' ? (
        <>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <SidePanel />
            <div style={{ flex: 1, position: 'relative' }}>
              <TriangleCanvas />
            </div>
            <ChatPanel />
          </div>
          <footer style={{ borderTop: `1px solid ${pal.border}`, padding: '10px 16px', display: 'flex', gap: 24, alignItems: 'center', fontFamily: 'monospace', fontSize: 13 }}>
            {hasTriangle ? (
              <>
                <button style={{ ...btn, borderColor: chain ? pal.accent : pal.border, color: chain ? pal.accent : pal.dim }}
                  onClick={() => setChain(!chain)} title="Modo triángulo rectángulo">⛓️ {chain ? 'ENCENDIDO' : 'APAGADO'}</button>
                <label htmlFor="slider-theta" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: chain ? 1 : 0.4 }}>
                  θ
                  <input id="slider-theta" type="range" min={1} max={89} value={Math.round(m.angleDeg)} disabled={playing || !chain} onChange={(e) => setAngleDeg(+e.target.value)} />
                  {m.angleDeg.toFixed(0)}°
                </label>
                <label htmlFor="slider-base" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: chain ? 1 : 0.4 }}>
                  base
                  <input id="slider-base" type="range" min={5} max={120} value={Math.round(m.base)} disabled={playing || !chain} onChange={(e) => setBase(+e.target.value)} />
                  {m.base.toFixed(0)}
                </label>
                <span style={{ marginLeft: 'auto', color: pal.dim }}>
                  {(chain || m.rightAngle)
                    ? `tan(${m.angleDeg.toFixed(0)}°) = ${m.height.toFixed(2)} / ${m.base.toFixed(2)}`
                    : `${m.angleDeg.toFixed(0)}° + ${m.angleB.toFixed(0)}° + ${m.angleA.toFixed(0)}° = 180° ✔`}
                </span>
              </>
            ) : (
              <span style={{ color: pal.dim }}>Mundo libre: construye con 🛠 ·  vuelve al triángulo ·  abre mundos con historia</span>
            )}
          </footer>
        </>
      ) : (
        <DiscoverWorkspace onEnterWorld={() => setWs('graph')} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 60, right: 20, background: pal.card, border: `1px solid ${pal.border}`, color: pal.bubbleText, padding: '8px 14px', borderRadius: 10, fontSize: 12.5, zIndex: 70, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
      {celebration && (
        <div className="celebrate" style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 60, fontSize: 44, fontWeight: 900, color: '#fbbf24',
          textShadow: '0 4px 30px rgba(0,0,0,.8)',
        }}>{celebration}</div>
      )}
    </div>
  );
}