// src/services/scenePlayer.ts — Motor de escenas IA (Día 1: fixes críticos)
import { useCanvasStore } from '../stores/canvasStore';
import { useChallengeStore } from '../stores/challengeStore';
import type { SceneScript } from '../types/ai';

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const sleep = (ms: number, signal?: { cancelled: boolean }) =>
  new Promise<void>((r) => {
    const id = setTimeout(r, ms);
    if (signal) {
      const check = setInterval(() => {
        if (signal.cancelled) { clearTimeout(id); clearInterval(check); r(); }
      }, 50);
    }
  });

// Controlador de cancelación global
const sceneController = { cancelled: false };

export function cancelScene() {
  sceneController.cancelled = true;
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch { /* silencioso */ }
  }
  useCanvasStore.getState().setPlaying(false);
  useCanvasStore.getState().setAiCursor(null);
  useCanvasStore.getState().setSubtitle(null);
}

function tween(ms: number, fn: (t: number) => void): Promise<void> {
  return new Promise((res) => {
    const t0 = performance.now();
    const loop = (now: number) => {
      if (sceneController.cancelled) { res(); return; }
      const t = Math.min(1, (now - t0) / ms);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(loop);
      else res();
    };
    requestAnimationFrame(loop);
  });
}

/**
 * Voz con robustez iOS Safari: el Web Speech API en iOS deja de disparar
 * `onend` tras ~15s de inactividad. Usamos un heartbeat + timeout defensivo.
 */
export function speak(text: string): Promise<void> {
  return new Promise((res) => {
    if (!('speechSynthesis' in window)) return res();
    if (sceneController.cancelled) return res();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      u.rate = 1.05;
      // Timeout defensivo: 70ms por carácter, máximo 9s
      const maxMs = Math.min(text.length * 70, 9000);
      const timeout = setTimeout(() => {
        try { window.speechSynthesis.cancel(); } catch { /* silencioso */ }
        res();
      }, maxMs);
      // Heartbeat para iOS Safari (bug: no dispara onend tras pausa larga)
      const heartbeat = setInterval(() => {
        if (!window.speechSynthesis.speaking || sceneController.cancelled) {
          clearInterval(heartbeat);
          clearTimeout(timeout);
          res();
        }
      }, 250);
      u.onend = () => { clearInterval(heartbeat); clearTimeout(timeout); res(); };
      u.onerror = () => { clearInterval(heartbeat); clearTimeout(timeout); res(); };
      window.speechSynthesis.speak(u);
    } catch {
      res();
    }
  });
}

export async function playScene(script: SceneScript) {
  const st = () => useCanvasStore.getState();
  if (st().playing) return;
  // Reset del controlador de cancelación
  sceneController.cancelled = false;
  st().setPlaying(true);

  for (const step of script) {
    if (sceneController.cancelled) break;
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
        const P = s.points[seg.a]?.pos, Q = s.points[seg.b]?.pos;
        if (!P || !Q) break;
        if (!s.aiCursor.visible) s.setAiCursor(P);
        await tween(step.ms ?? 900, (t) => {
          s.setDrawn(step.id, t);
          s.setAiCursor({ x: P.x + (Q.x - P.x) * t, y: P.y + (Q.y - P.y) * t });
        });
        break;
      }
      case 'pulse':
        s.pulse(step.id, step.ms ?? 1400);
        await sleep(step.ms ?? 1400, sceneController);
        break;
      case 'say':
        s.setSubtitle(step.text);
        if (st().voiceOn) await speak(step.text);
        else await sleep(Math.min(900 + step.text.length * 35, 4200), sceneController);
        break;
      case 'world': {
        // FIX: transición suave (200ms fade) en lugar de salto brusco
        s.setSubtitle('');
        await sleep(150, sceneController);
        s.loadWorld(step.id);
        await sleep(350, sceneController);
        break;
      }
      case 'challenge': {
        // FIX CRÍTICO: el case faltaba y los retos remotos nunca se lanzaban
        useChallengeStore.getState().start(step.id);
        await sleep(400, sceneController);
        break;
      }
      case 'wait':
        await sleep(step.ms, sceneController);
        break;
    }
  }
  st().setPlaying(false);
}

export function buildTriangleScript(): SceneScript {
  if (!useCanvasStore.getState().hasTriangle) useCanvasStore.getState().loadWorld(null);
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
  if (!st.hasTriangle) st.loadWorld(null);
  if (!useCanvasStore.getState().chain) useCanvasStore.getState().setChain(true);
  useCanvasStore.getState().resetConstruction();
  void playScene(buildTriangleScript());
}