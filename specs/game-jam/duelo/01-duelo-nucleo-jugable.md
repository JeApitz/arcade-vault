# 01 — Juego Duelo — Núcleo jugable

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06, SPEC 07
**Fecha:** 2026-08-20
**Objetivo:** Construir desde cero un Pong clásico jugador-contra-CPU dentro de Arcade Vault, jugable de punta a punta con HUD genérico y guardado real de puntuación, con su propia entrada en el catálogo/leaderboard de Supabase.

## Alcance

**Incluye:**

- Nueva fila en la tabla `games` de Supabase (migración vía `mcp__supabase__apply_migration`, patrón SPEC 07/08/09/10): `{ id: "duelo", title: "DUELO", cat: "VERSUS", cover: "cover-duelo", color: "magenta", short: "...", long: "...", best: 0, plays: "0" }` (ver textos exactos en "Datos del catálogo"). Primera fila real del catálogo con `cat: "VERSUS"`.
- Clase nueva `.cover-duelo` en `app/globals.css`, mismo patrón (gradiente + `::after`/`::before` decorativos) que `.cover-asteroides`/`.cover-arkanoid`: fondo degradado oscuro con tinte magenta, dos barras verticales cortas (palas) a izquierda/derecha y un punto magenta central (pelota) con `filter: drop-shadow` en magenta.
- Motor nuevo `app/juegos/[id]/jugar/duelo-engine.ts`, clase `DueloEngine`, que encapsula todo el estado como propiedades de instancia (sin variables globales de módulo): pala del jugador, pala de la CPU, pelota, marcador. Reglas del núcleo jugable:
  - Campo de 800×600px (`crtAspect: "4 / 3"`), línea central discontinua, pala del jugador a la izquierda (`x = 30`), pala de la CPU a la derecha (`x = W - 30 - paddleWidth`), ambas de 90×12px moviéndose solo en vertical, clamp dentro del campo.
  - Control del jugador por teclado: `↑`/`↓` y `W`/`S` mueven la pala izquierda a velocidad constante. La pala de la CPU no responde a teclado.
  - Física de la pelota: rebote elástico contra los bordes superior/inferior; al golpear una pala, el ángulo de salida se calcula según el punto de impacto respecto al centro de la pala (mismo principio que el rebote de paddle de `ArkanoidEngine`, no un simple invertir de `vx`), con velocidad de la pelota levemente creciente en cada rebote hasta un tope máximo para evitar tunneling a velocidades altas.
  - Saque: al iniciar la partida y después de cada punto, la pelota reaparece en el centro del campo y sale con un ángulo aleatorio acotado hacia el lado del jugador que perdió el último punto (en el primer saque de la partida, el lado es aleatorio).
  - IA de la CPU (versión base de este spec, sin variar por nivel): la pala sigue la coordenada `y` de la pelota con una velocidad máxima limitada y una pequeña zona muerta central fija (constantes `CPU_MAX_SPEED`/`CPU_DEAD_ZONE` documentadas en el motor), de forma que sea vencible pero no trivial. La escala de esta dificultad por set/nivel es contenido de SPEC 02, no de este spec: aquí la dificultad es fija y `level` se reporta siempre en `1`.
  - Marcador: el jugador anota un punto (`score += 1`) cuando la pelota cruza por completo el borde derecho del campo; la CPU anota un punto (`rival += 1`, mapeado a `secondary` en `engines.ts`) cuando la pelota cruza por completo el borde izquierdo. La partida termina en `status: "gameover"` en cuanto alguno de los dos marcadores llega a `WIN_SCORE = 11` (Pong clásico a 11, un único set en este spec).
  - Mismo contrato que los motores existentes: constructor `(canvas, onStats)`, `start()`, `destroy()` (idempotente, limpia el loop y los listeners de teclado), `setPaused(paused)` (congela `update()`, sigue dibujando el último frame, no salta tiempo al reanudar), `forceGameOver()`. `onStats` solo notifica cuando cambia `score`, `rival` (→ `secondary`), `level` o `status`.
  - Sin HUD propio dibujado en canvas en este spec: solo se depende del HUD genérico externo (Jugador/Puntuación/RIVAL/Nivel) de `game-player.tsx`. El HUD propio con marcador arcade, línea central e identidad visual llega en SPEC 03.
