// GitHub Pages no sabe de rutas de SPA: si alguien entra directo a /community
// devuelve un 404. Sirviendo el mismo index.html como 404.html, el router de la
// aplicación se encarga y la URL se mantiene.
import { copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const index = resolve(dist, "index.html");
if (!existsSync(index)) {
  console.error("No hay dist/index.html: ejecuta el build antes.");
  process.exit(1);
}
copyFileSync(index, resolve(dist, "404.html"));
console.log("dist/404.html listo (fallback de rutas para GitHub Pages)");
