# Tutor de IA de trigonometría

Taller tocable donde niños (~10 años) descubren trigonometría jugando con una IA que dibuja, señala, narra y celebra — sobre un lienzo vivo estilo GeoGebra con álgebra actualizada en vivo.

Demo: https://helentierro.github.io/Trig-Ai-Qwen3.8/

## Qué hace

- **Pizarra viva:** lienzo SVG manipulable (grilla, puntos, segmentos) + panel Álgebra enlazado en vivo.
- **Tutora IA:** dibuja con su propio cursor, habla con voz del navegador, celebra descubrimientos. WebSocket + cerebro local offline como plan B.
- **Descubrir:** 6 mundos reales (puentes, rampas, escaleras, ruedas, videojuegos, GPS) y 6 retos jugables (`src/data/knowledge.ts`, `src/data/challenges.ts`).
- **Docente orquesta:** controles de voz, tema, construcción IA, mundos y retos.

Ver `PRODUCT.md` (producto) y `DESIGN.md` (sistema de diseño) para el detalle.

## Stack

Frontend: Vite 8 + React 19 + TypeScript + Zustand + SVG (SPA). Backend: FastAPI + WebSocket (`api/`), LLM intercambiable vía `OPENAI_BASE_URL` (Ollama local por defecto).

## Desarrollo

```bash
npm ci
npm run dev        # frontend en localhost:5173
npm run build      # tsc + vite build → dist/
npm run test:unit  # vitest (31 tests)
npm run lint       # oxlint
```

Backend:

```bash
cp api/.env.example api/.env   # nunca commitear .env
pip install -r api/requirements.txt
python api/main.py             # ws://localhost:8000/ws/tutor
```

## Variables de entorno y claves

- **`api/.env`** (backend, nunca se commitea): `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `MODEL`, `KEY_*`, `PORT`, `CORS_ORIGINS`. Plantilla en `api/.env.example`.
- **`.env.local`** (raíz, nunca se commitea, `*.local` en `.gitignore`): solo `OPEN_SANDBOX_*` para `scripts/sandbox-*.mjs` y opcional `VITE_WS_URL` para apuntar al backend en producción. Plantilla en `.env.example`.
- **Regla de oro:** todo `VITE_*` queda incrustado en `dist/` y es público. Nunca pongas API keys con prefijo `VITE_`.
- Verificado: ningún `.env` real está trackeado ni aparece en el historial git; solo los `*.example` con placeholders.

## Deploy

- **GitHub Pages** (automático): `.github/workflows/pages.yml` compila y publica `dist/` en cada push a `main` (`base: './'` en `vite.config.ts`, fallback `404.html` para SPA).
- **Firebase Hosting** (opcional): `firebase.json` sirve `dist/` con rewrite a `/index.html`.
- **CI:** `.github/workflows/ci.yml` corre build + vitest + lint en cada push/PR.
