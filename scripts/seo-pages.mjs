// Metadatos y contenido de las páginas que puede indexar un buscador.
//
// El juego es una aplicación de una sola página: lo que llega en el HTML inicial
// es un <div> vacío. Los rastreadores ejecutan JavaScript, pero lo hacen tarde y
// con menos ganas, así que las páginas de contenido se generan aquí como HTML de
// verdad, sin depender del bundle.

export const SITE = {
  origin: "https://crowns.softie.dev",
  name: "Crowns",
  author: "Softie Development",
  authorUrl: "https://softie.dev",
  image: "/og-image.png",
};

/**
 * Rutas de la aplicación. `noindex` para lo que es personal o no aporta nada a
 * un buscador; el resto entra en el sitemap.
 */
export const ROUTES = [
  {
    path: "/",
    lang: "en",
    title: "Crowns — daily Star Battle puzzle",
    description:
      "Place one crown per row, column and colour region, never touching. A new puzzle every day, free and without ads. Known elsewhere as Queens or Star Battle.",
    priority: "1.0",
  },
  {
    path: "/how-to-play/",
    lang: "en",
    title: "How to play Crowns — Star Battle and Queens rules",
    description:
      "The three rules of Crowns, the solving techniques that get you started, and how the puzzle relates to Star Battle and to LinkedIn's Queens.",
    priority: "0.9",
  },
  {
    path: "/como-jugar/",
    lang: "es",
    title: "Cómo jugar a Crowns — reglas del Star Battle",
    description:
      "Las tres reglas de Crowns, las técnicas para empezar a resolverlo y en qué se parece al Star Battle de toda la vida y al Queens de LinkedIn.",
    priority: "0.9",
  },
  {
    path: "/community/",
    lang: "en",
    title: "Leaderboards — Crowns",
    description:
      "Today's daily puzzle ranking, the monthly season and the best times by board size.",
    priority: "0.5",
  },
  { path: "/privacy/", lang: "es", title: "Privacidad — Crowns", description: "Qué datos trata Crowns, para qué y cómo ejercer tus derechos.", priority: "0.2" },
  { path: "/terms/", lang: "es", title: "Condiciones del servicio — Crowns", description: "Condiciones de uso de Crowns.", priority: "0.2" },
  // Personales o sin interés para un buscador.
  { path: "/history/", lang: "en", title: "Your history — Crowns", description: "Your solved puzzles.", noindex: true },
  { path: "/profile/", lang: "en", title: "Your profile — Crowns", description: "Your profile and stats.", noindex: true },
  { path: "/auth/", lang: "en", title: "Sign in — Crowns", description: "Sign in to save your history.", noindex: true },
];

