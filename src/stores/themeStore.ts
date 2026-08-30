// src/stores/themeStore.ts
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
    bg: '#0d1117', grid: '#1c2534', gridStrong: '#2b3648', axis: '#3d4654', text: '#8b949e', point: '#e2e8f0',
    angle: '#fbbf24', ia: '#a78bfa', free: '#94a3b8', sel: '#fbbf24', hov: '#38bdf8',
    bubbleBg: 'rgba(17,24,38,0.92)', bubbleBorder: '#2b3648', bubbleText: '#e2e8f0',
    panelBg: '#0a0e14', border: '#1f2630', card: '#111826', dim: '#8b949e', faint: '#64748b', accent: '#38bdf8',
  },
  light: {
    bg: '#ffffff', grid: '#e5ebf2', gridStrong: '#c9d2dc', axis: '#aeb9c6', text: '#61708b', point: '#1f2937',
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
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'light';
})();

export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: stored,
  resolved: apply(stored),
  setMode: (m) => { localStorage.setItem(THEME_KEY, m); set({ mode: m, resolved: apply(m) }); },
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