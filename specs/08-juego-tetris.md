# 08 — Juego Tetris

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, SPEC 07
**Fecha:** 2026-08-16

**Objetivo:** Portar el Tetris standalone de `references/started-games/03-tetris/` a un juego real y jugable dentro de Arcade Vault, con su propia entrada en el catálogo, motor propio y leaderboard real sobre `scores`, generalizando por primera vez la integración de motores a un registro (`engines.ts`) en vez del `if` puntual que hoy solo conoce a asteroides.

## Alcance

**Incluye:**

- Nueva fila en la tabla `games` de Supabase (sembrada por migración, siguiendo el patrón que dejó SPEC 07 con `asteroides` como única fuente de verdad del catálogo): `{ id: "tetris", title: "TETRIS", cat: "PUZZLE", cover: "cover-tetris", color: "yellow", short: "Encaja piezas geométricas antes de que se acumulen hasta el techo.", long: "Bloques de siete formas caen desde la oscuridad del vacío digital. Rótalos, encástralos y despeja líneas completas para sobrevivir a un ritmo que solo acelera. Un clásico reescrito en píxeles de neón.", best: 0, plays: "0" }`.
- Clase nueva `.cover-tetris` en `app/globals.css`, siguiendo el mismo patrón (gradiente + `::after`/`::before` decorativos) que `.cover-asteroides`/`.cover-tetro`.
- Puerto completo de la lógica de `references/started-games/03-tetris/game.js` a un módulo TypeScript `app/juegos/[id]/jugar/tetris-engine.ts`, exportando una clase `TetrisEngine` que encapsula todo el estado como propiedades de instancia (sin variables globales de módulo): tablero 10×20, las 7 piezas estándar + wall kicks, soft drop, hard drop, ghost piece, sistema de puntuación `LINE_SCORES = [0,100,300,500,800] × nivel` (+2/celda en hard drop, +1/fila en soft drop), nivel que sube cada 10 líneas, y velocidad de caída `max(100, 1000 − (nivel−1)×90)` ms.
- Componente cliente `app/juegos/[id]/jugar/tetris-canvas.tsx` que monta **dos** `<canvas>` dentro de `.crt-screen`, posicionados con CSS absoluto: el tablero (300×600, centrado) y un segundo canvas de vista previa "siguiente pieza" (120×120, desplazado a la derecha del tablero, sin alinear verticalmente con él). Instancia `TetrisEngine` en un efecto (con cleanup vía `destroy()`), y reporta el estado de partida al padre mediante `onStats`, solo cuando algún valor cambia.
- **Generalización de la integración de motores.** Se crea `app/juegos/[id]/jugar/engines.ts`: un registro `id → { Canvas, initialStats }` que mapea cada juego real a su componente de canvas y a su estado inicial de HUD. Se migra `asteroides` a este registro. `game-player.tsx` deja de tener el `if (game.id === "asteroides")` hardcodeado y en su lugar busca la entrada del juego en `engines.ts`; se eliminan las constantes `DEMO_SCORE`/`DEMO_LIVES`/`DEMO_LEVEL` y la rama `.game-arena` mock (ya inalcanzable desde SPEC 07, porque `getGame` nunca devuelve un id fuera de la tabla `games`). El insert a `scores` en el modal de fin pasa a usar `game.id` en vez del literal `"asteroides"`.
- **HUD configurable por juego.** El tercer bloque del HUD de `game-player.tsx` (hoy fijo como "Vidas" con corazones) se vuelve configurable: cada entrada de `engines.ts` declara la etiqueta y el valor de ese bloque. Para `asteroides` sigue siendo "Vidas" con `♥` repetidos; para `tetris` se muestra "LÍNEAS" con el conteo real de líneas eliminadas (`TetrisStats.lines`), sin corazones.
- Controles de teclado idénticos al original salvo la tecla de pausa: `←`/`→` mover, `↑` rotar (con wall kicks), `↓` soft drop, `Espacio` hard drop. Sin controles táctiles ni adaptación mobile.
- Mapeo de los botones existentes del HUD al motor real, igual que asteroides: `PAUSA`/`REANUDAR` → `engine.setPaused(bool)` (congela `update()`, sigue dibujando el último frame, no salta tiempo al reanudar); `FIN` → `engine.forceGameOver()`; game over orgánico cuando una pieza nueva colisiona al aparecer (`spawn()`); `JUGAR DE NUEVO` incrementa `resetKey` para remount completo; `SALIR` navega fuera y el unmount destruye el motor.
- Botón `GUARDAR PUNTUACIÓN` del modal de fin inserta una fila real en `scores` (`game_id: "tetris"`, `player_name`, `score`), reutilizando el mismo flujo de insert que ya existe para asteroides (ahora genérico por `game.id` gracias al registro de motores).
- Leaderboard real: `/juegos/tetris` (leaderboard lateral vía `getTopScores("tetris", 10)`), `/salon` (pestaña TETRIS, ya genérica desde SPEC 07) y la home (`getRecentScores`/`getTopPlayers`) incluyen a tetris automáticamente en cuanto existe la fila en `games`, sin cambios adicionales de código.

