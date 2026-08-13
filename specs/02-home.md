# 02 — Home (landing page)

**Estado:** Aprobado
**Depende de:** SPEC 01
**Fecha:** 2026-08-13

**Objetivo:** Implementar la pantalla Home de Arcade Vault en la ruta raíz `/`, replicando el diseño de `references/templates/home-about/home.jsx`, moviendo la Biblioteca actual a `/games` y agregando los links "Inicio" y "Acerca de" al Nav.

## Alcance

**Incluye:**
- Nueva pantalla Home en `/`: hero con silueta de formas pixeladas flotantes y CTAs, sección "¿POR QUÉ ARCADE VAULT?" (4 feature cards), sección "JUEGOS DISPONIBLES AHORA" (mini-rail con los primeros 6 juegos de `GAMES`), sección de stats (juegos / partidas / ranking), sección "ACTIVIDAD EN VIVO" (ticker de puntuaciones recientes + top 5 jugadores del día), sección de precios (plan único gratuito + FAQ) y CTA final — todas con animación `reveal` al hacer scroll, portadas de `home.jsx`.
- La Biblioteca actual (grid de juegos con buscador y chips), hoy en `/`, se muda a `/games` sin cambios de comportamiento.
- Actualización del componente `Nav` (`app/components/nav.tsx`): se agregan los links "Inicio" (→ `/`) y "Acerca de" (→ `/about`) tanto en el menú de escritorio como en el panel móvil; el link "Biblioteca" pasa a apuntar a `/games`; el logo sigue apuntando a `/`.
- Actualización de los enlaces internos que hoy asumen que `/` es la Biblioteca: "VOLVER A LA BIBLIOTECA" en `/salon` y "VOLVER AL VAULT" en `/juegos/[id]` pasan a apuntar a `/games`.
- Se agrega a `app/globals.css` el CSS de Home portado tal cual de `styles.css`: los bloques `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING`.

**No incluye (fuera de alcance de este spec):**
- La pantalla About / Contacto (`about.jsx`). El link "Acerca de" del Nav queda apuntando a `/about`, que no existe todavía: hasta que se implemente en un spec futuro, esa ruta muestra la página 404 por defecto de Next.js. Esto es una decisión explícita del usuario, no un descuido.
- Cualquier dato nuevo o real para las secciones de actividad/stats: se portan como contenido estático de ejemplo, igual que en el template.
- Cambios de comportamiento en la Biblioteca más allá de su nueva URL (`/games`); el componente y su lógica de filtrado no se modifican.

## Modelo de datos

No se introducen estructuras nuevas. La Home reutiliza `GAMES` (para el mini-rail y para calcular el número de juegos de la sección de stats vía `GAMES.length`) y datos estáticos de ejemplo (ticker de actividad reciente y top 5 jugadores), portados literalmente del template, ya que sus nombres de juego (CAÍDA, GLOTÓN, INVASORES, ROCAS, BLOQUE BUSTER, SERPENTINA) ya coinciden con los títulos reales en `app/data/games.ts`.

## Plan de implementación

