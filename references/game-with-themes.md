# Skins por juego

Memoria del agente `skin-designer`. Se actualiza en CADA corrida, sobre el juego trabajado.
Skins obligatorios en todo juego: `clasico` (default), `neon`, `retro`.

## Estado

| Juego      | clasico | neon | retro | Archivo de paleta  | Técnica de sprites            | Contraste | Verificado |
| ---------- | ------- | ---- | ----- | ------------------ | ----------------------------- | --------- | ---------- |
| asteroides | ✅      | ✅   | ✅    | asteroids-skins.ts | n/a (vectorial)               | R1–R9     | 2026-08-24 |
| tetris     | ✅      | ✅   | ✅    | tetris-skins.ts    | n/a (procedural) + chrome DOM | R1–R9     | 2026-08-24 |
| arkanoid   | ✅      | ✅   | ✅    | arkanoid-skins.ts  | hoja teñida pre-horneada      | R1–R9     | 2026-08-24 |
| snake      | ✅      | ✅   | ✅    | snake-skins.ts     | ctx.filter en la fruta        | R1–R9     | 2026-08-24 |
| frogger    | ✅      | ✅   | ✅    | frogger-skins.ts   | n/a (vectorial/procedural)    | R1–R9     | 2026-08-25 |

Leyenda: ✅ listo · 🟡 en curso · ⬜ pendiente · ❌ bloqueado (anotar en Pendientes).

## Invariantes (no romper)

1. `clasico` reproduce los colores previos al skinning, salvo las desviaciones mínimas necesarias
   para cumplir R1–R9 (documentadas por juego en `### Por juego`) — ya no es un baseline de
   regresión píxel-perfecto.
2. `skinId` NUNCA entra en el `key` de `<engine.Canvas>` — cambiar de skin no reinicia la partida.
3. `setSkin` fuerza un repintado: en pausa/game over el rAF puede estar detenido.
4. Clave de localStorage: `arcade-vault:skin:<gameId>`, por juego. Lectura tolerante a fallos.
5. Sprites pixel-art monocromo/rampa → teñido pre-horneado. Sprites fotográficos → ctx.filter. Nunca al revés.
6. El sitio es dark-only. No se añade light mode.

## Registro de decisiones

- **Reversión de `specs/08-juego-tetris.md:26,104`.** Ese spec rechazó el theme-toggle del tetris
  original ("Arcade Vault usa siempre su estética CRT/neón fija"). Este sistema lo revierte: ahora
  hay 3 skins por juego, seleccionables en la pantalla de jugar. La estética CRT del marco se
  mantiene fija; lo que cambia es la paleta INTERIOR del canvas.
- **Excepción a "sin persistencia fuera de scores".** El skin elegido se guarda en localStorage —
  primera y única escritura a localStorage del proyecto.

## Pendientes y riesgos conocidos

- Pendientes: ninguno — los 5 juegos del catálogo (asteroides, tetris, arkanoid, snake, frogger)
  tienen sus 3 skins implementados.
- Los cinco juegos pasan R1–R9 en sus tres skins sin excepciones. `clasico` se ajustó mínimamente
  en cada uno (ver `### Por juego`) para cumplir R3/R5/R7 sin perder su identidad visual.

## Por juego

### asteroides

- Archivo: `app/juegos/[id]/jugar/asteroids-skins.ts`. `AsteroidsExtra`: `ship`, `bullet`,
  `asteroid`, `thrust`, `particle`, `powerUp`.
- `clasico`: wireframe monocromo casi original — fondo `#08080c` (era `#000000` puro; sube la
  luminancia justo sobre el mínimo de R5 sin leerse distinto a negro), nave `#ffffff`, bala
  `#dedede`, asteroide `#c1c1c1`, partícula `#a7a7a7` (rampa de 4 grises en vez de 4×`#ffffff`,
  para que R3 pueda distinguir los objetos entre sí sin abandonar la identidad monocroma), thrust
  naranja `rgba(255,130,0,0.85)`, powerup cian `#00ffff` sin cambios.
- `neon`: nave magenta `#ff2fe0` con glow (blur 12, Δhue 0° vs accent), balas cian `#5df5ff`,
  asteroides violeta `#8a5cff`, chispas amarillo-lima `#eaff5d`, powerup verde menta `#5dff9e`,
  fondo casi-negro `#0a0414`.
