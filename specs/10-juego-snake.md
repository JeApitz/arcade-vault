# 10 — Juego Snake

**Estado:** Implementado
**Depende de:** SPEC 06, SPEC 07
**Fecha:** 2026-08-17
**Objetivo:** Construir desde cero un Snake clásico en grilla dentro de Arcade Vault, con sprites de fruta reales, HUD propio en canvas (fruta/score, trofeo/mejor puntaje) y su entrada en `engines.ts` y en el catálogo/leaderboard de Supabase.

## Alcance

**Incluye:**

- Nueva fila en la tabla `games` de Supabase (migración vía `mcp__supabase__apply_migration`, patrón SPEC 07/08/09): `{ id: "snake", title: "SNAKE", cat: "ARCADE", cover: "cover-snake", color: "green", short: "...", long: "...", best: 0, plays: "0" }`.
- Clase nueva `.cover-snake` en `app/globals.css`, mismo patrón (gradiente + `::after`/`::before`) que `.cover-asteroides`/`.cover-tetris`/`.cover-arkanoid`.
- Copia de `references/source-assets/snake-assets/fruits.png` a `public/games/snake/fruits.png`. Primer juego cuyo único asset binario es una hoja de sprites de comida (sin sonido, sin sprites de cuerpo/cabeza — la serpiente se dibuja con formas de canvas, estética neón del sitio).
- Puerto de `references/source-assets/snake-assets/sprites.js` (el objeto `SPRITE_ATLAS.fruits`, 21 frutas con `{x,y,w,h}`) a `app/juegos/[id]/jugar/snake-sprites.ts`: mismos recortes, cargando la imagen desde `/games/snake/fruits.png`, con una función `loadFruitSheet()` y `pickRandomFruit()`/`drawFruit(ctx, key, dx, dy, size)`.
- Motor `app/juegos/[id]/jugar/snake-engine.ts`, clase `SnakeEngine`, con toda la lógica clásica de Snake en grilla:
  - Tablero de 20×20 celdas, canvas de 600×600px (celda de 30px), `crtAspect: "1 / 1"`.
  - Movimiento por teclado en tick fijo (game loop con `setInterval`/`requestAnimationFrame` + acumulador de tiempo, no por frame): la serpiente avanza una celda por tick.
  - Controles: flechas y WASD. No se permite invertir dirección 180° en un mismo tick (si la última tecla procesada es opuesta a la dirección actual, se ignora).
  - Comer una fruta: la serpiente crece una celda, se elige un sprite de fruta aleatorio del atlas para la siguiente fruta, el puntaje sube un valor fijo por fruta (10 pts), y cada cierto número de frutas comidas (cada 5) el intervalo del tick baja (más velocidad) y el nivel reportado sube en 1.
  - Game over al chocar contra cualquier borde del tablero o contra el propio cuerpo (sin wrap-around).
  - Cuerpo de la serpiente y tablero con la estética neón/CRT del sitio: fondo oscuro con grilla sutil (no el damero verde claro de la imagen de referencia), cabeza/cuerpo dibujados como bloques redondeados en verde neón (`--green` del tema); la fruta sí usa el sprite real recortado de `fruits.png`.
  - HUD propio dibujado dentro del canvas (`drawHUD`, fiel en contenido a la imagen de referencia de Google Snake pero con la paleta neón del sitio): icono/etiqueta de fruta + puntaje actual en una esquina, trofeo + mejor puntaje de la sesión actual (`Math.max` en memoria del propio motor, no persistido en Supabase) en otra. Sin botón de silencio ni ningún control de audio, porque este spec no incluye sonido.
  - Mismo contrato que los motores existentes: constructor `(canvas, onStats)`, `start()`, `destroy()` (idempotente, limpia el intervalo/RAF y los listeners de teclado), `setPaused(paused)` (congela el tick sin perder progreso ni saltar tiempo al reanudar), `forceGameOver()`. `onStats` solo notifica cuando cambia `score`, `secondary` (longitud), `level` o `status`.
- Componente cliente `app/juegos/[id]/jugar/snake-canvas.tsx` (`SnakeCanvas`, `forwardRef<GameCanvasHandle, GameCanvasProps>`), calcado de `asteroids-canvas.tsx`: un único `<canvas width={600} height={600}>` dentro de `.crt-screen`, instancia `SnakeEngine` en un `useEffect` con `destroy()` en el cleanup, expone `forceGameOver` vía `useImperativeHandle`.
- Nueva entrada en `engines.ts`: `snake: { Canvas: SnakeCanvas, hudLabel: "LONGITUD", initialStats: { score: 0, secondary: 1, level: 1, status: "playing" }, crtAspect: "1 / 1" }`. No requiere los campos opcionales `onPauseChange`/`hidePauseOverlay` que agregó SPEC 09 (Snake usa el overlay de pausa genérico del reproductor).
- Controles: `←↑→↓` y `W`/`A`/`S`/`D` cambian de dirección; `PAUSA`/`REANUDAR` del HUD genérico congela y reanuda el tick sin saltos; `FIN` termina la partida manualmente con el score actual.
- Botón `GUARDAR PUNTUACIÓN` del modal de fin inserta una fila real en `scores` (`game_id: "snake"`), reutilizando el flujo genérico existente.
- Leaderboard real: `/juegos/snake` (leaderboard lateral vía `getTopScores("snake", 10)`), `/salon` (pestaña SNAKE, genérica desde SPEC 07) y la home incluyen snake automáticamente en cuanto existe la fila en `games`.

