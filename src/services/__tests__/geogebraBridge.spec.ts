// src/services/__tests__/geogebraBridge.spec.ts — Fase 4/4: el contrato GGB→IA es puro y testeable.
import { describe, expect, it, vi } from 'vitest';
import { buildScene, ggbUpdateToHouse, narrationForGgb, TRIANGLE_SCENE } from '../geogebraBridge';

describe('geogebraBridge', () => {
  it('traduce updates de GeoGebra a eventos de la casa', () => {
    expect(ggbUpdateToHouse('A')).toEqual({ type: 'ggb-update', obj: 'A', detail: undefined });
  });

  it('narra con cariño los objetos conocidos y en genérico los demás', () => {
    expect(narrationForGgb('A')).toContain('punto A');
    expect(narrationForGgb('theta')).toContain('ángulo θ');
    expect(narrationForGgb('ZZ9')).toContain('ZZ9');
  });

  it('la escena inicial trae triángulo rectángulo + ángulo', () => {
    const joined = TRIANGLE_SCENE.join('\n');
    expect(joined).toContain('Polygon(A,B,C)');
    expect(joined).toContain('Angle(');
  });

  it('buildScene ejecuta cada comando y cuenta fallos', () => {
    const api = { evalCommand: vi.fn((_cmd: string) => true) };
    expect(buildScene(api)).toBe(0);
    expect(api.evalCommand).toHaveBeenCalledTimes(TRIANGLE_SCENE.length);
    const bad = { evalCommand: vi.fn((_cmd: string) => { throw new Error('x'); }) };
    expect(buildScene(bad)).toBe(TRIANGLE_SCENE.length);
  });
});