- `retro`: paleta fósforo verde CRT (nave `#4dff4d`, balas `#c8ff8a`, asteroides `#3ecf3e`, fondo
  `#0d1400`), sin glow, chispas y powerup en tonos ámbar/rojo (`#ff5a3a` / `#ffe066`) para
  distinguirlos de la nave verde.
- Contraste medido con el script de verificación (mismas fórmulas que `assertSkinContrast`):
  los tres skins pasan R1–R9 sin excepciones.
- Gotcha: `Particle.draw` necesitaba un helper `withAlpha(hex, alpha)` nuevo en el motor porque el
  fade de las partículas dependía de un literal `rgba(255,255,255,alpha)`; ahora compone el alfa
  sobre `skin.particle` (hex) en cada frame.
- Gotcha: `drawOverlay` (pantalla de GAME OVER dentro del canvas) ahora también pinta
  `skin.overlay` de fondo antes del texto — en `clasico` es `rgba(0,0,0,0.6)` sobre un `bg` ya
  casi negro, así que el cambio respecto al comportamiento previo es imperceptible.

### snake

- Archivo: `app/juegos/[id]/jugar/snake-skins.ts`. `SnakeExtra`: `head`, `body`, `fruitFilter`
  (`ctx.filter` CSS aplicado solo al `drawFruit` del sprite fotográfico de frutas; `null` en
  `clasico`).
- `clasico`: casi reproduce los literales originales de `snake-engine.ts` — fondo `#05070a`,
  rejilla `rgba(0,255,136,0.10)` (era `0.08`; sube el alfa lo mínimo para que R7 distinga la
  rejilla del fondo), cabeza `#00ff88` con glow verde (`shadowBlur` 8 en cabeza, 3 en cuerpo),
  cuerpo `rgba(0,255,136,0.75)`, fruta de respaldo (sprite sin cargar) `#ff3b5c`, texto HUD
  `#00ff88`.
- `neon`: serpiente turquesa `#39ffe0` con glow (blur 12), fondo violeta casi-negro `#0a0417`,
  peligro magenta `#ff2fa0`, filtro de fruta que satura/aclara y le agrega un `drop-shadow`
  turquesa sutil (la fruta sigue siendo fotográfica y reconocible, solo se realza).
- `retro`: paleta fósforo verde CRT (acento lima `#c8ff4d`, fondo `#0d1400`, peligro ámbar
  `#ffb000`), sin glow, filtro de fruta con `sepia`+`hue-rotate` para virar los colores hacia el
  verde/ámbar de la paleta sin perder la silueta de la fruta.
