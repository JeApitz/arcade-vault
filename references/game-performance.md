# Rendimiento y encuadre por juego

Memoria del agente `game-performance-booster`. Se actualiza en CADA corrida, sobre el juego trabajado.
Rúbrica fija: P1–P10 (ver definición completa en `.claude/agents/game-performance-booster.md`),
derivada de `specs/13-frogger-encuadre-hud-rendimiento.md`.

## Estado

| Juego      | P1  | P2  | P3  | P4  | P5  | P6  | P7  | P8  | P9  | P10 | Fecha      | Notas                                                                                                                                                              |
| ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| frogger    | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | 🟡  | 2026-08-25 | vía `specs/13-frogger-encuadre-hud-rendimiento.md`, no por corrida de este agente                                                                                  |
| asteroides | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente                                                                                                                                                          |
| tetris     | ✅  | ✅  | ✅  | ✅  | ✅  | ⬛  | ⬛  | ✅  | ✅  | ✅  | 2026-08-25 | corrida de este agente; HUD en DOM (P6 n/a), sin overflow detectado (P7 n/a); hotfix post-corrida: `resize()` llamaba `draw()` antes de `initGame()` — ver Gotchas |
| arkanoid   | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente; ya tiene sheet teñido cacheado (P9 parcial)                                                                                                             |
| snake      | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente                                                                                                                                                          |

Leyenda: ✅ cumple · 🟡 en curso · ⬜ pendiente · ⬛ n/a para este juego · ❌ bloqueado (anotar en Pendientes).

## Implementación de referencia

Frogger es la implementación de referencia de todos los patrones de esta rúbrica:

- **P1** (no repintar en pausa): `frogger-engine.ts:140-148` (`setPaused`) y `:785-798` (`loop`).
- **P2/P3** (capa estática cacheada, a resolución real): `frogger-engine.ts:101-105` (campos `staticLayer`/`staticLayerCtx`/`deviceScale`), `:527-539` (`createOffscreenCanvas`), `:541-580` (`rebuildStaticLayer`), `:582-590` (`draw()` con un solo `drawImage`).
- **P5** (`resize()` en el motor): `frogger-engine.ts:159-164`.
- **P4** (DPR real + `ResizeObserver`): `frogger-canvas.tsx:18-20` (`LOGICAL_W/H`, `MAX_DPR = 2`), `:45-63` (`applySize()` + `ResizeObserver` sobre el contenedor, `disconnect()` en cleanup).
- **P6** (banda de HUD): `frogger-engine.ts` — `HUD_H`, `ctx.save()/translate(0, HUD_H)/restore()` alrededor del tablero; `crtAspect: "16 / 15"` en `engines.ts`.
- **P7** (encuadre a viewport): `fitViewport: true` en la entrada `frogger` de `engines.ts`; `.crt-viewport` en `game-player.tsx`; bloque CSS en `app/globals.css` (`.av-player--fit`, `.av-player--fit .crt-viewport`, `.av-player--fit .crt-screen`).
- **P10** queda en `🟡`: frogger no resetea `lastTime` en `visibilitychange` — el spec 13 no cubrió ese caso explícitamente. Primera corrida real de este agente sobre cualquier juego debe decidir si lo cierra ahí también o lo deja como deuda conocida.

## Invariantes (no romper)

1. El sitio es dark-only. No se añade light mode.
2. `resetKey`/`skinId` nunca entran en el `key` de `<engine.Canvas>`.
3. `setSkin` sigue forzando un repintado inmediato: el rAF puede estar sin dibujar en pausa.
4. La mecánica de juego (física, velocidad, puntuación, vidas, controles, generación de niveles) es intocable — este agente solo cambia cómo y cuándo se dibuja/mide, nunca qué se juega.
5. El patrón de sizing (offscreen + ResizeObserver + DPR) se replica por juego; no se extrae a un helper compartido salvo que el usuario pida esa spec aparte — el propio spec 13 lo dejó fuera de alcance.

## Registro de decisiones

- **Tope de DPR en 2x**, heredado de `specs/13-frogger-encuadre-hud-rendimiento.md`: pantallas 3x no aportan nitidez perceptible extra y sí disparan el costo de fill/blit por frame.
- **Capa estática pre-renderizada, no dirty rects**: más simple y suficiente cuando el fondo es completamente estático mientras no cambie skin/tamaño; no se justifica trackear rectángulos sucios para este tipo de loop.
- **No cancelar el `rAF` en pausa**: más simple que introducir throttle, y permite reaccionar de inmediato al reanudar sin reprogramar el loop.
- **`.crt-viewport` como contenedor intermedio, no `.crt-screen` como flex item directo**: un box de `aspect-ratio` como hijo directo de un flex container no resuelve ambos ejes a la vez; como bloque normal (con `max-height:100%` en vez de `78vh`) sí lo resuelve el navegador, ya validado en producción por Frogger.
- **Marcado `⬛ n/a` explícito para P6/P7 en juegos sin HUD-en-canvas o sin problema de encuadre**, en vez de forzar el patrón donde no hace falta — evita reabrir CSS que hoy funciona bien.

