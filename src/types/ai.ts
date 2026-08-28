import type { Vec2 } from '../utils/coordinateTransform';

// Protocolo de escena: lo que la IA envía al mundo.
// Cuando exista el backend, estos mismos JSON llegarán por WebSocket
// (docs/architecture.md §7): { type: 'draw' | 'speak' | ... }
export type SceneStep =
  | { type: 'cursor'; to: Vec2 | null; ms?: number }   // el cursor IA se desliza (null = se va)
  | { type: 'point'; id: string; ms?: number }         // revela un punto (pop)
  | { type: 'segment'; id: string; ms?: number }       // trazo animado de un segmento
  | { type: 'pulse'; id: string; ms?: number }         // "mira esto"
  | { type: 'say'; text: string }                      // subtítulo + voz (si está activada)
  | { type: 'wait'; ms: number };

export type SceneScript = SceneStep[];