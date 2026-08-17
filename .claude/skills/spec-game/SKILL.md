---
name: spec-game
description: Diseña el spec de un juego nuevo para Arcade Vault (motor, canvas, catálogo en Supabase y leaderboard). Pregunta antes de escribir. Úsalo antes de programar un juego.
disable-model-invocation: true
argument-hint: "nombre o descripción del juego (o carpeta de references/started-games)"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /spec-game — Diseñador de specs de juegos

## Contexto de sesión

Fecha de hoy (úsala para el header del spec, nunca la adivines):
!`date +%F`

Specs que ya existen:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ todavía no existe"`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null || echo "No hay carpeta references/started-games/"`

Estado actual de la integración de juegos (motores ya registrados en `engines.ts`, wrappers de canvas, etc.):
!`ls app/juegos/\[id\]/jugar/ 2>/dev/null || echo "No existe app/juegos/[id]/jugar/ todavía"`

---

Este skill es un `/spec` especializado en juegos de Arcade Vault. **No escribes código aquí.** Tu trabajo es aclarar qué juego se va a construir, hacer las preguntas propias del dominio (fuente, catálogo, mecánica/HUD, controles, assets), y dejar un spec listo en `specs/` siguiendo el patrón que ya establecieron los SPEC 05 (motor/canvas), 06 (leaderboard) y 07 (catálogo desde Supabase).

Lee `game-template.md` (en el mismo directorio que este skill) para la estructura completa que debe seguir el spec. Ese archivo extiende `.claude/skills/spec/template.md` — si necesitas más detalle sobre alguna sección genérica (decisiones, riesgos, criterios), consulta también ese archivo.

## Filosofía

Agregar un juego a Arcade Vault es un proceso repetible: fila en `games`, portada CSS, motor TS, wrapper de canvas, integración al reproductor, leaderboard sobre `scores`. Sin este skill, cada juego nuevo redescubre esos pasos desde cero. El spec generado aquí ya trae ese esqueleto de plan de implementación — tu trabajo es llenarlo con las decisiones específicas del juego, no inventar la estructura cada vez.

## Flujo

Sigue las cuatro fases en orden. **Nunca te saltes la Fase 2.** Tus respuestas deben estar en español, igual que el resto de specs del repo.

### Fase 1 — Entender el contexto

