import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LOCALES, LOCALE_CODES, useI18n, type Locale } from "../../i18n";
import { formatTime } from "../../components/format";
import { Identicon } from "../../components/Identicon";
import { BoardPreview } from "../../components/Board";
import { SkeletonList } from "../../components/Skeleton";
import { boardFromFingerprint } from "../../game/generator";
import { useAuth } from "../auth/AuthProvider";
import { fetchMyBestBySize, fetchMyPlays, fetchPlayerStats, updateProfile } from "../../lib/api";
import type { PlayRow, PlayerStats, SizeRankRow } from "../../lib/types";
import { localPlays } from "../../lib/localStore";

/** Nombres presentables de los proveedores. */
const PROVIDER_NAMES: Record<string, string> = {
  email: "Email",
  github: "GitHub",
  google: "Google",
};

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-tile">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** Perfil de quien juega sin cuenta: lo que hay en este navegador. */
function GuestProfile() {
  const { t, timeAgo } = useI18n();
  const plays = localPlays();
  const best = plays.length ? Math.min(...plays.map((play) => play.duration_ms)) : null;

  return (
    <div className="stack">
      <section className="panel profile-head">
        <Identicon seed="invitado" size={62} />
        <div className="profile-id">
          <h1>{t("nav.guest")}</h1>
          <p className="muted small">{t("profile.guest")}</p>
        </div>
        <Link className="button primary" to="/auth">
          {t("nav.signIn")}
        </Link>
      </section>

      <section className="panel stack">
        <div className="tiles">
          <StatTile value={plays.length} label={t("stats.solved")} />
          <StatTile value={best ? formatTime(best) : "—"} label={t("stats.best")} />
          <StatTile value={plays.filter((p) => p.mode === "daily").length} label={t("stats.dailies")} />
          <StatTile value={plays.filter((p) => !p.hints).length} label={t("stats.clean")} />
        </div>
      </section>

      {plays.length ? (
        <section className="panel stack">
          <div className="row">
            <h2>{t("profile.recent")}</h2>
            <div className="grow" />
            <Link className="link" to="/history">
              {t("profile.seeAll")}
            </Link>
          </div>
          <ul className="feed">
            {plays.slice(0, 5).map((play) => (
              <li key={play.id}>
                <BoardPreview size={play.size} regions={play.regions} />
                <div className="feed-main">
                  <span>
                    {play.size}×{play.size} · {formatTime(play.duration_ms)}
                  </span>
                  <span className="muted small">{timeAgo(play.created_at)}</span>
                </div>
                <Link className="link" to={`/?board=${encodeURIComponent(play.fingerprint)}`}>
                  {t("history.replay")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function ProfilePage() {
  const { t, formatDate, timeAgo, setLocale } = useI18n();
  const { user, profile, applyProfile, configured, signOut } = useAuth();

  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [locale, setProfileLocale] = useState<Locale>(profile?.locale ?? "es");
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [bests, setBests] = useState<SizeRankRow[]>([]);
  const [recent, setRecent] = useState<PlayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setDisplayName(profile.display_name ?? "");
    setProfileLocale(profile.locale);
  }, [profile]);

  useEffect(() => {
    if (!user || !configured) return;
    let alive = true;
    setLoading(true);
    Promise.all([fetchPlayerStats(user.id), fetchMyBestBySize(user.id), fetchMyPlays(user.id, 5)])
      .then(([playerStats, bestList, plays]) => {
        if (!alive) return;
        setStats(playerStats);
        setBests(bestList);
        setRecent(plays);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, configured]);

  if (!user) return <GuestProfile />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    updateProfile(user.id, { username, display_name: displayName.trim() || null, locale })
      .then((next) => {
        applyProfile(next);
        setLocale(next.locale);
        setSaved(true);
      })
      .catch((cause: { code?: string; message?: string }) => {
        setError(cause.code === "23505" ? t("profile.usernameTaken") : (cause.message ?? t("common.error")));
      })
      .finally(() => setBusy(false));
  };

  const name = profile?.display_name?.trim() || profile?.username || "";
  const slowest = Math.max(...bests.map((row) => row.best_ms ?? 0), 1);

  return (
    <div className="stack">
      <section className="panel profile-head">
        <Identicon seed={user.id} size={62} />
        <div className="profile-id">
          <h1>{name}</h1>
          {profile ? (
            <p className="muted small">
              {t("profile.member", { name: profile.username, date: formatDate(profile.created_at) })}
            </p>
          ) : null}
        </div>
        <label className="field inline">
          <span className="muted small">{t("profile.language")}</span>
          <select
            className="select"
            value={locale}
            onChange={(event) => {
              const next = event.target.value as Locale;
              setProfileLocale(next);
              setLocale(next);
              // el idioma se guarda solo: es una preferencia, no un formulario
              updateProfile(user.id, { locale: next })
                .then(applyProfile)
                .catch(() => undefined);
            }}
          >
            {LOCALE_CODES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LOCALES[code].label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="button ghost" onClick={() => void signOut()}>
          {t("nav.signOut")}
        </button>
      </section>

      <section className="panel">
        <div className="tiles">
          <StatTile value={stats?.solved ?? 0} label={t("stats.solved")} />
          <StatTile value={stats?.best_ms ? formatTime(stats.best_ms) : "—"} label={t("stats.best")} />
          <StatTile value={stats?.avg_ms ? formatTime(stats.avg_ms) : "—"} label={t("stats.avg")} />
          <StatTile value={stats?.dailies ?? 0} label={t("stats.dailies")} />
          <StatTile value={stats?.clean_solves ?? 0} label={t("stats.clean")} />
        </div>
      </section>

      <section className="panel stack">
        <div className="row">
          <h2>{t("profile.bests")}</h2>
          <div className="grow" />
          <span className="muted small">{t("profile.bestsNote")}</span>
        </div>
        {loading ? (
          <SkeletonList rows={3} thumb={false} />
        ) : bests.length === 0 ? (
          <p className="muted">{t("profile.noPlays")}</p>
        ) : (
          <ul className="bars">
            {bests.map((row) => (
              <li key={row.size}>
                <span className="bar-label">
                  {row.size}×{row.size}
                </span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.max(6, ((row.best_ms ?? 0) / slowest) * 100)}%` }}
                  />
                </span>
                <span className="bar-value">{row.best_ms ? formatTime(row.best_ms) : "—"}</span>
                <span className="muted small bar-count">{row.solved}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel stack">
        <div className="row">
          <h2>{t("profile.recent")}</h2>
          <div className="grow" />
          <Link className="link" to="/history">
            {t("profile.seeAll")}
          </Link>
        </div>
        {loading ? (
          <SkeletonList rows={3} />
        ) : recent.length === 0 ? (
          <p className="muted">{t("profile.noPlays")}</p>
        ) : (
          <ul className="feed">
            {recent.map((play) => {
              const board = play.puzzles ? boardFromFingerprint(play.puzzles.fingerprint) : null;
              return (
                <li key={play.id}>
                  {board ? <BoardPreview size={board.size} regions={board.regions} /> : null}
                  <div className="feed-main">
                    <span>
                      {play.puzzles?.size}×{play.puzzles?.size} · {formatTime(play.duration_ms)}
                      {play.mode === "daily" ? <span className="pill small">{t("game.daily")}</span> : null}
                    </span>
                    <span className="muted small">{timeAgo(play.created_at)}</span>
                  </div>
                  {play.puzzles ? (
                    <Link className="link" to={`/?board=${encodeURIComponent(play.puzzles.fingerprint)}`}>
                      {t("history.replay")}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel stack tight">
        <div className="row wrap">
          <h2>{t("profile.identities")}</h2>
          <div className="grow" />
          <span className="muted small">{user.email}</span>
        </div>
        <ul className="identities">
          {(user.identities ?? []).map((identity) => (
            <li key={identity.identity_id ?? identity.provider}>
              <span className="pill accent">{PROVIDER_NAMES[identity.provider] ?? identity.provider}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">{t("profile.identityNote")}</p>
      </section>

      <details className="panel">
        <summary>{t("profile.edit")}</summary>
        <form className="stack" style={{ marginTop: 14 }} onSubmit={onSubmit}>
          <label className="field">
            {t("profile.username")}
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              pattern="[a-zA-Z0-9_-]{3,20}"
              title={t("profile.usernameRule")}
              required
            />
            <small className="muted">{t("profile.usernameRule")}</small>
          </label>

          <label className="field">
            {t("profile.displayName")}
            <input value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} />
          </label>

          <div className="row">
            <button type="submit" className="button primary" disabled={busy}>
              {t("profile.save")}
            </button>
            {saved ? <span className="notice">{t("profile.saved")}</span> : null}
            {error ? <span className="error">{error}</span> : null}
          </div>
        </form>
      </details>
    </div>
  );
}
