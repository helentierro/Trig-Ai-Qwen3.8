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
    <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, padding: '12px 10px 6px', textTransform: 'uppercase', fontWeight: 700 }}>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px 8px' }}>
      <H>Herramientas</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => st().setTool(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 70,
            borderRadius: 12, border: tool === t.id ? `1px solid ${pal.accent}` : `1px solid ${pal.border}`,
            background: tool === t.id ? 'rgba(56,189,248,0.10)' : pal.card, color: pal.bubbleText, cursor: 'pointer',
            boxShadow: tool === t.id ? `0 0 0 1px ${pal.accent}30 inset` : 'none', padding: '10px 8px',
          }} title={t.name}>
            <span style={{ fontSize: 23, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{t.name}</span>
          </button>
        ))}
      </div>

      <H>Modo</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="⛓️" name="Cadena rectangular" desc="O→B horizontal, B→A vertical, imán ⚡" active={chain} onClick={() => st().setChain(!chain)} />
        <Item icon="🧲" name="Imán a la grilla" desc="Ajusta arrastres y puntos nuevos" active={gridMagnet} onClick={() => st().setGridMagnet(!gridMagnet)} />
      </div>

      <H>Ángulos rápidos</H>
      <div style={{ display: 'flex', gap: 6, padding: '2px 6px 0', flexWrap: 'wrap' }}>
        {[30, 45, 60].map((angle) => (
          <button key={angle} onClick={() => { st().setAngleDeg(angle); st().toastMsg(`⚡ Ajustado a ${angle}°`); }} style={{
            padding: '7px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
            border: `1px solid ${pal.border}`,
            background: pal.card, color: pal.bubbleText,
          }}>{angle}°</button>
        ))}
      </div>

      <H>Construcción</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="⊥" name="Perpendicular" desc="Genera una referencia perpendicular desde A" active={false} onClick={() => {
          if (st().points.O && st().points.B && st().points.A) {
            st().buildPerpendicular('O', 'B', 'A', 10);
            st().toastMsg('⊥ Generada: perpendicular desde A');
          }
        }} />
        <Item icon="∥" name="Paralela" desc="Crea un punto guía paralelo desde A" active={false} onClick={() => {
          if (st().points.O && st().points.B && st().points.A) {
            st().buildParallel('O', 'B', 'A', 8);
            st().toastMsg('∥ Generada: paralelo a O→B');
          }
        }} />
        <Item icon="◉" name="Distancia fija" desc="Punto a 30 unidades desde O" active={false} onClick={() => {
          if (st().points.O && st().points.B) {
            st().buildDistancePoint('O', 'B', 30);
            st().toastMsg('◉ Generado: punto a distancia fija');
          }
        }} />
        <Item icon="◎" name="Círculo" desc="Centro O y radio hasta B" active={false} onClick={() => {
          if (st().points.O && st().points.B) {
            st().buildCircle('O', 'B');
            st().toastMsg('◎ Generado: círculo con radio O-B');
          }
        }} />
        <Item icon="∩" name="Intersección" desc="Puntos donde se cortan círculos" active={false} onClick={() => {
          if (st().points.O && st().points.B && st().points.A) {
            st().buildCircle('O', 'B');
            st().buildCircle('B', 'A');
            st().buildIntersection('O', 'B', 30, 28.87);
            st().toastMsg('∩ Generadas: intersecciones de círculos');
          }
        }} />
      </div>

      <H>Estilo de vista</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, padding: '0 6px' }}>
        {GRIDS.map((g) => (
          <button key={g.id} onClick={() => st().setGridStyle(g.id)} style={{
            padding: '7px 8px', borderRadius: 9, cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
            border: `1px solid ${gridStyle === g.id ? pal.accent : pal.border}`,
            background: gridStyle === g.id ? 'rgba(56,189,248,.10)' : pal.card, color: pal.bubbleText,
          }}>{g.icon} {g.name}</button>
        ))}
      </div>

      <div style={{ paddingTop: 8 }}>
        <Item icon={mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'} name={`Tema: ${mode}`} desc="Cambia claro → sistema → oscuro" onClick={cycle} />
      </div>

      <H>Mundo</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="🎯" name="Ajustar vista" desc="Encuadra toda la figura" onClick={() => st().fitView()} />
        <Item icon="🧹" name="Volver al triángulo" desc="Limpia lo construido" onClick={() => st().loadWorld(null)} />
        <Item icon="💾" name="Guardar mundo" desc={`${saves.length}/5 slots usados`} onClick={() => st().saveWorld()} />
        <Item icon="↩️" name="Deshacer" desc="Ctrl+Z" onClick={() => st().undo()} />
        <Item icon="↪️" name="Rehacer" desc="Ctrl+Y" onClick={() => st().redo()} />
      </div>
    </div>
  );
}