1. **CSS de Home.** Agregar a `app/globals.css` los bloques `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/styles.css`, sin modificar el resto del archivo.
2. **Mover Biblioteca a `/games`.** Crear `app/games/page.tsx` con el contenido íntegro del actual `app/page.tsx` (buscador, chips, grid, `GameCard`), sin cambios de lógica.
3. **Nueva Home en `/`.** Reemplazar `app/page.tsx` por la pantalla portada de `home.jsx` como Client Component (usa `IntersectionObserver` para las animaciones `reveal`): hero con siluetas SVG decorativas y CTAs ("EXPLORAR JUEGOS" → `/games`, "CREAR CUENTA" → `/auth`), feature grid, mini-rail de juegos (`GAMES.slice(0, 6)`, cada card enlaza a `/juegos/[id]`, botón "VER TODOS LOS JUEGOS" → `/games`), stats (cantidad de juegos calculada con `GAMES.length`), actividad en vivo (ticker + top jugadores, botón "VER SALÓN" → `/salon`), precios (CTA → `/auth`) y CTA final ("INSERTAR MONEDA" → `/games`).
4. **Nav.** En `app/components/nav.tsx`: agregar link "Inicio" (`href="/"`) antes de "Biblioteca" en ambos menús (escritorio y panel móvil); cambiar el `href` de "Biblioteca" a `/games` y ajustar la detección de ruta activa (`isBiblioteca` pasa a basarse en `/games` y `/juegos/`); agregar link "Acerca de" (`href="/about"`) después de "Salón de la Fama"; el logo mantiene `href="/"`.
5. **Enlaces internos que asumían `/` como Biblioteca.** Cambiar `href="/"` por `href="/games"` en el botón "VOLVER A LA BIBLIOTECA" de `app/salon/page.tsx` y en el botón "VOLVER AL VAULT" de `app/juegos/[id]/page.tsx`.
6. **Verificación visual.** Levantar `next dev` y recorrer `/` (Home), `/games` (Biblioteca), comprobar que el Nav resalta "Inicio" en `/` y "Biblioteca" en `/games` y `/juegos/[id]`, que "Acerca de" navega a una 404, y que los botones "VOLVER..." desde Salón y Detalle llevan a `/games`. Revisar en desktop y viewport móvil (breakpoints ya definidos en `globals.css`).

## Criterios de aceptación

- [ ] `/` muestra la pantalla Home completa: hero con CTAs, feature grid, mini-rail de juegos, stats, actividad en vivo, precios y CTA final, con animaciones `reveal` al hacer scroll.
- [ ] La sección de stats de Home muestra el número de juegos calculado desde `GAMES.length`, no un valor fijo.
- [ ] `/games` muestra la Biblioteca (buscador, chips, grid) con el mismo comportamiento que tenía antes en `/`.
- [ ] El Nav muestra 4 links — Inicio, Biblioteca, Salón de la Fama, Acerca de — en escritorio y en el panel móvil, y resalta el link correspondiente a la ruta activa (Inicio en `/`, Biblioteca en `/games` y `/juegos/[id]`).
- [ ] El link "Acerca de" apunta a `/about` y hoy muestra la página 404 de Next.js (no existe la ruta todavía).
- [ ] Desde la Home, "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" navegan a `/games`; "CREAR CUENTA" y el CTA de precios navegan a `/auth`; "VER SALÓN" navega a `/salon`; cada card del mini-rail navega a `/juegos/[id]`.
- [ ] En `/salon`, "VOLVER A LA BIBLIOTECA" navega a `/games`. En `/juegos/[id]`, "VOLVER AL VAULT" navega a `/games`.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Home ocupa la raíz `/` y la Biblioteca se muda a `/games`.** Decisión explícita del usuario: coincide con el Nav del template, donde "Inicio" y "Biblioteca" son links distintos: no tendría sentido que ambos apuntaran a la misma ruta.
- **"Acerca de" se agrega al Nav ya, aunque `/about` no exista.** Decisión explícita del usuario. Hasta que se escriba un spec futuro para About, el link lleva a la 404 por defecto de Next.js; no se implementa una página placeholder para evitar trabajo que se descartaría.
- **Stats calcula "juegos" desde `GAMES.length` en vez de copiar "12+" del template.** El template usa un número fijo mayor al de juegos reales del mock (8). Se decide calcularlo para que la Home no muestre una cifra inconsistente con el resto del sitio.
- **Ticker de actividad y top jugadores se portan como arrays estáticos, igual que el template.** No se generan con `seededScores` porque el template ya usa nombres de juego y marcas de tiempo relativas ("hace 2 min") con una narrativa específica pensada para la landing; generarlos dinámicamente añadiría complejidad sin beneficio para esta pantalla.
- **About queda explícitamente fuera de este spec.** Se implementará en un spec futuro dedicado, para no mezclar dos pantallas con secciones y un formulario (contacto) claramente distintos en un mismo spec.
