import { dailyPuzzle } from "./generator";
import { todayKey } from "./rng";
import type { Puzzle, Size } from "./types";

export const DAILY_SIZE: Size = 8;
/** Cuántos días atrás enseña el archivo. */
export const DAILY_ARCHIVE_DAYS = 14;

/** Generar un tablero cuesta unos milisegundos: no lo repetimos. */
const cache = new Map<string, Puzzle>();

export function dailyFor(date: string, size: Size = DAILY_SIZE): Puzzle {
  const key = `${date}:${size}`;
  let puzzle = cache.get(key);
  if (!puzzle) {
    puzzle = dailyPuzzle(date, size);
    cache.set(key, puzzle);
  }
  return puzzle;
}

/** Las fechas del archivo, de hoy hacia atrás. */
export function recentDailyDates(days = DAILY_ARCHIVE_DAYS, from: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let back = 0; back < days; back++) {
    const day = new Date(from);
    day.setDate(day.getDate() - back);
    dates.push(todayKey(day));
  }
  return dates;
}

/**
 * Días seguidos resueltos contando desde hoy (o desde ayer, para no romper la
 * racha a quien todavía no ha jugado hoy).
 */
export function currentStreak(solvedDates: Set<string>, from: Date = new Date()): number {
  // Si hoy aún no se ha jugado, la racha se mide desde ayer: el día no ha acabado.
  let offset = solvedDates.has(todayKey(from)) ? 0 : 1;
  let streak = 0;
  for (;;) {
    const day = new Date(from);
    day.setDate(day.getDate() - offset);
    if (!solvedDates.has(todayKey(day))) return streak;
    streak++;
    offset++;
  }
}
