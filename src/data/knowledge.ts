// src/data/knowledge.ts
import type { SceneScript } from '../types/ai';

export interface WorldDef {
  points: { id: string; x: number; y: number }[];
  segments: { id?: string; a: string; b: string; color?: string }[];
  circles?: { id: string; c: string; r: number }[];
}

export interface KnowledgeEntry {
  id: string; emoji: string; title: string; tagline: string;
  story: string; examples: string[]; world: WorldDef; script: SceneScript;
  category: 'ingenieria' | 'tecno' | 'vida';
}

export const CATEGORIES: { id: KnowledgeEntry['category']; label: string }[] = [
  { id: 'ingenieria', label: '🏗️ Ingeniería y Exploración' },
  { id: 'tecno', label: '🎮 Tecnología y Videojuegos' },
  { id: 'vida', label: '🌿 Vida Diaria y Naturaleza' },
];

const TRI = (O: [number, number], B: [number, number], A: [number, number]) => ({
  points: [ { id: 'O', x: O[0], y: O[1] }, { id: 'B', x: B[0], y: B[1] }, { id: 'A', x: A[0], y: A[1] } ],
  segments: [
    { id: 'base', a: 'O', b: 'B', color: '#38bdf8' },
    { id: 'height', a: 'B', b: 'A', color: '#fb923c' },
    { id: 'hyp', a: 'O', b: 'A', color: '#e2e8f0' },
  ],
});

