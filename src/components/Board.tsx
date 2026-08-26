import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { CROWN, CellState, MARK, Puzzle } from "../game/types";
import { PALETTE, assignRegionColors } from "./palette";

interface Props {
  puzzle: Puzzle;
  cells: CellState[];
  bad: Set<number>;
  showConflicts: boolean;
  hintCell: number | null;
  frozen: boolean;
  onCycle: (index: number, backwards: boolean) => void;
  onPaint: (index: number, first: boolean) => void;
}

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="glyph crown" aria-hidden="true">
    <path d="M2.6 7.7c.8-.5 1.8-.2 2.2.6l2 3.6 3.5-6.1c.3-.6.9-.9 1.5-.9h.4c.6 0 1.2.3 1.5.9l3.5 6.1 2-3.6c.4-.8 1.4-1.1 2.2-.6.7.4 1 1.3.7 2.1l-2.9 8.1c-.2.6-.8 1-1.4 1H6.2c-.6 0-1.2-.4-1.4-1L1.9 9.8c-.3-.8 0-1.7.7-2.1z" />
    <rect x="5" y="19.6" width="14" height="2.2" rx="1.1" />
  </svg>
);

const MarkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.4"
    strokeLinecap="round"
    className="glyph mark"
    aria-hidden="true"
  >
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

/** Bordes gruesos donde cambia la región. */
function edgeClasses(puzzle: Puzzle, index: number): string {
  const { size, regions } = puzzle;
  const row = Math.floor(index / size);
  const col = index % size;
  const region = regions[index];
  const classes: string[] = [];
  if (row === 0 || regions[index - size] !== region) classes.push("edge-top");
  if (row === size - 1 || regions[index + size] !== region) classes.push("edge-bottom");
  if (col === 0 || regions[index - 1] !== region) classes.push("edge-left");
  if (col === size - 1 || regions[index + 1] !== region) classes.push("edge-right");
  return classes.join(" ");
}

export function Board({ puzzle, cells, bad, showConflicts, hintCell, frozen, onCycle, onPaint }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: number; painting: boolean } | null>(null);
  const [cellPx, setCellPx] = useState(48);

  useEffect(() => {
    const resize = () => {
      const available = Math.min(window.innerWidth - 44, 540);
      setCellPx(Math.max(28, Math.min(60, Math.floor(available / puzzle.size))));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [puzzle.size]);

  const colors = useMemo(() => assignRegionColors(puzzle.size, puzzle.regions), [puzzle]);
  const edges = useMemo(
    () => puzzle.regions.map((_, index) => edgeClasses(puzzle, index)),
    [puzzle],
  );

  const indexFromEvent = (event: PointerEvent<HTMLDivElement>): number | null => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button = target?.closest<HTMLElement>("[data-index]");
    return button ? Number(button.dataset.index) : null;
  };

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (frozen) return;
    const index = indexFromEvent(event);
    if (index === null) return;
    event.preventDefault();
    if (event.button === 2) {
      onCycle(index, true);
      return;
    }
    drag.current = { start: index, painting: false };
    boardRef.current?.setPointerCapture(event.pointerId);
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || frozen) return;
    const index = indexFromEvent(event);
    if (index === null) return;
    if (!drag.current.painting) {
      if (index === drag.current.start) return; // aún no se ha movido de casilla
      drag.current.painting = true;
      onPaint(drag.current.start, true);
    }
    onPaint(index, false);
  };

  const handleUp = () => {
    const current = drag.current;
    drag.current = null;
    if (current && !current.painting && !frozen) onCycle(current.start, false);
  };

  const size = puzzle.size;

  return (
    <div
      ref={boardRef}
      className={`board${frozen ? " solved" : ""}`}
      role="grid"
      aria-label={`${size}×${size}`}
      style={{ ["--cell" as string]: `${cellPx}px`, gridTemplateColumns: `repeat(${size}, var(--cell))` }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      {cells.map((state, index) => {
        const swatch = PALETTE[colors[puzzle.regions[index]]];
        const row = Math.floor(index / size);
        const col = index % size;
        const classes = [
          "cell",
          edges[index],
          showConflicts && bad.has(index) ? "conflict" : "",
          hintCell === index ? "hinted" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={index}
            type="button"
            data-index={index}
            className={classes}
            style={{ ["--region-l" as string]: swatch.light, ["--region-d" as string]: swatch.dark }}
            aria-label={`${row + 1}, ${col + 1}`}
          >
            {state === CROWN ? <CrownIcon /> : state === MARK ? <MarkIcon /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Miniatura del tablero para listas (historial, comunidad). */
export function BoardPreview({ size, regions, title }: { size: number; regions: number[]; title?: string }) {
  const colors = useMemo(() => assignRegionColors(size, regions), [size, regions]);
  const unit = 100 / size;
  return (
    <svg className="board-preview" viewBox="0 0 100 100" role="img" aria-label={title ?? `${size}×${size}`}>
      {regions.map((region, index) => {
        const swatch = PALETTE[colors[region]];
        return (
          <rect
            key={index}
            x={(index % size) * unit}
            y={Math.floor(index / size) * unit}
            width={unit}
            height={unit}
            className="preview-cell"
            style={{ ["--region-l" as string]: swatch.light, ["--region-d" as string]: swatch.dark }}
          />
        );
      })}
    </svg>
  );
}
