// src/stores/challengeStore.ts — Entrega 2: endurecido + medallas persistentes
import { create } from 'zustand';
import { useCanvasStore } from './canvasStore';
import { useChatStore } from './chatStore';
import { CHALLENGES } from '../data/challenges';
import { speak } from '../services/scenePlayer';

const RETOS_KEY = 'trig-ai-retos';
const readSolved = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RETOS_KEY) || '[]'); } catch { return []; }
};
const writeSolved = (solved: string[]) => {
  try { localStorage.setItem(RETOS_KEY, JSON.stringify(solved)); } catch { /* modo privado */ }
};

interface ChState {
  activeId: string | null;
  solved: string[];
  start: (id: string) => void;
  stop: () => void;
}

export const useChallengeStore = create<ChState>()((set, get) => ({
  activeId: null,
  solved: readSolved(),
  start: (id) => {
    const ch = CHALLENGES.find((c) => c.id === id);
    if (!ch || get().solved.includes(id) || get().activeId === id) return;
    set({ activeId: id });
    useChatStore.getState().push('ia', `🎯 Reto «${ch.title}»: ${ch.prompt} (Pista: ${ch.hint})`);
  },
  stop: () => set({ activeId: null }),
}));

// Observa el mundo en vivo: cuando cumples el reto, celebra.
export function startChallengeWatcher() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useCanvasStore.subscribe((s) => {
    const { activeId, solved } = useChallengeStore.getState();
    if (!activeId || solved.includes(activeId)) return;
    const ch = CHALLENGES.find((c) => c.id === activeId);
    if (!ch) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // FIX RACE: re-leer estado FRESCO dentro del timeout.
      // Si el reto se canceló o cambió durante los 250 ms, no se regala nada.
      const now = useChallengeStore.getState();
      if (now.activeId !== activeId || now.solved.includes(activeId)) return;
      if (ch.verify(s)) {
        const nextSolved = [...now.solved, activeId];
        useChallengeStore.setState({ solved: nextSolved, activeId: null });
        writeSolved(nextSolved);
        useChatStore.getState().push('ia', ch.success);
        s.celebrate('🎉 ¡RETO SUPERADO!');
        if (s.voiceOn) void speak(ch.success);
      }
    }, 250);
  });
}