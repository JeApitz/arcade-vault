# 03 — Juego Duelo — Identidad y pulido

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, SPEC 07, `specs/game-jam/duelo/01-duelo-nucleo-jugable.md`, `specs/game-jam/duelo/02-duelo-contenido-y-progresion.md`
**Fecha:** 2026-08-20
**Objetivo:** Dar a Duelo un HUD propio dibujado en canvas con identidad neón/magenta (marcador arcade, sets, línea central, estela de la pelota), confirmar el `crtAspect` responsive y cerrar la verificación final del leaderboard.

## Alcance

**Incluye:**

- HUD propio dibujado en canvas, patrón `AsteroidsEngine` (método privado `drawHUD(ctx)` con `ctx.save()`/`ctx.restore()` alrededor, dentro del `draw()` ya existente de `DueloEngine` de SPEC 01/02), sin panel DOM adicional:
  - Marcador arcade grande centrado en la parte superior del campo: `playerSetScore — cpuSetScore` del set en curso, tipografía monoespaciada grande, jugador en magenta y CPU en cian (mismo contraste de color que ya usan otros motores del catálogo para distinguir bandos).
  - Indicador de sets ganados debajo del marcador: hasta 3 marcas por lado (ej. barras o puntos rellenos) reflejando `setsWonPlayer`/`setsWonCpu`.
  - Línea central discontinua magenta/neón dividiendo el campo en dos mitades, con `filter`/`shadowBlur` sutil consistente con la estética CRT del sitio.
  - Estela de partículas magenta detrás de la pelota mientras se mueve (mismo patrón que la clase `Particle` de `AsteroidsEngine`: vida corta, `dead` cuando expira, sin acumular sin límite), y un leve glow/`shadowBlur` en ambas palas.
  - Flash breve de pantalla o parpadeo del marcador al anotar un punto (temporizador interno no bloqueante, similar a `deadTimer` en `AsteroidsEngine`, no `setTimeout`).
  - Animación breve de texto "SET GANADO" (o "SET PERDIDO" según el lado) superpuesta al cerrar un set, antes de reanudar el saque del set siguiente, con el mismo patrón de temporizador interno.
- Confirmación explícita (sin cambios de código si ya es correcto) de que `crtAspect: "4 / 3"` en la entrada `duelo` de `engines.ts` sigue siendo el valor correcto para el campo 800×600, y verificación responsiva del marco en al menos tres anchos de ventana.
- Revisión final del leaderboard real: `/juegos/duelo` (leaderboard lateral), `/salon` (pestaña DUELO) y la home, confirmando que una partida completa jugada de principio a fin (incluyendo el HUD propio nuevo) guarda y refleja el puntaje correctamente.

**No incluye (fuera de alcance de este spec):**

- Sonido/efectos de audio: ni SPEC 01 ni SPEC 02 introdujeron assets de audio; este spec tampoco los agrega, manteniendo Duelo 100% dibujado con formas de canvas (sin sprites ni sonido), a diferencia de Arkanoid.
- Sprites o cualquier asset binario en `public/juegos/duelo/`: toda la identidad visual (marcador, línea central, estela, glow) se dibuja con formas/trazos de canvas, no con imágenes.
- Cambios a las reglas de juego, dificultad o estructura de sets: eso ya quedó cerrado en SPEC 01/02, este spec es puramente visual/de pulido.
- Nuevos controles o teclas.
- Multijugador local o online.
- Controles táctiles/en pantalla para mobile.
- Persistencia adicional más allá de `scores` (sin localStorage, sin IndexedDB) — el estado de sets/marcador del HUD propio vive solo en memoria del motor durante la partida, igual que el trofeo de sesión de Snake.
- Recalcular dinámicamente `best`/`plays` de la fila `duelo` en `games` tras jugar.
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido documentado desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.
- Cualquier cambio a `app/data/games.ts`.
- Rediseño del HUD genérico externo de `game-player.tsx` (Jugador/Puntuación/RIVAL/Nivel): sigue sin cambios de código, solo se le añade el HUD propio dentro del canvas.

