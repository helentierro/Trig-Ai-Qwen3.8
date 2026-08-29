// src/stores/themeStore.ts
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'trig-ai-theme';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
}

function systemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(mode: ThemeMode): 'light' | 'dark' {
  const resolved = mode === 'system' ? systemPref() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}

const stored = ((): ThemeMode => {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark'; // LOTE 1: dark (paneles viejos aún oscuros). LOTE 2 lo pasa a light.
})();

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: stored,
  resolved: apply(stored),
  setMode: (m) => {
    localStorage.setItem(THEME_KEY, m);
    set({ mode: m, resolved: apply(m) });
  },
  cycle: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : get().mode === 'light' ? 'system' : 'dark';
    get().setMode(next);
  },
}));

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().mode === 'system') {
      useThemeStore.setState({ resolved: apply('system') });
    }
  });
}