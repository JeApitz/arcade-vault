# 17 — Guardar puntaje exige cuenta autenticada

**Estado:** Implementado
**Depende de:** SPEC 14, SPEC 15, SPEC 16
**Fecha:** 2026-08-31

**Objetivo:** que guardar un puntaje exija una cuenta autenticada (registro o login), preservando el puntaje del invitado en `localStorage` mientras completa el registro o inicia sesión.

## Contexto

El spec 15 dejó el guardado de invitados vivo por decisión explícita: `scores.user_id` es nullable, la política RLS `Guest insert` permite a `anon` insertar con `user_id is null`, y el modal de fin de partida (`app/juegos/[id]/jugar/game-player.tsx`) tiene un botón `GUARDAR COMO INVITADO` (estado `skipAuth`) que omite el login y guarda con nombre libre.

Este spec invierte esa decisión: sin cuenta no se guarda puntaje, ni desde la UI ni a nivel de base de datos. El invitado que juega y quiere guardar debe registrarse o iniciar sesión. Como Supabase exige confirmar el email antes del primer login (spec 14), el puntaje obtenido se guarda temporalmente en `localStorage` y se ofrece guardarlo cuando el usuario vuelve con sesión activa a la página de jugar de ese juego.

## Alcance

**Incluye:**

- Migración `require_account_for_scores`:
  - `delete from public.scores where user_id is null;` (borra el historial de invitados; irreversible).
  - `drop policy if exists "Guest insert" on public.scores;`
  - `revoke insert on public.scores from anon;` (mantiene `select` para `anon`: el salón sigue siendo público).
  - Recrear la FK `scores.user_id` como `on delete cascade` en vez de `on delete set null`.
  - `alter table public.scores alter column user_id set not null;`
  - SQL idempotente donde sea razonable. Se aplica a dev con `mcp__supabase__apply_migration` y el `.sql` queda en `supabase/migrations/` para replicar en prod (`docs/produccion.md`).
- `app/juegos/[id]/jugar/game-player.tsx`:
  - Se elimina el botón `GUARDAR COMO INVITADO` y el estado `skipAuth`.
  - En su lugar, un botón `SEGUIR SIN GUARDAR` que oculta el formulario de auth y deja visibles las acciones del modal (`VER RANKING`, `JUGAR DE NUEVO`, `VOLVER AL VAULT`) sin insertar nada.
  - Sin sesión, el input de nombre + `GUARDAR PUNTUACIÓN` deja de ser alcanzable: el modal solo ofrece el formulario de login/registro inline o `SEGUIR SIN GUARDAR`.
  - Con sesión, el flujo actual no cambia: input de nombre precargado con el username, editable, y `GUARDAR PUNTUACIÓN`.
- Módulo nuevo `app/lib/pending-score.ts` (lógica pura sobre `localStorage`, sin dependencias):
  - `savePending(gameId, score)`, `readPending(gameId)`, `clearPending(gameId)`.
  - Clave `av:pending-score:v1`, un registro por `game_id`.
  - TTL de 7 días: al leer un registro vencido se descarta y se devuelve `null`.
  - Si ya hay un pendiente para ese juego, se conserva el de mayor `score`.
  - Todo acceso a `localStorage` envuelto en `try/catch` (navegador con storage bloqueado → no persiste, no rompe).
- Persistencia al registrarse desde el modal: cuando el registro inline pasa al estado "revisa tu correo" (`authCheckEmail`), se llama a `savePending(game.id, score)` y el texto explica que el puntaje se guardará al iniciar sesión.
- Rescate del pendiente: al montar `/juegos/[id]/jugar` con sesión activa y un pendiente vigente de ese juego, se muestra un aviso con un botón `GUARDAR PUNTAJE PENDIENTE` que inserta la fila (`user_id` de la sesión, `player_name` = username) y llama a `clearPending(game.id)`.
- Limpieza de la ruta de invitado que queda muerta:
  - `getTopPlayers` (`app/lib/scores.ts`) deja de necesitar el fallback `guest:${player_name}`; agrupa solo por `user_id`.
  - Se retira el distintivo `◆` "Cuenta registrada" del salón: `RegisteredBadge` y sus usos en `app/salon/hall-of-fame.tsx`, el campo `registered` de `getTopScores` (`app/lib/scores.ts`) y de `ScoreRow` (`app/data/games.ts`). Tras borrar las filas de invitado, todas las filas serían de cuenta y el distintivo deja de distinguir nada.
