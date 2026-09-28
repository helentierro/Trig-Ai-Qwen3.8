// src/components/layout/HouseLayout.tsx — Fase 1: cáscara de la casa grande.
// Header (marca + navegación por habitaciones + controles docente) + contenido + footer opcional.
import type { CSSProperties, ReactNode } from 'react';
import { ROOMS, useHouseStore } from '../../stores/houseStore';
import { usePal } from '../../stores/themeStore';

export function HouseLayout({
  controls,
  footer,
  children,
}: {
  controls?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const pal = usePal();
  const room = useHouseStore((s) => s.room);
  const go = useHouseStore((s) => s.go);
  const active = ROOMS.find((r) => r.id === room);

  const navBtn = (selected: boolean, accent: string): CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${selected ? accent : pal.border}`,
    background: pal.card,
    color: selected ? accent : pal.dim,
    cursor: 'pointer',
    fontSize: 12,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: pal.bg, color: pal.bubbleText }}>
      <header style={{ padding: '10px 16px', borderBottom: `1px solid ${pal.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ background: pal.accent, color: '#fff', fontWeight: 800, borderRadius: 8, padding: '2px 10px' }}>Δ</span>
        <strong>Tutor de IA de trigonometría</strong>
        <span style={{ color: pal.dim, fontSize: 12 }}>{active?.hint ?? ''}</span>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} aria-label="Habitaciones de la casa">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              title={r.hint}
              style={navBtn(room === r.id, r.id === 'laboratorio' ? '#a78bfa' : r.id === 'sala' ? '#fbbf24' : pal.accent)}
              onClick={() => go(r.id)}
            >
              {r.icon} {r.label}
            </button>
          ))}
          {controls}
        </nav>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>{children}</div>
      {footer}
    </div>
  );
}
