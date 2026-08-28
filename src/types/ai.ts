import type { Vec2 } from '../utils/coordinateTransform';

export type SceneStep =
  | { type: 'cursor'; to: Vec2 | null; ms?: number }
  | { type: 'point'; id: string; ms?: number }
  | { type: 'segment'; id: string; ms?: number }
  | { type: 'pulse'; id: string; ms?: number }
  | { type: 'say'; text: string }
  | { type: 'wait'; ms: number }
  | { type: 'world'; id: string }      // ← carga un mundo de la Biblioteca
  | { type: 'challenge'; id: string }; // ← lanza un Reto

export type SceneScript = SceneStep[];