// Genera public/og-image.png, la imagen que sale al compartir el enlace.
//
//   node scripts/make-og-image.mjs
//
// Se ejecuta a mano y el resultado se guarda en el repositorio: no hace falta
// tener Chrome en el servidor de despliegue. El tablero es uno real del
// generador (semilla 20260827), con su solución puesta.
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CANDIDATOS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const CHROME = CANDIDATOS.find((ruta) => existsSync(ruta));
if (!CHROME) {
  console.error("No encuentro Chrome. Indica la ruta con CHROME_PATH.");
  process.exit(1);
}

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REGIONS = [0,0,0,0,1,1,2,2,0,0,0,3,3,1,1,2,4,4,0,0,3,3,3,3,4,4,0,0,5,3,3,6,4,7,0,5,5,5,3,6,4,7,7,5,7,5,5,6,4,4,7,7,7,5,5,6,4,4,4,7,5,5,6,6];
const SOLUTION = [4,7,2,5,1,3,0,6];
const COLORES = ["#f5ab72","#9cc7f2","#cdebac","#c4a2ea","#7fd39a","#fbdb6e","#86dae5","#ef9a9a"];

const celdas = REGIONS.map((region, i) => {
  const fila = Math.floor(i / 8);
  const col = i % 8;
  const corona = SOLUTION[fila] === col;
  const borde = (a, b) => (a !== b ? "3px solid #2a2a32" : "1px solid rgba(0,0,0,.08)");
  const estilo = [
    `background:${COLORES[region]}`,
    `border-top:${borde(region, fila > 0 ? REGIONS[i - 8] : -1)}`,
    `border-bottom:${borde(region, fila < 7 ? REGIONS[i + 8] : -1)}`,
    `border-left:${borde(region, col > 0 ? REGIONS[i - 1] : -1)}`,
    `border-right:${borde(region, col < 7 ? REGIONS[i + 1] : -1)}`,
  ].join(";");
  return `<div style="${estilo}">${corona ? "<svg viewBox='0 0 24 24' fill='#1a1a20'><path d='M2.6 7.7c.8-.5 1.8-.2 2.2.6l2 3.6 3.5-6.1c.3-.6.9-.9 1.5-.9h.4c.6 0 1.2.3 1.5.9l3.5 6.1 2-3.6c.4-.8 1.4-1.1 2.2-.6.7.4 1 1.3.7 2.1l-2.9 8.1c-.2.6-.8 1-1.4 1H6.2c-.6 0-1.2-.4-1.4-1L1.9 9.8c-.3-.8 0-1.7.7-2.1z'/><rect x='5' y='19.6' width='14' height='2.2' rx='1.1'/></svg>" : ""}</div>`;
}).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; display: flex; align-items: center; gap: 56px;
    padding: 0 70px; font-family: "Segoe UI", system-ui, sans-serif; color: #1a1a20;
    background: radial-gradient(900px 500px at 25% -10%, #eceaf6, transparent 70%), #f4f3ef; }
  .grid { display: grid; grid-template-columns: repeat(8, 56px); grid-auto-rows: 56px;
    border: 4px solid #2a2a32; border-radius: 14px; overflow: hidden;
    box-shadow: 0 24px 50px rgba(20,20,40,.18); flex: none; }
  .grid div { display: grid; place-items: center; }
  .grid svg { width: 60%; height: 60%; }
  h1 { font-size: 82px; letter-spacing: -.04em; line-height: 1; }
  p { font-size: 30px; color: #4a4a55; margin-top: 18px; line-height: 1.35; }
  .tags { display: flex; gap: 10px; margin-top: 26px; }
  .tags span { font-size: 21px; padding: 7px 18px; border-radius: 999px;
    background: rgba(109,84,240,.12); color: #6d54f0; font-weight: 600; }
  .url { margin-top: 34px; font-size: 24px; color: #74747f; }
</style></head><body>
  <div class="grid">${celdas}</div>
  <div>
    <h1>Crowns</h1>
    <p>One crown per row, column and colour.<br>A new puzzle every day.</p>
    <div class="tags"><span>Star Battle</span><span>Queens</span><span>Free</span></div>
    <div class="url">crowns.softie.dev</div>
  </div>
</body></html>`;

const temporal = resolve(raiz, "og-temp.html");
writeFileSync(temporal, html);

const puerto = 9461;
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${puerto}`,
  "--user-data-dir=" + (process.env.TEMP ?? "/tmp") + "/crowns-og",
  "--no-first-run", "--window-size=1200,630",
  "file:///" + temporal.replace(/\\/g, "/"),
]);

try {
  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
      page = lista.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    } catch { /* arrancando */ }
    if (!page) await sleep(250);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
  let id = 1;
  const pendientes = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pendientes.has(m.id)) (pendientes.get(m.id)(m), pendientes.delete(m.id));
  };
  const enviar = (method, params = {}) => {
    const n = id++;
    ws.send(JSON.stringify({ id: n, method, params }));
    return new Promise((r) => pendientes.set(n, r));
  };
  // El viewport de headless no coincide con --window-size: lo fijamos a mano
  // para que la captura salga exactamente a 1200×630.
  await enviar("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(1200);
  const foto = await enviar("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
  });
  const destino = resolve(raiz, "public", "og-image.png");
  writeFileSync(destino, Buffer.from(foto.result.data, "base64"));
  console.log("public/og-image.png generada (1200×630)");
  ws.close();
} finally {
  chrome.kill();
  const { unlinkSync } = await import("node:fs");
  unlinkSync(temporal);
}
