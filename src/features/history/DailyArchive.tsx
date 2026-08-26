import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { formatTime } from "../../components/format";
import { BoardPreview } from "../../components/Board";
import { SkeletonList } from "../../components/Skeleton";
import { DAILY_ARCHIVE_DAYS, currentStreak, dailyFor, recentDailyDates } from "../../game/daily";
import { todayKey } from "../../game/rng";
import type { Puzzle } from "../../game/types";

export interface SolvedEntry {
  durationMs: number;
  hints: number;
}

interface Props {
  /** Tiempo conseguido en cada tablero, por fingerprint. */
  solvedByBoard: Map<string, SolvedEntry>;
  loading: boolean;
}

interface Row {
  date: string;
  puzzle: Puzzle;
}

/**
 * Los puzles del día de las últimas dos semanas: cuáles has resuelto, en cuánto,
 * y acceso para jugar los que te falten.
 *
 * Los tableros no se descargan: cada día es una función de la fecha, así que se
 * reconstruyen aquí mismo. Como generar cuesta unos milisegundos, se van
 * añadiendo de uno en uno cediendo el hilo, sin bloquear la interfaz.
 */
export function DailyArchive({ solvedByBoard, loading }: Props) {
  const { t, formatDate } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const today = todayKey();

  useEffect(() => {
    let alive = true;
    const dates = recentDailyDates();
    (async () => {
      const built: Row[] = [];
      for (const date of dates) {
        if (!alive) return;
        built.push({ date, puzzle: dailyFor(date) });
        setRows([...built]);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const solvedDates = new Set(rows.filter((row) => solvedByBoard.has(row.puzzle.fingerprint)).map((r) => r.date));
  const streak = currentStreak(solvedDates);

  return (
    <section className="panel stack">
      <div className="row wrap">
        <div className="stack tight">
          <h2>{t("daily.title")}</h2>
          <p className="muted small">{t("daily.subtitle")}</p>
        </div>
        <div className="grow" />
        {streak > 0 ? <span className="pill accent">🔥 {t("daily.streak", { count: streak })}</span> : null}
        <span className="pill">
          {t("daily.solvedCount", { done: solvedDates.size, total: DAILY_ARCHIVE_DAYS })}
        </span>
      </div>

      {rows.length === 0 || loading ? (
        <SkeletonList rows={4} />
      ) : (
        <ul className="feed daily-list">
          {rows.map(({ date, puzzle }) => {
            const solved = solvedByBoard.get(puzzle.fingerprint);
            return (
              <li key={date} className={solved ? "done" : ""}>
                <BoardPreview size={puzzle.size} regions={puzzle.regions} title={date} />
                <div className="feed-main">
                  <span>
                    {date === today ? <strong>{t("daily.today")}</strong> : formatDate(date)}
                    {solved ? <span className="pill small">✓</span> : null}
                  </span>
                  <span className="muted small">
                    {solved ? formatTime(solved.durationMs) : t("daily.notPlayed")}
                    {solved?.hints ? ` · ${t("community.withHints", { count: solved.hints })}` : ""}
                  </span>
                </div>
                <Link className="link" to={`/?daily=${date}`}>
                  {solved ? t("history.replay") : t("daily.play")}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
