# Estado de seguridad

Memoria del agente `security-auditor`. Se actualiza en CADA corrida (barrido completo).
Rúbrica fija: S1–S12 (definición completa en `.claude/agents/security-auditor.md`).
Este agente NO corrige: reporta. Los arreglos los decide y aplica el usuario.

## Estado

| Regla                        | Área | Estado | Severidad | Fecha      | Notas                                                                                                                        |
| ---------------------------- | ---- | ------ | --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| S1 RLS universal             | db   | ✅     | —         | 2026-08-26 | `games` y `scores` con `rowsecurity=true`; políticas = spec 15 exactas.                                                      |
| S2 Políticas sin holgura     | db   | ✅     | —         | 2026-08-26 | Sin `with check (true)`/`using (true)` en writes; `scores` sin UPDATE/DELETE. Nota: grants de tabla anchos (ver corrida).    |
| S3 Advisors en cero          | db   | ✅     | 🔵        | 2026-08-26 | Único finding vivo: `auth_leaked_password_protection` → 🔵 spec 16. Findings 0028/0029 (`rls_auto_enable`) cerrados.         |
| S4 SECURITY DEFINER          | db   | ✅     | —         | 2026-08-26 | `public.rls_auto_enable()` SECDEF, `search_path=pg_catalog`, EXECUTE revocado a anon/authenticated/public.                   |
| S5 Config de Auth            | auth | ❓     | —         | 2026-08-26 | No inspeccionable por MCP. Pasos de dashboard en la corrida.                                                                 |
| S6 Validación de contraseña  | app  | ❌     | 🟡        | 2026-08-26 | `/auth` y `/auth/reset-password` OK; falta en el registro inline de `game-player.tsx`.                                       |
| S7 Secretos                  | app  | ✅     | —         | 2026-08-26 | Solo publishable key en `NEXT_PUBLIC_*`. `.env*` ignorado; `.env.template` con placeholders.                                 |
| S8 Frontera cliente/servidor | app  | ✅     | —         | 2026-08-26 | `server.ts` solo lo importa `app/auth/callback/route.ts` (sin `"use client"`). Ver S11 por acotación de input.               |
| S9 Headers de seguridad      | app  | ✅     | 🔵        | 2026-08-26 | Los 4 headers de spec 16 sobre `/(.*)`. Ausencia de CSP → 🔵 spec 16.                                                        |
| S10 Sesión                   | app  | ✅     | —         | 2026-08-26 | `proxy.ts` → `updateSession` con `getUser()`; `getSession()` solo en cliente.                                                |
| S11 API propia               | app  | ❌     | 🟡        | 2026-08-26 | `contact/route.ts` sin acotar longitud; `name` interpolado en `subject`.                                                     |
| S12 Inyección y redirects    | app  | ✅     | —         | 2026-08-26 | Redirects desde `NEXT_PUBLIC_SITE_URL`/`origin` fijo; `salon` valida `juego` contra catálogo; sin `dangerouslySetInnerHTML`. |

Leyenda: ✅ cumple · ❌ incumple · 🔵 riesgo aceptado (spec) · ❓ no verificable · ⬜ pendiente.
Severidad: 🔴 crítico · 🟠 alto · 🟡 medio · 🔵 aceptado.

## Riesgos aceptados (diferidos/descartados por spec — no son hallazgos)

- `Leaked password protection` (HaveIBeenPwned) — diferido a spec futuro, spec 16 ("No incluye" / decisión 2026-08-26, MVP). El advisor `auth_leaked_password_protection` seguirá activo hasta entonces.
- `Content-Security-Policy` y cualquier header fuera de los 4 listados — spec 16, riesgo de romper Next 16 / Supabase / inline.
- Captcha (hCaptcha/Turnstile) en registro/login — spec 14 y spec 16.
- Rate limiting propio de la app y sobre `scores` — spec 14/15/16.
- Vincular puntajes históricos de invitados a una cuenta — spec 15.
- Username sin unicidad a nivel de DB — spec 14.

## Registro de decisiones

- 2026-08-26: memoria sembrada en esta corrida (no existía). Barrido completo, sin filtro.

## Pendientes para el usuario

_(cola de fixes propuestos, ordenada por severidad; se cierran anotando la fecha de verificación)_

