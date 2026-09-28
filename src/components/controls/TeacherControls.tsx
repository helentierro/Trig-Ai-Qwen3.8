// src/components/controls/TeacherControls.tsx — Fase 1: controles del docente
// extraídos del header de App.tsx. Leen los stores directamente, sin prop-drilling.
import type { CSSProperties } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useThemeStore, usePal } from '../../stores/themeStore';
import { runConstruction } from '../../services/scenePlayer';

export function TeacherControls() {
  const pal = usePal();
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);
  const voiceOn = useCanvasStore((s) => s.voiceOn);
  const setVoiceOn = useCanvasStore((s) => s.setVoiceOn);
  const playing = useCanvasStore((s) => s.playing);
  const hasTriangle = useCanvasStore((s) => s.hasTriangle);

  const btn: CSSProperties = {
    padding: '6px 12px', borderRadius: 8, border: `1px solid ${pal.border}`,
    background: pal.card, color: pal.bubbleText, cursor: 'pointer', fontSize: 12,
  };

  return (
    <>
      <button style={btn} onClick={() => setVoiceOn(!voiceOn)}>
        {voiceOn ? '🔊 Voz on' : '🔇 Voz off'}
      </button>
      <button style={btn} onClick={cycle} title={`Tema: ${mode}`}>
        {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
      </button>
      <button
        style={{ ...btn, color: pal.ia }}
        disabled={playing || !hasTriangle}
        onClick={runConstruction}
      >
        🎬 {playing ? 'Construyendo…' : 'Construcción IA'}
      </button>
    </>
  );
}
