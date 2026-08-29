import { useChatStore } from '../stores/chatStore';
import { useCanvasStore } from '../stores/canvasStore';
import { useChallengeStore } from '../stores/challengeStore';
import { playScene, buildTriangleScript } from './scenePlayer';
import { askTutor as askTutorLocal } from './localTutor';
import { KNOWLEDGE } from '../data/knowledge';
import { CHALLENGES } from '../data/challenges';
import type { SceneScript } from '../types/ai';

const WS_URL = 'ws://localhost:8000/ws/tutor';

let ws: WebSocket | null = null;
let pendingResolve: ((v: { reply: string; steps: RemoteStep[] } | null) => void) | null = null;
let warnedOffline = false;

type RemoteStep = { type: string; id?: string; ms?: number; deg?: number; n?: number };

function ensureWs(timeoutMs = 1500): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) return resolve(ws);
    try {
      const sock = new WebSocket(WS_URL);
      const timer = setTimeout(() => { sock.close(); reject(new Error('timeout')); }, timeoutMs);
      sock.onopen = () => { clearTimeout(timer); ws = sock; resolve(sock); };
      sock.onerror = () => { clearTimeout(timer); reject(new Error('error')); };
      sock.onclose = () => { if (ws === sock) ws = null; };
      sock.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'answer' && pendingResolve) {
            pendingResolve({ reply: msg.reply ?? '', steps: msg.steps ?? [] });
            pendingResolve = null;
          }
        } catch { /* ignorar */ }
      };
    } catch { reject(new Error('ws')); }
  });
}

function requestAnswer(sock: WebSocket, payload: unknown, timeoutMs = 30000) {
  return new Promise<{ reply: string; steps: RemoteStep[] } | null>((resolve) => {
    pendingResolve = resolve;
    setTimeout(() => { if (pendingResolve === resolve) { pendingResolve = null; resolve(null); } }, timeoutMs);
    sock.send(JSON.stringify(payload));
  });
}

export async function askTutor(raw: string) {
  useChatStore.getState().push('user', raw);
  try {
    const sock = await ensureWs();
    if (pendingResolve) { askTutorLocal(raw); return; }
    const m = useCanvasStore.getState().measures;
    const answer = await requestAnswer(sock, { type: 'chat', text: raw, context: { ...m } });
    if (!answer) { askTutorLocal(raw); return; }
    applyAnswer(answer);
  } catch {
    if (!warnedOffline) {
      warnedOffline = true;
      useChatStore.getState().push('ia', '(Backend offline: respondo con mi cerebro local 🧠.)');
    }
    askTutorLocal(raw);
  }
}

function applyAnswer(a: { reply: string; steps: RemoteStep[] }) {
  const st = useCanvasStore.getState();
  useChatStore.getState().push('ia', a.reply);
  if (st.playing) return;
  const script: SceneScript = [{ type: 'say', text: a.reply }];
  for (const s of a.steps) {
    if (s.type === 'construct') { st.resetConstruction(); script.push(...buildTriangleScript()); }
    else if (s.type === 'set_angle') st.setAngleDeg(Number(s.deg) || 45);
    else if (s.type === 'set_base') st.setBase(Number(s.n) || 50);
    else if (s.type === 'world' && KNOWLEDGE[s.id ?? '']) script.push({ type: 'world', id: s.id! });
    else if (s.type === 'challenge' && CHALLENGES.some((c) => c.id === s.id)) useChallengeStore.getState().start(s.id!);
    else if (s.type === 'pulse' && s.id) script.push({ type: 'pulse', id: s.id, ms: s.ms });
  }
  void playScene(script);
}