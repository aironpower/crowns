import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useAuth } from "./AuthProvider";
import { enabledProviders, type OAuthProvider } from "../../lib/oauth";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
    <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
    <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.8 6.1l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
  </svg>
);

export function AuthPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { configured, signIn, signUp, signInWithMagicLink, signInWithOAuth, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Solo enseñamos los proveedores realmente activados en Supabase: un botón que
  // lleva a una página de error es peor que no tener botón.
  const [providers, setProviders] = useState<OAuthProvider[] | null>(null);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    enabledProviders()
      .then((list) => alive && setProviders(list))
      .catch(() => alive && setProviders([]));
    return () => {
      alive = false;
    };
  }, [configured]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(/provider is not enabled|Unsupported provider/i.test(message) ? t("auth.oauthUnavailable") : message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (mode === "signIn") {
        await signIn(email, password);
        navigate("/");
      } else {
        const { needsConfirmation } = await signUp(email, password, locale);
        if (needsConfirmation) setNotice(t("auth.confirmSent"));
        else navigate("/");
      }
    });
  };

  const oauth = (provider: OAuthProvider) => void run(() => signInWithOAuth(provider));

  if (!configured) {
    return (
      <section className="panel stack">
        <h1>{t("auth.title")}</h1>
        <p className="muted">{t("db.offline")}</p>
        <p className="muted">{t("db.setup")}</p>
        <button type="button" className="button primary" onClick={() => navigate("/")}>
          {t("auth.guest")}
        </button>
      </section>
    );
  }

  return (
    <section className="panel stack auth">
      <div>
        <h1>{t("auth.title")}</h1>
        <p className="muted">{t("auth.subtitle")}</p>
      </div>

      {providers === null || providers.length ? (
        <>
          <div className="oauth">
            {(providers ?? ["google", "github"]).map((provider) => (
              <button
                key={provider}
                type="button"
                className="button"
                onClick={() => oauth(provider)}
                disabled={busy || providers === null}
              >
                {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
                {t(provider === "google" ? "auth.google" : "auth.github")}
              </button>
            ))}
          </div>

          <div className="divider">
            <span>{t("auth.or")}</span>
          </div>
        </>
      ) : null}

      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          {t("auth.email")}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          {t("auth.password")}
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="row">
          <button type="submit" className="button primary" disabled={busy}>
            {mode === "signIn" ? t("auth.signIn") : t("auth.signUp")}
          </button>
          <button
            type="button"
            className="button"
            disabled={busy || !email}
            onClick={() =>
              void run(async () => {
                await signInWithMagicLink(email);
                setNotice(t("auth.magicSent"));
              })
            }
          >
            {t("auth.magicLink")}
          </button>
        </div>
      </form>

      <button type="button" className="link" onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
        {mode === "signIn" ? t("auth.toSignUp") : t("auth.toSignIn")}
      </button>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}

      <div className="divider">
        <span>{t("auth.or")}</span>
      </div>

      <div className="stack tight">
        <button
          type="button"
          className="button ghost"
          onClick={() => {
            continueAsGuest();
            navigate("/");
          }}
        >
          {t("auth.guest")}
        </button>
        <p className="muted small">{t("auth.guestNote")}</p>
      </div>
    </section>
  );
}
