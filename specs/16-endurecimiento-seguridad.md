# 16 — Endurecimiento de seguridad (checklist básico)

**Estado:** Implementado
**Depende de:** SPEC 14, SPEC 15
**Fecha:** 2026-08-26

**Objetivo:** cerrar el checklist de seguridad de `references/security/security-checklist.md` — RLS verificado, política de contraseñas fuerte (config + validación en UI), límite de signups por IP, headers de seguridad en Next.js y el finding `rls_auto_enable` del advisor.

> **Nota (2026-08-26):** `Leaked password protection` se **difiere** a un spec futuro. Este proyecto es un MVP; el toggle se activará si escala. Ver "No incluye".

## Contexto

El checklist en `references/security/security-checklist.md` junta cinco medidas básicas más los findings del advisor de Supabase. Estado actual verificado:

- **RLS** ya está habilitado en `games` y `scores` con políticas correctas (spec 15): `games` solo `SELECT` público; `scores` con `Guest insert` (anon, `user_id is null`), `Own insert` (authenticated, `user_id = auth.uid()`) y `Public select`. Este punto solo necesita quedar verificado, no reimplementado.
- **Política de contraseñas**: hoy `/auth` (`app/auth/page.tsx`) manda la contraseña a `supabase.auth.signUp` sin ninguna validación de longitud ni de composición. El proyecto de Supabase no tiene mínimo de 8 caracteres ni requisitos de composición configurados.
- **Leaked password protection**: el advisor confirma que está deshabilitada (`auth_leaked_password_protection`). **Diferido** a un spec futuro (decisión del usuario, 2026-08-26): el proyecto es un MVP y se deja el toggle apagado por ahora.
- **Rate de signups por IP**: no configurado.
- **Headers de seguridad**: `next.config.ts` no define ningún header.
- **Advisor `rls_auto_enable`**: la función `public.rls_auto_enable()` es `SECURITY DEFINER` y es invocable vía `/rest/v1/rpc/rls_auto_enable` por los roles `anon` y `authenticated` (findings `0028` y `0029`).

Las herramientas MCP disponibles no exponen la configuración de Supabase Auth (política de contraseñas, rate limits). Esos cambios son pasos manuales en el dashboard, documentados en este spec y verificados con pruebas manuales.

## Alcance

**Incluye:**

- **Config de Supabase Auth (manual, dashboard):**
  - `Minimum password length` = `8`.
  - `Password requirements` = `Lowercase, uppercase letters, digits and symbols (recommended)`.
  - Límite de signups por IP mediante el rate limit de Supabase Auth (`Rate Limits → Sign ups / Sign ins`), reduciéndolo desde el default a un valor anti-bot razonable (ej. 10 por hora por IP). El valor final lo fija el usuario en el dashboard; el spec solo exige que quede por debajo del default.
- **Validación de contraseña en la UI** (`app/auth/page.tsx`, pestaña de registro): un checklist en vivo debajo del campo de contraseña con 5 requisitos que se marcan ✓/✗ mientras el usuario escribe:
  1. Al menos 8 caracteres.
  2. Una letra minúscula.
  3. Una letra mayúscula.
  4. Un dígito.
  5. Un símbolo (cualquier carácter no alfanumérico).
     El botón de registro queda deshabilitado hasta que los 5 requisitos se cumplen. La lógica de validación vive en un helper reutilizable `app/lib/password.ts` (`checkPassword(pw): { minLength, lower, upper, digit, symbol }` y `isPasswordValid(pw): boolean`).
- **Misma validación en el reset de contraseña** (`app/auth/reset-password/page.tsx`): reusa el helper y el mismo checklist en vivo; el botón de guardar nueva contraseña queda deshabilitado hasta cumplir los 5 requisitos.
- **Headers de seguridad en `next.config.ts`**: función `headers()` que aplica a `/(.*)`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Migración `revoke_execute_rls_auto_enable`**: `revoke execute on function public.rls_auto_enable() from anon, authenticated, public;`. El event trigger asociado sigue funcionando (se dispara por DDL, no por el privilegio `EXECUTE` del rol), así que las tablas nuevas en `public` siguen recibiendo RLS automático; solo deja de ser invocable vía la API REST.

**No incluye:**

