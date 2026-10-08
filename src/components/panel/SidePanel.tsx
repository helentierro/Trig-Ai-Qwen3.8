// src/components/panel/SidePanel.tsx — panel redimensionable + hoja expandible (⛶ interno)
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
  const [width, setWidth] = useState(340);

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: 30, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, color: pal.dim, cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}>
      PANEL
    </button>
  );

  return (
    <aside style={{ width: tab === 'sheet' ? Math.max(width, 420) : width, minWidth: 260, maxWidth: 640, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: 'inset -1px 0 0 rgba(148,163,184,0.08)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${pal.border}`, background: 'rgba(15,23,42,0.02)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'sheet') setWidth((w) => Math.max(w, 440)); }} title={t.id === 'sheet' ? 'Hoja Excel 2.0 (⛶ = pantalla completa)' : t.label} style={{
            flex: 1, padding: '11px 0 10px', background: tab === t.id ? 'rgba(56,189,248,.08)' : 'transparent',
            border: 'none', borderBottom: tab === t.id ? `2px solid ${pal.accent}` : '2px solid transparent',
            color: tab === t.id ? pal.accent : pal.dim, cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
          }}>{t.icon}</button>
        ))}
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>⟨</button>
      </div>
      <div style={{ padding: '8px 12px 6px', color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>
        {TABS.find((t) => t.id === tab)?.label}{tab === 'sheet' ? ' · Excel 2.0 ⛶' : ''}
      </div>
      <div style={{ flex: 1, overflow: tab === 'sheet' ? 'hidden' : 'auto', paddingBottom: tab === 'sheet' ? 0 : 12, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 'algebra' && <AlgebraBody />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'table' && <TableTab />}
        {tab === 'sheet' && <Spreadsheet />}
      </div>
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const sx = e.clientX, sw = width;
          const mv = (ev: MouseEvent) => setWidth(Math.max(260, Math.min(640, sw + ev.clientX - sx)));
          const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
          window.addEventListener('mousemove', mv);
          window.addEventListener('mouseup', up);
        }}
        title="Arrastra para ensanchar la hoja"
        style={{ position: 'absolute', top: 0, right: -3, width: 6, height: '100%', cursor: 'ew-resize', zIndex: 5 }}
      />
    </aside>
  );
}