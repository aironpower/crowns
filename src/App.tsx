import { useEffect, useRef } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Header } from "./components/Chrome";
import { PlayPage } from "./features/play/PlayPage";
import { HistoryPage } from "./features/history/HistoryPage";
import { CommunityPage } from "./features/community/CommunityPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { AuthPage } from "./features/auth/AuthPage";
import { LegalPage } from "./features/legal/LegalPage";
import { useAuth } from "./features/auth/AuthProvider";
import { useI18n } from "./i18n";
import { isSupabaseConfigured } from "./lib/supabase";
import { SITE, donationsEnabled } from "./config/site";

export default function App() {
  const { t, setLocale } = useI18n();
  const { profile, ready } = useAuth();
  const appliedProfileLocale = useRef(false);

  // Al entrar con una cuenta, el idioma guardado en el perfil manda (una vez).
  useEffect(() => {
    if (profile && !appliedProfileLocale.current) {
      appliedProfileLocale.current = true;
      setLocale(profile.locale);
    }
  }, [profile, setLocale]);

  return (
    <div className="app">
      <Header />
      {!isSupabaseConfigured ? <p className="banner">{t("db.offline")}</p> : null}
      <main>
        {!ready ? (
          <p className="muted">{t("common.loading")}</p>
        ) : (
          <Routes>
            <Route path="/" element={<PlayPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/terms" element={<LegalPage kind="terms" />} />
            <Route path="*" element={<PlayPage />} />
          </Routes>
        )}
      </main>
      <footer className="site-footer">
        <p>Crowns · {t("rules.unique")}</p>
        <p className="legal-links">
          {/* enlace normal, no del router: la guía es una página estática */}
          <a href={t("footer.howToUrl")}>{t("footer.howTo")}</a>
          <span aria-hidden="true"> · </span>
          <Link to="/privacy">{t("legal.privacy")}</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/terms">{t("legal.terms")}</Link>
        </p>
        <p>
          {t("footer.madeBy")}{" "}
          <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
            {SITE.author}
          </a>
        </p>
        {donationsEnabled() ? (
          <p className="donate">
            <a className="donate-link" href={SITE.donateUrl} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7.5-4.7-9.6-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.6 12c-2.1 4.3-9.6 9-9.6 9z" />
              </svg>
              {t("donate.link")}
            </a>
            <span className="muted small">{t("donate.hint")}</span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}
