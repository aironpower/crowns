// Prueba de humo: arranca Chrome headless contra la app compilada y la maneja
// por el protocolo de DevTools (sin dependencias extra).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/** Lee la URL del proyecto de .env.local para comprobar los proveedores. */
function readSupabaseUrl() {
  for (const file of [".env.local", ".env"]) {
    try {
      const match = /VITE_SUPABASE_URL\s*=\s*(.+)/.exec(readFileSync(file, "utf8"));
      if (match) return match[1].trim();
    } catch {}
  }
  return "";
}
import { setTimeout as sleep } from "node:timers/promises";

// Ruta de Chrome/Edge: se puede forzar con la variable CHROME_PATH.
const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const CHROME = CANDIDATES.find((path) => existsSync(path));
if (!CHROME) {
  console.error("No se encontró Chrome. Indica la ruta con CHROME_PATH.");
  process.exit(1);
}
const URL_APP = process.argv[2] ?? "http://localhost:4173/";
const PORT = 9333;

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=" + process.env.TEMP + "\\crowns-smoke-profile",
  "--no-first-run",
  "--window-size=800,1100",
  // CHROME_EXTRA_ARGS permite probar un despliegue antes de que propague el DNS:
  //   CHROME_EXTRA_ARGS='--host-resolver-rules=MAP midominio 185.199.108.153'
  ...(process.env.CHROME_EXTRA_ARGS ? process.env.CHROME_EXTRA_ARGS.split("|") : []),
  URL_APP,
]);

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      /* aún arrancando */
    }
    await sleep(250);
  }
  throw new Error("Chrome no respondió");
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.result?.exceptionDetails) {
    throw new Error(res.result.exceptionDetails.exception?.description ?? "error en la página");
  }
  return res.result.result.value;
}

