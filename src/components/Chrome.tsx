import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LOCALES, LOCALE_CODES, useI18n, type Locale } from "../i18n";
import { readTheme, saveTheme, type ThemeChoice } from "../lib/localStore";
import { useAuth } from "../features/auth/AuthProvider";

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  const next = () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button type="button" className="icon-button" onClick={next} title={t("theme.toggle")} aria-label={t("theme.toggle")}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 18a6 6 0 1 0 0-12v12z" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function LanguagePicker({ onChange }: { onChange?: (locale: Locale) => void }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <select
      className="select"
      aria-label={t("lang.label")}
      value={locale}
      onChange={(event) => {
        const next = event.target.value as Locale;
        setLocale(next);
        onChange?.(next);
      }}
    >
      {LOCALE_CODES.map((code) => (
        <option key={code} value={code} lang={code}>
          {LOCALES[code].label}
        </option>
      ))}
    </select>
  );
}

export function Header() {
  const { t } = useI18n();
  const { user, profile, guest, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="brand">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 8.5l3.6 3L12 4l5.4 7.5 3.6-3-1.7 9.2H4.7L3 8.5zM4.9 20h14.2v1.6H4.9V20z" />
        </svg>
        <div>
          <strong>{t("app.title")}</strong>
          <span>{t("app.tagline")}</span>
        </div>
      </div>

      <nav className="tabs">
        <NavLink to="/" end>
          {t("nav.play")}
        </NavLink>
        <NavLink to="/history">{t("nav.history")}</NavLink>
        <NavLink to="/community">{t("nav.community")}</NavLink>
        <NavLink to={user ? "/profile" : "/auth"}>{user ? t("nav.profile") : t("nav.signIn")}</NavLink>
      </nav>

      <div className="header-actions">
        <LanguagePicker />
        <ThemeToggle />
        {user ? (
          <button type="button" className="button ghost" onClick={() => void signOut()}>
            {t("nav.signOut")}
          </button>
        ) : guest ? (
          <span className="pill">{t("nav.guest")}</span>
        ) : null}
      </div>
      {user && profile ? <p className="header-user">{t("auth.signedInAs", { name: profile.username })}</p> : null}
    </header>
  );
}
