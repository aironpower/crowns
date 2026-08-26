import { describe, expect, it } from "vitest";
import { PALETTE, assignRegionColors, swatchDistance } from "./palette";
import { generatePuzzle } from "../game/generator";
import { mulberry32 } from "../game/rng";
import { neighbours } from "../game/solver";
import { SIZES, type Size } from "../game/types";

/** Pares de regiones que comparten algún borde. */
function adjacentPairs(size: number, regions: number[]): [number, number][] {
  const pairs = new Set<string>();
  regions.forEach((region, i) => {
    for (const nb of neighbours(i, size)) {
      if (regions[nb] !== region) pairs.add([region, regions[nb]].sort((a, b) => a - b).join("-"));
    }
  });
  return [...pairs].map((key) => key.split("-").map(Number) as [number, number]);
}

describe("colores de las regiones", () => {
  it.each(SIZES)("cada región lleva un color propio (%i×%i)", (size: Size) => {
    for (let seed = 0; seed < 8; seed++) {
      const puzzle = generatePuzzle(size, mulberry32(500 + seed * 17 + size));
      const colors = assignRegionColors(size, puzzle.regions);
      expect(colors).toHaveLength(size);
      expect(new Set(colors).size).toBe(size); // sin colores repetidos
      expect(colors.every((c) => c >= 0 && c < PALETTE.length)).toBe(true);
    }
  });

  it("las regiones que se tocan reciben colores claramente distintos", () => {
    // ΔE en CIELAB: por debajo de 20 dos pasteles empiezan a confundirse.
    let worst = Infinity;
    for (const size of SIZES) {
      for (let seed = 0; seed < 8; seed++) {
        const puzzle = generatePuzzle(size, mulberry32(900 + seed * 13 + size));
        const colors = assignRegionColors(size, puzzle.regions);
        for (const [a, b] of adjacentPairs(size, puzzle.regions)) {
          worst = Math.min(worst, swatchDistance(colors[a], colors[b]));
        }
      }
    }
    expect(worst).toBeGreaterThan(20);
  });

  it("es determinista", () => {
    const puzzle = generatePuzzle(9, mulberry32(31));
    expect(assignRegionColors(9, puzzle.regions)).toEqual(assignRegionColors(9, puzzle.regions));
  });
});