const SCRIPT = `(async () => {
  window.__SUPABASE_URL__ = JSON.parse(localStorage.getItem("crowns.e2eSupabaseUrl") ?? '""');
  const log = [];
  const ok = (cond, msg) => log.push((cond ? "PASS " : "FAIL ") + msg);
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const wait = async (fn, ms = 12000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (fn()) return true; await new Promise(r => setTimeout(r, 100)); }
    return false;
  };
  const click = (el, button = 0) => {
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, button, buttons: button === 2 ? 2 : 1,
                pointerId: 1, isPrimary: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new PointerEvent("pointerdown", o));
    el.dispatchEvent(new PointerEvent("pointerup", { ...o, buttons: 0 }));
  };

  ok(document.documentElement.lang === "es", "arranca en el idioma guardado (es)");
  ok(await wait(() => $$(".cell").length > 0), "el tablero se genera al cargar");
  const cells = $$(".cell");
  const n = Math.round(Math.sqrt(cells.length));
  ok(n === 8, "tablero 8x8 por defecto (n=" + n + ")");
  const hasSupabase = !$(".banner");
  ok(true, hasSupabase ? "(build con Supabase configurado)" : "avisa de que Supabase no está configurado");
  ok(new Set(cells.map(c => c.style.getPropertyValue("--region-l"))).size === n, "hay " + n + " colores de región");

  // preferencias: nacen desactivadas y sobreviven a recargar
  const casillas = () => $$(".switches input[type=checkbox]");
  ok(casillas().length === 2, "hay dos interruptores de preferencias");
  ok(casillas().every(c => !c.checked), "las dos opciones empiezan desactivadas");
  casillas()[0].click();
  await new Promise(r => setTimeout(r, 200));
  ok(casillas()[0].checked, "se puede activar 'marcar ✕ automáticas'");
  const guardado = JSON.parse(localStorage.getItem("crowns.settings") || "{}");
  ok(guardado.autoMark === true, "la preferencia se guarda en el navegador");
  casillas()[0].click();
  await new Promise(r => setTimeout(r, 200));

  // ciclo de estados
  const hasCrown = (el) => !!el.querySelector(".crown");
  const hasMark = (el) => !!el.querySelector(".mark");
  const target = cells[0];
  click(target); await wait(() => hasMark(target), 2000);
  ok(hasMark(target), "un clic marca ✕");
  click(target); await wait(() => hasCrown(target), 2000);
  ok(hasCrown(target), "dos clics ponen corona");
  click(target); await wait(() => !hasCrown(target) && !hasMark(target), 2000);
  ok(!hasCrown(target) && !hasMark(target), "tres clics dejan la casilla vacía");

  // clic derecho
  click(target, 2); await wait(() => hasCrown(target), 2000);
  ok(hasCrown(target), "clic derecho pone corona directamente");

  // el cronómetro corre
  const t1 = $(".stat b").textContent;
  await new Promise(r => setTimeout(r, 1400));
  ok($(".stat b").textContent !== t1 || t1 !== "0:00", "el cronómetro avanza tras la primera jugada");

  // deshacer y limpiar
  const undoBtn = $$("button").find(b => /Deshacer|Undo/i.test(b.textContent));
  undoBtn.click(); await new Promise(r => setTimeout(r, 150));
  ok(!hasCrown($$(".cell")[0]), "deshacer revierte la jugada");
  const clearBtn = $$("button").find(b => /Limpiar|Clear/i.test(b.textContent));
  clearBtn.click(); await new Promise(r => setTimeout(r, 150));
  ok($$(".cell").every(c => !c.querySelector(".glyph")), "limpiar vacía el tablero");

  // resolver: calculamos la solución aparte, leyendo las regiones del DOM
  const regionKey = {}, regions = [];
  $$(".cell").forEach((c, i) => {
    const k = c.style.getPropertyValue("--region-l");
    if (!(k in regionKey)) regionKey[k] = Object.keys(regionKey).length;
    regions[i] = regionKey[k];
  });
  const pos = [];
  const solveIt = (r, cu, ru, prev) => {
    if (r === n) return true;
    for (let c = 0; c < n; c++) {
      if (cu & (1 << c)) continue;
      if (Math.abs(c - prev) <= 1) continue;
      const g = regions[r * n + c];
      if (ru & (1 << g)) continue;
      pos[r] = c;
      if (solveIt(r + 1, cu | (1 << c), ru | (1 << g), c)) return true;
    }
    return false;
  };
  ok(solveIt(0, 0, 0, -3), "el tablero mostrado tiene solución");

  for (let r = 0; r < n; r++) {
    const cell = $$(".cell")[r * n + pos[r]];
    click(cell);
    await wait(() => { const el = $$(".cell")[r * n + pos[r]]; return el.querySelector(".mark") || el.querySelector(".crown"); }, 2000);
    if (!$$(".cell")[r * n + pos[r]].querySelector(".crown")) {
      click($$(".cell")[r * n + pos[r]]);
      await wait(() => $$(".cell")[r * n + pos[r]].querySelector(".crown"), 2000);
    }
  }
  ok(await wait(() => !!$(".win-overlay"), 4000), "se detecta la victoria");
  ok(!$$(".cell").some(c => c.classList.contains("conflict")), "la solución no tiene conflictos");
  const winText = $(".win-card")?.textContent ?? "";
  ok(/8×8/.test(winText), "el resumen muestra el tamaño: " + winText.slice(0, 60));
  ok(/navegador|browser/i.test(winText), "avisa de que se guardó en local (invitado)");

  // compartir
  const btnCompartir = $$(".win-actions button").find(b => /compartir|share|partager|teilen|partilhar/i.test(b.textContent));
  ok(!!btnCompartir, "el diálogo de victoria ofrece compartir");
  btnCompartir.click();
  await new Promise(r => setTimeout(r, 900));
  const campo = $(".share-box textarea");
  ok(!!campo, "aparece la tarjeta de resultado");
  const tarjeta = campo?.value ?? "";
  ok(tarjeta.includes("Crowns"), "la tarjeta se identifica");
  ok(/[0-9]:[0-9][0-9]/.test(tarjeta), "lleva el tiempo");
  ok(tarjeta.includes("?board=") || tarjeta.includes("?daily="), "y el enlace al mismo tablero");
  ok(tarjeta.split(String.fromCharCode(10)).length <= 4, "cabe en un mensaje corto");

  // navegación entre secciones
  const go = async (name) => {
    const link = $$(".tabs a").find(a => new RegExp(name, "i").test(a.textContent));
    link.click();
    await new Promise(r => setTimeout(r, 400));
  };
  await go("Historial");
  ok(/Historial/i.test($("main").textContent), "la pestaña Historial carga");
  ok($$("table tbody tr").length >= 1, "la partida recién jugada aparece en el historial");
  // archivo de puzles del día: resolvemos el de hoy y debe quedar marcado
  await go("Historial");
  ok(await wait(() => $$(".daily-list li").length >= 14, 15000), "el archivo lista los últimos 14 días (" + $$(".daily-list li").length + ")");
  const hoy = $$(".daily-list li")[0];
  ok(/Hoy/i.test(hoy?.innerText ?? ""), "el primero del archivo es hoy");
  const sinResolver = (hoy?.innerText ?? "");
  ok(/sin resolver|unsolved|ungelöst|non résolue|por resolver|sense resoldre/i.test(sinResolver), "hoy figura sin resolver");

  $$(".daily-list li a")[0].click();
  await new Promise(r => setTimeout(r, 1500));
  ok(await wait(() => $$(".cell").length > 0, 12000), "se abre el tablero del día");
  const esDiario = $$(".mode-switch button").some(b => b.classList.contains("active") && /día|day|jour|dia|tages/i.test(b.textContent));
  ok(esDiario, "se abre en modo diario");

  {
    const cs = $$(".cell"), m = Math.round(Math.sqrt(cs.length));
    const key = {}, reg = [];
    cs.forEach((c, i) => { const k = c.style.getPropertyValue("--region-l"); if (!(k in key)) key[k] = Object.keys(key).length; reg[i] = key[k]; });
    const p2 = [];
    const bt2 = (r, cu, ru, prev) => { if (r === m) return true;
      for (let c = 0; c < m; c++) { if (cu & (1 << c)) continue; if (Math.abs(c - prev) <= 1) continue;
        const g = reg[r * m + c]; if (ru & (1 << g)) continue; p2[r] = c; if (bt2(r + 1, cu | (1 << c), ru | (1 << g), c)) return true; } return false; };
    bt2(0, 0, 0, -3);
    for (let r = 0; r < m; r++) {
      const cell = $$(".cell")[r * m + p2[r]];
      click(cell); await new Promise(x => setTimeout(x, 60));
      if (!$$(".cell")[r * m + p2[r]].querySelector(".crown")) { click($$(".cell")[r * m + p2[r]]); await new Promise(x => setTimeout(x, 60)); }
    }
  }
  ok(await wait(() => !!$(".win-overlay"), 4000), "se resuelve el puzle del día");

  await go("Historial");
  await new Promise(r => setTimeout(r, 2500));
  const hoy2 = $$(".daily-list li")[0];
  ok(hoy2?.classList.contains("done"), "el archivo marca el día de hoy como resuelto");
  const textoHoy = (hoy2?.innerText ?? "").split(String.fromCharCode(10)).join(" | ");
  ok(/[0-9]:[0-9][0-9]/.test(textoHoy), "y guarda el tiempo del diario [" + textoHoy.slice(0, 60) + "]");

  await go("Comunidad");
  ok(/Comunidad/i.test($("main").textContent), "la pestaña Comunidad carga");
  await new Promise(r => setTimeout(r, 2500));
  const titulos = $$("main section h2").map(h => h.textContent.trim());
  ok(titulos.some(x => /temporada|season|época|saison/i.test(x)), "hay clasificación de la temporada: " + titulos.join(" · "));
  ok(!$(".skeleton-row"), "no se queda ningún bloque cargando");
  ok(!/algo ha ido mal|something went wrong/i.test($("main").textContent), "la comunidad carga sin errores");
  await go("Entrar");
  const configured = !!$(".auth");
  if (configured) {
    ok($$("input[type=email]").length === 1, "la pantalla de acceso muestra el formulario");
    ok($$("input[type=password]").length === 1, "pide contraseña");
    // los botones sociales solo deben salir si el proveedor está activado en Supabase
    await wait(() => true, 1200);
    await new Promise(r => setTimeout(r, 1500));
    for (const provider of ["google", "github"]) {
      const res = await fetch(window.__SUPABASE_URL__ + "/auth/v1/authorize?provider=" + provider, { redirect: "manual" });
      const enabled = res.type === "opaqueredirect" || res.status === 0;
      const shown = $$("button").some(b => new RegExp(provider, "i").test(b.textContent));
      ok(shown === enabled, "botón de " + provider + (shown ? " visible" : " oculto") + " y proveedor " + (enabled ? "activado" : "no activado"));
    }
    ok($$("button").some(b => /enlace/i.test(b.textContent)), "hay botón de magic link");
    ok($$("button").some(b => /invitado/i.test(b.textContent)), "se puede seguir como invitado");
  } else {
    ok(/Supabase/i.test($("main").textContent), "sin Supabase, la pantalla de acceso explica por qué");
    ok($$("input").length === 0, "sin Supabase no se muestra el formulario de acceso");
  }

  // perfil (como invitado)
  history.pushState({}, "", "/profile");
  window.dispatchEvent(new PopStateEvent("popstate"));
  await new Promise(r => setTimeout(r, 700));
  ok(!!$(".identicon"), "el perfil muestra el avatar generado");
  ok($$(".stat-tile").length >= 4, "el perfil muestra las estadísticas (" + $$(".stat-tile").length + " fichas)");
  ok(/invitado/i.test($("main").textContent), "el perfil de invitado avisa de que no hay cuenta");
  ok($$(".feed li").length >= 1, "el perfil lista la partida recién jugada");
  history.pushState({}, "", "/auth");
  window.dispatchEvent(new PopStateEvent("popstate"));
  await new Promise(r => setTimeout(r, 500));

  // duelo en directo (con una sola pestaña: el panel y uno mismo)
  history.pushState({}, "", "/?duel=E2ETEST");
  window.dispatchEvent(new PopStateEvent("popstate"));
  await new Promise(r => setTimeout(r, 3500));
  ok(!!$(".live-list"), "con ?duel= aparece el panel del duelo");
  ok($$(".live-list li").length >= 1, "y te lista a ti mismo");
  ok(/E2ETEST/.test($(".live")?.innerText ?? ""), "muestra el código de la sala");
  history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
  await new Promise(r => setTimeout(r, 600));

  // páginas legales
  const legalLinks = $$(".legal-links a");
  ok(legalLinks.length === 3, "el pie enlaza guía, privacidad y condiciones (" + legalLinks.length + ")");
  ok(/how-to-play|como-jugar/.test(legalLinks[0].getAttribute("href") ?? ""), "y la guía es una página propia");
  legalLinks.find(a => /privacidad|privacy/i.test(a.textContent)).click();
  await new Promise(r => setTimeout(r, 600));
  ok(location.pathname === "/privacy", "el enlace lleva a /privacy");
  const privacyText = $(".legal")?.innerText ?? "";
  ok(/privacidad/i.test(privacyText), "la política se muestra en el idioma activo");
  ok(!/\{[a-z]+\}/i.test(privacyText), "no queda ningún marcador sin sustituir");
  ok($$(".legal h2").length >= 8, "la política tiene todas las secciones (" + $$(".legal h2").length + ")");
  $$(".legal-footer a").find(a => /condiciones/i.test(a.textContent))?.click();
  await new Promise(r => setTimeout(r, 600));
  ok(location.pathname === "/terms", "desde privacidad se llega a las condiciones");
  ok(/condiciones/i.test($(".legal")?.innerText ?? ""), "las condiciones se muestran");

  // firma del pie
  // ojo: en producción los enlaces legales son crowns.softie.dev, así que
  // comparamos el dominio exacto y no una subcadena
  const autor = $$(".site-footer a").find(a => { try { return new URL(a.href).hostname === "softie.dev"; } catch { return false; } });
  ok(!!autor, "el pie enlaza a softie.dev");
  ok(/Softie Development/i.test(autor?.textContent ?? ""), "y lo firma Softie Development");

  const donar = $(".donate-link");
  ok(!!donar, "el pie ofrece donar");
  ok(!!donar && donar.href.includes("github.com/sponsors/"), "y apunta a GitHub Sponsors: " + (donar?.getAttribute("href") ?? ""));

  // cambio de idioma: icono de la bola del mundo (sin sesión)
  ok($$("header select").length === 0, "la cabecera ya no lleva el desplegable de idioma");
  const globo = $(".language-menu .icon-button");
  ok(!!globo, "hay icono de idioma en la cabecera");
  globo.click();
  await new Promise(r => setTimeout(r, 250));
  const opciones = $$(".language-list button").map(b => b.textContent.trim());
  ok(opciones.length === 6, "el menú ofrece los seis idiomas");
  ok(opciones.join(",") === "Català,Deutsch,English,Español,Français,Português", "en orden alfabético: " + opciones.join(", "));
  $$(".language-list button").find(b => b.textContent.trim() === "English").click();
  await new Promise(r => setTimeout(r, 400));
  ok(!$(".language-list"), "el menú se cierra al elegir");
  ok(/Sign in|Your account/i.test($("main").textContent), "la interfaz cambia a inglés");
  ok(document.documentElement.lang === "en", "el atributo lang del documento se actualiza");

  await go("Play");
  ok(await wait(() => $$(".cell").length > 0, 12000), "vuelve al tablero tras navegar");

  return log.join("\\n");
})()`;

