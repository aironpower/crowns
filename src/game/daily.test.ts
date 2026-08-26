import { describe, expect, it } from "vitest";
import { currentStreak, dailyFor, recentDailyDates } from "./daily";
import { solve } from "./solver";

const at = (iso: string) => new Date(`${iso}T12:00:00`);

describe("puzles del día", () => {
  it("el archivo va de hoy hacia atrás, sin huecos", () => {
    const dates = recentDailyDates(5, at("2026-03-02"));
    expect(dates).toEqual(["2026-03-02", "2026-03-01", "2026-02-28", "2026-02-27", "2026-02-26"]);
  });

  it("cada día da siempre el mismo tablero, y con solución única", () => {
    const a = dailyFor("2026-08-26");
    const b = dailyFor("2026-08-26");
    expect(b.fingerprint).toBe(a.fingerprint);
    expect(dailyFor("2026-08-25").fingerprint).not.toBe(a.fingerprint);
    expect(solve(a.size, a.regions, 3).count).toBe(1);
  });

  describe("racha", () => {
    const hoy = at("2026-08-26");

    it("cuenta los días seguidos hasta hoy", () => {
      const solved = new Set(["2026-08-26", "2026-08-25", "2026-08-24"]);
      expect(currentStreak(solved, hoy)).toBe(3);
    });

    it("sigue viva si hoy todavía no se ha jugado", () => {
      const solved = new Set(["2026-08-25", "2026-08-24"]);
      expect(currentStreak(solved, hoy)).toBe(2);
    });

    it("se rompe con un día suelto sin jugar", () => {
      const solved = new Set(["2026-08-26", "2026-08-24", "2026-08-23"]);
      expect(currentStreak(solved, hoy)).toBe(1);
    });

    it("es cero si no hay nada reciente", () => {
      expect(currentStreak(new Set(["2026-08-01"]), hoy)).toBe(0);
      expect(currentStreak(new Set(), hoy)).toBe(0);
    });
  });
});