1. **[🟡 S6]** Aplicar el checklist de contraseña al registro inline de `app/juegos/[id]/jugar/game-player.tsx`. Abierto 2026-08-26.
2. **[🟡 S11]** Acotar longitud de `name`/`email`/`msg` en `app/api/contact/route.ts` y sanear/quitar interpolación de `name` en `subject`. Abierto 2026-08-26.
3. **[❓ S5]** Config manual de Supabase Auth en el dashboard (ver corrida 2026-08-26): min length 8, requisitos de composición, rate limit de sign ups bajo el default, confirmación de email obligatoria. Abierto 2026-08-26.

## Por corrida

### 2026-08-26

Barrido completo (db + auth + app). Filtro: ninguno. Esta corrida sembró la memoria (no existía `security-status.md`).

**Hallazgos:**

- **[🟡 S6] Registro inline sin validación de contraseña.** `app/juegos/[id]/jugar/game-player.tsx:296-340`: el formulario de registro del modal de fin de partida (rama `authTab === "up"`, campo `type="password"` en línea 319-324) no renderiza `PasswordChecklist` ni gatea el submit con `isPasswordValid`. El botón (línea 334-338) solo tiene `disabled={authLoading}`. `authSubmit` (línea 87) llama a `supabase.auth.signUp` sin validar. Spec 15 extendió este flujo a todos los juegos y spec 16 (S6) exige la misma validación que en `/auth`. Sin explotación directa: el rechazo real de contraseñas débiles depende de la config de Auth (S5); esto es defensa/UX en profundidad. Los otros dos puntos de entrada (`app/auth/page.tsx:202,241`, `app/auth/reset-password/page.tsx:127,150`) sí cumplen.
  - Fix propuesto (diff sugerido, no aplicado):
    ```tsx
    // game-player.tsx — imports
    import { isPasswordValid } from "@/app/lib/password";
    import { PasswordChecklist } from "@/app/auth/password-checklist";

    // tras el <div className="field"> de Contraseña, solo en registro:
    {authTab === "up" && <PasswordChecklist password={authPass} />}

    // botón submit:
    disabled={authLoading || (authTab === "up" && !isPasswordValid(authPass))}
    ```

- **[🟡 S11] `contact/route.ts` no acota input e interpola `name` en el header `subject`.** `app/api/contact/route.ts:6-19`: `name`, `email`, `msg` se leen del body y solo se valida presencia + regex de email (línea 8); no hay límite de longitud. `name` se interpola en `subject: \`Nuevo mensaje de contacto de ${name}\``(línea 18). S11 exige acotar longitud/formato antes de pasar a Resend y no interpolar input de usuario en cabeceras de email. Ningún spec cubre este endpoint. Severidad media: la API de Resend es JSON (no SMTP), el riesgo de inyección de headers CRLF es bajo, pero`name`/`msg` sin tope permiten abuso de payload. El body no se refleja en la respuesta ni en logs (bien). Falta de rate limit propio = 🔵 (spec 14/16).
  - Fix propuesto (diff sugerido, no aplicado):
    ```ts
    const name = String(body.name ?? "").trim().slice(0, 80).replace(/[\r\n]+/g, " ");
    const email = String(body.email ?? "").trim().slice(0, 120);
    const msg = String(body.msg ?? "").trim().slice(0, 2000);
    if (!name || !email || !msg || !EMAIL_RE.test(email)) { /* 400 */ }
    // subject fijo, sin interpolar name:
    subject: "Nuevo mensaje de contacto",
    // name/email/msg van solo en el cuerpo `text` (ya es el caso)
    ```

**Consultas y greps ejecutados:**

