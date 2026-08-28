# DEV_DIARY — Trig AI Tutor 🤖
> La memoria viva del proyecto. Si eres una IA o un humano nuevo: **lee esto primero**,
> luego `docs/architecture.md`, y respeta las Reglas de Oro antes de tocar nada.
> Última actualización: sábado 29 de agosto de 2026.

---

## 0. Cómo trabajar con nosotros (LEER PRIMERO)

1. **Modalidad de entrega: archivos COMPLETOS listos para sobrescribir.** El dueño del
   proyecto prefiere reemplazar archivos enteros antes que aplicar parches a mano.
   Nunca entregues diffs sueltos salvo que se pida.
2. **Idioma y tono:** español, cálido ("mi rey"), pero técnicamente serio.
3. **Visión primero:** todo diseño se juzga con la pregunta: *¿un niño de 10 años puede
   tocarlo, jugarlo y descubrir con esto?* La IA no responde con párrafos: **responde con
   escenas** (dibuja, señala, narra, celebra).
4. **El LLM solo genera ESTRUCTURA, nunca números confiables:** el backend sanitiza
   todo (clamps, whitelists de ids). Regla del doc de arquitectura §9.
5. **`.env` NUNCA se commitea** (está en `.gitignore`). Las claves expuestas en chats
   se rotan.
6. **Commit por hito**, con mensaje `feat:`/`fix:` descriptivo.
7. El dueño personalizó textos de `App.tsx`/`AlgebraPanel.tsx` (título
   "Tutor de IA de trigonometría", label "altura"). **No pisar sus personalizaciones**
   sin preguntar.
8. Bienvenidas las segundas opiniones de otros modelos (Gemini etc.): el diario es la
   fuente de verdad, no el chat.

---

## 1. El sueño (visión del producto)

Un niño abre la tablet, manosea un mundo matemático, y una IA lo acompaña: dibuja con su
propio cursor, narra con voz, señala lo que explica, celebra sus descubrimientos y lo
reta a jugar. Como aprender código con un LLM, pero con trigonometría — y luego con toda
la matemática. Referencias de interfaz: GeoGebra (mundo + álgebra viva), Photoshop/Blender
(herramientas pro), pero **más didáctico y con compañera IA**.

---

## 2. Stack y ubicación ACTUALES

- **Ruta del repo:** `D:\1 MIS PROYECTOS DANNII\Trig-Ai-Qwen3.8`
- **Frontend:** Vite + React + TypeScript (template react-ts), Zustand, SVG.
  `npm run dev` → `localhost:5173`. Node v24 visto en máquina.
- **Backend:** FastAPI + uvicorn en `api/` (venv en `api/.venv`),
  `uvicorn main:app --reload --port 8000`. Cliente `openai` de Python compatible con
  OpenAI/Groq/DeepSeek/NVIDIA/Gemini/OpenRouter/Ollama vía `OPENAI_BASE_URL`.
- **WebSocket:** `ws://localhost:8000/ws/tutor` (implementa el contrato de
  `docs/architecture.md` §7).
- **Voz:** `speechSynthesis` del navegador (placeholder; mañana ElevenLabs, misma interfaz).
- **Entorno del dueño:** Windows 10/11, VS Code, Edge, CMD/PowerShell.

### Mapa de archivos (quién es quién)

```
api/            main.py (WS + sanitize), test_keys.py (investiga modelos vivos,
                --apply escribe el ganador en .env), requirements.txt,
                .env (NO commitear), .env.example
docs/           architecture.md (norte), DEV_DIARY.md (este)
src/
  utils/        coordinateTransform.ts (world↔screen, niceGridStep, clamp)
  types/        ai.ts (SceneStep/SceneScript: el protocolo sagrado)
  stores/       canvasStore.ts (scene graph + cámara + herramientas + mundos)
                chatStore.ts (mensajes) · challengeStore.ts (retos + watcher)
  services/     scenePlayer.ts (tweens, cursor IA, speak, buildTriangleScript)
                localTutor.ts (cerebro local, plan B) · aiService.ts (WS + fallback)
  hooks/        useTeachableMoments.ts (snap-angle → lección proactiva)
  data/         knowledge.ts (6 mundos) · challenges.ts (6 retos)
  components/
    canvas/     TriangleCanvas.tsx · InteractionLayer.tsx · ToolPalette.tsx
    panel/      AlgebraPanel.tsx · DiscoverPanel.tsx
    chat/       ChatPanel.tsx
  App.tsx · main.tsx · index.css
```

