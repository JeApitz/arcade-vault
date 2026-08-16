# 05 — Juego Asteroides

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-08-15

**Objetivo:** Adaptar el juego standalone de `references/started-games/02-asteroids/` (canvas HTML5 puro) a un juego real y jugable dentro de Arcade Vault, con su propia entrada en el catálogo y HUD conectado a estado real de partida.

## Alcance

**Incluye:**

- Nueva entrada en `app/data/games.ts`: `{ id: "asteroides", title: "ASTEROIDES", cat: "SHOOTER", cover: "cover-asteroides", color: "cyan", ... }`, con `short`/`long`/`best`/`plays` redactados en el mismo tono que las entradas existentes. La entrada mock `"rocas"` (id existente, mismo concepto de asteroides) se deja tal cual, sin tocar ni eliminar.
- Clase nueva `cover-asteroides` en `app/globals.css`, siguiendo el mismo patrón (gradiente propio) que `cover-bricks`, `cover-tetro`, etc.
- Puerto completo de la lógica de `references/started-games/02-asteroids/game.js` (naves, asteroides, balas, partículas, power-up 3x disparo triple, colisiones, niveles, vidas) a un módulo TypeScript `app/juegos/[id]/jugar/asteroids-engine.ts`, exportando una clase `AsteroidsEngine` que encapsula todo el estado (sin variables globales de módulo) y expone `start()`, `destroy()`, `setPaused(paused)` y `forceGameOver()`.
- Componente cliente `app/juegos/[id]/jugar/asteroids-canvas.tsx` que monta un `<canvas>` de 800×600, instancia `AsteroidsEngine` en un efecto (con cleanup vía `destroy()` en el unmount), y reporta el estado de partida (`score`, `lives`, `level`, `status`) al padre mediante una prop `onStats`, solo cuando algún valor cambia (no en cada frame).
- Modificación de `app/juegos/[id]/jugar/game-player.tsx`: cuando `game.id === "asteroides"`, se renderiza `AsteroidsCanvas` en vez del `.game-arena` decorativo, y el HUD (`Puntuación`, `Vidas`, `Nivel`) y el modal de fin de partida usan el estado real reportado por el motor en vez de `DEMO_SCORE`/`DEMO_LIVES`/`DEMO_LEVEL`. El resto de juegos del catálogo sigue usando el reproductor mock sin cambios.
- Controles de teclado idénticos al original: `←`/`→` rotar, `↑` acelerar, `Espacio` disparar. Sin controles táctiles ni adaptación mobile.
- Mapeo de los botones existentes del HUD al motor real:
  - `PAUSA`/`REANUDAR` → `engine.setPaused(bool)`: congela `update()` (pero sigue dibujando el último frame) y al reanudar no salta el tiempo acumulado.
  - `FIN` → `engine.forceGameOver()`: termina la partida de inmediato con el score actual.
  - Al llegar a 0 vidas (game over orgánico) o al usar `FIN`, el estado `status` pasa a `"gameover"` y el modal de fin se abre automáticamente con el score real.
  - `JUGAR DE NUEVO` → se incrementa una `resetKey` en `GamePlayer` usada como `key` de `AsteroidsCanvas`, forzando un remount completo (motor nuevo, partida nueva).
  - `SALIR` → navega fuera de la página; el unmount destruye el motor (listeners y `requestAnimationFrame` limpiados).
- Se elimina el auto-reinicio con `Espacio` en pantalla de game over que tenía el original (`initGame()` en la rama `state === 'gameover'` de `update()`), porque el modal de fin ya tiene un input de texto para las iniciales y ese atajo interferiría al escribir.
- Botón `GUARDAR PUNTUACIÓN` del modal de fin sigue siendo mock visual (no persiste a ningún lado), igual que hoy — solo cambia que el número mostrado es el score real de la partida en vez de `DEMO_SCORE`.

**No incluye (fuera de alcance de este spec):**

