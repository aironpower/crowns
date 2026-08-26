import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LOCALES, LOCALE_CODES, useI18n, type Locale } from "../i18n";
import { readTheme, saveTheme, type ThemeChoice } from "../lib/localStore";
import { useAuth } from "../features/auth/AuthProvider";
import { Identicon } from "./Identicon";

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

/** Desplegable de idiomas. Se usa en el perfil, donde hay sitio para él. */
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

/**
 * Idioma en la cabecera para quien no ha entrado: un icono que despliega la
 * lista. Ocupa lo que un botón, que es lo que hace falta en un móvil. Con la
 * sesión iniciada el idioma se cambia desde el perfil y viaja con la cuenta.
 */
export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="language-menu" ref={box}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((value) => !value)}
        title={t("lang.change")}
        aria-label={t("lang.change")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
        </svg>
      </button>

      {open ? (
        <ul className="language-list" role="menu">
          {LOCALE_CODES.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={code === locale}
                lang={code}
                className={code === locale ? "active" : ""}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
              >
                {LOCALES[code].label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const { user, profile } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label={t("app.title")}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 8.5l3.6 3L12 4l5.4 7.5 3.6-3-1.7 9.2H4.7L3 8.5zM4.9 20h14.2v1.6H4.9V20z" />
        </svg>
        <div>
          <strong>{t("app.title")}</strong>
          <span>{t("app.tagline")}</span>
        </div>
      </Link>

      {/* Navegación en el centro; a la derecha solo ajustes. La sesión se ve en
          la propia pestaña de perfil, con el avatar y el nombre. */}
      <nav className="tabs">
        <NavLink to="/" end>
          {t("nav.play")}
        </NavLink>
        <NavLink to="/history">{t("nav.history")}</NavLink>
        <NavLink to="/community">{t("nav.community")}</NavLink>
        <NavLink
          to={user ? "/profile" : "/auth"}
          className="tab-account"
          title={profile ? t("auth.signedInAs", { name: profile.username }) : undefined}
        >
          {user && profile ? (
            <>
              <Identicon seed={user.id} size={20} />
              <span className="tab-account-name">{profile.username}</span>
            </>
          ) : (
            t("nav.signIn")
          )}
        </NavLink>
      </nav>

      <div className="header-actions">
        {user ? null : <LanguageMenu />}
        <ThemeToggle />
      </div>
    </header>
  );
}
