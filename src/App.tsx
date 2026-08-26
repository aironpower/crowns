import { useEffect, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Chrome";
import { PlayPage } from "./features/play/PlayPage";
import { HistoryPage } from "./features/history/HistoryPage";
import { CommunityPage } from "./features/community/CommunityPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { AuthPage } from "./features/auth/AuthPage";
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
            <Route path="*" element={<PlayPage />} />
          </Routes>
        )}
      </main>
      <footer className="site-footer">
        Crowns · {t("rules.unique")}
      </footer>
    </div>
  );
}
