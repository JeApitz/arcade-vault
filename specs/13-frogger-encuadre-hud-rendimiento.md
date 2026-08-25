# 13 — Frogger: encuadre, HUD y rendimiento

**Estado:** Aprobado
**Depende de:** SPEC frogger/01-frogger-core
**Fecha:** 2026-08-25
**Objetivo:** Corregir que Frogger no quepa completo en pantalla y que su HUD interno se superponga a las bocas destino, y aligerar su loop de render, sin afectar a ningún otro juego del catálogo.

## Alcance

**Incluye:**

- El tablero completo de Frogger (bisel `.crt` incluido) visible sin scroll de página en desktop y en móvil, escalando a lo alto disponible del viewport manteniendo su relación de aspecto (letterbox), aplicado **solo** a la ruta de juego de Frogger.
- Una banda de HUD propia dentro del canvas, separada del área jugable (fila de bocas destino incluida), que no se superponga nunca a ninguna entidad ni a las 5 bocas.
- Rediseño del contenido de esa banda: puntaje, nivel, vidas y barra de tiempo, todo dentro de sus límites, legible a los tamaños de fuente ya usados por el motor.
- Backing store del canvas recalculado ante cambios de tamaño de contenedor, DPR o rotación de dispositivo (hoy se calcula una sola vez), tope de DPR efectivo en 2x.
- Reducción del trabajo de dibujo por frame: las zonas de fondo, la rejilla de filas y los marcos de las bocas destino (estáticos mientras no cambie el skin ni el tamaño) dejan de recalcularse en cada `requestAnimationFrame`.
- El loop deja de invocar el pintado completo en cada frame mientras el juego está en pausa.

**No incluye (fuera de alcance de esta spec):**

- Cualquier cambio a Asteroides, Tetris, Arkanoid o Snake — su marcado, CSS y comportamiento de encuadre/HUD quedan exactamente igual que hoy.
- Migrar el HUD de Frogger a DOM/React (se decidió mantenerlo dentro del canvas).
- Cambios de reglas de juego: velocidad de carriles, tiempo por ronda, puntuación, vidas, generación de carriles (`buildLanes`), colisiones.
- Nuevos skins o cambios de paleta — se reutilizan los tokens ya definidos en `frogger-skins.ts`.
- Extraer un patrón de "fit-to-viewport" reutilizable para otros juegos — si se necesita después, es otra spec.
- Sprites bitmap, animaciones de muerte, power-ups (ya fuera de alcance en `specs/frogger/01-frogger-core.md`).

## Datos

Esta spec no introduce estructuras de datos nuevas. Ajusta constantes y tipos existentes:

```ts
// frogger-engine.ts
const HUD_H = 40; // alto de la banda de HUD, en px lógicos
const W = COLS * CELL; // 640, sin cambio
const H = HUD_H + ROWS * CELL; // 40 + 560 = 600 (antes 560)
```

```ts
// engines.ts — nuevo campo opcional en la config de motor, usado solo por frogger
interface GameEngineConfig {
  // ...campos existentes...
  fitViewport?: boolean;
}
```

`crtAspect` de la entrada `frogger` en `engines.ts` cambia de `"8 / 7"` a `"16 / 15"` (640/600), reflejando el nuevo alto lógico. No se agregan campos a `FroggerStats`, `FroggerSkin` ni a `TouchButton`.

## Plan de implementación

