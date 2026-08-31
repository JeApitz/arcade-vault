-- Arcade Vault — verificación de PROD (solo lectura). Ejecutar consulta por consulta
-- y contrastar con "esperado". Todo debe cuadrar antes de abrir prod al público.

-- 1) Tablas de public -> esperado: games, scores
select table_name from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;

-- 2) Columnas -> esperado: games=9, scores=6
select table_name, count(*) as columnas from information_schema.columns
where table_schema = 'public' and table_name in ('games','scores')
group by table_name order by table_name;

-- 3) RLS activo -> esperado: games=t, scores=t
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname;

-- 4) Políticas -> esperado: exactamente 4
--    games  | Public select | SELECT | {anon,authenticated}
--    scores | Guest insert  | INSERT | {anon}
--    scores | Own insert    | INSERT | {authenticated}
--    scores | Public select | SELECT | {anon,authenticated}
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;

-- 5) Índices -> esperado: games_pkey, scores_pkey, scores_user_id_idx
select indexname from pg_indexes where schemaname = 'public' order by indexname;

-- 6) FK -> esperado: scores_game_id_fkey -> games(id); scores_user_id_fkey -> auth.users(id) ON DELETE SET NULL
select conname, pg_get_constraintdef(oid) as def
from pg_constraint where connamespace = 'public'::regnamespace and contype = 'f' order by conname;

-- 7) Datos -> esperado: juegos=5, scores=0
select (select count(*) from public.games)  as juegos,
       (select count(*) from public.scores) as scores;

-- 8) Grants de anon/authenticated -> esperado:
--    games  -> SELECT (ambos roles), nada más
--    scores -> SELECT, INSERT (ambos roles), nada más
select grantee, table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;

-- 9) Event trigger -> esperado: ensure_rls | ddl_command_end | O (enabled)
select evtname, evtevent, evtenabled from pg_event_trigger where evtname = 'ensure_rls';

-- 10) rls_auto_enable no ejecutable por anon/authenticated -> esperado: 0 filas
select grantee, privilege_type from information_schema.role_routine_grants
where routine_schema = 'public' and routine_name = 'rls_auto_enable'
  and grantee in ('anon','authenticated','public');