**No incluye (fuera de alcance de este spec):**

- El toggle de tema claro/oscuro del original (`theme-toggle`, `localStorage: tetris-theme`). Arcade Vault usa siempre su estética CRT/neón fija.
- La tecla `P` de pausa del original. La pausa se controla únicamente vía el botón `PAUSA`/`REANUDAR` del HUD, igual que asteroides — sin atajo de teclado adicional que deba mantenerse sincronizado con la prop `paused`.
- Controles táctiles/en pantalla para mobile.
- Persistencia adicional más allá de `scores` (sin localStorage, sin IndexedDB).
- Sonido/efectos de audio (el original tampoco los tiene).
- Recalcular `best`/`plays` de la fila `tetris` en `games` dinámicamente tras jugar; quedan estáticos como se siembran (0 / "0").
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido documentado desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.
- Cualquier cambio a las entradas mock `"caida"` u otras de `app/data/games.ts` — ese archivo no se modifica, igual que estableció SPEC 07.

## Modelo de datos

```ts
interface TetrisStats {
  score: number;
  lines: number; // reemplaza a "vidas" en el HUD para este juego
  level: number;
  status: "playing" | "dead" | "gameover";
}
```

`TetrisEngine` mantiene internamente el tablero (`board: number[][]`, 10×20, `0` = vacía, `1–7` = índice de color de pieza), la pieza actual y la siguiente (`{ type, shape, x, y }`), y el resto de flags (`paused`, `gameOver`, `dropAccum`, `dropInterval`, `animId`) como propiedades de instancia.

```ts
// app/juegos/[id]/jugar/engines.ts
interface GameEngineEntry {
  Canvas: ComponentType<{
    onStats: (stats: GameStats) => void;
    paused: boolean;
  }>;
  hudLabel: string; // "VIDAS" | "LÍNEAS" | ...
  initialStats: { score: number; secondary: number; level: number; status: "playing" };
}

const ENGINES: Record<string, GameEngineEntry> = {
  asteroides: {
    Canvas: AsteroidsCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
  },
  tetris: {
    Canvas: TetrisCanvas,
    hudLabel: "LÍNEAS",
    initialStats: { score: 0, secondary: 0, level: 1, status: "playing" },
  },
};
```

`game-player.tsx` usa `ENGINES[game.id]`; si no existe ninguna entrada (no debería pasar, dado que `games` solo contiene juegos reales), no se renderiza ningún canvas real (sin fallback mock, ya que SPEC 07 dejó esa rama inalcanzable).

## Plan de implementación

