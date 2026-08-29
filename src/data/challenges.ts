import type { CanvasState } from '../stores/canvasStore';

export interface Challenge {
  id: string; title: string; prompt: string; hint: string;
  verify: (s: CanvasState) => boolean; success: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'gold45', title: 'El ángulo de oro',
    prompt: 'Logra que θ mida EXACTAMENTE 45° (usa el imán ⚡).',
    hint: 'Arrastra el vértice A despacio cerca de la diagonal.',
    verify: (s) => s.hasTriangle && Math.abs(s.measures.angleDeg - 45) <= 0.6,
    success: '🏅 ¡45°! Catetos iguales, tan = 1. Dominas el imán.',
  },
  {
    id: 'twins', title: 'Catetos gemelos',
    prompt: 'Haz que la base y la altura midan lo mismo (±0.5).',
    hint: 'Es otro efecto del 45°… 👀',
    verify: (s) => s.hasTriangle && Math.abs(s.measures.base - s.measures.height) <= 0.5,
    success: '🏅 ¡Gemelos! Base = altura: el triángulo isósceles rectángulo.',
  },
  {
    id: 'hyp100', title: 'Hipotenusa centenario',
    prompt: 'Consigue que la hipotenusa mida 100 (±1.5).',
    hint: 'Juega con la base Y el ángulo a la vez.',
    verify: (s) => s.hasTriangle && Math.abs(s.measures.hyp - 100) <= 1.5,
    success: '🏅 ¡Hipotenusa 100! Pitágoras estaría orgulloso.',
  },
  {
    id: 'area800', title: 'Terreno de 800',
    prompt: 'Construye un triángulo con área = 800 (±10).',
    hint: 'área = base × altura / 2. Por ejemplo 40 × 40.',
    verify: (s) => s.hasTriangle && Math.abs(s.measures.area - 800) <= 10,
    success: '🏅 ¡800 de área! Ya calculas terrenos como un agrimensor.',
  },
  {
    id: 'steep', title: 'Montaña rusa',
    prompt: 'Sube θ a 75° o más sin pasar de 89°.',
    hint: 'Cerca de 75° hay otro imán ⚡.',
    verify: (s) => s.hasTriangle && s.measures.angleDeg >= 74.5,
    success: '🏅 ¡Empinadísimo! Así se sienten 75°: casi una pared.',
  },
  {
    id: 'builder', title: 'Ingeniero de puentes',
    prompt: 'Con las herramientas 🛠, construye al menos 4 segmentos nuevos (¡haz tu propio puente!).',
    hint: 'Herramienta punto para crear vértices, segmento para unirlos.',
    verify: (s) => s.segments.filter((g) => g.id.startsWith('s')).length >= 4,
    success: '🌉 ¡Ingeniero! Combinaste formas y construiste algo nuevo. PARA ESTO es la trigonometría.',
  },
];