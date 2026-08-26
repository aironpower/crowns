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
          <Link to="/privacy">{t("legal.privacy")}</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/terms">{t("legal.terms")}</Link>
        </p>
      </footer>
    </div>
  );
}
