/**
 * Reglas y resolución de un tablero de Crowns.
 *
 * Reglas: exactamente una corona por fila, por columna y por región de color,
 * y dos coronas nunca pueden tocarse (tampoco en diagonal).
 *
 * Como hay una corona por fila, el estado se representa como `pos[fila] = columna`
 * y la comprobación de adyacencia solo mira la fila anterior.
 */

export interface SolveResult {
  /** Número de soluciones encontradas, hasta el tope `cap`. */
  count: number;
  /** Primera solución encontrada. */
  first: number[] | null;
  /** Primera solución hallada que difiere de `base` (para guiar al generador). */
  alt: number[] | null;
}

export function solve(size: number, regions: number[], cap: number, base: number[] | null = null): SolveResult {
  let count = 0;
  let first: number[] | null = null;
  let alt: number[] | null = null;
  const pos = new Array<number>(size);

  const walk = (row: number, colsUsed: number, regsUsed: number, prev: number): void => {
    if (row === size) {
      count++;
      if (!first) first = pos.slice();
      if (!alt && base) {
        for (let i = 0; i < size; i++) {
          if (pos[i] !== base[i]) {
            alt = pos.slice();
            break;
          }
        }
      }
      return;
    }
    const off = row * size;
    for (let col = 0; col < size; col++) {
      if (colsUsed & (1 << col)) continue;
      if (col - prev <= 1 && prev - col <= 1) continue; // pegada a la corona de arriba
      const region = regions[off + col];
      if (regsUsed & (1 << region)) continue;
      pos[row] = col;
      walk(row + 1, colsUsed | (1 << col), regsUsed | (1 << region), col);
      if (count >= cap) return;
    }
  };

  walk(0, 0, 0, -3);
  return { count, first, alt };
}

/** ¿Es `solution` una colocación legal para este tablero? */
export function isValidSolution(size: number, regions: number[], solution: number[]): boolean {
  if (!Array.isArray(solution) || solution.length !== size) return false;
  if (regions.length !== size * size) return false;
  const cols = new Set<number>();
  const regs = new Set<number>();
  for (let row = 0; row < size; row++) {
    const col = solution[row];
    if (!Number.isInteger(col) || col < 0 || col >= size) return false;
    if (cols.has(col)) return false;
    cols.add(col);
    const region = regions[row * size + col];
    if (regs.has(region)) return false;
    regs.add(region);
    if (row > 0 && Math.abs(solution[row - 1] - col) <= 1) return false;
  }
  return true;
}

export interface BoardCheck {
  /** Índices de casillas con corona en conflicto. */
  bad: Set<number>;
  crowns: number;
}

/** Conflictos del tablero tal y como lo tiene el jugador ahora mismo. */
export function checkBoard(size: number, regions: number[], crownCells: number[]): BoardCheck {
  const bad = new Set<number>();
  const byRow = new Map<number, number[]>();
  const byCol = new Map<number, number[]>();
  const byRegion = new Map<number, number[]>();

  const push = (map: Map<number, number[]>, key: number, value: number) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  for (const i of crownCells) {
    push(byRow, Math.floor(i / size), i);
    push(byCol, i % size, i);
    push(byRegion, regions[i], i);
  }
  for (const map of [byRow, byCol, byRegion]) {
    for (const list of map.values()) {
      if (list.length > 1) list.forEach((i) => bad.add(i));
    }
  }
  for (let a = 0; a < crownCells.length; a++) {
    for (let b = a + 1; b < crownCells.length; b++) {
      const i = crownCells[a];
      const j = crownCells[b];
      const dr = Math.abs(Math.floor(i / size) - Math.floor(j / size));
      const dc = Math.abs((i % size) - (j % size));
      if (dr <= 1 && dc <= 1) {
        bad.add(i);
        bad.add(j);
      }
    }
  }
  return { bad, crowns: crownCells.length };
}

/** Vecinas ortogonales de una casilla. */
export function neighbours(i: number, size: number): number[] {
  const row = Math.floor(i / size);
  const col = i % size;
  const out: number[] = [];
  if (row > 0) out.push(i - size);
  if (row < size - 1) out.push(i + size);
  if (col > 0) out.push(i - 1);
  if (col < size - 1) out.push(i + 1);
  return out;
}
