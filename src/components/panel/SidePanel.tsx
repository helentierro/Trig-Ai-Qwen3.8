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
    <aside style={{ width: 288, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${pal.border}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} title={t.label} style={{
            flex: 1, padding: '9px 0', background: tab === t.id ? 'rgba(56,189,248,.10)' : 'none',
            border: 'none', borderBottom: tab === t.id ? `2px solid ${pal.accent}` : '2px solid transparent',
            color: tab === t.id ? pal.accent : pal.dim, cursor: 'pointer', fontSize: 13,
          }}>{t.icon}</button>
        ))}
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer', padding: '0 10px' }}>⟨</button>
      </div>
      <div style={{ padding: '6px 10px 2px', color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {TABS.find((t) => t.id === tab)?.label}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>
        {tab === 'algebra' && <AlgebraBody />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'table' && <TableTab />}
        {tab === 'sheet' && <Spreadsheet />}
      </div>
    </aside>
  );
}