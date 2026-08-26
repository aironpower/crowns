import type { Size } from "../game/types";
import type { LocalPlay } from "./types";

const PLAYS_KEY = "crowns.localPlays";
const BEST_KEY = "crowns.best";
const THEME_KEY = "crowns.theme";
const GUEST_KEY = "crowns.guest";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback; // modo privado o almacenamiento bloqueado
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: la partida simplemente no se conserva */
  }
}

export function localPlays(): LocalPlay[] {
  return read<LocalPlay[]>(PLAYS_KEY, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addLocalPlay(play: Omit<LocalPlay, "id" | "created_at">): LocalPlay {
  const entry: LocalPlay = {
    ...play,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  write(PLAYS_KEY, [entry, ...read<LocalPlay[]>(PLAYS_KEY, [])].slice(0, 500));
  return entry;
}

export function clearLocalPlays(): void {
  write(PLAYS_KEY, []);
}

/** ¿Ya se jugó hoy el diario en este navegador? (para invitados) */
export function localDailyDone(date: string): boolean {
  return localPlays().some((play) => play.mode === "daily" && play.daily_date === date);
}

export function bestTime(size: Size): number | null {
  const all = read<Record<string, number>>(BEST_KEY, {});
  return all[String(size)] ?? null;
}

export function saveBestTime(size: Size, ms: number): boolean {
  const all = read<Record<string, number>>(BEST_KEY, {});
  const current = all[String(size)];
  if (current && current <= ms) return false;
  all[String(size)] = ms;
  write(BEST_KEY, all);
  return true;
}

export type ThemeChoice = "light" | "dark" | "system";

export function readTheme(): ThemeChoice {
  const value = read<ThemeChoice>(THEME_KEY, "system");
  return value === "light" || value === "dark" ? value : "system";
}

export function saveTheme(theme: ThemeChoice): void {
  write(THEME_KEY, theme);
}

/** El jugador eligió explícitamente seguir sin cuenta. */
export function isGuest(): boolean {
  return read<boolean>(GUEST_KEY, false);
}

export function setGuest(value: boolean): void {
  write(GUEST_KEY, value);
}
