# Crowns

Juego de lógica al estilo *Queens*: coloca **una corona en cada fila, cada columna y cada región de color**, sin que dos coronas se toquen (tampoco en diagonal). Cada tablero tiene **solución única**, así que siempre se resuelve razonando, nunca adivinando.

Vite + React + TypeScript en el cliente; Supabase (Postgres + Auth) para cuentas, historial y ranking. Interfaz en **español, inglés, français, català, português y deutsch**.

## Origen

Está basado en [**Game of Crowns**](https://game-of-crowns.sanishkr.workers.dev/),
de [SNS](https://sanish.me), que fue la referencia de partida para las reglas y
el planteamiento. Esas reglas son las del formato *Queens* que popularizó
LinkedIn.

Lo que hay aquí es una implementación propia: generador de tableros con solución
única, puzle diario determinista, cuentas y rankings. El código no procede del
original.

## Arrancar

```bash
npm install
npm run dev
```

Funciona **sin configurar nada**: se juega como invitado y el historial se guarda en el navegador. Para cuentas y ranking, sigue la sección siguiente.

## Conectar Supabase

1. **Crea el proyecto** en [supabase.com](https://supabase.com) → *New project*. Apunta la contraseña de la base de datos (no hace falta para la app, sí para el CLI).
2. **Crea las tablas**: panel → *SQL Editor* → *New query* → pega el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → *Run*. Repite con [`0002_player_settings.sql`](supabase/migrations/0002_player_settings.sql) , [`0003_verified_times.sql`](supabase/migrations/0003_verified_times.sql) , [`0004_leagues.sql`](supabase/migrations/0004_leagues.sql) , [`0005_seasons.sql`](supabase/migrations/0005_seasons.sql) y [`0006_hint_penalty.sql`](supabase/migrations/0006_hint_penalty.sql). **El orden importa**: cada archivo comprueba al empezar que el anterior está aplicado y avisa con un mensaje claro si no lo está.
   Con el CLI instalado: `supabase link --project-ref TU-REF && supabase db push`.
3. **Copia la clave**: panel → *Project Settings* → *API Keys* → `anon` / `public`, y pégala en `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

   La `anon key` es pública por diseño: lo que protege los datos son las políticas RLS de la migración. La `service_role` **nunca** va en el cliente.

   Después, `npm run check` confirma que el proyecto responde y que la migración está aplicada.
4. **Configura el acceso**: *Authentication* → *URL Configuration* → *Site URL* `http://localhost:5173` (y añade la URL de producción cuando publiques).
   - **Email + contraseña** y **magic link** funcionan de fábrica. En desarrollo, *Authentication* → *Providers* → *Email* → desactiva *Confirm email* si no quieres pasar por el correo cada vez.
   - **Google** y **GitHub**: ver la sección siguiente.
5. `npm run dev` de nuevo. El aviso de "sin conexión a Supabase" desaparece y aparecen perfil, historial y comunidad.

## Acceso con Google y GitHub

Los botones de Google y GitHub **solo aparecen si el proveedor está activado en
Supabase**: la aplicación lo pregunta al cargar la pantalla de acceso, para que
nadie acabe en la página de error `Unsupported provider: provider is not enabled`.
`npm run check` dice en qué estado está cada uno.

La URL de retorno que piden los dos proveedores es siempre la misma:

```
https://TU-PROYECTO.supabase.co/auth/v1/callback
```

**Google** (~5 min):

1. [Google Cloud Console](https://console.cloud.google.com/) → crea un proyecto (o reutiliza uno).
2. *APIs y servicios* → *Pantalla de consentimiento de OAuth*: tipo **Externo**, pon nombre de la app y tu correo, y guarda. Mientras esté en modo *Prueba* solo entran las cuentas que añadas como usuarios de prueba; publícala cuando quieras abrirla a todos.
3. *Credenciales* → *Crear credenciales* → **ID de cliente de OAuth** → tipo **Aplicación web**.
   - *Orígenes autorizados de JavaScript*: `http://localhost:5173` (y tu dominio al publicar).
   - *URI de redirección autorizados*: la URL de retorno de arriba.
4. Copia el *Client ID* y el *Client Secret*.
5. Supabase → *Authentication* → *Sign In / Providers* → **Google**: actívalo, pega las dos claves y guarda.

**GitHub** (~2 min):

1. GitHub → *Settings* → *Developer settings* → *OAuth Apps* → **New OAuth App**.
2. *Homepage URL*: `http://localhost:5173` (o tu dominio). *Authorization callback URL*: la URL de retorno de arriba.
3. Genera un *Client secret* y copia también el *Client ID*.
4. Supabase → *Authentication* → *Sign In / Providers* → **GitHub**: actívalo, pega las dos claves y guarda.

Después, en *Authentication* → *URL Configuration*, comprueba que `http://localhost:5173`
(y tu dominio) están en *Site URL* / *Redirect URLs*: si no, el proveedor te devuelve
a la app y la sesión no llega a crearse.

Vuelve a ejecutar `npm run check`: los proveedores deben salir con ✓ y los botones
aparecerán solos en la pantalla de acceso.

### Una cuenta por correo, aunque entres por sitios distintos

Supabase **une automáticamente** los accesos que comparten un correo verificado:
si tu cuenta de GitHub usa el mismo correo con el que te registraste, entrar con
GitHub te devuelve a esa misma cuenta, con su nombre de jugador y su historial.
No se puede desactivar, y es lo razonable: si no, cada proveedor crearía un
jugador distinto para la misma persona.

Por eso el perfil enseña las **formas de entrar** que tiene tu cuenta.

Dos detalles de los proveedores:

- **GitHub no tiene selector de cuenta.** Usa siempre la sesión abierta en
  github.com, así que si ya estabas dentro entra directo, sin preguntar. Para
  usar otra cuenta: ventana privada, cerrar sesión en GitHub, o revocar la
  aplicación en *GitHub → Settings → Applications*.
- **Google sí lo tiene**, y la aplicación lo fuerza con `prompt=select_account`
  para que siempre puedas elegir con cuál entras.

### Por qué Google enseña el dominio de Supabase

En la pantalla de Google aparece «Ir a `<proyecto>.supabase.co`» en vez de
`crowns.softie.dev`. No es un error de configuración: Google muestra el dominio del
`redirect_uri`, y el intercambio del código ocurre en el servidor de Supabase.

Hay dos formas de cambiarlo, ninguna imprescindible:

1. **Dominio propio en Supabase** (complemento de pago, por proyecto): usar
   `auth.softie.dev` como dominio de autenticación. No toca el código, y de paso
   quita `supabase.co` de los correos de confirmación y de los enlaces mágicos.
2. **Google Identity Services** (gratis): pedir el *ID token* desde la propia web con
   `signInWithIdToken`, de modo que el consentimiento sale a nombre de
   `crowns.softie.dev`. Obliga a cargar el script de Google en la pantalla de acceso,
   a usar su botón, a añadir el origen en Google Cloud y el *Client ID* en Supabase.

Decisión actual: **dejarlo como está**. Funciona correctamente y solo afecta a lo que
se lee en la pantalla de consentimiento.

## Firma y donaciones

El pie lleva la firma «Hecho por Softie Development» con enlace a softie.dev, y
debajo un enlace discreto de donación. Los dos salen de
[`src/config/site.ts`](src/config/site.ts).

Las donaciones van por **GitHub Sponsors de la organización**
(`github.com/sponsors/Softie-Development`), con importe libre, puntual o mensual.
El bloque solo se muestra si `donateUrl` tiene valor: dejándola vacía desaparece
del pie sin tocar nada más.

## Textos legales

La política de privacidad y las condiciones del servicio están en el propio juego,
en los seis idiomas, y se enlazan desde el pie de todas las páginas:

- `https://crowns.softie.dev/privacy`
- `https://crowns.softie.dev/terms`

Son las dos URL que pide Google en la pantalla de consentimiento de OAuth.

Los datos del responsable (razón social, CIF, correo de contacto) están en un
único sitio, [`src/legal/entity.ts`](src/legal/entity.ts): al cambiarlos ahí se
actualizan los doce documentos. Mientras queden sin rellenar, las páginas muestran
un aviso. Los textos por idioma viven en `src/legal/<idioma>.ts` y `legal.test.ts`
comprueba que ninguno se quede corto ni con marcadores sin sustituir.

Los textos describen con exactitud lo que hace la aplicación, pero **no son
asesoramiento legal**: conviene que los revise quien lleve el asunto de la empresa
antes de darlos por buenos.

## Cómo está montado

| Carpeta | Qué hay |
| --- | --- |
| `src/game/` | Motor puro: reglas, solucionador, generador y el hook `useGame`. Sin React salvo el hook. |
| `src/components/` | Tablero y su miniatura, cabecera, paleta, selector de idioma y tema. |
| `src/features/` | Una carpeta por pantalla: `play`, `auth`, `profile`, `history`, `community`. |
| `src/i18n/` | Proveedor de idioma y los seis diccionarios. `es.ts` define el tipo: si falta una clave en otro idioma, no compila. Sin sesión el idioma se cambia desde el icono del globo; con sesión, desde el perfil, y viaja con la cuenta. |
| `src/lib/` | Cliente de Supabase, consultas y almacenamiento local del invitado. |
| `supabase/migrations/` | Esquema, RLS, funciones y vistas. |
| `legacy/standalone.html` | La primera versión del juego en un solo archivo, sin dependencias. |

### El generador

1. Coloca una solución legal al azar (una corona por fila y columna, sin tocarse).
2. Hace crecer una región desde cada corona hasta llenar el tablero.
3. **Refina**: mueve casillas de una región a otra mientras el solucionador encuentre más de una solución. El 40 % de los movimientos son *dirigidos* (atacan la casilla donde la solución alternativa pone corona), el resto aleatorios; se aceptan si el número de soluciones no empeora.

Todo depende solo de un generador pseudoaleatorio con semilla y de contadores, nunca del reloj: **la misma semilla da siempre el mismo tablero**. De ahí sale el puzle diario, que se calcula en el cliente a partir de la fecha y sale idéntico para todos sin guardarlo en el servidor.

Eso hace gratis el **archivo de puzles del día**: como cada fecha es una función pura, los tableros de las dos últimas semanas se reconstruyen en el navegador sin pedir nada al servidor. En *Historial* aparecen con su miniatura, cuáles has resuelto, en cuánto tiempo y la racha de días seguidos. Un día del archivo se abre con `?daily=AAAA-MM-DD`, y solo el de hoy cuenta como diario: los atrasados se juegan en modo libre para no colarse en la clasificación del día.

Tiempos medios de generación (medidos con `npm test`): ~1 ms hasta 7×7, 10 ms en 8×8, 30 ms en 9×9 y ~250 ms en 10×10. La generación se hace por rebanadas de tiempo, así que la interfaz nunca se congela.

### Los colores

Las regiones no se pintan por orden: para cada tablero se calcula qué color va a
cada región de forma que **dos regiones nunca compartan color** y que las que se
tocan queden lo más separadas posible. La comparación se hace en CIELAB (ΔE), no
por tono, para que cuente lo que ve el jugador. Es un reparto voraz por número de
vecinas más una pasada de intercambios; determinista, así que un tablero siempre
se ve igual. `palette.test.ts` comprueba que ninguna pareja de regiones vecinas
baje de ΔE 20 (la peor medida sobre 2860 pares es 27,6).

### Los datos

- `puzzles` guarda cada tablero una sola vez, identificado por su *fingerprint* (`"8:0011223…"`, las regiones renumeradas por orden de aparición).
- `plays` guarda cada partida resuelta.
- `profiles` es el perfil público, creado por un trigger al registrarse. Guarda también las dos preferencias del tablero (marcar ✕ automáticas y resaltar conflictos), que así acompañan al jugador entre navegadores; quien juega sin cuenta las conserva en el navegador. Ambas nacen desactivadas, y si la migración `0002` no está aplicada la aplicación sigue funcionando con las preferencias solo en local.
- Las partidas **no se insertan directamente**: pasan por la función `submit_play()`, que comprueba en el servidor que la solución enviada cumple las reglas y que las regiones son canónicas. Las políticas RLS dejan leer a todo el mundo (para el ranking) y escribir solo lo propio.
- **El cronómetro lo lleva el servidor.** En la primera jugada el cliente llama a `start_attempt()`, que apunta la hora de inicio en `attempts`; al resolver, `submit_play()` calcula la duración como `now() - started_at` e ignora lo que diga el cliente. Esas partidas quedan con `verified = true`. Si no hay intento (un invitado que sube su historial), se guarda igual pero sin verificar. Lo que esta medida no cubre está anotado en [ROADMAP.md](ROADMAP.md).
- **Ligas privadas**: `leagues` y `league_members`. Se crea una liga con `create_league()` y se entra con `join_league(codigo)`; nadie puede insertarse a mano porque no hay política de `insert`. El código son seis caracteres sin vocales, para que no salgan palabras. La política de miembros usa una función `security definer` (`is_league_member`), porque una política que consulte `league_members` desde `league_members` entra en recursión infinita.
- **Las pistas penalizan**: se clasifica por *tiempo ajustado* = tiempo real + 30 s por pista (`hint_penalty_ms()`, en un solo sitio). Antes una partida con tres pistas podía ganar a una limpia. El tiempo real se sigue guardando; lo que cambia es el orden.
- **Temporadas**: `daily_points` reparte 10, 8, 6, 5, 4, 3, 2 puntos a los siete primeros de cada día y 1 al resto por terminar; `monthly_leaderboard` los suma por mes. Un mal día no hunde la temporada y presentarse a diario compensa. `board_standing(fingerprint)` devuelve el puesto de quien llama en un tablero, para poder decir «2.º de 37».
- Vistas listas para consultar: `recent_activity`, `daily_leaderboard`, `leaderboard_by_size`, `player_stats`, `my_leagues`, `league_daily_leaderboard`, `daily_points`, `monthly_leaderboard` y `league_monthly_leaderboard`.

Como cada tablero se identifica por su fingerprint, cualquier partida del historial o de la comunidad se puede volver a jugar: el enlace `?board=<fingerprint>` reconstruye el tablero y su solución.

Añadiendo `&duel=<código>` se abre un **duelo en directo**: quien entre con ese enlace juega el mismo tablero y las barras de progreso se ven avanzar en tiempo real. Va por Supabase Realtime y no toca la base de datos: el progreso viaja por *broadcast* (instantáneo) y la presencia solo dice quién está en la sala. En las pruebas, repetir `track()` no propagaba el cambio, de ahí el reparto. Eso convierte cada enlace compartido en un duelo: al resolver, el juego enseña **quién más ha jugado ese tablero y en cuánto tiempo**, y la tarjeta de resultado (estilo Wordle) lleva el enlace dentro para poder retar a alguien de un mensaje.

Las ideas que quedan por hacer —ligas privadas, temporadas, puntuación normalizada, duelo en tiempo real— están en [ROADMAP.md](ROADMAP.md), junto con lo que sigue abierto en materia de trampas.

## Buscadores

El juego es una aplicación de una sola página: lo que llega en el HTML inicial es
un `<div>` vacío, que para un rastreador no dice nada. `npm run build` ejecuta
después [`scripts/prerender.mjs`](scripts/prerender.mjs), que:

- da a **cada ruta su propio `<title>`, descripción, canónica y Open Graph** (antes
  todas compartían «Crowns»), y marca como `noindex` lo personal (perfil,
  historial, acceso);
- genera **dos páginas de contenido estáticas** con texto de verdad —
  [/how-to-play/](https://crowns.softie.dev/how-to-play/) y
  [/como-jugar/](https://crowns.softie.dev/como-jugar/) — enlazadas entre sí con
  `hreflang`, que son las que pueden posicionar por *star battle*, *queens* o
  *crowns game*;
- añade datos estructurados (`VideoGame` y `FAQPage`);
- escribe `robots.txt` y `sitemap.xml`.

La imagen que sale al compartir el enlace se genera aparte con `npm run og`
(necesita Chrome) y se guarda en `public/og-image.png`, para no depender del
navegador en el servidor de despliegue.

Los textos de esas páginas están en [`scripts/seo-pages.mjs`](scripts/seo-pages.mjs).

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # comprobación de tipos + build de producción
npm test           # 13 pruebas del motor (reglas, unicidad, determinismo)
npm run preview    # sirve el build en http://localhost:4173
npm run check      # comprueba que Supabase responde y la migración está aplicada
npm run og         # regenera public/og-image.png (necesita Chrome)
npm run test:e2e   # prueba de humo en Chrome sobre el build servido
npm run test:db    # aplica la migración a un Postgres en Docker y la verifica
```

`test:db` levanta un contenedor `postgres:15-alpine`, recrea el mínimo que aporta Supabase (esquema `auth`, roles, `auth.uid()`), aplica la migración y comprueba el trigger de perfil, la validación de reglas, `submit_play`, las vistas y que RLS bloquea las escrituras directas. Necesita Docker en marcha.

`test:e2e` necesita el build servido (`npm run build && npm run preview` en otra terminal). Lanza Chrome headless, juega una partida completa, comprueba victoria, historial, navegación y cambio de idioma. Acepta otra URL como argumento y `CHROME_PATH` si el navegador está en otra ruta.

## Publicar en crowns.softie.dev

El sitio es estático, así que va en **GitHub Pages** (gratis, HTTPS y dominio propio).
Supabase se queda solo como backend: no ofrece alojamiento de sitios.

Ya está todo preparado en el repositorio:

- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila y publica en cada push a `main`. Antes de publicar pasa `npm run typecheck` y `npm test`: si algo falla, no se sube nada.
- [`public/CNAME`](public/CNAME) fija el dominio `crowns.softie.dev`.
- `npm run build` genera además `dist/404.html` y una carpeta con `index.html` propio para cada ruta conocida. GitHub Pages no conoce las rutas de la SPA: el 404 hace que cualquier dirección cargue la aplicación, y las carpetas hacen que `/privacy`, `/terms`, `/community`… respondan **200** en lugar de 404. Eso último importa para el buscador y para Google, que revisa la URL de la política de privacidad al aprobar la pantalla de consentimiento.

### Pasos

1. **Crea el repositorio y sube el código** (con el CLI de GitHub):

   ```bash
   gh repo create crowns --public --source=. --remote=origin --push
   ```

   O crea el repo a mano en github.com y luego `git remote add origin ... && git push -u origin main`.

2. **Guarda las claves** en *Settings → Secrets and variables → Actions → New repository secret*:

   | Secreto | Valor |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://TU-PROYECTO.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | tu anon key |

   La anon key acaba dentro del JavaScript público: es así por diseño, lo que protege los datos son las políticas RLS. Aun así se pasa por secretos para no tenerla escrita en el repositorio.

3. **Activa Pages**: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.

4. **Apunta el dominio**. En el DNS de `softie.dev`, un registro CNAME:

   ```
   crowns    CNAME    TU-USUARIO.github.io.
   ```

   Luego, en *Settings → Pages → Custom domain*, escribe `crowns.softie.dev` y marca *Enforce HTTPS* cuando GitHub termine de emitir el certificado (unos minutos).

   Ojo con `.dev`: es un TLD con **HSTS precargado**, así que los navegadores fuerzan HTTPS siempre. Hasta que el DNS apunte a GitHub y el certificado esté emitido, el dominio no abre en el navegador (por `http://` tampoco). Es normal, no es un fallo del despliegue.

5. **Añade el dominio en Supabase**: *Authentication → URL Configuration* → *Site URL* `https://crowns.softie.dev` y añádelo también a *Redirect URLs*. Sin esto, el correo de confirmación y el magic link te devuelven a `localhost`.

6. Si activas Google, añade `https://crowns.softie.dev` a los *orígenes autorizados de JavaScript* en Google Cloud. La URL de retorno sigue siendo la de Supabase, no cambia.

Cada push a `main` vuelve a publicar. Para lanzarlo a mano: pestaña *Actions* → *Deploy* → *Run workflow*.

Para probar el sitio publicado antes de que propague el DNS, la suite de navegador acepta banderas extra de Chrome:

```bash
CHROME_EXTRA_ARGS='--host-resolver-rules=MAP crowns.softie.dev 185.199.108.153'   node scripts/e2e.mjs http://crowns.softie.dev/
```

### Otras opciones

Cloudflare Pages, Netlify o Vercel valen igual y traen *fallback* de SPA sin el truco del `404.html`; en ese caso basta con conectar el repositorio, poner las dos variables de entorno y apuntar el dominio. Si el DNS de `softie.dev` ya está en Cloudflare, Cloudflare Pages es el camino más corto.
