import { describe, expect, it } from "vitest";
import { legalDocument } from "./index";
import { LOCALE_CODES } from "../i18n";
import { legalEs } from "./es";
import type { LegalKind } from "./types";

const KINDS: LegalKind[] = ["privacy", "terms"];
const formatDate = (value: string) => value;

describe("documentos legales", () => {
  it.each(LOCALE_CODES)("el idioma %s tiene los dos documentos completos", (locale) => {
    for (const kind of KINDS) {
      const doc = legalDocument(locale, kind, formatDate);
      expect(doc.title.length).toBeGreaterThan(3);
      expect(doc.intro.length).toBeGreaterThan(40);
      expect(doc.sections.length).toBeGreaterThan(5);
      for (const section of doc.sections) {
        expect(section.heading.length).toBeGreaterThan(2);
        expect(section.body.length + (section.list?.length ?? 0)).toBeGreaterThan(0);
        for (const text of [...section.body, ...(section.list ?? [])]) {
          expect(text.length).toBeGreaterThan(15);
        }
      }
    }
  });

  it("no queda ningún marcador sin sustituir", () => {
    for (const locale of LOCALE_CODES) {
      for (const kind of KINDS) {
        const doc = legalDocument(locale, kind, formatDate);
        const whole = [
          doc.title,
          doc.intro,
          ...doc.sections.flatMap((s) => [s.heading, ...s.body, ...(s.list ?? [])]),
        ].join(" ");
        expect(whole, `${locale}/${kind}`).not.toMatch(/\{[a-zA-Z]+\}/);
      }
    }
  });

  it("todos los idiomas cubren las mismas secciones que el original", () => {
    for (const kind of KINDS) {
      const reference = legalEs[kind].sections.length;
      for (const locale of LOCALE_CODES) {
        expect(legalDocument(locale, kind, formatDate).sections.length, `${locale}/${kind}`).toBe(reference);
      }
    }
  });

  it("los datos del responsable llegan al texto", () => {
    const doc = legalDocument("es", "privacy", formatDate);
    const whole = doc.sections.flatMap((s) => s.body).join(" ");
    expect(whole).toContain("crowns.softie.dev");
    expect(whole).toContain("@softie.dev");
  });
});
