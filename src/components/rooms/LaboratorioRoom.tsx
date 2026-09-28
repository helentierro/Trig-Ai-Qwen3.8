// src/components/rooms/LaboratorioRoom.tsx — Fase 4/4: applet GeoGebra REAL embebido.
// Online-only con fallback al Taller. Puente GGB→IA: cada update del applet lo narra la tutora.
// Atribución requerida por licencia no-comercial: "Creado con GeoGebra®".
import { useEffect, useRef, useState } from 'react';
import { emitHouse, onHouseEvent } from '../../stores/houseStore';
import { useChatStore } from '../../stores/chatStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { usePal } from '../../stores/themeStore';
import {
  GGB_MODULE_URL,
  buildScene,
  ggbUpdateToHouse,
  narrationForGgb,
  type GgbApi,
} from '../../services/geogebraBridge';

interface MathAppsModule {
  mathApps: {
    create: (params: Record<string, unknown>) => {
      inject: (el: HTMLElement) => { getAPI: () => Promise<GgbApi> };
    };
  };
}

type Status = 'loading' | 'ready' | 'error';

// La tutora narra como máximo 1 vez cada 10 s; el resto solo toast (evita spam al arrastrar).
let lastNarrated = 0;

export function LaboratorioRoom() {
  const pal = usePal();
  const boxRef = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

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

  // Puente GGB→IA: cada 'ggb-update' la tutora lo narra (con freno anti-spam) + toast.
  useEffect(() => {
    const off = onHouseEvent((e) => {
      if (e.type !== 'ggb-update') return;
      const now = Date.now();
      if (now - lastNarrated > 10_000) {
        lastNarrated = now;
        useChatStore.getState().push('ia', narrationForGgb(e.obj));
      }
      useCanvasStore.getState().toastMsg(`🧪 Laboratorio: ${e.obj} actualizado`);
    });
    return off;
  }, []);

  // Inyecta el applet real una vez (con limpieza para StrictMode).
  useEffect(() => {
    if (!online) return;
    const el = boxRef.current;
    if (!el) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    let api: GgbApi | null = null;
    (async () => {
      try {
        const mod = (await import(/* @vite-ignore */ GGB_MODULE_URL)) as unknown as MathAppsModule;
        if (cancelled) return;
        const w = Math.max(320, el.clientWidth || 800);
        const h = Math.max(320, el.clientHeight || 560);
        api = await mod.mathApps
          .create({
            appName: 'geometry',
            width: w,
            height: h,
            showToolBar: true,
            showAlgebraInput: false,
            showMenuBar: false,
            enableShiftDragZoom: true,
            language: 'es',
          })
          .inject(el)
          .getAPI();
        if (cancelled) {
          api.remove();
          return;
        }
        buildScene(api);
        api.registerUpdateListener((objName: string) => {
          emitHouse(ggbUpdateToHouse(objName));
        });
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      try { api?.remove(); } catch { /* silencioso */ }
      el.innerHTML = '';
    };
  }, [online, attempt]);

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

  if (status === 'error') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🧪</div>
        <strong>El laboratorio no cargó</strong>
        <p style={{ color: pal.dim, maxWidth: 440, lineHeight: 1.5 }}>
          GeoGebra no respondió. Revisa tu conexión o reintenta; el Taller sigue disponible.
        </p>
        <button
          onClick={() => { setStatus('loading'); setAttempt((a) => a + 1); }}
          style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${pal.accent}`, background: pal.accent, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {status === 'loading' && (
        <div style={{ padding: 12, color: pal.dim, fontSize: 12 }}>🧪 Cargando GeoGebra… (solo la primera vez tarda)</div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0 }} />
      <div style={{ padding: '6px 12px', borderTop: `1px solid ${pal.border}`, color: pal.faint, fontSize: 11, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Creado con GeoGebra® — <a href="https://www.geogebra.org" target="_blank" rel="noreferrer" style={{ color: pal.accent }}>geogebra.org</a></span>
        <span style={{ marginLeft: 'auto' }}>Mueve un punto: la tutora lo narra 🤖</span>
      </div>
    </div>
  );
}
