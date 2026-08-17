# Plantilla para el spec de un juego

Este archivo es la referencia que consulta el skill `/spec-game` al generar specs de juegos nuevos. Extiende `.claude/skills/spec/template.md` — usa esa misma forma de header, y las mismas reglas globales (una idea por frase, nombres concretos, sin código largo, criterios verificables). Lo que sigue es lo específico de un juego, más un plan de implementación con forma fija.

**No es texto para copiar literal.** Es la forma que debe respetar cada spec de juego.

---

## Header

Igual que la plantilla genérica, en español, con el vocabulario de estados que ya usa este repo:

```markdown
# NN — Juego <Nombre>

**Estado:** Borrador
**Depende de:** SPEC 06, SPEC 07 (o los que apliquen)
**Fecha:** YYYY-MM-DD
**Objetivo:** Una sola frase.
```

---

## Alcance

Igual que la plantilla genérica: dos bloques, `Incluye` / `No incluye`. Además del contenido propio del juego, el bloque `No incluye` debe recoger explícitamente lo que estos specs de juegos suelen dejar fuera salvo decisión contraria del usuario (ver "Fuera de alcance por defecto" más abajo).

---

## Datos del catálogo

Fila concreta que la migración va a insertar en `games` (reutiliza el tipo `Game` de `app/data/games.ts`):

```ts
{
  id: "<id-kebab-case>",       // también es el game_id usado en scores
  title: "<TÍTULO>",
  short: "...",
  long: "...",
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS",
  cover: "cover-<id>",
  color: "cyan" | "magenta" | "yellow" | "green",
  best: 0,
  plays: "0",
}
```

## Contrato del motor

Todos los motores de juego siguen el mismo contrato que `AsteroidsEngine`/`TetrisEngine` (`app/juegos/[id]/jugar/*-engine.ts`). El motor emite sus stats nativas (nombres propios del juego), y el wrapper de React las traduce al contrato genérico de `engines.ts` (`GameStats { score, secondary, level, status }`) con una función `toGameStats`. Describe aquí las stats nativas de este juego y qué representa `secondary`:

```ts
interface <Juego>Stats {
  score: number;
  <campo>: number; // vidas, líneas, combo, lo que use este juego — se mapea a `secondary` en engines.ts
  level: number; // documentar si es siempre 1
  status: "playing" | "dead" | "gameover";
}
```

