/** Estado de una casilla del tablero. */
export const EMPTY = 0;
export const MARK = 1;
export const CROWN = 2;
export type CellState = typeof EMPTY | typeof MARK | typeof CROWN;

export type Size = 5 | 6 | 7 | 8 | 9 | 10;
export const SIZES: Size[] = [5, 6, 7, 8, 9, 10];

export interface Puzzle {
  size: Size;
  /** Región de cada casilla, en orden fila-mayor (size * size valores, 0..size-1). */
  regions: number[];
  /** solution[fila] = columna donde va la corona. */
  solution: number[];
  /** Identificador estable del tablero: mismo tablero => mismo fingerprint. */
  fingerprint: string;
}

export type PuzzleMode = "daily" | "practice";
