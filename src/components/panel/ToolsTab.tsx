// src/components/panel/ToolsTab.tsx — Fase 2: paridad de herramientas.
// 7 herramientas (mover/punto/segmento/círculo + regla/transportador/polígono),
// medición con readout, construcción con parámetros editables (fin de números mágicos),
// transformaciones sobre la selección y deslizador de radio.
import { useState } from 'react';
import { useCanvasStore, type GridStyle, type Tool } from '../../stores/canvasStore';
import { useThemeStore, usePal } from '../../stores/themeStore';
import { extractNums } from '../../utils/expr';
import { runConstruction } from '../../services/scenePlayer';
import { TextInput } from '../ui/primitives';

const TOOLS: { id: Tool; icon: string; name: string; desc: string }[] = [
  { id: 'move', icon: '🖐', name: 'Mover', desc: 'Arrastra puntos, pan en el vacío, clic = menú' },
  { id: 'point', icon: '📍', name: 'Punto', desc: 'Clic en el vacío crea un punto libre' },
  { id: 'segment', icon: '🔗', name: 'Segmento', desc: 'Clic en dos puntos para unirlos' },
  { id: 'circle', icon: '⭕', name: 'Círculo', desc: 'Clic en el centro y clic en el radio' },
  { id: 'ruler', icon: '📏', name: 'Regla', desc: 'Clic en 2 puntos: mide la distancia' },
  { id: 'protractor', icon: '📐', name: 'Transportador', desc: 'Clic en 3 puntos: ángulo en el 2º' },
  { id: 'polygon', icon: '⬠', name: 'Polígono', desc: 'Toca vértices; cierra en el 1º' },
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

function H({ children }: { children: React.ReactNode }) {
  const pal = usePal();
  return (
    <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, padding: '12px 10px 6px', textTransform: 'uppercase', fontWeight: 700 }}>{children}</div>
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
  const pending = useCanvasStore((s) => s.pending);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const points = useCanvasStore((s) => s.points);
  const segments = useCanvasStore((s) => s.segments);
  const circles = useCanvasStore((s) => s.circles);
  const measurement = useCanvasStore((s) => s.measurement);
  const decimals = useCanvasStore((s) => s.decimals);
  const voiceOn = useCanvasStore((s) => s.voiceOn);
  const playing = useCanvasStore((s) => s.playing);
  const mode = useThemeStore((t) => t.mode);
  const cycle = useThemeStore((t) => t.cycle);
  const [perpOff, setPerpOff] = useState('10');
  const [parOff, setParOff] = useState('8');
  const [distR, setDistR] = useState('30');

  const needNum = (label: string, v: string): number | null => {
    const n = extractNums(v);
    if (!n.length) {
      st().toastMsg(`⚠️ "${v}" no es válido para ${label}: escribe un número`);
      return null;
    }
    return n[0];
  };

  const selSeg = segments.find((g) => g.id === selectedId);
  const selCircle = circles.find((c) => c.id === selectedId);
  const selIsPoint = !!selectedId && !!points[selectedId];

  const needSelected = (what: 'segmento' | 'punto' | 'círculo'): boolean => {
    const ok = what === 'segmento' ? !!selSeg : what === 'círculo' ? !!selCircle : selIsPoint;
    if (!ok) st().toastMsg(`👆 Selecciona primero un ${what} en el lienzo o el Álgebra`);
    return ok;
  };

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
          }} title={`${t.name}: ${t.desc}`}>
            <span style={{ fontSize: 23, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{t.name}</span>
          </button>
        ))}
      </div>

      <H>Medición</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 6px' }}>
        {measurement ? (
          <div style={{ padding: '8px 10px', borderRadius: 10, border: `1px solid ${pal.accent}`, background: 'rgba(56,189,248,.08)', fontFamily: 'monospace', fontSize: 13, color: pal.bubbleText, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>{measurement.label} = {Number(measurement.value.toFixed(decimals))}{measurement.unit}</span>
            <button onClick={() => st().setMeasurement(null)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer' }} title="Limpiar">✕</button>
          </div>
        ) : (
          <div style={{ color: pal.faint, fontSize: 11, lineHeight: 1.5 }}>
            Toca 2 puntos con 📏, 3 con 📐 o cierra un ⬠: el resultado vive aquí.
          </div>
        )}
        {pending.length > 0 && (
          <button onClick={() => st().cancelPending()} style={{ padding: '6px 10px', borderRadius: 9, border: `1px dashed ${pal.border}`, background: 'none', color: pal.dim, cursor: 'pointer', fontSize: 11.5 }}>
            ⏳ {pending.length} toque(s) en curso — cancelar (Esc)
          </button>
        )}
      </div>

      <H>Modo</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="📐" name={chain ? 'Liberar (soltar recto)' : 'Fijar recto'} desc="Endereza B a 90° · asistencia, no modo" active={chain} onClick={() => {
          if (chain) st().setChain(false);
          else st().fixRight();
        }} />
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

      <H>Construcción (con parámetros)</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 6px' }}>
          <div style={{ flex: 1 }}>
            <Item icon="⊥" name="Perpendicular" desc="Referencia ⊥ desde A (largo editable)" active={false} onClick={() => {
              const off = needNum('perpendicular', perpOff);
              if (off === null) return;
              if (st().points.O && st().points.B && st().points.A) {
                st().buildPerpendicular('O', 'B', 'A', off);
                st().toastMsg(`⊥ Generada: perpendicular desde A (largo ${off})`);
              }
            }} />
          </div>
          <TextInput value={perpOff} onChange={setPerpOff} placeholder="largo" style={{ width: 52 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 6px' }}>
          <div style={{ flex: 1 }}>
            <Item icon="∥" name="Paralela" desc="Punto guía ∥ a O→B (paso editable)" active={false} onClick={() => {
              const off = needNum('paralela', parOff);
              if (off === null) return;
              if (st().points.O && st().points.B && st().points.A) {
                st().buildParallel('O', 'B', 'A', off);
                st().toastMsg(`∥ Generada: paralelo a O→B (paso ${off})`);
              }
            }} />
          </div>
          <TextInput value={parOff} onChange={setParOff} placeholder="paso" style={{ width: 52 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 6px' }}>
          <div style={{ flex: 1 }}>
            <Item icon="◉" name="Distancia fija" desc="Punto a distancia editable desde O" active={false} onClick={() => {
              const r = needNum('distancia', distR);
              if (r === null) return;
              if (st().points.O && st().points.B) {
                st().buildDistancePoint('O', 'B', r);
                st().toastMsg(`◉ Generado: punto a distancia ${r} desde O`);
              }
            }} />
          </div>
          <TextInput value={distR} onChange={setDistR} placeholder="radio" style={{ width: 52 }} />
        </div>
        <Item icon="◎" name="Círculo" desc="Centro O y radio hasta B" active={false} onClick={() => {
          if (st().points.O && st().points.B) {
            st().buildCircle('O', 'B');
            st().toastMsg('◎ Generado: círculo con radio O-B');
          }
        }} />
        <Item icon="∩" name="Intersección real" desc="Lente O–B con radios medidos (sin magia)" active={false} onClick={() => {
          if (st().points.O && st().points.B) st().buildCircleIntersection('O', 'B');
          else st().toastMsg('👆 Necesitas los puntos O y B');
        }} />
      </div>

      <H>Sobre la selección</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="⦿" name="Punto medio" desc="Del segmento seleccionado" active={false} onClick={() => {
          if (needSelected('segmento')) st().buildMidpoint(selectedId!);
        }} />
        <Item icon="✂️" name="Mediatriz" desc="⊥ por el punto medio del segmento" active={false} onClick={() => {
          if (needSelected('segmento')) st().buildBisector(selectedId!);
        }} />
        <Item icon="🪞" name="Reflejar sobre base" desc="Punto seleccionado ↔ otro lado de O→B" active={false} onClick={() => {
          if (needSelected('punto') && st().points.O && st().points.B) st().reflectPointAcross(selectedId!, 'O', 'B');
        }} />
        <Item icon="⟳" name="Rotar 90° sobre O" desc="Punto seleccionado, antihorario" active={false} onClick={() => {
          if (needSelected('punto') && st().points.O) st().rotatePointAround(selectedId!, 'O', 90);
        }} />
      </div>

      <H>Deslizador</H>
      <div style={{ padding: '0 6px' }}>
        {selCircle ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 12, color: pal.bubbleText }}>
            r({selCircle.id})
            <input type="range" min={5} max={200} value={Math.round(selCircle.r)}
              onChange={(e) => st().setCircleRadius(selCircle.id, +e.target.value)}
              style={{ flex: 1, accentColor: pal.accent }} />
            {Number(selCircle.r.toFixed(decimals))}
          </label>
        ) : (
          <div style={{ color: pal.faint, fontSize: 11, lineHeight: 1.5 }}>
            Selecciona un círculo para ajustar su radio con el deslizador.
          </div>
        )}
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

      <H>Sesión (docente)</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon="🔊" name={voiceOn ? 'Voz: encendida' : 'Voz: apagada'} desc="La tutora narra en voz alta" active={voiceOn} onClick={() => st().setVoiceOn(!voiceOn)} />
        <Item icon="🎬" name={playing ? 'Construyendo…' : 'Construcción IA'} desc="La tutora dibuja el triángulo" active={false} onClick={() => runConstruction()} />
      </div>
    </div>
  );
}
