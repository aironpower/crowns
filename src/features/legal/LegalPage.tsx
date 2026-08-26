import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { ENTITY, entityIncomplete, legalDocument, type LegalKind } from "../../legal";

/**
 * Política de privacidad y condiciones del servicio. El texto sale de
 * `src/legal/<idioma>.ts` y los datos del responsable, de `src/legal/entity.ts`,
 * así que la página cambia de idioma con el resto de la interfaz.
 */
export function LegalPage({ kind }: { kind: LegalKind }) {
  const { t, locale, formatDate } = useI18n();
  const doc = legalDocument(locale, kind, formatDate);

  useEffect(() => {
    document.title = `${doc.title} · Crowns`;
    return () => {
      document.title = "Crowns";
    };
  }, [doc.title]);

  return (
    <article className="panel stack legal">
      <header className="stack tight">
        <h1>{doc.title}</h1>
        <p className="muted">{doc.intro}</p>
      </header>

      {entityIncomplete() ? <p className="banner">{t("legal.pending")}</p> : null}

      {doc.sections.map((section) => (
        <section key={section.heading} className="stack tight">
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <footer className="row wrap legal-footer">
        <a className="link" href={`mailto:${ENTITY.email}`}>
          {ENTITY.email}
        </a>
        <div className="grow" />
        <Link className="link" to={kind === "privacy" ? "/terms" : "/privacy"}>
          {kind === "privacy" ? t("legal.terms") : t("legal.privacy")}
        </Link>
        <Link className="link" to="/">
          {t("nav.play")}
        </Link>
      </footer>
    </article>
  );
}