- Contraste medido con el script de verificación (mismas fórmulas que `assertSkinContrast`):
  los tres skins pasan R1–R9 sin excepciones (`clasico` grid/bg 1.17; `neon` fg/bg 18.02, accent/bg
  15.88, grid/bg 1.31, danger/bg 5.91; `retro` fg/bg 15.17, accent/bg 15.99, grid/bg 1.41,
  danger/bg 10.26). `clasico` mantiene glow (contraviniendo la sugerencia de "glow null en clásico
  y retro" de la Fase 4.5): el snake original YA usaba `shadowBlur` en la cabeza/cuerpo, así que el
  glow es parte de su identidad clásica, no una adición de "neón"; `retro` sigue sin glow para
  mantenerse distinguible de `neon`.
- Gotcha: el bucle de render de `SnakeEngine.loop` nunca se detiene (pausa y game over solo
  saltan el `update()`, pero `draw()` sigue llamándose cada frame), así que en la práctica
  `setSkin` no necesitaba forzar un repintado — se agregó de todas formas por consistencia con el
  resto de motores y por si la implementación del loop cambia en el futuro.
- Gotcha: el fondo de `drawOverlay` (scrim antes del texto de GAME OVER) es una adición nueva —
  el motor original de snake no pintaba ningún scrim ahí, solo texto sobre lo ya dibujado. Se
  agregó `ctx.fillRect` con `skin.overlay` para que el campo `overlay` del núcleo tenga efecto
  real (igual que en asteroides) y R8 sea verificable; es una diferencia menor y momentánea (el
  modal externo de `game-player.tsx` cubre la pantalla casi de inmediato).

### arkanoid

- Archivos: `app/juegos/[id]/jugar/arkanoid-skins.ts` (paletas) y el pipeline de teñido nuevo en
  `arkanoid-sprites.ts` (`getTintedSheet`, `ArkanoidTintConfig`). `ArkanoidExtra`: `tint`
  (`Record<ArkanoidBlockColor, string> | null`, las 7 claves de bloque `red/cyan/green/magenta/
yellow/hotpink/gray`), `paddleTint`, `ballTint` — los tres `null` juntos en `clasico` (hoja de
  sprites sin teñir), presentes en `neon`/`retro`.
- Técnica: pixel-art de rampa (`spritesheet-breakout.png`) → teñido pre-horneado, una vez por
  skin, cacheado en un `Map<SkinId, HTMLCanvasElement>` a nivel de módulo (es un cache de recurso,
  no estado de juego — igual que el `ssImg` original que ya vivía ahí). Receta por rect:
  copia → `"color"` (o `"source-atop"` si el navegador no soporta el blend mode, con
  feature-detect una sola vez) → `"destination-in"` para restaurar la máscara alfa → vuelca a la
  hoja teñida. Se tiñen paddle, ball, los 7 bloques y también los 28 frames de explosión (4 por
  color) para que las explosiones no desentonen con el bloque que las genera.
- `ArkanoidEngine` gana un último parámetro `skin` en el constructor y un método público
  `setSkin()` que reemite la hoja teñida (`refreshSheet()`) y fuerza `this.draw()` — necesario
  porque en pausa/game over el loop sigue pintando el mismo frame sin cambios de estado que lo
  disparen de otro modo. `drawSprite`/`drawFrame` ganan un último parámetro `sheet` opcional
  (por defecto la hoja sin teñir); el motor siempre pasa `this.sheet`, calculado explícitamente,
  nunca una variable mutable leída desde fuera del motor.
- `clasico`: hoja de sprites original sin teñir, fondo `#08080c` (era `#000000` puro; sube la
  luminancia justo sobre el mínimo de R5 sin leerse distinto a negro), texto `#fff`, overlay de
  game over/win `rgba(0,0,0,0.6)`.
- `neon`: 7 bloques recoloreados a una paleta vívida (`red #ff2f5e`, `cyan #5df5ff`,
  `green #5dff9e`, `magenta #ff2fe0`, `yellow #f5ff5d`, `hotpink #ff8a3a`, `gray #b98aff`, todas
  con Δhue ≥30° entre sí), paddle `#ffb3f5`, ball blanco `#ffffff`, fondo violeta casi-negro
  `#0a0414`, acento/glow magenta `#ff2fe0` (blur 10).
- `retro`: paleta fósforo CRT ámbar/verde (`red #ff5a3a`, `yellow #ffe066`, `green #3ecf3e`,
  `cyan #5dffc8`, `gray #5de0ff`, `magenta #ff5a9e`, `hotpink #c8ff5d`), paddle verde `#4dff4d`,
  ball blanco, fondo `#0d1400`, sin glow para distinguirse de `neon`.
- Contraste medido con el script de verificación (mismas fórmulas que `assertSkinContrast`,
  extras = 7 tints + paddleTint + ballTint): los tres skins pasan R1–R9 sin excepciones. En
  `clasico`, `tint`/`paddleTint`/`ballTint` siguen `null` (hoja sin teñir), así que sus colores de
  bloque reales viven en el spritesheet PNG, no en JS, y no entran al array `extraColors`
  (no se evalúa R2/R3 sobre ellos).
- Decisión de alcance: el overlay de pausa con selector de nivel (`drawPauseOverlay`, los 5
  botones `1..5` y el texto "Saltar al nivel") se dejó SIN temar — sigue usando sus literales
  `#f0c040`/`#444`/`#fff`/`#000` originales. Es UI de control de nivel, no identidad visual del
  campo de juego, y temarla habría forzado inventar una cuarta paleta de "chrome" sin anclaje en
  ningún literal previo. El HUD que sí cambia con el skin es el que se ve en juego normal:
  `Score:`/`Nivel:` y los corazones de vida (sprite `ball` teñido), más el overlay de GAME OVER /
  víctoria (`drawOverlay`, ahora usa `skin.fg` y `skin.overlay`).
- Gotcha: `Object.entries(SPRITES.blocks)` / `Object.entries(EXPLOSION_FRAMES)` tipan las claves
  como `string`; se necesitó un cast a `ArkanoidBlockColor` en `getTintedSheet` para indexar
  `config.tint` sin ampliar el tipo del `Record`.

### tetris

- Archivo: `app/juegos/[id]/jugar/tetris-skins.ts`. `TetrisExtra`: `pieces` (tupla de 9, índice 0
  `null` sin usar, 1..7 = I/O/T/S/Z/J/L, 8 = N/tuerca), `ghostAlpha` (alfa de la silueta de caída,
  reemplaza el literal `0.2` que tenía `drawBlock`), `dom` (`TetrisDom`: `border`, `canvasBg`,
  `label`, `value`, `controlsText`, `kbdBg`, `kbdBorder`, `kbdText` — mapea 1:1 a las 8 vars
  `--tetris-*` de `app/globals.css` que hoy solo tenían fallback).
- Técnica: procedural puro (`fillRect`/`strokeStyle`, sin sprites) para el tablero + panel DOM
  React fuera del canvas (SCORE/LINES/LEVEL, NEXT, CONTROLS) estilado con custom properties CSS
  inline en `.tetris-container`, una por campo de `dom`.
- `TetrisEngine` gana un último parámetro `skin` en el constructor y un método público `setSkin()`
  que reasigna `this.skin` y llama a `this.draw()`. Es redundante en la práctica (el loop de
  render de tetris, igual que el de snake, nunca se detiene: en pausa/game over sigue llamando a
  `draw()` cada frame en su rama temprana) pero se agregó por consistencia con el resto de motores
  y como salvaguarda ante cambios futuros del loop.
- `clasico`: paleta "Tokyo Night" casi original de `tetris-engine.ts` — fondo `#1a1a25`, rejilla
  `#2a2a3a` (era `#22222e`; se aclara lo mínimo para que R7 distinga la rejilla del fondo), 7
  piezas con 2 ajustes de matiz sobre el original (ver Gotcha), `dom` calcado de los fallbacks que
  ya tenía `globals.css` (`--tetris-border: #2a2a3a`, `--tetris-value: #7aa2f7`, etc.).
- `neon`: 8 colores de pieza vívidos con Δhue ≥30° entre sí (`I #5df5ff`, `O #f5ff5d`,
  `T #ff2fe0`, `S #5dff9e`, `Z #ff2f5e`, `J #5d8aff`, `L #ff8a3a`, `N #8a5cff`), acento/glow
  magenta `#ff2fe0` (blur 10), fondo violeta casi-negro `#0a0414`, `dom` con bordes/kbd en
  `rgba(255,47,224,·)` sobre fondo casi-negro.
- `retro`: paleta fósforo CRT ámbar/verde (`I #5dffc8`, `O #ffe066`, `T #ff5a9e`, `S #3ecf3e`,
  `Z #ff5a3a`, `J #5de0ff`, `L #c8ff5d`, `N #ffb000`), acento verde `#4dff4d`, sin glow, fondo
  `#0d1400`.
- Contraste medido con el script de verificación (mismas fórmulas que `assertSkinContrast`,
  extras = las 8 piezas no nulas): los tres skins pasan R1–R9 sin excepciones (`clasico` fg/bg
  13.90, grid/bg 1.22; `neon` fg/bg 17.96, grid/bg 1.30; `retro` fg/bg 15.17, grid/bg 1.38).
- Gotcha: el `clasico` original tenía 3 pares de piezas casi indistinguibles entre sí (R3): I
  `#4dd0e1` vs J `#90caf9` (cyan vs azul pálido, Δhue 20°), O `#ffd54f` vs L `#ffb74d` (amarillo vs
  naranja, Δhue 10°), y Z `#e57373` vs N `#9e9e9e` (rojo vs gris, sin diferencia de matiz posible
  con un gris desaturado). Se oscureció/saturó J a `#5c7cfa` y L a `#ff9800`, y se vistió N con un
  tono bronce `#a1835c` — la pieza N no es alcanzable en juego hoy (su forma está comentada en
  `PIECES`, `tetris-engine.ts:65-69`; solo se generan tipos 1..7), así que este ajuste es
  puramente defensivo por si se reactiva en el futuro.
- Gotcha: `.tetris-value` en `globals.css` tenía el color `#7aa2f7` hardcodeado sin `var()`; se
  convirtió a `var(--tetris-value, #7aa2f7)` para que el campo `dom.value` del skin pueda
  sobreescribirlo (mismo patrón que las otras 7 vars `--tetris-*`, que ya usaban fallback).

### frogger

- Archivo: `app/juegos/[id]/jugar/frogger-skins.ts`. `FroggerExtra`: `cars` (tupla de 3, coches),
  `truck`/`truckCabin`/`tire`, `log`/`logGrain`, `turtle`/`turtleSubmerged`, `zoneRiver`/`zoneSafe`/
  `zoneGoal` (fondos de zona; `zoneRoad` reutiliza el `bg` del núcleo, es la zona dominante),
  `goalBorder`/`goalFilled`, `timeGood`/`timeWarn` (`danger` del núcleo cubre el estado "malo" de
  la barra de tiempo), `eyeWhite`/`eyePupil` (blanco/negro fijos en los 3 skins — detalle cosmético
  menor, no necesita variar).
- Técnica: procedural puro (`fillRect`/`ellipse`/`arc`, sin sprites bitmap), igual que
  asteroides/tetris. `FroggerEngine` gana un último parámetro `skin` en el constructor y un método
  público `setSkin()` que reasigna `this.skin` y fuerza `this.draw()`.
- Adición nueva (no cambia mecánica): una línea divisoria sutil entre filas usando `skin.grid`,
  para que el campo `grid` del núcleo tenga un uso real — el motor original no dibujaba ninguna
  rejilla, solo 4 zonas de color sólido por fila.
- `clasico`: casi calca los literales originales de `frogger-engine.ts` — fondo/carretera
  `#0a0a0a` (ya cumplía R4/R5 sin ajuste, no es negro puro), río `#0a1a33`, zona segura `#0a2410`,
  bocas `#0f3018` con borde `#e8c547`, coches `["#ff3b5c","#f5ff5d","#5df5ff"]`, camión `#9aa0a6`/
  cabina `#5b6066`, tronco `#8a5a30`, HUD blanco, barra de tiempo verde/amarillo/rojo original.
  Dos desviaciones mínimas por R3: rana/meta `#5ee600` (era `#7CFC00`, Δhue +25° sobre el amarillo
  de los coches y +25° sobre la tortuga) y tortuga `#2ecf7e` (era `#3ecf3e`, vira hacia el teal,
  Δhue 54° vs la rana) — ambas leen casi idénticas a las originales a simple vista.
  `glow: null`.
- `neon`: coches `["#ff2f4d","#ffe066","#5df5ff"]`, camión violeta `#b98aff`/cabina `#8a5cff`,
  tronco naranja `#ff8a3a`, tortuga celeste `#5dc8ff`, rana/meta verde-lima `#8aff5d` con glow
  (blur 10, Δhue 0° vs accent), borde de meta magenta `#ff2fe0`, fondo violeta casi-negro `#0a0414`.
- `retro`: coches `["#ff5a3a","#ffe066","#5de0ff"]`, camión `#c8ff5d`/cabina `#3ecf3e`, tronco rosa
  `#ff5a9e`, tortuga menta `#5dffc8`, rana/meta verde fósforo `#4dff4d`, borde de meta ámbar
  `#ffb000`, fondo `#0d1400`, sin glow para distinguirse de `neon`.
- Contraste medido con `assertSkinContrast` real (import directo de `frogger-skins.ts` con
  `NODE_ENV=development`, sin errores en consola) más medición manual de ratios: `clasico` fg/bg
  19.80, fgDim/bg 8.45, accent/bg 12.06, grid/bg 1.18, danger/bg 5.69; `neon` fg/bg 18.06, fgDim/bg
  8.08, accent/bg 15.90, grid/bg 1.24, danger/bg 5.54; `retro` fg/bg 16.46, fgDim/bg 7.97, accent/bg
  14.08, grid/bg 1.44, danger/bg 6.06. Los 3 skins pasan R1–R9 sin excepciones.
- Gotcha: los `Entity` guardaban su color propio (`color: string`) fijado en `buildLanes()` al
  construir cada carril — con un skin dinámico eso habría quedado fosilizado con el color del skin
  activo al momento de generar el nivel. Se reemplazó por `carIndex?: number` (solo para coches,
  índice 0..2 en `skin.cars`) y `drawEntity` resuelve camión/tronco/tortuga directo desde
  `this.skin` en cada frame — así el cambio de skin en caliente afecta a las entidades ya en pantalla
  sin reconstruir los carriles.