1. Lee `CLAUDE.md` y `AGENTS.md` si existen.
2. Mira el listado de `specs/` de arriba. Lee al menos los SPEC 05, 06 y 07 (o los dos más recientes si hay más) para el vocabulario exacto: estados `Borrador`/`Aprobado`/`Implementado`, y cómo describen el motor/canvas/leaderboard.
3. **Si `$ARGUMENTS` nombra o coincide con una carpeta de `references/started-games/`** (por ejemplo `03-tetris` o "arkanoid"): lee su `README.md`, su `CLAUDE.md`/`AGENTS.md` y su `game.js` completo. Extrae de ahí, sin preguntárselo al usuario salvo que quede ambiguo: entidades del juego, sistema de controles, cómo se calcula el puntaje, si hay vidas/niveles, tamaño del canvas, y qué assets (imágenes/sonidos) usa. Si el juego no viene de esa carpeta, todo este material sale de las preguntas de la Fase 2 en vez de leerse de un archivo.
4. Lee la arquitectura real de integración de juegos, siempre, exista o no una referencia:
   - `app/juegos/[id]/jugar/game-player.tsx` — HUD genérico (Jugador/Puntuación/`hudLabel`/Nivel), overlay de pausa, modal de fin de partida, insert a `scores`, y cómo pasa `engine.crtAspect` como variable CSS `--crt-aspect` al `.crt-screen`.
   - `app/juegos/[id]/jugar/engines.ts` — **el registro de motores ya existe**, con dos entradas (`asteroides`, `tetris`). Cada entrada es `{ Canvas, hudLabel, initialStats, crtAspect }`. `GameStats` es `{ score, secondary, level, status }` — `secondary` es un campo genérico (vidas, líneas, lo que sea) cuya etiqueta pone `hudLabel` (`"VIDAS"`, `"LÍNEAS"`, ...); no hay campo `lives` fijo. El paso 5 del plan (ver `game-template.md`) siempre es "agregar una entrada a este mapa", nunca crearlo desde cero.
   - `app/juegos/[id]/jugar/asteroids-engine.ts` y `asteroids-canvas.tsx` — el contrato de motor: clase con `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y un callback `onStats` que solo notifica en cambios (no cada frame). El wrapper de React es un `forwardRef` + `useImperativeHandle` que expone `forceGameOver`, e instancia el motor en un `useEffect` con `destroy()` en el cleanup. Además, `AsteroidsEngine` dibuja su propio HUD **dentro del canvas** (`drawHUD`, `drawLifeIcon`, `drawOverlay`) fiel a `references/started-games/02-asteroids/game.js` — es el patrón de referencia cuando el juego de origen ya pintaba su HUD con `ctx.fillText`.
   - `app/juegos/[id]/jugar/tetris-canvas.tsx` — el otro patrón de HUD: un panel lateral **en DOM** (SCORE/LINES/LEVEL/NEXT/CONTROLS) con estado local (`useState<TetrisStats>`) alimentado por el mismo callback que informa a `onStats`, y un `ResizeObserver` que escala el conjunto tablero+panel (`transform: scale(...)`) para cuando el "stage" del juego no tiene una relación de aspecto simple tipo 4:3. Es el patrón a copiar cuando el juego de origen ya traía su HUD en HTML/CSS.
   - `app/lib/games.ts` y `app/lib/scores.ts` — cómo se lee hoy el catálogo (`getGames`/`getGame`) y los puntajes (`getTopScores`/`getRecentScores`/`getTopPlayers`) desde Supabase.
   - `app/data/games.ts` — el tipo `Game` (`cat`: `ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`; `color`: `cyan`/`magenta`/`yellow`/`green`) y `ScoreRow`. Este archivo ya no alimenta la UI (SPEC 07), pero sus tipos se siguen reutilizando.
   - `app/globals.css` — `.crt-screen` usa `aspect-ratio: var(--crt-aspect, 4 / 3)` más `margin: 0 auto` (el `auto` es imprescindible: sin él, cuando el ancho derivado del aspect-ratio queda por debajo del ancho disponible, el marco se pega a la izquierda en vez de centrarse) y `max-height: 78vh`. También existen ya las reglas responsivas genéricas: `.player-hud` pasa a grid 2×2 en `≤720px`, `.kbd-notice` (aviso "requiere teclado", solo visible con `@media (hover: none) and (pointer: coarse)`), y el bloque `.tetris-*` con la paleta Tokyo Night portada de la referencia. No reinventes estas reglas para un juego nuevo — reutilízalas o extiéndelas.

Si `$ARGUMENTS` viene vacío, pide una descripción de una sola frase de qué juego se quiere agregar (y si viene o no de `references/started-games/`).

### Fase 2 — Aclarar con preguntas

Usa `AskUserQuestion` en bloques de 3 a 5 preguntas, esperando respuesta antes de seguir. Cubre siempre estas categorías, en este orden, saltando solo lo que ya quedó resuelto por una referencia leída en Fase 1 sin ambigüedad:

1. **Origen y alcance.** ¿Viene de `references/started-games/<x>` o se construye desde cero? Si viene de una referencia: ¿port fiel o con cambios deliberados? ¿Qué queda explícitamente fuera de este spec (igual que SPEC 05 dejó fuera persistencia y mobile)?
2. **Catálogo.** `id` (kebab-case — es el mismo valor que se guarda como `game_id` en `scores`), `title`, `cat`, `color`, `short`/`long` (mismo tono que las entradas existentes en `app/data/games.ts`), y valores iniciales de `best`/`plays`.
3. **Mecánica y HUD.** ¿Tiene vidas? ¿Tiene niveles? ¿Cómo se calcula el puntaje? La barra genérica de `game-player.tsx` (Jugador/Puntuación/`hudLabel`/Nivel) se mantiene siempre — define qué va en `secondary` y qué etiqueta (`hudLabel`) lleva. Además, pregunta si el juego necesita **su propio HUD**, igual que Asteroids y Tetris: si la referencia ya dibuja SCORE/vidas/etc. dentro del canvas (patrón `drawHUD` de `asteroids-engine.ts`) o en un panel HTML propio (patrón `tetris-canvas.tsx` + CSS dedicado), pórtalo fielmente en vez de conformarte con la barra genérica. Si la referencia no tenía HUD visible propio, la barra genérica basta y no hace falta preguntar más.
4. **Controles y ciclo de vida.** Teclas exactas. Qué debe hacer `PAUSA` (¿congela sin saltar tiempo al reanudar, como asteroides?), qué hace `FIN` (game over inmediato con el score actual), y si existen estados intermedios propios del juego (nivel completado, combo, etc.) más allá de `playing`/`dead`/`gameover`.
5. **Assets y canvas.** Resolución/forma del campo de juego y su relación de aspecto (asteroides es 800×600 → 4:3; tetris es retrato → 4:5): esto define el valor de `crtAspect` en `engines.ts`, no hace falta forzar 4:3. Si el "stage" (canvas + HUD propio) no es un simple rectángulo que llena el marco —por ejemplo trae un panel lateral como tetris—, se necesita el mismo patrón de `ResizeObserver` + `transform: scale()` de `tetris-canvas.tsx`. Pregunta también qué sprites/sonidos hay que copiar desde la carpeta de referencia a `public/juegos/<id>/`, y si el audio requiere un gesto del usuario para arrancar (autoplay bloqueado por navegador).
6. **Riesgos y decisiones cerradas.** ¿Hay alguna decisión que el usuario ya tomó y no quiere reabrir? ¿Algo que surgió en la conversación pero merece su propio spec futuro (por ejemplo: mobile, sonido, moderación de puntajes)?

Al ofrecer opciones, dalas de 2 a 4, marcando tu recomendación. Si detectas algo que abre una caja de Pandora (multiplayer, autenticación real, editor de niveles), señala que merece spec propio y pregunta si se deja fuera de este.

**Cuándo parar:** cuando puedas responder sin suponer nada:

1. ¿Qué archivos van a aparecer o cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo se verifica que el juego quedó terminado?

### Fase 3 — Escribir el spec

Igual que `/spec`: si ya tienes todo lo necesario para responder las tres preguntas de corte sin inventar nada, escribe el spec completo de una vez (no vayas sección por sección, no pidas aprobación de un borrador) y pasa directo a la Fase 4. Solo si algo quedó sin resolver, desarrolla sección por sección mostrando cada una y esperando confirmación.

El spec sigue la estructura de `game-template.md`. En particular, el **Plan de implementación** debe seguir siempre este esqueleto (adaptado al juego concreto, con nombres de archivo reales, nunca genéricos):

1. **Catálogo.** Migración vía `mcp__supabase__apply_migration` que inserta la fila del juego en la tabla `games` (`id`, `title`, `short`, `long`, `cat`, `cover: "cover-<id>"`, `color`, `best`, `plays`), más la clase `.cover-<id>` nueva en `app/globals.css` siguiendo el patrón de `.cover-asteroides`/`.cover-rocas`. Verificable de inmediato: el juego aparece en `/games` y `/juegos/<id>` (en `/juegos/<id>/jugar` el `.crt-screen` queda vacío hasta el paso 5, porque `ENGINES[id]` todavía no existe).
2. **Assets** (omitir este paso solo si el juego no tiene sprites/sonidos). Copiar de `references/started-games/<x>/assets/` a `public/juegos/<id>/`, reescribiendo las rutas del código a `/juegos/<id>/...`.
3. **Motor.** `app/juegos/[id]/jugar/<id>-engine.ts`: clase `<Juego>Engine` con todo el estado como propiedades de instancia (nunca variables globales de módulo), constructor `(canvas, onStats)` (o `(canvas, hudCanvas, onStats)` si necesita un segundo canvas, como el `nextCanvas` de tetris), y el mismo contrato que `AsteroidsEngine`/`TetrisEngine`: `start()`, `destroy()` (idempotente, limpia `requestAnimationFrame` y listeners de teclado), `setPaused(paused)`, `forceGameOver()`. `onStats` solo notifica cuando algún valor cambia, nunca por frame. Si el juego trae HUD propio dibujado en canvas (decidido en Fase 2), agrega aquí los métodos privados de dibujo (`drawHUD`, etc.) fieles a la referencia, con `ctx.save()`/`ctx.restore()` alrededor para no filtrar estado a otras entidades.
4. **Wrapper de React.** `app/juegos/[id]/jugar/<id>-canvas.tsx`, componente cliente, calcado de `asteroids-canvas.tsx` (HUD en canvas) o de `tetris-canvas.tsx` (HUD propio en DOM): `forwardRef` + `useImperativeHandle` exponiendo `forceGameOver`, instancia el motor en un `useEffect` con `destroy()` en el cleanup, re-sincroniza `paused` en otro efecto. Si el HUD es DOM, mantiene su propio `useState` de stats nativas del motor (alimentado en el mismo callback que llama a `onStats`) para pintar el panel; si el stage no es un simple relleno 100%/100% del marco, añade el patrón `ResizeObserver` + `transform: scale(...)` de `tetris-canvas.tsx`.
5. **Registro del motor en `engines.ts`.** El registro (`app/juegos/[id]/jugar/engines.ts`) ya existe — este paso siempre es agregar una entrada nueva al mapa `ENGINES`: `{ Canvas, hudLabel, initialStats, crtAspect }`. No hay refactor que describir.
6. **Verificación manual.** `npm run dev`: jugar una partida completa en `/juegos/<id>/jugar` con los controles reales, ver el HUD (genérico y, si aplica, el propio del juego) actualizarse en vivo, probar `PAUSA`/`REANUDAR` sin saltos, `FIN` para terminar manualmente, llegar a game over orgánico, `JUGAR DE NUEVO` para reiniciar limpio, guardar el puntaje con iniciales y verlo reflejado en `/salon` y en el leaderboard de `/juegos/<id>` tras recargar la página (viene de Supabase, no de estado local). Confirmar que salir de la página no deja el loop ni los listeners corriendo en segundo plano. Redimensionar la ventana (barrido ancho→estrecho, incluyendo un ancho grande tipo 1800px) y confirmar que el marco CRT queda centrado y sin desbordes — no asumas que el `crtAspect` elegido funciona sin probarlo.
7. **Build.** `npm run build` sin errores de tipos ni de rutas.

Los **criterios de aceptación** son un checklist booleano por juego, siempre incluyendo como mínimo: la fila del juego existe en `games` con su portada, `/juegos/<id>/jugar` renderiza el canvas real (no el mock), el HUD (genérico y el propio si aplica) refleja el motor real, el marco CRT se ve centrado y sin desbordes en al menos tres anchos de ventana distintos, guardar un puntaje lo hace aparecer en `/salon` y en el leaderboard del juego tras recargar, y `npm run build` compila limpio.

### Fase 4 — Guardar el spec

Igual que `/spec`:

1. Número siguiente de `specs/` (el más alto + 1, con dos dígitos).
2. Slug kebab-case de la forma `juego-<nombre>` (por ejemplo `juego-tetris`), para que el archivo quede `specs/NN-juego-<nombre>.md`.
3. Fecha del contexto de sesión de arriba, nunca inventada.
4. Escribe el archivo directo, sin pedir permiso ni confirmar el nombre — anuncia la ruta en la confirmación final.
5. Estado `Borrador` por defecto. Nunca lo marques `Aprobado`.
6. Si el header referencia dependencias (por ejemplo SPEC 06/07 por el patrón de `scores`/`games`), confirma que esos specs existen en `specs/`.
7. Semilla `specs/.spec-config.yml` si no existe, igual que hace `/spec` (mismo contenido por defecto, `AutoCreateBranch: true`). Si ya existe, no lo toques.
8. Confirma al usuario: ruta del archivo creado, recordatorio de que está en `Borrador` y hay que pasarlo a `Aprobado` a mano tras revisarlo, y que el siguiente paso es `/spec-impl NN-juego-<nombre>`. **Para ahí.** No propongas implementar nada más.

## Reglas duras

- **Nunca escribas código en este comando.** Solo el `.md` del spec al final.
- **Nunca propongas implementar el spec después de guardarlo.**
- **Nunca asumas decisiones que el usuario no confirmó** — en particular el `id` del juego, los controles exactos, y si el juego necesita o no HUD propio (y de qué patrón: canvas o DOM). Si algo no quedó claro en Fase 1, pregúntalo en Fase 2.
- **No repreguntes en Fase 3 lo que ya se respondió en Fase 2.**
- **Si el juego es demasiado grande** (mecánicas de multiplayer, editor de niveles, sistema de logros, etc. mezclados en una sola descripción), propone dividirlo: un spec para el juego jugable base, specs futuros para lo demás.

## Argumentos

`$ARGUMENTS` es la descripción o referencia del juego, no el nombre del archivo. Si coincide con una carpeta de `references/started-games/` (por nombre completo, como `03-tetris`, o por el juego que representa, como "tetris" o "arkanoid"), úsalo como punto de partida de la Fase 1 para leer esa carpeta. Si viene vacío, pide la descripción de una sola frase antes de continuar.