`<Juego>Engine` expone `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y notifica `onStats` solo en cambios (comparación campo a campo contra el último valor reportado, nunca por frame).

Si el juego introduce datos adicionales fuera de este contrato, documéntalos aquí explícitamente; si no, indica que no hay datos nuevos más allá de este.

### HUD propio (decide uno de estos, o ninguno)

La barra genérica de `game-player.tsx` (Jugador/Puntuación/`hudLabel`/Nivel) siempre está presente. Si la referencia del juego ya traía su propio HUD visible, pórtalo fielmente con uno de estos dos patrones ya establecidos — documenta aquí cuál aplica:

- **HUD en canvas** (patrón `AsteroidsEngine`): métodos privados del motor (`drawHUD`, `drawOverlay`, etc.) que pintan con `ctx.fillText`/trazos directamente sobre el mismo canvas del juego, con `ctx.save()`/`ctx.restore()` para no filtrar estado (`fillStyle`, `font`, `textAlign`) a otras entidades.
- **HUD en DOM** (patrón `tetris-canvas.tsx`): un panel HTML propio dentro del wrapper de React, con estado local (`useState`) alimentado por las stats nativas del motor, y clases CSS dedicadas en `app/globals.css` (ver `.tetris-*` como ejemplo de nomenclatura prefijada por juego, para no colisionar con las clases semánticas compartidas).

Si el HUD en DOM hace que el "stage" (canvas + panel) no sea un simple rectángulo 4:3, define también `crtAspect` (ver más abajo) y el patrón de escalado.

## Relación de aspecto del marco CRT

`GameEngineEntry` en `engines.ts` incluye `crtAspect: string` (ej. `"4 / 3"`, `"4 / 5"`), que `game-player.tsx` pasa como variable CSS `--crt-aspect` al `.crt-screen`. El marco se ajusta solo (`aspect-ratio: var(--crt-aspect, 4 / 3)`) y se centra automáticamente (`margin: 0 auto`) sin importar el ancho de ventana — no hace falta CSS nuevo para esto, solo declarar el valor correcto según la forma real del stage del juego. Si el stage tiene tamaño fijo en píxeles que no llena el marco al 100%/100% (como el tablero+panel de tetris), añade el mismo `ResizeObserver` + `transform: scale(...)` de `tetris-canvas.tsx` para que escale sin desbordar en cualquier tamaño.

---

## Plan de implementación

Siempre en este orden, adaptando nombres de archivo reales al juego (nunca `<id>` literal en el spec final):

1. **Catálogo.** Migración (`mcp__supabase__apply_migration`) con la fila de `games` de arriba, más `.cover-<id>` en `app/globals.css` siguiendo el patrón de una clase existente (`.cover-asteroides`, `.cover-rocas`, etc. — nombra cuál).
2. **Assets** (omitir si no aplica). Copiar de `references/started-games/<carpeta>/assets/` a `public/juegos/<id>/`, listando qué archivos concretos se copian.
3. **Motor.** `app/juegos/[id]/jugar/<id>-engine.ts`. Si el juego tiene HUD propio en canvas (decidido arriba), incluir aquí los métodos de dibujo correspondientes.
4. **Wrapper de React.** `app/juegos/[id]/jugar/<id>-canvas.tsx`. Si el juego tiene HUD propio en DOM, incluir aquí la estructura del panel y su hoja de estilos en `app/globals.css`.
5. **Registro en `engines.ts`.** Agregar la entrada `{ Canvas, hudLabel, initialStats, crtAspect }` al mapa `ENGINES` ya existente. No hay refactor ni migración que hacer — el registry y `asteroides` ya están migrados.
6. **Verificación manual.** Lista concreta de qué se prueba a mano (controles, HUD genérico y propio, pausa, fin, reinicio, guardar puntaje, verlo en `/salon` y en el leaderboard del juego tras recargar, ausencia de listeners/RAF huérfanos al salir, marco CRT centrado y sin desbordes en al menos tres anchos de ventana).
7. **Build.** `npm run build` sin errores.

Cada paso debe dejar el sistema funcional y ser commiteable por separado, igual que exige la plantilla genérica.

---

## Criterios de aceptación

Checklist booleano. Incluye siempre, además de lo específico del juego:

```markdown
- [ ] La fila del juego existe en `games` con su portada (`cover-<id>`) y aparece en `/games` y `/juegos/<id>`.
- [ ] `/juegos/<id>/jugar` renderiza el canvas real del juego (antes de este spec, `engine` es `undefined` para este `id` y el `.crt-screen` queda vacío).
- [ ] El HUD genérico (Puntuación/`hudLabel`/Nivel) refleja el estado real del motor mientras se juega.
- [ ] (Si este spec define HUD propio) el HUD específico del juego, fiel a la referencia, se ve y actualiza correctamente.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` funcionan según lo descrito en Alcance.
- [ ] El marco CRT se ve centrado y sin desbordes en al menos tres anchos de ventana (ancho, tablet, móvil).
- [ ] Guardar el puntaje al terminar la partida lo hace aparecer en `/salon` y en el leaderboard de `/juegos/<id>` tras recargar la página.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

---

## Fuera de alcance por defecto

A menos que el usuario decida explícitamente lo contrario en la Fase 2, cada spec de juego deja fuera lo mismo que ya dejaron fuera los specs anteriores — repítelo en el bloque `No incluye` en vez de asumir que se sobreentiende:

- Controles táctiles (input jugable en móvil). El layout responsivo del marco CRT, el HUD genérico y el aviso "requiere teclado" en pantallas táctiles ya son genéricos y no hace falta rehacerlos — pero jugar desde el móvil sigue sin ser posible salvo que el usuario pida explícitamente añadir controles en pantalla para este juego.
- Autenticación real o verificación de identidad del jugador (el nombre sigue siendo texto libre de iniciales).
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores`.
- Recalcular dinámicamente `best`/`plays` del juego a partir de `scores` — quedan estáticos como se sembraron en el paso 1.
- Deduplicación o límite de puntajes guardados por jugador.
- Sonido/efectos de audio, salvo que el juego de referencia ya los traiga y el usuario pida portarlos explícitamente.

---

## Decisiones y riesgos

Igual que la plantilla genérica. Documenta explícitamente qué patrón de HUD propio se eligió (canvas, DOM, o ninguno) y por qué, y qué `crtAspect` se usó si no es el default `4 / 3`.