## Pendientes y riesgos conocidos

- **Limitación fija de todas las corridas**: sin verificación en navegador ni medición de FPS real; todo el cumplimiento P1–P10 se declara por lectura de código.
- Frogger sigue en `🟡` en P10 (no resetea `lastTime` en `visibilitychange`) — deuda conocida del spec 13, no tocada por este agente (fuera de alcance: solo se toca un juego por corrida).

## Por juego

_(una sección `### <juego>` por juego trabajado por este agente; `frogger` no tiene sección propia aquí porque su cumplimiento vino del spec 13, no de una corrida de este agente — ver "Implementación de referencia" arriba)_

### tetris

**Hallazgos (antes de corregir):**

- P1: `tetris-engine.ts:407-415` (antes de corregir) — `loop()` seguía llamando `draw()` en cada frame mientras `paused` o `status === "gameover"` eran verdaderos (`this.lastTime = ts; this.draw();` dentro de esa rama), sin dejar de repintar.
- P1: `tetris-engine.ts:133-135` (antes) — `setPaused(paused)` no tenía early-return por valor sin cambio.
- P2/P9: `tetris-engine.ts:314-330` (antes, `drawGrid()`) — la rejilla de 9+19 líneas (`stroke()`) se recalculaba dentro de `draw()` en cada frame, pese a ser estática mientras no cambie el skin.
- P4: `tetris-canvas.tsx:112,130` (antes) — `<canvas width={300} height={600}>` y `<canvas width={120} height={120}>` fijos, sin relación con `devicePixelRatio`; en pantallas de alto DPR el tablero se veía borroso porque el backing store nunca escalaba más allá de 1x lógico.
- P5: no existía `resize()` en `TetrisEngine`.
- P8: `tetris-engine.ts:417` (antes) — `const dt = ts - this.lastTime` sin clamp; un frame largo (pestaña en segundo plano) podía disparar varias caídas de pieza de golpe al volver.
- P10: no había listener de `visibilitychange` para resetear `lastTime` al volver de segundo plano.
- P6/P7: n/a — el HUD de Tetris vive en `tetris-panel` (DOM/React), no en el canvas; el encuadre ya usa `tetris-stage-wrap` + `ResizeObserver` + `transform: scale(min(1, w/STAGE_W, h/STAGE_H))` (`tetris-canvas.tsx:103-113`), con `scale` topado en 1 (nunca agranda), y `.crt-screen` acotado por `max-height:78dvh` (`app/globals.css:1329-1330`) igual que arkanoid/snake/asteroides, que spec 13 confirmó explícitamente que quedan sin cambios de encuadre; no se detectó overflow por lectura de CSS.

**Correcciones:**

- P1/P8/P10 (`tetris-engine.ts`): `setPaused` con early-return + pintado único al pausar + `lastTime = null` al reanudar; `loop()` ya no dibuja en la rama `paused || gameover` (solo mantiene el `rAF` vivo); `dt` clamped a 50ms (`Math.min(ts - this.lastTime, 50)`, equivalente al tope de 0.05s de Frogger en ms); listener de `visibilitychange` (`handleVisibility`) que resetea `lastTime` al volver de segundo plano, agregado en `start()`/quitado en `destroy()`; `forceGameOver()` y la rama de game over de `spawn()` pintan una vez al hacer la transición (el `loop` deja de dibujar desde el siguiente frame).
- P2/P3/P9 (`tetris-engine.ts`): rejilla del tablero movida a un offscreen cacheado (`staticLayer`/`rebuildStaticLayer()`/`createOffscreenCanvas()`, mismo patrón que Frogger), reconstruido en el constructor, `setSkin()` y `resize()`; `draw()` la vuelca con un único `drawImage` en vez de los bucles `stroke()` por frame; `clearRect`/`drawImage`/`drawNext` ajustados a coordenadas lógicas (`BOARD_W/H`, `NEXT_SIZE`) en vez de `canvas.width/height` físicos, porque ahora hay una matriz de transform de por medio.
- P5 (`tetris-engine.ts`): `resize(width, height, dpr)` recalcula `deviceScale`, reconstruye la capa estática y fuerza un `draw()`.
- P4 (`tetris-canvas.tsx`): `applyDpr()` calcula `dpr = Math.min(devicePixelRatio || 1, 2)`, fija `boardCanvas`/`nextCanvas` `.width/.height` a tamaño lógico × dpr, aplica `ctx.setTransform(dpr,0,0,dpr,0,0)` en ambos contextos y llama a `engine.resize(BOARD_W, BOARD_H, dpr)`; se ejecuta de forma síncrona antes de `engine.start()`. A diferencia de Frogger, aquí no hace falta un `ResizeObserver` nuevo sobre el canvas: el tamaño CSS lógico de ambos canvas es fijo (300×600 y 120×120) y el `ResizeObserver` ya existente sobre `tetris-stage-wrap` solo calcula el `scale` de un `transform` externo (nunca cambia el backing store); se documenta como divergencia deliberada del patrón de Frogger, no como incumplimiento de P4.
- Efecto colateral necesario de P4 (`app/globals.css`, alcance mínimo, solo selectores de Tetris): los selectores `.tetris-container canvas[width="300"]`/`[width="120"]` dependían del atributo `width` original; como ahora ese atributo cambia con el DPR (p. ej. `600` a 2x), se reemplazaron por `canvas.tetris-board-canvas`/`canvas.tetris-next-canvas` (clases agregadas en `tetris-canvas.tsx`) para no perder el borde/fondo/box-shadow del tablero tras el fix de P4.