- Persistencia real de puntajes (localStorage o Supabase). El SPEC 04 ya dejó esto explícitamente para un spec futuro dedicado; este spec no lo adelanta. La leaderboard de `/juegos/asteroides` sigue usando `seededScores` (mock).
- Controles táctiles/en pantalla para mobile. El juego queda documentado como no jugable en touch todavía.
- Cualquier cambio a la entrada mock `"rocas"` o a otros juegos del catálogo.
- Generalizar el reproductor a un patrón de "engine registrable por id" para futuros juegos reales — se hace un `if (game.id === "asteroides")` puntual en `game-player.tsx`, sin abstraer todavía.
- Sonido/efectos de audio (el original tampoco los tiene).
- Guardar el mejor puntaje (`game.best` en `games.ts`) dinámicamente tras jugar.

## Modelo de datos

No hay persistencia. El único estado nuevo es en memoria, compartido entre el motor y React vía callback:

```ts
interface AsteroidsStats {
  score: number;
  lives: number;
  level: number;
  status: "playing" | "dead" | "gameover";
}
```

`AsteroidsEngine` mantiene internamente las mismas entidades que el original (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`) como propiedades de instancia en vez de variables globales de módulo.

## Plan de implementación

1. **Catálogo.** Agregar la entrada `"asteroides"` a `app/data/games.ts` y la clase `.cover-asteroides` a `app/globals.css`. El juego ya aparece en `/games` y `/juegos/asteroides` (detalle), usando todavía el reproductor mock al jugar.
2. **Motor del juego.** Crear `app/juegos/[id]/jugar/asteroids-engine.ts` portando toda la lógica de `game.js` a la clase `AsteroidsEngine` (constructor recibe el `<canvas>` y un callback `onStats`), incluyendo pausa (`setPaused`) y fin forzado (`forceGameOver`), y quitando el auto-reinicio con Espacio en game over. Sin conectar todavía a ninguna UI.
3. **Wrapper de React.** Crear `app/juegos/[id]/jugar/asteroids-canvas.tsx`, componente cliente con `<canvas width={800} height={600}>` escalado por CSS al 100% del contenedor, que instancia `AsteroidsEngine` en un `useEffect` (con `destroy()` en el cleanup) y expone `forceGameOver` vía `useImperativeHandle`/`forwardRef` para que el padre lo dispare desde el botón `FIN`.
4. **Integración en el reproductor.** Modificar `game-player.tsx`: si `game.id === "asteroides"`, renderizar `<AsteroidsCanvas key={resetKey} ref={...} onStats={...} paused={paused} />` en vez de `.game-arena`; reemplazar `DEMO_SCORE`/`DEMO_LIVES`/`DEMO_LEVEL` por el estado real recibido en `onStats`; abrir el modal automáticamente cuando `status === "gameover"`; conectar `PAUSA/REANUDAR`, `FIN` y `JUGAR DE NUEVO` como se describe en el Alcance.
5. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/asteroides/jugar`: mover/rotar/acelerar/disparar, romper asteroides grandes en medianos y pequeños, ver el HUD (score/vidas/nivel) actualizarse en tiempo real, pasar de nivel, perder las 3 vidas y ver el modal de fin con el score real, pausar y reanudar sin saltos raros, usar `FIN` para terminar manualmente, y `JUGAR DE NUEVO` para reiniciar limpio. Confirmar que salir de la página (botón `SALIR` o navegación) no deja el loop corriendo en segundo plano (sin errores en consola por listeners huérfanos).
6. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas.

## Criterios de aceptación

- [ ] `/games` y `/juegos/asteroides` muestran la nueva entrada "ASTEROIDES" en el catálogo, con su propia portada (`cover-asteroides`), sin alterar la entrada `"rocas"` existente.
- [ ] `/juegos/asteroides/jugar` renderiza el juego real en un `<canvas>` (no el `.game-arena` decorativo), controlable con `←` `→` `↑` `Espacio`.
- [ ] Los asteroides grandes se dividen en medianos y estos en pequeños al ser destruidos por una bala, igual que el original.
- [ ] El HUD (`Puntuación`, `Vidas`, `Nivel`) muestra los valores reales del motor y se actualiza mientras se juega, no valores fijos de demo.
- [ ] Perder las 3 vidas abre el modal de fin de partida automáticamente, mostrando el score real de esa partida.
- [ ] El botón `PAUSA` congela el juego (nave, asteroides y balas dejan de moverse) y `REANUDAR` lo continúa sin saltos de posición ni de tiempo.
- [ ] El botón `FIN` termina la partida de inmediato y abre el modal de fin con el score alcanzado hasta ese momento.
- [ ] El botón `JUGAR DE NUEVO` del modal reinicia una partida completamente nueva (score en 0, 3 vidas, nivel 1).
- [ ] Escribir en el campo de iniciales del modal de fin no dispara ningún reinicio ni acción del juego (el atajo de Espacio para reiniciar del original ya no existe).
- [ ] Navegar fuera de `/juegos/asteroides/jugar` (botón `SALIR` u otra navegación) no deja el `requestAnimationFrame` ni los listeners de teclado del juego corriendo en segundo plano.
- [ ] El resto de juegos del catálogo (`/juegos/rocas/jugar`, `/juegos/caida/jugar`, etc.) sigue mostrando el reproductor mock exactamente como antes, sin cambios de comportamiento.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Juego nuevo con id `"asteroides"`, sin tocar la entrada mock `"rocas"`.** Decisión explícita del usuario: aunque `"rocas"` ya representa conceptualmente un shooter de asteroides en el catálogo mock, este spec agrega una entrada separada para el juego real en vez de reemplazarla o fusionarla.
- **Integración puntual en `game-player.tsx` con un `if` por id, sin patrón genérico de "engines registrables".** Se prefiere no diseñar una abstracción para un caso de uso único todavía; se generalizará cuando exista un segundo juego real que lo justifique.
- **Motor como clase TS (`AsteroidsEngine`) instanciada por montaje, en vez de un hook con todo inline.** El original ya está organizado como clases con estado propio; portarlo a una clase mantiene el código cercano a la fuente y aísla el ciclo de vida (start/destroy) del componente React, evitando fugas de listeners/RAF entre montajes (incluido el doble-montaje de Strict Mode en desarrollo).
- **Canvas fijo 800×600, escalado por CSS.** El contenedor `.crt-screen` ya tiene `aspect-ratio: 4/3`, igual que el canvas original; se evita reescribir toda la lógica de coordenadas a un sistema responsive.
- **`onStats` solo notifica en cambios, no cada frame.** Evita re-renderizar el árbol de React del HUD a 60fps; el canvas se sigue dibujando de forma imperativa fuera de React.
- **Se elimina el auto-reinicio con Espacio en game over del original.** Al agregar un modal de fin con input de texto (iniciales), ese atajo global causaría reinicios accidentales mientras el usuario escribe. `JUGAR DE NUEVO` reemplaza esa función de forma explícita.
- **Sin persistencia de puntaje ni controles táctiles.** Mismo criterio que SPEC 04 (persistencia real diferida a spec futuro) y decisión explícita del usuario de dejar mobile fuera de alcance.

## Riesgos identificados

- **Strict Mode de React en desarrollo monta/desmonta efectos dos veces.** Si `destroy()` no limpia bien `requestAnimationFrame` y los listeners de teclado, podría quedar un loop fantasma o listeners duplicados tras el segundo montaje. Mitigación: `destroy()` debe ser idempotente y el `useEffect` de `asteroids-canvas.tsx` debe crear una instancia nueva del motor en cada montaje real.
- **Colisión de foco de teclado con el input de iniciales del modal.** Aunque se quita el auto-reinicio con Espacio, los listeners de teclado del motor siguen activos en `window` mientras el modal está abierto (partida en `"gameover"`); si el usuario presiona flechas mientras escribe, no debería tener efecto porque la nave ya está `dead`, pero conviene verificarlo manualmente en el paso 5.
