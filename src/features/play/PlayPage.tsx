import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Board } from "../../components/Board";
import { formatTime } from "../../components/format";
import { useI18n } from "../../i18n";
import { useAuth } from "../auth/AuthProvider";
import { dailyPuzzle, puzzleFromFingerprint } from "../../game/generator";
import { todayKey } from "../../game/rng";
import { SIZES, type Size } from "../../game/types";
import { useGame, type SolveSummary } from "../../game/useGame";
import { addLocalPlay, bestTime, localDailyDone, saveBestTime } from "../../lib/localStore";
import { hasPlayedDaily, submitPlay } from "../../lib/api";

type SaveState = "idle" | "saving" | "saved" | "local" | "error";

const DAILY_SIZE: Size = 8;

export function PlayPage() {
  const { t } = useI18n();
  const { user, configured } = useAuth();
  const [params, setParams] = useSearchParams();

  const [size, setSize] = useState<Size>(8);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [record, setRecord] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  const [shared, setShared] = useState(false);
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
            dailyDate: mode === "daily" ? today : null,
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
        daily_date: mode === "daily" ? today : null,
      });
      setSaveState("local");
      if (mode === "daily") setDailyDone(true);
    },
    [user, configured, today],
  );

  const game = useGame({ onSolved: handleSolved });
  const { loadPuzzle, newGame } = game;
  const started = useRef(false);

  const resetFlags = () => {
    setSaveState("idle");
    setRecord(false);
    setShared(false);
  };

  const startPractice = useCallback(
    (nextSize: Size) => {
      resetFlags();
      setBest(bestTime(nextSize));
      void newGame(nextSize, "practice");
    },
    [newGame],
  );

  const startDaily = useCallback(() => {
    resetFlags();
    setBest(bestTime(DAILY_SIZE));
    loadPuzzle(dailyPuzzle(today, DAILY_SIZE), "daily");
  }, [loadPuzzle, today]);

  // Primera carga: tablero compartido por URL, o partida libre.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
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
  }, [params, loadPuzzle, newGame, size, game, t]);

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

  const share = async () => {
    if (!game.puzzle) return;
    const url = `${window.location.origin}${window.location.pathname}?board=${encodeURIComponent(game.puzzle.fingerprint)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2500);
    } catch {
      setParams({ board: game.puzzle.fingerprint });
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

      <section className="panel toolbar">
        <button type="button" className="button" onClick={game.undo} disabled={!game.canUndo || game.loading}>
          {t("game.undo")}
        </button>
        <button type="button" className="button" onClick={runHint} disabled={game.loading || game.solved}>
          {t("game.hint")}
        </button>
        <button type="button" className="button" onClick={game.clear} disabled={game.loading}>
          {t("game.clear")}
        </button>
        <button
          type="button"
          className="button primary"
          onClick={() => (game.mode === "daily" ? startDaily() : startPractice(size))}
          disabled={game.loading}
        >
          {t("game.new")}
        </button>
        <div className="grow" />
        <label className="toggle">
          <input type="checkbox" checked={game.autoMark} onChange={(e) => game.setAutoMark(e.target.checked)} />
          {t("game.autoX")}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={game.showConflicts}
            onChange={(e) => game.setShowConflicts(e.target.checked)}
          />
          {t("game.showConflicts")}
        </label>
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
              showConflicts={game.showConflicts}
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
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

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
