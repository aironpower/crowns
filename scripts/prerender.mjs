// Prepara `dist` para los buscadores. Se ejecuta después de `vite build`.
//
//   1. Cada ruta conocida recibe su propia carpeta con index.html, para que
//      responda 200 en vez del 404 con el que GitHub Pages sirve una SPA.
//   2. Ese HTML lleva título, descripción, canónica, Open Graph y datos
//      estructurados propios: antes todas las rutas compartían <title>Crowns</title>.
//   3. Las páginas de contenido (cómo jugar) se generan como HTML estático, sin
//      depender del bundle: es lo único que un rastreador lee sin ejecutar nada.
//   4. robots.txt y sitemap.xml.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT, ROUTES, SITE } from "./seo-pages.mjs";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const indexPath = resolve(dist, "index.html");

if (!existsSync(indexPath)) {
  console.error("No hay dist/index.html: ejecuta el build antes.");
  process.exit(1);
}

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Etiquetas comunes a cualquier página. */
function head(route) {
  const url = SITE.origin + route.path;
  const image = SITE.origin + SITE.image;
  return `    <title>${escape(route.title)}</title>
    <meta name="description" content="${escape(route.description)}" />
    <link rel="canonical" href="${url}" />
    ${route.noindex ? '<meta name="robots" content="noindex, follow" />' : '<meta name="robots" content="index, follow" />'}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${escape(route.title)}" />
    <meta property="og:description" content="${escape(route.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(route.title)}" />
    <meta name="twitter:description" content="${escape(route.description)}" />
    <meta name="twitter:image" content="${image}" />`;
}

/** Ficha del juego para los buscadores. */
const gameSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Crowns",
  alternateName: ["Star Battle", "Queens puzzle"],
  url: SITE.origin,
  image: SITE.origin + SITE.image,
  description:
    "Daily logic puzzle: one crown per row, column and colour region, with no two crowns touching. Also known as Star Battle or Queens.",
  genre: ["Puzzle", "Logic"],
  playMode: "SinglePlayer",
  applicationCategory: "Game",
  operatingSystem: "Web browser",
  inLanguage: ["en", "es", "ca", "pt", "fr", "de"],
  author: { "@type": "Organization", name: SITE.author, url: SITE.authorUrl },
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
});

/** Preguntas frecuentes: es lo que Google puede enseñar desplegado. */
const faqSchema = (lang) =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity:
      lang === "es"
        ? [
            {
              "@type": "Question",
              name: "¿Cuáles son las reglas de Crowns?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Una corona en cada fila, en cada columna y en cada región de color, y dos coronas no pueden tocarse ni en diagonal.",
              },
            },
            {
              "@type": "Question",
              name: "¿Es lo mismo que Star Battle o que Queens?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sí. Star Battle es el nombre clásico de los pasatiempos y Queens el que le puso LinkedIn; la variante de una estrella por región es este mismo juego.",
              },
            },
            {
              "@type": "Question",
              name: "¿Hace falta adivinar para resolverlo?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Cada tablero se genera comprobando que tenga una única solución, de modo que siempre se llega razonando.",
              },
            },
          ]
        : [
            {
              "@type": "Question",
              name: "What are the rules of Crowns?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "One crown per row, per column and per colour region, and no two crowns may touch, not even diagonally.",
              },
            },
            {
              "@type": "Question",
              name: "Is it the same as Star Battle or Queens?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Star Battle is the classic puzzle-magazine name and Queens is what LinkedIn called it; the one-star-per-region variant is this same game.",
              },
            },
            {
              "@type": "Question",
              name: "Do I ever have to guess?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Every board is generated and checked to have exactly one solution, so it can always be reached by deduction.",
              },
            },
          ],
  });

// ------------------------------------------------- rutas de la aplicación
const shell = readFileSync(indexPath, "utf8");

function appPage(route) {
  const extra = route.path === "/" ? `\n    <script type="application/ld+json">${gameSchema}</script>` : "";
  return shell
    .replace(/<html lang="[^"]*">/, `<html lang="${route.lang}">`)
    .replace(/<title>[^<]*<\/title>/, "@@HEAD@@")
    .replace(/\s*<meta name="description"[^>]*>/, "")
    .replace("@@HEAD@@", head(route) + extra);
}