- Actualización de la baseline de prod: `supabase/prod/01-schema.sql` (sin `Guest insert`, `user_id ... not null`, FK `on delete cascade`) y `supabase/prod/03-hardening.sql` (sin `insert` para `anon` sobre `scores`).

**No incluye:**

- Recuperar o vincular a una cuenta los puntajes de invitado borrados por la migración.
- Tabla `profiles`, unicidad de `username`, edición de perfil (sigue fuera de alcance, igual que spec 14/15).
- `player_name` inmutable o forzado al username: sigue siendo texto libre editable precargado con el username.
- Rate limiting o captcha sobre el insert de `scores`.
- Sincronizar el puntaje pendiente entre dispositivos o navegadores: vive solo en el `localStorage` del navegador donde se jugó.
- Cambios a la tabla `games` o a sus políticas.
- Guardar el pendiente automáticamente al volver con sesión: el usuario confirma con el botón `GUARDAR PUNTAJE PENDIENTE`.

## Modelo de datos

Migración `require_account_for_scores`:

```sql
delete from public.scores where user_id is null;

drop policy if exists "Guest insert" on public.scores;

revoke insert on public.scores from anon;

alter table public.scores
  drop constraint if exists scores_user_id_fkey,
  add constraint scores_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.scores alter column user_id set not null;
```

La política `"Public select"` (lectura anónima) y `"Own insert"` (`authenticated`, `user_id = auth.uid()`) no cambian.

Registro en `localStorage` bajo la clave `av:pending-score:v1`:

```ts
// mapa game_id -> pendiente
type PendingScores = Record<string, { score: number; savedAt: number }>; // savedAt = Date.now()
// TTL: 7 días => 7 * 24 * 60 * 60 * 1000 ms
```

## Plan de implementación

1. **Migración.** Crear `supabase/migrations/<timestamp>_require_account_for_scores.sql` con el SQL de arriba. Aplicarlo a dev con `mcp__supabase__apply_migration`. Verificar con `execute_sql` (solo lectura): no quedan filas con `user_id is null`, `information_schema.columns` muestra `is_nullable = 'NO'` para `scores.user_id`, y `pg_policies` sobre `scores` ya no lista `Guest insert`.
2. **Helper de pendiente.** Crear `app/lib/pending-score.ts` con `savePending`, `readPending`, `clearPending`. Sin dependencias, todo en `try/catch`.
3. **Modal sin ruta de invitado.** En `game-player.tsx`, quitar `skipAuth` y el botón `GUARDAR COMO INVITADO`; agregar `SEGUIR SIN GUARDAR` que oculta el formulario de auth. Verificar manualmente que sin sesión no hay forma de llegar al input de nombre.
4. **Persistir pendiente al registrarse.** En el flujo `signUp` del modal, tras marcar `authCheckEmail`, llamar `savePending(game.id, score)` y ajustar el texto informativo.
5. **Rescate al montar.** En `game-player.tsx`, al montar con sesión activa, leer `readPending(game.id)`; si hay pendiente, mostrar el aviso con `GUARDAR PUNTAJE PENDIENTE` que hace el insert y `clearPending(game.id)`.
6. **Limpieza de código muerto.** Simplificar `getTopPlayers`; retirar `registered` y `RegisteredBadge` de `scores.ts`, `data/games.ts` y `hall-of-fame.tsx`.
7. **Baseline de prod + verificación.** Actualizar `supabase/prod/01-schema.sql` y `03-hardening.sql`. Correr `npm run build` y `npm run lint`.

## Criterios de aceptación

