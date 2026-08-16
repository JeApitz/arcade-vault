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

Estado actual de la integración de juegos (¿existe ya un registry o todavía manda el if de asteroides?):
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
   - `app/juegos/[id]/jugar/game-player.tsx` — HUD, modal de fin de partida, insert a `scores`, y cómo decide hoy qué motor renderizar.
   - `app/juegos/[id]/jugar/asteroids-engine.ts` y `asteroids-canvas.tsx` — el contrato de motor ya establecido: clase con `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y un callback `onStats` que solo notifica en cambios (no cada frame). El wrapper de React es un `forwardRef` + `useImperativeHandle` que expone `forceGameOver`, e instancia el motor en un `useEffect` con `destroy()` en el cleanup.
   - `app/lib/games.ts` y `app/lib/scores.ts` — cómo se lee hoy el catálogo (`getGames`/`getGame`) y los puntajes (`getTopScores`/`getRecentScores`/`getTopPlayers`) desde Supabase.
   - `app/data/games.ts` — el tipo `Game` (`cat`: `ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`; `color`: `cyan`/`magenta`/`yellow`/`green`) y `ScoreRow`. Este archivo ya no alimenta la UI (SPEC 07), pero sus tipos se siguen reutilizando.
   - Revisa el listado de `app/juegos/[id]/jugar/` del contexto de sesión: si aparece un archivo tipo `engines.ts`/`registry.ts`, ya existe un registro de motores y el paso 5 del plan (ver `game-template.md`) se reduce a agregar una entrada; si no aparece, el spec que generes debe incluir crear ese registry y migrar `asteroides` a él.

Si `$ARGUMENTS` viene vacío, pide una descripción de una sola frase de qué juego se quiere agregar (y si viene o no de `references/started-games/`).

### Fase 2 — Aclarar con preguntas

Usa `AskUserQuestion` en bloques de 3 a 5 preguntas, esperando respuesta antes de seguir. Cubre siempre estas categorías, en este orden, saltando solo lo que ya quedó resuelto por una referencia leída en Fase 1 sin ambigüedad:

1. **Origen y alcance.** ¿Viene de `references/started-games/<x>` o se construye desde cero? Si viene de una referencia: ¿port fiel o con cambios deliberados? ¿Qué queda explícitamente fuera de este spec (igual que SPEC 05 dejó fuera persistencia y mobile)?
2. **Catálogo.** `id` (kebab-case — es el mismo valor que se guarda como `game_id` en `scores`), `title`, `cat`, `color`, `short`/`long` (mismo tono que las entradas existentes en `app/data/games.ts`), y valores iniciales de `best`/`plays`.
3. **Mecánica y HUD.** ¿Tiene vidas? ¿Tiene niveles? ¿Cómo se calcula el puntaje? El HUD de `game-player.tsx` hoy muestra Puntuación/Vidas/Nivel — si el juego no tiene alguno de esos tres, pregunta qué se muestra en su lugar (no asumas placeholders).
4. **Controles y ciclo de vida.** Teclas exactas. Qué debe hacer `PAUSA` (¿congela sin saltar tiempo al reanudar, como asteroides?), qué hace `FIN` (game over inmediato con el score actual), y si existen estados intermedios propios del juego (nivel completado, combo, etc.) más allá de `playing`/`dead`/`gameover`.
5. **Assets y canvas.** Resolución fija del canvas (asteroides usa 800×600 escalado por CSS dentro de `.crt-screen`, que es 4:3 — ¿este juego respeta esa relación o necesita otra?), qué sprites/sonidos hay que copiar desde la carpeta de referencia a `public/juegos/<id>/`, y si el audio requiere un gesto del usuario para arrancar (autoplay bloqueado por navegador).
6. **Riesgos y decisiones cerradas.** ¿Hay alguna decisión que el usuario ya tomó y no quiere reabrir? ¿Algo que surgió en la conversación pero merece su propio spec futuro (por ejemplo: mobile, sonido, moderación de puntajes)?

Al ofrecer opciones, dalas de 2 a 4, marcando tu recomendación. Si detectas algo que abre una caja de Pandora (multiplayer, autenticación real, editor de niveles), señala que merece spec propio y pregunta si se deja fuera de este.

**Cuándo parar:** cuando puedas responder sin suponer nada:

1. ¿Qué archivos van a aparecer o cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo se verifica que el juego quedó terminado?

### Fase 3 — Escribir el spec

Igual que `/spec`: si ya tienes todo lo necesario para responder las tres preguntas de corte sin inventar nada, escribe el spec completo de una vez (no vayas sección por sección, no pidas aprobación de un borrador) y pasa directo a la Fase 4. Solo si algo quedó sin resolver, desarrolla sección por sección mostrando cada una y esperando confirmación.

El spec sigue la estructura de `game-template.md`. En particular, el **Plan de implementación** debe seguir siempre este esqueleto (adaptado al juego concreto, con nombres de archivo reales, nunca genéricos):

1. **Catálogo.** Migración vía `mcp__supabase__apply_migration` que inserta la fila del juego en la tabla `games` (`id`, `title`, `short`, `long`, `cat`, `cover: "cover-<id>"`, `color`, `best`, `plays`), más la clase `.cover-<id>` nueva en `app/globals.css` siguiendo el patrón de `.cover-asteroides`/`.cover-rocas`. Verificable de inmediato: el juego aparece en `/games` y `/juegos/<id>` (con el reproductor mock todavía).
2. **Assets** (omitir este paso solo si el juego no tiene sprites/sonidos). Copiar de `references/started-games/<x>/assets/` a `public/juegos/<id>/`, reescribiendo las rutas del código a `/juegos/<id>/...`.
3. **Motor.** `app/juegos/[id]/jugar/<id>-engine.ts`: clase `<Juego>Engine` con todo el estado como propiedades de instancia (nunca variables globales de módulo), constructor `(canvas, onStats)`, y el mismo contrato que `AsteroidsEngine`: `start()`, `destroy()` (idempotente, limpia `requestAnimationFrame` y listeners de teclado), `setPaused(paused)`, `forceGameOver()`. `onStats` solo notifica cuando algún valor cambia, nunca por frame.
4. **Wrapper de React.** `app/juegos/[id]/jugar/<id>-canvas.tsx`, componente cliente, calcado de `asteroids-canvas.tsx`: `forwardRef` + `useImperativeHandle` exponiendo `forceGameOver`, instancia el motor en un `useEffect` con `destroy()` en el cleanup, re-sincroniza `paused` en otro efecto.
5. **Registro del motor en `game-player.tsx`.**
   - Si `app/juegos/[id]/jugar/engines.ts` (o equivalente) **no existe todavía**: este paso lo crea — un mapa `id → { Canvas, initialStats }` — y migra `asteroides` a él, eliminando de `game-player.tsx` el `if (game.id === "asteroides")`, las constantes `DEMO_SCORE`/`DEMO_LIVES`/`DEMO_LEVEL` y la rama `.game-arena` mock (SPEC 07 ya dejó esa rama inalcanzable, dado que `getGame` nunca devuelve un id fuera de la tabla `games`). El insert a `scores` pasa a usar `game.id` en vez del literal `"asteroides"`.
   - Si el registry **ya existe**: el paso se reduce a agregar la entrada del juego nuevo al mapa. No se vuelve a describir el refactor.
6. **Verificación manual.** `npm run dev`: jugar una partida completa en `/juegos/<id>/jugar` con los controles reales, ver el HUD actualizarse en vivo, probar `PAUSA`/`REANUDAR` sin saltos, `FIN` para terminar manualmente, llegar a game over orgánico, `JUGAR DE NUEVO` para reiniciar limpio, guardar el puntaje con iniciales y verlo reflejado en `/salon` y en el leaderboard de `/juegos/<id>` tras recargar la página (viene de Supabase, no de estado local). Confirmar que salir de la página no deja el loop ni los listeners corriendo en segundo plano.
7. **Build.** `npm run build` sin errores de tipos ni de rutas.

Los **criterios de aceptación** son un checklist booleano por juego, siempre incluyendo como mínimo: la fila del juego existe en `games` con su portada, `/juegos/<id>/jugar` renderiza el canvas real (no el mock), el HUD refleja el motor real, guardar un puntaje lo hace aparecer en `/salon` y en el leaderboord del juego tras recargar, ASTEROIDES sigue funcionando igual después del refactor del registry (si este spec lo hace), y `npm run build` compila limpio.

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
- **Nunca asumas decisiones que el usuario no confirmó** — en particular el `id` del juego, los controles exactos y si hay o no registry ya creado. Si algo no quedó claro en Fase 1, pregúntalo en Fase 2.
- **No repreguntes en Fase 3 lo que ya se respondió en Fase 2.**
- **Si el juego es demasiado grande** (mecánicas de multiplayer, editor de niveles, sistema de logros, etc. mezclados en una sola descripción), propone dividirlo: un spec para el juego jugable base, specs futuros para lo demás.

## Argumentos

`$ARGUMENTS` es la descripción o referencia del juego, no el nombre del archivo. Si coincide con una carpeta de `references/started-games/` (por nombre completo, como `03-tetris`, o por el juego que representa, como "tetris" o "arkanoid"), úsalo como punto de partida de la Fase 1 para leer esa carpeta. Si viene vacío, pide la descripción de una sola frase antes de continuar.