## Modelo de datos

No se agregan campos nuevos a `DueloStats` (mismo contrato de SPEC 01/02: `score`, `rival`, `level`, `status`). El HUD propio consume directamente el estado interno ya mantenido por `DueloEngine` desde SPEC 02 (`playerSetScore`, `cpuSetScore`, `setsWonPlayer`, `setsWonCpu`), sin exponerlo a través de `onStats` — igual que `AsteroidsEngine` expone `lives`/`score` vía stats pero dibuja íconos de vida adicionales en su propio `drawHUD` sin un campo extra en `AsteroidsStats`.

```ts
// Sin cambios respecto a SPEC 02:
interface DueloStats {
  score: number;
  rival: number;
  level: number;
  status: "playing" | "dead" | "gameover";
}
```

### HUD propio (canvas)

Patrón `AsteroidsEngine`: método privado `drawHUD(ctx)` (más `drawCenterLine(ctx)`, `drawSetIndicator(ctx)`, `drawScoreFlash(ctx)`/`drawSetBanner(ctx)` según convenga dividir el dibujo) que pinta con `ctx.fillText`/trazos/`ctx.beginPath` directamente sobre el mismo canvas de 800×600 del juego, con `ctx.save()`/`ctx.restore()` para no filtrar `fillStyle`/`font`/`textAlign`/`shadowBlur` a otras entidades (palas, pelota, partículas). La estela de partículas de la pelota se implementa como una clase `Trail`/reutilización del patrón `Particle` ya usado por `AsteroidsEngine`, con límite de partículas vivas simultáneas.

Redundante con la barra genérica externa (Jugador/Puntuación/RIVAL/Nivel) a propósito, igual que Asteroids/Snake duplican su HUD dentro del canvas.

## Relación de aspecto del marco CRT

Sin cambios: `crtAspect: "4 / 3"` sigue siendo correcto (campo 800×600px, llena el 100%/100% del `.crt-screen`). Este spec solo verifica que el nuevo contenido dibujado dentro del canvas (marcador grande, indicador de sets, línea central, estela) no rompe el `aspect-ratio` ni desborda el marco en ningún ancho de ventana.

---

## Plan de implementación

1. **HUD propio.** Extender `app/juegos/[id]/jugar/duelo-engine.ts` (motor ya existente de SPEC 01/02) con `drawHUD()`, `drawCenterLine()`, el indicador de sets, la estela de partículas de la pelota (clase `Trail` o reutilización del patrón `Particle`), el flash de punto anotado y la animación "SET GANADO"/"SET PERDIDO", todo integrado en el `draw()`/`update()` existentes con temporizadores internos no bloqueantes.
2. **Verificación de identidad visual.** `npm run dev`, jugar una partida completa en `/juegos/duelo/jugar`: confirmar que el marcador arcade, el indicador de sets, la línea central y la estela de la pelota se ven y se actualizan correctamente; anotar puntos y cerrar al menos un set completo para ver el flash y la animación "SET GANADO"/"SET PERDIDO"; confirmar que el HUD genérico externo (Puntuación/RIVAL/Nivel) sigue coherente con los números del HUD propio en todo momento.
3. **Verificación responsiva del marco CRT.** Redimensionar la ventana (barrido ancho→estrecho, incluyendo un ancho de escritorio muy grande) y confirmar que el marco 4:3 queda centrado y sin desbordes, con el HUD propio legible en todos los tamaños.
4. **Revisión final de leaderboard.** Jugar una partida completa hasta el fin de la partida (mejor de 5 sets), guardar el puntaje con iniciales y confirmar que aparece en `/salon` (pestaña DUELO) y en el leaderboard lateral de `/juegos/duelo` tras recargar la página. Confirmar que salir de la página no deja el loop, los listeners de teclado ni partículas huérfanas corriendo en segundo plano.
5. **Build.** `npm run build` sin errores de tipos ni de rutas.

Cada paso deja el sistema funcional y es commiteable por separado.

