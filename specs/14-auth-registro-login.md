# 14 — Registro, login y sesión con Supabase Auth

**Estado:** Aprobado
**Depende de:** SPEC 04, SPEC 06
**Fecha:** 2026-08-26

**Objetivo:** Conectar `/auth` a Supabase Auth de verdad (email/contraseña, Google, GitHub e invitado), reflejar la sesión en el nav y en el guardado de puntajes, con verificación de email y recuperación de contraseña.

## Alcance

**Incluye:**

- Registro e inicio de sesión reales con email + contraseña usando Supabase Auth, reemplazando el `submit` mock de `app/auth/page.tsx`.
- Login con Google y con GitHub vía OAuth de Supabase, conectando los botones `◆ GOOGLE` / `▣ GITHUB` que hoy son decorativos. Requiere un route handler de callback (`app/auth/callback/route.ts`) que intercambia el código de OAuth por una sesión.
- Modo invitado: el botón `JUGAR COMO INVITADO` navega sin crear cuenta (a `/games` o de vuelta a la página anterior). Un invitado puede jugar cualquier juego con normalidad.
- Verificación de email obligatoria: tras registrarse con email/contraseña, Supabase exige confirmar el correo antes de poder iniciar sesión (comportamiento default de Supabase Auth). `/auth` muestra un estado "Revisa tu correo" tras el registro, sin iniciar sesión automáticamente.
- Recuperación de contraseña: enlace "¿Olvidaste tu contraseña?" en la pestaña de login que dispara `resetPasswordForEmail`, y una página nueva `app/auth/reset-password/page.tsx` donde, con el token del email, el usuario define una nueva contraseña.
- Middleware de Next.js (`middleware.ts` en la raíz + `app/lib/supabase/middleware.ts`) que refresca la sesión en cada request server-side, siguiendo el patrón `@supabase/ssr` para App Router. Antes de escribirlo, revisar `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` y `node_modules/next/dist/docs/01-app/02-guides/authentication.md` por si Next.js 16 difiere del patrón estándar de Supabase.
- `app/components/nav.tsx` refleja el estado de sesión: sin sesión, el botón `Iniciar Sesión` como hoy; con sesión, un avatar + username (de `user_metadata`) + botón/opción de `Cerrar sesión`, tanto en el nav de escritorio como en el panel móvil.
- Avatar: si el usuario viene de OAuth (Google/GitHub) se usa la foto real (`avatar_url` en `user_metadata`); si no (registro por email/contraseña), se genera un avatar simple con la inicial del username (círculo con letra, sin servicio externo).
- Username: capturado en el campo `Usuario` del formulario de registro y guardado como `user_metadata.username` (sin tabla `profiles` nueva; sin garantía de unicidad a nivel de base de datos).
- `/auth` redirige a `/` si se visita con una sesión ya activa (no tiene sentido mostrar el formulario de login).
- Integración con el guardado de puntajes en `app/juegos/[id]/jugar/game-player.tsx` (juego Asteroides, el único con guardado real hoy): si el jugador no tiene sesión al presionar `GUARDAR PUNTUACIÓN`, el modal de fin de partida cambia a mostrar el formulario de login/registro inline (sin perder el score en memoria); al autenticarse ahí mismo, se procede a guardar el puntaje con la sesión recién creada. Si ya hay sesión, el input de nombre se sigue mostrando pero precargado con el username de la cuenta, editable antes de guardar (mismo comportamiento de hoy, con valor por defecto distinto).
- Logout: cierra la sesión de Supabase Auth y actualiza el nav sin recargar la página completa.

**No incluye (fuera de alcance de este spec):**

- Tabla `profiles` en la base de datos ni garantía de unicidad de username a nivel de esquema. Si dos cuentas eligen el mismo username, ambas coexisten (el username es solo metadata, no una clave).
- Cambiar el modelo de datos de `scores` (spec 06). `player_name` sigue siendo el mismo campo de texto; este spec solo cambia qué valor lo precarga.
- Vincular históricamente los puntajes ya guardados por invitados/nombres libres con una cuenta real.
- Autenticación real para juegos distintos de Asteroides (los demás siguen siendo reproductor mock sin guardado real, spec 06 sin cambios).
- Edición de perfil (cambiar username, avatar personalizado subido, cambiar email) fuera del registro inicial.
- Roles, permisos o áreas administrativas.
- Rate limiting o captcha sobre registro/login (queda documentado como riesgo).
- Eliminar cuenta.
- Configurar los proveedores OAuth (Client ID/Secret de Google y GitHub) en el dashboard de Supabase — es un paso manual fuera del código, documentado como riesgo/bloqueo posible.

## Modelo de datos

Este spec no crea tablas nuevas. Usa las tablas internas de Supabase Auth (`auth.users`) y la metadata del usuario:

```js
// user_metadata guardado al registrarse por email/contraseña
{
  username: "px_kai"; // texto libre, sin unicidad garantizada
}
// Para OAuth (Google/GitHub), Supabase ya puebla user_metadata con
// full_name / name y avatar_url automáticamente.
```

