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
}

export type LegalKind = keyof LegalTexts;
