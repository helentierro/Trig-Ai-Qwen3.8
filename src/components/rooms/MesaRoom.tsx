// src/components/rooms/MesaRoom.tsx — Fase A: UNA mesa con pestañas (Tabla | Hoja).
import { useState } from 'react';
import { TableTab } from '../panel/TableTab';
import { Spreadsheet } from '../panel/Spreadsheet';
import { usePal } from '../../stores/themeStore';

export function MesaRoom() {
  const pal = usePal();
  const [tab, setTab] = useState<'tabla' | 'hoja'>('hoja');
  const isSheet = tab === 'hoja';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px 8px', alignItems: 'center' }}>
        {(['tabla', 'hoja'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              border: `1px solid ${tab === t ? pal.accent : pal.border}`,
              background: tab === t ? 'rgba(56,189,248,.10)' : pal.card,
              color: tab === t ? pal.accent : pal.dim,
            }}>
            {t === 'tabla' ? '🧮 Tabla' : '▦ Hoja Excel 2.0'}
          </button>
        ))}
        {isSheet && <span style={{ color: pal.faint, fontSize: 11 }}>Flechas · Tab · Enter · F2 · Ctrl+C/V/Z · ? = ayuda</span>}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: isSheet ? 'hidden' : 'auto' }}>
        {tab === 'tabla' ? <TableTab /> : <Spreadsheet />}
      </div>
    </div>
  );
}