export const KNOWLEDGE: Record<string, KnowledgeEntry> = {
  bridge: {
    id: 'bridge', emoji: '🌉', title: 'El puente de triángulos', tagline: 'Por qué los puentes no se caen', category: 'ingenieria',
    story: 'El triángulo es la ÚNICA figura que no se deforma: si empujas un cuadrado se vuelve rombo, pero un triángulo aguanta. Por eso los ingenieros llenan los puentes de triángulos: cada uno reparte el peso sin doblarse.',
    examples: ['Puentes de celosía (truss)', 'Torres de electricidad', 'El cuadro de una bicicleta', 'Grúas y techos de casas'],
    world: {
      points: [
        { id: 'b0', x: 0, y: 0 }, { id: 'b1', x: 40, y: 0 }, { id: 'b2', x: 80, y: 0 }, { id: 'b3', x: 120, y: 0 },
        { id: 't1', x: 20, y: 26 }, { id: 't2', x: 60, y: 26 }, { id: 't3', x: 100, y: 26 },
      ],
      segments: [
        { id: 'c1', a: 'b0', b: 'b1', color: '#38bdf8' }, { id: 'c2', a: 'b1', b: 'b2', color: '#38bdf8' }, { id: 'c3', a: 'b2', b: 'b3', color: '#38bdf8' },
        { id: 'd1', a: 'b0', b: 't1', color: '#fb923c' }, { id: 'd2', a: 't1', b: 'b1', color: '#fb923c' }, { id: 'd3', a: 'b1', b: 't2', color: '#fb923c' },
        { id: 'd4', a: 't2', b: 'b2', color: '#fb923c' }, { id: 'd5', a: 'b2', b: 't3', color: '#fb923c' }, { id: 'd6', a: 't3', b: 'b3', color: '#fb923c' },
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
    id: 'ramp', emoji: '♿', title: 'La rampa y la pendiente', tagline: 'tan(θ) = qué tanto sube por cada paso', category: 'ingenieria',
    story: 'Una rampa es un triángulo rectángulo acostado. La tangente del ángulo es la pendiente: cuánta altura ganas por cada paso horizontal.',
    examples: ['Rampas para sillas de ruedas', 'Carreteras de montaña (por eso hacen curvas: para bajar la pendiente)', 'Pistas de esquí (se clasifican por pendiente)'],
    world: TRI([0, 0], [100, 0], [100, 10]),
    script: [
      { type: 'say', text: 'Esta rampa sube 10 por cada 100 de largo: pendiente del 10%, perfecta para una silla de ruedas.' },
      { type: 'pulse', id: 'height', ms: 1200 }, { type: 'pulse', id: 'base', ms: 1200 },
      { type: 'say', text: 'Arrastra el vértice A y siente cómo la tangente te dice "qué tan empinado".' },
    ],
  },
  ladder: {
    id: 'ladder', emoji: '🪜', title: 'La escalera segura', tagline: 'La regla 4-a-1 de los bomberos', category: 'ingenieria',
    story: 'Los bomberos apoyan la escalera a ~75°: por cada 4 metros de altura, la base sale 1 metro. Ese ángulo usa seno y coseno: la altura que alcanza es el largo de la escalera por el seno del ángulo.',
    examples: ['Escaleras de mano', 'Rescates de bomberos', 'Andamios', 'Pendientes de techos'],
    world: TRI([0, 0], [25, 0], [25, 93]),
    script: [
      { type: 'say', text: 'Una escalera a 75°: la regla de los bomberos, 4 partes de altura por 1 de base.' },
      { type: 'pulse', id: 'hyp', ms: 1400 },
      { type: 'say', text: 'La altura que alcanza es el largo de la escalera por el seno del ángulo. ¡Arrástrala y compruébalo!' },
    ],
  },
  castle: {
    id: 'castle', emoji: '🏰', title: 'El castillo que no tiembla', tagline: 'Triangulación: el secreto de muros y techos', category: 'ingenieria',
    story: 'Los castillos y las casas resisten viento y sismos porque dentro de sus muros viven triángulos invisibles. El techo es un triángulo: por eso la lluvia no lo aplasta y el viento no lo tuerce.',
    examples: ['Armaduras de techos', 'Torres y murallas', 'Antenas y mástiles', 'Marcos de puertas reforzados'],
    world: {
      points: [
        { id: 'q0', x: 0, y: 0 }, { id: 'q1', x: 70, y: 0 }, { id: 'q2', x: 70, y: 45 }, { id: 'q3', x: 0, y: 45 }, { id: 'r', x: 35, y: 80 },
      ],
      segments: [
        { id: 'f1', a: 'q0', b: 'q1', color: '#38bdf8' }, { id: 'f2', a: 'q1', b: 'q2', color: '#38bdf8' },
        { id: 'f3', a: 'q2', b: 'q3', color: '#38bdf8' }, { id: 'f4', a: 'q3', b: 'q0', color: '#38bdf8' },
        { id: 't1', a: 'q3', b: 'r', color: '#fb923c' }, { id: 't2', a: 'r', b: 'q2', color: '#fb923c' },
        { id: 'diag', a: 'q0', b: 'q2', color: '#e2e8f0' },
      ],
    },
    script: [
      { type: 'say', text: 'Este castillo parece un cuadrado con techo… pero mira su secreto.' },
      { type: 'pulse', id: 'diag', ms: 1400 },
      { type: 'say', text: 'La diagonal parte el cuadrado en dos triángulos: ahora el muro NO se deforma. ¡Triangulación!' },
    ],
  },
  rocket: {
    id: 'rocket', emoji: '🚀', title: 'Cohetes y órbitas', tagline: 'Las secciones cónicas guían a la nave', category: 'ingenieria',
    story: 'Para llegar a la Luna sin perderse, la nave sigue órbitas que son elipses e hipérbolas: secciones cónicas de la geometría. El radio que ves aquí gira como gira la nave alrededor de su planeta.',
    examples: ['Órbitas de satélites', 'Trayectorias a la Luna', 'Antenas parabólicas', 'Telescopios'],
    world: {
      points: [ { id: 'P', x: 0, y: 0 }, { id: 'N', x: 60, y: 0 } ],
      segments: [ { id: 'rad', a: 'P', b: 'N', color: '#fb923c' } ],
      circles: [ { id: 'orb', c: 'P', r: 60 } ],
    },
    script: [
      { type: 'say', text: 'El planeta es P y la nave es N, girando en su órbita circular.' },
      { type: 'pulse', id: 'orb', ms: 1400 },
      { type: 'say', text: 'Arrastra N: el radio es la hipotenusa que siempre mide lo mismo. Así se siente orbitar.' },
    ],
  },
  game: {
    id: 'game', emoji: '🎮', title: 'Videojuegos: puntería y distancias', tagline: 'Tu juego favorito hace esto 60 veces por segundo', category: 'tecno',
    story: 'En un juego, la distancia entre tú y el enemigo es la HIPOTENUSA: √(x²+y²). Y el ángulo para apuntar sale de atan2. Caída por gravedad, impacto a la cabeza o al cuerpo: todo es trigonometría por frame.',
    examples: ['Distancia jugador-enemigo', 'Ángulo de puntería (atan2)', 'Física de saltos y proyectiles', 'Cámaras que siguen al jugador'],
    world: {
      points: [ { id: 'J', x: 0, y: 0 }, { id: 'E', x: 60, y: 45 } ],
      segments: [ { id: 'je', a: 'J', b: 'E', color: '#e2e8f0' } ],
      circles: [ { id: 'rng', c: 'J', r: 20 } ],
    },
    script: [
      { type: 'say', text: 'Tú eres J, el enemigo es E. ¿A qué distancia está? La hipotenusa lo dice.' },
      { type: 'pulse', id: 'je', ms: 1400 },
      { type: 'say', text: 'El círculo es tu alcance. Arrastra E y mira cómo el juego calcularía distancia y ángulo en cada frame.' },
    ],
  },
  shooter: {
    id: 'shooter', emoji: '🎯', title: 'Shooter: el tiro perfecto', tagline: 'atan2 + gravedad = impacto', category: 'tecno',
    story: 'En un shooter, la bala viaja en línea recta un instante y luego la gravedad la curva. Para acertar, el juego calcula el ángulo de tiro con atan2(alto, lejos) y corrige la caída. Este triángulo es tu mira telescópica.',
    examples: ['Trayectoria de proyectiles', 'Caída por gravedad (bullet drop)', 'Headshots con viento', 'Arcos y flechas en juegos'],
    world: TRI([0, 0], [80, 0], [80, 45]),
    script: [
      { type: 'say', text: 'Tú disparas desde O. El objetivo está a 80 de distancia y 45 de altura.' },
      { type: 'pulse', id: 'hyp', ms: 1400 },
      { type: 'say', text: 'El ángulo θ es tu mira: atan2(45, 80) ≈ 29°. Sube o baja A y siente cómo cambia el tiro.' },
    ],
  },
  gps: {
    id: 'gps', emoji: '🛰️', title: 'GPS: tres círculos te encuentran', tagline: 'Trilateración con satélites', category: 'tecno',
    story: 'Tu teléfono no sabe dónde está: lo descubre midiendo distancias a satélites. Cada distancia dibuja un CÍRCULO; donde tres círculos se cruzan, ahí estás tú.',
    examples: ['GPS del teléfono', 'Mapas y navegación', 'Búsqueda y rescate', 'Geolocalización de entregas'],
    world: {
      points: [ { id: 's1', x: -40, y: 30 }, { id: 's2', x: 40, y: 30 }, { id: 's3', x: 0, y: -40 }, { id: 'U', x: 0, y: 0 } ],
      segments: [],
      circles: [ { id: 'g1', c: 's1', r: 50 }, { id: 'g2', c: 's2', r: 50 }, { id: 'g3', c: 's3', r: 40 } ],
    },
    script: [
      { type: 'say', text: 'Tres satélites, tres círculos de distancia... y un único punto donde se cruzan.' },
      { type: 'pulse', id: 'U', ms: 1600 },
      { type: 'say', text: 'Ese punto eres TÚ. Así funciona el GPS de tu teléfono: geometría orbital.' },
    ],
  },
  screen: {
    id: 'screen', emoji: '📱', title: 'Tu pantalla son matrices', tagline: 'Píxeles = números en filas y columnas', category: 'tecno',
    story: 'Cada pantalla procesa píxeles como matrices de números: filas y columnas que cambian de color 60 veces por segundo. Los filtros de TikTok e Instagram detectan los puntos clave de tu rostro con geometría y los mueven con álgebra lineal.',
    examples: ['Pantallas y videos', 'Filtros de TikTok/Instagram', 'Reconocimiento facial', 'Compresión de imágenes'],
    world: {
      points: [
        { id: 'p00', x: 0, y: 0 }, { id: 'p10', x: 30, y: 0 }, { id: 'p20', x: 60, y: 0 },
        { id: 'p01', x: 0, y: 30 }, { id: 'p11', x: 30, y: 30 }, { id: 'p21', x: 60, y: 30 },
        { id: 'p02', x: 0, y: 60 }, { id: 'p12', x: 30, y: 60 }, { id: 'p22', x: 60, y: 60 },
      ],
      segments: [
        { id: 'h1', a: 'p00', b: 'p20', color: '#38bdf8' }, { id: 'h2', a: 'p01', b: 'p21', color: '#38bdf8' }, { id: 'h3', a: 'p02', b: 'p22', color: '#38bdf8' },
        { id: 'v1', a: 'p00', b: 'p02', color: '#fb923c' }, { id: 'v2', a: 'p10', b: 'p12', color: '#fb923c' }, { id: 'v3', a: 'p20', b: 'p22', color: '#fb923c' },
      ],
    },
    script: [
      { type: 'say', text: 'Esta rejilla es tu pantalla: 9 píxeles, cada uno con coordenadas (x, y).' },
      { type: 'pulse', id: 'v2', ms: 1200 },
      { type: 'say', text: 'Mueve cualquier punto: acabas de editar una matriz, como hace tu teléfono 60 veces por segundo.' },
    ],
  },
  wheel: {
    id: 'wheel', emoji: '🎡', title: 'La rueda de la fortuna', tagline: 'De aquí nacen las ondas: música, mar, luz', category: 'vida',
    story: 'Imagina una cabina dando vueltas: su ALTURA sobre el centro es el seno del ángulo. Si graficas esa altura en el tiempo, nace una onda: la misma del sonido, el mar y la luz.',
    examples: ['Ruedas de la fortuna', 'Sonido y música (ondas senoidales)', 'Mareas y olas', 'Señales de radio y wifi'],
    world: {
      points: [ { id: 'c', x: 0, y: 0 }, { id: 'R', x: 40, y: 0 } ],
      segments: [ { id: 'rad', a: 'c', b: 'R', color: '#fb923c' } ],
      circles: [ { id: 'w1', c: 'c', r: 40 } ],
    },
    script: [
      { type: 'say', text: 'Esta rueda es el círculo unitario gigante: el radio mide 40.' },
      { type: 'pulse', id: 'rad', ms: 1400 },
      { type: 'say', text: 'La altura de la cabina R es el seno del ángulo. Gira el radio y mírala subir y bajar: así nace una onda.' },
    ],
  },
  music: {
    id: 'music', emoji: '🎵', title: 'MP3: la música se vuelve matemática', tagline: 'Fourier rompe el sonido en frecuencias puras', category: 'vida',
    story: 'Tu canción favorita se comprime en MP3 gracias a la Transformada de Fourier: rompe la onda sonora en frecuencias puras (senos y cosenos) y elimina lo que tu oído no escucha. Cada nota es un triángulo girando.',
    examples: ['Spotify y MP3', 'Ecualizadores', 'Auriculares con cancelación de ruido', 'Sintetizadores'],
    world: {
      points: [ { id: 'c', x: 0, y: 0 }, { id: 'R', x: 50, y: 30 } ],
      segments: [ { id: 'rad', a: 'c', b: 'R', color: '#fb923c' }, { id: 'alt', a: 'R', b: 'cx', color: '#38bdf8' }, { id: 'suelo', a: 'c', b: 'cx', color: '#e2e8f0' } ],
      circles: [ { id: 'w1', c: 'c', r: 58 } ],
    },
    script: [
      { type: 'say', text: 'Gira el radio R: su altura azul es el seno, la nota pura que Fourier extrae del sonido.' },
      { type: 'pulse', id: 'alt', ms: 1400 },
      { type: 'say', text: 'Miles de estas ondas juntas = tu canción. Por eso el MP3 pesa tan poco.' },
    ],
  },
  virus: {
    id: 'virus', emoji: '🦠', title: 'Virus con geometría', tagline: 'Icosaedros: 20 caras que encajan con tu célula', category: 'vida',
    story: 'Muchos virus (como el del resfriado) tienen forma de icosaedro: 20 caras triangulares. Visto de lado, es un hexágono lleno de triángulos: la geometría ayuda a los científicos a entender cómo se acopla a nuestras células.',
    examples: ['Rinovirus (resfriado común)', 'Cristales y minerales', 'Estructuras de proteínas', 'Diseño de vacunas'],
    world: {
      points: [
        { id: 'h0', x: 40, y: 0 }, { id: 'h1', x: 20, y: 35 }, { id: 'h2', x: -20, y: 35 },
        { id: 'h3', x: -40, y: 0 }, { id: 'h4', x: -20, y: -35 }, { id: 'h5', x: 20, y: -35 }, { id: 'cc', x: 0, y: 0 },
      ],
      segments: [
        { id: 'e1', a: 'h0', b: 'h1', color: '#38bdf8' }, { id: 'e2', a: 'h1', b: 'h2', color: '#38bdf8' }, { id: 'e3', a: 'h2', b: 'h3', color: '#38bdf8' },
        { id: 'e4', a: 'h3', b: 'h4', color: '#38bdf8' }, { id: 'e5', a: 'h4', b: 'h5', color: '#38bdf8' }, { id: 'e6', a: 'h5', b: 'h0', color: '#38bdf8' },
        { id: 's1', a: 'cc', b: 'h0', color: '#fb923c' }, { id: 's2', a: 'cc', b: 'h2', color: '#fb923c' }, { id: 's3', a: 'cc', b: 'h4', color: '#fb923c' },
      ],
    },
    script: [
      { type: 'say', text: 'Este hexágono es un virus de resfriado visto de frente: puro triángulo.' },
      { type: 'pulse', id: 's1', ms: 1100 }, { type: 'pulse', id: 's2', ms: 1100 }, { type: 'pulse', id: 's3', ms: 1100 },
      { type: 'say', text: 'En 3D son 20 caras triangulares: el icosaedro. La naturaleza también ama al triángulo.' },
    ],
  },
};

export const KNOWLEDGE_LIST = Object.values(KNOWLEDGE);