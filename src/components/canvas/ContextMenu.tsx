// src/components/canvas/ContextMenu.tsx
import { useCanvasStore, type GridStyle } from '../../stores/canvasStore';
import { useThemeStore } from '../../stores/themeStore';

const W = 216;

export function ContextMenu() {
  const menu = useCanvasStore((s) => s.menu);
  const viewMenu = useCanvasStore((s) => s.viewMenu);
  const viewport = useCanvasStore((s) => s.viewport);
  const points = useCanvasStore((s) => s.points);
  const gridStyle = useCanvasStore((s) => s.gridStyle);
  const resolved = useThemeStore((t) => t.resolved);

  if (!menu && !viewMenu) return null;

  const dark = resolved === 'dark';
  const bg = dark ? '#111826' : '#ffffff';
  const border = dark ? '#2b3648' : '#d7dee8';
  const text = dark ? '#e2e8f0' : '#1f2937';
  const dim = dark ? '#8b949e' : '#61708b';
  const hoverBg = dark ? '#1c2534' : '#f1f5f9';

  const pos = menu ?? viewMenu!;
  const x = Math.min(pos.x, viewport.w - W - 8);
  const y = Math.min(pos.y, viewport.h - 320);

  const item: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '7px 12px', background: 'none', border: 'none', color: text,
    fontSize: 12.5, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
  };

  const st = () => useCanvasStore.getState();

  /* ── Menú de VISTA (clic derecho en vacío) ── */
  if (viewMenu) {
    const grids: { id: GridStyle; label: string; icon: string }[] = [
      { id: 'fine', label: 'Cuadrícula fina', icon: '▦' },
      { id: 'large', label: 'Cuadrícula grande', icon: '▫' },
      { id: 'circular', label: 'Circular', icon: '◯' },
      { id: 'diamond', label: 'Rombo', icon: '◇' },
      { id: 'blank', label: 'Fondo blanco', icon: '⬜' },
    ];
    return (
      <div style={{ position: 'absolute', left: x, top: Math.max(8, y), width: W, background: bg, border: `1px solid ${border}`, borderRadius: 10, zIndex: 40, boxShadow: '0 8px 30px rgba(0,0,0,.35)', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px 4px', color: dim, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Estilo de vista</div>
        {grids.map((g) => (
          <button key={g.id} style={{ ...item, background: gridStyle === g.id ? hoverBg : 'none', fontWeight: gridStyle === g.id ? 700 : 400 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = gridStyle === g.id ? hoverBg : 'none')}
            onClick={() => { st().setGridStyle(g.id); st().closeViewMenu(); }}>
            <span>{g.icon}</span> {g.label} {gridStyle === g.id && <span style={{ marginLeft: 'auto', color: '#38bdf8' }}>✔</span>}
          </button>
        ))}
        <div style={{ height: 1, background: border, margin: '4px 0' }} />
        <button style={item} onClick={() => { st().fitView(); st().closeViewMenu(); }}>🎯 Ajustar vista</button>
        <button style={item} onClick={() => { st().loadWorld(null); st().closeViewMenu(); }}>🧹 Volver al triángulo</button>
      </div>
    );
  }

  /* ── Menú de OBJETO (clic o clic derecho sobre punto/segmento/círculo) ── */
  const id = menu!.id;
  const p = points[id];
  const isPoint = !!p;
  const title = id;

  return (
    <div style={{ position: 'absolute', left: x, top: Math.max(8, y), width: W, background: bg, border: `1px solid ${border}`, borderRadius: 10, zIndex: 40, boxShadow: '0 8px 30px rgba(0,0,0,.35)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px 4px', color: dim, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {isPoint ? `Punto ${title}` : `Objeto ${title}`}
      </div>
      <button style={item} onClick={() => st().toggleVisible(id)}>👁 {(() => {
        const obj = p ?? st().segments.find((g) => g.id === id) ?? st().circles.find((c) => c.id === id);
        return obj?.visible ? 'Ocultar' : 'Mostrar';
      })()}</button>
      {isPoint && (
        <button style={item} onClick={() => st().toggleLabel(id)}>🏷 Etiqueta: {p.showLabel ? 'on' : 'off'}</button>
      )}
      {isPoint && (
        <button style={item} onClick={() => st().toggleLock(id)}>🔒 {p.locked ? 'Liberar' : 'Fijar (objeto fijo)'}</button>
      )}
      <button style={item} onClick={() => st().duplicateObject(id)}>⧉ Duplicar</button>
      <div style={{ height: 1, background: border, margin: '4px 0' }} />
      <button style={{ ...item, color: '#f87171' }} onClick={() => st().deleteObject(id)}>🗑 Eliminar</button>
    </div>
  );
}