---

## 3. Crónica de fases (lo construido)

### Fase A — El Mundo (feel GeoGebra)
Canvas infinito: zoom al cursor/pinch, pan, grilla adaptativa 1/2/5×10ⁿ, ejes con números.
Scene graph en `canvasStore`: puntos `O` (fijo), `B` (horizontal), `A` (libre) con
restricciones; segmentos `base/height/hyp`. **Imanes magnéticos** en 15/30/45/60/75°
(con badge ⚡ y evento `snap-angle`). Sliders y fórmula bidireccionales.
*Hito emocional:* el niño descubre con la mano que a 60° la hipotenusa = 2×base.

### Fase B — Panel Álgebra + el dedo de la IA
`AlgebraPanel`: lista viva de puntos/segmentos/medidas (estilo GeoGebra), hover
bidireccional panel↔canvas, selección fijada, ojos 👁 (visibilidad), hover en «área»
rellena el triángulo. Nace **`pulse(id)`**: el mecanismo para que la IA *señale* objetos.

### Fase C — Director de escena + tutor que observa
`types/ai.ts` (SceneStep), `scenePlayer.ts`: cola de pasos con easing, **cursor violeta
"IA" que actúa como lápiz**, subtítulos animados, voz opcional. `buildTriangleScript()`
construye y narra *el triángulo actual*. `ChatPanel` + `localTutor` (intenciones locales:
ángulos, hipotenusa, catetos, seno/coseno/tangente, área, 180°).
`useTeachableMoments`: al imantar un ángulo notable, la IA comenta el descubrimiento en el
chat (una vez por ángulo por sesión).

### Fase D — Cerebro real (backend)
`api/main.py`: WebSocket `/ws/tutor`; system prompt obliga JSON `{reply, steps}`;
`sanitize()` valida ids y clamps (el LLM nunca inventa números). `aiService.ts`: conecta,
envía `{type:'chat', text, context: measures}`, aplica la respuesta como escena;
**caída suave** a `localTutor` si el backend está offline (avisa una vez).
Gestión de claves: bóveda `KEY_*` en `.env`; `test_keys.py` lista **modelos vivos** de cada
proveedor y `--apply` escribe el cerebro ganador. Estado del sondeo (28-ago-2026):
Groq✅clave/modelo 404→auto-fix; OpenAI 429 sin cuota; DeepSeek 402 sin saldo;
NVIDIA 410 modelo EOL 26-ago-2026; Gemini clave inválida (las de Google empiezan `AIza…`).

### Fase E — Laboratorio: herramientas + mundos + retos
- **ToolPalette:** 🖐 mover · 📍 punto · 📏 segmento · ⭕ círculo · 🧹 volver al triángulo.
  Puntos libres `P1…`, segmentos `s1…`, círculos `c1…` (Esc cancela).
- **`data/knowledge.ts` — 6 mundos** con historia + ejemplos reales + escena narrada:
  `bridge` 🌉 (celosías: el triángulo no se deforma), `ramp` ♿ (pendiente=tan),
  `ladder` 🪜 (regla 4-a-1, 75°), `wheel` 🎡 (círculo→onda), `game` 🎮 (Pitágoras por frame),
  `gps` 🛰 (tres círculos te ubican). `loadWorld(id)` en el store.
- **`data/challenges.ts` — 6 retos** verificados EN VIVO por `challengeStore`
  (subscribe al store): `gold45, twins, hyp100, area800, steep, builder`.
  Celebración 🎉 + voz al superar.
