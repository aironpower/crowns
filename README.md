# Crowns

Juego de lógica al estilo *Queens*: coloca **una corona en cada fila, cada columna y cada región de color**, sin que dos coronas se toquen (tampoco en diagonal). Cada tablero tiene **solución única**, así que siempre se resuelve razonando, nunca adivinando.

Vite + React + TypeScript en el cliente; Supabase (Postgres + Auth) para cuentas, historial y ranking. Interfaz en **español, inglés, français, català, português y deutsch**.

## Arrancar

```bash
npm install
npm run dev
```

Funciona **sin configurar nada**: se juega como invitado y el historial se guarda en el navegador. Para cuentas y ranking, sigue la sección siguiente.

## Conectar Supabase

1. **Crea el proyecto** en [supabase.com](https://supabase.com) → *New project*. Apunta la contraseña de la base de datos (no hace falta para la app, sí para el CLI).
2. **Crea las tablas**: panel → *SQL Editor* → *New query* → pega el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → *Run*.
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

## Cómo está montado

| Carpeta | Qué hay |
| --- | --- |
| `src/game/` | Motor puro: reglas, solucionador, generador y el hook `useGame`. Sin React salvo el hook. |
| `src/components/` | Tablero y su miniatura, cabecera, paleta, selector de idioma y tema. |
| `src/features/` | Una carpeta por pantalla: `play`, `auth`, `profile`, `history`, `community`. |
| `src/i18n/` | Proveedor de idioma y los seis diccionarios. `es.ts` define el tipo: si falta una clave en otro idioma, no compila. |
| `src/lib/` | Cliente de Supabase, consultas y almacenamiento local del invitado. |
| `supabase/migrations/` | Esquema, RLS, funciones y vistas. |
| `legacy/standalone.html` | La primera versión del juego en un solo archivo, sin dependencias. |

### El generador

1. Coloca una solución legal al azar (una corona por fila y columna, sin tocarse).
2. Hace crecer una región desde cada corona hasta llenar el tablero.
3. **Refina**: mueve casillas de una región a otra mientras el solucionador encuentre más de una solución. El 40 % de los movimientos son *dirigidos* (atacan la casilla donde la solución alternativa pone corona), el resto aleatorios; se aceptan si el número de soluciones no empeora.

Todo depende solo de un generador pseudoaleatorio con semilla y de contadores, nunca del reloj: **la misma semilla da siempre el mismo tablero**. De ahí sale el puzle diario, que se calcula en el cliente a partir de la fecha y sale idéntico para todos sin guardarlo en el servidor.

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
- `profiles` es el perfil público, creado por un trigger al registrarse.
- Las partidas **no se insertan directamente**: pasan por la función `submit_play()`, que comprueba en el servidor que la solución enviada cumple las reglas y que las regiones son canónicas. Las políticas RLS dejan leer a todo el mundo (para el ranking) y escribir solo lo propio.
- Vistas listas para consultar: `recent_activity`, `daily_leaderboard`, `leaderboard_by_size` y `player_stats`.

Como cada tablero se identifica por su fingerprint, cualquier partida del historial o de la comunidad se puede volver a jugar: el enlace `?board=<fingerprint>` reconstruye el tablero y su solución.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # comprobación de tipos + build de producción
npm test           # 13 pruebas del motor (reglas, unicidad, determinismo)
npm run preview    # sirve el build en http://localhost:4173
npm run check      # comprueba que Supabase responde y la migración está aplicada
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
- `npm run build` genera además `dist/404.html` (copia de `index.html`). GitHub Pages no conoce las rutas de la SPA; sirviendo ese 404 el router se encarga y `crowns.softie.dev/community` funciona al entrar directo.

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

5. **Añade el dominio en Supabase**: *Authentication → URL Configuration* → *Site URL* `https://crowns.softie.dev` y añádelo también a *Redirect URLs*. Sin esto, el correo de confirmación y el magic link te devuelven a `localhost`.

6. Si activas Google, añade `https://crowns.softie.dev` a los *orígenes autorizados de JavaScript* en Google Cloud. La URL de retorno sigue siendo la de Supabase, no cambia.

Cada push a `main` vuelve a publicar. Para lanzarlo a mano: pestaña *Actions* → *Deploy* → *Run workflow*.

### Otras opciones

Cloudflare Pages, Netlify o Vercel valen igual y traen *fallback* de SPA sin el truco del `404.html`; en ese caso basta con conectar el repositorio, poner las dos variables de entorno y apuntar el dominio. Si el DNS de `softie.dev` ya está en Cloudflare, Cloudflare Pages es el camino más corto.
