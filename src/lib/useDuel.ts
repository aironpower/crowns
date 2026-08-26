import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface Rival {
  id: string;
  name: string;
  crowns: number;
  size: number;
  done: boolean;
  ms: number | null;
}

interface Options {
  /** Código de la sala; sin él no hay duelo. */
  code: string | null;
  name: string;
  crowns: number;
  size: number;
  solved: boolean;
  durationMs: number;
}

/** Identificador de esta pestaña: dos personas pueden compartir cuenta. */
function tabId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Duelo en tiempo real: varias personas resolviendo el mismo tablero y viéndose
 * avanzar.
 *
 * El progreso viaja por *broadcast* (instantáneo y sin tocar la base de datos) y
 * la presencia solo se usa para saber quién está en la sala: en las pruebas,
 * volver a llamar a `track()` no propagaba el cambio, así que no sirve para el
 * estado que cambia a cada corona.
 */
export function useDuel({ code, name, crowns, size, solved, durationMs }: Options) {
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [connected, setConnected] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);
  const me = useRef(tabId());
  const mine = useRef({ name, crowns, size, done: solved, ms: solved ? durationMs : null });
  mine.current = { name, crowns, size, done: solved, ms: solved ? durationMs : null };

  useEffect(() => {
    if (!code || !supabase) {
      setRivals([]);
      setConnected(false);
      return;
    }
    const client = supabase;
    const room = client.channel(`duel:${code}`, { config: { presence: { key: me.current } } });

    const anunciar = () => {
      void room.send({
        type: "broadcast",
        event: "estado",
        payload: { id: me.current, ...mine.current },
      });
    };

    // Los escuchadores van antes de subscribe: si no, la presencia llega vacía.
    room
      .on("broadcast", { event: "estado" }, ({ payload }) => {
        const rival = payload as Rival;
        if (!rival?.id || rival.id === me.current) return;
        setRivals((current) => {
          const resto = current.filter((r) => r.id !== rival.id);
          return [...resto, rival].sort((a, b) => Number(b.done) - Number(a.done) || b.crowns - a.crowns);
        });
      })
      // Alguien acaba de entrar: le contamos dónde vamos para que no vea la sala vacía.
      .on("presence", { event: "join" }, ({ key }) => {
        if (key !== me.current) anunciar();
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setRivals((current) => current.filter((r) => r.id !== key));
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        setConnected(true);
        void room.track({ name: mine.current.name });
        anunciar();
      });

    channel.current = room;
    return () => {
      setConnected(false);
      setRivals([]);
      channel.current = null;
      void client.removeChannel(room);
    };
  }, [code]);

  // Cada cambio propio se anuncia, sin pasarse de vueltas.
  const last = useRef(0);
  useEffect(() => {
    if (!connected || !channel.current) return;
    const ahora = Date.now();
    const espera = Math.max(0, 120 - (ahora - last.current));
    const id = window.setTimeout(() => {
      last.current = Date.now();
      void channel.current?.send({
        type: "broadcast",
        event: "estado",
        payload: { id: me.current, ...mine.current },
      });
    }, espera);
    return () => window.clearTimeout(id);
  }, [connected, crowns, solved, durationMs, name]);

  return { rivals, connected };
}

/** Código de sala corto y legible. */
export function newDuelCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
