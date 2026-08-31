-- Arcade Vault — endurecimiento de PROD. Idempotente. Ejecutar tras 01 y 02.
-- En dev, anon/authenticated conservan grants amplios de tabla y solo RLS los frena
-- (ver references/security/security-status.md). PROD arranca limpio: se cierra de entrada.

-- ── Grants mínimos ─────────────────────────────────────────────────────────────
revoke all on public.games  from anon, authenticated;
revoke all on public.scores from anon, authenticated;

grant select on public.games to anon, authenticated;
-- anon solo lee el salón; insertar un puntaje exige cuenta autenticada (spec 17).
grant select on public.scores to anon;
grant select, insert on public.scores to authenticated;

-- scores.id es "generated always as identity": el insert desde el cliente necesita la secuencia.
grant usage, select on all sequences in schema public to anon, authenticated;

-- ── Event trigger: RLS automático en toda tabla nueva de public ─────────────────
-- Puede venir de fábrica en proyectos Supabase nuevos; se crea solo si falta.
create or replace function public.rls_auto_enable()
  returns event_trigger
  language plpgsql
  security definer
  set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name is not null and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog','information_schema')
       and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (system schema or not enforced: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$function$;

do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();
  end if;
end
$$;

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
