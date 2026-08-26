export type OAuthProvider = "google" | "github";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"];

/**
 * ¿Está activado este proveedor en el proyecto de Supabase?
 *
 * `signInWithOAuth` no lo comprueba: manda el navegador a /authorize y, si el
 * proveedor no está configurado, el jugador acaba mirando un JSON de error. Aquí
 * preguntamos antes: con `redirect: "manual"` una redirección a Google o GitHub
 * llega como respuesta opaca (el proveedor existe) y una configuración ausente
 * llega como 400 legible.
 *
 * Ante la duda (red caída, respuesta rara) devolvemos `true`: mejor enseñar el
 * botón y que falle que esconder un acceso que sí funciona.
 */
export async function isProviderEnabled(provider: OAuthProvider): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) return false;
  try {
    const response = await fetch(`${url}/auth/v1/authorize?provider=${provider}`, {
      redirect: "manual",
    });
    if (response.type === "opaqueredirect" || response.status === 0) return true;
    if (response.status === 400) return false;
    return true;
  } catch {
    return true;
  }
}

export async function enabledProviders(): Promise<OAuthProvider[]> {
  const checks = await Promise.all(
    OAUTH_PROVIDERS.map(async (provider) => [provider, await isProviderEnabled(provider)] as const),
  );
  return checks.filter(([, enabled]) => enabled).map(([provider]) => provider);
}
