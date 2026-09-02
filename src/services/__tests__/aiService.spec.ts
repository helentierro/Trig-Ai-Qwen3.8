// src/services/__tests__/aiService.spec.ts — Entrega 2 FINAL
// Rutas corregidas: los stores viven en ../../stores/ (dos pisos arriba).
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { askTutor } from '../aiService';
import { useChatStore } from '../../stores/chatStore';
import { useCanvasStore } from '../../stores/canvasStore';

// ─── Mock de WebSocket (node no conecta a nada real) ─────────────────────
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static last: MockWebSocket | null = null;
  static instances = 0;
  static failNext = false;
  static silent = false;

  readyState = 0;
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.last = this;
    MockWebSocket.instances++;
    setTimeout(() => {
      if (MockWebSocket.failNext) {
        MockWebSocket.failNext = false;
        this.onerror?.();
        return;
      }
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
    if (!MockWebSocket.silent) {
      setTimeout(() => {
        this.onmessage?.({
          data: JSON.stringify({ type: 'answer', reply: 'RESPUESTA-REMOTA', steps: [] }),
        });
      }, 5);
    }
  }

  close() {
    this.readyState = 3;
  }
}
vi.stubGlobal('WebSocket', MockWebSocket);

beforeEach(() => {
  useChatStore.setState({ messages: [] });
  useCanvasStore.setState({ playing: false, voiceOn: false });
  MockWebSocket.silent = false;
});

describe('aiService', () => {
  it('pregunta → la respuesta remota llega al chat', async () => {
    await askTutor('hola');
    const msgs = useChatStore.getState().messages;
    expect(msgs.some((m) => m.role === 'user' && m.text === 'hola')).toBe(true);
    expect(msgs.some((m) => m.role === 'ia' && m.text === 'RESPUESTA-REMOTA')).toBe(true);
  });

  it('reutiliza el socket abierto (no reconecta en cada pregunta)', async () => {
    const before = MockWebSocket.instances;
    await askTutor('otra');
    expect(MockWebSocket.instances).toBe(before);
  });

  it('si el socket falla, cae suave al cerebro local', async () => {
    if (MockWebSocket.last) MockWebSocket.last.readyState = 3; // mata el socket previo
    MockWebSocket.failNext = true;
    await askTutor('hola');
    const msgs = useChatStore.getState().messages;
    expect(msgs.some((m) => m.text.includes('cerebro local'))).toBe(true);
    expect(msgs.some((m) => m.role === 'ia' && m.text.includes('¡Hola!'))).toBe(true);
  });
});