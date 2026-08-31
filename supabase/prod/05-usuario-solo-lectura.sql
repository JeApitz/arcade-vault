-- Arcade Vault — usuario de SOLO LECTURA para PROD (acceso por pooler / Supavisor).
-- Pegar en el SQL Editor de PROD. Idempotente: se puede re-ejecutar sin error.
--
-- Objetivo: un rol de Postgres propio, con su propio password, que pueda leer
-- public.games y public.scores por el pooler y NADA MÁS. No es superusuario, no
-- puede escribir, no ve el esquema auth (usuarios) ni vault (secretos).
--
-- ⚠️ ANTES DE EJECUTAR: sustituir el placeholder <<CAMBIAR_ESTE_PASSWORD>> (linea 24)
--    por un password fuerte y propio de este rol. NO es el password del rol `postgres`
--    de Supabase. Este archivo NO debe subirse al repo con el password real dentro:
--    dejar el placeholder al commitear (ver docs/produccion.md > "Datos sensibles").
--
-- Orden en el runbook: 01-schema -> 02-seed-games -> 03-hardening -> 04-verificacion -> 05 (este).

-- ── 1. Rol ─────────────────────────────────────────────────────────────────────
-- NOTA: en Supabase el rol `postgres` NO es superusuario, y Postgres rechaza
-- cualquier CREATE/ALTER ROLE que mencione `nosuperuser` o `noreplication` de
-- forma explícita (error 42501). Por eso solo se listan atributos "seguros";
-- superuser/replication ya son `false` por defecto.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'arcade_readonly') then
    create role arcade_readonly
      login
      password '<<CAMBIAR_ESTE_PASSWORD>>'
      nocreatedb nocreaterole noinherit
      connection limit 5;
  end if;
end
$$;

-- Reafirma atributos seguros aunque el rol ya existiera (no re-setea el password).
alter role arcade_readonly with login nocreatedb nocreaterole noinherit connection limit 5;

-- Si el rol ya existía y quieres (re)fijar el password, descomenta:
-- alter role arcade_readonly with password '<<CAMBIAR_ESTE_PASSWORD>>';

-- ── 2. Solo lectura y límites a nivel de sesión (cinturón, además de los grants) ─
alter role arcade_readonly set default_transaction_read_only = on;
alter role arcade_readonly set statement_timeout = '30s';
alter role arcade_readonly set idle_in_transaction_session_timeout = '60s';
alter role arcade_readonly set search_path = public;

-- ── 3. Lectura efectiva pese a RLS: BYPASSRLS, con fallback a políticas ─────────
-- `alter role ... bypassrls` exige superusuario. En Supabase el SQL Editor corre
-- como `postgres` (NO superusuario), así que normalmente entra el fallback.
do $$
begin
  begin
    alter role arcade_readonly bypassrls;
    raise notice 'arcade_readonly: BYPASSRLS concedido.';
  exception
    when others then
      raise notice 'arcade_readonly: sin BYPASSRLS (%). Creando políticas SELECT.', sqlerrm;

      drop policy if exists "arcade_readonly select" on public.games;
      create policy "arcade_readonly select" on public.games
        for select to arcade_readonly using (true);

      drop policy if exists "arcade_readonly select" on public.scores;
      create policy "arcade_readonly select" on public.scores
        for select to arcade_readonly using (true);
  end;
end
$$;

-- ── 4. Grants mínimos ──────────────────────────────────────────────────────────
grant connect on database postgres to arcade_readonly;
grant usage on schema public to arcade_readonly;
grant select on all tables in schema public to arcade_readonly;

-- Tablas futuras creadas por `postgres` en public quedan legibles automáticamente.
alter default privileges in schema public
  grant select on tables to arcade_readonly;

-- NO se concede usage sobre auth / storage / vault / extensions: el rol no puede
-- ni referenciar esos esquemas.

-- ── 5. Revocaciones defensivas ────────────────────────────────────────────────
revoke create on schema public from arcade_readonly;
revoke all on all functions in schema public from arcade_readonly;
revoke all on all procedures in schema public from arcade_readonly;
alter default privileges in schema public
  revoke execute on functions from arcade_readonly;

-- ── 6. Verificación (solo lectura; contrastar con lo esperado) ─────────────────
-- Esperado: rolcanlogin=t, rolsuper=f, rolbypassrls según camino tomado, rolconnlimit=5.
select rolname, rolcanlogin, rolsuper, rolbypassrls, rolconnlimit
from pg_roles where rolname = 'arcade_readonly';

-- Esperado: select=t ; insert/update/delete=f en ambas tablas.
select
  has_table_privilege('arcade_readonly', 'public.games',  'SELECT') as games_select,
  has_table_privilege('arcade_readonly', 'public.games',  'INSERT') as games_insert,
  has_table_privilege('arcade_readonly', 'public.scores', 'SELECT') as scores_select,
  has_table_privilege('arcade_readonly', 'public.scores', 'INSERT') as scores_insert,
  has_table_privilege('arcade_readonly', 'public.scores', 'UPDATE') as scores_update,
  has_table_privilege('arcade_readonly', 'public.scores', 'DELETE') as scores_delete;

-- Esperado: auth_usage=f, public_create=f.
select
  has_schema_privilege('arcade_readonly', 'auth',   'USAGE')  as auth_usage,
  has_schema_privilege('arcade_readonly', 'public', 'CREATE') as public_create;
