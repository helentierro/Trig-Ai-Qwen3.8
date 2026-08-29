// src/components/panel/ToolsTab.tsx
import { useCanvasStore, type GridStyle, type Tool } from '../../stores/canvasStore';
import { useThemeStore, usePal } from '../../stores/themeStore';

const TOOLS: { id: Tool; icon: string; name: string; desc: string }[] = [
  { id: 'move', icon: '🖐', name: 'Mover', desc: 'Arrastra puntos, pan en el vacío, clic = menú' },
  { id: 'point', icon: '📍', name: 'Punto', desc: 'Clic en el vacío crea un punto libre' },
  { id: 'segment', icon: '📏', name: 'Segmento', desc: 'Clic en dos puntos para unirlos' },
  { id: 'circle', icon: '⭕', name: 'Círculo', desc: 'Clic en el centro y clic en el radio' },
];

const GRIDS: { id: GridStyle; icon: string; name: string }[] = [
  { id: 'fine', icon: '▦', name: 'Fina' }, { id: 'large', icon: '▫', name: 'Grande' },
  { id: 'circular', icon: '◯', name: 'Circular' }, { id: 'diamond', icon: '◇', name: 'Rombo' },
  { id: 'blank', icon: '⬜', name: 'Blanco' },
];

function Item({ icon, name, desc, active, onClick }: { icon: string; name: string; desc: string; active?: boolean; onClick: () => void }) {
  const pal = usePal();
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 10px',
      borderRadius: 10, border: active ? `1px solid ${pal.accent}` : `1px solid transparent`,
      background: active ? 'rgba(56,189,248,.10)' : 'none', color: pal.bubbleText, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700 }}>{name}</span>
        <span style={{ display: 'block', fontSize: 10.5, color: pal.faint }}>{desc}</span>
      </span>
      {active && <span style={{ color: pal.accent }}>✔</span>}
    </button>
  );
}

export function ToolsTab() {
  const pal = usePal();
  const st = () => useCanvasStore.getState();
  const tool = useCanvasStore((s) => s.tool);
  const chain = useCanvasStore((s) => s.chain);
  const gridMagnet = useCanvasStore((s) => s.gridMagnet);
  const gridStyle = useCanvasStore((s) => s.gridStyle);
  const saves = useCanvasStore((s) => s.saves);
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);

  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, padding: '10px 10px 4px', textTransform: 'uppercase' }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <H>Herramientas de dibujo</H>
      {TOOLS.map((t) => <Item key={t.id} icon={t.icon} name={t.name} desc={t.desc} active={tool === t.id} onClick={() => st().setTool(t.id)} />)}
      <H>Modo</H>
      <Item icon="⛓️" name="Cadena rectangular" desc="O→B horizontal, B→A vertical, imán ⚡" active={chain} onClick={() => st().setChain(!chain)} />
      <Item icon="🧲" name="Imán a la grilla" desc="Ajusta arrastres y puntos nuevos a la grilla" active={gridMagnet} onClick={() => st().setGridMagnet(!gridMagnet)} />
      <H>Estilo de vista</H>
      <div style={{ display: 'flex', gap: 6, padding: '4px 10px', flexWrap: 'wrap' }}>
        {GRIDS.map((g) => (
          <button key={g.id} onClick={() => st().setGridStyle(g.id)} style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11.5,
            border: `1px solid ${gridStyle === g.id ? pal.accent : pal.border}`,
            background: gridStyle === g.id ? 'rgba(56,189,248,.10)' : pal.card, color: pal.bubbleText,
          }}>{g.icon} {g.name}</button>
        ))}
      </div>
      <Item icon={mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'} name={`Tema: ${mode}`} desc="Cambia claro → sistema → oscuro" onClick={cycle} />
      <H>Mundo</H>
      <Item icon="🎯" name="Ajustar vista" desc="Encuadra toda la figura" onClick={() => st().fitView()} />
      <Item icon="🧹" name="Volver al triángulo" desc="Limpia lo construido" onClick={() => st().loadWorld(null)} />
      <Item icon="💾" name="Guardar mundo" desc={`${saves.length}/5 slots usados`} onClick={() => st().saveWorld()} />
      <Item icon="↩️" name="Deshacer (Ctrl+Z)" desc="Historial de 50 pasos" onClick={() => st().undo()} />
      <Item icon="↪️" name="Rehacer (Ctrl+Y)" desc="Recupera lo deshecho" onClick={() => st().redo()} />
    </div>
  );
}