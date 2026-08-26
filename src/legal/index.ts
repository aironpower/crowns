import type { Locale } from "../i18n";
import { ENTITY } from "./entity";
import type { LegalDoc, LegalKind, LegalTexts } from "./types";
import { legalEs } from "./es";
import { legalEn } from "./en";
import { legalCa } from "./ca";
import { legalPt } from "./pt";
import { legalFr } from "./fr";
import { legalDe } from "./de";

const TEXTS: Record<Locale, LegalTexts> = {
  es: legalEs,
  en: legalEn,
  ca: legalCa,
  pt: legalPt,
  fr: legalFr,
  de: legalDe,
};

/** Sustituye {company}, {taxId}, {email}, {site} y {date} en un texto. */
function fill(text: string, formatDate: (value: string) => string): string {
  return text
    .replace(/\{company\}/g, ENTITY.company)
    .replace(/\{taxId\}/g, ENTITY.taxId)
    .replace(/\{address\}/g, ENTITY.address)
    .replace(/\{email\}/g, ENTITY.email)
    .replace(/\{site\}/g, ENTITY.site)
    .replace(/\{date\}/g, formatDate(ENTITY.updated));
}

/** Documento listo para pintar, con los datos del responsable ya puestos. */
export function legalDocument(
  locale: Locale,
  kind: LegalKind,
  formatDate: (value: string) => string,
): LegalDoc {
  const doc = (TEXTS[locale] ?? TEXTS.es)[kind];
  return {
    title: doc.title,
    intro: fill(doc.intro, formatDate),
    sections: doc.sections.map((section) => ({
      heading: section.heading,
      body: section.body.map((paragraph) => fill(paragraph, formatDate)),
      list: section.list?.map((item) => fill(item, formatDate)),
    })),
  };
}

export { ENTITY, entityIncomplete } from "./entity";
export type { LegalDoc, LegalKind } from "./types";