**No incluye (fuera de alcance de este spec):**

- Sonido/efectos de audio: `fruits.png`/`sprites.js` no traen assets de sonido y no se agregan de otra fuente; el botón de silencio de la imagen de referencia no se replica.
- Wrap-around en los bordes, obstáculos, power-ups, múltiples frutas simultáneas o cualquier mecánica que no sea el Snake clásico de una sola serpiente/una sola fruta.
- Controles táctiles/en pantalla para mobile.
- Persistir el "mejor puntaje" (trofeo del HUD propio) en Supabase o localStorage — vive solo en memoria del motor durante la partida y se resetea con `JUGAR DE NUEVO`.
- Reemplazar o borrar la entrada `serpentina` del mock `app/data/games.ts` (archivo no se toca, igual que en SPEC 07/08/09).
- Recalcular dinámicamente `best`/`plays` de la fila `snake` en `games` tras jugar; quedan estáticos como se siembran (0 / "0").
- Rate limiting, captcha o protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.

## Datos del catálogo

```ts
{
  id: "snake",
  title: "SNAKE",
  short: "Crece sin morder tu propia cola.",
  long: "Una serpiente de luz recorre una grilla oscura cazando fruta real, pixel a pixel. Cada bocado la alarga y acelera el ritmo del juego. Un giro en falso contra el borde o tu propia cola y todo termina ahí.",
  cat: "ARCADE",
  cover: "cover-snake",
  color: "green",
  best: 0,
  plays: "0",
}
```

## Contrato del motor

```ts
interface SnakeStats {
  score: number;
  length: number; // longitud de la serpiente (celdas), se mapea a `secondary` en engines.ts, hudLabel "LONGITUD"
  level: number; // sube 1 cada 5 frutas comidas, empieza en 1
  status: "playing" | "dead" | "gameover";
}
```

