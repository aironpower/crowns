// Comprueba que el proyecto de Supabase está listo:
//   npm run check
// Lee .env.local, llama al proyecto con la anon key y verifica que la migración
// está aplicada (tablas, vistas y la función submit_play).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match) env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = readEnv();
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url) fail("Falta VITE_SUPABASE_URL en .env.local");
if (!key) fail("Falta VITE_SUPABASE_ANON_KEY en .env.local (panel → Project Settings → API Keys → anon/public)");

function fail(message) {
  console.error("✗ " + message);
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const results = [];
const check = (ok, label, detail = "") => {
  results.push({ ok, label, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
};

async function get(path) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers });
  const body = await response.text();
  return { status: response.status, body };
}

console.log(`Proyecto: ${url}\n`);

// 1. ¿responde y la clave vale?
const auth = await fetch(`${url}/auth/v1/health`, { headers });
check(auth.ok, "el proyecto responde y la anon key es válida", auth.ok ? "" : `HTTP ${auth.status}`);
if (!auth.ok) {
  console.error("\nRevisa que la clave sea la anon/public de ESTE proyecto.");
  process.exit(1);
}

// 2. tablas y vistas de la migración
for (const relation of [
  "profiles",
  "puzzles",
  "plays",
  "recent_activity",
  "daily_leaderboard",
  "leaderboard_by_size",
  "player_stats",
]) {
  const { status, body } = await get(`${relation}?select=*&limit=1`);
  const missing = status === 404 || /does not exist|Could not find the table/i.test(body);
  check(!missing && status < 500, `${relation}`, missing ? "no existe: falta ejecutar la migración" : `HTTP ${status}`);
}

// 3. la función submit_play existe y rechaza a quien no ha iniciado sesión
const rpc = await fetch(`${url}/rest/v1/rpc/submit_play`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    p_size: 5,
    p_regions: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    p_solution: [0, 2, 4, 1, 3],
    p_duration_ms: 60000,
  }),
});
const rpcBody = await rpc.text();
const exists = !/Could not find the function|does not exist/i.test(rpcBody);
check(exists && /AUTH_REQUIRED/.test(rpcBody), "submit_play existe y exige sesión", exists ? "" : "falta la migración");

// 4. proveedores de acceso social
console.log("");
const callback = `${url}/auth/v1/callback`;
for (const provider of ["google", "github"]) {
  const response = await fetch(`${url}/auth/v1/authorize?provider=${provider}`, { redirect: "manual" });
  // 302 = configurado (redirige al proveedor); 400 = no activado en el panel
  const enabled = response.status === 302 || response.status === 0 || response.type === "opaqueredirect";
  console.log(
    `${enabled ? "✓" : "○"} acceso con ${provider}${enabled ? " activado" : " NO activado (el botón no se muestra)"}`,
  );
}
console.log(`  URL de retorno para Google/GitHub: ${callback}`);

const failed = results.filter((r) => !r.ok).length;
console.log(
  failed
    ? `\n=> ${failed} problema(s). Pega supabase/migrations/0001_init.sql en el SQL Editor y vuelve a intentarlo.`
    : "\n=> Todo listo: arranca con `npm run dev`.",
);
process.exit(failed ? 1 : 0);
