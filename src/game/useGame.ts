import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CROWN, CellState, EMPTY, MARK, Puzzle, PuzzleMode, Size } from "./types";
import { checkBoard } from "./solver";
import { generatePuzzleAsync } from "./generator";

export interface SolveSummary {
  puzzle: Puzzle;
  mode: PuzzleMode;
  durationMs: number;
  hints: number;
  moves: number;
}

interface Options {
  onSolved: (summary: SolveSummary) => void;
}

const emptyBoard = (size: number): CellState[] => new Array(size * size).fill(EMPTY) as CellState[];

export function useGame({ onSolved }: Options) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [mode, setMode] = useState<PuzzleMode>("practice");
  const [cells, setCells] = useState<CellState[]>([]);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(false);
  const [hints, setHints] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [autoMark, setAutoMark] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [hintCell, setHintCell] = useState<number | null>(null);

  const history = useRef<CellState[][]>([]);
  const startedAt = useRef<number | null>(null);
  const pausedTotal = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const solvedRef = useRef(false);
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;

  const [historyDepth, setHistoryDepth] = useState(0);
  const [running, setRunning] = useState(false);

  // ---------------------------------------------------------------- reloj
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (startedAt.current !== null) setElapsedMs(Date.now() - startedAt.current - pausedTotal.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  /** El reloj arranca con la primera jugada, no al cargar el tablero. */
  const startClock = useCallback(() => {
    if (startedAt.current === null) {
      startedAt.current = Date.now();
      pausedTotal.current = 0;
      pausedAt.current = null;
      setElapsedMs(0);
      setRunning(true);
    }
  }, []);

  /** Al deshacer una victoria se sigue jugando: el rato en pausa no cuenta. */
  const resumeClock = useCallback(() => {
    if (startedAt.current === null || solvedRef.current) return;
    if (pausedAt.current !== null) {
      pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }
    setRunning(true);
  }, []);

  // ------------------------------------------------------------- tablero
  const loadPuzzle = useCallback((next: Puzzle, nextMode: PuzzleMode) => {
    history.current = [];
    startedAt.current = null;
    pausedTotal.current = 0;
    solvedRef.current = false;
    setHistoryDepth(0);
    pausedAt.current = null;
    setRunning(false);
    setPuzzle(next);
    setMode(nextMode);
    setCells(emptyBoard(next.size));
    setSolved(false);
    setHints(0);
    setMoves(0);
    setElapsedMs(0);
    setMessage("");
    setHintCell(null);
    setLoading(false);
  }, []);

  const newGame = useCallback(
    async (size: Size, nextMode: PuzzleMode = "practice") => {
      setLoading(true);
      setMessage("");
      const next = await generatePuzzleAsync(size);
      loadPuzzle(next, nextMode);
    },
    [loadPuzzle],
  );

  // --------------------------------------------------------- jugadas
  const pushHistory = useCallback((snapshot: CellState[]) => {
    history.current.push(snapshot);
    if (history.current.length > 500) history.current.shift();
    setHistoryDepth(history.current.length);
  }, []);

  /** Marca con ✕ todo lo que la corona de `index` deja descartado. */
  const withAutoMarks = useCallback(
    (board: CellState[], index: number, size: number, regions: number[]): CellState[] => {
      const row = Math.floor(index / size);
      const col = index % size;
      const region = regions[index];
      return board.map((state, i) => {
        if (state !== EMPTY || i === index) return state;
        const r = Math.floor(i / size);
        const c = i % size;
        const touching = Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1;
        return r === row || c === col || regions[i] === region || touching ? MARK : state;
      });
    },
    [],
  );

  const applyCell = useCallback(
    (index: number, next: CellState, record: boolean) => {
      if (!puzzle || solvedRef.current) return;
      startClock();
      setHintCell(null);
      setCells((current) => {
        if (record) pushHistory(current);
        let board = current.slice() as CellState[];
        board[index] = next;
        if (next === CROWN && autoMark) board = withAutoMarks(board, index, puzzle.size, puzzle.regions);
        return board;
      });
      setMoves((m) => m + 1);
      setMessage("");
    },
    [puzzle, autoMark, pushHistory, startClock, withAutoMarks],
  );

  const cycleCell = useCallback(
    (index: number, backwards = false) => {
      const current = cells[index];
      const next: CellState = backwards
        ? current === EMPTY
          ? CROWN
          : current === CROWN
            ? MARK
            : EMPTY
        : current === EMPTY
          ? MARK
          : current === MARK
            ? CROWN
            : EMPTY;
      applyCell(index, next, true);
    },
    [cells, applyCell],
  );

  /** Pintar ✕ arrastrando: solo afecta a casillas vacías. */
  const paintMark = useCallback(
    (index: number, first: boolean) => {
      if (cells[index] !== EMPTY) return;
      applyCell(index, MARK, first);
    },
    [cells, applyCell],
  );

  const undo = useCallback(() => {
    const previous = history.current.pop();
    if (!previous) return;
    setHistoryDepth(history.current.length);
    setCells(previous);
    setSolved(false);
    solvedRef.current = false;
    resumeClock();
    setHintCell(null);
    setMessage("");
  }, [resumeClock]);

  const clear = useCallback(() => {
    if (!puzzle) return;
    pushHistory(cells);
    setCells(emptyBoard(puzzle.size));
    setSolved(false);
    solvedRef.current = false;
    resumeClock();
    setHintCell(null);
  }, [cells, puzzle, pushHistory, resumeClock]);

  /** Quita primero una corona mal puesta; si no hay ninguna, revela una correcta. */
  const hint = useCallback((): "removed" | "revealed" | null => {
    if (!puzzle || solvedRef.current) return null;
    const { size, regions, solution } = puzzle;
    const wrong: number[] = [];
    cells.forEach((state, i) => {
      if (state === CROWN && solution[Math.floor(i / size)] !== i % size) wrong.push(i);
    });
    startClock();
    setHints((h) => h + 1);
    pushHistory(cells);

    if (wrong.length) {
      const target = wrong[Math.floor(Math.random() * wrong.length)];
      setCells((board) => board.map((state, i) => (i === target ? EMPTY : state)));
      return "removed";
    }
    const missing: number[] = [];
    for (let row = 0; row < size; row++) {
      const index = row * size + solution[row];
      if (cells[index] !== CROWN) missing.push(index);
    }
    if (!missing.length) return null;
    const target = missing[Math.floor(Math.random() * missing.length)];
    setCells((board) => {
      let next = board.slice() as CellState[];
      next[target] = CROWN;
      if (autoMark) next = withAutoMarks(next, target, size, regions);
      return next;
    });
    setHintCell(target);
    return "revealed";
  }, [cells, puzzle, autoMark, pushHistory, startClock, withAutoMarks]);

  // ------------------------------------------------------- comprobación
  const { bad, crowns } = useMemo(() => {
    if (!puzzle) return { bad: new Set<number>(), crowns: 0 };
    const crownCells: number[] = [];
    cells.forEach((state, i) => {
      if (state === CROWN) crownCells.push(i);
    });
    return checkBoard(puzzle.size, puzzle.regions, crownCells);
  }, [cells, puzzle]);

  useEffect(() => {
    if (!puzzle || solvedRef.current) return;
    if (crowns !== puzzle.size || bad.size > 0) return;
    solvedRef.current = true;
    setSolved(true);
    setRunning(false);
    pausedAt.current = Date.now();
    const durationMs = startedAt.current ? Date.now() - startedAt.current - pausedTotal.current : 0;
    setElapsedMs(durationMs);
    onSolvedRef.current({ puzzle, mode, durationMs, hints, moves });
  }, [bad, crowns, puzzle, mode, hints, moves]);

  return {
    puzzle,
    mode,
    cells,
    loading,
    solved,
    running,
    bad,
    crowns,
    hints,
    moves,
    elapsedMs,
    message,
    setMessage,
    hintCell,
    autoMark,
    setAutoMark,
    showConflicts,
    setShowConflicts,
    canUndo: historyDepth > 0,
    newGame,
    loadPuzzle,
    cycleCell,
    paintMark,
    undo,
    clear,
    hint,
  };
}

export type Game = ReturnType<typeof useGame>;
