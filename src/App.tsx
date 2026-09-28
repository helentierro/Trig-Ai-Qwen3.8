// src/App.tsx — Fase 1 Gran Casa: cáscara fina. El lienzo es una habitación (Taller).
// Header/footer/controles viven en layout/ + controls/ + rooms/.
import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { useEffect } from 'react';
import { useCanvasStore } from './stores/canvasStore';
import { useHouseStore } from './stores/houseStore';
import { usePal } from './stores/themeStore';
import { useTeachableMoments } from './hooks/useTeachableMoments';
import { startChallengeWatcher } from './stores/challengeStore';
import { HouseLayout } from './components/layout/HouseLayout';
import { TeacherControls } from './components/controls/TeacherControls';
import { TallerFooter } from './components/controls/TallerFooter';
import { TallerRoom } from './components/rooms/TallerRoom';
import { BibliotecaRoom } from './components/rooms/BibliotecaRoom';
import { LaboratorioRoom } from './components/rooms/LaboratorioRoom';
import { MesaRoom } from './components/rooms/MesaRoom';
import { SalaRoom } from './components/rooms/SalaRoom';

interface EBProps { children: ReactNode; }
interface EBState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Espera un tick: el canvas se remonta y el ResizeObserver reporta tamaño real.
    setTimeout(() => {
      try {
        const st = useCanvasStore.getState();
        st.loadWorld(null);
        st.fitView();
      } catch { /* silencioso */ }
    }, 80);
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: '#0d1117', color: '#e2e8f0', padding: 24, fontFamily: 'system-ui',
        }}>
          <div style={{ fontSize: 48 }}>🛠️</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Algo salió mal</h1>
          <p style={{ margin: 0, color: '#8b949e', textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
            El tutor tuvo un tropiezo. No perdiste tu trabajo guardado.
            Pulsa "Reiniciar" para volver al triángulo, o recarga la página.
          </p>
          {this.state.error && (
            <pre style={{
              background: '#111826', border: '1px solid #1f2630', borderRadius: 8,
              padding: 12, fontSize: 11, color: '#f87171', maxWidth: '90vw',
              overflow: 'auto', maxHeight: 120,
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button onClick={this.handleReset}
            style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid #38bdf8',
              background: '#38bdf8', color: '#0d1117', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
            🔄 Reiniciar tutor
          </button>
          <button onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid #2b3648',
              background: 'transparent', color: '#8b949e', fontSize: 13, cursor: 'pointer',
            }}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  useTeachableMoments();
  useEffect(() => {
    const st = useCanvasStore.getState();
    if (!Object.keys(st.points).length) {
      st.loadWorld(null);
    }
    startChallengeWatcher();
  }, []);
  const pal = usePal();
  const room = useHouseStore((s) => s.room);
  const celebration = useCanvasStore((s) => s.celebration);
  const toast = useCanvasStore((s) => s.toast);

  return (
    <HouseLayout
      controls={<TeacherControls />}
      footer={room === 'taller' ? <TallerFooter /> : undefined}
    >
      <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.dim }}>Cargando habitación…</div>}>
        {room === 'taller' && <TallerRoom />}
        {room === 'biblioteca' && <BibliotecaRoom />}
        {room === 'laboratorio' && <LaboratorioRoom />}
        {room === 'mesa' && <MesaRoom />}
        {room === 'sala' && <SalaRoom />}
      </Suspense>
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
    </HouseLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
