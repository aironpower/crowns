import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { formatTime } from "../../components/format";
import { BoardPreview } from "../../components/Board";
import { SkeletonList } from "../../components/Skeleton";
import { boardFromFingerprint } from "../../game/generator";
import { useAuth } from "../auth/AuthProvider";
import { fetchActivity, fetchDailyRanking, fetchSizeRanking } from "../../lib/api";
import type { ActivityRow, DailyRankRow, SizeRankRow } from "../../lib/types";
import { SIZES, type Size } from "../../game/types";
import { todayKey } from "../../game/rng";
import { supabase } from "../../lib/supabase";

export function CommunityPage() {
  const { t, timeAgo } = useI18n();
  const { configured, user } = useAuth();
  const today = todayKey();

  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [daily, setDaily] = useState<DailyRankRow[]>([]);
  const [bySize, setBySize] = useState<SizeRankRow[]>([]);
  const [size, setSize] = useState<Size>(8);
  const [loading, setLoading] = useState(configured);
  const [sizeLoading, setSizeLoading] = useState(configured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    setLoading(true);
    Promise.all([fetchActivity(), fetchDailyRanking(today)])
      .then(([rows, ranking]) => {
        if (!alive) return;
        setActivity(rows);
        setDaily(ranking);
      })
      .catch(() => alive && setError(t("common.error")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [configured, today, t]);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    setSizeLoading(true);
    fetchSizeRanking(size)
      .then((rows) => alive && setBySize(rows))
      .catch(() => undefined)
      .finally(() => alive && setSizeLoading(false));
    return () => {
      alive = false;
    };
  }, [configured, size]);

  // Actividad en vivo: si realtime está activo, las partidas nuevas entran solas.
  useEffect(() => {
    const client = supabase;
    if (!configured || !client) return;
    const channel = client
      .channel("plays-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plays" }, () => {
        fetchActivity()
          .then(setActivity)
          .catch(() => undefined);
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [configured]);

  if (!configured) {
    return (
      <section className="panel stack">
        <h1>{t("community.title")}</h1>
        <p className="muted">{t("db.offline")}</p>
        <p className="muted small">{t("db.setup")}</p>
      </section>
    );
  }

  const name = (row: { username: string; display_name: string | null; user_id: string }) =>
    (row.display_name?.trim() || row.username) + (user?.id === row.user_id ? ` (${t("common.you")})` : "");

  return (
    <div className="stack">
      <section className="panel stack">
        <h1>{t("community.title")}</h1>
        {error ? <p className="error">{error}</p> : null}

        <h2>{t("community.activity")}</h2>
        {loading ? (
          <SkeletonList rows={4} />
        ) : activity.length === 0 ? (
          <p className="muted">{t("community.emptyActivity")}</p>
        ) : (
          <ul className="feed">
            {activity.map((row) => {
              const board = boardFromFingerprint(row.fingerprint);
              return (
                <li key={row.id}>
                  {board ? <BoardPreview size={board.size} regions={board.regions} /> : null}
                  <div className="feed-main">
                    <span>
                      <strong>{name(row)}</strong>{" "}
                      {t("community.solvedLine", { size: row.size, time: formatTime(row.duration_ms) })}
                      {row.mode === "daily" ? <span className="pill small">{t("game.daily")}</span> : null}
                    </span>
                    <span className="muted small">
                      {timeAgo(row.created_at)}
                      {row.hints ? ` · ${t("community.withHints", { count: row.hints })}` : ""}
                    </span>
                  </div>
                  <div className="feed-side">
                    <Link className="link" to={`/?board=${encodeURIComponent(row.fingerprint)}`}>
                      {t("community.playBoard")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel stack">
        <h2>{t("community.dailyRanking")}</h2>
        {loading ? (
          <SkeletonList rows={3} thumb={false} />
        ) : daily.length === 0 ? (
          <p className="muted">{t("community.emptyDaily")}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("table.rank")}</th>
                  <th>{t("community.player")}</th>
                  <th>{t("community.time")}</th>
                  <th>{t("table.hints")}</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row, index) => (
                  <tr key={row.user_id} className={user?.id === row.user_id ? "me" : ""}>
                    <td>
                      <span className={`rank${index < 3 ? ` top${index + 1}` : ""}`}>{index + 1}</span>
                    </td>
                    <td>{name(row)}</td>
                    <td className="numeric">{formatTime(row.duration_ms)}</td>
                    <td className="numeric">{row.hints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel stack">
        <div className="row">
          <h2>{t("community.bySize")}</h2>
          <div className="grow" />
          <select className="select" value={size} onChange={(event) => setSize(Number(event.target.value) as Size)}>
            {SIZES.map((option) => (
              <option key={option} value={option}>
                {option} × {option}
              </option>
            ))}
          </select>
        </div>
        {sizeLoading ? (
          <SkeletonList rows={3} thumb={false} />
        ) : bySize.length === 0 ? (
          <p className="muted">{t("community.emptyActivity")}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("table.rank")}</th>
                  <th>{t("community.player")}</th>
                  <th>{t("community.time")}</th>
                  <th>{t("community.solvedCount")}</th>
                </tr>
              </thead>
              <tbody>
                {bySize.map((row, index) => (
                  <tr key={row.user_id} className={user?.id === row.user_id ? "me" : ""}>
                    <td>
                      <span className={`rank${index < 3 ? ` top${index + 1}` : ""}`}>{index + 1}</span>
                    </td>
                    <td>{name(row)}</td>
                    <td className="numeric">{row.best_ms ? formatTime(row.best_ms) : "—"}</td>
                    <td className="numeric">{row.solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
