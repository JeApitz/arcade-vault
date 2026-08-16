# 07 — Catálogo de juegos desde Supabase (solo ASTEROIDES)

**Estado:** Implementado
**Depende de:** SPEC 06
**Fecha:** 2026-08-16

**Objetivo:** Dejar un único juego en toda la plataforma (ASTEROIDES, el único con datos reales) y hacer que el catálogo que ve la UI (`/`, `/games`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`) salga siempre de la tabla `games` de Supabase, no de los 9 juegos mock de `app/data/games.ts`. Se invierte así la relación de fuente de verdad que estableció SPEC 06.

## Alcance

**Incluye:**

- Migración en Supabase: se borran los 8 juegos mock de `games` (y sus posibles filas de `scores`, defensivo) dejando solo `asteroides`; se agrega una policy `select` pública sobre `games` (RLS estaba habilitado sin ninguna policy, por lo que la tabla era ilegible para `anon`).
- Dos módulos de acceso a datos server-only en `app/lib/`: `games.ts` (`getGames`, `getGame`) y `scores.ts` (`getTopScores`, `getRecentScores`, `getTopPlayers`), usando `app/lib/supabase/server.ts` (antes código muerto, ahora en uso).
- `app/lib/format.ts` con `formatDate`/`timeAgo`, sin dependencias de servidor, para poder importarse tanto desde Server como Client Components.
- Las 5 rutas que antes leían `GAMES`/`seededScores` de `app/data/games.ts` pasan a leer de Supabase: cada una se separa en una page servidor (`async`, hace el fetch) y un componente cliente (interactividad), siguiendo el patrón que ya usaba `app/juegos/[id]/jugar/page.tsx` con `GamePlayer`:
  - `app/games/page.tsx` → `app/games/games-library.tsx`. Los chips de categoría se derivan de los juegos recibidos, no de `CATS`.
  - `app/salon/page.tsx` → `app/salon/hall-of-fame.tsx`. Las pestañas salen de la lista de juegos; se elimina el caso especial `isAsteroides`/`seededScores` — cualquier pestaña consulta `scores` real. Se corrige además el criterio de estados: antes se exigían ≥3 filas para no mostrar "sin datos" (rompía con 1-2 puntajes reales); ahora 0 filas → vacío, 1-2 → tabla sin podio, ≥3 → podio + tabla.
  - `app/page.tsx` → `app/home-content.tsx`. El ticker "ACTIVIDAD EN VIVO" y "TOP JUGADORES" dejan de usar las constantes mock `TICKER`/`TOP_PLAYERS` y pasan a leer `getRecentScores`/`getTopPlayers`, con estado vacío si aún no hay partidas. El copy de features que mencionaba "Arkanoid, Tetris, Snake" se reescribe sin nombrar juegos concretos.
  - `app/juegos/[id]/page.tsx`: `GAMES.find` → `getGame(id)`; leaderboard lateral: `seededScores` → `getTopScores(id, 10)`, con estado vacío.
  - `app/juegos/[id]/jugar/page.tsx`: `GAMES.find` → `getGame(id)`.
- Como el catálogo real solo tiene `asteroides`, cualquier otro id (`/juegos/rocas`, etc.) ahora devuelve **404** en vez de renderizar un juego mock.

**No incluye:**

- Modificar `app/data/games.ts`. Se deja intacto por pedido explícito: sigue en el repo, aporta los tipos `Game`/`ScoreRow` que reutiliza toda la capa de datos nueva, pero sus constantes (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) ya no alimentan ninguna vista.
- Cambiar los valores `best`/`plays` de la fila `asteroides` en `games`: se muestran tal cual están almacenados (63700 / "3.9K"), sin recalcularlos desde `scores`.
- Tocar `game-player.tsx`: su rama mock (`isAsteroids === false`, `DEMO_SCORE`) queda inalcanzable (`getGame` nunca devuelve un juego distinto de `asteroides`), pero no se modifica el motor de juego en este spec.
- Insert/policies de escritura sobre `games` desde la app: el catálogo es de solo lectura para el cliente.
- Auth, moderación de puntajes o rate limiting (fuera de alcance, igual que en SPEC 06).

## Modelo de datos

Sin cambios de esquema respecto a SPEC 06. Solo datos y policies:

```sql
delete from scores where game_id <> 'asteroides';
delete from games  where id      <> 'asteroides';

create policy "Public select" on games
  for select to anon, authenticated using (true);
```

`games` queda con 1 fila (`asteroides`). `scores` sigue teniendo `insert`/`select` públicos de SPEC 06, sin cambios.

## Plan de implementación

1. **Migración de datos y policy.** Vía `mcp__supabase__apply_migration`: borrar los 8 juegos no-`asteroides` de `games` (con `delete from scores` defensivo antes, por la FK) y crear la policy `select` pública en `games` que faltaba desde SPEC 06. Verificado con `select * from games` (1 fila) y `pg_policies`.
2. **Capa de datos.** `app/lib/format.ts` (funciones puras), `app/lib/games.ts` y `app/lib/scores.ts` (usan `createClient` de `app/lib/supabase/server.ts`), reutilizando los tipos `Game`/`ScoreRow` de `app/data/games.ts`.
3. **Migrar las 5 rutas** al patrón page-servidor + componente-cliente descrito arriba, eliminando toda referencia a `GAMES`/`seededScores`/`CATS` fuera de `app/data/games.ts`.
4. **Verificación.** `npm run build` sin errores; recorrido manual de `/`, `/games`, `/juegos/asteroides`, `/juegos/asteroides/jugar`, `/salon`, y confirmación de 404 en `/juegos/rocas`.

## Criterios de aceptación

- [x] La tabla `games` en Supabase tiene una sola fila (`asteroides`) y tiene policy de `select` pública.
- [x] `/`, `/games`, `/salon` muestran únicamente ASTEROIDES; no aparece ningún otro juego ni copy que nombre juegos inexistentes.
- [x] `/juegos/<id-borrado>` devuelve 404 en vez de una página mock.
- [x] El leaderboard de `/juegos/asteroides`, el ticker y "TOP JUGADORES" de la home, y la tabla/podio de `/salon` muestran puntajes reales de `scores`, con estado vacío si no hay filas.
- [x] `app/data/games.ts` no fue modificado.
- [x] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Supabase pasa a ser la fuente de verdad del catálogo; `games.ts` queda como archivo de tipos sin uso en la UI.** Decisión explícita del usuario: "el único juego que debe aparecer es el que tengamos almacenado en nuestras tablas". Se prefirió no borrar `games.ts` para no romper los tipos `Game`/`ScoreRow` que reutiliza toda la nueva capa de datos.
- **Server Components + `createClient` server-side, no el cliente de browser, para leer el catálogo.** Le da su primer uso real a `app/lib/supabase/server.ts` (código muerto hasta ahora) y evita un parpadeo de "cargando" en las páginas de catálogo, que antes no lo tenían al ser mock síncrono.
- **`/salon` deja de tratar a `asteroides` como caso especial.** Con un único juego en la tabla, mantener la rama `isAsteroids`/`seededScores` no tenía sentido; el fetch real se generaliza a cualquier `tab`.
- **Se corrige el umbral de "sin datos" en `/salon` (antes ≥3 filas).** Con datos reales y pocas partidas jugadas, ese umbral escondía puntajes reales detrás del estado vacío; se separa en "sin podio" (1-2 filas) vs. "vacío" (0 filas).
- **IDs fuera del catálogo ahora dan 404.** Antes cualquier id inexistente en `GAMES` ya daba 404 vía `notFound()`; el comportamiento no cambia, pero ahora el conjunto de ids válidos lo define la tabla, no el archivo mock.

## Riesgos identificados

- **`games` es de solo lectura para la app; agregar un juego nuevo requiere una migración manual.** No hay UI de administración del catálogo. Aceptado: coincide con que hoy solo hay un juego jugable.
- **`app/data/games.ts` puede quedar desactualizado respecto a Supabase sin que nada lo note** (tipos correctos, pero las constantes de datos ya no se usan ni se validan contra la tabla). Riesgo bajo mientras no se reintroduzca su uso en la UI.
- **Home y `/juegos/[id]` ahora dependen de Supabase estando disponible.** Antes eran mock puro. Si la consulta falla, `getGames`/`getGame`/`getTopScores` devuelven arreglo/`null` vacíos en vez de lanzar, así que las páginas degradan a "sin juegos"/404 en lugar de romper, pero no hay una página de error dedicada para ese caso.
