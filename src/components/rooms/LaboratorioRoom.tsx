// src/components/rooms/LaboratorioRoom.tsx — Fase 1: ala GeoGebra (placeholder online-only).
// Puente GGB→IA (dirección acordada): lo que el niño toque en GeoGebra lo narra la tutora.
// El embebido real (mathApps + material_id) llega en Fase 4; aquí queda el contrato:
// simulator button emite evento 'ggb-update' al bus de la casa y la tutora lo narra.
import { useEffect, useState } from 'react';
import { emitHouse, onHouseEvent } from '../../stores/houseStore';
import { useChatStore } from '../../stores/chatStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';

export function LaboratorioRoom() {
  const pal = usePal();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // Puente GGB→IA: cada 'ggb-update' la tutora lo narra en el chat + toast cálido.
  useEffect(() => {
    const off = onHouseEvent((e) => {
      if (e.type !== 'ggb-update') return;
      useChatStore.getState().push('ia', `🧪 Vi que moviste ${e.obj} en el Laboratorio. ${e.detail ?? '¡Buen toque! ¿Qué cambió en la figura?'}`);
      useCanvasStore.getState().toastMsg(`🧪 Laboratorio: ${e.obj} actualizado`);
    });
    return off;
  }, []);

  const simulateTouch = () => {
    // Simula lo que en Fase 4 enviará registerObjectUpdateListener("A", …) de GeoGebra.
    emitHouse({ type: 'ggb-update', obj: 'punto A', detail: 'Arrastraste el vértice: el ángulo θ se movió contigo.' });
  };

  if (!online) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🧪</div>
        <strong>Laboratorio sin conexión</strong>
        <p style={{ color: pal.dim, maxWidth: 440, lineHeight: 1.5 }}>
          El ala GeoGebra necesita internet. Mientras tanto el Taller sigue abierto y offline.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 44 }}>🧪</div>
      <strong>Laboratorio GeoGebra</strong>
      <p style={{ color: pal.dim, maxWidth: 480, lineHeight: 1.5 }}>
        Aquí vivirá el applet embebido (geometry/graphing vía mathApps + material_id de trigonometría).
        Fase 1 deja el contrato: cada toque en GeoGebra emite <code>ggb-update</code> y la tutora lo narra.
      </p>
      <button
        onClick={simulateTouch}
        style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${pal.ia}`, background: 'transparent', color: pal.ia, fontWeight: 700, cursor: 'pointer' }}
      >
        ✨ Simular toque GeoGebra → la tutora narra
      </button>
    </div>
  );
}
