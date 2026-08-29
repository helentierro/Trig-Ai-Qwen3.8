// src/components/chat/ChatPanel.tsx
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { askTutor } from '../../services/aiService';
import { usePal } from '../../stores/themeStore';

export function ChatPanel() {
  const pal = usePal();
  const messages = useChatStore((s) => s.messages);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    void askTutor(t);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: 30, borderLeft: `1px solid ${pal.border}`, background: pal.panelBg, color: pal.dim, cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 11, letterSpacing: 2 }}>
      TUTOR IA
    </button>
  );

  return (
    <aside style={{ width: 300, borderLeft: `1px solid ${pal.border}`, background: pal.panelBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>Tutor IA</strong>
        <span style={{ marginLeft: 'auto', color: '#4ade80', fontSize: 11 }}>● en línea</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: pal.dim, cursor: 'pointer', marginLeft: 8 }}>⟩</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? '#1d4ed8' : pal.card,
            border: msg.role === 'user' ? 'none' : `1px solid ${pal.border}`,
            color: msg.role === 'user' ? '#fff' : pal.bubbleText, padding: '8px 12px', borderRadius: 12,
            fontSize: 12.5, lineHeight: 1.45, maxWidth: '85%', whiteSpace: 'pre-wrap',
          }}>{msg.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${pal.border}`, display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pregunta sobre trigonometría…"
          style={{ flex: 1, background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 8, color: pal.bubbleText, padding: '8px 10px', fontSize: 12.5, outline: 'none' }}
        />
        <button onClick={send} style={{ background: pal.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontWeight: 700, cursor: 'pointer' }}>➤</button>
      </div>
    </aside>
  );
}