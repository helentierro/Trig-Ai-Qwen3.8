// src/components/ui/primitives.tsx — sistema de componentes con tokens (Fase H)
import type { CSSProperties, ReactNode } from 'react';
import { usePal } from '../../stores/themeStore';

export function SectionTitle({ children }: { children: ReactNode }) {
  const pal = usePal();
  return <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, padding: '10px 10px 4px', textTransform: 'uppercase' }}>{children}</div>;
}

export function Btn({ children, onClick, active, danger, style, title, disabled }: {
  children: ReactNode; onClick?: () => void; active?: boolean; danger?: boolean;
  style?: CSSProperties; title?: string; disabled?: boolean;
}) {
  const pal = usePal();
  return (
    <button title={title} disabled={disabled} onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        border: `1px solid ${active ? pal.accent : pal.border}`,
        background: active ? 'rgba(56,189,248,.10)' : pal.card,
        color: danger ? '#f87171' : active ? pal.accent : pal.bubbleText,
        opacity: disabled ? 0.5 : 1, fontFamily: 'inherit', ...style,
      }}>
      {children}
    </button>
  );
}

export function TextInput({ value, onChange, onEnter, placeholder, style, mono = true }: {
  value: string; onChange: (v: string) => void; onEnter?: () => void;
  placeholder?: string; style?: CSSProperties; mono?: boolean;
}) {
  const pal = usePal();
  return (
    <input value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
      style={{
        background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 6,
        color: pal.bubbleText, fontSize: 12, fontFamily: mono ? 'monospace' : 'inherit',
        padding: '6px 8px', outline: 'none', width: '100%', ...style,
      }} />
  );
}

export function ListRow({ icon, title, desc, active, onClick }: {
  icon: string; title: string; desc?: string; active?: boolean; onClick: () => void;
}) {
  const pal = usePal();
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 10px',
      borderRadius: 10, border: active ? `1px solid ${pal.accent}` : '1px solid transparent',
      background: active ? 'rgba(56,189,248,.10)' : 'none', color: pal.bubbleText, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700 }}>{title}</span>
        {desc && <span style={{ display: 'block', fontSize: 10.5, color: pal.faint }}>{desc}</span>}
      </span>
      {active && <span style={{ color: pal.accent }}>✔</span>}
    </button>
  );
}