---

## Criterios de aceptación

```markdown
- [ ] El HUD propio en canvas (marcador arcade del set en curso, indicador de sets ganados, línea central, estela de la pelota) se ve y actualiza correctamente durante la partida.
- [ ] El HUD genérico (Puntuación/RIVAL/Nivel) sigue coherente en todo momento con los números mostrados por el HUD propio.
- [ ] Anotar un punto dispara el flash de marcador sin interrumpir ni ralentizar el flujo del juego.
- [ ] Cerrar un set dispara la animación "SET GANADO"/"SET PERDIDO" antes de continuar al saque del siguiente set.
- [ ] El marco CRT 4:3 se ve centrado y sin desbordes en al menos tres anchos de ventana (ancho, tablet, móvil), con el HUD propio legible en todos ellos.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` siguen funcionando exactamente igual que en SPEC 01/02 con el HUD propio activo.
- [ ] Guardar el puntaje final al terminar la partida lo hace aparecer en `/salon` (pestaña DUELO) y en el leaderboard de `/juegos/duelo` tras recargar la página.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

---

## Decisiones tomadas y descartadas

- **HUD en canvas, no HUD en DOM (patrón `tetris-canvas.tsx`).** El campo de Duelo llena el 100%/100% del `.crt-screen` sin necesidad de un panel lateral (no hay "next piece" ni inventario que mostrar fuera del campo de juego), igual razón que llevó a Snake a elegir el patrón de canvas en vez de DOM.
- **Sin sonido, manteniendo el criterio "por defecto salvo pedido explícito" de la plantilla de specs de juego.** Ni el tema (Pong clásico) ni los specs anteriores de este mismo paquete pidieron audio explícitamente; se documenta aquí para no repreguntar en `/spec-impl`.
- **Toda la identidad visual se resuelve con formas/trazos de canvas, sin assets binarios en `public/juegos/duelo/`.** Mantiene a Duelo alineado con Asteroids/Tetris/Snake (canvas puro) en vez de seguir el precedente de sprites reales que sentó Arkanoid; no hay una referencia visual externa (spritesheet) que portar para un Pong clásico.
- **La animación "SET GANADO"/"SET PERDIDO" y el flash de punto se implementan con temporizadores internos del motor (contadores decrecientes dentro de `update()`), no con `setTimeout`.** Mismo patrón ya validado por `deadTimer` en `AsteroidsEngine`, evita desincronizar animaciones del `paused`/`destroy()` del motor.
- **Sin cambios al HUD genérico externo de `game-player.tsx`.** El HUD propio en canvas es aditivo y redundante a propósito (mismo criterio que Asteroids/Snake), evitando tocar UI compartida entre todos los juegos del catálogo.

## Riesgos identificados

- **Exceso de partículas de la estela por golpe/frame puede degradar el rendimiento del loop en sesiones largas (mejor de 5 sets).** Mitigación: límite explícito de partículas vivas simultáneas y vida corta (`ttl`) por partícula, igual que `Particle` en `AsteroidsEngine`; verificado manualmente en el paso 2 con una partida completa.
- **Animaciones superpuestas (flash de punto + banner de "SET GANADO" ocurriendo casi al mismo tiempo cuando el punto que cierra el set es también el último del set) podrían solaparse visualmente de forma confusa.** Mitigación: el banner de set tiene prioridad de dibujo sobre el flash de punto cuando ambos están activos en el mismo frame, verificado manualmente en el paso 2 cerrando al menos un set completo.
- **El `ctx.save()`/`ctx.restore()` del nuevo `drawHUD`/`drawCenterLine`/estela podría filtrar `shadowBlur`/`fillStyle` a las palas o a la pelota si algún método nuevo olvida el `restore()`.** Mitigación: seguir estrictamente el patrón ya probado de `AsteroidsEngine` (cada método de dibujo hace su propio `save()`/`restore()` sin excepciones), verificado visualmente comparando el color/glow de palas y pelota antes y después de activar el HUD propio.
