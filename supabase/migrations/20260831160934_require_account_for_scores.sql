-- 17 — Guardar puntaje exige cuenta autenticada.
-- Invierte la decisión del spec 15: sin cuenta no se guarda puntaje, ni en la UI ni en la DB.
-- IRREVERSIBLE: borra el historial de puntajes de invitado (user_id is null).
-- Antes de aplicar en prod, exportar public.scores (ver docs/produccion.md).

-- Borra el historial de invitados (irreversible).
delete from public.scores where user_id is null;

-- Cierra la ruta de inserción anónima.
drop policy if exists "Guest insert" on public.scores;
revoke insert on public.scores from anon;

-- La FK pasa de "on delete set null" a "on delete cascade":
-- borrar una cuenta borra sus puntajes (no puede quedar fila sin cuenta).
alter table public.scores
  drop constraint if exists scores_user_id_fkey,
  add constraint scores_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- Garantía de esquema: ninguna fila sin cuenta.
alter table public.scores alter column user_id set not null;
