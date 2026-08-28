import { useCanvasStore } from '../stores/canvasStore';
import type { SceneScript } from '../types/ai';

const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cúbico
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function tween(ms: number, fn: (t: number) => void): Promise<void> {
  return new Promise((res) => {
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(loop);
      else res();
    };
    requestAnimationFrame(loop);
  });
}

// TTS de navegador como placeholder (luego ElevenLabs, misma interfaz)
function speak(text: string): Promise<void> {
  return new Promise((res) => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 1.05;
    const timeout = setTimeout(() => res(), Math.min(text.length * 70, 9000));
    u.onend = () => { clearTimeout(timeout); res(); };
    u.onerror = () => { clearTimeout(timeout); res(); };
    window.speechSynthesis.speak(u);
  });
}

export async function playScene(script: SceneScript) {
  const st = () => useCanvasStore.getState();
  if (st().playing) return;
  st().setPlaying(true);

  for (const step of script) {
    const s = st();
    switch (step.type) {
      case 'cursor': {
        if (step.to === null) { s.setAiCursor(null); break; }
        if (!s.aiCursor.visible) s.setAiCursor(step.to);
        else {
          const from = { ...s.aiCursor.pos };
          const to = step.to;
          await tween(step.ms ?? 700, (t) =>
            s.setAiCursor({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }));
        }
        break;
      }
      case 'point':
        await tween(step.ms ?? 300, (t) => s.setDrawn(step.id, t));
        break;
      case 'segment': {
        const seg = s.segments.find((g) => g.id === step.id);
        if (!seg) break;
        const P = s.points[seg.a].pos, Q = s.points[seg.b].pos;
        if (!s.aiCursor.visible) s.setAiCursor(P);
        await tween(step.ms ?? 900, (t) => {
          s.setDrawn(step.id, t);
          s.setAiCursor({ x: P.x + (Q.x - P.x) * t, y: P.y + (Q.y - P.y) * t }); // el cursor es el lápiz
        });
        break;
      }
      case 'pulse':
        s.pulse(step.id, step.ms ?? 1400);
        await sleep(step.ms ?? 1400);
        break;
      case 'say':
        s.setSubtitle(step.text);
        if (st().voiceOn) await speak(step.text);
        else await sleep(Math.min(900 + step.text.length * 35, 4200));
        break;
      case 'wait':
        await sleep(step.ms);
        break;
    }
  }
  st().setPlaying(false);
}

// La IA construye el triángulo ACTUAL (el que el niño tenga en pantalla)
export function buildTriangleScript(): SceneScript {
  const { points, measures } = useCanvasStore.getState();
  const deg = Math.round(measures.angleDeg);
  return [
    { type: 'say', text: `Voy a construir un triángulo rectángulo de ${deg}°. Mira cómo lo hago.` },
    { type: 'cursor', to: points.O.pos },
    { type: 'point', id: 'O' },
    { type: 'say', text: 'Primero marco el origen O.' },
    { type: 'segment', id: 'base' },
    { type: 'point', id: 'B' },
    { type: 'say', text: `Dibujo la base de ${Math.round(measures.base)} unidades hasta B.` },
    { type: 'segment', id: 'height' },
    { type: 'point', id: 'A' },
    { type: 'say', text: 'Levanto el cateto vertical: aquí vivirá la altura.' },
    { type: 'segment', id: 'hyp' },
    { type: 'say', text: 'Cierro con la hipotenusa: el camino directo de O a A.' },
    { type: 'pulse', id: 'angleO' },
    { type: 'say', text: `El ángulo θ queda en ${deg}°. Ahora es tuyo: arrástralo y descubre.` },
    { type: 'cursor', to: null },
  ];
}

export function runConstruction() {
  const st = useCanvasStore.getState();
  if (st.playing) return;
  st.resetConstruction();
  void playScene(buildTriangleScript());
}