`app/lib/supabase/middleware.ts` exporta una función `updateSession(request)` que crea un cliente de servidor con `createServerClient` de `@supabase/ssr`, llama a `supabase.auth.getUser()` para refrescar el token, y devuelve la `NextResponse` con las cookies actualizadas. `middleware.ts` en la raíz la invoca desde el `matcher` estándar (excluyendo assets estáticos).

Variable de entorno nueva: `NEXT_PUBLIC_SITE_URL` (URL base del sitio, usada para construir las URLs de `redirectTo` en OAuth y en `resetPasswordForEmail`), documentada en `.env.template`.

## Plan de implementación

1. **Configuración en Supabase.** Confirmar (vía `mcp__supabase__search_docs` / dashboard) que la confirmación de email está activada por defecto en el proyecto. Documentar en el propio spec o en un comentario de PR que Google y GitHub OAuth requieren configurarse manualmente en el dashboard de Supabase (Client ID/Secret) antes de que esos botones funcionen en producción; sin esa configuración, el código queda listo pero los botones fallan con un error controlado.
2. **Middleware de sesión.** Revisar la documentación vigente de Next.js 16 sobre `middleware.ts` y `cookies()`. Crear `app/lib/supabase/middleware.ts` (`updateSession`) y `middleware.ts` en la raíz. Verificar manualmente que las cookies de sesión se refrescan navegando entre rutas tras iniciar sesión.
3. **Formulario de login/registro real.** Reescribir `app/auth/page.tsx`: `submit` llama a `supabase.auth.signInWithPassword` o `supabase.auth.signUp` (con `options.data.username` y `options.emailRedirectTo`) según la pestaña activa, con estados de carga y error visibles en el formulario. Tras `signUp`, mostrar el estado "Revisa tu correo" en vez de redirigir. Si hay sesión activa al montar, redirigir a `/`.
4. **OAuth Google/GitHub.** Conectar los botones a `supabase.auth.signInWithOAuth({ provider: "google" | "github", options: { redirectTo: ... } })`. Crear `app/auth/callback/route.ts` que recibe el `code`, llama a `exchangeCodeForSession` y redirige a `/`.
5. **Recuperación de contraseña.** Agregar el enlace "¿Olvidaste tu contraseña?" en la pestaña de login que llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth/reset-password })`. Crear `app/auth/reset-password/page.tsx` que lee la sesión de recuperación y llama a `supabase.auth.updateUser({ password })`.
6. **Modo invitado.** Conectar `JUGAR COMO INVITADO` a una navegación simple (sin llamada a Supabase) hacia `/games`.
7. **Nav con estado de sesión.** En `app/components/nav.tsx`, leer la sesión (cliente de browser + `onAuthStateChange`) y renderizar avatar + username + `Cerrar sesión` cuando hay sesión, tanto en el nav de escritorio como en el panel móvil. Implementar el avatar generado (inicial del username) como componente reutilizable.
8. **Integración con guardado de puntajes.** En `app/juegos/[id]/jugar/game-player.tsx`, cuando `isAsteroids` y el modal de fin de partida está visible: si no hay sesión, mostrar el formulario de login/registro inline en vez del input de nombre; al loguearse ahí, continuar con el flujo de guardado existente usando el username de la cuenta como valor por defecto (editable) del campo de nombre.
9. **Build y verificación manual.** Correr `npm run build`. Probar manualmente: registro por email (llega el correo de confirmación, no se puede loguear sin confirmar), login tras confirmar, logout, recuperación de contraseña de punta a punta, `/auth` redirige a `/` con sesión activa, modo invitado navega sin cuenta, y el flujo de guardar puntaje en Asteroides como invitado dispara el login inline y guarda tras autenticarse. Los botones de Google/GitHub se prueban solo si ya están configurados en el dashboard de Supabase; si no lo están, se documenta como pendiente en vez de bloquear el resto del spec.

## Criterios de aceptación

- [ ] Registrarse con email + contraseña crea una cuenta real en Supabase Auth y muestra el estado "Revisa tu correo" sin iniciar sesión automáticamente.
- [ ] Intentar iniciar sesión antes de confirmar el email falla con un mensaje de error claro.
- [ ] Tras confirmar el email (click en el link recibido), iniciar sesión con esas credenciales funciona y redirige a `/`.
- [ ] Los botones GOOGLE y GITHUB disparan `signInWithOAuth` y, si el proveedor está configurado en el dashboard, completan el login vía `app/auth/callback/route.ts`.
- [ ] `JUGAR COMO INVITADO` navega a `/games` sin crear ninguna sesión ni cuenta.
- [ ] "¿Olvidaste tu contraseña?" envía el correo de recuperación; el link lleva a `/auth/reset-password`, donde definir una nueva contraseña permite loguearse con ella después.
- [ ] Visitar `/auth` con sesión activa redirige a `/` en vez de mostrar el formulario.
- [ ] Con sesión activa, el nav (escritorio y panel móvil) muestra avatar + username + opción de cerrar sesión en vez del botón `Iniciar Sesión`.
- [ ] El avatar es la foto real para cuentas OAuth y un avatar generado con la inicial del username para cuentas de email/contraseña.
- [ ] Cerrar sesión desde el nav vuelve a mostrar el botón `Iniciar Sesión` sin recargar la página completa.
- [ ] Jugar Asteroides como invitado y presionar `GUARDAR PUNTUACIÓN` muestra el login/registro inline dentro del modal, sin perder el score obtenido; al autenticarse ahí, el puntaje se guarda en `scores` como en el spec 06.
- [ ] Jugar Asteroides con sesión activa y presionar `GUARDAR PUNTUACIÓN` precarga el campo de nombre con el username de la cuenta, editable antes de guardar.
- [ ] Navegar entre rutas tras iniciar sesión mantiene la sesión reflejada correctamente gracias al middleware (sin parpadeos de "no logueado").
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
- [ ] El resto de juegos del catálogo (mock) y `/salon` para juegos distintos de Asteroides siguen funcionando exactamente igual que antes, sin requerir sesión.

## Decisiones tomadas y descartadas

- **Un solo spec grande en vez de dividir en varios.** Decisión explícita del usuario tras plantear la opción de dividir en spec de auth básico + OAuth + integración con leaderboard. Se acepta el riesgo de un plan de implementación más largo.
- **`user_metadata.username` en vez de tabla `profiles`.** Decisión explícita del usuario: más simple, sin necesidad de una tabla nueva ni de sincronizarla con `auth.users`. Se acepta que el username no sea único a nivel de base de datos.
- **Verificación de email obligatoria (comportamiento default de Supabase) en vez de permitir uso sin confirmar.** Decisión explícita del usuario, prioriza evitar cuentas basura sobre fricción de onboarding.
- **Recuperación de contraseña con página dedicada `/auth/reset-password`** en vez de un modal dentro de `/auth`. Decisión explícita del usuario; sigue el patrón estándar de Supabase (el link del email necesita una URL propia).
- **Login inline en el modal de fin de partida para invitados** en vez de redirigir a `/auth` y volver. Decisión explícita del usuario: evita perder el score en memoria y el viaje de ida y vuelta entre rutas.
- **Middleware de refresco de sesión (`middleware.ts`)** en vez de manejar todo solo en el cliente. Decisión explícita del usuario, siguiendo el patrón recomendado por Supabase para App Router y cerrando el punto que el spec 04 había dejado pendiente.
- **Avatar generado con la inicial del username para cuentas sin foto**, en vez de un ícono genérico fijo o un servicio externo (Gravatar/DiceBear). Decisión explícita del usuario: evita una dependencia de red externa y mantiene el estilo propio del sitio.
- **`player_name` se sigue guardando como texto editable** (precargado con el username) en vez de forzarlo inmutable al username de la cuenta. Decisión explícita del usuario: mantiene flexibilidad tipo arcade clásico sin romper el modelo de datos de spec 06.
- **Sin tabla `profiles`, sin edición de perfil, sin roles.** Fuera de alcance explícito para mantener el spec centrado en el flujo de auth en sí.

## Riesgos identificados

| Riesgo                                                                                                                             | Mitigación                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google/GitHub OAuth requieren Client ID/Secret configurados manualmente en el dashboard de Supabase, fuera del control del código. | El código se implementa y queda listo; si no está configurado, el botón muestra el error que devuelva Supabase en vez de romper el resto del flujo. Se documenta como pendiente post-implementación. |
| Cambios de Next.js 16 en `middleware.ts` / `cookies()` respecto al training data.                                                  | Revisar `node_modules/next/dist/docs/` (middleware y authentication) antes de escribir el middleware, como exige `AGENTS.md`.                                                                        |
| Username sin unicidad (dos cuentas con el mismo `user_metadata.username`).                                                         | Aceptado explícitamente; no bloquea el registro. Si se vuelve un problema, un spec futuro puede migrar a tabla `profiles` con constraint único.                                                      |
| Sin rate limiting ni captcha en registro/login.                                                                                    | Queda documentado como riesgo conocido, igual que el insert público de `scores` en spec 06; mitigación queda para un spec futuro si se detecta abuso.                                                |
| Emails de confirmación/recuperación pueden caer en spam o no configurarse el remitente en Supabase.                                | Verificación manual del flujo completo en el plan de implementación antes de dar el spec por cerrado.                                                                                                |

## Lo que **no** está en este spec

- Tabla `profiles`, unicidad de username, edición de perfil.
- Roles, permisos, áreas administrativas.
- Vincular puntajes históricos de invitados a una cuenta.
- Auth real para juegos distintos de Asteroides.
- Configuración de los proveedores OAuth en el dashboard de Supabase (paso manual, no código).
- Rate limiting / captcha, eliminar cuenta.

Cada uno de estos, si se necesita, va en su propio spec futuro.
