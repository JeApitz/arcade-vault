# Skins por juego

Memoria del agente `skin-designer`. Se actualiza en CADA corrida, sobre el juego trabajado.
Skins obligatorios en todo juego: `clasico` (default), `neon`, `retro`.

## Estado

| Juego      | clasico | neon | retro | Archivo de paleta  | Técnica de sprites            | Contraste | Verificado |
| ---------- | ------- | ---- | ----- | ------------------ | ----------------------------- | --------- | ---------- |
| asteroides | ✅      | ✅   | ✅    | asteroids-skins.ts | n/a (vectorial)               | R1–R9     | 2026-08-24 |
| tetris     | ⬜      | ⬜   | ⬜    | —                  | n/a (procedural) + chrome DOM | —         | —          |
| arkanoid   | ✅      | ✅   | ✅    | arkanoid-skins.ts  | hoja teñida pre-horneada      | R1–R9     | 2026-08-24 |
| snake      | ✅      | ✅   | ✅    | snake-skins.ts     | ctx.filter en la fruta        | R1–R9     | 2026-08-24 |

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

- Pendientes: tetris.
- Los tres juegos implementados (asteroides, arkanoid, snake) pasan R1–R9 en sus tres skins sin
  excepciones. `clasico` se ajustó mínimamente en cada uno (ver `### Por juego`) para cumplir R3/
  R5/R7 sin perder su identidad visual.

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