**Greps de regresión:**

- `devicePixelRatio` sin `Math.min`: solo aparece envuelto en `Math.min(window.devicePixelRatio || 1, MAX_DPR)` en `tetris-canvas.tsx:75`; el resto de menciones son comentarios.
- `draw()` en la rama de pausa del `loop`: ya no aparece — la rama `paused || gameover` de `loop()` solo reprograma el `rAF`.
- `createLinearGradient`/`createPattern`/`ctx.filter` en `draw`/`update`: ninguna coincidencia.
- `canvas.width\s*=`/`canvas.height\s*=` con literal numérico: solo `Math.round(BOARD_W * dpr)` / `Math.round(NEXT_SIZE * dpr)`, sin literales sueltos.
- Bucles `for`/`forEach` con `fillRect`/`stroke`/`strokeRect` sobre geometría estática dentro de `draw()`: ninguno — la rejilla se movió a `rebuildStaticLayer()`; los bucles que quedan en `draw()` recorren `board`/pieza actual (estado dinámico), no geometría fija.

**`git diff --stat` de esta corrida:**

```
app/globals.css                         |  4 +-
app/juegos/[id]/jugar/tetris-canvas.tsx | 40 ++++++++++++++++-
app/juegos/[id]/jugar/tetris-engine.ts  | 80 ++++++++++++++++++++++++++++-----
3 files changed, 110 insertions(+), 14 deletions(-)
```

**Gotchas:**

- El patrón de "capa estática + `ResizeObserver` sobre el contenedor" de Frogger no aplica 1:1 a Tetris porque su tamaño CSS lógico es fijo (300×600/120×120) y el ajuste a viewport lo hace un `transform: scale()` externo con tope en 1 (nunca agranda); el fix de P4 se redujo a escalar el backing store por DPR una vez al montar, sin necesitar recalcular en cada resize del contenedor.
- El fix de P4 rompía silenciosamente el estilo visual del tablero (`canvas[width="300"]`/`[width="120"]` en CSS) porque el atributo `width` deja de ser literal tras aplicar DPR; se corrigió con clases dedicadas en vez de revertir el fix.
- `npm run build` y `npm run lint` limpios (los errores/warnings de `npm run lint` son preexistentes en `references/templates/**` y `references/started-games/**`, ajenos a esta corrida; `game-player.tsx` tiene un warning preexistente de `react-hooks/set-state-in-effect` no relacionado con Tetris).
- **Sin verificación en navegador ni medición de FPS real.**
- **Bug real detectado en producción tras esta corrida (no capturado por la verificación estática):** `applyDpr()` en `tetris-canvas.tsx` llama a `engine.resize()` de forma síncrona _antes_ de `engine.start()` (que es quien corre `initGame()` y puebla `this.board`/`this.current`/`this.next`). El `resize()` original de esta corrida forzaba `this.draw()` incondicionalmente, y `draw()` lee `this.board[r][c]` y `this.current.shape` — con el motor recién construido eso lanza `TypeError: Cannot read properties of undefined (reading '0')` en cuanto se monta el canvas. Corregido con guard: `resize()` solo llama a `draw()` si `this.current` ya existe (`tetris-engine.ts`, línea del `if (this.current) this.draw();`). **Lección para el resto del catálogo:** cuando P4/P5 midan/llamen `engine.resize()` antes de `engine.start()` (patrón que Frogger no tiene porque su `applySize()` de `ResizeObserver` corre en un efecto separado, después del montaje inicial), `resize()` debe tolerar que el estado de partida (`board`/pieza actual/lo que sea análogo) todavía no exista — no asumir que `start()`/`initGame()` ya corrió.
