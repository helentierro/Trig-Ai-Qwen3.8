import { useCanvasStore } from '../stores/canvasStore';
import { useChatStore } from '../stores/chatStore';
import { useChallengeStore } from '../stores/challengeStore';
import { playScene, buildTriangleScript } from './scenePlayer';
import { CHALLENGES } from '../data/challenges';
import type { SceneScript } from '../types/ai';

const fmt = (n: number) => `${Number(n.toFixed(2))}`;

export function askTutor(raw: string) {
  const chat = useChatStore.getState();
  const st = useCanvasStore.getState();
  const m = st.measures;
  const text = raw.toLowerCase();

  if (st.playing) { chat.push('ia', 'Espera a que termine la construcción actual 🙂'); return; }

  let reply = '';
  let actions: SceneScript = [];
  const degMatch = text.match(/(\d{1,2})\s*(?:°|grados)/);
  const wantsDraw = /(dibuja|construye|crea|arma|haz|muéstrame|muestrame)/.test(text);

  if (/(puente|celosía|celosia|torre de electricidad)/.test(text)) {
    reply = '🌉 ¡Mira para qué sirven los triángulos! Te abro el mundo del puente.';
    actions = [{ type: 'world', id: 'bridge' }];
  } else if (/(rampa|pendiente|silla de ruedas)/.test(text)) {
    reply = '♿ La tangente es la pendiente de una rampa. Te lo muestro.';
    actions = [{ type: 'world', id: 'ramp' }];
  } else if (/escalera/.test(text)) {
    reply = '🪜 Las escaleras seguras usan seno y coseno: la regla 4-a-1.';
    actions = [{ type: 'world', id: 'ladder' }];
  } else if (/(rueda|ferris|onda|senoide|círculo unitario|circulo unitario)/.test(text)) {
    reply = '🎡 De un círculo girando nace una onda: música, mar y luz.';
    actions = [{ type: 'world', id: 'wheel' }];
  } else if (/(videojuego|juego|puntería|punteria|enemigo)/.test(text)) {
    reply = '🎮 Tu juego favorito hace Pitágoras 60 veces por segundo.';
    actions = [{ type: 'world', id: 'game' }];
  } else if (/(gps|satélite|satelite|mapa|ubicación|ubicacion)/.test(text)) {
    reply = '🛰 Tres círculos que se cruzan: así el GPS sabe dónde estás.';
    actions = [{ type: 'world', id: 'gps' }];
  } else if (/(ejemplo|práctic|practic|vida real|para qué sirve|para que sirve)/.test(text)) {
    reply = 'La trigonometría construye puentes, rampas, juegos y GPS. Te abro mi ejemplo favorito: el puente.';
    actions = [{ type: 'world', id: 'bridge' }];
  } else if (/(reto|desafío|desafio|ejercicio|practicar|jugar)/.test(text)) {
    const next = CHALLENGES.find((c) => !useChallengeStore.getState().solved.includes(c.id));
    if (next) { useChallengeStore.getState().start(next.id); reply = `¡Me encantan esas ganas! 🎯 Te lancé el reto «${next.title}». ¡Tú puedes!`; }
    else reply = '🏆 ¡Ya completaste TODOS los retos! Eres oficialmente un explorador de la trigonometría.';
  } else if (degMatch) {
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
    reply = `La hipotenusa es el lado más largo, frente al ángulo recto: hoy mide ${fmt(m.hyp)}.`;
    actions = [{ type: 'pulse', id: 'hyp' }];
  } else if (/cateto/.test(text)) {
    reply = `Los catetos forman el ángulo recto: base (${fmt(m.base)}) y altura (${fmt(m.height)}).`;
    actions = [{ type: 'pulse', id: 'base' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'height' }];
  } else if (/área|area/.test(text)) {
    reply = `área = (base × altura)/2 = ${fmt(m.area)}. Pasa el mouse por "área" en el panel y verás el espacio.`;
    actions = [{ type: 'pulse', id: 'area', ms: 2000 }];
  } else if (/180|suma/.test(text)) {
    reply = `θ + 90° + α = 180°, siempre. Hoy: ${fmt(m.angleDeg)}° + 90° + ${fmt(90 - m.angleDeg)}°. Arrastra y compruébalo.`;
    actions = [{ type: 'pulse', id: 'angleO' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'angleB' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'angleA' }];
  } else if (/tangente/.test(text)) {
    reply = `tan(θ) = opuesto/adyacente = ${fmt(m.height / m.base)}. "Cuánto sube por cada paso".`;
    actions = [{ type: 'pulse', id: 'height' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'base' }];
  } else if (/seno/.test(text)) {
    reply = `sin(θ) = opuesto/hipotenusa = ${fmt(m.height / m.hyp)}.`;
    actions = [{ type: 'pulse', id: 'height' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'hyp' }];
  } else if (/coseno/.test(text)) {
    reply = `cos(θ) = adyacente/hipotenusa = ${fmt(m.base / m.hyp)}. A 60° da 1/2.`;
    actions = [{ type: 'pulse', id: 'base' }, { type: 'wait', ms: 700 }, { type: 'pulse', id: 'hyp' }];
  } else if (/hola|buenas|hey/.test(text)) {
    reply = '¡Hola! 👋 Pregúntame por puentes, rampas, videojuegos, el GPS… o pide un reto con «juguemos».';
  } else {
    reply = 'Prueba: «construye un puente», «¿para qué sirve en la vida real?», «dibuja 45°», «juguemos un reto»…';
  }

  chat.push('ia', reply);
  void playScene([{ type: 'say', text: reply }, ...actions]);
}