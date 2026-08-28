import { useCanvasStore } from '../stores/canvasStore';
import { useChatStore } from '../stores/chatStore';
import { playScene, buildTriangleScript } from './scenePlayer';
import type { SceneScript } from '../types/ai';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

// "LLM local": entiende intenciones y responde con palabras + acciones de escena.
// Cuando exista el backend FastAPI, esta función se reemplaza por aiService
// (mismo contrato: texto del usuario → reply + SceneScript).
export function askTutor(raw: string) {
  const chat = useChatStore.getState();
  const st = useCanvasStore.getState();
  const m = st.measures;
  const text = raw.toLowerCase();

  chat.push('user', raw);

  if (st.playing) {
    chat.push('ia', 'Espera a que termine la construcción actual 🙂');
    return;
  }

  let reply = '';
  let actions: SceneScript = [];
  const degMatch = text.match(/(\d{1,2})\s*(?:°|grados)/);
  const wantsDraw = /(dibuja|construye|crea|arma|haz|muéstrame|muestrame)/.test(text);

  if (degMatch) {
    const d = Math.min(89, Math.max(1, parseInt(degMatch[1], 10)));
    st.setAngleDeg(d);
    const mm = useCanvasStore.getState().measures;
    if (wantsDraw) {
      reply = `¡Marchando uno de ${d}°! Lo construyo paso a paso…`;
      actions = buildTriangleScript();
      st.resetConstruction();
    } else {
      reply = `Con θ = ${d}° y base ${fmt(mm.base)}: altura = ${fmt(mm.height)}, hipotenusa = ${fmt(mm.hyp)}. ¡Tócalo!`;
      actions = [{ type: 'pulse', id: 'angleO' }];
    }
  } else if (/hipotenusa/.test(text)) {
    reply = `La hipotenusa es el lado más largo, frente al ángulo recto: hoy mide ${fmt(m.hyp)}. Es el "camino directo" de O a A.`;
    actions = [{ type: 'pulse', id: 'hyp' }];
  } else if (/cateto/.test(text)) {
    reply = `Los catetos son los lados que forman el ángulo recto: la base (${fmt(m.base)}) y la altura (${fmt(m.height)}).`;
    actions = [{ type: 'pulse', id: 'base' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'height' }];
  } else if (/área|area/.test(text)) {
    reply = `El área es (base × altura) / 2 = (${fmt(m.base)} × ${fmt(m.height)}) / 2 = ${fmt(m.area)}. Pasa el mouse por "área" en el panel Álgebra y verás el espacio que encierra.`;
    actions = [{ type: 'pulse', id: 'area', ms: 2000 }];
  } else if (/180|suma/.test(text)) {
    reply = `Porque todo triángulo "guarda" media vuelta: θ + 90° + α = 180°. Hoy: ${fmt(m.angleDeg)}° + 90° + ${fmt(90 - m.angleDeg)}°. Arrastra los vértices: la suma NUNCA cambia.`;
    actions = [{ type: 'pulse', id: 'angleO' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'angleB' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'angleA' }];
  } else if (/tangente/.test(text)) {
    reply = `tan(θ) = opuesto / adyacente = ${fmt(m.height)} / ${fmt(m.base)} = ${fmt(m.height / m.base)}. Es "cuánto sube por cada paso a la derecha".`;
    actions = [{ type: 'pulse', id: 'height' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'base' }];
  } else if (/seno/.test(text)) {
    reply = `sin(θ) = opuesto / hipotenusa = ${fmt(m.height)} / ${fmt(m.hyp)} = ${fmt(m.height / m.hyp)}.`;
    actions = [{ type: 'pulse', id: 'height' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'hyp' }];
  } else if (/coseno/.test(text)) {
    reply = `cos(θ) = adyacente / hipotenusa = ${fmt(m.base)} / ${fmt(m.hyp)} = ${fmt(m.base / m.hyp)}. A 60° da 1/2: por eso la hipotenusa duplica a la base.`;
    actions = [{ type: 'pulse', id: 'base' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'hyp' }];
  } else if (/hola|buenas|hey/.test(text)) {
    reply = '¡Hola! 👋 Pídeme: «dibuja un triángulo de 60°», «¿qué es la hipotenusa?», «¿por qué suman 180°?», «tangente»…';
  } else {
    reply = 'Aún estoy aprendiendo 🌱. Prueba: «dibuja un triángulo de 45°», «¿qué es la hipotenusa?», «tangente», «área», «¿por qué suman 180°?».';
  }

  chat.push('ia', reply);
  void playScene([{ type: 'say', text: reply }, ...actions]);
}