// src/components/rooms/MesaRoom.tsx — Fase 1: Mesa de Cálculo como habitación propia.
// Antes eran tabs escondidas del SidePanel (Tabla/Hoja); ahora viven aquí.
import { TableTab } from '../panel/TableTab';
import { Spreadsheet } from '../panel/Spreadsheet';
import { usePal } from '../../stores/themeStore';

export function MesaRoom() {
  const pal = usePal();
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <section style={{ flex: 1, borderRight: `1px solid ${pal.border}`, overflowY: 'auto', padding: 12 }}>
        <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Tabla
        </div>
        <TableTab />
      </section>
      <section style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Hoja
        </div>
        <Spreadsheet />
      </section>
    </div>
  );
}
