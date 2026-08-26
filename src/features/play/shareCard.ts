import type { DictKey } from "../../i18n/locales/es";
import type { Puzzle, PuzzleMode } from "../../game/types";
import { formatTime } from "../../components/format";

export interface ShareCardInput {
  puzzle: Puzzle;
  mode: PuzzleMode;
  durationMs: number;
  hints: number;
  streak: number;
  /** Fecha del diario, si la partida lo era. */
  dailyDate: string | null;
  origin: string;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  formatDate: (value: string) => string;
}

/**
 * El resultado en texto plano, listo para pegar en un chat. Estilo Wordle: se
 * entiende sin abrir nada, y el enlace lleva al mismo tablero para que el otro
 * pueda medirse contigo.
 */
export function buildShareCard(input: ShareCardInput): string {
  const { puzzle, mode, durationMs, hints, streak, dailyDate, origin, t, formatDate } = input;

  const título =
    mode === "daily" && dailyDate
      ? t("share.daily", { date: formatDate(dailyDate) })
      : t("share.board", { size: puzzle.size });

  const marca = hints === 0 ? t("share.noHints") : t("win.hints", { count: hints });
  const enlace =
    mode === "daily" && dailyDate
      ? `${origin}/?daily=${dailyDate}`
      : `${origin}/?board=${encodeURIComponent(puzzle.fingerprint)}`;

  const líneas = [`👑 Crowns · ${título}`, `⏱ ${formatTime(durationMs)} · ${marca}`];
  if (streak > 1) líneas.push(`🔥 ${t("daily.streak", { count: streak })}`);
  líneas.push(enlace);
  return líneas.join("\n");
}
