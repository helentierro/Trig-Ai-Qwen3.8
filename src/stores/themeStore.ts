// src/stores/themeStore.ts — Entrega 3: grillas visibles de verdad
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'trig-ai-theme';

export interface Pal {
  bg: string; grid: string; gridStrong: string; axis: string; text: string; point: string;
  angle: string; ia: string; free: string; sel: string; hov: string;
  bubbleBg: string; bubbleBorder: string; bubbleText: string;
  panelBg: string; border: string; card: string; dim: string; faint: string; accent: string;
}

export const PALS: Record<'dark' | 'light', Pal> = {
  dark: {
    bg: '#0d1117', grid: '#26334a', gridStrong: '#3d4f6e', axis: '#5c6f8c', text: '#9aa8bc', point: '#e2e8f0',
    angle: '#fbbf24', ia: '#a78bfa', free: '#94a3b8', sel: '#fbbf24', hov: '#38bdf8',
    bubbleBg: 'rgba(17,24,38,0.92)', bubbleBorder: '#2b3648', bubbleText: '#e2e8f0',
    panelBg: '#0a0e14', border: '#1f2630', card: '#111826', dim: '#8b949e', faint: '#64748b', accent: '#38bdf8',
  },
  light: {
    bg: '#ffffff', grid: '#c9d6e4', gridStrong: '#a4b9cf', axis: '#7f95ad', text: '#51637a', point: '#1f2937',
    angle: '#b45309', ia: '#7c3aed', free: '#64748b', sel: '#b45309', hov: '#0284c7',
    bubbleBg: 'rgba(255,255,255,0.95)', bubbleBorder: '#d7dee8', bubbleText: '#1f2937',
    panelBg: '#ffffff', border: '#d7dee8', card: '#f1f5f9', dim: '#61708b', faint: '#8a94a6', accent: '#0284c7',
  },
};

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
}

function systemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function apply(mode: ThemeMode): 'light' | 'dark' {
  const resolved = mode === 'system' ? systemPref() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}
const stored = ((): ThemeMode => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'light';
  } catch { return 'light'; }
})();

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: stored,
  resolved: apply(stored),
  setMode: (m) => { try { localStorage.setItem(THEME_KEY, m); } catch { /* privado */ } set({ mode: m, resolved: apply(m) }); },
  cycle: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : get().mode === 'light' ? 'system' : 'dark';
    get().setMode(next);
  },
}));

export function usePal(): Pal {
  return useThemeStore((t) => PALS[t.resolved]);
}

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().mode === 'system') {
      useThemeStore.setState({ resolved: apply('system') });
    }
  });
}