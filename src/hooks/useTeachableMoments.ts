import { useEffect } from 'react';
import { onCanvasEvent, useCanvasStore } from '../stores/canvasStore';
import { useChatStore } from '../stores/chatStore';
import { speak } from '../services/scenePlayer';

const LESSONS: Record<number, string> = {
  15: '⚡ 15°: un ángulo tímido. La altura apenas crece: tan(15°) ≈ 0.27.',
  30: '⚡ ¡30°! Mira el panel: la altura es la mitad de la hipotenusa. Ese es el secreto del 30-60-90.',
  45: '⚡ ¡45°! ¿Ves los catetos iguales? tan(45°) = 1: la altura copia a la base.',
  60: '⚡ ¡60°! La hipotenusa es exactamente el doble de la base (cos 60° = 1/2). ¡Descubriste el 30-60-90 al revés!',
  75: '⚡ 75°: casi vertical. La base se vuelve diminuta frente a la altura.',
};

// Una sola vez por ángulo y por sesión: sorprende, no spamea.
export function useTeachableMoments() {
  useEffect(() => {
    const seen = new Set<number>();
    return onCanvasEvent((e) => {
      if (e.type !== 'snap-angle') return;
      const st = useCanvasStore.getState();
      if (st.playing || seen.has(e.deg)) return;
      const msg = LESSONS[e.deg];
      if (!msg) return;
      seen.add(e.deg);
      useChatStore.getState().push('ia', msg);
      st.pulse('angleO', 1600);
      if (st.voiceOn) void speak(msg);
    });
  }, []);
}