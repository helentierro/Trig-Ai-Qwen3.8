// src/services/geogebraBridge.ts — Fase 4/4: contrato entre el applet GeoGebra y la casa.
// Todo lo testeable vive aquí como funciones puras; el componente solo inyecta el applet.
// Dirección prioritaria: GGB→IA (lo que el niño toca, la tutora lo narra).

import type { HouseEvent } from '../stores/houseStore';

// Módulo ES6 oficial (inyecta el applet sin <script> global). Solo se carga al entrar al Laboratorio.
export const GGB_MODULE_URL = 'https://www.geogebra.org/apps/latest/web3d/web3d.nocache.mjs';

// Subconjunto de la API JS de GeoGebra que usamos (ver GeoGebra_Apps_API).
export interface GgbApi {
  evalCommand: (cmd: string) => boolean;
  registerUpdateListener: (fn: (objName: string) => void) => void;
  registerObjectUpdateListener: (objName: string, fn: (objName: string) => void) => void;
  setVisible: (objName: string, visible: boolean) => void;
  remove: () => void;
}

// Escena inicial curada: triángulo rectángulo 3-4-5 con ángulo visible. Comandos en inglés (lo exige la API).
export const TRIANGLE_SCENE: string[] = [
  'A=(0,0)',
  'B=(4,0)',
  'C=(4,3)',
  'tri=Polygon(A,B,C)',
  'theta=Angle(B,A,C)',
];

// Nombres que la tutora sabe narrar con cariño; el resto cae al genérico.
const FRIENDLY: Record<string, string> = {
  A: 'el punto A (el origen del ángulo)',
  B: 'el punto B (la base)',
  C: 'el punto C (la altura)',
  tri: 'el triángulo',
  theta: 'el ángulo θ',
};

// GGB→casa: cualquier update del applet se vuelve evento de la casa.
export function ggbUpdateToHouse(objName: string, detail?: string): HouseEvent {
  return { type: 'ggb-update', obj: objName, detail };
}

// Casa→niño: narración cálida en español para cada toque.
export function narrationForGgb(objName: string): string {
  const who = FRIENDLY[objName] ?? `el objeto ${objName}`;
  return `🧪 Vi que se movió ${who} en el Laboratorio. ¿Qué cambió en la figura? Míralo y cuéntame.`;
}

// Construye la escena inicial comando a comando; devuelve cuántos fallaron (0 = todo bien).
export function buildScene(api: Pick<GgbApi, 'evalCommand'>, scene: string[] = TRIANGLE_SCENE): number {
  let failed = 0;
  for (const cmd of scene) {
    try {
      if (!api.evalCommand(cmd)) failed += 1;
    } catch {
      failed += 1;
    }
  }
  return failed;
}
