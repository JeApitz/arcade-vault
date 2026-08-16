# 06 — Leaderboard y tabla de juegos en Supabase

**Estado:** Implementado
**Depende de:** SPEC 04, SPEC 05
**Fecha:** 2026-08-15

**Objetivo:** Persistir en Supabase los puntajes reales de ASTEROIDES (única partida jugable hoy) en una tabla `scores`, con una tabla `games` que espeja el catálogo para relacionarlos por FK, y conectar el modal de fin de partida y `/salon` a esos datos reales.

## Alcance

**Incluye:**

- Tabla `games` en Supabase, espejo de `app/data/games.ts` (columnas: `id`, `title`, `short`, `long`, `cat`, `cover`, `color`, `best`, `plays`), sembrada por migración con las 9 entradas actuales del array `GAMES`. Solo sirve como destino de la FK de `scores`; el catálogo (`/games`, `/juegos/[id]`) sigue leyendo de `games.ts` como hoy, sin tocarlo.
- Tabla `scores` en Supabase (`id`, `game_id` FK a `games.id`, `player_name`, `score`, `created_at`), con una fila por cada partida guardada (sin deduplicar por jugador, sin límite de filas).
- Políticas RLS en `scores`: `insert` público (cualquiera puede guardar un puntaje) y `select` público (cualquiera puede leer para el leaderboard). Sin `update` ni `delete` públicos.
- En `game-player.tsx`, cuando `game.id === "asteroides"`, el botón `GUARDAR PUNTUACIÓN` del modal de fin inserta una fila real en `scores` (`game_id: "asteroides"`, `player_name: name`, `score`) usando el cliente de browser (`app/lib/supabase/client.ts`). Para el resto de juegos (mock), el botón sigue siendo visual como hoy, sin insertar nada.
- Manejo de estado del insert: mientras se guarda, deshabilitar el botón y mostrar un estado de carga; si falla, mostrar un mensaje de error y permitir reintentar (no se queda en `saved` si el insert falló).
- En `/salon`, cuando la pestaña activa es ASTEROIDES, la tabla y el podio muestran los top 12 registros reales de `scores` (ordenados por `score` descendente), reemplazando `seededScores`. El resto de pestañas (los demás juegos del catálogo) sigue usando `seededScores` exactamente como hoy.
- Estados de carga y de "sin datos" en `/salon` para la pestaña de ASTEROIDES: mientras se hace fetch, un estado de carga; si aún no hay ningún score guardado, un estado vacío en vez de podio/tabla rotos (sin asumir que siempre hay al menos 3 filas como asume hoy el mock).

**No incluye (fuera de alcance de este spec):**

- Leaderboard real para juegos distintos de ASTEROIDES. Siguen siendo reproductor mock con `DEMO_SCORE` fijo; no se les agrega inserción ni lectura real.
- Autenticación real. El `player_name` es texto libre tomado del input de iniciales ya existente (máx. 10 caracteres, mayúsculas), sin cuenta ni login, igual que un arcade clásico. `/auth` sigue siendo mock.
- Actualizar dinámicamente el campo `best` de `games.ts`/de la entrada ASTEROIDES en `/games` y `/juegos/asteroides` con el máximo real de `scores`. Ese número queda estático como hoy (63700); no se lee de Supabase.
- Migrar el catálogo completo (`/games`, `/juegos/[id]`) a leer desde la tabla `games` de Supabase. Esa tabla existe solo como destino de la FK de `scores`, `games.ts` sigue siendo la fuente de verdad de la UI del catálogo.
- Deduplicación o límite de puntajes por jugador (upsert de mejor score). Se guarda una fila por cada vez que se presiona `GUARDAR PUNTUACIÓN`.
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público. Queda documentado como riesgo conocido.
- Borrado o edición de puntajes guardados (no hay UI de moderación).

## Modelo de datos

```sql
create table games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null,
  cover text not null,
  color text not null,
  best integer not null,
  plays text not null
);

create table scores (
  id bigint generated always as identity primary key,
  game_id text not null references games(id),
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);
```

`games` se siembra una sola vez, por migración, con las 9 entradas de `GAMES` en `app/data/games.ts` (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `asteroides`, `ranaria`, `duelo-pixel`). No se vuelve a escribir desde la app.

`scores` solo recibe filas con `game_id: "asteroides"` en este spec (el código no impide otros `game_id`, pero ninguna UI actual los genera).

Lectura en `/salon` para ASTEROIDES: `select player_name, score, created_at from scores where game_id = 'asteroides' order by score desc limit 12`, mapeado a la misma forma que `ScoreRow` (`rank` calculado en el cliente por posición, `date` formateada `dd/mm/aaaa` desde `created_at`).

## Plan de implementación

