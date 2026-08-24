# Skins por juego

Memoria del agente `skin-designer`. Se actualiza en CADA corrida, sobre el juego trabajado.
Skins obligatorios en todo juego: `clasico` (default), `neon`, `retro`.

## Estado

| Juego      | clasico | neon | retro | Archivo de paleta  | Técnica de sprites            | Contraste        | Verificado |
| ---------- | ------- | ---- | ----- | ------------------ | ----------------------------- | ---------------- | ---------- |
| asteroides | ✅      | ✅   | ✅    | asteroids-skins.ts | n/a (vectorial)               | R1–R9 (ver nota) | 2026-08-24 |
| tetris     | ⬜      | ⬜   | ⬜    | —                  | n/a (procedural) + chrome DOM | —                | —          |
| arkanoid   | ⬜      | ⬜   | ⬜    | —                  | hoja teñida pre-horneada      | —                | —          |
| snake      | ⬜      | ⬜   | ⬜    | —                  | ctx.filter en la fruta        | —                | —          |

Leyenda: ✅ listo · 🟡 en curso · ⬜ pendiente · ❌ bloqueado (anotar en Pendientes).

## Invariantes (no romper)

1. `clasico` reproduce EXACTAMENTE los colores previos al skinning — es el baseline de regresión.
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

- Pendientes: snake, tetris, arkanoid (en ese orden sugerido — arkanoid al final porque exige el
  pipeline de teñido de spritesheet).
- `asteroides` `clasico` incumple deliberadamente R3 y R5 — ver sección `### asteroides` abajo. Es
  el único juego con excepciones documentadas hasta ahora; los siguientes juegos deberían intentar
  evitarlas si su paleta original lo permite (asteroides no lo permite: es monocromo por diseño).

## Por juego

### asteroides

- Archivo: `app/juegos/[id]/jugar/asteroids-skins.ts`. `AsteroidsExtra`: `ship`, `bullet`,
  `asteroid`, `thrust`, `particle`, `powerUp`.
- `clasico`: reproduce el vector wireframe monocromo original (todo blanco sobre negro puro,
  thrust naranja `rgba(255,130,0,0.85)`, powerup cian `#00ffff`) — 0 cambios visuales respecto al
  motor previo al skinning.
- `neon`: nave magenta `#ff2fe0` con glow (blur 12, Δhue 0° vs accent), balas cian `#5df5ff`,
  asteroides violeta `#8a5cff`, chispas amarillo-lima `#eaff5d`, powerup verde menta `#5dff9e`,
  fondo casi-negro `#0a0414`.
- `retro`: paleta fósforo verde CRT (nave `#4dff4d`, balas `#c8ff8a`, asteroides `#3ecf3e`, fondo
  `#0d1400`), sin glow, chispas y powerup en tonos ámbar/rojo (`#ff5a3a` / `#ffe066`) para
  distinguirlos de la nave verde.
- Contraste medido con el script de verificación (mismas fórmulas que `assertSkinContrast`):
  `neon` y `retro` pasan R1–R9 sin excepciones. `clasico` incumple dos reglas a propósito, por el
  invariante 1 (reproducir literales exactos) sobre el reglamento R3/R5:
  - **R5** (`luminancia(bg) ≥ 0.002`): `clasico` usa `#000` puro (el motor original lo hacía).
  - **R3** (distinguibilidad): nave/bala/asteroide/partícula son las mismas `#ffffff` — el
    Asteroids original es un wireframe vectorial monocromo, distinguir por color estos objetos
    rompería la identidad del skin "clásico".
    Confirmado en runtime: el log del dev server solo emite esos 7 `console.error` (uno por par R3 +
    uno R5) para `clasico`; `neon`/`retro` no emiten nada.
- Gotcha: `Particle.draw` necesitaba un helper `withAlpha(hex, alpha)` nuevo en el motor porque el
  fade de las partículas dependía de un literal `rgba(255,255,255,alpha)`; ahora compone el alfa
  sobre `skin.particle` (hex) en cada frame.
- Gotcha: `drawOverlay` (pantalla de GAME OVER dentro del canvas) ahora también pinta
  `skin.overlay` de fondo antes del texto — en `clasico` es `rgba(0,0,0,0.6)` sobre un `bg` ya
  `#000`, así que no cambia ni un píxel respecto al comportamiento previo.
