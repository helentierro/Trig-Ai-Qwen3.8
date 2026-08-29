import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { type Vec2, screenToWorld, worldToScreen } from '../../utils/coordinateTransform';

const HIT_RADIUS = 18;

export function InteractionLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Vec2>());
  const gesture = useRef<null | { type: 'drag' } | { type: 'pan' } | { type: 'pinch' }>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpPos = useRef<Vec2 | null>(null);
  const [panning, setPanning] = useState(false);
  const hoverId = useCanvasStore((s) => s.hoverId);
  const dragId = useCanvasStore((s) => s.dragId);
  const tool = useCanvasStore((s) => s.tool);

  const localPt = (e: { clientX: number; clientY: number }): Vec2 => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hitTest = (pt: Vec2): string | null => {
    const { points, camera, playing } = useCanvasStore.getState();
    if (playing) return null;
    for (const p of Object.values(points)) {
      if (!p.visible) continue;
      const sp = worldToScreen(p.pos, camera);
      if (Math.hypot(sp.x - pt.x, sp.y - pt.y) <= HIT_RADIUS) return p.id;
    }
    return null;
  };

  const clearLp = () => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 2) return; // el clic derecho lo maneja onContextMenu
    ref.current?.setPointerCapture(e.pointerId);
    const pt = localPt(e);
    pointers.current.set(e.pointerId, pt);
    const st = useCanvasStore.getState();
    st.closeMenu();

    if (pointers.current.size === 2) {
      if (gesture.current?.type === 'drag') st.endDrag();
      gesture.current = { type: 'pinch' };
      setPanning(false);
      return;
    }

    if (st.tool !== 'move') {
      const hit = hitTest(pt);
      if (st.tool === 'point') { if (!hit) st.addPointAt(screenToWorld(pt, st.camera)); }
      else if (hit) st.clickPoint(hit);
      gesture.current = null;
      return;
    }

    const id = hitTest(pt);
    if (id) { st.beginDrag(id); gesture.current = { type: 'drag' }; }
    else { gesture.current = { type: 'pan' }; setPanning(true); }

    // long-press en touch → menú contextual
    if (e.pointerType === 'touch' && id) {
      lpPos.current = pt;
      lpTimer.current = setTimeout(() => {
        if (gesture.current?.type === 'drag') st.endDrag();
        gesture.current = null;
        setPanning(false);
        useCanvasStore.getState().openMenu(id, pt.x, pt.y);
      }, 550);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pt = localPt(e);
    if (lpTimer.current && lpPos.current && Math.hypot(pt.x - lpPos.current.x, pt.y - lpPos.current.y) > 10) clearLp();
    const prev = pointers.current.get(e.pointerId);
    const st = useCanvasStore.getState();
    st.setCursorWorld(screenToWorld(pt, st.camera));

    if (!prev) { st.setHover(st.tool === 'move' ? hitTest(pt) : null); return; }

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
    clearLp();
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      if (gesture.current?.type === 'drag') useCanvasStore.getState().endDrag();
      gesture.current = null;
      setPanning(false);
    } else if (pointers.current.size === 1 && gesture.current?.type === 'pinch') {
      gesture.current = { type: 'pan' };
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const pt = localPt(e);
    const st = useCanvasStore.getState();
    const hit = hitTest(pt);
    if (hit) st.openMenu(hit, pt.x, pt.y);
    else st.closeMenu();
  };

  useEffect(() => {
    const el = ref.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const st = useCanvasStore.getState();
      st.zoomAtScreen({ x: e.clientX - r.left, y: e.clientY - r.top }, st.camera.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    const onKey = (e: KeyboardEvent) => {
      const st = useCanvasStore.getState();
      if (e.key === 'Escape') { st.setTool('move'); st.cancelPending(); st.closeMenu(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? st.redo() : st.undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); st.redo(); }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => { el.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, []);

  const cursor = tool !== 'move' ? 'crosshair' : dragId ? 'grabbing' : panning ? 'grabbing' : hoverId ? 'grab' : 'default';

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => { useCanvasStore.getState().setHover(null); useCanvasStore.getState().setCursorWorld(null); }}
      onDoubleClick={() => useCanvasStore.getState().fitView()}
      onContextMenu={onContextMenu}
      style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor, overflow: 'hidden', userSelect: 'none' }}
    >
      {children}
    </div>
  );
}