1. **Banda de HUD y nuevo alto lógico.** En `frogger-engine.ts`, agregar `HUD_H = 40` y redefinir `H`. Ajustar `draw()` para envolver el pintado del tablero (zonas, rejilla, bocas, entidades, rana) en un `ctx.save()/ctx.translate(0, HUD_H)/ctx.restore()`, sin tocar la aritmética `row * CELL` de ningún método existente. Actualizar `drawOverlay()` para que siga cubriendo `0,0,W,H` (ahora 640x600). El juego sigue siendo jugable y compilable tras este paso.
2. **Reescribir `drawHUD()`.** Pintar dentro de `0..HUD_H`: puntaje a la izquierda, `NIVEL n` al centro, vidas como iconos a la derecha (mismo estilo elipse), y la barra de tiempo como franja de 3px pegada al borde inferior de la banda (`y = HUD_H - 3`), actuando como separador visual HUD/tablero. Verificable visualmente: nada del HUD se dibuja sobre la fila de bocas.
3. **Actualizar `crtAspect` en `engines.ts`.** Cambiar la entrada `frogger` de `"8 / 7"` a `"16 / 15"`. `npm run build` sigue pasando (cambio de valor de string).
4. **Capa estática cacheada.** En `frogger-engine.ts`, agregar un canvas offscreen (`OffscreenCanvas` o `<canvas>` no adjunto) donde se pre-renderizan las bandas de zona, la rejilla y los marcos de bocas destino. Se regenera solo cuando cambia el skin (`setSkin`) o el tamaño del backing store (paso 6); `draw()` la vuelca con un único `drawImage` en vez de repetir los bucles de `fillRect`/`stroke`/`strokeRect`. El relleno de bocas alcanzadas (`skin.goalFilled`) sigue pintándose por frame porque cambia con el estado del juego. Verificable: la partida se ve idéntica, pero `draw()` ya no contiene bucles sobre zonas/rejilla/marcos.
5. **No repintar en pausa.** En `loop()`, cuando `this.paused` es verdadero, dejar de llamar a `draw()` en cada frame: pintar una vez al entrar en pausa y mantener el `rAF` vivo sin trabajo de dibujo adicional (el repintado por cambio de skin ya lo fuerza `setSkin`, sin cambios ahí). Verificable: pausar el juego y confirmar que la escena no vuelve a redibujarse hasta reanudar o cambiar skin.
6. **DPR real + `ResizeObserver` en `frogger-canvas.tsx`.** Sustituir el cálculo de una sola vez (`dpr`/`cssWidth`/`cssHeight` fijos) por un `ResizeObserver` sobre el contenedor del canvas, siguiendo el patrón ya usado por Tetris (`tetris-canvas.tsx`). En cada resize: leer el tamaño CSS mostrado, calcular `dpr = Math.min(window.devicePixelRatio || 1, 2)`, fijar `canvas.width/height` a `tamañoMostrado * dpr` y aplicar `ctx.setTransform` para que el motor siga dibujando en coordenadas lógicas `640x600`. Agregar `FroggerEngine.resize(width, height, dpr)` que reconstruye la capa estática del paso 4 con el nuevo tamaño. Verificable: redimensionar la ventana o rotar el dispositivo mantiene el canvas nítido y sin distorsión.
7. **Encuadre a viewport, solo Frogger.** Agregar `fitViewport: true` a la entrada `frogger` en `engines.ts`. En `game-player.tsx`, aplicar la clase `av-player--fit` al contenedor `.av-player` cuando `engine.fitViewport` sea verdadero. Verificable: sin el flag (los otros 4 juegos), el marcado no cambia.
8. **CSS del encuadre.** En `globals.css`, agregar el token `--nav-h` en `:root` con el alto actual de `.av-nav` y aplicarlo como `min-height` de `.av-nav` (sin alterar su alto real). Agregar el bloque `.av-player--fit` (`height: calc(100vh - var(--nav-h))` con fallback inmediato `calc(100dvh - var(--nav-h))`, `display:flex; flex-direction:column`, márgenes/padding reducidos), `.av-player--fit .crt` (`flex:1 1 auto; min-height:0`) y `.av-player--fit .crt-screen` (`height:100%; width:auto; max-height:none; margin:0 auto`), respetando los breakpoints `<=720px`, `<=480px` y el modo landscape corto ya existentes (`app/globals.css:2158-2288`). Verificable: en Frogger, el bisel completo (incluido `.crt-bottom` y el panel táctil) cabe sin scroll de página en un viewport de escritorio típico (1280x800) y en un viewport móvil típico (390x844); los demás juegos no cambian de tamaño ni posición.
9. **Verificación final.** Confirmar en los 5 juegos: Frogger se ve completo sin scroll, HUD legible y sin superposición con las bocas, canvas nítido tras resize/rotación, pausa sin redibujado continuo; Asteroides, Tetris, Arkanoid y Snake exactamente iguales a antes de esta spec. `npm run build` y `npm run lint` sin errores.

