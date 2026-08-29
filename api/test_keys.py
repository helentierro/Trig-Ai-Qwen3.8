import asyncio
import os
import re
import sys
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
APPLY = "--apply" in sys.argv

# Candidatos por proveedor. Si alguno ya murió, la LISTA DE MODELOS VIVOS
# que imprime el script te muestra los que existen HOY.
CANDIDATES = [
    ("Groq", "https://api.groq.com/openai/v1", "KEY_GROQ", [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.1-8b-instant",
    ]),
    ("NVIDIA", "https://integrate.api.nvidia.com/v1", "KEY_NVIDIA", [
        "meta/llama-3.3-70b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "meta/llama-3.1-8b-instruct",
    ]),
    ("OpenAI", "https://api.openai.com/v1", "KEY_OPENAI", ["gpt-4o-mini", "gpt-4.1-mini"]),
    ("DeepSeek", "https://api.deepseek.com", "KEY_DEEPSEEK", ["deepseek-chat"]),
    ("Gemini", "https://generativelanguage.googleapis.com/v1beta/openai", "KEY_GEMINI",
     ["gemini-2.0-flash", "gemini-2.5-flash"]),
]

winner = None

async def probe(client, model):
    try:
        r = await client.chat.completions.create(
            model=model, max_tokens=8, messages=[{"role": "user", "content": "Di ok"}])
        return True, (r.choices[0].message.content or "").strip()
    except Exception as e:
        return False, e.__class__.__name__

def apply_env(name, base, key, model):
    with open(".env", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r"^OPENAI_API_KEY=.*$", f"OPENAI_API_KEY={key}", content, flags=re.M)
    content = re.sub(r"^OPENAI_BASE_URL=.*$", f"OPENAI_BASE_URL={base}", content, flags=re.M)
    content = re.sub(r"^MODEL=.*$", f"MODEL={model}", content, flags=re.M)
    with open(".env", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\n📝 .env ACTUALIZADO: cerebro activo = {name} / {model}")

async def main():
    global winner
    print("Investigando modelos VIVOS en la web…\n")
    for name, base, keyvar, models in CANDIDATES:
        key = os.getenv(keyvar)
        print(f"── {name} ──")
        if not key:
            print("   sin clave en .env\n")
            continue
        client = AsyncOpenAI(api_key=key, base_url=base, timeout=20)

        # 1) La verdad de hoy: lista de modelos vivos del proveedor
        try:
            live = await client.models.list()
            ids = [m.id for m in live.data]
            print(f"   vivos ({len(ids)}): {', '.join(ids[:10])}")
        except Exception as e:
            print(f"   no pude listar modelos → {e.__class__.__name__} (¿clave o saldo?)")

        # 2) Prueba los candidatos
        for m in models:
            ok, info = await probe(client, m)
            print(f"   {'✅' if ok else '❌'} {m}" + ("" if ok else f" → {info}"))
            if ok and winner is None:
                winner = (name, base, key, m)
        print()

    if winner:
        print(f">>> GANADOR: {winner[0]} / {winner[3]}")
        if APPLY:
            apply_env(*winner)
        else:
            print("    (corre: python test_keys.py --apply  para escribirlo en .env)")
    else:
        print("Ningún cerebro respondió. Copia un modelo de las listas 'vivos' de arriba a .env.")

asyncio.run(main())