import { TriangleCanvas } from './components/canvas/TriangleCanvas';
import { AlgebraPanel } from './components/panel/AlgebraPanel';
import { useCanvasStore } from './stores/canvasStore';
import { runConstruction } from './services/scenePlayer';

const btn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid #1f2630',
  background: '#111826', color: '#e2e8f0', cursor: 'pointer', fontSize: 12,
};

export default function App() {
  const m = useCanvasStore((s) => s.measures);
  const setAngleDeg = useCanvasStore((s) => s.setAngleDeg);
  const setBase = useCanvasStore((s) => s.setBase);
  const voiceOn = useCanvasStore((s) => s.voiceOn);
  const setVoiceOn = useCanvasStore((s) => s.setVoiceOn);
  const playing = useCanvasStore((s) => s.playing);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', color: '#e2e8f0' }}>
      <header style={{ padding: '10px 16px', borderBottom: '1px solid #1f2630', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ background: '#38bdf8', color: '#0d1117', fontWeight: 800, borderRadius: 8, padding: '2px 10px' }}>Δ</span>
        <strong>Trig AI Tutor</strong>
        <span style={{ color: '#8b949e', fontSize: 12 }}>mundo v2 — toca, arrastra, descubre</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn} onClick={() => setVoiceOn(!voiceOn)}>{voiceOn ? '🔊 Voz on' : '🔇 Voz off'}</button>
          <button style={{ ...btn, color: '#a78bfa', borderColor: '#3b3654' }} disabled={playing} onClick={runConstruction}>
            🎬 {playing ? 'Construyendo…' : 'Construcción IA'}
          </button>
        </span>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <AlgebraPanel />
        <div style={{ flex: 1, position: 'relative' }}>
          <TriangleCanvas />
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #1f2630', padding: '10px 16px', display: 'flex', gap: 24, alignItems: 'center', fontFamily: 'monospace', fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          θ
          <input type="range" min={1} max={89} value={Math.round(m.angleDeg)} disabled={playing} onChange={(e) => setAngleDeg(+e.target.value)} />
          {m.angleDeg.toFixed(0)}°
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          base
          <input type="range" min={5} max={120} value={Math.round(m.base)} disabled={playing} onChange={(e) => setBase(+e.target.value)} />
          {m.base.toFixed(0)}
        </label>
        <span style={{ marginLeft: 'auto', color: '#8b949e' }}>
          tan({m.angleDeg.toFixed(0)}°) = {m.height.toFixed(2)} / {m.base.toFixed(2)} → h ≈ {m.height.toFixed(2)}
        </span>
      </footer>
    </div>
  );
}