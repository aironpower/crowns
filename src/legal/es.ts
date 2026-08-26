import type { LegalTexts } from "./types";

export const legalEs: LegalTexts = {
  addressLine: "Domicilio: {address}.",

  privacy: {
    title: "Política de privacidad",
    intro:
      "Crowns es un juego de lógica. Esta página explica qué datos tratamos, para qué y qué puedes hacer con ellos. Última actualización: {date}.",
    sections: [
      {
        heading: "Quién es el responsable",
        body: [
          "El responsable del tratamiento es {company}, con NIF {taxId}, titular del servicio publicado en {site}.",
          "Para cualquier asunto relacionado con tus datos: {email}.",
        ],
      },
      {
        heading: "Qué datos tratamos",
        body: ["Depende de cómo juegues."],
        list: [
          "Si juegas sin cuenta: nada. Las partidas y las preferencias se quedan en tu navegador y no llegan a nuestros servidores.",
          "Si creas una cuenta: tu dirección de correo electrónico. Si entras con Google o GitHub, recibimos de ellos tu correo y el nombre público asociado.",
          "Perfil: nombre de jugador, nombre visible (si lo pones) e idioma elegido.",
          "Partidas: tamaño del tablero, tiempo empleado, pistas usadas, número de jugadas, fecha y el tablero resuelto.",
          "Datos técnicos: nuestros proveedores registran la dirección IP y datos de conexión para que el servicio funcione y para protegerse de abusos.",
        ],
      },
      {
        heading: "Para qué y con qué base legal",
        body: [
          "Usamos los datos de la cuenta y del perfil para permitirte entrar, guardar tu historial y mostrar los rankings: es la ejecución del servicio que solicitas al registrarte.",
          "Los datos técnicos y de seguridad se tratan por interés legítimo en mantener el servicio disponible y libre de abusos.",
          "No hacemos publicidad, no elaboramos perfiles con fines comerciales y no vendemos ni cedemos datos a terceros.",
        ],
      },
      {
        heading: "Qué se ve en público",
        body: [
          "El juego tiene rankings y un muro de actividad. Al resolver un puzle se publican tu nombre de jugador, tu nombre visible si lo has puesto, el tiempo, las pistas usadas, la fecha y el tablero jugado.",
          "Tu dirección de correo electrónico nunca es pública ni se muestra a otros jugadores. Si prefieres no aparecer, puedes cambiar tu nombre de jugador por uno que no te identifique.",
        ],
      },
      {
        heading: "Qué guardamos en tu navegador",
        body: [
          "No usamos cookies de seguimiento ni herramientas de analítica. En el almacenamiento local del navegador guardamos: la sesión iniciada, el idioma, el tema claro u oscuro, tus mejores tiempos y, si juegas sin cuenta, tu historial de partidas.",
          "Puedes borrarlo en cualquier momento desde las opciones de tu navegador.",
        ],
      },
      {
        heading: "Quién nos ayuda a prestar el servicio",
        body: [
          "Trabajamos con proveedores que tratan datos por cuenta nuestra:",
        ],
        list: [
          "Supabase: base de datos y sistema de cuentas. Los datos se alojan en servidores de Londres (Reino Unido), país con decisión de adecuación de la Comisión Europea.",
          "GitHub Pages: alojamiento de la web.",
          "Google o GitHub: solo si eliges entrar con ellos, y únicamente para verificar tu identidad.",
        ],
      },
      {
        heading: "Cuánto tiempo conservamos los datos",
        body: [
          "Mientras mantengas la cuenta abierta. Si la borras, eliminamos tu perfil y tus partidas. Los registros técnicos de nuestros proveedores se conservan durante los plazos que ellos aplican por seguridad.",
        ],
      },
      {
        heading: "Tus derechos",
        body: [
          "Puedes pedirnos acceder a tus datos, rectificarlos, suprimirlos, limitar u oponerte a su tratamiento y solicitar su portabilidad. Escribe a {email} y te responderemos en el plazo legal.",
          "Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).",
        ],
      },
      {
        heading: "Menores",
        body: [
          "El servicio no está dirigido a menores de 14 años. Si detectamos una cuenta de un menor de esa edad sin autorización de quien ejerza su tutela, la eliminaremos.",
        ],
      },
      {
        heading: "Cambios",
        body: [
          "Si esta política cambia, actualizaremos la fecha del encabezado y, si el cambio es relevante, lo avisaremos en el propio juego.",
        ],
      },
    ],
  },

  terms: {
    title: "Condiciones del servicio",
    intro:
      "Estas condiciones regulan el uso de Crowns, disponible en {site}. Al usar el juego las aceptas. Última actualización: {date}.",
    sections: [
      {
        heading: "Qué es Crowns",
        body: [
          "Crowns es un juego de lógica gratuito operado por {company} (NIF {taxId}). Se puede jugar sin cuenta; crear una sirve para guardar el historial y participar en los rankings.",
        ],
      },
      {
        heading: "Tu cuenta",
        body: [
          "Necesitas facilitar una dirección de correo válida y eres responsable de mantener tus credenciales a salvo. Avísanos en {email} si sospechas que alguien la está usando.",
          "Elige un nombre de jugador respetuoso. Podemos cambiar o retirar nombres ofensivos, o los que suplanten a otra persona o marca.",
        ],
      },
      {
        heading: "Uso aceptable",
        body: ["Al usar el juego te comprometes a no:"],
        list: [
          "Automatizar partidas con programas o scripts para falsear tiempos o posiciones en los rankings.",
          "Intentar acceder a datos de otras cuentas ni saltarte las restricciones del servicio.",
          "Sobrecargar el servicio o extraer datos de forma masiva.",
          "Usar el nombre de jugador o el nombre visible para publicar contenido ofensivo, ilegal o publicitario.",
        ],
      },
      {
        heading: "Resultados y rankings",
        body: [
          "Al resolver un puzle, tu resultado y tu nombre de jugador se publican en la actividad y en las clasificaciones.",
          "Podemos retirar resultados manifiestamente falsos o conseguidos incumpliendo estas condiciones, y suspender las cuentas implicadas.",
        ],
      },
      {
        heading: "Disponibilidad",
        body: [
          "El servicio se ofrece tal cual y de forma gratuita, sin garantía de disponibilidad continua. Puede cambiar, interrumpirse o cerrar. Haz copia de lo que te importe: no garantizamos la recuperación de partidas.",
        ],
      },
      {
        heading: "Responsabilidad",
        body: [
          "En la medida que permita la ley, {company} no responde de daños indirectos derivados del uso o de la imposibilidad de usar el juego. Nada de lo anterior limita los derechos que te reconoce la normativa de consumidores.",
        ],
      },
      {
        heading: "Propiedad",
        body: [
          "El nombre, el diseño y el contenido del juego pertenecen a {company}. El código fuente está publicado en GitHub y se rige por la licencia que allí figure.",
        ],
      },
      {
        heading: "Baja",
        body: [
          "Puedes dejar de usar el juego cuando quieras. Para eliminar tu cuenta y tus datos, escribe a {email}.",
        ],
      },
      {
        heading: "Ley aplicable",
        body: [
          "Estas condiciones se rigen por la legislación española. Si actúas como consumidor, podrás acudir a los juzgados de tu domicilio.",
        ],
      },
      {
        heading: "Cambios",
        body: [
          "Podemos actualizar estas condiciones. La fecha del encabezado indica la última versión y los cambios relevantes se avisarán en el juego.",
        ],
      },
    ],
  },
};
