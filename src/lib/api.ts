import type { Locale } from "../i18n";
import type { Puzzle, PuzzleMode, Size } from "../game/types";
import { db } from "./supabase";
import type { ActivityRow, DailyRankRow, PlayRow, PlayerStats, Profile, SizeRankRow } from "./types";

export interface SubmitPlayInput {
  puzzle: Puzzle;
  durationMs: number;
  hints: number;
  moves: number;
  mode: PuzzleMode;
  dailyDate: string | null;
}

/**
 * Registra una partida. El servidor valida que la solución cumpla las reglas
 * antes de guardarla (ver `submit_play` en la migración), así que no basta con
 * inventarse un tiempo bueno desde la consola del navegador.
 */
export async function submitPlay(input: SubmitPlayInput): Promise<void> {
  const { error } = await db().rpc("submit_play", {
    p_size: input.puzzle.size,
    p_regions: input.puzzle.regions,
    p_solution: input.puzzle.solution,
    p_duration_ms: Math.round(input.durationMs),
    p_hints: input.hints,
    p_moves: input.moves,
    p_mode: input.mode,
    p_daily_date: input.dailyDate,
  });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, username, display_name, locale, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: { username?: string; display_name?: string | null; locale?: Locale },
): Promise<Profile> {
  const { data, error } = await db()
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, username, display_name, locale, created_at")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchMyPlays(userId: string, limit = 100): Promise<PlayRow[]> {
  const { data, error } = await db()
    .from("plays")
    .select("id, created_at, duration_ms, hints, moves, mode, puzzle_id, puzzles(size, fingerprint, daily_date)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PlayRow[];
}

export async function fetchActivity(limit = 30): Promise<ActivityRow[]> {
  const { data, error } = await db()
    .from("recent_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

export async function fetchDailyRanking(date: string, limit = 20): Promise<DailyRankRow[]> {
  const { data, error } = await db()
    .from("daily_leaderboard")
    .select("*")
    .eq("daily_date", date)
    .order("duration_ms", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DailyRankRow[];
}

export async function fetchSizeRanking(size: Size, limit = 10): Promise<SizeRankRow[]> {
  const { data, error } = await db()
    .from("leaderboard_by_size")
    .select("*")
    .eq("size", size)
    .not("best_ms", "is", null)
    .order("best_ms", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SizeRankRow[];
}

export async function fetchPlayerStats(userId: string): Promise<PlayerStats | null> {
  const { data, error } = await db().from("player_stats").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as PlayerStats) ?? null;
}

/** Mejor tiempo (sin pistas) y partidas resueltas por tamaño, para un jugador. */
export async function fetchMyBestBySize(userId: string): Promise<SizeRankRow[]> {
  const { data, error } = await db()
    .from("leaderboard_by_size")
    .select("*")
    .eq("user_id", userId)
    .order("size", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SizeRankRow[];
}

/** ¿Este jugador ya resolvió el diario de esta fecha? */
export async function hasPlayedDaily(userId: string, date: string): Promise<boolean> {
  const { count, error } = await db()
    .from("daily_leaderboard")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("daily_date", date);
  if (error) throw error;
  return (count ?? 0) > 0;
}
