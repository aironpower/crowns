import { describe, expect, it } from "vitest";
import { buildShareCard } from "./shareCard";
import { es } from "../../i18n/locales/es";
import type { DictKey } from "../../i18n/locales/es";
import { dailyFor } from "../../game/daily";

const t = (key: DictKey, vars?: Record<string, string | number>) =>
  (es[key] ?? key).replace(/\{(\w+)\}/g, (m, name) => (vars && name in vars ? String(vars[name]) : m));

const base = {
  puzzle: dailyFor("2026-08-26"),
  durationMs: 132000,
  origin: "https://crowns.softie.dev",
  t,
  formatDate: (value: string) => value,
};

describe("tarjeta de resultado", () => {
  it("el diario enlaza a ese día concreto", () => {
    const card = buildShareCard({ ...base, mode: "daily", hints: 0, streak: 1, dailyDate: "2026-08-26" });
    expect(card).toContain("Puzle del día 2026-08-26");
    expect(card).toContain("2:12");
    expect(card).toContain("sin pistas");
    expect(card).toContain("https://crowns.softie.dev/?daily=2026-08-26");
    expect(card).not.toContain("🔥"); // una racha de 1 no se presume
  });

  it("la partida libre enlaza al tablero, para poder retar", () => {
    const card = buildShareCard({ ...base, mode: "practice", hints: 2, streak: 0, dailyDate: null });
    expect(card).toContain("tablero 8×8");
    expect(card).toContain("2 pista(s)");
    expect(card).toContain(`?board=${encodeURIComponent(base.puzzle.fingerprint)}`);
  });

  it("la racha sale a partir de dos días", () => {
    const card = buildShareCard({ ...base, mode: "daily", hints: 0, streak: 4, dailyDate: "2026-08-26" });
    expect(card).toContain("🔥");
    expect(card).toContain("4");
  });

  it("cabe en un mensaje corto", () => {
    const card = buildShareCard({ ...base, mode: "daily", hints: 1, streak: 9, dailyDate: "2026-08-26" });
    expect(card.split("\n")).toHaveLength(4);
    expect(card.length).toBeLessThan(200);
  });
});
