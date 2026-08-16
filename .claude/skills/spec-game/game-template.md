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

Todos los motores de juego siguen el mismo contrato que `AsteroidsEngine` (`app/juegos/[id]/jugar/asteroids-engine.ts`). Describe aquí solo las diferencias específicas de este juego (qué representa cada campo, si `lives`/`level` no aplican y qué los reemplaza):

```ts
interface <Juego>Stats {
  score: number;
  lives: number; // fijo en 0/1 si el juego no tiene vidas — no se omite el campo, se documenta el valor fijo
  level: number; // igual, documentar si es siempre 1
  status: "playing" | "dead" | "gameover";
}
```

`<Juego>Engine` expone `start()`, `destroy()` (idempotente), `setPaused(paused)`, `forceGameOver()`, y notifica `onStats` solo en cambios.

Si el juego introduce datos adicionales fuera de este contrato, documéntalos aquí explícitamente; si no, indica que no hay datos nuevos más allá de este.

---

## Plan de implementación

Siempre en este orden, adaptando nombres de archivo reales al juego (nunca `<id>` literal en el spec final):

1. **Catálogo.** Migración (`mcp__supabase__apply_migration`) con la fila de `games` de arriba, más `.cover-<id>` en `app/globals.css` siguiendo el patrón de una clase existente (`.cover-asteroides`, `.cover-rocas`, etc. — nombra cuál).
2. **Assets** (omitir si no aplica). Copiar de `references/started-games/<carpeta>/assets/` a `public/juegos/<id>/`, listando qué archivos concretos se copian.
3. **Motor.** `app/juegos/[id]/jugar/<id>-engine.ts`.
4. **Wrapper de React.** `app/juegos/[id]/jugar/<id>-canvas.tsx`.
5. **Registro en `game-player.tsx`.** Indicar explícitamente si este spec crea el registry (`engines.ts`) por primera vez —y en ese caso incluir la migración de `asteroides` a él, eliminando el `if` hardcodeado y las constantes `DEMO_*`— o si solo agrega una entrada a un registry ya existente.
6. **Verificación manual.** Lista concreta de qué se prueba a mano (controles, HUD, pausa, fin, reinicio, guardar puntaje, verlo en `/salon` y en el leaderboard del juego tras recargar, ausencia de listeners/RAF huérfanos al salir).
7. **Build.** `npm run build` sin errores.

Cada paso debe dejar el sistema funcional y ser commiteable por separado, igual que exige la plantilla genérica.

---

## Criterios de aceptación

Checklist booleano. Incluye siempre, además de lo específico del juego:

```markdown
- [ ] La fila del juego existe en `games` con su portada (`cover-<id>`) y aparece en `/games` y `/juegos/<id>`.
- [ ] `/juegos/<id>/jugar` renderiza el canvas real del juego, no el `.game-arena` mock.
- [ ] El HUD (Puntuación/Vidas/Nivel, o su equivalente documentado arriba) refleja el estado real del motor mientras se juega.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` funcionan según lo descrito en Alcance.
- [ ] Guardar el puntaje al terminar la partida lo hace aparecer en `/salon` y en el leaderboard de `/juegos/<id>` tras recargar la página.
- [ ] (Si este spec crea o toca el registry) ASTEROIDES sigue jugándose igual que antes tras el refactor.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

---

## Fuera de alcance por defecto

A menos que el usuario decida explícitamente lo contrario en la Fase 2, cada spec de juego deja fuera lo mismo que ya dejaron fuera los specs anteriores — repítelo en el bloque `No incluye` en vez de asumir que se sobreentiende:

- Controles táctiles / adaptación mobile.
- Autenticación real o verificación de identidad del jugador (el nombre sigue siendo texto libre de iniciales).
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores`.
- Recalcular dinámicamente `best`/`plays` del juego a partir de `scores` — quedan estáticos como se sembraron en el paso 1.
- Deduplicación o límite de puntajes guardados por jugador.
- Sonido/efectos de audio, salvo que el juego de referencia ya los traiga y el usuario pida portarlos explícitamente.

---

## Decisiones y riesgos

Igual que la plantilla genérica. Si este spec crea el registry de motores por primera vez, documenta esa decisión explícitamente (por qué se generaliza ahora y no antes: porque aparece el segundo juego real que lo justifica).