- **`Leaked password protection` (HaveIBeenPwned).** Diferido a un spec futuro por decisión del usuario (MVP). Se activará el toggle cuando el proyecto escale; entonces el advisor `auth_leaked_password_protection` debe quedar en cero.
- `Content-Security-Policy` y cualquier otro header no listado arriba (se evalúa en un spec futuro por el riesgo de romper Next 16 / Supabase / scripts inline).
- Captcha (hCaptcha/Turnstile) en registro o login — el anti-bot se limita al rate limit de Supabase.
- Rate limiting propio a nivel de aplicación o de `scores` (el insert sigue con las políticas RLS de spec 15, sin límite de frecuencia).
- Cambiar el modelo de datos de `scores` o `games`, ni añadir políticas nuevas de RLS.
- Auditar o cambiar otras funciones/`SECURITY DEFINER` que no sean `rls_auto_enable`.
- Automatizar la config de Supabase Auth vía Management API o Terraform — los tres ajustes de Auth se hacen a mano en el dashboard.
- Forzar la validación de composición de contraseña del lado servidor en nuestro código (la hace Supabase Auth con la config nueva; nuestra capa es UX).
- 2FA / MFA, expiración de sesión, rotación de tokens.

## Modelo de datos

Este spec no crea ni modifica tablas.

Migración `revoke_execute_rls_auto_enable`:

```sql
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
```

Nuevo módulo `app/lib/password.ts` (no persiste nada, es lógica pura):

```ts
type PasswordChecks = {
  minLength: boolean; // >= 8
  lower: boolean; // /[a-z]/
  upper: boolean; // /[A-Z]/
  digit: boolean; // /[0-9]/
  symbol: boolean; // /[^A-Za-z0-9]/
};
```

## Plan de implementación

1. **Migración del advisor.** Aplicar `revoke_execute_rls_auto_enable`. Verificar con `get_advisors` (security) que los findings `0028` y `0029` (`*_security_definer_function_executable` sobre `rls_auto_enable`) ya no aparecen. Confirmar que crear una tabla de prueba en `public` sigue quedando con RLS habilitado y luego borrarla.
2. **Helper de contraseña.** Crear `app/lib/password.ts` con `checkPassword` e `isPasswordValid`. Sin dependencias.
3. **Checklist en vivo en registro.** En `app/auth/page.tsx`, pestaña de registro: render del checklist de 5 ítems bajo el campo de contraseña usando `checkPassword(pass)`, cada ítem con su marca ✓/✗. Deshabilitar el botón de registro si `!isPasswordValid(pass)`. Estilo consistente con `/frontend-design` y el resto del formulario.
4. **Checklist en vivo en reset.** En `app/auth/reset-password/page.tsx`: mismo checklist y misma condición de botón deshabilitado antes de `supabase.auth.updateUser({ password })`.
5. **Headers en Next.js.** Añadir `headers()` a `next.config.ts` con los 4 headers sobre `source: '/(.*)'`. Correr `npm run build` y, con `npm run start` o dev, comprobar con `curl -I` que los 4 headers llegan en la respuesta.
6. **Config manual de Supabase Auth.** En el dashboard (Authentication → Providers/Policies y Rate Limits):
   - `Minimum password length` = 8.
   - `Password requirements` = `Lowercase, uppercase letters, digits and symbols (recommended)`.
   - Bajar el rate limit de sign ups por IP por debajo del default (valor a criterio del usuario, ej. 10/h).
   - `Leaked password protection`: **no se toca** en este spec (diferido).
     Documentar en el PR los valores finales aplicados.
7. **Verificación end-to-end.** Ejecutar la checklist de "Verificación" completa. `npm run build` y `npm run lint` limpios.

## Criterios de aceptación