try {
  await send("Runtime.enable");

  // Con un sitio remoto la primera navegación tarda: hasta que no ha cargado, el
  // documento sigue siendo about:blank y hasta localStorage está prohibido.
  let ready = false;
  for (let i = 0; i < 80 && !ready; i++) {
    const href = await evaluate("location.href").catch(() => "");
    ready = typeof href === "string" && href.startsWith(URL_APP.slice(0, URL_APP.indexOf("/", 8)));
    if (!ready) await sleep(250);
  }
  if (!ready) throw new Error("la página no cargó: " + URL_APP);
  // el idioma se autodetecta del navegador; para la prueba lo fijamos en español
  await evaluate(`(async () => {
    localStorage.clear();
    localStorage.setItem("crowns.locale", JSON.stringify("es").slice(1, -1));
    localStorage.setItem("crowns.e2eSupabaseUrl", ${JSON.stringify(JSON.stringify(process.env.SUPABASE_URL ?? readSupabaseUrl()))});
    location.reload();
    return 1;
  })()`);
  await sleep(2500);
  const report = await evaluate(SCRIPT);
  console.log(report);
  const fails = (report.match(/FAIL/g) ?? []).length;
  console.log(`\n=> ${fails} fallos`);
  process.exitCode = fails ? 1 : 0;
} catch (error) {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
}
