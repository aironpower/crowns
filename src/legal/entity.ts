/**
 * Datos del responsable del servicio. Es lo ÚNICO que hay que tocar: de aquí
 * salen los doce documentos legales (dos textos × seis idiomas).
 */
export const ENTITY = {
  /** Razón social completa, tal y como figura en el registro mercantil. */
  company: "Manuel Girón Montes",
  /** CIF/NIF. */
  taxId: "75868985N",
  /** Domicilio social. Déjalo vacío si prefieres no publicarlo. */
  address: "Camí del Figueralet 43, 43878 Masdenverge, Tarragona, España",
  /** Buzón para ejercer derechos y para cualquier consulta legal. */
  email: "info@softie.dev",
  /** Dominio del servicio. */
  site: "crowns.softie.dev",
  /** Fecha de la última revisión de los textos (AAAA-MM-DD). */
  updated: "2026-08-26",
};

/** Mientras falten los datos del responsable, las páginas lo avisan. */
export const entityIncomplete = (): boolean =>
  ENTITY.company.startsWith("PENDIENTE") || ENTITY.taxId.startsWith("PENDIENTE");
