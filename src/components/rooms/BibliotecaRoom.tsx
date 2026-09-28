// src/components/rooms/BibliotecaRoom.tsx — Fase 1: Biblioteca como habitación.
// Entrar a un mundo vuelve al Taller (la tutora construye allí), como antes volvía a Gráfica.
import { Suspense, lazy } from 'react';
import { useHouseStore } from '../../stores/houseStore';
import { usePal } from '../../stores/themeStore';

const DiscoverWorkspace = lazy(() =>
  import('../panel/DiscoverWorkspace').then((m) => ({ default: m.DiscoverWorkspace }))
);

export function BibliotecaRoom() {
  const pal = usePal();
  const go = useHouseStore((s) => s.go);
  return (
    <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.dim }}>📚 cargando Biblioteca…</div>}>
      <DiscoverWorkspace onEnterWorld={() => go('taller')} />
    </Suspense>
  );
}
