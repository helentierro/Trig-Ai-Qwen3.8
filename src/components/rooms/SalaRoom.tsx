// ARCHIVADA Fase A: la Sala Docente sale del nav por simplicidad (el docente orquesta
// desde Herramientas → Sesión). Se conserva el archivo en git por si vuelve en Fase B.
// src/components/rooms/SalaRoom.tsx — Fase 1: Sala Docente (Classroom-lite, placeholder).
// Fase 5 la completa: código de lección, progreso, exam-mode. Aquí: orquesta básica.
import { useCanvasStore } from '../../stores/canvasStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { useThemeStore, usePal } from '../../stores/themeStore';

export function SalaRoom() {
  const pal = usePal();
  const voiceOn = useCanvasStore((s) => s.voiceOn);
  const setVoiceOn = useCanvasStore((s) => s.setVoiceOn);
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);
  const solved = useChallengeStore((s) => s.solved);
  const activeId = useChallengeStore((s) => s.activeId);

  const row: React.CSSProperties = {
    background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 10,
    padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>
        Sala docente — orquesta la sesión
      </div>
      <div style={row}>
        <span>🔊 Voz de la tutora</span>
        <button onClick={() => setVoiceOn(!voiceOn)} style={{ marginLeft: 'auto' }}>{voiceOn ? 'Apagar' : 'Encender'}</button>
      </div>
      <div style={row}>
        <span>🎨 Tema (actual: {mode})</span>
        <button onClick={cycle} style={{ marginLeft: 'auto' }}>Cambiar</button>
      </div>
      <div style={row}>
        <span>🏆 Retos resueltos: {solved.length}{activeId ? ` · activo: ${activeId}` : ' · sin reto activo'}</span>
      </div>
      <p style={{ color: pal.dim, fontSize: 12, lineHeight: 1.5 }}>
        Fase 5 añadirá código de lección, vista de progreso por estudiante y modo examen.
      </p>
    </div>
  );
}
