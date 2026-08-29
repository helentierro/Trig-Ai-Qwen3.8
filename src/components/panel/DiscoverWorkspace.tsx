// src/components/panel/DiscoverWorkspace.tsx
import { useState } from 'react';
import { KNOWLEDGE, KNOWLEDGE_LIST, CATEGORIES } from '../../data/knowledge';
import { CHALLENGES } from '../../data/challenges';
import { useCanvasStore } from '../../stores/canvasStore';
import { useChallengeStore } from '../../stores/challengeStore';
import { playScene } from '../../services/scenePlayer';
import { usePal } from '../../stores/themeStore';
import { TriangleCanvas } from '../canvas/TriangleCanvas';

export function DiscoverWorkspace({ onEnterWorld }: { onEnterWorld?: () => void }) {
  const pal = usePal();
  const [sel, setSel] = useState<string | null>(null);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ ingenieria: true, tecno: true, vida: true });
  const solved = useChallengeStore((s) => s.solved);
  const activeId = useChallengeStore((s) => s.activeId);
  const start = useChallengeStore((s) => s.start);

  const explore = (id: string) => {
    const st = useCanvasStore.getState();
    st.loadWorld(id);
    void playScene(KNOWLEDGE[id].script);
    onEnterWorld?.(); // ← FIX test 5: entrar vuelve a Gráfica (panel Álgebra visible)
  };

  const entry = sel ? KNOWLEDGE[sel] : null;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* Biblioteca con categorías desplegables */}
      <aside style={{ width: 250, borderRight: `1px solid ${pal.border}`, background: pal.panelBg, overflowY: 'auto', padding: '8px 6px' }}>
        <div style={{ padding: '4px 10px 8px', color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Biblioteca de mundos</div>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 6 }}>
            <button onClick={() => setOpenCats({ ...openCats, [cat.id]: !openCats[cat.id] })}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: pal.dim, fontWeight: 700, fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}>
              {openCats[cat.id] ? '▾' : '▸'} {cat.label}
            </button>
            {openCats[cat.id] && KNOWLEDGE_LIST.filter((k) => k.category === cat.id).map((k) => (
              <button key={k.id} onClick={() => setSel(k.id)}
                style={{
                  display: 'flex', gap: 8, alignItems: 'center', width: '100%', textAlign: 'left', padding: '7px 12px',
                  background: sel === k.id ? 'rgba(56,189,248,.10)' : 'none', border: 'none',
                  color: sel === k.id ? pal.accent : pal.bubbleText, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 15 }}>{k.emoji}</span> {k.title}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Canvas central: el mundo se toca y se construye */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <TriangleCanvas />
      </div>

      {/* Historia + retos */}
      <aside style={{ width: 300, borderLeft: `1px solid ${pal.border}`, background: pal.panelBg, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entry ? (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: pal.bubbleText }}>{entry.emoji} {entry.title}</h3>
            <p style={{ color: pal.dim, fontSize: 12.5, lineHeight: 1.6 }}>{entry.story}</p>
            <div style={{ margin: '10px 0 4px', color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Lo ves en la vida real</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: pal.dim, fontSize: 12, lineHeight: 1.8 }}>
              {entry.examples.map((ex) => <li key={ex}>{ex}</li>)}
            </ul>
            <button onClick={() => explore(entry.id)}
              style={{ marginTop: 14, width: '100%', padding: 10, borderRadius: 10, border: `1px solid ${pal.border}`, background: pal.card, color: pal.ia, fontWeight: 700, cursor: 'pointer' }}>
              🎬 Entrar a este mundo
            </button>
          </div>
        ) : (
          <div style={{ color: pal.faint, fontSize: 12, lineHeight: 1.6 }}>
            Elige un mundo de la biblioteca ←<br />y pulsa «🎬 Entrar» para cargarlo y escuchar su historia.
          </div>
        )}

        <div style={{ borderTop: `1px solid ${pal.border}`, paddingTop: 10 }}>
          <div style={{ color: pal.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>🎯 Retos</div>
          {CHALLENGES.map((c) => {
            const done = solved.includes(c.id);
            const active = activeId === c.id;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderBottom: `1px solid ${pal.border}` }}>
                <span>{done ? '🏅' : '🎯'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: pal.bubbleText }}>{c.title}</div>
                  <div style={{ color: pal.faint, fontSize: 10.5 }}>{c.prompt}</div>
                </div>
                {!done && (
                  <button onClick={() => { start(c.id); onEnterWorld?.(); }} disabled={active}
                    style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${pal.border}`, background: active ? pal.card : pal.accent, color: active ? pal.dim : '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}>
                    {active ? '…' : 'Jugar'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}