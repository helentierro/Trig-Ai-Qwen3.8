// src/components/rooms/TallerRoom.tsx — Fase 1: el lienzo como habitación (antes era toda la app).
import { TriangleCanvas } from '../canvas/TriangleCanvas';
import { SidePanel } from '../panel/SidePanel';
import { ChatPanel } from '../chat/ChatPanel';

export function TallerRoom() {
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <SidePanel />
      <div style={{ flex: 1, position: 'relative' }}>
        <TriangleCanvas />
      </div>
      <ChatPanel />
    </div>
  );
}
