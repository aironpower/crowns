// GitHub Pages no sabe de rutas de SPA. Dos medidas:
//
// 1. `404.html` es una copia de `index.html`: cualquier ruta desconocida sigue
//    cargando la aplicación en vez de un error, y la URL se mantiene.
// 2. Para las rutas que sí conocemos generamos además `<ruta>/index.html`, de
//    modo que respondan con 200 y no con 404. Importa para el buscador y para
//    quien comprueba la URL de la política de privacidad (Google la revisa al
//    aprobar la pantalla de consentimiento de OAuth).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROUTES = ["privacy", "terms", "community", "history", "profile", "auth"];

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const index = resolve(dist, "index.html");

if (!existsSync(index)) {
  console.error("No hay dist/index.html: ejecuta el build antes.");
  process.exit(1);
}

copyFileSync(index, resolve(dist, "404.html"));
for (const route of ROUTES) {
  const folder = resolve(dist, route);
  mkdirSync(folder, { recursive: true });
  copyFileSync(index, resolve(folder, "index.html"));
}

console.log(`dist/404.html y ${ROUTES.length} rutas con index.html propio: ${ROUTES.join(", ")}`);