- Componente cliente `app/juegos/[id]/jugar/duelo-canvas.tsx` (`DueloCanvas`, `forwardRef<GameCanvasHandle, GameCanvasProps>`), calcado de `asteroids-canvas.tsx`: un único `<canvas width={800} height={600}>` dentro de `.crt-screen`, instancia `DueloEngine` en un `useEffect` con `destroy()` en el cleanup, expone `forceGameOver` vía `useImperativeHandle`.
- Nueva entrada en `engines.ts`: `duelo: { Canvas: DueloCanvas, hudLabel: "RIVAL", initialStats: { score: 0, secondary: 0, level: 1, status: "playing" }, crtAspect: "4 / 3" }`. No requiere los campos opcionales `onPauseChange`/`hidePauseOverlay` (Duelo usa el overlay de pausa genérico del reproductor, igual que asteroides/tetris/snake).
- Controles: `↑`/`↓` y `W`/`S` mueven la pala del jugador; `PAUSA`/`REANUDAR` del HUD genérico congela y reanuda el punto en curso sin saltos; `FIN` termina la partida manualmente con el marcador actual.
- Botón `GUARDAR PUNTUACIÓN` del modal de fin inserta una fila real en `scores` (`game_id: "duelo"`, `score` = puntos anotados por el jugador en la partida, 0–11 en este spec), reutilizando el flujo genérico existente.
- Leaderboard real: `/juegos/duelo` (leaderboard lateral vía `getTopScores("duelo", 10)`), `/salon` (pestaña DUELO, genérica desde SPEC 07) y la home incluyen duelo automáticamente en cuanto existe la fila en `games`.

**No incluye (fuera de alcance de este spec):**

- Multijugador local a dos jugadores o multijugador online: solo jugador humano contra CPU.
- Progresión de dificultad de la CPU por set/nivel, partidas a mejor de varios sets y marcador acumulado entre sets: todo eso es SPEC 02.
- HUD propio dibujado en canvas (marcador arcade, indicador de sets, línea central estilizada, estela de partícula de la pelota): eso es SPEC 03. Este spec solo usa el HUD genérico.
- Sonido/efectos de audio.
- Controles táctiles/en pantalla para mobile.
- Persistencia adicional más allá de `scores` (sin localStorage, sin IndexedDB).
- Recalcular dinámicamente `best`/`plays` de la fila `duelo` en `games` tras jugar; quedan estáticos como se siembran (0 / "0").
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido documentado desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.
- Cualquier cambio a `app/data/games.ts` (archivo mock, no se toca desde SPEC 07). En particular, la entrada mock `"duelo-pixel"` (VERSUS/cyan) de ese archivo no se modifica ni se reemplaza por `"duelo"`.

## Datos del catálogo

```ts
{
  id: "duelo",
  title: "DUELO",
  short: "Pong clásico contra la CPU, primero en llegar al marcador gana.",
  long: "Dos palas de neón, una pelota que no perdona. Domina el ángulo de rebote, cierra el punto y sé el primero en llegar a 11 contra una CPU que no te regala nada.",
  cat: "VERSUS",
  cover: "cover-duelo",
  color: "magenta",
  best: 0,
  plays: "0",
}
```

## Contrato del motor

```ts
// app/juegos/[id]/jugar/duelo-engine.ts
interface DueloStats {
  score: number; // puntos anotados por el jugador en la partida (0..11 en este spec)
  rival: number; // puntos anotados por la CPU — se mapea a `secondary` en engines.ts, hudLabel "RIVAL"
  level: number; // siempre 1 en este spec; SPEC 02 lo convierte en el número de set actual
  status: "playing" | "dead" | "gameover"; // "dead" no se usa en este juego, se mantiene por compatibilidad con GameStats
}
```