Cada paso deja el sistema funcional y es commiteable por separado.

## Criterios de aceptación

```markdown
- [ ] El HUD de Frogger no dibuja nada en `y >= HUD_H`; la fila de bocas destino se ve completa, sin texto ni barra de tiempo superpuestos.
- [ ] En un viewport de escritorio de 1280x800, el bisel completo de Frogger (`.crt`, `.crt-bottom` y el panel táctil si aplica) es visible sin scroll de página.
- [ ] En un viewport móvil de 390x844 en vertical, el bisel completo de Frogger es visible sin scroll de página.
- [ ] Redimensionar la ventana o rotar el dispositivo mantiene el canvas de Frogger nítido (sin blur por escalado CSS) y sin distorsionar la relación de aspecto.
- [ ] Pausar Frogger detiene los repintados continuos del tablero; solo se repinta al reanudar o al cambiar de skin.
- [ ] `draw()` en `frogger-engine.ts` ya no contiene bucles de `fillRect`/`stroke`/`strokeRect` sobre las 14 filas de fondo, la rejilla ni los 5 marcos de bocas en cada frame.
- [ ] Asteroides, Tetris, Arkanoid y Snake se ven y funcionan exactamente igual que antes de esta spec (mismo CSS, mismo `crtAspect`, sin la clase `av-player--fit`).
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
- [ ] `npm run lint` sin errores.
```

## Decisiones

- **HUD dentro del canvas, no en DOM:** se decidió mantener el patrón de "doble HUD" ya documentado en `specs/frogger/01-frogger-core.md` en vez de migrar a React, para no reabrir esa decisión de diseño y acotar el cambio al bug real (superposición), no al mecanismo.
- **Banda de HUD de 40px lógicos, arriba del tablero:** evita reacomodar filas del grid de juego (`ROWS`, zonas, `GOAL_COLS`) — el tablero de 14x16 celdas queda intacto, solo se le agrega un margen superior dedicado.
- **`fitViewport` como flag opcional por juego, no un cambio global:** el usuario pidió explícitamente que el resto de los juegos no cambie. Un flag en `engines.ts` que activa una clase CSS aislada (`av-player--fit`) permite tocar solo la ruta de Frogger sin condicionales dispersos en `game-player.tsx`.
- **Tope de DPR en 2x:** evita que pantallas 3x (algunos móviles) disparen el costo de fill de la capa estática y del blit por frame sin ganancia visual perceptible.
- **Capa estática pre-renderizada en vez de "dirty rects" por región:** con solo un fondo completamente estático (zonas + rejilla + marcos) y entidades que se mueven sobre él, un solo `drawImage` de una capa cacheada es más simple y suficiente que trackear rectángulos sucios; no se justifica esa complejidad adicional para este loop.
- **No repintar en pausa en vez de bajar el framerate:** más simple que introducir un throttle de `rAF`, y el efecto es el mismo (cero trabajo de dibujo mientras no hay nada que mostrar de nuevo).

## Riesgos

