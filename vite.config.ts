// vite.config.ts — Fase H: pre-optimización de deps (manualChunks fuera: Vite 8/Rolldown lo tipa distinto;
// el code-splitting ya lo hace React.lazy con DiscoverWorkspace)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['react', 'react-dom', 'zustand'] },
});