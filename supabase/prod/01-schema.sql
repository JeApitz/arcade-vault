-- Arcade Vault — esquema de producción (estado final de dev, no la secuencia histórica).
-- Idempotente: se puede re-ejecutar sin error. Pegar en el SQL Editor de PROD.
-- Orden: 01-schema -> 02-seed-games -> 03-hardening -> 04-verificacion.

-- ── Tabla: games ───────────────────────────────────────────────────────────────
create table if not exists public.games (
  id     text primary key,
  title  text not null,
  short  text not null,
  long   text not null,
  cat    text not null,
  cover  text not null,
  color  text not null,
  best   integer not null,
  plays  text not null
);

-- ── Tabla: scores ──────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games(id),
  player_name text not null,
  score       integer not null,
  created_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Guardar un puntaje exige cuenta autenticada (spec 17). Idempotente para
-- instalaciones previas donde user_id era nullable / la FK era on delete set null.
alter table public.scores
  drop constraint if exists scores_user_id_fkey,
  add constraint scores_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.scores alter column user_id set not null;

create index if not exists scores_user_id_idx on public.scores (user_id);

-- ── RLS ────────────────────────────────────────────────────────────────────────
alter table public.games  enable row level security;
alter table public.scores enable row level security;

drop policy if exists "Public select" on public.games;
create policy "Public select" on public.games
  for select to anon, authenticated using (true);

drop policy if exists "Public select" on public.scores;
create policy "Public select" on public.scores
  for select to anon, authenticated using (true);

-- Sin política de inserción anónima: un invitado no puede guardar puntaje (spec 17).
drop policy if exists "Guest insert" on public.scores;

drop policy if exists "Own insert" on public.scores;
create policy "Own insert" on public.scores
  for insert to authenticated with check (user_id = auth.uid());

-- Sin políticas UPDATE/DELETE: nadie puede modificar ni borrar filas (intencional).
