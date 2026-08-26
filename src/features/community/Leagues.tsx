import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { formatTime } from "../../components/format";
import { SkeletonList } from "../../components/Skeleton";
import { useAuth } from "../auth/AuthProvider";
import {
  createLeague,
  fetchLeagueDaily,
  fetchLeagueMonthly,
  fetchMyLeagues,
  joinLeague,
  leaveLeague,
  monthKey,
  rankingTime,
} from "../../lib/api";
import type { DailyRankRow, League, MonthRankRow } from "../../lib/types";

/**
 * Ligas privadas: un grupo cerrado con su propio ranking del puzle del día.
 * Se entra con un código de seis caracteres, igual que se comparte un tablero.
 */
export function Leagues({ today }: { today: string }) {
  const { t } = useI18n();
  const { user, configured } = useAuth();

  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ranking, setRanking] = useState<DailyRankRow[] | null>(null);
  const [season, setSeason] = useState<MonthRankRow[] | null>(null);
  const [tab, setTab] = useState<"today" | "month">("today");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const reload = () =>
    fetchMyLeagues()
      .then((rows) => {
        setLeagues(rows);
        setSelected((current) => current ?? rows[0]?.id ?? null);
      })
      .catch(() => setLeagues([]));

  useEffect(() => {
    if (!user || !configured) {
      setLeagues([]);
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, configured]);

  useEffect(() => {
    if (!selected) {
      setRanking(null);
      setSeason(null);
      return;
    }
    let alive = true;
    setRanking(null);
    setSeason(null);
    fetchLeagueDaily(selected, today)
      .then((rows) => alive && setRanking(rows))
      .catch(() => alive && setRanking([]));
    // Aparte, por lo mismo: sin la migración 0005 la vista mensual no existe.
    fetchLeagueMonthly(selected, monthKey())
      .then((rows) => alive && setSeason(rows))
      .catch(() => alive && setSeason([]));
    return () => {
      alive = false;
    };
  }, [selected, today]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(/LEAGUE_NOT_FOUND/.test(message) ? t("league.notFound") : message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const league = await createLeague(name);
      setName("");
      setSelected(league.id);
    });
  };

  const onJoin = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const league = await joinLeague(code);
      setCode("");
      setSelected(league.id);
    });
  };

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      /* sin portapapeles: el código está a la vista de todas formas */
    }
  };

  if (!configured) return null;

  if (!user) {
    return (
      <section className="panel stack">
        <h2>{t("league.title")}</h2>
        <p className="muted">{t("league.signIn")}</p>
        <Link className="button primary" to="/auth">
          {t("nav.signIn")}
        </Link>
      </section>
    );
  }

  const current = leagues?.find((league) => league.id === selected) ?? null;

  return (
    <section className="panel stack">
      <div className="stack tight">
        <h2>{t("league.title")}</h2>
        <p className="muted small">{t("league.subtitle")}</p>
      </div>

      {leagues === null ? (
        <SkeletonList rows={2} thumb={false} />
      ) : leagues.length === 0 ? (
        <p className="muted">{t("league.empty")}</p>
      ) : (
        <ul className="league-list">
          {leagues.map((league) => (
            <li key={league.id} className={league.id === selected ? "active" : ""}>
              <button type="button" className="league-pick" onClick={() => setSelected(league.id)}>
                <strong>{league.name}</strong>
                <span className="muted small">{t("league.members", { count: league.members })}</span>
              </button>
              <button
                type="button"
                className="code"
                onClick={() => void copyCode(league.code)}
                title={t("league.code")}
              >
                {copied === league.code ? t("league.copied") : league.code}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="league-forms">
        <form className="row" onSubmit={onCreate}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("league.name")}
            aria-label={t("league.name")}
            minLength={2}
            maxLength={40}
            required
          />
          <button type="submit" className="button" disabled={busy}>
            {t("league.create")}
          </button>
        </form>

        <form className="row" onSubmit={onJoin}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t("league.code")}
            aria-label={t("league.code")}
            pattern="[A-Za-z0-9]{6}"
            maxLength={6}
            required
          />
          <button type="submit" className="button" disabled={busy}>
            {t("league.join")}
          </button>
        </form>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {current ? (
        <div className="stack tight">
          <div className="row">
            <h3 className="league-ranking-title">{t("league.ranking", { name: current.name })}</h3>
            <div className="grow" />
            <button
              type="button"
              className="link"
              onClick={() => void run(() => leaveLeague(current.id, user.id).then(() => setSelected(null)))}
            >
              {t("league.leave")}
            </button>
          </div>

          <div className="mode-switch small-switch" role="group">
            <button type="button" className={tab === "today" ? "active" : ""} onClick={() => setTab("today")}>
              {t("league.tabToday")}
            </button>
            <button type="button" className={tab === "month" ? "active" : ""} onClick={() => setTab("month")}>
              {t("league.tabMonth")}
            </button>
          </div>

          {tab === "today" ? (
            ranking === null ? (
              <SkeletonList rows={2} thumb={false} />
            ) : ranking.length === 0 ? (
              <p className="muted">{t("league.noPlays")}</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("table.rank")}</th>
                      <th>{t("community.player")}</th>
                      <th className="numeric">{t("community.time")}</th>
                      <th className="numeric">{t("table.hints")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((row, index) => (
                      <tr key={row.user_id} className={row.user_id === user.id ? "me" : ""}>
                        <td>
                          <span className={`rank${index < 3 ? ` top${index + 1}` : ""}`}>{index + 1}</span>
                        </td>
                        <td>{row.display_name?.trim() || row.username}</td>
                        <td
                          className="numeric"
                          title={
                            row.hints
                              ? t("rank.realTime", { time: formatTime(row.duration_ms), count: row.hints })
                              : undefined
                          }
                        >
                          {formatTime(rankingTime(row))}
                          {row.hints ? <span className="muted"> *</span> : null}
                        </td>
                        <td className="numeric">{row.hints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : season === null ? (
            <SkeletonList rows={2} thumb={false} />
          ) : season.length === 0 ? (
            <p className="muted">{t("season.empty")}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("table.rank")}</th>
                    <th>{t("community.player")}</th>
                    <th className="numeric">{t("season.points")}</th>
                    <th className="numeric">{t("season.days")}</th>
                  </tr>
                </thead>
                <tbody>
                  {season.map((row, index) => (
                    <tr key={row.user_id} className={row.user_id === user.id ? "me" : ""}>
                      <td>
                        <span className={`rank${index < 3 ? ` top${index + 1}` : ""}`}>{index + 1}</span>
                      </td>
                      <td>{row.display_name?.trim() || row.username}</td>
                      <td className="numeric">{row.points}</td>
                      <td className="numeric">{row.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
