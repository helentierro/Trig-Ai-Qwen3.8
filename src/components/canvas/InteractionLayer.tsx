import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { type Vec2, screenToWorld, worldToScreen } from '../../utils/coordinateTransform';

const HIT_RADIUS = 18;

export function InteractionLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Vec2>());
  const gesture = useRef<null | { type: 'drag' } | { type: 'pan' } | { type: 'pinch' }>(null);
  const [panning, setPanning] = useState(false);
  const hoverId = useCanvasStore((s) => s.hoverId);
  const dragId = useCanvasStore((s) => s.dragId);

  const localPt = (e: { clientX: number; clientY: number }): Vec2 => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hitTest = (pt: Vec2): string | null => {
    const { points, camera, playing } = useCanvasStore.getState();
    if (playing) return null; // mientras la IA construye, el niño mira (pan/zoom sí)
    for (const p of Object.values(points)) {
      if (!p.visible) continue;
      const sp = worldToScreen(p.pos, camera);
      if (Math.hypot(sp.x - pt.x, sp.y - pt.y) <= HIT_RADIUS) return p.id;
    }
    return null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    ref.current?.setPointerCapture(e.pointerId);
    const pt = localPt(e);
    pointers.current.set(e.pointerId, pt);
    if (pointers.current.size === 2) {
      if (gesture.current?.type === 'drag') useCanvasStore.getState().endDrag();
      gesture.current = { type: 'pinch' };
      setPanning(false);
    } else {
      const id = hitTest(pt);
      if (id) { useCanvasStore.getState().beginDrag(id); gesture.current = { type: 'drag' }; }
      else { gesture.current = { type: 'pan' }; setPanning(true); }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pt = localPt(e);
    const prev = pointers.current.get(e.pointerId);
    const st = useCanvasStore.getState();

    if (!prev) { st.setHover(hitTest(pt)); return; }

    if (gesture.current?.type === 'pinch' && pointers.current.size >= 2) {
      const [[id1, a], [id2, b]] = [...pointers.current.entries()];
      const a2 = e.pointerId === id1 ? pt : a;
      const b2 = e.pointerId === id2 ? pt : b;
      const dPrev = Math.hypot(a.x - b.x, a.y - b.y);
      const dNew = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      const midPrev = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const midNew = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 };
      if (dPrev > 0) st.zoomAtScreen(midNew, st.camera.zoom * (dNew / dPrev));
      st.panBy(midNew.x - midPrev.x, midNew.y - midPrev.y);
    } else if (gesture.current?.type === 'drag') {
      st.dragTo(st.dragId!, screenToWorld(pt, st.camera));
    } else if (gesture.current?.type === 'pan') {
      st.panBy(pt.x - prev.x, pt.y - prev.y);
    }
    pointers.current.set(e.pointerId, pt);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      if (gesture.current?.type === 'drag') useCanvasStore.getState().endDrag();
      gesture.current = null;
      setPanning(false);
    } else if (pointers.current.size === 1 && gesture.current?.type === 'pinch') {
      gesture.current = { type: 'pan' };
    }
  };

  useEffect(() => {
    const el = ref.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const st = useCanvasStore.getState();
      st.zoomAtScreen({ x: e.clientX - r.left, y: e.clientY - r.top }, st.camera.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const cursor = dragId ? 'grabbing' : panning ? 'grabbing' : hoverId ? 'grab' : 'default';

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => useCanvasStore.getState().setHover(null)}
      onDoubleClick={() => useCanvasStore.getState().fitView()}
      style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor, overflow: 'hidden', userSelect: 'none' }}
    >
      {children}
    </div>
  );
}