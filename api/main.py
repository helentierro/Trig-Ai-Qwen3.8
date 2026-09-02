# api/main.py — Backend Trig AI Tutor (Día 1: seguridad)
import os
import re
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_ipaddr
from slowapi.errors import RateLimitExceeded

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trig-ai")

# ─── App + middleware ─────────────────────────────────────────
app = FastAPI(title="Trig AI Tutor API")

# CORS desde env (no hardcodeado)
cors_origins = os.getenv("CORS_ORIGINS", "*")
origins = ["*"] if cors_origins == "*" else [o.strip() for o in cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter (10 req/min por IP por defecto)
limiter = Limiter(key_func=get_ipaddr)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit excedido desde {get_ipaddr(request)}")
    return JSONResponse(
        status_code=429,
        content={"reply": "Estoy pensando muy rápido, dame un segundo 🙏", "steps": []},
    )

# ─── Cliente LLM ──────────────────────────────────────────────
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "ollama"),
    base_url=os.getenv("OPENAI_BASE_URL", "http://localhost:11434/v1"),
)
MODEL = os.getenv("MODEL", "qwen2.5:7b")

IDS = {"O", "B", "A", "base", "height", "hyp", "angleO", "angleB", "angleA", "area"}
WORLDS = {"bridge", "ramp", "ladder", "wheel", "game", "gps"}
CHALLENGES = {"gold45", "twins", "hyp100", "area800", "steep", "builder"}

SYSTEM = """Eres el tutor de trigonometría de un niño de 10 años. Cálido, con asombro, breve (máximo 2 frases), en español.
Responde SOLO con JSON válido, sin markdown:
{"reply": "lo que le dices al niño", "steps": [ ...acciones... ]}
Acciones permitidas en "steps" (máximo 4):
{"type": "pulse", "id":ID, "ms":1400}        ID en {IDS}
{"type": "set_angle", "deg":N}              1..89
{"type": "set_base", "n":N}                 5..120
{"type": "construct"}                       reconstruye el triángulo con tu lápiz
{"type": "world", "id":W}                   abre un mundo: W en {WORLDS}
{"type": "challenge", "id":C}               lanza un reto: C en {CHALLENGES}
Cuándo usar mundos: puentes/celosías→bridge; rampas/pendiente→ramp; escaleras→ladder; ruedas/ondas/círculo unitario→wheel; videojuegos/distancias→game; gps/satélites/mapas→gps. Si piden "ejemplos reales" o "para qué sirve"→bridge.
Cuándo usar retos: si piden jugar/practicar/ejercicio/reto→challenge (elige uno).
Reglas: pulsa TODO lo que menciones; usa SOLO los números del ESTADO ACTUAL; invita a arrastrar y descubrir.
ESTADO ACTUAL DEL MUNDO: {context}"""


def sanitize(step):
    if not isinstance(step, dict):
        return None
    t = step.get("type")
    try:
        if t == "pulse" and step.get("id") in IDS:
            return {"type": "pulse", "id": step["id"], "ms": min(int(step.get("ms", 1400)), 3000)}
        if t == "set_angle":
            return {"type": "set_angle", "deg": max(1, min(89, int(step["deg"])))}
        if t == "set_base":
            return {"type": "set_base", "n": max(5, min(120, int(step["n"])))}
        if t == "construct":
            return {"type": "construct"}
        if t == "world" and step.get("id") in WORLDS:
            return {"type": "world", "id": step["id"]}
        if t == "challenge" and step.get("id") in CHALLENGES:
            return {"type": "challenge", "id": step["id"]}
    except (ValueError, KeyError, TypeError):
        return None
    return None


def parse_llm(raw: str):
    m = re.search(r"{.*}", raw, re.S)
    if not m:
        return raw.strip(), []
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError:
        return raw.strip(), []
    reply = str(obj.get("reply", "")).strip() or raw.strip()
    steps = [s for s in (sanitize(x) for x in obj.get("steps", [])) if s][:4]
    return reply, steps


@app.get("/")
def health():
    return {"ok": True, "model": MODEL}


@app.websocket("/ws/tutor")
@limiter.limit(f"{os.getenv('RATE_LIMIT_PER_MINUTE', '10')}/minute")
async def ws_tutor(ws: WebSocket, request: Request):
    # FIX: get_ipaddr requiere request, lo pasamos vía parámetro
    await ws.accept()
    ip = get_ipaddr(request)
    logger.info(f"WebSocket conectado desde {ip}")
    while True:
        try:
            data = await ws.receive_json()
        except (WebSocketDisconnect, Exception):
            logger.info(f"WebSocket desconectado: {ip}")
            break
        if data.get("type") != "chat":
            continue
        text = str(data.get("text", ""))[:500]
        context = data.get("context", {})
        try:
            resp = await client.chat.completions.create(
                model=MODEL,
                temperature=0.7,
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM
                        .replace("{IDS}", ", ".join(sorted(IDS)))
                        .replace("{WORLDS}", ", ".join(sorted(WORLDS)))
                        .replace("{CHALLENGES}", ", ".join(sorted(CHALLENGES)))
                        .replace("{context}", json.dumps(context, ensure_ascii=False)),
                    },
                    {"role": "user", "content": text},
                ],
            )
            raw = resp.choices[0].message.content or ""
            reply, steps = parse_llm(raw)
        except Exception as e:
            # FIX: no filtrar nombre de excepción al cliente
            logger.error(f"Error en LLM: {e.__class__.__name__}: {e}")
            reply = "Ups, mi cerebro externo se tropezó. Pero sigo aquí: pregúntame por la hipotenusa, un puente o un reto."
            steps = []
        try:
            await ws.send_json({"type": "answer", "reply": reply, "steps": steps})
        except Exception:
            break