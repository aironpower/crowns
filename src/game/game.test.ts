import { describe, expect, it } from "vitest";
import { generatePuzzle, dailyPuzzle, fingerprintOf, generateSolution, growRegions } from "./generator";
import { checkBoard, isValidSolution, neighbours, solve } from "./solver";
import { mulberry32 } from "./rng";
import { SIZES, Size } from "./types";

function regionSizes(puzzle: { size: number; regions: number[] }): number[] {
  const counts = new Array<number>(puzzle.size).fill(0);
  puzzle.regions.forEach((r) => counts[r]++);
  return counts;
}

function isConnected(size: number, regions: number[], region: number): boolean {
  const cells = regions.reduce<number[]>((acc, r, i) => (r === region ? [...acc, i] : acc), []);
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    for (const nb of neighbours(stack.pop()!, size)) {
      if (regions[nb] === region && !seen.has(nb)) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  return seen.size === cells.length;
}

describe("solucionador", () => {
  it("acepta una colocación legal y rechaza las ilegales", () => {
    const size = 5;
    const regions = [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 2, 2, 3, 4, 4, 2, 2, 4, 4, 4];
    const puzzle = generatePuzzle(5, mulberry32(7));
    expect(isValidSolution(puzzle.size, puzzle.regions, puzzle.solution)).toBe(true);
    expect(isValidSolution(size, regions, [0, 0, 1, 2, 3])).toBe(false); // columna repetida
    expect(isValidSolution(size, regions, [0, 1, 3, 2, 4])).toBe(false); // coronas pegadas
    expect(isValidSolution(size, regions, [0, 2, 4, 1, 9])).toBe(false); // fuera del tablero
  });

  it("cuenta soluciones hasta el tope indicado", () => {
    const puzzle = generatePuzzle(6, mulberry32(3));
    expect(solve(puzzle.size, puzzle.regions, 5).count).toBe(1);
    // sin regiones que restrinjan (todas iguales) hay muchas más soluciones
    const flat = new Array(36).fill(0);
    expect(solve(6, flat, 5).count).toBe(0); // 6 coronas no caben en 1 sola región
  });

  it("detecta conflictos de fila, columna, región y contacto", () => {
    const size = 5;
    const regions = new Array(25).fill(0).map((_, i) => Math.floor(i / 5));
    expect(checkBoard(size, regions, [0, 2]).bad.size).toBe(2); // misma fila y misma región
    expect(checkBoard(size, regions, [0, 6]).bad.size).toBe(2); // en diagonal
    expect(checkBoard(size, regions, [0, 7]).bad.size).toBe(0); // separadas
  });
});

describe("generador", () => {
  it.each(SIZES)("crea puzles válidos y de solución única (%i×%i)", (size: Size) => {
    for (let i = 0; i < 6; i++) {
      const puzzle = generatePuzzle(size, mulberry32(1000 + i * 31 + size));
      expect(puzzle.regions).toHaveLength(size * size);
      expect(isValidSolution(size, puzzle.regions, puzzle.solution)).toBe(true);
      expect(solve(size, puzzle.regions, 3).count).toBe(1);

      const counts = regionSizes(puzzle);
      expect(counts.filter((c) => c === 0)).toHaveLength(0);
      expect(Math.max(...counts)).toBeLessThanOrEqual(Math.max(4, Math.round(size * 1.9)));
      for (let region = 0; region < size; region++) {
        expect(isConnected(size, puzzle.regions, region)).toBe(true);
      }
    }
  });

  it("numera las regiones por orden de aparición", () => {
    const puzzle = generatePuzzle(7, mulberry32(99));
    expect(puzzle.regions[0]).toBe(0);
    const firstSeen: number[] = [];
    for (const region of puzzle.regions) if (!firstSeen.includes(region)) firstSeen.push(region);
    expect(firstSeen).toEqual([...Array(7).keys()]);
    expect(puzzle.fingerprint).toBe(fingerprintOf(7, puzzle.regions));
  });

  it("es determinista: la misma semilla da el mismo tablero", () => {
    const a = generatePuzzle(8, mulberry32(4242));
    const b = generatePuzzle(8, mulberry32(4242));
    expect(b.fingerprint).toBe(a.fingerprint);
    expect(b.solution).toEqual(a.solution);
    const c = generatePuzzle(8, mulberry32(4243));
    expect(c.fingerprint).not.toBe(a.fingerprint);
  });

  it("el puzle diario solo depende de la fecha", () => {
    expect(dailyPuzzle("2026-08-26").fingerprint).toBe(dailyPuzzle("2026-08-26").fingerprint);
    expect(dailyPuzzle("2026-08-27").fingerprint).not.toBe(dailyPuzzle("2026-08-26").fingerprint);
    expect(solve(8, dailyPuzzle("2026-08-26").regions, 3).count).toBe(1);
  });

  it("las piezas sueltas también cumplen su contrato", () => {
    const rnd = mulberry32(5);
    const solution = generateSolution(9, rnd)!;
    expect(new Set(solution).size).toBe(9);
    const regions = growRegions(9, solution, rnd)!;
    expect(regions.filter((r) => r === -1)).toHaveLength(0);
    expect(new Set(solution.map((col, row) => regions[row * 9 + col])).size).toBe(9);
  });
});
