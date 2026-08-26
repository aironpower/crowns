import { useMemo } from "react";
import { PALETTE } from "./palette";
import { hashSeed, mulberry32 } from "../game/rng";

/**
 * Avatar generado a partir del identificador del jugador: una retícula 5×5
 * simétrica con dos colores de la paleta del juego. Misma persona, mismo dibujo.
 */
export function Identicon({ seed, size = 56 }: { seed: string; size?: number }) {
  const { cells, ink, back } = useMemo(() => {
    const rnd = mulberry32(hashSeed(`crowns-avatar-${seed}`));
    const inkIndex = Math.floor(rnd() * PALETTE.length);
    let backIndex = Math.floor(rnd() * PALETTE.length);
    if (backIndex === inkIndex) backIndex = (inkIndex + 5) % PALETTE.length;

    // Solo decidimos las tres columnas de la izquierda y reflejamos: sale simétrico.
    const grid: boolean[] = new Array(25).fill(false);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 5; y++) {
        const on = rnd() > 0.45;
        grid[y * 5 + x] = on;
        grid[y * 5 + (4 - x)] = on;
      }
    }
    return { cells: grid, ink: PALETTE[inkIndex], back: PALETTE[backIndex] };
  }, [seed]);

  return (
    <svg
      className="identicon"
      width={size}
      height={size}
      viewBox="0 0 5 5"
      role="img"
      aria-hidden="true"
      style={{ ["--region-l" as string]: back.light, ["--region-d" as string]: back.dark }}
    >
      <rect width="5" height="5" className="identicon-bg" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i % 5}
            y={Math.floor(i / 5)}
            width="1"
            height="1"
            style={{ ["--region-l" as string]: ink.light, ["--region-d" as string]: ink.dark }}
            className="identicon-cell"
          />
        ) : null,
      )}
    </svg>
  );
}