- `get_advisors(security)` → solo `auth_leaked_password_protection` (WARN, 🔵 spec 16). Findings 0028/0029 sobre `rls_auto_enable` ya no aparecen (migración `revoke_execute_rls_auto_enable`, `20260827012643`).
- `pg_tables` (implícito vía `list_tables`): `games` y `scores` con `rls_enabled=true`.
- `pg_policies` (public): `games` → `Public select` (anon,authenticated / SELECT / qual `true`). `scores` → `Guest insert` (anon / INSERT / with_check `user_id IS NULL`), `Own insert` (authenticated / INSERT / with_check `user_id = auth.uid()`), `Public select` (anon,authenticated / SELECT / `true`). Sin políticas UPDATE/DELETE. Coincide con spec 15.
- `pg_proc` (public): única función `rls_auto_enable`, `prosecdef=true`, `proconfig=["search_path=pg_catalog"]`.
- `has_function_privilege` para `public.rls_auto_enable()`: anon=false, authenticated=false, public=false.
- `role_table_grants` (anon/authenticated): ambos roles tienen INSERT/SELECT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER sobre `games` y `scores` (grants por defecto de Supabase). No es hallazgo: RLS sin política permisiva = deny para todo write; PostgREST no expone TRUNCATE. Nota de hardening: se podría `revoke` UPDATE/DELETE/TRUNCATE/INSERT en `games` y UPDATE/DELETE/TRUNCATE en `scores` para defensa en profundidad.
- `list_migrations`: 7 migraciones; las de seguridad `add_user_id_to_scores` (20260826205022) y `revoke_execute_rls_auto_enable` (20260827012643) presentes.
- grep `NEXT_PUBLIC_*(KEY|SECRET|PASSWORD|TOKEN)` → solo `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `client.ts:6`, `middleware.ts:11`, `server.ts:9` (pública, permitida).
- grep `service_role|SERVICE_ROLE` en `app/`, `proxy.ts`, `next.config.ts` → 0.
- grep `dangerouslySetInnerHTML` en `app/` → 0.
- grep `getSession(` → `game-player.tsx:48`, `auth/reset-password/page.tsx:30`, `nav.tsx:29`, `auth/page.tsx:25` — todos componentes cliente, no autorización server-side. `proxy.ts`/`updateSession` usan `getUser()`. `saveScore` (game-player.tsx:134) usa `getUser()`.
- grep import `lib/supabase/server` → solo `app/auth/callback/route.ts` (route handler, sin `"use client"`).
- grep `redirectTo|emailRedirectTo|resetPasswordForEmail` → todos construidos con `${process.env.NEXT_PUBLIC_SITE_URL}/...` (`auth/page.tsx:58,74,216`, `game-player.tsx:92`). `callback/route.ts` usa `new URL(request.url).origin` (origin propio del server, no query param).
- `app/salon/page.tsx:6-7`: `searchParams.juego` se valida contra `games.some((g) => g.id === juego)` antes de usarse como tab; no llega a redirect ni a HTML.
- `.gitignore`: `.env*` ignorado salvo `.env.template`. `.env.template`: `RESEND_API_KEY=XXXX`, `SUPABASE_DB_PASSWORD=XXXX`, URLs vacías, `NEXT_PUBLIC_SITE_URL=http://localhost:3000` — sin secretos reales.
- `next.config.ts`: `headers()` sobre `source: "/(.*)"` con `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- `app/api/contact/route.ts`: leído completo (ver hallazgo S11).

**Sin verificar (y por qué):**

- **S5 — Config de Supabase Auth.** Las herramientas MCP no exponen la config de Auth. Verificar y ajustar a mano en el dashboard (Authentication):
  - Policies → `Minimum password length` = `8`.
  - Policies → `Password Requirements` = `Lowercase, uppercase letters, digits and symbols`.
  - Rate Limits → `Sign ups / Sign ins`: bajar por debajo del default (ej. 10/hora/IP).
  - Providers → Email → `Confirm email` = activado (obligatorio).
  - `Leaked password protection`: se deja apagado (🔵 spec 16).
- **Rechazo real de contraseña débil / RLS de insert ajeno**: no se ejecuta ningún INSERT desde este agente. Para comprobar que un insert anónimo con `user_id` ajeno es rechazado, correr (rellenando `<PUBLISHABLE_KEY>` y un UUID cualquiera):
  ```bash
  curl -i -X POST 'https://wzwdyvdongczmqnhcavw.supabase.co/rest/v1/scores' \
    -H 'apikey: <PUBLISHABLE_KEY>' \
    -H 'Authorization: Bearer <PUBLISHABLE_KEY>' \
    -H 'Content-Type: application/json' \
    -d '{"game_id":"asteroides","player_name":"HACK","score":999,"user_id":"00000000-0000-0000-0000-000000000000"}'
  # Esperado: 403 / "new row violates row-level security policy"
  ```
- **RPC revocado**: confirmar que `POST /rest/v1/rpc/rls_auto_enable` con la publishable key devuelve error de permiso:
  ```bash
  curl -i -X POST 'https://wzwdyvdongczmqnhcavw.supabase.co/rest/v1/rpc/rls_auto_enable' \
    -H 'apikey: <PUBLISHABLE_KEY>' -H 'Authorization: Bearer <PUBLISHABLE_KEY>'
  ```
- **Headers en runtime**: `curl -I` sobre una ruta desplegada para confirmar que los 4 headers llegan (build no auditado por este agente).

**Fixes propuestos:** ver los dos bloques de diff en "Hallazgos" (S6, S11) y los pasos de dashboard en "Sin verificar" (S5).