1. **Migración de esquema.** Vía `mcp__supabase__apply_migration`, crear las tablas `games` y `scores`, sembrar `games` con las 9 entradas actuales de `GAMES`, y habilitar RLS en `scores` con policy de `insert` público y policy de `select` público (sin `update`/`delete` públicos). Confirmar con `mcp__supabase__list_tables` que ambas tablas existen con las columnas esperadas.
2. **Insert real desde el modal de fin.** En `game-player.tsx`, cuando `isAsteroids`, reemplazar el `onClick` mock de `GUARDAR PUNTUACIÓN` por un insert real a `scores` con `app/lib/supabase/client.ts` (`game_id: "asteroides"`, `player_name: name`, `score`). Agregar estado de carga (`saving`) y de error (`saveError`) junto a los ya existentes `saved`/`name`; en error, mostrar un mensaje y no marcar `saved`. El resto de juegos sigue con el botón mock sin cambios.
3. **Lectura real en `/salon`.** Convertir el fetch de la pestaña ASTEROIDES a una consulta real a `scores` (top 12 por `score`) con el cliente de browser, disparada en un efecto cuando `tab === "asteroides"`, con estado de carga y estado vacío (sin scores todavía) que reemplacen el podio/tabla cuando no hay al menos 3 filas. Las demás pestañas siguen usando `seededScores` sin cambios.
4. **Verificación manual.** `npm run dev`: jugar una partida de `/juegos/asteroides/jugar`, terminarla, guardar con unas iniciales y confirmar el toast de guardado; ir a `/salon`, pestaña ASTEROIDES, y confirmar que la partida recién guardada aparece en la tabla/podio con el nombre y score correctos; recargar la página y confirmar que persiste (viene de Supabase, no de estado local); probar la pestaña ASTEROIDES antes de tener ningún score guardado (o con `delete from scores` de prueba) para ver el estado vacío; confirmar que las demás pestañas de `/salon` y el resto de juegos del catálogo siguen mostrando datos mock exactamente como antes.
5. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas.

## Criterios de aceptación

- [x] Las tablas `games` (9 filas sembradas) y `scores` (vacía, con FK a `games.id`) existen en el proyecto de Supabase.
- [x] `scores` tiene RLS habilitado, con `insert` y `select` públicos, sin `update` ni `delete` públicos.
- [x] Jugar una partida de ASTEROIDES hasta game over, escribir iniciales y presionar `GUARDAR PUNTUACIÓN` inserta una fila real en `scores` con el `player_name` y `score` correctos.
- [x] Mientras el insert está en curso, el botón `GUARDAR PUNTUACIÓN` muestra un estado de carga y no permite doble click; si el insert falla, se muestra un error y no se marca como guardado.
- [x] `/salon`, pestaña ASTEROIDES, muestra los puntajes reales de `scores` (top 12 por score), incluyendo partidas recién guardadas tras recargar la página.
- [x] `/salon`, pestaña ASTEROIDES, sin ningún score guardado en la tabla, muestra un estado vacío en vez de romperse por falta de datos en el podio.
- [x] `/salon` para el resto de juegos (`caida`, `rocas`, etc.) sigue mostrando `seededScores` exactamente igual que antes, sin llamadas a Supabase.
- [x] El modal de fin de partida del resto de juegos (mock) sigue siendo visual, sin insertar nada en `scores`.
- [x] El campo `best` mostrado en `/games` y `/juegos/asteroides` sigue siendo el valor estático de `games.ts` (63700), sin leer de Supabase.
- [x] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Leaderboard real solo para ASTEROIDES.** Decisión explícita del usuario: es el único juego con score real; para el resto seguiría siendo siempre el mismo `DEMO_SCORE`, sin valor real.
- **Tabla `games` como espejo, no como fuente de verdad de la UI.** El catálogo (`/games`, `/juegos/[id]`) sigue leyendo de `games.ts`. La tabla `games` solo existe para que `scores.game_id` tenga una FK válida y para dejar la base lista si un spec futuro decide migrar el catálogo completo a Supabase.
- **Identidad de jugador: nombre libre sin cuenta.** Como SPEC 04 dejó auth real fuera de alcance, se reutiliza el input de iniciales que ya existe en el modal de fin, igual que un arcade clásico. No hay verificación de identidad.
- **Insert directo desde el cliente (browser), sin Route Handler intermedio.** Se prioriza simplicidad para este spec: el cliente de browser (`client.ts`) inserta directo a `scores` bajo una policy RLS de insert público. Se documenta como riesgo (ver abajo) en vez de agregar una capa server-side todavía.
- **Sin límite de puntajes ni deduplicación por jugador.** Se guarda una fila por cada partida guardada, sin upsert de "mejor score por nombre". Simplifica el modelo; si se vuelve un problema de volumen, se revisa en un spec futuro.
- **`best` de `games.ts` queda estático, sin leer el máximo real de `scores`.** Mismo criterio que SPEC 05: no se generaliza el patrón de leer stats reales en el catálogo todavía.

## Riesgos identificados

- **Insert público sin autenticación permite spam de puntajes falsos.** Cualquiera con la clave pública puede insertar filas arbitrarias en `scores` (scores absurdos, nombres ofensivos). Mitigación: ninguna en este spec (documentado como conocido); un spec futuro de auth/moderación podría restringir el insert o agregar validación server-side.
- **`/salon` para ASTEROIDES pasa de síncrono (mock en memoria) a asíncrono (fetch a Supabase).** Si la consulta falla (red, RLS mal configurada), la pestaña no debe romper el resto de la página; debe degradar a un estado de error/vacío sin afectar las demás pestañas mock.
- **Volumen de filas en `scores` sin límite de escritura.** Con partidas repetidas, la tabla crece indefinidamente. No es un problema funcional para este spec (se lee `limit 12` ordenado por score), pero es un costo de almacenamiento a futuro sin política de limpieza.
