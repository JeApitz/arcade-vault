# supabase/migrations

Cambios de la DB **posteriores** a la baseline `supabase/prod/*.sql` (estado 2026-08-31).

Regla: **todo cambio de esquema o de datos de config en dev se hace vía migración**, nunca
con `execute_sql` suelto ni cambios manuales en el dashboard. Ver `CLAUDE.md` › "Cambios en
la base de datos".

## Cómo añadir una migración

1. `supabase/migrations/<YYYYMMDDHHMMSS>_<nombre_snake_case>.sql` — SQL idempotente cuando
   sea razonable (`if not exists`, `drop policy if exists` antes de `create policy`).
2. Aplicar a dev: `mcp__supabase__apply_migration` con `name` = nombre del archivo sin `.sql`.
3. Verificar con `execute_sql` (solo lectura) o `list_migrations`.
4. Commit del `.sql` con el código que lo acompaña.
5. Producción: el usuario pega el mismo `.sql` en el SQL Editor de prod, en orden de
   timestamp. Claude no toca prod.
