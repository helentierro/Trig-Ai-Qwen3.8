// src/stores/__tests__/challengeStore.spec.ts — Entrega 2
import { describe, expect, it, beforeEach } from 'vitest';
import { useChallengeStore, startChallengeWatcher } from '../challengeStore';
import { useCanvasStore } from '../canvasStore';
import { useChatStore } from '../chatStore';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let watching = false;
const ensureWatcher = () => { if (!watching) { startChallengeWatcher(); watching = true; } };

beforeEach(() => {
  useChallengeStore.setState({ activeId: null, solved: [] });
  useChatStore.setState({ messages: [] });
  useCanvasStore.getState().loadWorld(null);
});

describe('challengeStore', () => {
  it('start activa el reto y lo anuncia en el chat', () => {
    useChallengeStore.getState().start('gold45');
    expect(useChallengeStore.getState().activeId).toBe('gold45');
    expect(useChatStore.getState().messages.some((m) => m.text.includes('El ángulo de oro'))).toBe(true);
  });

  it('start ignora retos ya resueltos', () => {
    useChallengeStore.setState({ solved: ['gold45'] });
    useChallengeStore.getState().start('gold45');
    expect(useChallengeStore.getState().activeId).toBeNull();
  });

  it('watcher celebra al cumplir la condición en vivo', async () => {
    ensureWatcher();
    useChallengeStore.getState().start('gold45');
    useCanvasStore.setState((s) => ({
      hasTriangle: true,
      measures: { ...s.measures, angleDeg: 45 },
    }));
    await sleep(400);
    expect(useChallengeStore.getState().solved).toContain('gold45');
    expect(useChallengeStore.getState().activeId).toBeNull();
  });

  it('race condition: stop() antes del debounce NO regala el reto', async () => {
    ensureWatcher();
    useChallengeStore.getState().start('gold45');
    useCanvasStore.setState((s) => ({
      hasTriangle: true,
      measures: { ...s.measures, angleDeg: 45 },
    }));
    useChallengeStore.getState().stop(); // cancela durante los 250 ms
    await sleep(400);
    expect(useChallengeStore.getState().solved).toEqual([]);
  });
});