// src/services/__tests__/scenePlayer.spec.ts — Entrega 2 FINAL
// Rutas corregidas: los stores viven en ../../stores/ (dos pisos arriba).
// REQUIERE: scenePlayer.ts versión Entrega 1 (con cancelScene y case 'challenge').
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { playScene, cancelScene } from '../scenePlayer';
import { useCanvasStore } from '../../stores/canvasStore';
import { useChallengeStore } from '../../stores/challengeStore';

// Stubs de APIs de navegador para entorno node
vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) =>
  setTimeout(() => cb(performance.now()), 8));
vi.stubGlobal('window', {}); // sin speechSynthesis → voz apagada en tests

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  useCanvasStore.getState().loadWorld(null);
  useCanvasStore.setState({ playing: false, voiceOn: false });
  useChallengeStore.setState({ activeId: null, solved: [] });
});

describe('scenePlayer', () => {
  it('ejecuta say, deja subtítulo y termina en playing=false', async () => {
    await playScene([{ type: 'say', text: 'hola' }]);
    expect(useCanvasStore.getState().subtitle).toBe('hola');
    expect(useCanvasStore.getState().playing).toBe(false);
  });

  it('REGRESIÓN CRÍTICA: el paso challenge lanza el reto', async () => {
    await playScene([{ type: 'challenge', id: 'gold45' }]);
    expect(useChallengeStore.getState().activeId).toBe('gold45');
  });

  it('cancelScene interrumpe una escena larga', async () => {
    const p = playScene([{ type: 'wait', ms: 5000 }]);
    await sleep(80);
    cancelScene();
    await p;
    expect(useCanvasStore.getState().playing).toBe(false);
  });

  it('world carga el mundo pedido', async () => {
    await playScene([{ type: 'world', id: 'bridge' }]);
    expect(useCanvasStore.getState().points.b0).toBeTruthy();
  });
});