`SnakeEngine` mantiene como propiedades de instancia: `snake: {x,y}[]` (celdas en orden cabeza→cola), `direction`/`pendingDirection`, `fruit: { x, y, spriteKey }`, `score`, `length`, `level`, `tickMs` (intervalo actual, baja con el nivel), `bestScore` (máximo en memoria de la sesión), `status`. `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y `onStats` solo notifica en cambios de `score`/`length`/`level`/`status`.

No hay datos adicionales fuera de este contrato.

### HUD propio (canvas)

Patrón `AsteroidsEngine`: método privado `drawHUD(ctx)` que pinta con `ctx.fillText`/formas directamente sobre el canvas del juego, `ctx.save()`/`ctx.restore()` alrededor para no filtrar `fillStyle`/`font`/`textAlign`. Contenido, adaptado a la paleta neón del sitio (sin réplica literal del damero verde claro ni del botón de silencio de la imagen de Google Snake usada como referencia):

- Esquina superior izquierda: ícono/etiqueta de fruta + puntaje actual (`score`).
- Esquina superior derecha: ícono de trofeo (dibujado con trazos, no sprite) + `bestScore` de la sesión.

Redundante con la barra genérica externa (Jugador/Puntuación/LONGITUD/Nivel) a propósito, igual que Asteroids duplica vidas/score en su propio HUD.

## Relación de aspecto del marco CRT

`crtAspect: "1 / 1"` — el tablero de 20×20 celdas es cuadrado (600×600px), a diferencia de los 4:3/4:5 ya usados. El canvas llena el 100%/100% del `.crt-screen` (no hay panel lateral como tetris), así que no hace falta `ResizeObserver`/`transform: scale`; el `aspect-ratio` CSS ya centra y ajusta el marco.

---

## Plan de implementación

1. **Catálogo.** Migración que inserta la fila `snake` en `games` (datos de arriba) y clase `.cover-snake` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides`. El juego ya aparece en `/games` y `/juegos/snake`; `/juegos/snake/jugar` deja el `.crt-screen` vacío hasta el paso 4 (sin entrada aún en `engines.ts`).
2. **Assets y sprites.** Copiar `references/source-assets/snake-assets/fruits.png` a `public/games/snake/fruits.png`. Crear `app/juegos/[id]/jugar/snake-sprites.ts` portando el atlas de `sprites.js` (21 frutas) con `loadFruitSheet()`, `pickRandomFruit()`, `drawFruit()`. Sin conectar todavía a ninguna UI.
3. **Motor.** Crear `app/juegos/[id]/jugar/snake-engine.ts` con la clase `SnakeEngine`: grilla 20×20, game loop a tick fijo, movimiento/colisión con bordes y cola propia, crecimiento y selección de fruta al comer, progresión de velocidad/nivel cada 5 frutas, y el HUD propio (`drawHUD`) con fruta+score y trofeo+mejor puntaje de sesión. Sin conectar todavía a ninguna UI.
4. **Wrapper de React.** Crear `app/juegos/[id]/jugar/snake-canvas.tsx`, componente cliente con `<canvas width={600} height={600}>`, instancia `SnakeEngine` en un `useEffect` (con `destroy()` en el cleanup), expone `forceGameOver` vía `useImperativeHandle`/`forwardRef`.
5. **Registro del motor.** Agregar la entrada `snake` al mapa `ENGINES` en `app/juegos/[id]/jugar/engines.ts` (`{ Canvas: SnakeCanvas, hudLabel: "LONGITUD", initialStats: { score: 0, secondary: 1, level: 1, status: "playing" }, crtAspect: "1 / 1" }`). Sin tocar `game-player.tsx` (Snake usa el overlay de pausa genérico, no necesita `hidePauseOverlay`).
6. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/snake/jugar`: mover con flechas y con WASD, confirmar que no se puede invertir 180° en un tick, comer varias frutas y ver el sprite de fruta cambiar, ver el HUD genérico (Puntuación/LONGITUD/Nivel) y el HUD propio del canvas (fruta+score, trofeo+mejor puntaje) actualizarse en vivo, confirmar que la velocidad sube cada 5 frutas, chocar contra un borde y contra la propia cola para confirmar game over en ambos casos, `PAUSA`/`REANUDAR` sin saltos de posición ni de tiempo, `FIN` para terminar manualmente, `JUGAR DE NUEVO` para reiniciar limpio (longitud 1, score 0, nivel 1, trofeo de sesión reseteado), guardar el puntaje con iniciales y verlo reflejado en `/salon` (pestaña SNAKE) y en el leaderboard lateral de `/juegos/snake` tras recargar. Redimensionar la ventana (barrido ancho→estrecho, incluyendo ~1800px) y confirmar que el marco CRT cuadrado queda centrado y sin desbordes. Confirmar que salir de la página no deja el loop ni los listeners de teclado corriendo en segundo plano.
7. **Build.** `npm run build` sin errores de tipos ni de rutas.

Cada paso deja el sistema funcional y es commiteable por separado.

---

## Criterios de aceptación

```markdown
- [ ] La fila `snake` existe en `games` con su portada (`cover-snake`) y aparece en `/games` y `/juegos/snake`.
- [ ] `/juegos/snake/jugar` renderiza el canvas real del juego (antes de este spec, `engine` es `undefined` para este `id` y el `.crt-screen` queda vacío).
- [ ] El HUD genérico (Puntuación/LONGITUD/Nivel) refleja el estado real del motor mientras se juega.
- [ ] El HUD propio en canvas (fruta+score, trofeo+mejor puntaje de sesión) se ve y actualiza correctamente.
- [ ] Comer una fruta crece la serpiente, cambia el sprite de la siguiente fruta y sube el puntaje; cada 5 frutas sube la velocidad y el nivel.
- [ ] Chocar contra un borde o contra la propia cola termina la partida (game over), sin wrap-around.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` funcionan según lo descrito en Alcance.
- [ ] El marco CRT cuadrado se ve centrado y sin desbordes en al menos tres anchos de ventana (ancho, tablet, móvil).
- [ ] Guardar el puntaje al terminar la partida lo hace aparecer en `/salon` y en el leaderboard de `/juegos/snake` tras recargar la página.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

---

## Decisiones y riesgos

- **HUD propio en canvas, no DOM:** se eligió el patrón de `AsteroidsEngine` (dibujo directo con `ctx.fillText`) porque el HUD de la referencia (fruta/score, trofeo/best) es texto e íconos simples superpuestos al tablero, sin necesidad de un panel lateral como el de `tetris-canvas.tsx`.
- **`crtAspect: "1 / 1"`:** primer juego cuadrado del catálogo (los demás son 4:3 o 4:5); el tablero de 20×20 celdas a 30px por celda da 600×600px exactos, sin necesidad de `ResizeObserver`/`transform: scale` porque el canvas llena el marco al 100%/100%.
- **Estética neón en vez de réplica fiel de la imagen de referencia:** el usuario confirmó explícitamente usar bloques redondeados en verde neón sobre fondo oscuro con grilla sutil, en vez del damero verde claro y la serpiente azul de la captura de Google Snake, para mantener consistencia visual con Asteroids/Tetris/Arkanoid. Solo el sprite de fruta se porta fielmente desde `fruits.png`.
- **Trofeo/mejor puntaje del HUD propio vive solo en memoria de la sesión:** no se persiste ni se cruza con `scores`/Supabase; se resetea en cada `JUGAR DE NUEVO`. Si en el futuro se quiere mostrar el mejor puntaje histórico real ahí, es una extensión de spec futura (requeriría leer `getTopScores`/`getTopPlayers` al montar el motor).
- **Sin sonido:** `fruits.png`/`sprites.js` solo traen sprites de comida, sin audio; se documenta explícitamente en "No incluye" para no repreguntar en `/spec-impl`.
- **Riesgo conocido heredado:** el insert público a `scores` sigue sin rate limiting/anti-spam (documentado desde SPEC 06), aplica igual a `game_id: "snake"`.
