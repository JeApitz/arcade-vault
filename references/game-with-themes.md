# Skins por juego

Memoria del agente `skin-designer`. Se actualiza en CADA corrida, sobre el juego trabajado.
Skins obligatorios en todo juego: `clasico` (default), `neon`, `retro`.

## Estado

| Juego      | clasico | neon | retro | Archivo de paleta | Técnica de sprites            | Contraste | Verificado |
| ---------- | ------- | ---- | ----- | ----------------- | ----------------------------- | --------- | ---------- |
| asteroides | ⬜      | ⬜   | ⬜    | —                 | n/a (vectorial)               | —         | —          |
| tetris     | ⬜      | ⬜   | ⬜    | —                 | n/a (procedural) + chrome DOM | —         | —          |
| arkanoid   | ⬜      | ⬜   | ⬜    | —                 | hoja teñida pre-horneada      | —         | —          |
| snake      | ⬜      | ⬜   | ⬜    | —                 | ctx.filter en la fruta        | —         | —          |

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

- Ningún juego tiene skins todavía. Orden sugerido (menor a mayor riesgo): snake → tetris →
  asteroides → arkanoid. Arkanoid al final porque exige el pipeline de teñido de spritesheet.

## Por juego

_(una sección `### <juego>` por juego completado — se añade al terminar cada uno)_
