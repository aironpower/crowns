import { Puzzle, Size } from "./types";
import { Rng, mulberry32, hashSeed, shuffle } from "./rng";
import { neighbours, solve } from "./solver";

/**
 * Generador de puzles con solución única.
 *
 * 1. Se coloca una solución legal al azar (una corona por fila/columna, sin tocarse).
 * 2. Cada región nace en una corona y crece por casillas vecinas.
 * 3. Se refinan las regiones moviendo casillas de una a otra hasta que el
 *    solucionador solo encuentra una solución posible: así el puzle se puede
 *    deducir por lógica, nunca hace falta adivinar.
 *
 * Todo depende únicamente del `Rng` recibido y de contadores de iteraciones
 * (nunca del reloj), de modo que la misma semilla produce siempre el mismo
 * tablero en cualquier navegador. De ahí sale el puzle diario.
 */

const SOLUTION_CAP = 20; // tope de soluciones a contar: basta para guiar el refinado
const DIRECTED_MOVE_CHANCE = 0.4;

export function generateSolution(size: number, rnd: Rng): number[] | null {
  const cols = new Array<number>(size);
  const used = new Array<boolean>(size).fill(false);

  const walk = (row: number): boolean => {
    if (row === size) return true;
    const order = shuffle([...Array(size).keys()], rnd);
    for (const col of order) {
      if (used[col]) continue;
      if (row > 0 && Math.abs(cols[row - 1] - col) <= 1) continue;
      used[col] = true;
      cols[row] = col;
      if (walk(row + 1)) return true;
      used[col] = false;
    }
    return false;
  };

  return walk(0) ? cols : null;
}

/** Reparte todas las casillas en regiones conexas, una por corona. */
export function growRegions(size: number, solution: number[], rnd: Rng): number[] | null {
  const total = size * size;
  const regions = new Array<number>(total).fill(-1);
  const sizes = new Array<number>(size).fill(1);
  const frontier: number[][] = [];

  for (let row = 0; row < size; row++) {
    const seed = row * size + solution[row];
    regions[seed] = row;
    frontier[row] = neighbours(seed, size).filter((i) => regions[i] === -1);
  }

  let left = total - size;
  let guard = total * 40;
  while (left > 0 && guard-- > 0) {
    const active: number[] = [];
    for (let r = 0; r < size; r++) if (frontier[r].length) active.push(r);
    if (!active.length) break;
    // sesgo hacia la región más pequeña para que queden equilibradas
    const pick =
      rnd() < 0.65
        ? active.reduce((a, b) => (sizes[b] < sizes[a] ? b : a))
        : active[Math.floor(rnd() * active.length)];
    const list = frontier[pick];
    const cell = list.splice(Math.floor(rnd() * list.length), 1)[0];
    if (regions[cell] !== -1) continue;
    regions[cell] = pick;
    sizes[pick]++;
    left--;
    for (const nb of neighbours(cell, size)) if (regions[nb] === -1) list.push(nb);
  }
  return left > 0 ? null : regions;
}

/** ¿La región sigue siendo conexa (y con 2+ casillas) si le quitamos `cell`? */
function connectedWithout(regions: number[], region: number, cell: number, size: number, count: number): boolean {
  if (count < 3) return false;
  let first = -1;
  for (let i = 0; i < size * size; i++) {
    if (regions[i] === region && i !== cell) {
      first = i;
      break;
    }
  }
  const seen = new Uint8Array(size * size);
  const stack = [first];
  seen[first] = 1;
  let visited = 1;
  while (stack.length) {
    for (const nb of neighbours(stack.pop()!, size)) {
      if (regions[nb] === region && nb !== cell && !seen[nb]) {
        seen[nb] = 1;
        visited++;
        stack.push(nb);
      }
    }
  }
  return visited === count - 1;
}

interface Attempt {
  solution: number[];
  regions: number[];
  sizes: number[];
  count: number;
  alt: number[] | null;
}

/**
 * Intenta un movimiento (una casilla cambia de región) y lo conserva si el
 * número de soluciones no empeora. El 40% de las veces el movimiento es
 * "dirigido": ataca una casilla donde la solución alternativa pone corona.
 */
function tweak(size: number, state: Attempt, maxRegionSize: number, rnd: Rng): void {
  const { regions, solution, sizes } = state;

  const tryMove = (cell: number, to: number): boolean => {
    const from = regions[cell];
    if (to === from || sizes[to] + 1 > maxRegionSize) return false;
    if (!connectedWithout(regions, from, cell, size, sizes[from])) return false;
    regions[cell] = to;
    const result = solve(size, regions, SOLUTION_CAP, solution);
    if (result.count >= 1 && result.count <= state.count) {
      state.count = result.count;
      state.alt = result.alt;
      sizes[from]--;
      sizes[to]++;
      return true;
    }
    regions[cell] = from;
    return false;
  };

  if (rnd() < DIRECTED_MOVE_CHANCE && state.alt) {
    const alt = state.alt;
    const candidates: number[] = [];
    for (let row = 0; row < size; row++) {
      if (alt[row] !== solution[row]) candidates.push(row * size + alt[row]);
    }
    for (const cell of shuffle(candidates, rnd)) {
      const from = regions[cell];
      const options: { to: number; kills: boolean }[] = [];
      for (const nb of neighbours(cell, size)) {
        const to = regions[nb];
        if (to === from) continue;
        // mover la casilla a una región que la alternativa ya usa la invalida
        const kills = alt.some((col, row) => row * size + col !== cell && regions[row * size + col] === to);
        options.push({ to, kills });
      }
      options.sort((a, b) => Number(b.kills) - Number(a.kills));
      for (const option of options) if (tryMove(cell, option.to)) return;
    }
  }

  const cell = Math.floor(rnd() * size * size);
  if (solution[Math.floor(cell / size)] === cell % size) return; // nunca movemos una corona
  const others = neighbours(cell, size).filter((i) => regions[i] !== regions[cell]);
  if (!others.length) return;
  tryMove(cell, regions[others[Math.floor(rnd() * others.length)]]);
}

