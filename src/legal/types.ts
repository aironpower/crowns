export interface LegalSection {
  heading: string;
  /** Párrafos. Admiten {company}, {taxId}, {address}, {email}, {site} y {date}. */
  body: string[];
  /** Puntos sueltos, para enumerar datos o normas de uso. */
  list?: string[];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export interface LegalTexts {
  privacy: LegalDoc;
  terms: LegalDoc;
  /** Se añade a la primera sección solo si hay domicilio configurado. */
  addressLine: string;
}

/** Los dos documentos (addressLine no es un documento). */
export type LegalKind = "privacy" | "terms";
