import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { es, type Dict, type DictKey } from "./locales/es";
import { en } from "./locales/en";
import { ca } from "./locales/ca";
import { pt } from "./locales/pt";
import { fr } from "./locales/fr";
import { de } from "./locales/de";

/** Cada idioma se nombra en su propio idioma; sin banderas (una bandera no es un idioma). */
export const LOCALES = {
  es: { label: "Español", dict: es },
  en: { label: "English", dict: en },
  ca: { label: "Català", dict: ca },
  pt: { label: "Português", dict: pt },
  fr: { label: "Français", dict: fr },
  de: { label: "Deutsch", dict: de },
} as const;

export type Locale = keyof typeof LOCALES;

/** Alfabéticamente por el nombre del idioma: Català, Deutsch, English, Español… */
export const LOCALE_CODES = (Object.keys(LOCALES) as Locale[]).sort((a, b) =>
  LOCALES[a].label.localeCompare(LOCALES[b].label, "en"),
);

const STORAGE_KEY = "crowns.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALE_CODES as string[]).includes(value);
}

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* navegador sin almacenamiento: seguimos con el idioma del sistema */
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const short = tag.slice(0, 2).toLowerCase();
    if (isLocale(short)) return short;
  }
  return "es";
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Traduce una clave e interpola {variables}. */
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  /** "hace 3 minutos" en el idioma activo. */
  timeAgo: (date: string | number | Date) => string;
  formatDate: (date: string | number | Date) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* sin almacenamiento: el idioma dura lo que la pestaña */
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const value = useMemo<I18nValue>(() => {
    const dict: Dict = LOCALES[locale].dict;
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        const raw = dict[key] ?? es[key] ?? key;
        if (!vars) return raw;
        return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
          name in vars ? String(vars[name]) : match,
        );
      },
      timeAgo: (input) => {
        const date = new Date(input);
        const diff = (date.getTime() - Date.now()) / 1000;
        const abs = Math.abs(diff);
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
        for (const [unit, seconds] of UNITS) {
          if (abs >= seconds || unit === "second") {
            return rtf.format(Math.round(diff / seconds), unit);
          }
        }
        return "";
      },
      formatDate: (input) =>
        new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(input)),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n necesita estar dentro de <I18nProvider>");
  return context;
}