/** Las dos páginas de contenido son estáticas: se sirven sin ejecutar la app. */
export const CONTENT = {
  "/how-to-play/": {
    alternate: "/como-jugar/",
    tagline: "One crown per row, column and colour",
    heading: "How to play Crowns",
    intro:
      "Crowns is a logic puzzle: a grid split into coloured regions where you place one crown per row, per column and per region. It is the same puzzle you may know as <strong>Star Battle</strong> (with one star per region) or as <strong>Queens</strong>, the version LinkedIn made popular. No arithmetic, no guessing: every board here has exactly one solution and can be reached by pure deduction.",
    sections: [
      {
        h: "The three rules",
        html: `<ol>
          <li><strong>One crown in every row</strong> — no more, no less.</li>
          <li><strong>One crown in every column</strong>, and <strong>one in every colour region</strong>.</li>
          <li><strong>No two crowns may touch</strong>, not even diagonally. A crown blocks the eight squares around it.</li>
        </ol>
        <p>An 8×8 board has eight colour regions and eight crowns. Regions come in odd shapes: some are two squares, others fifteen.</p>`,
      },
      {
        h: "How to start solving",
        html: `<p>Three techniques take you a long way:</p>
        <ul>
          <li><strong>Small regions first.</strong> A region of two squares only has two candidates, and often one of them is already ruled out.</li>
          <li><strong>A row inside one region.</strong> If a colour occupies every free square of a row, that row's crown belongs to it — so the rest of that region, elsewhere on the board, is out.</li>
          <li><strong>Mark what you discard.</strong> Click twice to place a ✕. The eliminations are what solve the puzzle; the crowns are just the consequence.</li>
        </ul>
        <p>In Crowns you can turn on automatic ✕ marks: place a crown and everything it rules out gets crossed for you.</p>`,
      },
      {
        h: "Crowns, Queens and Star Battle: the same idea",
        html: `<p>The family is older than it looks. <strong>Star Battle</strong> comes from the puzzle magazines and usually asks for one, two or three stars per region. The one-star variant on a grid of coloured regions is exactly this game.</p>
        <p><strong>Queens</strong> is the name LinkedIn gave its daily version, borrowed from the eight queens chess problem: eight queens that cannot attack each other. The difference is that here the diagonal only blocks the adjacent square, not the whole line, and the colour regions replace the extra constraint.</p>`,
      },
      {
        h: "What this version adds",
        html: `<ul>
          <li><strong>A new puzzle every day</strong>, the same board for everyone, with its own ranking.</li>
          <li><strong>Boards from 5×5 to 10×10</strong> in free play, generated on the spot.</li>
          <li><strong>Guaranteed single solution.</strong> The generator refines the regions until the solver finds exactly one, so you never have to guess.</li>
          <li><strong>Private leagues</strong> with a six-character code, and a live duel where you watch each other's progress on the same board.</li>
          <li>Free, no ads, and playable without an account.</li>
        </ul>`,
      },
    ],
    cta: "Play today's puzzle",
  },

  "/como-jugar/": {
    alternate: "/how-to-play/",
    tagline: "Una corona por fila, columna y color",
    heading: "Cómo jugar a Crowns",
    intro:
      "Crowns es un puzle de lógica: una cuadrícula dividida en regiones de color donde colocas una corona por fila, por columna y por región. Es el mismo puzle que quizá conozcas como <strong>Star Battle</strong> (con una estrella por región) o como <strong>Queens</strong>, la versión que popularizó LinkedIn. Sin cuentas ni azar: cada tablero tiene una única solución y se llega a ella razonando.",
    sections: [
      {
        h: "Las tres reglas",
        html: `<ol>
          <li><strong>Una corona en cada fila</strong>, ni más ni menos.</li>
          <li><strong>Una corona en cada columna</strong> y <strong>una en cada región de color</strong>.</li>
          <li><strong>Dos coronas no pueden tocarse</strong>, ni siquiera en diagonal. Cada corona bloquea las ocho casillas de alrededor.</li>
        </ol>
        <p>Un tablero de 8×8 tiene ocho regiones y ocho coronas. Las regiones son irregulares: unas ocupan dos casillas y otras quince.</p>`,
      },
      {
        h: "Por dónde empezar",
        html: `<p>Con tres técnicas se avanza muchísimo:</p>
        <ul>
          <li><strong>Las regiones pequeñas primero.</strong> Una región de dos casillas solo tiene dos candidatas, y muchas veces una ya está descartada.</li>
          <li><strong>Una fila dentro de una sola región.</strong> Si un color ocupa todas las casillas libres de una fila, la corona de esa fila es suya: el resto de esa región, en otras filas, queda descartado.</li>
          <li><strong>Marca lo que descartas.</strong> Con dos clics pones una ✕. Lo que resuelve el puzle son las eliminaciones; las coronas son la consecuencia.</li>
        </ul>
        <p>En Crowns puedes activar las ✕ automáticas: al poner una corona se tacha solo todo lo que queda descartado.</p>`,
      },
      {
        h: "Crowns, Queens y Star Battle: el mismo juego",
        html: `<p>La familia es más antigua de lo que parece. El <strong>Star Battle</strong> viene de las revistas de pasatiempos y suele pedir una, dos o tres estrellas por región. La variante de una estrella sobre regiones de color es exactamente este juego.</p>
        <p><strong>Queens</strong> es el nombre que le puso LinkedIn a su versión diaria, tomado del problema de las ocho reinas del ajedrez: ocho reinas que no se atacan. La diferencia es que aquí la diagonal solo bloquea la casilla contigua, no toda la línea, y las regiones de color hacen el papel de la restricción que falta.</p>`,
      },
      {
        h: "Qué añade esta versión",
        html: `<ul>
          <li><strong>Un puzle nuevo cada día</strong>, el mismo para todo el mundo, con su clasificación.</li>
          <li><strong>Tableros de 5×5 a 10×10</strong> en modo libre, generados al momento.</li>
          <li><strong>Solución única garantizada.</strong> El generador refina las regiones hasta que el solucionador encuentra una sola, así que nunca hay que adivinar.</li>
          <li><strong>Ligas privadas</strong> con un código de seis caracteres, y duelo en directo para verse avanzar en el mismo tablero.</li>
          <li>Gratis, sin anuncios y se puede jugar sin cuenta.</li>
        </ul>`,
      },
    ],
    cta: "Jugar al puzle de hoy",
  },
};
