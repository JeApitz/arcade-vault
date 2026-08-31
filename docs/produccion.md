# Puesta en producción — Arcade Vault

Migración de la instancia **dev** de Supabase (`wzwdyvdongczmqnhcavw`, accesible por MCP)
a una instancia **prod** nueva, a la que Claude/el MCP **no tienen ni deben tener acceso**.

Todo lo que sigue lo ejecuta una persona con acceso al dashboard de prod. Claude solo
generó los `.sql` y esta guía a partir del estado real de dev (2026-08-31).

---

## 1. Esquema y datos (SQL Editor de prod)

Ejecutar **en orden**, cada archivo entero, en `Dashboard › SQL Editor` del proyecto de prod:

| Paso | Archivo                             | Qué hace                                                                                  | Qué esperar                                                         |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1    | `supabase/prod/01-schema.sql`       | Crea `games` y `scores`, índice, RLS y las 4 políticas                                    | "Success. No rows returned"                                         |
| 2    | `supabase/prod/02-seed-games.sql`   | Inserta las 5 filas del catálogo (`arkanoid`, `asteroides`, `frogger`, `snake`, `tetris`) | "Success" — 5 filas afectadas                                       |
| 3    | `supabase/prod/03-hardening.sql`    | Grants mínimos para `anon`/`authenticated` + event trigger `ensure_rls`                   | "Success. No rows returned"                                         |
| 4    | `supabase/prod/04-verificacion.sql` | 10 consultas de solo lectura                                                              | Contrastar cada resultado con el "esperado" comentado en el archivo |

Los pasos 1–3 son **idempotentes**: re-ejecutarlos no da error ni duplica datos.

`scores` arranca **vacío** y hay **0 usuarios**: el leaderboard empieza limpio. Los 14 scores
y 3 usuarios de dev son datos de prueba y no se migran.

Extensiones: dev solo usa las de fábrica (`plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`,
`supabase_vault`). **No hay que instalar nada** en prod.

No hay edge functions, ni storage buckets, ni jobs de `pg_cron`/`pg_net`.

---

## 2. Variables de entorno de prod

Base: `.env.template`. Los valores de Supabase salen de `Dashboard › Project Settings › API`
del proyecto de **prod** (no los de dev).

| Variable                               | Valor en prod                                                                                                                                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto de prod                                                                                                                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key de prod                                                                                                                                                                                       |
| `NEXT_PUBLIC_SITE_URL`                 | Dominio real con `https://`, **sin** barra final (p. ej. `https://arcadevault.com`). NO `localhost`. Lo usan `app/auth/page.tsx` y `app/juegos/[id]/jugar/game-player.tsx` para los `redirectTo` de OAuth y de email |
| `RESEND_API_KEY`                       | API key de Resend (puede ser la misma que dev o una propia de prod)                                                                                                                                                  |
| `SUPABASE_DB_PASSWORD`                 | Password de la BD de prod. Hoy no la lee el código, solo se documenta                                                                                                                                                |

⚠️ **Nunca** poner la `service_role` key en una variable `NEXT_PUBLIC_*` (queda expuesta al
navegador). El código actual no la usa; que siga así.

