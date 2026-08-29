import { useCanvasStore } from '../../stores/canvasStore';
import { useChatStore } from '../../stores/chatStore';
import { playScene } from '../../services/scenePlayer';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

export function ContextMenu() {
  const menu = useCanvasStore((s) => s.menu);
  if (!menu) return null;
  const st = () => useCanvasStore.getState();

  const explain = () => {
    const s = st();
    const p = s.points[menu.id];
    const g = s.segments.find((x) => x.id === menu.id);
    const c = s.circles.find((x) => x.id === menu.id);
    let txt = '';
    if (p) {
      txt = `Este es el punto ${menu.id} en (${fmt(p.pos.x)}, ${fmt(p.pos.y)}). ${p.locked ? 'Está fijo 🔒: desbloquéalo desde este menú.' : 'Arrástralo y descubre.'}`;
    } else if (g) {
      const len = Math.hypot(s.points[g.b].pos.x - s.points[g.a].pos.x, s.points[g.b].pos.y - s.points[g.a].pos.y);
      const extra = g.id === 'hyp' ? ' ¡Es la hipotenusa: el lado más largo!' : g.id === 'base' ? ' Es la base del triángulo.' : g.id === 'height' ? ' Es la altura del triángulo.' : '';
      txt = `Este segmento une ${g.a} con ${g.b} y mide ${fmt(len)}.${extra}`;
    } else if (c) {
      txt = `Este círculo tiene centro en ${c.c} y radio ${fmt(c.r)}.`;
    }
    s.closeMenu();
    useChatStore.getState().push('ia', txt);
    void playScene([{ type: 'say', text: txt }, { type: 'pulse', id: menu.id }]);
  };

  const item: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
    background: 'none', border: 'none', color: '#e2e8f0', fontSize: 12.5, cursor: 'pointer', borderRadius: 6,
  };
  const isPoint = !!st().points[menu.id];

  return (
    <div style={{
      position: 'absolute', left: Math.min(menu.x, (st().viewport.w || 800) - 190), top: Math.min(menu.y, (st().viewport.h || 600) - 170),
      width: 180, background: '#111826', border: '1px solid #2b3648', borderRadius: 10, padding: 5, zIndex: 20,
      boxShadow: '0 8px 30px rgba(0,0,0,.5)',
    }}>
      <button style={item} onClick={explain}>🤖 Explícame esto</button>
      {isPoint && <button style={item} onClick={() => st().toggleLock(menu.id)}>{st().points[menu.id].locked ? '🔓 Liberar objeto' : '🔒 Fijar objeto'}</button>}
      {isPoint && <button style={item} onClick={() => st().toggleLabel(menu.id)}>{st().points[menu.id].showLabel ? '🏷 Ocultar etiqueta' : '🏷 Mostrar etiqueta'}</button>}
      <button style={{ ...item, color: '#f87171' }} onClick={() => st().deleteObject(menu.id)}>🗑 Eliminar</button>
    </div>
  );
}