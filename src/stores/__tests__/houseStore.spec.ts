// src/stores/__tests__/houseStore.spec.ts — Fase 1: la casa navega y el bus emite.
import { describe, expect, it, vi } from 'vitest';
import { emitHouse, onHouseEvent, useHouseStore } from '../houseStore';

describe('houseStore', () => {
  it('empieza en el Taller', () => {
    expect(useHouseStore.getState().room).toBe('taller');
  });

  it('navega entre habitaciones y emite room-change', () => {
    const seen: string[] = [];
    const off = onHouseEvent((e) => {
      if (e.type === 'room-change') seen.push(e.room);
    });
    useHouseStore.getState().go('biblioteca');
    expect(useHouseStore.getState().room).toBe('biblioteca');
    useHouseStore.getState().go('laboratorio');
    expect(seen).toEqual(['biblioteca', 'laboratorio']);
    off();
    useHouseStore.getState().go('taller');
  });

  it('puente GGB→IA: ggb-update llega a los suscriptores', () => {
    const fn = vi.fn();
    const off = onHouseEvent(fn);
    emitHouse({ type: 'ggb-update', obj: 'punto A' });
    expect(fn).toHaveBeenCalledWith({ type: 'ggb-update', obj: 'punto A' });
    off();
  });
});
