# Rendimiento y encuadre por juego

Memoria del agente `game-performance-booster`. Se actualiza en CADA corrida, sobre el juego trabajado.
Rúbrica fija: P1–P10 (ver definición completa en `.claude/agents/game-performance-booster.md`),
derivada de `specs/13-frogger-encuadre-hud-rendimiento.md`.

## Estado

| Juego      | P1  | P2  | P3  | P4  | P5  | P6  | P7  | P8  | P9  | P10 | Fecha      | Notas                                                                             |
| ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------- | --------------------------------------------------------------------------------- |
| frogger    | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | 🟡  | 2026-08-25 | vía `specs/13-frogger-encuadre-hud-rendimiento.md`, no por corrida de este agente |
| asteroides | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente                                                                         |
| tetris     | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente; caso híbrido: 2 canvas + panel DOM                                     |
| arkanoid   | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente; ya tiene sheet teñido cacheado (P9 parcial)                            |
| snake      | ⬜  | ⬜  | ⬜  | ⬜  | ⬜  | ⬛  | ⬜  | ⬜  | ⬜  | ⬜  | —          | pendiente                                                                         |

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

_(vacío; se llena con hallazgos `⬛`/`❌` de cada corrida y con la limitación fija "sin verificación en navegador ni medición de FPS real" mientras eso siga sin resolverse)_

## Por juego

_(una sección `### <juego>` por juego trabajado por este agente; `frogger` no tiene sección propia aquí porque su cumplimiento vino del spec 13, no de una corrida de este agente — ver "Implementación de referencia" arriba)_
