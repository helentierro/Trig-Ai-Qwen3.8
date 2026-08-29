import { useCanvasStore, type Tool } from '../../stores/canvasStore';
import { useChatStore } from '../../stores/chatStore';

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'move', icon: '🖐', label: 'Mover / arrastrar' },
  { id: 'point', icon: '📍', label: 'Crear punto (clic en el vacío)' },
  { id: 'segment', icon: '📏', label: 'Segmento (clic en dos puntos)' },
  { id: 'circle', icon: '⭕', label: 'Círculo (clic centro + clic radio)' },
];

export function ToolPalette() {
  const tool = useCanvasStore((s) => s.tool);
  const setTool = useCanvasStore((s) => s.setTool);
  const loadWorld = useCanvasStore((s) => s.loadWorld);
  const gridMagnet = useCanvasStore((s) => s.gridMagnet);
  const setGridMagnet = useCanvasStore((s) => s.setGridMagnet);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const saveWorld = useCanvasStore((s) => s.saveWorld);
  const loadSavedWorld = useCanvasStore((s) => s.loadSavedWorld);

  const style = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, fontSize: 17, cursor: 'pointer',
    border: active ? '1px solid #38bdf8' : '1px solid #1f2630',
    background: active ? 'rgba(56,189,248,.18)' : '#111826',
  });

  return (
    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
      {TOOLS.map((t) => (
        <button key={t.id} title={t.label} onClick={() => setTool(t.id)} style={style(tool === t.id)}>{t.icon}</button>
      ))}
      <button title="Imán a la grilla (opcional)" onClick={() => setGridMagnet(!gridMagnet)} style={style(gridMagnet)}>🧲</button>
      <button title="Volver al triángulo (limpia lo construido)" onClick={() => loadWorld(null)} style={style(false)}>🧹</button>
      <div style={{ height: 6 }} />
      <button title="Deshacer (Ctrl+Z)" onClick={undo} style={style(false)}>↩️</button>
      <button title="Rehacer (Ctrl+Y)" onClick={redo} style={style(false)}>↪️</button>
      <div style={{ height: 6 }} />
      <button title="Guardar mundo (en este navegador)" onClick={() => { saveWorld(); useChatStore.getState().push('ia', '💾 Mundo guardado en este navegador.'); }} style={style(false)}>💾</button>
      <button title="Abrir mundo guardado" onClick={() => { const ok = loadSavedWorld(); useChatStore.getState().push('ia', ok ? '📂 Mundo cargado.' : 'Aún no hay mundos guardados. 🌱'); }} style={style(false)}>📂</button>
    </div>
  );
}