# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Niños de ~10 años aprendiendo trigonometría en el aula, con un docente que guía y orquesta la sesión. Los niños tocan, juegan y descubren en español; el docente dirige el ritmo y las actividades.

## Product Purpose

Acompañar el descubrimiento de la trigonometría (y luego de toda la matemática) jugando con un mundo matemático manipulable junto a una IA compañera. Existe porque leer explicaciones no enseña a un niño: tocar, ver y celebrar sí. Éxito significa que un niño puede tocarlo, jugarlo y descubrir con esto, con o sin conexión.

## Positioning

Una tutora de IA que no responde con párrafos sino con escenas: dibuja con su propio cursor, señala lo que explica, narra con voz y celebra los descubrimientos — sobre un lienzo vivo estilo GeoGebra con álgebra actualizada en vivo — más 6 mundos reales (puentes, rampas, escaleras, ruedas, videojuegos, GPS) y 6 retos jugables. Ningún chatbot ni pizarra estática hace ambas cosas a la vez.

## Operating Context

Sesiones en aula sobre tablet o PC con navegador moderno. Frontend web (Vite + React + TypeScript + Zustand + SVG) servido como SPA; backend FastAPI con WebSocket de tutoría; modelo de lenguaje intercambiable vía `OPENAI_BASE_URL` (Ollama local por defecto). Despliegue previsto: hosting estático para el frontend. Voz sintetizada del navegador como interfaz estable. El docente opera los controles (voz, tema, construcción IA, mundos, retos) mientras los niños exploran.

## Capabilities and Constraints

- Chat con tutora IA por WebSocket con cerebro local offline como plan B; funcionar sin red es innegociable.
- El LLM solo genera estructura (réplica + pasos de escena); el backend sanitiza todo con allowlists y clamps, y el frontend revalida antes de actuar.
- Parser matemático propio sin `eval`; límite de mensajes por IP; `.env` nunca se commitea.
- UI en español con tono cálido; personalizaciones del dueño en `App.tsx`/`AlgebraPanel.tsx` (título "Tutor de IA de trigonometría", etiqueta "altura") no se pisan sin preguntar.
- Entregas como archivos completos listos para sobrescribir; commits `feat:`/`fix:` por hito.

## Brand Commitments

Nombre: "Tutor de IA de trigonometría". Voz cálida en español. Pregunta de juicio para todo diseño: "¿un niño de 10 años puede tocarlo, jugarlo y descubrir con esto?".

## Evidence on Hand

- `docs/DEV_DIARY.md`: memoria viva del proyecto y reglas de trabajo.
- `docs/architecture/trig-ai.architecture.json` + `trig-ai.html`: mapa runtime validado.
- `src/data/knowledge.ts` (6 mundos) y `src/data/challenges.ts` (6 retos): contenido didáctico real.
- Sin testimonios, casos de estudio ni métricas de aula: el trabajo futuro no debe fabricarlos.

## Product Principles

1. El descubrimiento manda: primero tocar y jugar, la explicación llega después.
2. La IA muestra, no cuenta: cada respuesta es una escena visible y audible, no un párrafo.
3. Offline nunca bloquea: sin red el tutor local sostiene la sesión.
4. El docente orquesta: los controles sirven a quien guía el aula, no solo al niño.
5. Sanitizar siempre: nada que venga del modelo o del usuario se ejecuta sin validar.