function startAttempt(size: number, rnd: Rng): Attempt | null {
  const solution = generateSolution(size, rnd);
  if (!solution) return null;
  const regions = growRegions(size, solution, rnd);
  if (!regions) return null;
  const sizes = new Array<number>(size).fill(0);
  regions.forEach((r) => sizes[r]++);
  const result = solve(size, regions, SOLUTION_CAP, solution);
  return { solution, regions, sizes, count: result.count, alt: result.alt };
}

/** Renumera las regiones por orden de aparición, para que el mismo tablero dé siempre el mismo fingerprint. */
export function canonicalise(size: number, regions: number[], solution: number[]): Puzzle {
  const map = new Map<number, number>();
  const next: number[] = [];
  for (const region of regions) {
    if (!map.has(region)) map.set(region, map.size);
    next.push(map.get(region)!);
  }
  return {
    size: size as Size,
    regions: next,
    solution,
    fingerprint: fingerprintOf(size, next),
  };
}

export function fingerprintOf(size: number, regions: number[]): string {
  return `${size}:${regions.join("")}`;
}

const movesPerAttempt = (size: number) => 500 * size;
const maxRegionSize = (size: number) => Math.max(4, Math.round(size * 1.9));

/** Versión síncrona: útil en tests, scripts y tableros pequeños. */
export function generatePuzzle(size: Size, rnd: Rng = Math.random, maxAttempts = 60): Puzzle {
  let fallback: Attempt | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = startAttempt(size, rnd);
    if (!state) continue;
    const budget = movesPerAttempt(size);
    for (let move = 0; move < budget && state.count > 1; move++) {
      tweak(size, state, maxRegionSize(size), rnd);
    }
    if (state.count === 1) return canonicalise(size, state.regions, state.solution);
    if (!fallback || state.count < fallback.count) fallback = state;
  }
  // Salvavidas: nunca ha hecho falta en las pruebas, pero devolvemos algo jugable.
  return canonicalise(size, fallback!.regions, fallback!.solution);
}

/**
 * Versión por rebanadas de tiempo: cede el hilo cada ~25 ms para que la
 * interfaz no se congele mientras se generan tableros grandes.
 */
export function generatePuzzleAsync(size: Size, rnd: Rng = Math.random): Promise<Puzzle> {
  return new Promise((resolve) => {
    const budget = movesPerAttempt(size);
    const limit = maxRegionSize(size);
    let state: Attempt | null = null;
    let moves = 0;
    let attempts = 0;
    let best: Attempt | null = null;

    const step = () => {
      if (!state) {
        state = startAttempt(size, rnd);
        moves = 0;
        attempts++;
      }
      if (state) {
        const until = Date.now() + 25;
        while (state.count > 1 && moves < budget && Date.now() < until) {
          tweak(size, state, limit, rnd);
          moves++;
        }
        if (state.count === 1) {
          resolve(canonicalise(size, state.regions, state.solution));
          return;
        }
        if (moves >= budget) {
          if (!best || state.count < best.count) best = state;
          state = null;
        }
      }
      if (attempts > 60 && best) {
        resolve(canonicalise(size, best.regions, best.solution));
        return;
      }
      setTimeout(step, 0);
    };
    step();
  });
}

/** Lee las regiones de un fingerprint ("8:001122…") sin resolver el tablero. */
export function boardFromFingerprint(fingerprint: string): { size: Size; regions: number[] } | null {
  const [rawSize, digits] = fingerprint.split(":");
  const size = Number(rawSize);
  if (!Number.isInteger(size) || size < 5 || size > 10) return null;
  if (!digits || digits.length !== size * size) return null;
  const regions = [...digits].map(Number);
  if (regions.some((region) => !Number.isInteger(region) || region < 0 || region >= size)) return null;
  return { size: size as Size, regions };
}

/**
 * Reconstruye un tablero jugable a partir de su fingerprint, que es lo que se
 * guarda en la base de datos. Sirve para jugar la partida de otro.
 */
export function puzzleFromFingerprint(fingerprint: string): Puzzle | null {
  const board = boardFromFingerprint(fingerprint);
  if (!board) return null;
  const { size, regions } = board;
  const result = solve(size, regions, 2);
  if (result.count !== 1 || !result.first) return null; // solo tableros con solución única
  return { size, regions, solution: result.first, fingerprint };
}

/** El puzle del día: misma fecha => mismo tablero para todos los jugadores. */
export function dailyPuzzle(date: string, size: Size = 8): Puzzle {
  return generatePuzzle(size, mulberry32(hashSeed(`crowns-${date}-${size}`)));
}