// La portada también se reescribe: es la que más importa.
writeFileSync(indexPath, appPage(ROUTES[0]));
writeFileSync(resolve(dist, "404.html"), appPage(ROUTES[0]));

for (const route of ROUTES.slice(1)) {
  if (CONTENT[route.path]) continue; // esas se generan aparte, estáticas
  const folder = resolve(dist, route.path.replace(/^\/|\/$/g, ""));
  mkdirSync(folder, { recursive: true });
  writeFileSync(resolve(folder, "index.html"), appPage(route));
}

// ---------------------------------------------- páginas de contenido
const assets = [...shell.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);

function contentPage(route) {
  const page = CONTENT[route.path];
  const alternate = ROUTES.find((r) => r.path === page.alternate);
  const secciones = page.sections
    .map((s) => `      <section>\n        <h2>${s.h}</h2>\n        ${s.html}\n      </section>`)
    .join("\n");

  return `<!doctype html>
<html lang="${route.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#7a5cff" />
${head(route)}
    <link rel="alternate" hreflang="${route.lang}" href="${SITE.origin}${route.path}" />
    <link rel="alternate" hreflang="${alternate.lang}" href="${SITE.origin}${alternate.path}" />
    <link rel="alternate" hreflang="x-default" href="${SITE.origin}${ROUTES[0].path}" />
    <link rel="icon" href="/favicon.svg" />
${assets.map((href) => `    <link rel="stylesheet" href="${href}" />`).join("\n")}
    <script type="application/ld+json">${gameSchema}</script>
    <script type="application/ld+json">${faqSchema(route.lang)}</script>
  </head>
  <body>
    <div class="app">
      <header class="site-header">
        <a class="brand" href="/">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8.5l3.6 3L12 4l5.4 7.5 3.6-3-1.7 9.2H4.7L3 8.5zM4.9 20h14.2v1.6H4.9V20z"/></svg>
          <div><strong>Crowns</strong><span>${escape(page.tagline)}</span></div>
        </a>
        <nav class="tabs"><a href="/">${page.cta}</a></nav>
      </header>

      <article class="panel stack legal">
        <h1>${page.heading}</h1>
        <p class="muted">${page.intro}</p>
${secciones}
        <p><a class="button primary" href="/">${page.cta}</a></p>
        <p class="muted small">
          <a href="${alternate.path}" hreflang="${alternate.lang}">${alternate.title}</a>
        </p>
      </article>

      <footer class="site-footer">
        <p><a href="/">Crowns</a> · <a href="/privacy/">Privacidad</a> · <a href="/terms/">Condiciones</a></p>
        <p>Hecho por <a href="${SITE.authorUrl}">${SITE.author}</a></p>
      </footer>
    </div>
  </body>
</html>
`;
}

for (const route of ROUTES) {
  if (!CONTENT[route.path]) continue;
  const folder = resolve(dist, route.path.replace(/^\/|\/$/g, ""));
  mkdirSync(folder, { recursive: true });
  writeFileSync(resolve(folder, "index.html"), contentPage(route));
}

// ------------------------------------------------------ robots y sitemap
writeFileSync(
  resolve(dist, "robots.txt"),
  `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /profile/
Disallow: /history/

Sitemap: ${SITE.origin}/sitemap.xml
`,
);

const hoy = new Date().toISOString().slice(0, 10);
const urls = ROUTES.filter((r) => !r.noindex)
  .map(
    (r) => `  <url>
    <loc>${SITE.origin}${r.path}</loc>
    <lastmod>${hoy}</lastmod>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join("\n");

writeFileSync(
  resolve(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);

// El icono como archivo, para que lo pueda usar también el HTML estático.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="26">👑</text></svg>`;
writeFileSync(resolve(dist, "favicon.svg"), favicon);

if (existsSync(resolve(dist, "og-image.png"))) {
  console.log("og-image.png incluida");
} else {
  console.warn("¡falta public/og-image.png! Las tarjetas sociales saldrán sin imagen.");
}

console.log(
  `SEO listo: ${ROUTES.length} rutas con metadatos propios, ${Object.keys(CONTENT).length} páginas de contenido, robots.txt y sitemap.xml`,
);

// El 404 sigue sirviendo la aplicación para que las rutas desconocidas carguen.
copyFileSync(indexPath, resolve(dist, "404.html"));