`DueloEngine` mantiene como propiedades de instancia: `playerPaddle`/`cpuPaddle` (`{ y, vy }`), `ball` (`{ x, y, vx, vy, speed }`), `score`, `rival`, `level` (fijo en `1`), `status`, además de las constantes de física/IA (`CPU_MAX_SPEED`, `CPU_DEAD_ZONE`, `WIN_SCORE`). `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y `onStats` solo notifica en cambios de `score`/`rival`/`level`/`status`.

No hay datos adicionales fuera de este contrato.

### HUD propio

Ninguno en este spec. Solo se usa la barra genérica de `game-player.tsx` (Jugador/Puntuación/RIVAL/Nivel). El HUD propio en canvas se implementa en SPEC 03.

## Relación de aspecto del marco CRT

`crtAspect: "4 / 3"` — mismo valor que asteroides/arkanoid, coherente con el campo horizontal clásico de Pong (800×600px). El canvas llena el 100%/100% del `.crt-screen`, sin necesidad de `ResizeObserver`/`transform: scale`.

---

## Plan de implementación

1. **Catálogo.** Migración que inserta la fila `duelo` en `games` (datos de arriba) y clase `.cover-duelo` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides`/`.cover-arkanoid`. El juego ya aparece en `/games` y `/juegos/duelo`; `/juegos/duelo/jugar` deja el `.crt-screen` vacío hasta el paso 4 (sin entrada aún en `engines.ts`).
2. **Motor.** Crear `app/juegos/[id]/jugar/duelo-engine.ts` con la clase `DueloEngine`: palas, física de rebote con ángulo según punto de impacto, saque tras cada punto, IA base de la CPU con velocidad máxima y zona muerta fijas, marcador y fin de partida a 11 puntos. Sin conectar todavía a ninguna UI.
3. **Wrapper de React.** Crear `app/juegos/[id]/jugar/duelo-canvas.tsx`, componente cliente con `<canvas width={800} height={600}>`, instancia `DueloEngine` en un `useEffect` (con `destroy()` en el cleanup), expone `forceGameOver` vía `useImperativeHandle`/`forwardRef`.
4. **Registro del motor.** Agregar la entrada `duelo` al mapa `ENGINES` en `app/juegos/[id]/jugar/engines.ts` (`{ Canvas: DueloCanvas, hudLabel: "RIVAL", initialStats: { score: 0, secondary: 0, level: 1, status: "playing" }, crtAspect: "4 / 3" }`). Sin tocar `game-player.tsx` (Duelo usa el overlay de pausa genérico).
5. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/duelo/jugar`: mover la pala con `↑`/`↓` y con `W`/`S`, comprobar el rebote contra bordes y contra la propia pala (incluyendo el cambio de ángulo según el punto de impacto), anotar y recibir puntos y ver el HUD genérico (Puntuación/RIVAL/Nivel) actualizarse en vivo, llegar a 11 puntos (propios o de la CPU) y confirmar que abre el modal de fin con el marcador real, `PAUSA`/`REANUDAR` sin saltos de posición ni de velocidad de la pelota, `FIN` para terminar manualmente, `JUGAR DE NUEVO` para reiniciar limpio (marcador 0-0), guardar el puntaje con iniciales y verlo reflejado en `/salon` (pestaña DUELO) y en el leaderboard lateral de `/juegos/duelo` tras recargar. Redimensionar la ventana (barrido ancho→estrecho) y confirmar que el marco CRT 4:3 queda centrado y sin desbordes. Confirmar que salir de la página no deja el loop ni los listeners de teclado corriendo en segundo plano.
6. **Build.** `npm run build` sin errores de tipos ni de rutas.

Cada paso deja el sistema funcional y es commiteable por separado.

---

## Criterios de aceptación

```markdown
- [ ] La fila `duelo` existe en `games` con su portada (`cover-duelo`) y aparece en `/games` y `/juegos/duelo`.
- [ ] `/juegos/duelo/jugar` renderiza el canvas real del juego (antes de este spec, `engine` es `undefined` para este `id` y el `.crt-screen` queda vacío).
- [ ] El HUD genérico (Puntuación/RIVAL/Nivel) refleja el estado real del motor mientras se juega.
- [ ] La pala del jugador se mueve con `↑`/`↓` y con `W`/`S`; la pala de la CPU se mueve sola siguiendo la pelota.
- [ ] La pelota rebota en los bordes superior/inferior y en ambas palas, con ángulo de salida dependiente del punto de impacto en la pala.
- [ ] Anotar un punto reinicia la pelota al centro con saque hacia el lado que perdió el punto anterior, sin romper el marcador acumulado.
- [ ] La partida termina en `gameover` en cuanto el jugador o la CPU llegan a 11 puntos, mostrando el modal de fin con el marcador real.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` funcionan según lo descrito en Alcance.
- [ ] El marco CRT 4:3 se ve centrado y sin desbordes en al menos tres anchos de ventana (ancho, tablet, móvil).
- [ ] Guardar el puntaje al terminar la partida lo hace aparecer en `/salon` y en el leaderboard de `/juegos/duelo` tras recargar la página.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

---

## Decisiones tomadas y descartadas

- **`cat: "VERSUS"`, `color: "magenta"`.** `VERSUS` está vacía en el catálogo real (`references/implemented-games.md`); `magenta` no se usa aún en ninguna fila real de `games`. Sin colisión con la entrada mock `"duelo-pixel"` (VERSUS/cyan) de `app/data/games.ts`, que no se toca.
- **Ángulo de rebote según punto de impacto se incluye ya en el núcleo, no se pospone a SPEC 03.** Es la mecánica central de Pong (sin ella el juego es un rebote trivial de `vx` invertido), así que pertenece al núcleo jugable, no a la identidad/pulido.
- **`score` guardado = puntos anotados por el jugador en un único set (0–11), rango bajo a propósito en este spec.** Se acepta como limitación temporal del núcleo mínimo; SPEC 02 lo extiende a un marcador acumulado a lo largo de una partida a mejor de varios sets para dar más rango al leaderboard.
- **Sin tecla de pausa propia del motor (a diferencia de Arkanoid con `P`/`Escape`).** Duelo no necesita un overlay de pausa con selector de nivel; el botón `PAUSA`/`REANUDAR` del HUD genérico es suficiente, igual que asteroides/tetris/snake.
- **IA de la CPU con velocidad máxima y zona muerta fijas (constantes), sin variar por nivel en este spec.** Mantiene el núcleo simple y jugable; la escala de dificultad por set es contenido explícito de SPEC 02.
- **Sin persistencia de puntaje fuera de Supabase, sin controles táctiles, sin sonido.** Mismo criterio que SPEC 05/06/07/08/09/10 para el primer spec de un juego nuevo.

## Riesgos identificados

- **Constantes de IA mal calibradas pueden hacer la CPU invencible o trivial.** Mitigación: verificación manual explícita en el paso 5 jugando al menos una partida completa hasta 11 puntos antes de dar el spec por cerrado.
- **Rango bajo del `score` guardado (0–11) da poco rango de diferenciación en el leaderboard.** Mitigación: aceptado explícitamente como limitación de este spec; SPEC 02 introduce un marcador acumulado a lo largo de varios sets para resolverlo, documentado en su propio spec.
- **Rebotes a velocidad creciente pueden causar tunneling (la pelota atraviesa la pala) si no se limita bien la velocidad máxima o no se usa una comprobación de colisión adecuada.** Mitigación: tope máximo de velocidad de la pelota (`speed` acotada) y verificación de colisión contra el rango de movimiento del frame, no solo la posición final; probado manualmente en el paso 5 con partidas largas.