Estas variables se cargan en el panel del hosting (Vercel u otro). No hay `vercel.json` ni CI
en el repo; el deploy es el estándar de Next.js 16 (`npm run build` / `npm start`).
`next.config.ts` ya envía 4 cabeceras de seguridad (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Strict-Transport-Security`); no hay CSP (aceptado en `specs/16`).
`allowedDevOrigins` en ese archivo es solo para `next dev` y no afecta a prod.

---

## 3. Configuración manual de Auth (dashboard de prod)

Nada de esto viaja en SQL. `Dashboard › Authentication` del proyecto de prod:

### URL Configuration

- **Site URL** = el dominio de prod (igual que `NEXT_PUBLIC_SITE_URL`).
- **Redirect URLs** (añadir ambas):
  - `https://<dominio>/auth/callback` — la consume `app/auth/callback/route.ts` (`exchangeCodeForSession`).
  - `https://<dominio>/auth/reset-password` — destino del correo de recuperación.

### Providers

- **Email**: habilitado. **Confirm email = ON** (en dev conviene comprobar que también lo está).
- **Google** y **GitHub**: el código ofrece `signInWithOAuth` para ambos (`app/auth/page.tsx`).
  Requieren **credenciales OAuth NUEVAS** para prod:
  - Google Cloud Console / GitHub Developer Settings: crear un OAuth client del dominio de prod.
  - Registrar como redirect URI autorizada la que indica Supabase prod
    (`https://<ref-prod>.supabase.co/auth/v1/callback`).
  - Pegar client id / secret en el provider correspondiente del dashboard de prod.
  - Las credenciales de dev **no** sirven en prod.
  - Si no vas a lanzar OAuth el día 1, deshabilita ambos providers para no dejar botones rotos.

### Política de contraseñas

- **Minimum length = 8**, y activar requisitos de composición coherentes con `app/lib/password.ts`
  (esa validación hoy es solo UX en el cliente; el dashboard es quien la hace obligatoria).
- **Leaked password protection (HaveIBeenPwned) = ON**. En dev está OFF y aceptado como riesgo;
  prod es el momento de activarlo.

### Rate limits y correos

- Revisar los **rate limits** de sign-up y de envío de emails (`Authentication › Rate Limits`).
- **Email templates** (Confirm signup, Reset password): si en dev se personalizaron/tradujeron,
  replicarlas en prod.

---

## 4. Verificación end-to-end

Con `.env.local` apuntando a **prod** y la app corriendo:

1. `/games` lista los 5 juegos; `/juegos/asteroides` abre el detalle.
2. Jugar como invitado y guardar un score → inserta con `user_id NULL`.
3. Registrarse → confirmar email → jugar autenticado y guardar → inserta con `user_id = auth.uid()`.
4. `/salon` muestra ambos scores.
5. Recuperación de contraseña: `/auth` → "olvidé mi contraseña" → correo → `/auth/reset-password`.
6. **Prueba negativa de RLS** (desde el cliente anónimo, p. ej. consola del navegador):
   - `update` o `delete` sobre `scores` → debe fallar.
   - `insert` en `scores` con `user_id` no nulo siendo anónimo → debe fallar.
7. En el dashboard de prod, `Advisors › Security` → 0 hallazgos.

---

## 5. Mantener dev y prod sincronizados (evitar drift)

El esquema de dev **no era reproducible** desde el repo: la fila `frogger` y la función
`rls_auto_enable` se aplicaron con SQL suelto, fuera del historial de migraciones. Estos
`.sql` reflejan el **estado final**, no la secuencia.

A partir de ahora: **todo cambio de esquema o de datos de configuración se escribe primero
como migración en `supabase/migrations/<timestamp>_<nombre>.sql`**, se aplica a dev con
`mcp__supabase__apply_migration`, y a prod pegando el mismo `.sql` en el SQL Editor (en orden
de timestamp). Nunca `execute_sql` suelto ni cambios manuales en el dashboard. Ver
`CLAUDE.md` › "Cambios en la base de datos" y `supabase/migrations/README.md`.
Así las dos instancias no vuelven a divergir.

### Migraciones sobre la baseline

Pegar en el SQL Editor de prod, en orden de timestamp, después de los `01`–`04`:

| Migración                                       | Efecto                                                                                                                                              | Antes de aplicar                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `20260831160934_require_account_for_scores.sql` | Guardar puntaje exige cuenta: borra scores de invitado, quita `Guest insert`, revoca `insert` a `anon`, FK `on delete cascade`, `user_id not null`. | **Exportar `public.scores` primero** (Table editor › Export): el `delete from scores where user_id is null` es **irreversible**. |

`supabase/prod/01-schema.sql` y `03-hardening.sql` ya reflejan el estado post-migración; en una
instalación nueva basta con esos y la migración es un no-op idempotente.

---

## 6. Pendientes de app antes de abrir prod al público (no bloquean la migración)

De `references/security/security-status.md`, sin resolver:

- **S6** — El registro inline del modal de fin de partida (`app/juegos/[id]/jugar/game-player.tsx`,
  ~líneas 296–340) no aplica `PasswordChecklist` / `isPasswordValid`; `/auth` y `/auth/reset-password` sí.
- **S11** — `app/api/contact/route.ts` no limita la longitud de `name` / `email` / `msg`, e
  interpola `name` en la cabecera `subject` del correo (riesgo de inyección de cabeceras).

Son bugs de código, no de la migración. Conviene arreglarlos antes del lanzamiento.
