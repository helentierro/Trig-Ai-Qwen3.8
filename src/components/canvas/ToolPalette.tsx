// src/components/canvas/ToolPalette.tsx
import { useState } from 'react';
import { useCanvasStore, type Tool } from '../../stores/canvasStore';
import { useThemeStore } from '../../stores/themeStore';

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
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);
  const [open, setOpen] = useState(true);
  const [savesOpen, setSavesOpen] = useState(false);

  const dark = useThemeStore((t) => t.resolved) === 'dark';
  const bgBtn = dark ? '#111826' : '#ffffff';
  const border = dark ? '#1f2630' : '#d7dee8';
  const activeBorder = '#38bdf8';
  const activeBg = dark ? 'rgba(56,189,248,.18)' : 'rgba(2,132,199,.12)';

  const style = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, fontSize: 17, cursor: 'pointer',
    border: active ? `1px solid ${activeBorder}` : `1px solid ${border}`,
    background: active ? activeBg : bgBtn,
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
        <button title="Abrir mundo guardado" onClick={() => { if (!saves.length) toastMsg('Aún no hay mundos guardados'); setSavesOpen(!savesOpen); }} style={style(false)}>📂</button>
        {savesOpen && saves.length > 0 && (
          <div style={{ position: 'absolute', left: 46, top: 0, width: 190, background: bgBtn, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', zIndex: 6 }}>
            {saves.map((sv, i) => (
              <button key={sv.at} onClick={() => { loadSlot(i); setSavesOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 'none', color: dark ? '#e2e8f0' : '#1f2937', fontSize: 11.5, cursor: 'pointer' }}>
                📂 {new Date(sv.at).toLocaleString()}
              </button>
            ))}
          </div>
        )}
      </div>
      <button title={`Tema: ${mode} (clic para cambiar)`} onClick={cycle} style={style(false)}>
        {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'}
      </button>
    </div>
  );
}