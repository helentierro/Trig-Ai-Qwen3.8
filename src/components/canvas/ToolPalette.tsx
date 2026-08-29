import { useState } from 'react';
import { useCanvasStore, type Tool } from '../../stores/canvasStore';

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
  const chain = useCanvasStore((s) => s.chain);
  const setChain = useCanvasStore((s) => s.setChain);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const saveWorld = useCanvasStore((s) => s.saveWorld);
  const loadSlot = useCanvasStore((s) => s.loadSlot);
  const saves = useCanvasStore((s) => s.saves);
  const toastMsg = useCanvasStore((s) => s.toastMsg);
  const [open, setOpen] = useState(true);
  const [savesOpen, setSavesOpen] = useState(false);

  const style = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, fontSize: 17, cursor: 'pointer',
    border: active ? '1px solid #38bdf8' : '1px solid #1f2630',
    background: active ? 'rgba(56,189,248,.18)' : '#111826',
  });

  if (!open) return (
    <button title="Mostrar herramientas" onClick={() => setOpen(true)}
      style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, ...style(false) }}>🛠</button>
  );

  return (
    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
      <button title="Ocultar herramientas" onClick={() => setOpen(false)} style={{ ...style(false), fontSize: 12 }}>⟨</button>
      {TOOLS.map((t) => (
        <button key={t.id} title={t.label} onClick={() => setTool(t.id)} style={style(tool === t.id)}>{t.icon}</button>
      ))}
      <button title="Cadena: triángulo rectángulo" onClick={() => setChain(!chain)} style={style(chain)}>⛓️</button>
      <button title="Imán a la grilla (opcional)" onClick={() => setGridMagnet(!gridMagnet)} style={style(gridMagnet)}>🧲</button>
      <button title="Volver al triángulo (limpia lo construido)" onClick={() => loadWorld(null)} style={style(false)}>🧹</button>
      <div style={{ height: 4 }} />
      <button title="Deshacer (Ctrl+Z)" onClick={undo} style={style(false)}>↩️</button>
      <button title="Rehacer (Ctrl+Y)" onClick={redo} style={style(false)}>↪️</button>
      <div style={{ height: 4 }} />
      <button title="Guardar mundo" onClick={saveWorld} style={style(false)}>💾</button>
      <div style={{ position: 'relative' }}>
        <button title="Abrir mundo guardado" onClick={() => { if (!saves.length) toastMsg('Aún no hay mundos guardados 🌱'); setSavesOpen(!savesOpen); }} style={style(false)}>📂</button>
        {savesOpen && saves.length > 0 && (
          <div style={{ position: 'absolute', left: 46, top: 0, width: 190, background: '#111826', border: '1px solid #2b3648', borderRadius: 10, padding: 5, zIndex: 20 }}>
            {saves.map((sv, i) => (
              <button key={sv.at} onClick={() => { loadSlot(i); setSavesOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: 11.5, cursor: 'pointer', borderRadius: 6, fontFamily: 'monospace' }}>
                🌍 {new Date(sv.at).toLocaleString()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}