import type { SceneScript } from '../types/ai';

export interface WorldDef {
  points: { id: string; x: number; y: number }[];
  segments: { id?: string; a: string; b: string; color?: string }[];
  circles?: { id: string; c: string; r: number }[];
}
export interface KnowledgeEntry {
  id: string; emoji: string; title: string; tagline: string;
  story: string; examples: string[]; world: WorldDef; script: SceneScript;
}

export const KNOWLEDGE: Record<string, KnowledgeEntry> = {
  bridge: {
    id: 'bridge', emoji: '🌉', title: 'El puente de triángulos',
    tagline: 'Por qué los puentes no se caen',
    story: 'El triángulo es la ÚNICA figura que no se deforma: si empujas un cuadrado se vuelve rombo, pero un triángulo aguanta. Por eso los ingenieros llenan los puentes de triángulos (celosías): cada pieza reparte el peso entre todas las demás.',
    examples: ['Puentes de celosía (truss)', 'Torres de electricidad', 'El cuadro de una bicicleta', 'Grúas y techos de casas'],
    world: {
      points: [
        { id: 'b0', x: 0, y: 0 }, { id: 'b1', x: 40, y: 0 }, { id: 'b2', x: 80, y: 0 }, { id: 'b3', x: 120, y: 0 },
        { id: 't1', x: 20, y: 26 }, { id: 't2', x: 60, y: 26 }, { id: 't3', x: 100, y: 26 },
      ],
      segments: [
        { id: 'c1', a: 'b0', b: 'b1', color: '#38bdf8' }, { id: 'c2', a: 'b1', b: 'b2', color: '#38bdf8' }, { id: 'c3', a: 'b2', b: 'b3', color: '#38bdf8' },
        { id: 'd1', a: 'b0', b: 't1', color: '#fb923c' }, { id: 'd2', a: 't1', b: 'b1', color: '#fb923c' },
        { id: 'd3', a: 'b1', b: 't2', color: '#fb923c' }, { id: 'd4', a: 't2', b: 'b2', color: '#fb923c' },
        { id: 'd5', a: 'b2', b: 't3', color: '#fb923c' }, { id: 'd6', a: 't3', b: 'b3', color: '#fb923c' },
        { id: 'u1', a: 't1', b: 't2', color: '#e2e8f0' }, { id: 'u2', a: 't2', b: 't3', color: '#e2e8f0' },
      ],
    },
    script: [
      { type: 'say', text: 'Mira este puente: está hecho de puros triángulos.' },
      { type: 'pulse', id: 'd1', ms: 1100 }, { type: 'pulse', id: 'd2', ms: 1100 },
      { type: 'say', text: 'El triángulo es la única figura que NO se deforma al empujarla. ¡Por eso los puentes reales están llenos de ellos!' },
      { type: 'say', text: 'Ahora tú: con la herramienta segmento, construye tu propio puente al lado. 🛠' },
    ],
  },
  ramp: {
    id: 'ramp', emoji: '♿', title: 'La rampa y la pendiente',
    tagline: 'tan(θ) = qué tanto sube por cada paso',
    story: 'Una rampa es un triángulo rectángulo acostado. La tangente del ángulo es la pendiente: cuánta altura ganas por cada paso horizontal. Por eso las leyes de accesibilidad piden rampas suaves (~5°): más inclinadas y una silla de ruedas no puede subir.',
    examples: ['Rampas para sillas de ruedas', 'Carreteras de montaña (por eso hacen curvas: para bajar la pendiente)', 'Pistas de esquí (se clasifican por inclinación)', 'Toboganes'],
    world: {
      points: [{ id: 'O', x: 0, y: 0 }, { id: 'B', x: 100, y: 0 }, { id: 'A', x: 100, y: 10 }],
      segments: [
        { id: 'base', a: 'O', b: 'B', color: '#38bdf8' },
        { id: 'height', a: 'B', b: 'A', color: '#fb923c' },
        { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0' },
      ],
    },
    script: [
      { type: 'say', text: 'Esta rampa sube 10 por cada 100 de largo: pendiente del 10%, perfecta para una silla de ruedas.' },
      { type: 'pulse', id: 'height', ms: 1200 }, { type: 'pulse', id: 'base', ms: 1200 },
      { type: 'say', text: 'Arrastra el vértice A y siente cómo la tangente te dice "qué tan empinado".' },
    ],
  },
  ladder: {
    id: 'ladder', emoji: '🪜', title: 'La escalera segura',
    tagline: 'La regla 4-a-1 de los bomberos',
    story: 'Los bomberos apoyan la escalera a ~75°: por cada 4 metros de altura, la base sale 1 metro. Ese ángulo usa seno y coseno: si la escalera mide L, llega a una altura de L·sin(75°). Muy parada → se cae atrás; muy acostada → resbala.',
    examples: ['Escaleras de mano', 'Rescates de bomberos', 'Andamios', 'Pendientes de techos'],
    world: {
      points: [{ id: 'O', x: 0, y: 0 }, { id: 'B', x: 25, y: 0 }, { id: 'A', x: 25, y: 93 }],
      segments: [
        { id: 'base', a: 'O', b: 'B', color: '#38bdf8' },
        { id: 'height', a: 'B', b: 'A', color: '#fb923c' },
        { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0' },
      ],
    },
    script: [
      { type: 'say', text: 'Una escalera a 75°: la regla de los bomberos, 4 partes de altura por 1 de base.' },
      { type: 'pulse', id: 'hyp', ms: 1400 },
      { type: 'say', text: 'La altura que alcanza es el largo de la escalera por el seno del ángulo. ¡Arrástrala y compruébalo!' },
    ],
  },
  wheel: {
    id: 'wheel', emoji: '🎡', title: 'La rueda de la fortuna',
    tagline: 'De aquí nacen las ondas: música, mar, luz',
    story: 'Imagina una cabina dando vueltas: su ALTURA sobre el centro es el seno del ángulo. Si graficas esa altura en el tiempo, aparece una onda. Así funcionan el sonido, las olas y la luz: todo es círculos girando vistos de lado.',
    examples: ['Ruedas de la fortuna', 'Sonido y música (ondas senoidales)', 'Mareas y olas', 'Señales de radio y wifi'],
    world: {
      points: [{ id: 'C', x: 0, y: 0 }, { id: 'R', x: 40, y: 0 }],
      segments: [{ id: 'rad', a: 'C', b: 'R', color: '#fb923c' }],
      circles: [{ id: 'w1', c: 'C', r: 40 }],
    },
    script: [
      { type: 'say', text: 'Esta rueda es el círculo unitario gigante: el radio mide 40.' },
      { type: 'pulse', id: 'rad', ms: 1400 },
      { type: 'say', text: 'La altura de la cabina R es el seno del ángulo. Gira el radio y mírala subir y bajar: así nace una onda.' },
    ],
  },
  game: {
    id: 'game', emoji: '🎮', title: 'Videojuegos: puntería y distancias',
    tagline: 'Tu juego favorito hace esto 60 veces por segundo',
    story: 'En un juego, la distancia entre tú y el enemigo es la HIPOTENUSA: √(x² + y²). Y el ángulo para apuntar sale de atan2. Cada frame, el motor repite Pitágoras miles de veces: por eso la trigonometría también hace mundos virtuales.',
    examples: ['Distancia jugador-enemigo', 'Ángulo de puntería (atan2)', 'Física de saltos y proyectiles', 'Cámaras que siguen al personaje'],
    world: {
      points: [{ id: 'J', x: 0, y: 0 }, { id: 'E', x: 60, y: 45 }],
      segments: [{ id: 'je', a: 'J', b: 'E', color: '#e2e8f0' }],
      circles: [{ id: 'rng', c: 'J', r: 20 }],
    },
    script: [
      { type: 'say', text: 'Tú eres J, el enemigo es E. ¿A qué distancia está? La hipotenusa lo dice.' },
      { type: 'pulse', id: 'je', ms: 1400 },
      { type: 'say', text: 'El círculo es tu alcance. Arrastra E y mira cómo el juego calcularía distancia y ángulo en cada frame.' },
    ],
  },
  gps: {
    id: 'gps', emoji: '🛰', title: 'GPS: tres círculos te encuentran',
    tagline: 'Triangulación con satélites',
    story: 'Tu teléfono no sabe dónde está: lo descubre midiendo distancias a satélites. Cada distancia dibuja un CÍRCULO; donde tres círculos se cruzan… ahí estás tú. Geometría pura salvándote de perderte.',
    examples: ['GPS del teléfono', 'Mapas y navegación', 'Búsqueda y rescate', 'Geolocalización de entregas'],
    world: {
      points: [{ id: 's1', x: -40, y: 30 }, { id: 's2', x: 40, y: 30 }, { id: 's3', x: 0, y: -40 }, { id: 'U', x: 0, y: 0 }],
      segments: [],
      circles: [{ id: 'g1', c: 's1', r: 50 }, { id: 'g2', c: 's2', r: 50 }, { id: 'g3', c: 's3', r: 40 }],
    },
    script: [
      { type: 'say', text: 'Tres satélites, tres círculos de distancia… y un único punto donde se cruzan.' },
      { type: 'pulse', id: 'U', ms: 1600 },
      { type: 'say', text: 'Ese punto eres TÚ. Así funciona el GPS de tu teléfono: geometría orbital.' },
    ],
  },
};

export const KNOWLEDGE_LIST = Object.values(KNOWLEDGE);