- [ ] Un insert desde el cliente anónimo (publishable key, sin sesión) sobre `scores` es rechazado (sin `Guest insert` y sin `grant insert` para `anon`).
- [ ] `select count(*) from public.scores where user_id is null` devuelve 0 tras la migración.
- [ ] `scores.user_id` es `not null` y su FK es `on delete cascade`.
- [ ] En el modal de fin de partida sin sesión, no existe ningún control que inserte un puntaje: solo el formulario de login/registro o `SEGUIR SIN GUARDAR`.
- [ ] `SEGUIR SIN GUARDAR` cierra el formulario y no inserta ninguna fila en `scores`.
- [ ] Registrarse desde el modal guarda el puntaje en `localStorage` bajo `av:pending-score:v1` para ese `game_id`.
- [ ] Volver a `/juegos/<id>/jugar` con sesión activa y un pendiente vigente muestra el aviso `GUARDAR PUNTAJE PENDIENTE`; al pulsarlo, la fila aparece en `scores` con el `user_id` correcto y la clave del pendiente se limpia.
- [ ] Un pendiente con `savedAt` de más de 7 días se descarta al leerlo y no se ofrece guardar.
- [ ] Con sesión activa, guardar un puntaje desde el modal funciona igual que antes (nombre precargado con el username, editable).
- [ ] El salón de la fama ya no muestra el distintivo `◆` en ninguna fila.
- [ ] `npm run build` y `npm run lint` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** bloqueo en UI + RLS, no solo en la UI. Decisión explícita del usuario; cierra el bypass con la publishable key que spec 06/15 dejaban abierto.
- **Sí:** borrar las filas históricas con `user_id is null` (`delete`). Decisión explícita del usuario; ranking limpio a cambio de pérdida irreversible del historial de invitados.
- **Sí:** `scores.user_id` pasa a `not null` y la FK a `on delete cascade`. Decisión explícita del usuario; garantía a nivel de esquema de que ninguna fila existe sin cuenta. Se acepta que borrar una cuenta borre su historial de puntajes.
- **Sí:** puntaje pendiente en `localStorage`, rescatable desde la página de jugar del juego. Decisión explícita del usuario; evita perder el puntaje mientras el usuario confirma el email.
- **Sí:** un pendiente por juego, TTL de 7 días, se conserva el de mayor score. Decisión explícita del usuario.
- **Sí:** `player_name` sigue siendo texto libre editable precargado con el username. Decisión explícita del usuario; sin cambios respecto a spec 14/15.
- **Sí:** botón `SEGUIR SIN GUARDAR` como salida del invitado. Decisión explícita del usuario; reemplaza a `GUARDAR COMO INVITADO`.
- **Sí:** retirar el distintivo `◆` del salón. Decisión explícita del usuario; sin invitados marcaría todas las filas y deja de ser información.
- **No:** guardar el pendiente automáticamente al volver con sesión. El usuario confirma con un botón para no insertar puntajes viejos sin querer.
- **No:** rate limiting / captcha sobre el insert. Fuera de alcance, igual que en spec 15/16.

## Riesgos identificados

| Riesgo                                                                                                                             | Mitigación                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| El `delete from scores where user_id is null` es irreversible y borra todo el historial de invitados.                              | Exportar la tabla `scores` antes de aplicar la migración, tanto en dev como en prod (el usuario, al pegar el `.sql`). Documentado en el PR. |
| El puntaje pendiente vive solo en el navegador donde se jugó; si el usuario confirma el email en otro dispositivo, no lo recupera. | Aceptado explícitamente; el texto del modal aclara que debe volver e iniciar sesión en el mismo navegador.                                  |
| `on delete cascade`: borrar una cuenta borra sus puntajes del ranking.                                                             | Decisión explícita; la app no expone "eliminar cuenta" (fuera de alcance desde spec 14).                                                    |
| Prod requiere aplicar el `.sql` a mano (sin acceso MCP).                                                                           | Flujo estándar del proyecto (`docs/produccion.md`); el `.sql` es idempotente y queda commiteado.                                            |
| Un usuario con `localStorage` deshabilitado no puede usar el guardado diferido tras registrarse.                                   | El helper degrada sin romper; el puntaje simplemente no se preserva, igual que hoy para un invitado que cierra la pestaña.                  |

## Lo que **no** está en este spec

- Recuperar o vincular a una cuenta los puntajes de invitado borrados.
- Tabla `profiles`, unicidad de username, edición de perfil.
- `player_name` inmutable o derivado del username.
- Rate limiting / captcha sobre `scores`.
- Sincronización del puntaje pendiente entre dispositivos.
- Cambios a `games` o a sus políticas.

Cada uno, si se necesita, va en su propio spec futuro.
