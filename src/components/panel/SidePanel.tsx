// src/components/panel/SidePanel.tsx
import { useState } from 'react';
import { usePal } from '../../stores/themeStore';
import { AlgebraBody } from './AlgebraPanel';
import { ToolsTab } from './ToolsTab';
import { TableTab } from './TableTab';
import { Spreadsheet } from './Spreadsheet';

type Tab = 'algebra' | 'tools' | 'table' | 'sheet';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'algebra', icon: '∑', label: 'Álgebra' },
  { id: 'tools', icon: '🛠', label: 'Herramientas' },
  { id: 'table', icon: '🧮', label: 'Tabla' },
  { id: 'sheet', icon: '▦', label: 'Hoja' },
];

export function SidePanel() {
  const pal = usePal();
  const [tab, setTab] = useState<Tab>('algebra');
  const [open, setOpen] = useState(true);

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: 30, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, color: pal.dim, cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}>
      PANEL
    </button>
  );

  return (
    <aside style={{ width: 290, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: 'inset -1px 0 0 rgba(148,163,184,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${pal.border}`, background: 'rgba(15,23,42,0.02)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} title={t.label} style={{
            flex: 1, padding: '11px 0 10px', background: tab === t.id ? 'rgba(56,189,248,.08)' : 'transparent',
            border: 'none', borderBottom: tab === t.id ? `2px solid ${pal.accent}` : '2px solid transparent',
            color: tab === t.id ? pal.accent : pal.dim, cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
          }}>{t.icon}</button>
        ))}
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>⟨</button>
      </div>
      <div style={{ padding: '8px 12px 6px', color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>
        {TABS.find((t) => t.id === tab)?.label}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {tab === 'algebra' && <AlgebraBody />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'table' && <TableTab />}
        {tab === 'sheet' && <Spreadsheet />}
      </div>
    </aside>
  );
}