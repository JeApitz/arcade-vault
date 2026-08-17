# 09 — Juego Arkanoid

**Estado:** Aprobado
**Depende de:** SPEC 05, SPEC 06, SPEC 07, SPEC 08
**Fecha:** 2026-08-17

**Objetivo:** Portar el Arkanoid standalone de `references/started-games/04-arkanoid/` a un juego real y jugable dentro de Arcade Vault, con sprites y sonido reales (primer juego del catálogo con assets binarios), 5 niveles con velocidad creciente, control por teclado y mouse, y su propia entrada en `engines.ts` y en el catálogo/leaderboard de Supabase.

## Alcance

**Incluye:**

- Nueva fila en la tabla `games` de Supabase (migración vía `mcp__supabase__apply_migration`, siguiendo el patrón de SPEC 07/08): `{ id: "arkanoid", title: "ARKANOID", cat: "ARCADE", cover: "cover-arkanoid", color: "green", short: "...", long: "...", best: 0, plays: "0" }`.
- Clase nueva `.cover-arkanoid` en `app/globals.css`, mismo patrón (gradiente + `::after`/`::before`) que `.cover-asteroides`/`.cover-tetris`.
- Copia de los assets binarios del original a `public/games/arkanoid/`: `spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`. Primer uso de `public/` para assets de un juego (hasta ahora todo se dibujaba con formas de canvas puro).
- Puerto de `references/started-games/04-arkanoid/assets/spritesheet.js` a `app/juegos/[id]/jugar/arkanoid-sprites.ts`: mismo API (`loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`), cargando la imagen desde `/games/arkanoid/spritesheet-breakout.png`.
- Puerto de `references/started-games/04-arkanoid/levels.js` a `app/juegos/[id]/jugar/arkanoid-levels.ts`: mismo array `LEVELS` (5 niveles, `blocks[]` + `speed`), sin cambios de contenido.
- Puerto completo de la lógica de `game.js` a `app/juegos/[id]/jugar/arkanoid-engine.ts`, exportando una clase `ArkanoidEngine` que encapsula todo el estado como propiedades de instancia (paddle, ball, blocks, explosions, lives, score, currentLevel, gameState, isPaused), sin variables globales de módulo. Incluye:
  - Movimiento de paddle por teclado (`←`/`→`) y por mouse (`mousemove` sobre el canvas, con el mismo cálculo de `scaleX` que el original para compensar el escalado CSS).
  - Física de pelota, rebotes en paredes/paddle, colisión AABB contra bloques, explosión animada (4 frames del spritesheet) al destruir un bloque, sonido de rebote y de rotura reproducidos con `Audio(...).cloneNode().play()`.
  - Los 5 niveles de `arkanoid-levels.ts`: al limpiar todos los bloques de un nivel se carga el siguiente (`loadLevel`); al limpiar el nivel 5 el estado pasa a `"win"`.
  - Pérdida de vida cuando la pelota cae por debajo del canvas; a 0 vidas el estado pasa a `"gameover"`.
  - Pausa con doble disparador: `setPaused(bool)` (llamado por el padre desde el botón `PAUSA`/`REANUDAR` del HUD) y las teclas `P`/`Escape` (como en el original) que alternan el mismo estado interno. Cualquiera de los dos disparadores invoca un callback `onPauseChange(bool)` para que el estado `paused` del padre (`game-player.tsx`) quede sincronizado con el de las teclas y el botón del HUD muestre siempre la etiqueta correcta.
  - Mientras está en pausa, dibuja dentro del propio canvas el overlay "PAUSA" con los 5 botones de "saltar a nivel" del original (clic con mouse, mismo cálculo de coordenadas escaladas); clicar un botón llama `loadLevel(n)` y despausa.
  - `forceGameOver()` para el botón `FIN` del HUD.
- Componente cliente `app/juegos/[id]/jugar/arkanoid-canvas.tsx` (`ArkanoidCanvas`, `forwardRef<GameCanvasHandle, GameCanvasProps>`) que monta un único `<canvas width={800} height={600}>` dentro de `.crt-screen`, instancia `ArkanoidEngine` en un efecto (con cleanup vía `destroy()`), conecta `onPauseChange` recibido por props al callback del motor, y reporta el estado de partida al padre vía `onStats` (mapeando `gameState: "win"` a `status: "gameover"` igual que un game over normal, para reutilizar el modal de fin existente).
- **Extensión de `engines.ts` (sin romper los motores existentes):**
  - `GameCanvasProps` gana un campo opcional `onPauseChange?: (paused: boolean) => void`. Al ser opcional, `AsteroidsCanvas`/`TetrisCanvas` no requieren cambios (lo ignoran implícitamente).
  - `GameEngineEntry` gana un campo opcional `hidePauseOverlay?: boolean`.
  - Nueva entrada `arkanoid: { Canvas: ArkanoidCanvas, hudLabel: "VIDAS", initialStats: { score: 0, secondary: 3, level: 1, status: "playing" }, crtAspect: "4 / 3", hidePauseOverlay: true }`.
