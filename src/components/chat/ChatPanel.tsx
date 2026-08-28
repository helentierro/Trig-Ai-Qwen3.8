import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { askTutor } from '../../services/aiService';

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    void askTutor(t);
  };

  return (
    <aside style={{ width: 300, borderLeft: '1px solid #1f2630', background: '#0a0e14', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1f2630', display: 'flex', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>Tutor IA</strong>
        <span style={{ marginLeft: 'auto', color: '#4ade80', fontSize: 11 }}>● en línea</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? '#1d4ed8' : '#111826',
            border: msg.role === 'user' ? 'none' : '1px solid #1f2630',
            color: '#e2e8f0', padding: '8px 12px', borderRadius: 12,
            fontSize: 12.5, lineHeight: 1.45, maxWidth: '85%', whiteSpace: 'pre-wrap',
          }}>{msg.text}</div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 10, borderTop: '1px solid #1f2630', display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pregunta sobre trigonometría…"
          style={{ flex: 1, background: '#111826', border: '1px solid #1f2630', borderRadius: 8, color: '#e2e8f0', padding: '8px 10px', fontSize: 12.5, outline: 'none' }}
        />
        <button onClick={send} style={{ background: '#38bdf8', color: '#0d1117', border: 'none', borderRadius: 8, padding: '0 14px', fontWeight: 700, cursor: 'pointer' }}>➤</button>
      </div>
    </aside>
  );
}