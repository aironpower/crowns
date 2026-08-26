/** Datos del sitio que no son legales pero se muestran en la interfaz. */
export const SITE = {
  /** Quién firma el juego, al pie de todas las páginas. */
  author: "Softie Development",
  authorUrl: "https://softie.dev",

  /**
   * Página de donaciones. Si se deja vacía, el bloque del pie no se muestra.
   * Admite importe libre, puntual o mensual.
   */
  donateUrl: "https://github.com/sponsors/Softie-Development",
};

export const donationsEnabled = (): boolean => SITE.donateUrl.trim().length > 0;