- **Modificación de `game-player.tsx`:**
  - Se pasa `onPauseChange={setPaused}` a `engine.Canvas` en todos los juegos (prop nueva, sin efecto para los motores que no la usan).
  - El overlay genérico "EN PAUSA" (el `div` con `rgba(0,0,0,0.6)` y texto "EN PAUSA"/"PULSA REANUDAR PARA CONTINUAR") deja de renderizarse cuando `engine?.hidePauseOverlay` es `true`; en ese caso el propio canvas de arkanoid dibuja su overlay de pausa con el selector de nivel.
- Controles: `←`/`→` o mouse mueven el paddle; `P`/`Escape` o el botón `PAUSA`/`REANUDAR` del HUD alternan pausa; clic en los botones 1–5 del overlay de pausa salta de nivel. Sin controles táctiles ni adaptación mobile.
- Botón `GUARDAR PUNTUACIÓN` del modal de fin inserta una fila real en `scores` (`game_id: "arkanoid"`), reutilizando el flujo genérico ya existente.
- Leaderboard real: `/juegos/arkanoid` (leaderboard lateral vía `getTopScores("arkanoid", 10)`), `/salon` (pestaña ARKANOID, ya genérica desde SPEC 07) y la home incluyen arkanoid automáticamente en cuanto existe la fila en `games`.

**No incluye (fuera de alcance de este spec):**

- Editar o añadir niveles más allá de los 5 originales.
- Power-ups, multi-bola, o cualquier mecánica que no exista ya en `references/started-games/04-arkanoid/game.js`.
- Controles táctiles/en pantalla para mobile.
- Persistencia adicional más allá de `scores` (sin localStorage, sin IndexedDB).
- Recalcular `best`/`plays` de la fila `arkanoid` en `games` dinámicamente tras jugar; quedan estáticos como se siembran (0 / "0").
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido documentado desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.
- Cambiar el texto fijo `▸ ESTE JUEGO REQUIERE TECLADO_` de `game-player.tsx` para reflejar que arkanoid también admite mouse; es un aviso genérico del reproductor que no se personaliza por juego en este spec.
- Cualquier cambio a `app/data/games.ts` (archivo mock, no se toca desde SPEC 07).

## Modelo de datos

```ts
// app/juegos/[id]/jugar/arkanoid-engine.ts
interface ArkanoidStats {
  score: number;
  lives: number; // reemplaza a "secondary" en el HUD (igual que asteroides)
  level: number; // 1..5
  status: "playing" | "dead" | "gameover"; // "win" del motor se mapea a "gameover" al reportar
}
```

`ArkanoidEngine` mantiene internamente `paddle`, `ball`, `blocks: Block[]`, `explosions: Explosion[]`, `lives`, `score`, `currentLevel`, `gameState: "playing" | "gameover" | "win"` e `isPaused` como propiedades de instancia, portadas 1:1 desde el original.

```ts
// app/juegos/[id]/jugar/arkanoid-levels.ts
interface LevelDef {
  blocks: { col: number; row: number; color: string }[];
  speed: number; // multiplicador sobre BASE_BALL_VX/VY
}
export const LEVELS: LevelDef[]; // 5 elementos, portados de levels.js sin cambios
```

Extensión de `engines.ts` (campos nuevos, opcionales, no rompen las entradas existentes):

```ts
export interface GameCanvasProps {
  onStats: (stats: GameStats) => void;
  paused: boolean;
  onPauseChange?: (paused: boolean) => void; // nuevo
}

interface GameEngineEntry {
  Canvas: ForwardRefExoticComponent<GameCanvasProps & RefAttributes<GameCanvasHandle>>;
  hudLabel: string;
  initialStats: GameStats;
  crtAspect: string;
  hidePauseOverlay?: boolean; // nuevo — arkanoid: true
}
```

## Plan de implementación

