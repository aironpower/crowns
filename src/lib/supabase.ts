import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Sin claves configuradas la aplicación sigue funcionando: se juega en local y
 * el historial se guarda en el navegador. Así se puede probar antes de crear
 * el proyecto de Supabase.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Cliente garantizado; solo se llama desde código que ya comprobó la configuración. */
export function db(): SupabaseClient {
  if (!supabase) throw new Error("Supabase no está configurado");
  return supabase;
}
