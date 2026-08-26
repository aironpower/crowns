import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Board } from "../../components/Board";
import { formatTime } from "../../components/format";
import { useI18n } from "../../i18n";
import { useAuth } from "../auth/AuthProvider";
import { puzzleFromFingerprint } from "../../game/generator";
import { DAILY_SIZE, dailyFor } from "../../game/daily";
import { todayKey } from "../../game/rng";
import { SIZES, type Size } from "../../game/types";
import { useGame, type SolveSummary } from "../../game/useGame";
import { addLocalPlay, bestTime, localDailyDone, saveBestTime } from "../../lib/localStore";
import { fetchBoardRanking, fetchBoardStanding, hasPlayedDaily, startAttempt, submitPlay } from "../../lib/api";
import type { BoardRankRow, BoardStanding } from "../../lib/types";
import { buildShareCard } from "./shareCard";
import { currentStreak } from "../../game/daily";
import { localPlays } from "../../lib/localStore";
import { useSettings } from "../../lib/useSettings";

type SaveState = "idle" | "saving" | "saved" | "local" | "error";

export function PlayPage() {
  const { t, formatDate } = useI18n();
  const { user, configured } = useAuth();
  const [params] = useSearchParams();

  const [size, setSize] = useState<Size>(8);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [record, setRecord] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  /** Fecha del diario que hay en pantalla; se fija al cargarlo, no al enviarlo. */
  const loadedDaily = useRef<string | null>(null);
  const [shared, setShared] = useState(false);
  const [shareText, setShareText] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [duel, setDuel] = useState<BoardRankRow[] | null>(null);
  const [standing, setStanding] = useState<BoardStanding | null>(null);
  /** Intento abierto en el servidor para la partida en curso. */
  const attemptId = useRef<string | null>(null);
  const today = todayKey();

  const handleSolved = useCallback(
    async (summary: SolveSummary) => {
      const { puzzle, mode, durationMs, hints, moves } = summary;
      if (!hints) setRecord(saveBestTime(puzzle.size, durationMs));
      setBest(bestTime(puzzle.size));

      if (user && configured) {
        setSaveState("saving");
        try {
          await submitPlay({
            puzzle,
            durationMs,
            hints,
            moves,
            mode,
            dailyDate: mode === "daily" ? loadedDaily.current : null,
            attemptId: attemptId.current,
          });
          setSaveState("saved");
          if (mode === "daily") setDailyDone(true);
        } catch {
          setSaveState("error");
        }
        return;
      }

      addLocalPlay({
        fingerprint: puzzle.fingerprint,
        size: puzzle.size,
        regions: puzzle.regions,
        solution: puzzle.solution,
        mode,
        duration_ms: Math.round(durationMs),
        hints,
        moves,
        daily_date: mode === "daily" ? loadedDaily.current : null,
      });
      setSaveState("local");
      if (mode === "daily") setDailyDone(true);
    },
    [user, configured],
  );



  const settings = useSettings();
  const game = useGame({
    onSolved: handleSolved,
    autoMark: settings.autoMark,
    // El cronómetro de verdad lo lleva el servidor desde la primera jugada.
    onStart: (puzzle) => {
      if (!user || !configured) return;
      void startAttempt(puzzle).then((id) => {
        attemptId.current = id;
      });
    },
  });
  // Al terminar, quién más ha hecho este tablero: convierte cada enlace
  // compartido en un duelo.
  useEffect(() => {
    if (!game.solved || !game.puzzle || !configured) return;
    let alive = true;
    const fingerprint = game.puzzle.fingerprint;
    fetchBoardRanking(fingerprint)
      .then((rows) => alive && setDuel(rows))
      .catch(() => alive && setDuel([]));
    fetchBoardStanding(fingerprint)
      .then((row) => alive && setStanding(row))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [game.solved, game.puzzle, configured, saveState]);

  const { loadPuzzle, newGame } = game;
  const started = useRef(false);

  const resetFlags = () => {
    setSaveState("idle");
    setRecord(false);
    setShared(false);
    setShareText("");
    setCopyFailed(false);
    setDuel(null);
    setStanding(null);
    attemptId.current = null;
  };

  const startPractice = useCallback(
    (nextSize: Size) => {
      loadedDaily.current = null;
      resetFlags();
      setBest(bestTime(nextSize));
      void newGame(nextSize, "practice");
    },
    [newGame],
  );

  const startDaily = useCallback(() => {
    // La fecha se toma al pulsar: si la pestaña llevaba abierta desde ayer, el
    // botón sigue dando el puzle de hoy y no el del día anterior.
    const date = todayKey();
    loadedDaily.current = date;
    resetFlags();
    setBest(bestTime(DAILY_SIZE));
    loadPuzzle(dailyFor(date, DAILY_SIZE), "daily");
  }, [loadPuzzle]);

  // Primera carga: tablero compartido por URL, o partida libre.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // ?daily=AAAA-MM-DD abre el puzle de ese día; solo el de hoy cuenta como diario.
    const dayParam = params.get("daily");
    if (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam)) {
      setSize(DAILY_SIZE);
      setBest(bestTime(DAILY_SIZE));
      loadedDaily.current = dayParam === today ? dayParam : null;
      loadPuzzle(dailyFor(dayParam, DAILY_SIZE), dayParam === today ? "daily" : "practice");
      if (dayParam !== today) game.setMessage(t("game.archivedDaily", { date: dayParam }));
      return;
    }

    const boardParam = params.get("board");
    const fromLink = boardParam ? puzzleFromFingerprint(boardParam) : null;
    if (fromLink) {
      setSize(fromLink.size);
      setBest(bestTime(fromLink.size));
      loadPuzzle(fromLink, "practice");
      game.setMessage(t("game.loadedBoard"));
      return;
    }
    setBest(bestTime(size));
    void newGame(size, "practice");
  }, [params, loadPuzzle, newGame, size, game, t, today]);

  // ¿Ya se jugó el diario de hoy?
  useEffect(() => {
    let alive = true;
    if (user && configured) {
      hasPlayedDaily(user.id, today)
        .then((done) => alive && setDailyDone(done))
        .catch(() => alive && setDailyDone(false));
    } else {
      setDailyDone(localDailyDone(today));
    }
    return () => {
      alive = false;
    };
  }, [user, configured, today]);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        game.undo();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "n") startPractice(size);
      else if (key === "h") runHint();
      else if (key === "c") game.clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const runHint = () => {
    const result = game.hint();
    if (result === "removed") game.setMessage(t("game.hintWrong"));
    else if (result === "revealed") game.setMessage(t("game.hintRevealed"));
  };

  /**
   * Compartir sin callejones sin salida: primero el diálogo nativo (móvil),
   * luego el portapapeles y, si el navegador lo bloquea, el enlace a la vista
   * y seleccionado para copiarlo a mano.
   */
  const share = async () => {
    if (!game.puzzle) return;
    const streak = currentStreak(
      new Set(localPlays().filter((play) => play.daily_date).map((play) => play.daily_date as string)),
    );
    const card = buildShareCard({
      puzzle: game.puzzle,
      mode: game.mode,
      durationMs: game.elapsedMs,
      hints: game.hints,
      streak,
      dailyDate: loadedDaily.current,
      origin: window.location.origin,
      t,
      formatDate,
    });
    setShareText(card);

    if (navigator.share) {
      try {
        await navigator.share({ title: t("app.title"), text: card });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return; // lo canceló
      }
    }
    try {
      await navigator.clipboard.writeText(card);
      setShared(true);
      window.setTimeout(() => setShared(false), 2500);
    } catch {
      setCopyFailed(true);
    }
  };

  const saveNote =
    saveState === "saved"
      ? t("win.saved")
      : saveState === "local"
        ? t("win.savedLocal")
        : saveState === "error"
          ? t("win.saveError")
          : saveState === "saving"
            ? t("common.loading")
            : "";

  return (
    <div className="play">
      <section className="panel toolbar">
        <div className="scoreboard">
          <div className="stat">
            <b>{formatTime(game.elapsedMs)}</b>
            <span>{t("game.time")}</span>
          </div>
          <div className="stat">
            <b>
              {game.crowns}/{game.puzzle?.size ?? size}
            </b>
            <span>{t("game.crowns")}</span>
          </div>
          <div className="stat">
            <b>{best ? formatTime(best) : "—"}</b>
            <span>{t("game.best")}</span>
          </div>
        </div>

        <div className="grow" />

        <div className="mode-switch" role="group" aria-label={t("game.mode")}>
          <button
            type="button"
            className={game.mode === "daily" ? "active" : ""}
            onClick={startDaily}
            disabled={game.loading}
          >
            {t("game.daily")}
          </button>
          <button
            type="button"
            className={game.mode === "practice" ? "active" : ""}
            onClick={() => startPractice(size)}
            disabled={game.loading}
          >
            {t("game.practice")}
          </button>
        </div>

        <select
          className="select"
          aria-label={t("game.size")}
          value={game.mode === "daily" ? DAILY_SIZE : size}
          disabled={game.mode === "daily" || game.loading}
          onChange={(event) => {
            const next = Number(event.target.value) as Size;
            setSize(next);
            startPractice(next);
          }}
        >
          {SIZES.map((option) => (
            <option key={option} value={option}>
              {option} × {option}
            </option>
          ))}
        </select>
      </section>


      {game.message ? <p className="note">{game.message}</p> : null}
      {game.mode === "daily" && dailyDone && !game.solved ? <p className="note">{t("game.dailyDone")}</p> : null}

      <div className="board-area">
        {game.loading || !game.puzzle ? (
          <div className="board-placeholder">{t("game.generating")}</div>
        ) : (
          <>
            <Board
              puzzle={game.puzzle}
              cells={game.cells}
              bad={game.bad}
              showConflicts={settings.showConflicts}
              hintCell={game.hintCell}
              frozen={game.solved}
              onCycle={game.cycleCell}
              onPaint={game.paintMark}
            />
            {game.solved ? (
              <div className="win-overlay">
                <div className="win-card">
                  <span className="trophy">👑</span>
                  <h2>{t("win.title")}</h2>
                  <p>{t("win.summary", { size: game.puzzle.size, time: formatTime(game.elapsedMs) })}</p>
                  <div className="win-badges">
                    {record ? <span className="pill accent">{t("win.record")}</span> : null}
                    {game.hints ? <span className="pill">{t("win.hints", { count: game.hints })}</span> : null}
                    {game.mode === "daily" ? <span className="pill">{t("game.daily")}</span> : null}
                  </div>
                  {saveNote ? <p className="muted small">{saveNote}</p> : null}
                  <div className="win-actions">
                    <button type="button" className="button primary" onClick={() => startPractice(size)}>
                      {t("win.again")}
                    </button>
                    <button type="button" className="button" onClick={() => void share()}>
                      {shared ? t("win.copied") : t("win.share")}
                    </button>
                  </div>
                  {shareText && (shared || copyFailed) ? (
                    <div className="share-box">
                      {copyFailed ? <p className="muted small">{t("win.shareFail")}</p> : null}
                      <textarea
                        readOnly
                        rows={4}
                        value={shareText}
                        aria-label={t("win.shareLink")}
                        onFocus={(event) => event.currentTarget.select()}
                        ref={(node) => node?.select()}
                      />
                    </div>
                  ) : null}

                  {configured && standing && standing.place && standing.total > 1 ? (
                    <p className="standing">
                      <strong>{t("standing.place", { place: standing.place, total: standing.total })}</strong>
                      {standing.place === 1
                        ? ` · ${t("standing.best")}`
                        : standing.best_ms && standing.your_ms
                          ? ` · ${t("standing.gap", { gap: formatTime(standing.your_ms - standing.best_ms) })}`
                          : ""}
                    </p>
                  ) : null}

                  {configured && duel && duel.length > 0 ? (
                    <div className="duel">
                      <h3>{t("duel.title")}</h3>
                      <ol>
                        {duel.map((row) => (
                          <li key={row.id} className={row.user_id === user?.id ? "me" : ""}>
                            <span className="duel-name">
                              {row.display_name?.trim() || row.username}
                              {row.user_id === user?.id ? ` (${t("duel.you")})` : ""}
                            </span>
                            <span className="duel-time">
                              {formatTime(row.duration_ms)}
                              {row.verified ? (
                                <span className="verified" title={t("duel.verified")}>
                                  ✓
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <section className="panel toolbar actions">
        <button type="button" className="button" onClick={game.undo} disabled={!game.canUndo || game.loading} title={`${t("game.undo")} · Ctrl+Z`}>
          {t("game.undo")}
        </button>
        <button type="button" className="button" onClick={runHint} disabled={game.loading || game.solved} title={`${t("game.hint")} · H`}>
          {t("game.hint")}
        </button>
        <button type="button" className="button" onClick={game.clear} disabled={game.loading} title={`${t("game.clear")} · C`}>
          {t("game.clear")}
        </button>
        <button
          type="button"
          className="button primary"
          onClick={() => (game.mode === "daily" ? startDaily() : startPractice(size))}
          disabled={game.loading}
          title={`${t("game.new")} · N`}
        >
          {t("game.new")}
        </button>
        <div className="grow" />
        <div className="switches">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.autoMark}
            onChange={(event) => settings.setAutoMark(event.target.checked)}
          />
          {t("game.autoX")}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.showConflicts}
            onChange={(event) => settings.setShowConflicts(event.target.checked)}
          />
          {t("game.showConflicts")}
        </label>
        </div>
      </section>

      <details className="panel rules">
        <summary>{t("rules.title")}</summary>
        <ul>
          <li>{t("rules.oneCrown")}</li>
          <li>{t("rules.noTouch")}</li>
          <li>{t("rules.click")}</li>
          <li>{t("rules.drag")}</li>
          <li>{t("rules.shortcuts")}</li>
          <li>{t("rules.unique")}</li>
        </ul>
      </details>
    </div>
  );
}