| Riesgo                                                                                                                                                          | Mitigación                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `av-player--fit` con `height: calc(100dvh - var(--nav-h))` puede calcular mal en navegadores sin soporte de `dvh`, dejando el tablero cortado.                  | Se usa el mismo patrón de fallback `vh` inmediato seguido de `dvh` que ya aplica `mobile-porter` en `.crt-screen` (`app/globals.css:1295-1296`); el navegador aplica la última declaración soportada.  |
| Un `ResizeObserver` mal ajustado puede disparar `resize()` en bucle si el cambio de tamaño del canvas retroalimenta al contenedor.                              | Se observa el contenedor (`.crt-screen`), no el propio `<canvas>`, siguiendo el mismo patrón ya validado en `tetris-canvas.tsx`, que no presenta ese problema hoy.                                     |
| Cachear la capa estática y olvidar invalidarla al cambiar de skin dejaría colores de zona/rejilla desincronizados del resto del tablero.                        | El paso 4 ata explícitamente la invalidación de la capa estática a `setSkin()` (además de a `resize()`); el criterio de aceptación de skins ya existente sigue verificándose manualmente en el paso 9. |
| Elevar `--nav-h` como token global podría, en teoría, afectar el alto real de `.av-nav` si algún selector futuro lo usara como `height` en vez de `min-height`. | Se define explícitamente como `min-height` en este spec, sin tocar el `padding`/`display` actual de `.av-nav`; no cambia su renderizado hoy.                                                           |

## Lo que **no** está en esta spec

- Ningún cambio a Asteroides, Tetris, Arkanoid o Snake.
- Migración del HUD de Frogger a DOM/React.
- Cambios de reglas de juego, velocidad, puntuación o generación de carriles.
- Nuevos skins o paletas.
- Un patrón de "fit-to-viewport" reutilizable para otros juegos.

Cada uno de estos, si se necesita, va en su propia spec.

## Aprendizajes de la implementación (para refactors futuros de otros juegos)

Esta sección documenta patrones que funcionaron y una trampa de CSS real encontrada
durante la implementación, verificados en navegador (Playwright) contra el código.
Sirve de referencia si más adelante se aplica encuadre-a-viewport, capa estática
cacheada, DPR real o "no repintar en pausa" a Asteroides, Tetris, Arkanoid, Snake
o juegos nuevos — no implica que haya que hacerlo, solo documenta cómo hacerlo bien
si se decide.

### 1. Banda de HUD dentro del canvas, separada del tablero

Envolver el pintado del tablero en `ctx.save()/ctx.translate(0, HUD_H)/ctx.restore()`
deja intacta toda la aritmética `row * CELL` existente — no hace falta tocar ningún
método de dibujo de entidades. El HUD se pinta después, fuera de esa traslación, en
`0..HUD_H`. Aplicable a cualquier motor con HUD dentro del canvas que hoy se
superponga al área jugable.

### 2. Capa estática cacheada (offscreen canvas)

Todo lo que solo cambia con el skin o el tamaño (fondos de zona, rejilla, marcos
fijos) se pre-renderiza una vez en un `OffscreenCanvas`/`<canvas>` no adjunto y se
vuelca por frame con un único `drawImage`. Reglas:

- Se reconstruye en el constructor, en `setSkin()` y en `resize()` — nunca en `draw()`.
- El offscreen debe crearse a la resolución de **backing store real**
  (`W * deviceScale`, no `W` a secas) con `ctx.scale(deviceScale, deviceScale)` antes
  de dibujar; si se cachea a 1x y se escala luego vía `drawImage` a un tamaño mayor,
  se ve borroso en pantallas de alto DPR. `deviceScale` se recalcula en `resize(width,
height, dpr)` como `(width * dpr) / W`.
- Lo que cambia con el estado del juego (ej. relleno de una meta alcanzada) se queda
  fuera del offscreen y se sigue pintando por frame.

### 3. DPR real + `ResizeObserver` (reemplaza el cálculo de una sola vez)

Patrón ya usado por `tetris-canvas.tsx`, adaptado para canvas de área completa
(no solo un `.tetris-stage` con `transform: scale()`):

- Envolver el `<canvas>` en un `<div>` contenedor (`position:absolute;inset:0`) y
  observar ese contenedor con `ResizeObserver`, no el propio `<canvas>` (evita
  bucles de resize retroalimentados).
