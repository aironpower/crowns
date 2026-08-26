/** Datos del sitio que no son legales pero se muestran en la interfaz. */
export const SITE = {
  /** Quién firma el juego, al pie de todas las páginas. */
  author: "Softie Development",
  authorUrl: "https://softie.dev",

  /**
   * Página de donaciones. Mientras esté vacía, el bloque no se muestra.
   *
   * GitHub Sponsors admite organizaciones, pero hay que solicitarlo y esperar
   * aprobación: hasta entonces github.com/sponsors/Softie-Development redirige
   * al perfil de la organización. En cuanto esté aprobado, pon aquí:
   *   "https://github.com/sponsors/Softie-Development"
   */
  donateUrl: "",
};

export const donationsEnabled = (): boolean => SITE.donateUrl.trim().length > 0;
