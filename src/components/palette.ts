import { neighbours } from "../game/solver";

/**
 * Colores de las regiones: cada entrada trae su versión clara y su versión
 * oscura. La comparación entre colores se hace en CIELAB, no por tono, para que
 * cuente lo que de verdad ve el jugador (un gris azulado y un azul vivo tienen
 * el mismo tono pero no se confunden).
 */
export interface Swatch {
  light: string;
  dark: string;
}

// Diez familias de color repartidas de forma que la pareja más parecida siga a
// ΔE ≈ 22 en el peor de los dos temas (lo comprueba palette.test.ts).
export const PALETTE: Swatch[] = [
  { light: "#ef9a9a", dark: "#8d3840" }, // rojo
  { light: "#9cc7f2", dark: "#2b5588" }, // azul
  { light: "#7fd39a", dark: "#256c49" }, // verde
  { light: "#fbdb6e", dark: "#8a6510" }, // amarillo
  { light: "#c4a2ea", dark: "#563a85" }, // morado
  { light: "#f5ab72", dark: "#8d4419" }, // naranja
  { light: "#86dae5", dark: "#12616f" }, // cian
  { light: "#cdebac", dark: "#5b7622" }, // lima
  { light: "#f797c9", dark: "#8f2d63" }, // rosa
  { light: "#b8b2ac", dark: "#565049" }, // gris cálido
];

type Lab = [number, number, number];

function hexToLab(hex: string): Lab {
  const value = parseInt(hex.slice(1), 16);
  const srgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  // sRGB -> XYZ (D65) -> Lab
  const [r, g, b] = srgb;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const LAB = PALETTE.map((swatch) => ({ light: hexToLab(swatch.light), dark: hexToLab(swatch.dark) }));

const deltaE = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Lo distintos que se ven dos colores de la paleta. Nos quedamos con el peor de
 * los dos temas: un par que se distinga en claro pero no en oscuro no sirve.
 */
export function swatchDistance(a: number, b: number): number {
  return Math.min(deltaE(LAB[a].light, LAB[b].light), deltaE(LAB[a].dark, LAB[b].dark));
}

/** Pares de regiones que comparten algún borde. */
function adjacentPairs(size: number, regions: number[]): [number, number][] {
  const seen = new Set<number>();
  const pairs: [number, number][] = [];
  for (let i = 0; i < regions.length; i++) {
    for (const nb of neighbours(i, size)) {
      const a = regions[i];
      const b = regions[nb];
      if (a === b) continue;
      const key = Math.min(a, b) * 100 + Math.max(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([a, b]);
    }
  }
  return pairs;
}

/** Peor pareja de colores entre regiones que se tocan (a más alto, mejor). */
function worstContrast(pairs: [number, number][], colorOf: number[]): number {
  let worst = Infinity;
  for (const [a, b] of pairs) worst = Math.min(worst, swatchDistance(colorOf[a], colorOf[b]));
  return worst === Infinity ? 0 : worst;
}

function totalContrast(pairs: [number, number][], colorOf: number[]): number {
  return pairs.reduce((sum, [a, b]) => sum + swatchDistance(colorOf[a], colorOf[b]), 0);
}

/**
 * Asigna un color distinto a cada región —dos regiones nunca comparten color,
 * porque el jugador tiene que distinguirlas— repartiéndolos de forma que las
 * regiones que se tocan queden lo más separadas posible.
 *
 * Primero un reparto voraz (las regiones con más vecinas eligen antes) y luego
 * una pasada de intercambios que solo acepta el cambio si mejora el peor par.
 * Determinista: el mismo tablero da siempre los mismos colores.
 */
export function assignRegionColors(size: number, regions: number[]): number[] {
  const adjacency: Set<number>[] = Array.from({ length: size }, () => new Set<number>());
  for (const [a, b] of adjacentPairs(size, regions)) {
    adjacency[a].add(b);
    adjacency[b].add(a);
  }
  const pairs = adjacentPairs(size, regions);

  const order = [...Array(size).keys()].sort((a, b) => adjacency[b].size - adjacency[a].size || a - b);
  const colorOf = new Array<number>(size).fill(-1);
  const used = new Set<number>();

  for (const region of order) {
    const painted = [...adjacency[region]].filter((nb) => colorOf[nb] !== -1);
    let best = -1;
    let bestScore = -1;
    for (let candidate = 0; candidate < PALETTE.length; candidate++) {
      if (used.has(candidate)) continue; // cada región lleva su propio color
      const score = painted.length
        ? Math.min(...painted.map((nb) => swatchDistance(candidate, colorOf[nb])))
        : 1000 - candidate; // sin vecinas pintadas: mantenemos el orden de la paleta
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    colorOf[region] = best;
    used.add(best);
  }

  // Intercambios: mejoran el peor par sin romper nada (máximo 10 regiones).
  const score = (assignment: number[]): [number, number] => [
    worstContrast(pairs, assignment),
    totalContrast(pairs, assignment),
  ];
  let current = score(colorOf);
  for (let pass = 0; pass < 4; pass++) {
    let improved = false;
    for (let a = 0; a < size; a++) {
      for (let b = a + 1; b < size; b++) {
        [colorOf[a], colorOf[b]] = [colorOf[b], colorOf[a]];
        const next = score(colorOf);
        if (next[0] > current[0] || (next[0] === current[0] && next[1] > current[1])) {
          current = next;
          improved = true;
        } else {
          [colorOf[a], colorOf[b]] = [colorOf[b], colorOf[a]]; // deshacer
        }
      }
    }
    if (!improved) break;
  }

  return colorOf;
}