- En cada medición: `dpr = Math.min(window.devicePixelRatio || 1, 2)` (tope 2x — más
  no aporta nitidez perceptible y sí cuesta relleno/blit), `canvas.width/height =
Math.round(tamañoMostrado * dpr)`, y `ctx.setTransform((cssWidth/LOGICAL_W)*dpr, 0,
0, (cssHeight/LOGICAL_H)*dpr, 0, 0)` para que el motor siga dibujando en
  coordenadas lógicas fijas.
- Medir de forma síncrona una vez antes de `engine.start()` (vía
  `getBoundingClientRect()`), y dejar el `ResizeObserver` solo para cambios
  posteriores — evita un primer frame con el tamaño por defecto del atributo
  `width`/`height` del `<canvas>`.

### 4. No repintar en pausa

`setPaused(paused)` solo actúa si el valor cambia: al pausar, pinta una vez y ya; al
reanudar, resetea `lastTime = null` (evita un salto de `dt` por el tiempo detenido
sin pasar por el `rAF`). El `loop()` deja de llamar a `draw()` mientras `paused` es
verdadero, pero mantiene el `requestAnimationFrame` vivo (no lo cancela) para poder
reaccionar de inmediato al reanudar.

### 5. Encuadre a viewport (`fitViewport`) — la trampa real de CSS

**No hacer:** darle a `.crt-screen` (el box con `aspect-ratio`) `height:100%` directo
dentro de un `.crt` con `flex:1 1 auto;min-height:0`, cuando `.crt` también contiene
`.crt-bottom`/panel táctil como hermanos y tiene `overflow:hidden`. Se verificó en
navegador: `.crt-screen` consume el 100% de la caja de `.crt`, no deja lugar para
`.crt-bottom`, y ese contenido queda recortado por el `overflow:hidden` (~5px
recortados a 1280×800 en las pruebas de esta spec).

**Tampoco funciona:** agregar `max-width:100%` a `.crt-screen` como parche — el
`aspect-ratio` no se reaplica después de que `flex-grow` ya fijó la altura, así que
el ancho se recorta pero la altura no lo acompaña → el tablero queda distorsionado
(ancho/alto ya no respeta la proporción).

**Patrón que sí funciona** (usado en esta spec para Frogger, verificado con
mediciones de `getBoundingClientRect()` en 1280×800 y 390×844 — proporción exacta en
ambos): un **contenedor intermedio** (`.crt-viewport`) que es el que participa del
flex de `.crt` (`flex:1 1 auto;min-height:0`), y adentro `.crt-screen` se queda como
bloque normal (no flex item) con la técnica ya probada en los otros 4 juegos:
`aspect-ratio` + `max-height:100%` (en vez de `78vh`) + `margin:0 auto`, sin
`width` explícito. Un box de aspecto fijo como hijo directo de un flex container
nunca resuelve bien ambos ejes a la vez (flexbox solo deriva un eje del otro vía
`aspect-ratio`, no hace el "contain" de dos restricciones simultáneas); como bloque
normal sí lo resuelve el navegador de forma nativa y ya validada en producción.

`.crt-viewport` solo se renderiza cuando `engine?.fitViewport` es verdadero (en
`game-player.tsx`), para no tocar el marcado de los juegos que no usan este patrón.

### 6. `--nav-h` debe seguir los breakpoints reales de `.av-nav`

`.av-nav` cambia de alto real en el breakpoint de colapso (padding reducido, enlaces
ocultos): 85px en desktop, 66px medido en `<=840px` en las pruebas de esta spec. Si
`.av-player--fit` (o cualquier `calc(100vh - var(--nav-h))`) usa un `--nav-h` fijo
que no sigue ese cambio, el cálculo queda ligeramente desalineado en móvil (no rompe
el criterio de "sin scroll", pero deja un margen de más). Redefinir `--nav-h` dentro
del mismo `@media (max-width: 840px)` que ya toca `.av-nav`, con el valor medido en
ese breakpoint.
