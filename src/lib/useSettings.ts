import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { saveSettings } from "./api";
import { DEFAULT_SETTINGS, readSettings, writeSettings } from "./localStore";
import type { GameSettings } from "./types";

/**
 * Las dos opciones del tablero: en el navegador si juegas como invitado, y
 * además en tu perfil si tienes cuenta, para que te acompañen entre navegadores.
 *
 * Arranca con lo que haya en local (así no parpadea) y adopta lo del perfil en
 * cuanto llega. Si la migración de preferencias no está aplicada, las columnas
 * no vienen y todo sigue funcionando en local.
 */
export function useSettings() {
  const { user, profile, configured } = useAuth();
  const [settings, setSettings] = useState<GameSettings>(readSettings);
  const adopted = useRef(false);

  useEffect(() => {
    if (adopted.current || !profile) return;
    if (typeof profile.auto_mark !== "boolean" && typeof profile.show_conflicts !== "boolean") return;
    adopted.current = true;
    const fromProfile: GameSettings = {
      autoMark: profile.auto_mark ?? DEFAULT_SETTINGS.autoMark,
      showConflicts: profile.show_conflicts ?? DEFAULT_SETTINGS.showConflicts,
    };
    setSettings(fromProfile);
    writeSettings(fromProfile);
  }, [profile]);

  const update = useCallback(
    (patch: Partial<GameSettings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        writeSettings(next);
        if (user && configured) {
          // Guardado silencioso: si falla, la preferencia sigue viva en local.
          void saveSettings(user.id, next).catch(() => undefined);
        }
        return next;
      });
    },
    [user, configured],
  );

  return {
    autoMark: settings.autoMark,
    showConflicts: settings.showConflicts,
    setAutoMark: (value: boolean) => update({ autoMark: value }),
    setShowConflicts: (value: boolean) => update({ showConflicts: value }),
  };
}