- La IA (local y remota) abre mundos (`world`) y lanza retos (`challenge`).

### 🔥 El crash de la Fase E (lección)
`measures: measure({})` al inicializar el store → `pts.B.pos` de un objeto vacío →
TypeError al importar → app congelada en negro. Fix: guard en `measure`
(`if (!pts.O||!pts.B||!pts.A) return ZERO`) + estado inicial `{...ZERO}` +
`buildTriangleScript()` vuelve al triángulo si no hay (`loadWorld(null)`).
*Lección:* un crash en inicialización de store congela toda la app; DevTools Console es la
primera parada. (Gemini sugirió optional chaining: cura síntoma, no causa.)

---

## 4. El protocolo sagrado (SceneStep)

```ts
cursor {to|null,ms} · point {id,ms} · segment {id,ms} · pulse {id,ms}
say {text} · wait {ms} · world {id} · challenge {id}
```
Front y backend hablan esto. El backend emite `steps` ya sanitizados; el frontend los
ejecuta con `playScene`. **No renombrar ni romper este contrato.**

---

## 5. Tablero de equipo (ABIERTO — traer al próximo fix)

- 🐛 **F1:** arrastrar `B` deja `A` atrás → se rompe el ángulo recto (altura chueca,
  panel miente "B=90°"). Fix en `canvasStore.dragTo`, rama `id==='B'`: mover también
  `A` → `applyPoints({...points, B:{...pos:{x:b,y:0}}, A:{...points.A, pos:{x:b, y:points.A.pos.y}}})`.
- ✨ **F2:** Vite `EBUSY` ocasional (archivo bloqueado por AV/editor): reiniciar dev
  server; si reaparece, exclusión en Defender.
- ✨ **F3:** letra `B` pisa el número del eje; label del ángulo pisa la base en triángulos
  chatos (mejorar offsets de labels).
- 📝 Pendiente histórico: footer viejo decía "bronceado(" (traducción de `tan`): ya
  reemplazado por el dueño; no traducir fórmulas jamás.

---

## 6. Historial Git (hitos)

```
feat: interfaz v2 con panel algebraico sincronizado
feat: B - director de escena IA con cursor y voz        [f63fd8e]
feat: C - chat tutor + momentos enseñables              [d6c0b09]
feat: D - backend FastAPI + WebSocket + LLM con fallback local (propuesto)
feat: E - herramientas de construccion + biblioteca de mundos + retos en vivo [d57d6b1]
fix: store inicial seguro (measure blindado) (propuesto)
docs: DEV_DIARY.md ← este commit
```

---

## 7. Próximos pasos (E2 y más allá)

1. Triage del playtest del dueño (su lista) + F1–F3.
2. Herramienta **Polígono** (cerrar con clic al primer punto).
3. **Micrófono** (SpeechRecognition web; luego Whisper) para hablarle al tutor.
4. Guardar/compartir mundos (localStorage + export JSON).
5. Círculo unitario interactivo con **gráfica de la onda seno** sincronizada al arrastrar.
6. Modo práctica donde la IA **corrige** el procedimiento, no solo el resultado.
7. Voz premium (ElevenLabs) manteniendo la interfaz `speak()`.
8. Actualizar ESTE diario en cada fase. 📖

---

## 8. Ritual de encendido

```bat
:: frontend
npm run dev
:: backend (otra terminal)
cd api & .venv\Scripts\activate & uvicorn main:app --reload --port 8000
:: opcional: elegir cerebro vivo
python test_keys.py --apply
```

---

## 9. Cultura del equipo (no perder)

- Probar como usuarios, analizar como ingenieros: playtest → lista → triaje
  (🐛 bug /  polish / 🚀 feature) → fixes en archivos completos → commit.
- El niño descubre con la mano: imanes, pulsos, celebraciones, retos en vivo.
- La respuesta de la IA es una **escena**, no un párrafo.
- "bronceado" queda como recordatorio eterno de no traducir matemática. 😄