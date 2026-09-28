// src/stores/houseStore.ts — Fase 1 Gran Casa: navegación por habitaciones + bus de eventos.
// El lienzo pasa a ser una habitación (Taller). Aditivo: no toca canvasStore ni sus slices.
import { create } from 'zustand';

export type RoomId = 'taller' | 'biblioteca' | 'laboratorio' | 'mesa' | 'sala';

export const ROOMS: { id: RoomId; icon: string; label: string; hint: string }[] = [
  { id: 'taller', icon: '📐', label: 'Taller', hint: 'mundo libre — toca, construye, descubre' },
  { id: 'biblioteca', icon: '📚', label: 'Biblioteca', hint: 'mundos con historia + retos' },
  { id: 'laboratorio', icon: '🧪', label: 'Laboratorio', hint: 'ala GeoGebra (requiere internet)' },
  { id: 'mesa', icon: '🧮', label: 'Mesa', hint: 'tabla + hoja de cálculo' },
  { id: 'sala', icon: '👩‍🏫', label: 'Sala docente', hint: 'orquesta la sesión del aula' },
];

// ─── Bus de eventos de la casa (extiende la idea de onCanvasEvent a toda la casa) ───
export type HouseEvent =
  | { type: 'room-change'; room: RoomId }
  | { type: 'ggb-update'; obj: string; detail?: string }
  | { type: 'chat-say'; text: string }
  | { type: 'world-enter'; worldId: string | null };

const listeners = new Set<(e: HouseEvent) => void>();
export const onHouseEvent = (fn: (e: HouseEvent) => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
export const emitHouse = (e: HouseEvent) => listeners.forEach((fn) => fn(e));

interface HouseState {
  room: RoomId;
  go: (room: RoomId) => void;
}

export const useHouseStore = create<HouseState>()((set) => ({
  room: 'taller',
  go: (room) =>
    set((s) => {
      if (s.room === room) return s;
      emitHouse({ type: 'room-change', room });
      return { room };
    }),
}));
