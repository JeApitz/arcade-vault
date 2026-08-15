# 04 — Integración base de Supabase

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-08-15

**Objetivo:** Conectar el proyecto Next.js con el proyecto de Supabase ya existente (cliente configurado con las credenciales reales), sin implementar todavía ninguna feature que lo use (auth, tablas, etc.), dejando la base lista para specs futuros.

## Alcance

**Incluye:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr` agregadas a `package.json`.
- Cliente de Supabase para browser en `app/lib/supabase/client.ts` (usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Cliente de Supabase para servidor en `app/lib/supabase/server.ts` (Server Components / Route Handlers, usando `@supabase/ssr` con manejo de cookies), con las mismas env vars.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` documentadas (vacías) en `.env.template`, junto a `SUPABASE_DB_PASSWORD` que ya existe.
- `.env.local` (no versionado) con los valores reales: URL del proyecto (`https://wzwdyvdongczmqnhcavw.supabase.co`) y la clave pública (`anon`/`publishable`), obtenidas vía MCP de Supabase.
- Verificación de que las credenciales son válidas y el cliente conecta de verdad contra el proyecto de Supabase (sin dejar código de prueba permanente en el repo).

**No incluye (fuera de alcance de este spec):**

- Cualquier flujo de autenticación real (login, registro, logout, sesión, invitado). El formulario de `/auth` sigue siendo mock y sin conectar; se implementará en un spec futuro dedicado a auth.
- Cualquier tabla, esquema o migración en la base de datos del proyecto de Supabase. Hoy el proyecto no tiene tablas (`public` está vacío) y este spec no crea ninguna.
- Persistencia de puntajes o lectura del Salón de la Fama desde Supabase (`/salon` sigue usando `seededScores`). Queda para un spec futuro.
- Configuración de proveedores OAuth (Google, GitHub) en el dashboard de Supabase.
- Middleware de Next.js para refrescar sesión — no aplica todavía porque no hay sesión que mantener en este spec.

## Modelo de datos

No se introduce ningún modelo de datos ni tabla en Supabase. Este spec solo agrega:

- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas, seguras de exponer al browser) y la ya existente `SUPABASE_DB_PASSWORD` (secreta, sin uso todavía en el código de la app).
- Dos módulos de utilidades: `app/lib/supabase/client.ts` (exporta una función `createClient()` que devuelve un cliente de browser con `createBrowserClient` de `@supabase/ssr`) y `app/lib/supabase/server.ts` (exporta una función `createClient()` async que devuelve un cliente de servidor con `createServerClient`, leyendo/escribiendo cookies vía `next/headers`).

## Plan de implementación

1. **Credenciales.** Obtener la URL del proyecto (`mcp__supabase__get_project_url`) y la clave pública (`mcp__supabase__get_publishable_keys`, usando la clave de tipo `publishable`, no la `legacy anon` a menos que falle). Agregar `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (vacías) a `.env.template`, y crear/editar `.env.local` con los valores reales.
2. **Dependencias.** Instalar `@supabase/supabase-js` y `@supabase/ssr` (`npm install @supabase/supabase-js @supabase/ssr`).
3. **Clientes.** Crear `app/lib/supabase/client.ts` con `createClient()` (cliente de browser, `createBrowserClient` de `@supabase/ssr`) y `app/lib/supabase/server.ts` con `createClient()` async (cliente de servidor, `createServerClient`, usando `cookies()` de `next/headers` para leer/escribir cookies de sesión). Antes de escribir estos archivos, revisar `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` (ya revisado: sin cambios relevantes en esta versión) y la documentación de Server Components/Route Handlers vigente en `node_modules/next/dist/docs/` por si hay diferencias en `cookies()`/`next/headers` respecto al training data.
4. **Verificación de conexión.** Sin dejar código de prueba permanente en el repo: ejecutar temporalmente (por ejemplo con un script descartable o `next dev` + un `console.log` que se revierte después) una llamada real contra el proyecto usando ambos clientes (p. ej. `supabase.auth.getSession()` o `supabase.from("_probe").select().limit(1)`) y confirmar que la respuesta es la esperada de un proyecto sin tablas/sesión (no un error de red, DNS o credenciales inválidas). Revertir cualquier código de prueba antes de terminar.
5. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas, y que `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` quedan inlineadas correctamente en el bundle de cliente.

## Criterios de aceptación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` están en `dependencies` de `package.json`.
- [ ] `app/lib/supabase/client.ts` exporta un `createClient()` que instancia un cliente de browser válido con las env vars públicas.
- [ ] `app/lib/supabase/server.ts` exporta un `createClient()` async que instancia un cliente de servidor válido, integrado con cookies vía `next/headers`.
- [ ] `.env.template` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (vacías), junto a `SUPABASE_DB_PASSWORD`.
- [ ] `.env.local` contiene los valores reales y no está versionado (`.env*` ya en `.gitignore`).
- [ ] Se confirmó manualmente que ambos clientes conectan de verdad contra `https://wzwdyvdongczmqnhcavw.supabase.co` (sin error de credenciales/red), y no queda código de prueba temporal en el repo.
- [ ] `npm run build` compila sin errores.
- [ ] Ninguna pantalla existente (`/`, `/games`, `/about`, `/salon`, `/auth`, `/juegos/[id]`) cambia de comportamiento: este spec no conecta ninguna UI a Supabase todavía.

## Decisiones tomadas y descartadas

- **Alcance limitado a "cablear" el cliente, sin auth ni tablas.** Decisión explícita del usuario: se prefiere una base de integración lista, y dejar auth, puntajes y Salón de la Fama real para specs futuros dedicados, en vez de un spec grande que mezcle infraestructura con features.
- **Se usa `@supabase/ssr` en vez de solo `@supabase/supabase-js`.** Aunque este spec no implementa auth, `@supabase/ssr` es el patrón recomendado por Supabase para Next.js App Router (maneja cookies de sesión en Server Components/Route Handlers) y evita tener que reescribir el cliente de servidor cuando se implemente auth en un spec futuro.
- **Clave pública obtenida vía MCP en vez de pedida al usuario.** Decisión explícita del usuario: usar `mcp__supabase__get_project_url` y `get_publishable_keys` en vez de pedirle que las pegue manualmente, igual que se hizo para conocer el estado del proyecto (`list_tables` confirmó que `public` está vacío).
- **Sin middleware de refresco de sesión.** No hay sesión que mantener todavía en este spec (no hay login); se agregará cuando se implemente auth.
- **Sin tabla ni endpoint de prueba permanente.** Se prefiere verificar la conexión con un paso manual descartable en vez de dejar una tabla o ruta de diagnóstico en el código final, para no ensuciar el repo con algo que no es parte de ninguna feature real.

## Riesgos identificados

- **Clave pública vs. legacy anon key.** El proyecto expone tanto una clave `publishable` (`sb_publishable_...`) como una `anon` legacy (JWT). Si `@supabase/ssr`/`@supabase/supabase-js` en las versiones instaladas no soportan aún el formato `sb_publishable_...`, hay que usar la legacy `anon` como fallback.
- **Cambios de Next.js 16 en `cookies()`/`next/headers`.** Este repo pinea una versión de Next.js con cambios respecto al training data; si la API para leer/escribir cookies en Route Handlers cambió, `app/lib/supabase/server.ts` debe ajustarse según lo que diga `node_modules/next/dist/docs/` en el momento de implementar, no según lo asumido aquí.