1. **Catálogo.** Migración vía `mcp__supabase__apply_migration` que inserta la fila `tetris` en `games` (ver Alcance), y la clase `.cover-tetris` en `app/globals.css`. El juego ya aparece en `/games` y `/juegos/tetris` (detalle), usando todavía el reproductor mock/roto al jugar (sin entrada aún en `engines.ts`).
2. **Motor del juego.** Crear `app/juegos/[id]/jugar/tetris-engine.ts` portando toda la lógica de `game.js` a la clase `TetrisEngine` (constructor recibe el `<canvas>` del tablero, el `<canvas>` de "siguiente pieza" y un callback `onStats`), incluyendo pausa (`setPaused`) y fin forzado (`forceGameOver`). Sin conectar todavía a ninguna UI.
3. **Wrapper de React.** Crear `app/juegos/[id]/jugar/tetris-canvas.tsx`, componente cliente que renderiza los dos `<canvas>` (tablero 300×600 centrado, next-canvas 120×120 desplazado a la derecha) posicionados con CSS absoluto dentro de `.crt-screen`, instancia `TetrisEngine` en un `useEffect` (con `destroy()` en el cleanup) y expone `forceGameOver` vía `useImperativeHandle`/`forwardRef`.
4. **Registro de motores.** Crear `app/juegos/[id]/jugar/engines.ts` con las entradas `asteroides` y `tetris` (ver Modelo de datos). Modificar `game-player.tsx`: reemplazar el `if (game.id === "asteroides")` por una búsqueda en `ENGINES[game.id]`, eliminar `DEMO_SCORE`/`DEMO_LIVES`/`DEMO_LEVEL` y la rama `.game-arena` mock, generalizar el HUD para usar `hudLabel`/`secondary` en vez de "Vidas" fijo con corazones (asteroides sigue mostrando corazones vía su propio `hudLabel`/formato; tetris muestra el número de líneas), y generalizar el insert de `GUARDAR PUNTUACIÓN` para usar `game.id` en vez del literal `"asteroides"`.
5. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/tetris/jugar`: mover/rotar (con wall kick)/soft drop/hard drop, ver el HUD (score/líneas/nivel) actualizarse en tiempo real, ver la pieza fantasma y la vista previa de la siguiente pieza, subir de nivel cada 10 líneas, provocar un game over orgánico (pieza nueva bloqueada) y ver el modal de fin con el score real, pausar y reanudar sin saltos, usar `FIN` para terminar manualmente, `JUGAR DE NUEVO` para reiniciar limpio, guardar el puntaje con iniciales y verlo reflejado en `/salon` (pestaña TETRIS) y en el leaderboard lateral de `/juegos/tetris` tras recargar la página. Repetir el recorrido básico de `/juegos/asteroides/jugar` para confirmar que el refactor del registro no rompió nada. Confirmar que salir de cualquiera de las dos páginas no deja loops ni listeners huérfanos.
6. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas.

## Criterios de aceptación

- [ ] `/games` y `/juegos/tetris` muestran la nueva entrada "TETRIS" en el catálogo, con su propia portada (`cover-tetris`).
- [ ] `/juegos/tetris/jugar` renderiza el juego real en dos `<canvas>` (tablero centrado + siguiente pieza a la derecha), controlable con `←` `→` `↑` `↓` `Espacio`.
- [ ] Las piezas rotan con wall kicks, el hard drop cae instantáneamente sumando puntos por celda, el soft drop acelera la caída sumando puntos por fila, y se ve la pieza fantasma proyectada.
- [ ] Completar una fila la elimina, suma puntos según `LINE_SCORES × nivel`, y el nivel sube cada 10 líneas acelerando la caída.
- [ ] El HUD muestra "LÍNEAS" (no "Vidas") con el conteo real para tetris, mientras que asteroides sigue mostrando "Vidas" con corazones sin cambios.
- [ ] Una pieza nueva que no puede aparecer (tablero lleno arriba) abre el modal de fin de partida automáticamente con el score real.
- [ ] El botón `PAUSA` congela el juego y `REANUDAR` lo continúa sin saltos de posición ni de tiempo; no existe atajo de teclado `P`.
- [ ] El botón `FIN` termina la partida de inmediato y abre el modal de fin con el score alcanzado hasta ese momento.
- [ ] El botón `JUGAR DE NUEVO` reinicia una partida completamente nueva (score en 0, líneas en 0, nivel 1).
- [ ] Guardar el puntaje inserta una fila real en `scores` con `game_id: "tetris"`, visible en `/salon` (pestaña TETRIS) y en el leaderboard de `/juegos/tetris` tras recargar la página.
- [ ] Después del refactor a `engines.ts`, `/juegos/asteroides/jugar` sigue funcionando exactamente igual que antes (HUD, pausa, fin, reinicio, guardado de puntaje).
- [ ] `game-player.tsx` ya no contiene `DEMO_SCORE`, `DEMO_LIVES`, `DEMO_LEVEL` ni la rama `.game-arena` mock.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Se crea el registro `engines.ts` en este spec, no en uno futuro.** Con tetris como segundo juego real, mantener el `if (game.id === "asteroides")` puntual ya no se sostiene; SPEC 05 explícitamente dejó la generalización para "cuando exista un segundo juego real que lo justifique" — ese momento es ahora.
- **Sin el theme-toggle del original.** Arcade Vault ya tiene una identidad visual fija (CRT/neón); el selector de tema del standalone es específico de ese proyecto suelto y no aporta dentro del cat_alogo.
- **Sin tecla `P` de pausa.** Igual que asteroides (que tampoco expone atajo de teclado para pausar), se evita una segunda fuente de verdad del estado de pausa además de la prop `paused` que ya controla el HUD.
- **Vista previa de "siguiente pieza" como segundo `<canvas>` dentro de `.crt-screen`, no en el HUD.** Mantiene el layout de `game-player.tsx` sin cambios estructurales fuera del contrato ya establecido (el juego decide su propio contenido visual dentro de `.crt-screen`); solo se generaliza el HUD para la etiqueta del tercer bloque (líneas vs. vidas).
- **HUD con bloque "Vidas" generalizado a `hudLabel`/`secondary` configurable por juego, en vez de un caso especial para tetris.** Evita que el próximo juego sin vidas (o sin nivel) vuelva a requerir un `if` puntual en el HUD.
- **Canvas del tablero en su tamaño original (300×600), sin reescalar a 4:3.** Se respetan las proporciones clásicas de Tetris en vez de forzarlas a coincidir con el `aspect-ratio` de `.crt-screen` que hoy asume asteroides.
- **id `"tetris"`, categoría `PUZZLE`, color `yellow`.** Sin conflicto con la entrada mock `"caida"` de `app/data/games.ts` (no se toca ni se lee); el color queda libre para reutilizarse porque la tabla `games` real hoy solo contiene `asteroides` (cyan).
- **Sin persistencia de puntaje fuera de Supabase, sin controles táctiles, sin sonido.** Mismo criterio que SPEC 05/06/07 para el primer juego real; se mantiene consistente para el segundo.

## Riesgos identificados

- **El refactor de `game-player.tsx` a `engines.ts` puede romper el flujo existente de asteroides si el mapeo de HUD no es exactamente equivalente.** Mitigación: el paso 5 del plan exige repetir el recorrido manual completo de `/juegos/asteroides/jugar` después del refactor, no solo el de tetris.
- **Dos `<canvas>` con dos ciclos de vida (`useEffect`) dentro del mismo componente aumentan el riesgo de fugas de listeners/RAF en Strict Mode.** Mitigación: `TetrisEngine.destroy()` debe ser idempotente y limpiar tanto el RAF como los listeners de teclado en un único punto, igual que exige el contrato ya probado por `AsteroidsEngine`.
- **Wall kicks y ghost piece son la parte más propensa a bugs sutiles del port.** Si `tryRotate()` no replica exactamente los kicks `[0,-1,1,-2,2]` del original, piezas podrían rotar de forma distinta cerca de las paredes. Mitigación: verificación manual explícita de rotación pegada a los bordes izquierdo/derecho en el paso 5.
