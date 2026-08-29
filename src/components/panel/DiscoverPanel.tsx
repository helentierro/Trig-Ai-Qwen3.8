import { useState } from 'react';
import { KNOWLEDGE, KNOWLEDGE_LIST } from '../../data/knowledge';
import { CHALLENGES } from '../../data/challenges';
import { useCanvasStore } from '../../stores/canvasStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { playScene } from '../../services/scenePlayer';

export function DiscoverPanel({ tab, onClose }: { tab: 'lib' | 'retos'; onClose: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const solved = useChallengeStore((s) => s.solved);
  const activeId = useChallengeStore((s) => s.activeId);
  const start = useChallengeStore((s) => s.start);

  const explore = (id: string) => {
    const st = useCanvasStore.getState();
    st.loadWorld(id);
    void playScene(KNOWLEDGE[id].script);
    onClose();
  };

  const entry = sel ? KNOWLEDGE[sel] : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 620, maxHeight: '82vh', overflowY: 'auto', background: '#0a0e14', border: '1px solid #1f2630', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <strong style={{ fontSize: 16 }}>{tab === 'lib' ? '📚 Descubrir: ¿para qué sirve esto?' : '🎯 Retos: aprende jugando'}</strong>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#8b949e', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {tab === 'lib' && !entry && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {KNOWLEDGE_LIST.map((k) => (
              <button key={k.id} onClick={() => setSel(k.id)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: '1px solid #1f2630', background: '#111826', color: '#e2e8f0', cursor: 'pointer' }}>
                <div style={{ fontSize: 22 }}>{k.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 4 }}>{k.title}</div>
                <div style={{ color: '#8b949e', fontSize: 11.5, marginTop: 2 }}>{k.tagline}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'lib' && entry && (
          <div>
            <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 10 }}>← volver a la biblioteca</button>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{entry.emoji} {entry.title}</h3>
            <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.6 }}>{entry.story}</p>
            <div style={{ margin: '10px 0', color: '#64748b', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Lo ves en la vida real</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#8b949e', fontSize: 13, lineHeight: 1.8 }}>
              {entry.examples.map((ex) => <li key={ex}>{ex}</li>)}
            </ul>
            <button onClick={() => explore(entry.id)} style={{ marginTop: 16, width: '100%', padding: 10, borderRadius: 10, border: '1px solid #3b3654', background: '#111826', color: '#a78bfa', fontWeight: 700, cursor: 'pointer' }}>
              🎬 Entrar a este mundo
            </button>
          </div>
        )}

        {tab === 'retos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHALLENGES.map((c) => {
              const done = solved.includes(c.id);
              const active = activeId === c.id;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, border: '1px solid #1f2630', background: '#111826' }}>
                  <span style={{ fontSize: 18 }}>{done ? '🏅' : '🎯'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</div>
                    <div style={{ color: '#8b949e', fontSize: 11.5 }}>{c.prompt}</div>
                  </div>
                  {!done && (
                    <button onClick={() => { start(c.id); onClose(); }} disabled={active}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #1f2630', background: active ? '#1f2630' : '#38bdf8', color: active ? '#8b949e' : '#0d1117', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                      {active ? 'En juego…' : 'Jugar'}
                    </button>
                  )}
                </div>
              );
            })}
            <div style={{ color: '#64748b', fontSize: 11.5, marginTop: 4 }}>Los retos se verifican EN VIVO mientras juegas: cuando lo logres, lo celebramos. 🎉</div>
          </div>
        )}
      </div>
    </div>
  );
}