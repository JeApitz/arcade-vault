# 15 — Puntajes vinculados a la cuenta autenticada

**Estado:** Aprobado
**Depende de:** SPEC 06, SPEC 14
**Fecha:** 2026-08-26

**Objetivo:** que un puntaje guardado por un usuario autenticado quede ligado a `auth.users.id`, en cualquier juego del catálogo (no solo Asteroides), manteniendo el guardado de invitados, y que la base de datos garantice que nadie pueda atribuirse un puntaje ajeno.

## Contexto

El spec 14 (auth) conectó `/auth` a Supabase Auth de verdad y agregó login inline en el modal de fin de partida de Asteroides, pero dejó explícitamente fuera de alcance cambiar el modelo de datos de `scores`: `player_name` seguía siendo el único campo de identidad, un texto libre editable sin relación con la cuenta que jugó. Esto significa que dos cuentas con el mismo nombre se fusionaban en el ranking (`getTopPlayers` agrupaba por string) y que la política de insert de `scores` era pública sin restricción (`with check (true)`), así que cualquiera con la publishable key podía insertar un puntaje atribuyéndose cualquier nombre.

## Alcance

**Incluye:**

- Columna `scores.user_id uuid references auth.users(id) on delete set null`, nullable.
- El guardado de puntaje (`app/juegos/[id]/jugar/game-player.tsx`) adjunta `user_id` con el id de la sesión activa (`supabase.auth.getUser()`), o `null` si es invitado, para **todos los juegos del catálogo**, no solo Asteroides. El tracking de sesión y el login/registro inline del modal de fin de partida dejan de estar condicionados a `game.id === "asteroides"`. Como el login inline ahora aplica a todos los juegos, el formulario incluye un botón `GUARDAR COMO INVITADO` que omite el login y vuelve al input de nombre libre existente, preservando el guardado sin cuenta.
- RLS de `scores` reemplaza el insert público único por dos políticas: `anon` solo puede insertar con `user_id is null`; `authenticated` solo puede insertar con `user_id = auth.uid()`. Ninguna cuenta puede atribuirse un puntaje con el `user_id` de otra.
- `getTopPlayers` (`app/lib/scores.ts`) agrupa por `user_id` (con fallback a `player_name` para invitados) en vez de por el string del nombre, así dos cuentas con el mismo nombre ya no se fusionan.
- El salón de la fama (`app/salon/hall-of-fame.tsx`) y `getTopScores` muestran un distintivo (`◆`, `title="Cuenta registrada"`) junto al nombre de las filas con `user_id` no nulo.

**No incluye:**

- Vincular históricamente los puntajes ya guardados por invitados/nombres libres con una cuenta real (las filas previas a esta migración quedan con `user_id = null`).
- Tabla `profiles`, unicidad de `username`, edición de perfil — sigue fuera de alcance, igual que en spec 14.
- Cambiar `player_name` a inmutable o a un valor derivado del username: sigue siendo texto libre editable, precargado con el username de la cuenta (comportamiento de spec 14 sin cambios).
- Rate limiting o captcha sobre el insert.

## Modelo de datos

Migración `add_user_id_to_scores`:

```sql
alter table public.scores
  add column user_id uuid references auth.users(id) on delete set null;

create index scores_user_id_idx on public.scores (user_id);

drop policy "Public insert" on public.scores;

create policy "Guest insert" on public.scores
  for insert to anon
  with check (user_id is null);

create policy "Own insert" on public.scores
  for insert to authenticated
  with check (user_id = auth.uid());
```

La política `"Public select"` (lectura anónima) no cambia: el salón de la fama sigue siendo público.

## Decisiones tomadas

- **`user_id` nullable** en vez de `not null`: se acepta seguir permitiendo guardado de invitados sin cuenta, como en spec 06/14. Decisión explícita del usuario.
- **Alcance ampliado a todos los juegos** en vez de mantenerlo solo en Asteroides: se quita la condición `isAsteroids` del tracking de sesión y del login inline en `game-player.tsx`. Decisión explícita del usuario.
- **RLS con `auth.uid()`** en vez de dejar el insert público sin restricción: cierra el riesgo que spec 06 ya documentaba (insert público permite spam/suplantación). Decisión explícita del usuario.
- **`on delete set null`** en vez de `on delete cascade`: borrar una cuenta no borra su historial de puntajes del ranking, solo lo desvincula.

## Riesgos identificados

| Riesgo                                                                                                                                               | Mitigación                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Los puntajes históricos (anteriores a esta migración) quedan sin vincular a ninguna cuenta, aunque el jugador tenga una.                             | Aceptado explícitamente; fuera de alcance de este spec.                                                                   |
| `player_name` sigue sin ser único ni inmutable, así que el distintivo de "cuenta registrada" es la única señal confiable de identidad real en la UI. | Documentado; una mejora futura podría ocultar/reemplazar `player_name` por el username de la cuenta cuando hay `user_id`. |

## Verificación

- `npm run build` y `npm run lint` sin errores nuevos.
- `pg_policies` sobre `scores` muestra `Guest insert` (anon, `user_id is null`) y `Own insert` (authenticated, `user_id = auth.uid()`).
- Un insert anónimo simulando un `user_id` ajeno es rechazado por RLS.
- Flujo end-to-end: login real → jugar un juego distinto de Asteroides → guardar puntaje → la fila en `scores` trae el `user_id` correcto (verificado con join a `auth.users`); como invitado, la fila queda con `user_id = null`; el salón de la fama muestra el distintivo solo en las filas con cuenta.
