import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { formatTime } from "../../components/format";
import { BoardPreview } from "../../components/Board";
import { SkeletonList } from "../../components/Skeleton";
import { boardFromFingerprint } from "../../game/generator";
import { useAuth } from "../auth/AuthProvider";
import { fetchMyPlays, submitPlay } from "../../lib/api";
import type { PlayRow } from "../../lib/types";
import { clearLocalPlays, localPlays } from "../../lib/localStore";

interface Entry {
  key: string;
  when: string;
  size: number;
  mode: string;
  durationMs: number;
  hints: number;
  fingerprint: string;
  local: boolean;
}

export function HistoryPage() {
  const { t, timeAgo } = useI18n();
  const { user, configured } = useAuth();

  const [remote, setRemote] = useState<PlayRow[]>([]);
  const [local, setLocal] = useState(() => localPlays());
  const [loading, setLoading] = useState(Boolean(user && configured));
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !configured) {
      setRemote([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchMyPlays(user.id)
      .then((rows) => alive && setRemote(rows))
      .catch(() => alive && setError(t("common.error")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, configured, t, uploaded]);

  const entries: Entry[] = [
    ...remote.map((play) => ({
      key: play.id,
      when: play.created_at,
      size: play.puzzles?.size ?? 0,
      mode: play.mode,
      durationMs: play.duration_ms,
      hints: play.hints,
      fingerprint: play.puzzles?.fingerprint ?? "",
      local: false,
    })),
    ...local.map((play) => ({
      key: play.id,
      when: play.created_at,
      size: play.size,
      mode: play.mode,
      durationMs: play.duration_ms,
      hints: play.hints,
      fingerprint: play.fingerprint,
      local: true,
    })),
  ].sort((a, b) => b.when.localeCompare(a.when));

  /** Sube al servidor las partidas que se jugaron como invitado. */
  const upload = async () => {
    setUploading(true);
    setError("");
    let done = 0;
    try {
      for (const play of local) {
        await submitPlay({
          puzzle: {
            size: play.size,
            regions: play.regions,
            solution: play.solution,
            fingerprint: play.fingerprint,
          },
          durationMs: play.duration_ms,
          hints: play.hints,
          moves: play.moves,
          mode: play.mode,
          dailyDate: play.daily_date,
        });
        done++;
      }
      clearLocalPlays();
      setLocal([]);
      setUploaded(done);
    } catch {
      setError(t("common.error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel stack">
        <h1>{t("history.title")}</h1>

        {local.length > 0 ? (
          <div className="row wrap">
            <span className="muted">{t("history.localNotice", { count: local.length })}</span>
            {user && configured ? (
              <button type="button" className="button" onClick={() => void upload()} disabled={uploading}>
                {uploading ? t("common.loading") : t("history.upload")}
              </button>
            ) : null}
          </div>
        ) : null}
        {uploaded ? <p className="notice">{t("history.uploaded", { count: uploaded })}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {loading ? (
          <SkeletonList rows={5} />
        ) : entries.length === 0 ? (
          <p className="muted">{t("history.empty")}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>{t("table.when")}</th>
                  <th>{t("table.size")}</th>
                  <th>{t("table.mode")}</th>
                  <th>{t("community.time")}</th>
                  <th>{t("table.hints")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const board = boardFromFingerprint(entry.fingerprint);
                  return (
                  <tr key={entry.key}>
                    <td>{board ? <BoardPreview size={board.size} regions={board.regions} /> : null}</td>
                    <td>
                      {timeAgo(entry.when)}
                      {entry.local ? <span className="pill small">{t("history.localBadge")}</span> : null}
                    </td>
                    <td>
                      {entry.size}×{entry.size}
                    </td>
                    <td>{entry.mode === "daily" ? t("game.daily") : t("game.practice")}</td>
                    <td className="numeric">{formatTime(entry.durationMs)}</td>
                    <td className="numeric">{entry.hints}</td>
                    <td>
                      {entry.fingerprint ? (
                        <Link className="link" to={`/?board=${encodeURIComponent(entry.fingerprint)}`}>
                          {t("history.replay")}
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