1. **Assets y catálogo.** Copiar `spritesheet-breakout.png`, `ball-bounce.mp3` y `break-sound.mp3` a `public/games/arkanoid/`. Migración que inserta la fila `arkanoid` en `games` y la clase `.cover-arkanoid` en `app/globals.css`. El juego ya aparece en `/games` y `/juegos/arkanoid`, usando todavía el reproductor roto/sin motor al jugar (sin entrada aún en `engines.ts`).
2. **Sprites y niveles.** Crear `app/juegos/[id]/jugar/arkanoid-sprites.ts` (puerto de `spritesheet.js`, cargando la imagen desde `/games/arkanoid/spritesheet-breakout.png`) y `app/juegos/[id]/jugar/arkanoid-levels.ts` (puerto de `levels.js`). Sin conectar todavía a ninguna UI.
3. **Motor del juego.** Crear `app/juegos/[id]/jugar/arkanoid-engine.ts` portando toda la lógica de `game.js` a la clase `ArkanoidEngine` (constructor recibe el `<canvas>`, un callback `onStats` y un callback `onPauseChange`), incluyendo movimiento por teclado y mouse, sonido, explosiones, progresión de 5 niveles, pausa con doble disparador (`setPaused` y teclas `P`/`Escape`) y el overlay de pausa con selector de nivel dibujado en el propio canvas. Sin conectar todavía a ninguna UI.
4. **Wrapper de React.** Crear `app/juegos/[id]/jugar/arkanoid-canvas.tsx`, componente cliente con `<canvas width={800} height={600}>`, que instancia `ArkanoidEngine` en un `useEffect` (con `destroy()` en el cleanup), conecta `onPauseChange` y expone `forceGameOver` vía `useImperativeHandle`/`forwardRef`.
5. **Registro de motores y HUD.** Extender `engines.ts` con los campos opcionales `onPauseChange`/`hidePauseOverlay` y la entrada `arkanoid`. Modificar `game-player.tsx`: pasar `onPauseChange={setPaused}` al `Canvas` de todos los juegos, y condicionar el overlay genérico "EN PAUSA" a `!engine?.hidePauseOverlay`.
6. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/arkanoid/jugar`: mover el paddle con teclado y con mouse, romper bloques (explosión + sonido), rebotar en paredes/paddle (sonido), perder una vida al caer la pelota, perder las 3 vidas y ver el modal de fin con el score real, completar un nivel y ver el siguiente cargarse con más velocidad, completar los 5 niveles y ver el modal de fin con estado de victoria, pausar con el botón del HUD y reanudar con `P`/`Escape` (y viceversa) comprobando que el botón del HUD refleja el estado correcto, usar el selector de nivel del overlay de pausa (clic con mouse) para saltar de nivel, usar `FIN` para terminar manualmente, `JUGAR DE NUEVO` para reiniciar limpio (nivel 1, 3 vidas, score 0), guardar el puntaje y verlo reflejado en `/salon` (pestaña ARKANOID) y en el leaderboard lateral de `/juegos/arkanoid` tras recargar. Repetir el recorrido básico de `/juegos/asteroides/jugar` y `/juegos/tetris/jugar` para confirmar que la extensión de `engines.ts`/`game-player.tsx` no rompió nada. Confirmar que salir de la página no deja loops, listeners ni audio huérfanos.
7. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas.

## Criterios de aceptación

- [ ] `/games` y `/juegos/arkanoid` muestran la nueva entrada "ARKANOID" en el catálogo, con su propia portada (`cover-arkanoid`).
- [ ] `/juegos/arkanoid/jugar` renderiza el juego real en un `<canvas>` con sprites (no formas de canvas puro), controlable con `←`/`→` y con el mouse.
- [ ] Destruir un bloque suma 10 puntos, reproduce el sonido de rotura y muestra la animación de explosión de 4 frames.
- [ ] La pelota rebota en paredes y paddle reproduciendo el sonido de rebote.
- [ ] Perder las 3 vidas abre el modal de fin de partida con el score real.
- [ ] Completar los bloques de un nivel (1–4) carga el siguiente nivel con velocidad de pelota mayor, sin abrir el modal de fin.
- [ ] Completar el nivel 5 abre el modal de fin de partida (estado de victoria mapeado a game over) con el score real.
- [ ] El botón `PAUSA`/`REANUDAR` del HUD y las teclas `P`/`Escape` controlan el mismo estado de pausa: activar uno actualiza el otro (la etiqueta del botón cambia sin importar cuál se usó).
- [ ] Mientras está en pausa, el canvas muestra el overlay con los 5 botones de "saltar a nivel"; clicar uno con el mouse cambia de nivel y reanuda la partida. El overlay genérico "EN PAUSA" del HUD no se muestra para arkanoid.
- [ ] El botón `FIN` termina la partida de inmediato y abre el modal de fin con el score alcanzado hasta ese momento.
- [ ] El botón `JUGAR DE NUEVO` reinicia una partida completamente nueva (score en 0, 3 vidas, nivel 1).
- [ ] Guardar el puntaje inserta una fila real en `scores` con `game_id: "arkanoid"`, visible en `/salon` (pestaña ARKANOID) y en el leaderboard de `/juegos/arkanoid` tras recargar la página.
- [ ] Después de extender `engines.ts`/`game-player.tsx`, `/juegos/asteroides/jugar` y `/juegos/tetris/jugar` siguen funcionando exactamente igual que antes (HUD, pausa, fin, reinicio, guardado de puntaje).
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Se copian assets binarios reales (spritesheet + sonidos) en vez de redibujar con canvas puro.** Decisión explícita del usuario: arkanoid es el primer juego del catálogo con sprites y audio; asteroides/tetris seguían siendo formas de canvas puro por elección de sus specs, no por una regla general del proyecto.
- **`public/games/arkanoid/` como ubicación de los assets, con URL absoluta.** Aísla los assets de este juego de los SVG genéricos que ya viven en la raíz de `public/`, y deja espacio para que futuros juegos con assets sigan el mismo patrón (`public/games/<id>/`).
- **Se portan los 5 niveles completos con su multiplicador de velocidad**, en vez de simplificar a un nivel único — decisión explícita del usuario, manteniendo la progresión de dificultad original.
- **Control por teclado y mouse, con el overlay de selector de nivel dentro del canvas** — decisión explícita del usuario de portar la experiencia completa del original en vez de recortarla al patrón teclado-only de asteroides/tetris.
- **Pausa con doble disparador (`setPaused` del HUD + teclas `P`/`Escape` del motor), sincronizados vía `onPauseChange`.** Alternativa descartada: eliminar las teclas P/Escape como hicieron asteroides/tetris — se descarta porque el usuario pidió explícitamente conservar el overlay de selector de nivel del original, que depende de esas teclas para pausar sin pasar por el HUD.
- **`hidePauseOverlay: true` en la entrada de arkanoid, campo opcional nuevo en `GameEngineEntry`**, en vez de que arkanoid ignore el overlay genérico por su cuenta (ej. z-index) — se resuelve la superposición a nivel de `game-player.tsx`, que es quien decide si renderiza su propio overlay, manteniendo una sola fuente de verdad sobre qué overlay se muestra.
- **`GameCanvasProps.onPauseChange` opcional, no obligatorio.** Evita tocar `AsteroidsCanvas`/`TetrisCanvas`, que no lo necesitan; el registro de motores sigue siendo aditivo en vez de forzar un refactor de los dos juegos existentes.
- **Estado `"win"` del motor se reporta al padre como `status: "gameover"`.** `GameStats` no gana un tercer estado terminal; se reutiliza el modal de fin existente en vez de diseñar un modal de victoria separado, consistente con "no hay UI de victoria" en ningún otro juego del catálogo.
- **Categoría `"ARCADE"` y color `"green"`.** `"ARCADE"` ya existe en el enum de `app/data/games.ts` (`CATS`); breakout/arkanoid no encaja mejor en `SHOOTER` ni `PUZZLE`. Verde queda libre (asteroides=cyan, tetris=yellow).
- **Sin persistencia de puntaje fuera de Supabase, sin controles táctiles.** Mismo criterio que SPEC 05/06/07/08.
- **No se personaliza el texto `▸ ESTE JUEGO REQUIERE TECLADO_` para mencionar el mouse.** Es un aviso genérico del reproductor sin mecanismo de personalización por juego; cambiarlo queda fuera de alcance para no tocar UI compartida sin necesidad funcional.

## Riesgos identificados

- **Doble fuente de pausa (`paused` prop del padre vs. teclas internas) puede desincronizarse.** Mitigación: `onPauseChange` se dispara en todo cambio de pausa originado dentro del motor (teclas o clic en el selector de nivel), y el `useEffect` de `arkanoid-canvas.tsx` que llama `engine.setPaused(paused)` en cada cambio de la prop debe ser idempotente (no reabrir un ciclo si el valor ya coincide). Verificación manual explícita en el paso 6 alternando ambos disparadores.
- **`Audio().play()` puede fallar o quedar en cola si el navegador bloquea autoplay antes de una interacción del usuario.** Mitigación: los sonidos solo se disparan como reacción a eventos de juego (rebote, rotura), que ya ocurren después de que el usuario interactuó con teclado/mouse para empezar a jugar; se ignoran silenciosamente errores de `play()` (promesa rechazada) sin romper el loop del juego.
- **Assets binarios (spritesheet ~30KB, sonidos ~10KB c/u) es la primera vez que el proyecto sirve archivos de este tipo desde `public/`.** Mitigación: sin build step adicional necesario (Next.js sirve `public/` tal cual); verificar en el paso 6 que las rutas `/games/arkanoid/*` cargan en desarrollo y en `npm run build`.
- **El overlay de pausa dibujado dentro del canvas depende de coordenadas de mouse escaladas (`scaleX`/`scaleY` según `getBoundingClientRect`), igual que el original.** Si `.crt-screen` cambia de tamaño responsivamente, un cálculo incorrecto podría desalinear los botones clicables del selector de nivel respecto a lo dibujado. Mitigación: reusar exactamente el mismo cálculo del original, verificado manualmente en el paso 6 en al menos un tamaño de ventana no maximizado.
