# 01 — MVP: pantallas visuales de Arcade Vault

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-08-12

**Objetivo:** Implementar la parte visual de las 5 pantallas de Arcade Vault (Biblioteca, Detalle de juego, Reproductor, Autenticación, Salón de la Fama) como rutas reales de Next.js App Router, replicando fielmente el diseño de `references/templates/`, sin lógica de juego real.

## Alcance

**Incluye:**
- 5 rutas navegables con el diseño exacto de las plantillas de referencia:
  - `/` — Biblioteca (grid de juegos, buscador, chips de categoría).
  - `/juegos/[id]` — Detalle de juego (portada, descripción, stats, leaderboard).
  - `/juegos/[id]/jugar` — Reproductor (HUD, marco CRT, arena decorativa, modal de fin de juego).
  - `/auth` — Autenticación (tabs iniciar sesión / crear cuenta, invitado, social ghost buttons).
  - `/salon` — Salón de la Fama (podio, tabla de puntuaciones, tabs por juego).
- Componente `Nav` global (con menú móvil) montado en `app/layout.tsx`, visible en las 5 pantallas.
- Footer global (`© 2026 ARCADE VAULT · v2.6.0`) en `app/layout.tsx`.
- Archivo `app/data/games.ts` (o equivalente) con la información ficticia de juegos, jugadores y la función `seededScores`, documentado como reemplazo temporal de una futura fuente de datos real (base de datos).
- Interacciones puramente visuales sin persistencia: navegación entre pantallas, búsqueda/filtrado de juegos en Biblioteca (client-side sobre el mock), tabs de categoría/juego en Salón, tabs de auth, apertura del modal de fin de juego en el Reproductor.
- Estados visuales de la pantalla Reproductor (HUD con valores fijos de ejemplo, pausa, modal de fin de juego) sin bucle de juego real.

**No incluye (fuera de alcance de este spec):**
- Cualquier lógica de juego real (colisiones, controles, físicas, puntaje dinámico). El `setInterval` que sube el puntaje solo en `reproductor.jsx` NO se porta.
- Autenticación real: no hay backend, no hay validación de credenciales, no hay sesión persistida. Los formularios de login/registro y el guardado de puntaje en el Reproductor no tienen efecto (no navegan como "logueado" ni escriben en ningún lado).
- Persistencia de cualquier tipo (localStorage, cookies, base de datos). Todo el estado de la sesión de usuario es visual/estático.
- Conexión real a una base de datos: `app/data` es un mock que simula esa futura fuente.
- Integraciones sociales reales (Google/GitHub) — los botones quedan como placeholders sin funcionalidad.
- Responsive/accesibilidad más allá de lo que ya define `styles.css` (que se porta tal cual).
- Botón de créditos con lógica de negocio — el contador "CRÉDITOS · 03" queda fijo, sin funcionalidad.

## Modelo de datos

Se crea `app/data/games.ts` (mock, TypeScript) portando `references/templates/data.jsx` tal cual:

```ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;   // clase CSS del cover generado (cover-bricks, cover-tetro, ...)
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: string[];       // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

Un comentario en el archivo deja explícito que este mock reemplaza temporalmente una futura fuente de datos real (API/base de datos).

## Plan de implementación

1. **Datos mock.** Crear `app/data/games.ts` con `GAMES`, `CATS`, `PLAYERS` y `seededScores`, tipado en TypeScript, portado desde `references/templates/data.jsx`.
2. **Nav global.** Crear `app/components/nav.tsx` (Client Component) portando `nav.jsx`: logo, links activos por ruta (`usePathname`), contador de créditos fijo, botón de auth (siempre en estado "no logueado", enlaza a `/auth`), menú móvil con backdrop. Montarlo en `app/layout.tsx` junto con el footer, reemplazando el `<div id="root">{children}</div>` actual por `<Nav /><main className="av-main">{children}</main><footer>...</footer>`.
3. **Biblioteca (`/`).** Reemplazar `app/page.tsx` por la pantalla portada de `biblioteca.jsx`: hero, buscador y chips de categoría (estado de cliente), grid de `GameCard` con tilt on mousemove, estado vacío "NO HAY RESULTADOS". Cada card enlaza a `/juegos/[id]` con `next/link`.
4. **Detalle (`/juegos/[id]`).** Página portando `detalle.jsx`: portada, tags, descripción, stat-strip, botones "JUGAR AHORA" (→ `/juegos/[id]/jugar`) y "VOLVER AL VAULT" (→ `/`), leaderboard lateral con `seededScores`. Si el `id` no existe en `GAMES`, usar `notFound()` de Next.js.
5. **Reproductor (`/juegos/[id]/jugar`).** Página/Client Component portando `reproductor.jsx` como maqueta estática: HUD con valores de ejemplo fijos (jugador "INVITADO", puntaje, vidas, nivel), botones PAUSA/FIN/SALIR (FIN abre el modal de fin de juego; PAUSA alterna el overlay "EN PAUSA" visual), marco CRT con la arena decorativa (nave, enemigos, grid animados por CSS, sin lógica). Sin `setInterval` que incremente puntaje. El modal de fin de juego muestra un puntaje de ejemplo fijo y el botón "GUARDAR PUNTUACIÓN" solo cambia al estado visual "guardado" (toast), sin persistir nada.
6. **Auth (`/auth`).** Página portando `auth.jsx`: tabs "INICIAR SESIÓN" / "CREAR CUENTA", campos de formulario controlados en estado local (sin submit real: `preventDefault` sin acción), botón "JUGAR COMO INVITADO" y botones sociales ghost sin funcionalidad — ninguno navega ni cambia el estado del Nav.
7. **Salón de la Fama (`/salon`).** Página portando `salon.jsx`: tabs por juego (estado de cliente), podio (top 3 con `seededScores`), tabla completa de puntuaciones. La fila "tu mejor marca" del template (que depende de `user`) se omite, ya que no hay sesión de usuario en este MVP.
8. **Verificación visual.** Levantar `next dev` y recorrer las 5 rutas comparando contra las plantillas y `Arcade Vault.html` en desktop y viewport móvil (breakpoints 840px / 900px / 720px definidos en `globals.css`).

`app/globals.css` ya contiene el CSS completo de `styles.css` portado (verificado, sin cambios pendientes) y no requiere modificaciones en este spec.

## Criterios de aceptación

- [ ] `/` muestra la Biblioteca: buscador y chips filtran el grid de juegos en el cliente; cada card navega a `/juegos/[id]`.
- [ ] `/juegos/[id]` muestra portada, descripción, stats y leaderboard del juego; "JUGAR AHORA" navega a `/juegos/[id]/jugar`; un `id` inexistente devuelve 404.
- [ ] `/juegos/[id]/jugar` muestra el HUD, el marco CRT con la arena decorativa animada y el botón PAUSA alterna el overlay "EN PAUSA"; no hay ningún puntaje que suba solo.
- [ ] En `/juegos/[id]/jugar`, el botón FIN abre el modal de fin de juego con puntaje fijo de ejemplo; "GUARDAR PUNTUACIÓN" cambia a estado "guardado" sin persistir nada; "JUGAR DE NUEVO" y "VOLVER AL VAULT" funcionan.
- [ ] `/auth` muestra los tabs de iniciar sesión / crear cuenta y todos los campos son editables; ningún botón (submit, invitado, social) deja al usuario "logueado" en el Nav.
- [ ] `/salon` muestra el podio y la tabla completa de puntuaciones, con tabs que cambian el juego seleccionado.
- [ ] El componente Nav aparece en las 5 rutas, resalta el link activo según la ruta actual, y el menú móvil (hamburguesa) abre/cierra el panel lateral por debajo de 840px de ancho.
- [ ] El footer con `© 2026 ARCADE VAULT · v2.6.0` aparece en las 5 rutas.
- [ ] `app/data/games.ts` exporta `GAMES`, `CATS`, `PLAYERS` y `seededScores`, usado por Biblioteca, Detalle y Salón.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Rutas reales de Next.js en vez de SPA con hash routing.** El template original (`app.jsx`) usa una sola pantalla con estado y `location.hash`. Se descarta ese patrón porque el proyecto ya es Next.js App Router y las rutas de archivo son la forma nativa de navegar; además se gana soporte de URL directa, back/forward del navegador y `notFound()`.
- **Reproductor sin simulación de puntaje.** El template hace subir el puntaje con `setInterval` cada 220ms como relleno visual de "partida en curso". Se descarta explícitamente por instrucción del usuario ("no hay que implementar ningún juego"): se mantiene el HUD y la arena decorativa, pero con valores estáticos.
- **Formularios de auth sin efecto.** Se decide que ningún formulario (login, registro, invitado, social) cambie el estado de sesión del Nav ni navegue como si hubiera logueo real, para no simular una función que no existe todavía.
- **Datos mock en `app/data`, no en `lib/`.** Decisión explícita del usuario: se ubica ahí porque a futuro esa carpeta será reemplazada por llamadas a una base de datos real.
- **Fila "tu mejor marca" del Salón se omite.** Dependía de un `user` logueado que no existe en este MVP (no hay persistencia de sesión); se retoma en un spec futuro de autenticación real.
- **Nav y footer viven en `app/layout.tsx`.** Igual que el template los monta una sola vez alrededor de toda la app, evitando duplicarlos en cada página.
