# Pendiente

Ideas para hacer el juego más competitivo, ordenadas por lo que aporta frente a
lo que cuesta. Con pocos jugadores lo que funciona es competir contra alguien
concreto; los rankings globales solo tienen sentido cuando hay volumen.

## Hecho

- **Tarjeta de resultado** para pegar en un chat, con el enlace al mismo tablero.
- **Duelo en el tablero compartido**: al resolver se ve quién más lo ha jugado y en cuánto.
- **Tiempo medido por el servidor** (`start_attempt` + `submit_play`), con las partidas marcadas como verificadas.
- **Ligas privadas**: grupos cerrados con código de seis caracteres y ranking propio del puzle del día.
- **Temporadas mensuales**: puntos por posición del día (10, 8, 6… y 1 por terminar), sumados por mes. Global en Comunidad y dentro de cada liga.
- **Puesto en el tablero**: al resolver, «2.º de 37 · a 14 s del primero».

## Siguiente

### Puntuación en vez de tiempo bruto — esfuerzo medio

Hoy el ranking premia a quien juega con las ✕ automáticas activadas, que no es
lo mismo que jugar mejor. Una puntuación que normalice por la mediana del día y
penalice las pistas sería más justa. **Conviene decidirlo antes de que haya
récords que la gente considere suyos.**

### Duelo en tiempo real — esfuerzo alto

Mismo tablero, dos personas a la vez, viendo aparecer las coronas del rival.
Supabase Realtime ya está en el proyecto para el muro de actividad, así que la
pieza que falta son las salas y la sincronización.

## Sobre las trampas

Lo que hay ahora: `submit_play` comprueba que la solución cumple las reglas y,
si la partida se abrió con `start_attempt`, **la duración la mide el servidor**;
el número que envíe el cliente se ignora. Las partidas quedan marcadas con
`verified`.

Lo que sigue abierto:

- **Resolver antes y repetir rápido.** El tablero del día es el mismo para todos:
  alguien puede resolverlo con calma, abrir el intento y reproducir la solución
  en segundos. Medir el tiempo no lo evita; haría falta telemetría de jugadas y
  heurísticas (¿el ritmo es humano?, ¿hubo marcas descartadas?).
- **El ranking mezcla partidas verificadas y sin verificar.** Las de antes de la
  migración `0003` y las que sube un invitado no lo están. Cuando todo lo nuevo
  venga verificado, conviene filtrar los rankings por `verified` o marcarlas de
  otro color.
- **Sin límite de peticiones.** Nada impide abrir cien intentos seguidos, ni
  probar códigos de liga al azar. Si llega a molestar, un límite por jugador y
  minuto en las propias funciones. Con seis caracteres sin vocales hay unos
  1.100 millones de combinaciones, así que adivinar un código no es el problema.

Mi criterio: mientras no haya nada en juego, no merece la pena ir más lejos. La
defensa real de un juego pequeño es que hacer trampas no dé nada, no que sea
imposible.
