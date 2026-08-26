import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { fetchProfile } from "../../lib/api";
import type { Profile } from "../../lib/types";
import { isGuest, setGuest } from "../../lib/localStore";
import type { Locale } from "../../i18n";
import type { OAuthProvider } from "../../lib/oauth";

interface AuthValue {
  /** false mientras se recupera la sesión guardada */
  ready: boolean;
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  guest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, locale: Locale) => Promise<{ needsConfirmation: boolean }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  reloadProfile: () => Promise<void>;
  applyProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guest, setGuestState] = useState(() => !isSupabaseConfigured || isGuest());

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }
    try {
      // El perfil lo crea un trigger al registrarse; si aún no está, reintentamos una vez.
      let found = await fetchProfile(nextUser.id);
      if (!found) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        found = await fetchProfile(nextUser.id);
      }
      setProfile(found);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const session = data.session;
      setUser(session?.user ?? null);
      void loadProfile(session?.user ?? null).finally(() => alive && setReady(true));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user ?? null);
      if (session?.user) {
        setGuest(false);
        setGuestState(false);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      configured: isSupabaseConfigured,
      user,
      profile,
      guest: guest && !user,
      signIn: async (email, password) => {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, locale) => {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { data: { locale }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      signInWithMagicLink: async (email) => {
        const { error } = await supabase!.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      },
      signInWithOAuth: async (provider) => {
        const { error } = await supabase!.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
            // Google sí sabe enseñar un selector de cuenta; GitHub no tiene
            // equivalente: usa siempre la sesión abierta en github.com.
            queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
          },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase?.auth.signOut();
        setUser(null);
        setProfile(null);
      },
      continueAsGuest: () => {
        setGuest(true);
        setGuestState(true);
      },
      reloadProfile: () => loadProfile(user),
      applyProfile: setProfile,
    }),
    [ready, user, profile, guest, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth necesita estar dentro de <AuthProvider>");
  return context;
}
