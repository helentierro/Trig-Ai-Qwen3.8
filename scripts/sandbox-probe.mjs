// scripts/sandbox-probe.mjs — Paso 1: verifica conexión + valida trigSummary DENTRO del sandbox.
// La matemática pesada corre en Docker (node:20-slim), no en Windows.
// Uso: node scripts/sandbox-probe.mjs

import { withSandbox, fmtExecution } from "./sandbox-lab.mjs";

// Réplica exacta de src/utils/geometry.ts::trigSummary para validar aislada.
const PROBE_CODE = `
const rad = (d) => (d * Math.PI) / 180;
const trigSummary = (m) => {
  const angleDeg = Number.isFinite(m.angleDeg) ? m.angleDeg : 0;
  const r = rad(angleDeg);
  const sin = Math.sin(r);
  const cos = Math.cos(r);
  const tan = Math.abs(cos) < 1e-9 ? 0 : Math.tan(r);
  return {
    angleDeg,
    sin, cos, tan,
    csc: Math.abs(sin) < 1e-9 ? 0 : 1 / sin,
    sec: Math.abs(cos) < 1e-9 ? 0 : 1 / cos,
    cot: Math.abs(tan) < 1e-9 ? 0 : 1 / tan,
  };
};
const cases = [0, 30, 45, 60, 90];
const out = cases.map((a) => ({ input: a, ...trigSummary({ angleDeg: a }) }));
console.log(JSON.stringify(out));
// Aserciones críticas (tolerancia 1e-9)
const approx = (x, y, tol=1e-9) => Math.abs(x-y) <= tol;
const checks = [];
const t30 = trigSummary({angleDeg:30});
checks.push(["sin30=0.5", approx(t30.sin,0.5)]);
checks.push(["cos30=√3/2", approx(t30.cos,Math.sqrt(3)/2)]);
const t45 = trigSummary({angleDeg:45});
checks.push(["sin45=cos45", approx(t45.sin,t45.cos)]);
checks.push(["tan45=1", approx(t45.tan,1)]);
const t90 = trigSummary({angleDeg:90});
checks.push(["tan90->0 (guard)", t90.tan===0]);
checks.push(["sec90->0 (guard)", t90.sec===0]);
checks.push(["sin90=1", approx(t90.sin,1)]);
const t0 = trigSummary({angleDeg:0});
checks.push(["csc0->0 (guard)", t0.csc===0]);
checks.push(["cot0->0 (guard)", t0.cot===0]);
let fail=0;
for (const [n,ok] of checks) { console.log((ok?"PASS":"FAIL")+" "+n); if(!ok) fail++; }
if (fail>0) { console.error("PROBE_RESULT=FAIL "+fail); process.exit(1); }
console.log("PROBE_RESULT=OK");
`;

const r = await withSandbox(async (sbx) => {
  // 1. Sanity del contenedor
  const hello = await sbx.commands.run("echo 'Hello Sandbox!' && node --version");
  const h = fmtExecution(hello);
  console.log("=== Paso 1: conexión ===");
  console.log(h.out);
  if (h.err) console.error(h.err);

  // 2. Escribir probe dentro del contenedor y ejecutarlo ahí
  await sbx.files.writeFiles([{ path: "/tmp/probe-trig.mjs", data: PROBE_CODE, mode: 644 }]);
  const exec = await sbx.commands.run("node /tmp/probe-trig.mjs");
  const { out, err } = fmtExecution(exec);
  console.log("=== Paso 2: trigSummary en sandbox (node:20-slim) ===");
  console.log(out);
  if (err) console.error("[stderr]\n" + err);
  return { out, err };
}).catch((e) => {
  console.error("[probe] ERROR:", e?.message ?? e);
  if (e?.error) console.error(`code=${e.error.code} requestId=${e.requestId ?? "N/A"}`);
  process.exit(1);
});
console.log("\\nListo. Resultado arriba = ejecutado DENTRO de Docker, no en Windows.");
