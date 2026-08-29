import { create } from 'zustand';
import { useCanvasStore } from './canvasStore';
import { useChatStore } from './chatStore';
import { CHALLENGES } from '../data/challenges';
import { speak } from '../services/scenePlayer';

interface ChState {
  activeId: string | null;
  solved: string[];
  start: (id: string) => void;
  stop: () => void;
}

export const useChallengeStore = create<ChState>()((set, get) => ({
  activeId: null,
  solved: [],
  start: (id) => {
    const ch = CHALLENGES.find((c) => c.id === id);
    if (!ch || get().solved.includes(id)) return;
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
      if (ch.verify(s)) {
        useChallengeStore.setState((st) => ({ solved: [...st.solved, activeId], activeId: null }));
        useChatStore.getState().push('ia', ch.success);
        s.celebrate('🎉 ¡RETO SUPERADO!');
        if (s.voiceOn) void speak(ch.success);
      }
    }, 250);
  });
}