- [ ] `get_advisors` (security) ya no reporta `anon_security_definer_function_executable` ni `authenticated_security_definer_function_executable` para `public.rls_auto_enable`.
- [ ] Crear una tabla nueva en el esquema `public` sigue quedando con RLS habilitado automáticamente tras la migración.
- [ ] Llamar a `POST /rest/v1/rpc/rls_auto_enable` con la publishable key devuelve error de permiso (ya no es ejecutable por `anon`/`authenticated`).
- [ ] En `/auth` (registro), escribir una contraseña de menos de 8 caracteres o sin mayúscula / minúscula / dígito / símbolo muestra el requisito correspondiente sin marcar y mantiene el botón de registro deshabilitado.
- [ ] En `/auth` (registro), una contraseña que cumple los 5 requisitos marca los 5 ítems y habilita el botón.
- [ ] Intentar registrarse (bypass del cliente) con una contraseña débil es rechazado por Supabase Auth con un mensaje de error visible en el formulario.
- [ ] `/auth/reset-password` aplica el mismo checklist y deshabilita el botón hasta cumplir los 5 requisitos.
- [ ] `curl -I` sobre cualquier ruta del sitio devuelve `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- [ ] `pg_policies` sobre `games` y `scores` mantiene exactamente las políticas de spec 15 (este spec no las toca).
- [ ] Crear más de N signups desde la misma IP en una hora (N = límite configurado) es rechazado por el rate limit de Supabase Auth.
- [ ] `npm run build` y `npm run lint` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** checklist en vivo bajo el campo en vez de un único mensaje al fallar el submit. Decisión explícita del usuario; da feedback inmediato mientras se escribe.
- **Sí:** validación de contraseña también en `/auth/reset-password`, no solo en registro. Decisión explícita del usuario; evita que el reset sea una puerta trasera a contraseñas débiles.
- **Sí:** `Password requirements` = opción "recommended" (minúscula + mayúscula + dígito + símbolo). Decisión explícita del usuario (captura del dashboard).
- **Sí:** headers = los 3 del checklist + `Strict-Transport-Security`. Decisión explícita del usuario.
- **No (por ahora):** `Leaked password protection`. Diferido a un spec futuro por decisión del usuario (2026-08-26); el proyecto es un MVP y el toggle se activará si escala.
- **No:** `Content-Security-Policy`. Riesgo de romper Next 16 / Supabase / estilos inline; se evalúa en un spec propio.
- **No:** captcha en registro/login. El anti-bot se cubre con el rate limit de Supabase Auth; captcha añade dependencia y fricción.
- **Sí:** `revoke execute` sobre `rls_auto_enable` en vez de borrar la función y el event trigger. Mantiene el RLS automático en tablas nuevas y cierra el advisor con una migración mínima.
- **No:** automatizar la config de Auth vía Management API. Las herramientas disponibles no la exponen; se documentan pasos manuales + verificación por advisor.
- **RLS:** no se reimplementa. Ya quedó correcto en spec 15; este spec solo lo verifica.

## Riesgos identificados

| Riesgo                                                                                                              | Mitigación                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los 3 ajustes de Supabase Auth son manuales y pueden olvidarse o revertirse en otro entorno.                        | Criterios de aceptación atados a `get_advisors` y a pruebas manuales; valores finales documentados en el PR.                                                                                |
| `HSTS` con `preload` es difícil de revertir (los navegadores cachean la directiva por `max-age`).                   | Solo aplica sobre HTTPS; el dominio de producción ya sirve siempre por HTTPS. Si hiciera falta revertir, se baja `max-age` a 0 y se despliega antes de que expire la caché.                 |
| El event trigger `rls_auto_enable` podría depender del privilegio `EXECUTE` y dejar de dispararse tras el `revoke`. | Paso 1 del plan verifica explícitamente que una tabla nueva en `public` sigue quedando con RLS tras la migración; si falla, se revierte el `revoke`.                                        |
| Reglas regex del símbolo distintas entre nuestro helper y Supabase (p. ej. espacio como símbolo).                   | El helper usa `[^A-Za-z0-9]`, alineado con la definición de Supabase ("al menos uno de cada": minúscula/mayúscula/dígito/símbolo). El rechazo real lo hace Supabase; el cliente es solo UX. |
| El rate limit de sign ups también afecta pruebas QA legítimas desde una sola IP.                                    | Valor configurable; se sube temporalmente durante QA y se deja en el valor anti-bot para producción.                                                                                        |

## Lo que **no** está en este spec

- `Leaked password protection` (diferido a spec futuro).
- `Content-Security-Policy` ni headers fuera de los 4 listados.
- Captcha en registro/login.
- Rate limiting propio de la aplicación o sobre `scores`.
- Cambios al modelo de datos o a las políticas RLS de `games` / `scores`.
- Auditoría de otras funciones `SECURITY DEFINER`.
- Automatización de la config de Supabase Auth.
- MFA/2FA, expiración/rotación de sesión.

Cada uno, si se necesita, va en su propio spec futuro.
