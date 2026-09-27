// scripts/sandbox-lab.mjs — wrapper dev-only para OpenSandbox (aislado, no app code)
// Uso: node scripts/sandbox-lab.mjs "echo hola"
//      node scripts/sandbox-probe.mjs  (probe trigSummary)
// Lee credenciales de .env.local (nunca hardcodear la clave en código).

import { readFileSync, existsSync } from "node:fs";
import { ConnectionConfig, Sandbox } from "@alibaba-group/opensandbox";

function loadDotEnvLocal(path = ".env.local") {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadDotEnvLocal();

export function getLabConfig() {
  const domain = process.env.OPEN_SANDBOX_DOMAIN ?? "localhost:8080";
  const apiKey = process.env.OPEN_SANDBOX_API_KEY;
  const protocol = process.env.OPEN_SANDBOX_PROTOCOL ?? "http";
  const image = process.env.OPEN_SANDBOX_IMAGE ?? "node:20-slim";
  if (!apiKey) throw new Error("Falta OPEN_SANDBOX_API_KEY en .env.local");
  return { domain, apiKey, protocol, image };
}

export async function withSandbox(fn, opts = {}) {
  const { domain, apiKey, protocol, image } = getLabConfig();
  const config = new ConnectionConfig({ domain, apiKey, protocol, requestTimeoutSeconds: 60 });
  const sandbox = await Sandbox.create({
    connectionConfig: config,
    image: opts.image ?? image,
    timeoutSeconds: opts.timeoutSeconds ?? 10 * 60,
  });
  try {
    return await fn(sandbox);
  } finally {
    try { await sandbox.kill(); } catch { /* best effort */ }
    try { await sandbox.close(); } catch { /* best effort */ }
  }
}

export function fmtExecution(execution) {
  const out = (execution?.logs?.stdout ?? []).map((m) => m.text).join("\n");
  const err = (execution?.logs?.stderr ?? []).map((m) => m.text).join("\n");
  return { out, err, raw: execution };
}

// CLI rápido: node scripts/sandbox-lab.mjs "<comando>"
if (process.argv[1]?.endsWith("sandbox-lab.mjs") && process.argv[2]) {
  const cmd = process.argv.slice(2).join(" ");
  withSandbox(async (sbx) => {
    const exec = await sbx.commands.run(cmd);
    const { out, err } = fmtExecution(exec);
    if (out) console.log("[sandbox stdout]\n" + out);
    if (err) console.error("[sandbox stderr]\n" + err);
  }).catch((e) => {
    console.error("[sandbox-lab] ERROR:", e?.message ?? e);
    if (e?.error) console.error(`code=${e.error.code} requestId=${e.requestId ?? "N/A"}`);
    process.exit(1);
  });
}
