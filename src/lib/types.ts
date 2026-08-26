import type { Locale } from "../i18n";
import type { PuzzleMode, Size } from "../game/types";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  locale: Locale;
  created_at: string;
  /** Opcionales: no existen hasta aplicar la migración 0002. */
  auto_mark?: boolean;
  show_conflicts?: boolean;
}

/** Las dos opciones del tablero. */
export interface GameSettings {
  autoMark: boolean;
  showConflicts: boolean;
}

export interface PlayRow {
  id: string;
  created_at: string;
  duration_ms: number;
  hints: number;
  moves: number;
  mode: PuzzleMode;
  puzzle_id: string;
  puzzles: { size: Size; fingerprint: string; daily_date: string | null } | null;
}

export interface ActivityRow {
  id: string;
  created_at: string;
  duration_ms: number;
  hints: number;
  mode: PuzzleMode;
  size: Size;
  fingerprint: string;
  daily_date: string | null;
  user_id: string;
  username: string;
  display_name: string | null;
}

/** Una marca de otro jugador en el mismo tablero. */
export interface BoardRankRow {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  duration_ms: number;
  hints: number;
  /** Solo existe con la migración 0003 aplicada. */
  verified?: boolean;
  created_at: string;
}

export interface DailyRankRow {
  daily_date: string;
  size: Size;
  duration_ms: number;
  hints: number;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
}

export interface SizeRankRow {
  size: Size;
  user_id: string;
  username: string;
  display_name: string | null;
  best_ms: number | null;
  solved: number;
  last_played: string;
}

export interface League {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  members: number;
}

export interface PlayerStats {
  user_id: string;
  username: string;
  display_name: string | null;
  joined_at: string;
  solved: number;
  dailies: number;
  clean_solves: number;
  best_ms: number | null;
  avg_ms: number | null;
  last_played: string | null;
}

/** Partida guardada en el navegador mientras se juega como invitado. */
export interface LocalPlay {
  id: string;
  fingerprint: string;
  size: Size;
  regions: number[];
  solution: number[];
  mode: PuzzleMode;
  duration_ms: number;
  hints: number;
  moves: number;
  daily_date: string | null;
  created_at: string;
}
