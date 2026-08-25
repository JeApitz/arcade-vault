# Estado móvil por ruta

Memoria del agente `mobile-porter`. Se actualiza en CADA corrida, sobre la ruta trabajada.
Rúbrica fija: M1–M12 (ver definición completa en `.claude/agents/mobile-porter.md`).

## Estado

| Ruta    | M1  | M2  | M3  | M4  | M5  | M6  | M7  | M8  | M9  | M10 | M11 | M12 | Fecha      | Notas                             |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------- | --------------------------------- |
| home    | ✅  | ✅  | ✅  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### home`                    |
| games   | ✅  | ✅  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### games`                   |
| detalle | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### detalle`                 |
| jugar   | ✅  | ⬛  | ✅  | ✅  | ✅  | ✅  | ⬛  | ✅  | ✅  | ✅  | ⬛  | ✅  | 2026-08-24 | ver `### jugar`                   |
| salon   | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### salon`                   |
| about   | ✅  | ⬛  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### about`                   |
| auth    | ✅  | ⬛  | ✅  | ✅  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | ⬛  | 2026-08-24 | ver `### auth`                    |
| chrome  | ✅  | ⬛  | ✅  | ✅  | ⬛  | ✅  | ✅  | ⬛  | ⬛  | ✅  | ⬛  | ✅  | 2026-08-24 | primera corrida, ver `### chrome` |
| pwa     | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ⬛  | ✅  | ⬛  | 2026-08-24 | ver `### pwa`                     |

Leyenda: ✅ cumple · 🟡 en curso · ⬜ pendiente · ⬛ n/a para esta ruta · ❌ bloqueado (anotar en Pendientes).

## Escala de breakpoints canónica

`--bp-sm: 480px` · `--bp-md: 720px` · `--bp-lg: 900px` · `--bp-xl: 1100px`, sembrados como custom properties en `app/globals.css:1-13`. Breakpoints ad-hoc aún sin migrar (uno o más ya se tocaron dentro de la ruta trabajada en cada corrida, se van tachando aquí):

- 480px (`app/globals.css:1880`, `:2169` migrar cuando se toque su ruta), 520px (`:2169`? revisar, `:2527`), 600px (`:2235`), 720px (`:1680`, `:1820`, `:2296`, `:2309` — ruta `jugar`/`detalle`/`salon`), 820px (`:2802`), **840px (`app/globals.css:278` — MIGRADO a `chrome` en la corrida 2026-08-24, ver `### chrome`)**, 900px (`:925`, `:2402`, `:2622`, `:2898`), 980px (`:2164`), 1100px (`:2230`).

## Invariantes (no romper)

1. No se añade light mode. El sitio es dark-only.
2. `body{overflow-x:hidden}` (`app/globals.css:42`) es deuda, no solución — se retira ruta por ruta, no de golpe.
3. `resetKey`/`skinId` nunca entran en el `key` de `<engine.Canvas>`.
4. El CSS del sitio es a mano (`app/globals.css`); no se introducen utilidades Tailwind nuevas fuera de lo ya usado en `layout.tsx`.
5. Todo `@media` nuevo usa la escala canónica de arriba, nunca un valor ad-hoc nuevo.

## Registro de decisiones

- **Reversión parcial de `specs/11-controles-tactiles-movil.md:33,103`.** Ese spec fijó `userScalable:false` en el `viewport` global para evitar zoom accidental en los botones táctiles del reproductor. `mobile-porter` lo revierte parcialmente (M12): el bloqueo de zoom pasa a vivir solo en el segmento `jugar` (`app/juegos/[id]/jugar/page.tsx`), porque bloquear zoom en `/about`/`/salon` es un costo de accesibilidad sin beneficio ahí. Hecho en la corrida `chrome` del 2026-08-24.
- Ese mismo spec declaró fuera de alcance "el rediseño del layout general de `.player-hud`" y la orientación landscape (`:41-42`) — ese es exactamente el trabajo que cierra `mobile-porter jugar` (M8), aún pendiente.

## Pendientes y riesgos conocidos

- Sin verificación en navegador/dispositivo real para ninguna ruta: `mobile-porter` solo audita por lectura de código y aritmética a mano (Fase 5.5 de su definición). Válido para todas las filas marcadas ✅ hasta que alguien lo confirme visualmente, incluida `chrome`.
- 8 de 9 breakpoints ad-hoc (todos menos 840px) siguen sin migrar a la escala canónica; se migran solo dentro de la ruta que se trabaje cada corrida. `salon` añadió un breakpoint **nuevo** en `480px` (escala canónica `--bp-sm`, valor literal por convención del archivo — ver Registro de decisiones de `chrome`), no migró ninguno de los 9 ad-hoc existentes.
- **Resuelto en la corrida `games` (2026-08-24):** `.chip` era compartida entre `salon` (`.hall-tabs`) y `games` (`.av-chips`). La corrida `salon` había subido su piso de legibilidad/tap-target solo dentro de `.hall-tabs .chip` para no adelantar trabajo de `games`. Al trabajar `games`, se generalizó el fix al `.chip` global (`app/globals.css:612`) y se retiró el override duplicado en `.hall-tabs .chip` (ver `### games`).
- **Resuelto en la corrida `home` (2026-08-24):** las dos discrepancias de mapa de rutas anotadas por `salon`/`detalle` (`.top-row` y `.lb-link` listadas bajo esas rutas en la Fase 4 del agente, pero solo usadas en `app/home-content.tsx`) se auditaron y corrigieron en esta corrida. Ver `### home`.
- **Tercera discrepancia en el mapa de rutas de `mobile-porter` (Fase 4):** la tabla del agente lista `.highlight-row` y `.contact-grid` como bloques de `home`, pero ninguna de las dos se usa en `app/home-content.tsx` — ambas viven bajo el comentario `/* ===== ABOUT PAGE ===== */` de `app/globals.css` (`:3022`/`:3118` tras esta corrida) y se renderizan solo en `app/about/page.tsx` (fuera de lectura de esta corrida). La corrida `home` (2026-08-24) no las tocó; quedan para la corrida de `about`.
- **Resuelto en la corrida `pwa` (2026-08-24):** `app/manifest.ts` creado; ver `### pwa`. `about` y `auth` se resolvieron en la corrida 2026-08-24 (ver `### about` y `### auth`).
- **Resuelto en la corrida `auth` (2026-08-24):** el gotcha que había dejado `about` (`.field label` global en 10px --mono, sin generalizar por no ser `about` la ruta dueña de `.field`) se cerró: `auth` subió el piso a 12px directamente en la regla global `.field label` (`app/globals.css:1748`), y se retiró el override ahora-redundante `.contact-form .field label` que había dejado `about` (documentado en su lugar en vez de borrado silencioso). El gotcha de `.btn.ghost` base (~38px, bajo el piso de M3) sigue **sin generalizar**: `auth` lo resolvió scoped a `.auth-card .btn.ghost` (mismo patrón que `.about-contact .btn.ghost`), porque `.btn.ghost` es un botón de sistema compartido por `chrome`/`jugar`/`detalle` y ninguna corrida de `mobile-porter` lo posee explícitamente en el mapa Fase 4; generalizarlo requeriría auditar todos sus usos en una corrida futura (o nunca, si el patrón scoped basta).
- **M9 no se aplicó a los canvases de `tetris`** (`app/juegos/[id]/jugar/tetris-canvas.tsx`): a diferencia de asteroides/arkanoid/snake, sus dos `<canvas>` no usan `style={{width:"100%",height:"100%"}}` — se renderizan a tamaño de atributo fijo (300×600 / 120×120) dentro de un wrapper `.tetris-stage` escalado con `transform: scale()` calculado por `ResizeObserver` (`tetris-canvas.tsx:79-89`). El enunciado de M9 apunta específicamente al patrón `width/height:100%`, que tetris no usa; queda pendiente evaluar si conviene una variante de DPR-fix compatible con `transform: scale` (multiplicar por `dpr * scale` en vez de solo `dpr`) en una corrida futura de `jugar`, sin tocar la lógica del motor.
- **`.pc-stamp` (`app/globals.css`, sección `pricing-grid` de `home`)** — decorativo, `position:absolute; top:-18px; right:-18px; transform:rotate(14deg)` sobre `.price-card`. No se pudo verificar por lectura de código si su bounding box rotado excede el padding de `32px` de `.home-section` en 320px; el riesgo es bajo (offset de 18px dentro de un padding de 32px) pero no se descarta sin render real. Queda como riesgo conocido de bajo impacto, no corregido esta corrida (arreglarlo a ciegas podría requerir rediseñar el stamp, fuera de alcance de `mobile-porter`).

## Por ruta

### chrome

**Hallazgos (antes de corregir):**

- **M1** `app/globals.css:271-291` (nav pre-corrida) — a ≤840px la barra mostraba a la vez `.auth-btn` ("Iniciar Sesión", ~145px con padding) y el `.hamburger`, sin que `.links`/`.coin-counter` liberaran espacio suficiente; a 320–390px el total de children + gaps superaba el viewport y solo `body{overflow-x:hidden}` (`app/globals.css:42`, ahora línea 71) lo ocultaba en vez de resolverlo.
- **M3** `app/globals.css:274-276` (hamburger, pre-corrida) — hereda `.btn` (`padding: 12px 20px`, `font-size: 10px`), altura efectiva ≈ 12·2 + 10·1.4 ≈ 38px, por debajo de 44px bajo `pointer:coarse`. `app/globals.css:310-316` (enlaces del panel, pre-corrida) — `padding: 14px 12px` + `font-size: 11px` ≈ 43px, también por debajo del piso.
- **M4** `app/components/nav.tsx:85` (pre-corrida, ahora línea ~112) — `CRÉDITOS · 03` dentro del panel móvil, visible con el panel abierto, usaba `--pixel` a `fontSize: 9` (bajo el piso de 10px de M4). El `.links a` de la barra (`app/globals.css:224-233`, `font-size: 9px`) queda `display:none` a ≤840px, por lo que no es visible en móvil y se deja fuera de alcance.
- **M6** `app/globals.css:220` (`.av-nav`, sticky) y `:293` (`.av-mobile-panel`, fixed) no tenían `env(safe-area-inset-*)`; tampoco `app/layout.tsx:24-29` declaraba `viewportFit`.
- **M7** `app/components/nav.tsx:50-56` (hamburger, pre-corrida) — sin `aria-expanded`/`aria-controls`; sin cierre por `Escape`; sin scroll-lock del `body`; `app/globals.css:293-309` (`.av-mobile-panel`, pre-corrida) cerraba solo por `transform: translateX(100%)`, sin `inert`/`visibility:hidden`, quedando enfocable con teclado estando "cerrado"; `.auth-btn` duplicado en barra (`nav.tsx:47-49`) y panel (`nav.tsx:79-81`) visibles simultáneamente en desktop→mobile.
- **M10** Ningún `@media (prefers-reduced-motion: reduce)` en todo `app/globals.css` (confirmado antes de sembrar cimientos).
- **M12** `app/layout.tsx:24-29` aplicaba `maximumScale:1, userScalable:false` al `viewport` global, afectando `/about`, `/salon`, etc., no solo `jugar`.

**Correcciones:**

- Cimientos compartidos (Fase 3, una sola vez): escala de breakpoints `--bp-sm/md/lg/xl` y tokens `--safe-t/r/b/l` en `app/globals.css:1-38`; bloque `@media (prefers-reduced-motion: reduce)` global en `app/globals.css:40-51`; `viewportFit: "cover"` en `app/layout.tsx` (`viewport` export).
- `app/globals.css:271-306` — `.av-nav .auth-btn { display:none }` dentro de `@media (max-width: 840px)`, ya que el control vive en el panel; retira el ancho que causaba el desborde M1. Padding del nav en ese breakpoint usa `max(12/16px, var(--safe-*))` (M6).
- `app/globals.css:308-313` — nuevo `@media (hover: none) and (pointer: coarse) { .av-nav .hamburger { min-width/height: 44px } }` (M3).
- `app/globals.css:351-374` — `.av-mobile-panel` con `padding-top/right/bottom: max(…, var(--safe-*))` (M6); `.av-mobile-panel a` con `min-height: 44px; display:flex; align-items:center` (M3).
- `app/globals.css:399-420` — nuevo `.av-footer` (reemplaza el `style={{}}` inline de `app/layout.tsx`), con `padding` usando `max(…, var(--safe-b/l/r))` y un `@media (max-width: 480px)` con padding/letter-spacing reducidos.
- `app/components/nav.tsx` — `aria-expanded`, `aria-controls="av-mobile-panel"` en el hamburger; `id="av-mobile-panel"` + `inert={!open}` en el `<aside>` (M7, panel cerrado no enfocable); `useEffect` que cierra con `Escape` y bloquea `document.body.style.overflow` mientras `open` (M7); `fontSize: 9 → 10` en "CRÉDITOS · 03" del panel (M4).
- `app/juegos/[id]/jugar/page.tsx` — nuevo `export const viewport` de segmento con `maximumScale:1, userScalable:false, viewportFit:"cover"` (M12, moviendo el bloqueo de zoom fuera del layout raíz).

**Aritmética de ancho (M1, tras corregir), `.av-nav` a ≤840px:**

- Padding: `12px + 16px` por lado ⇒ contenido = viewport − 32px.
- A 320px: contenido = 288px. Children visibles con `gap:24px` (2 gaps = 48px): `logo` (`logo-mark` 28px + `gap` 10px + `logo-text` ≈100px con Press Start 2P 12px + letter-spacing 0.12em, 12 caracteres) ≈ 138px; `spacer` (flex:1, min 0); `hamburger` ≥44px (min-width nuevo). Total ≈ 138 + 48 + 44 = 230px ≤ 288px → cabe, con ~58px de margen.
- A 360px/390px: contenido 328px/358px, aún más margen. `.auth-btn` (antes ~145px) ya no está en la barra a este breakpoint, que era la causa del desborde.
- `.av-mobile-panel` a 320px: `width: min(320px, 86vw)` = min(320, 275.2) = 275.2px; padding lateral 20px cada lado ⇒ contenido 235.2px, suficiente para el texto más largo ("Salón de la Fama", `--pixel` 11px).

**Greps de regresión (alcance: nav/footer/layout tocados por `chrome`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — sin coincidencias dentro de los bloques de nav/footer (chrome no usa grid).
- `[0-9]vh` en alturas de layout — sin coincidencias en nav/footer (las 2 únicas del archivo, `:1227` y `:2056`, son de `jugar`/`home`, fuera de esta corrida).
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero en CSS tocado; el único hallazgo estaba inline en `nav.tsx` y ya se corrigió (9→10).
- `position:\s*(fixed|sticky)` sin safe-area — `.av-nav` (sticky) y `.av-mobile-panel`/`.av-mobile-backdrop` (fixed) ahora usan `var(--safe-*)`; el resto de `position:fixed` del archivo pertenece a otras rutas.

### jugar

**Hallazgos (antes de corregir):**

- **M1** `app/globals.css` `.touch-controls .actions`/`.dpad` (pre-corrida, sin `flex-wrap`) — los botones de acción de `asteroides` (`▲ IMPULSO`, `● DISPARO`, `app/juegos/[id]/jugar/engines.ts:61-62`) y `tetris` (`▼ BAJAR`, `⟳ ROTAR`, `⤓ CAER`, `:74-78`) tienen etiquetas largas que exceden por mucho el `min-width:52px` de `.touch-btn`; en una sola fila sin wrap, dpad+actions de asteroides sumaban ≈382px (ver aritmética abajo) contra ≈256px disponibles a 320px — desbordaba el viewport horizontalmente dentro de `.touch-controls`, con `.crt { overflow:hidden }` como único "freno" visual en vez de una solución real.
- **M2** n/a — ningún `grid-template-columns` en píxeles dentro del bloque `jugar` (`.player-hud > div:first-child` ya usaba `1fr 1fr`); marcado `⬛`.
- **M3** `app/globals.css:1215-1218` (`.hud-skins .btn`, pre-correga) — `padding: 8px 12px` sobre `.btn` (`font-size:10px`) da alto efectivo ≈30px, bajo 44px en `pointer:coarse`. `.hud-actions .btn`/`.modal .actions .btn`/`.modal .input-row .btn` heredan `.btn` base (`padding:12px 20px`) ≈38px, también bajo el piso.
- **M4** `app/globals.css` (pre-correga): `.hud-skins .btn` `font-size:9px` (línea ~1217), `.crt-bottom` `font-size:8px` (base) + `font-size:7px` en `@media (max-width:480px)`, `.touch-controls .touch-hint` `font-size:9px`, `.touch-btn` `font-size:9px` — los 4 en `--pixel`, bajo el piso de 10px. `app/juegos/[id]/jugar/game-player.tsx:144` — `"PULSA REANUDAR PARA CONTINUAR"` en `--mono` a `fontSize:11`, bajo el piso de 12px para texto de lectura corrida.
- **M5** `app/globals.css:1246` (`.crt-screen`, pre-correga) — `max-height: 78vh` sin fallback `dvh`; en móviles con barra de navegador dinámica, `100vh`/`78vh` se calcula sobre el viewport grande y puede dejar contenido (hud/touch-controls) fuera de la parte visible real.
- **M6** `.touch-controls` (línea ~1304) sin `env(safe-area-inset-bottom)` pese a estar nombrado explícitamente en la rúbrica M6 como control cercano al borde inferior en landscape fullscreen. `.modal-bd` (línea ~1522, `position:fixed; inset:0`) con `padding:20px` fijo, sin `env(safe-area-inset-*)`.
- **M8** Sin ningún `@media (orientation: landscape)` en todo `app/globals.css` antes de esta corrida — en landscape móvil bajo (p. ej. iPhone SE acostado, ≈375px de alto), `.crt-screen { max-height:78vh }` ≈ 290px de juego más `.player-hud` (con labels de skin en su propia línea) y `.touch-controls` fácilmente empujaban contenido fuera de la pantalla visible sin scroll utilizable dentro del `.crt`.
- **M9** Los 3 canvases de resolución fija escalados por CSS (`asteroids-canvas.tsx`, `snake-canvas.tsx`, `arkanoid-canvas.tsx`, todos con `style={{width:"100%",height:"100%"}}`) fijaban `canvas.width/height` en píxeles lógicos (800×600 / 600×600) sin considerar `devicePixelRatio`, produciendo un backing store borroso en pantallas hi-dpi (la mayoría de móviles). `tetris-canvas.tsx` usa un mecanismo distinto (`transform: scale`, no `width/height:100%`) — ver nota en Pendientes, fuera de alcance de esta corrida.
- **M10** Ya cubierto por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en la corrida `chrome` (`app/globals.css:49-58`); no requería trabajo adicional en `jugar` (`.toast-saved`'s `caret` infinito y cualquier otra animación quedan cubiertas por el selector universal `*`).
- **M12** Ya resuelto en la corrida `chrome` (`app/juegos/[id]/jugar/page.tsx` con `export const viewport` de segmento); sin cambios esta corrida.

**Correcciones:**

- `app/globals.css` — `.touch-controls`: `flex-wrap: wrap; row-gap: 10px;` + `padding` con `max(0px, var(--safe-b))` en el borde inferior (M1 + M6); `.touch-controls .dpad`/`.actions`: `flex-wrap: wrap` (defensa adicional para que ni siquiera un solo grupo pueda desbordar). `.crt` no tiene altura fija, así que el `overflow:hidden` no recorta la fila extra al envolver (documentado inline).
- `app/globals.css` — pisos M4 a 10px: `.hud-skins .btn`, `.crt-bottom` (base, y se retiró el override a `7px` de `@media (max-width:480px)`, dejando solo el `display:none` del span del medio para ahorrar espacio), `.touch-controls .touch-hint`, `.touch-btn`. `app/juegos/[id]/jugar/game-player.tsx:144` — `fontSize: 11 → 12` en el texto de pausa.
- `app/globals.css` — nuevo `@media (hover: none) and (pointer: coarse) { .hud-skins .btn, .hud-actions .btn, .modal .actions .btn, .modal .input-row .btn { min-height: 44px; } }` (M3).
- `app/globals.css:1259-1260` — `.crt-screen { max-height: 78vh; max-height: 78dvh; }` (M5, fallback inmediatamente antes).
- `app/globals.css` — `.modal-bd` con `padding: max(20px, var(--safe-t)) max(20px, var(--safe-r)) max(20px, var(--safe-b)) max(20px, var(--safe-l))` (M6).
- `app/globals.css` — nuevo `@media (orientation: landscape) and (max-height: 500px)` (M8): compacta `.av-player`/`.player-hud` (fila única, oculta el label "Skin"), reduce `.crt` padding/`border-radius`, `.crt-screen { max-height: 60vh; max-height: 60dvh; }` y ajusta márgenes de `.crt-bottom`/`.touch-controls` para que el juego y los controles táctiles quepan sin empujar nada fuera de la pantalla visible.
- `app/juegos/[id]/jugar/asteroids-canvas.tsx`, `snake-canvas.tsx`, `arkanoid-canvas.tsx` — en el `useEffect` de montaje, antes de instanciar el motor: `canvas.width = cssWidth * dpr; canvas.height = cssHeight * dpr; canvas.getContext("2d")?.scale(dpr, dpr);` con `dpr = window.devicePixelRatio || 1` (M9). `resetKey`/`skinId` siguen fuera del `key` del canvas (invariante 3, sin tocar).
- `app/juegos/[id]/jugar/arkanoid-engine.ts` (4 sitios: `handleMouseMove`, `handleClick`, `handleTouchMove`, `handleTouchStart`) — `this.canvas.width`/`this.canvas.height` → `CANVAS_W`/`CANVAS_H` (constantes lógicas ya existentes, 800×600) en el cálculo de `scaleX`/`scaleY` que convierte coordenadas de puntero/touch a espacio de juego. **Necesario** porque tras el fix de M9 `this.canvas.width` deja de ser 800 (pasa a `800 * dpr`); sin este ajuste el paddle se movería a `dpr` veces la velocidad real del cursor/dedo, rompiendo el control del juego. No es un cambio de mecánica ni de física — el mapeo sigue siendo "posición del puntero en CSS px → posición lógica 0–800", solo cambia la fuente del denominador de un valor mutable a la constante que siempre representó ese mismo ancho lógico.

**Aritmética de ancho (M1), `.touch-controls` a 320/360/390px:**

- Cadena de paddings hasta `.touch-controls`: `.av-player` `16px` (≤720px) + `.crt` `8px` (≤480px) + `.touch-controls` `8px` ⇒ 32px por lado. A 320px: contenido disponible = 320 − 64 = 256px. A 360/390px (aún dentro de `.crt{padding:8px}` porque ese breakpoint es `≤480px`): 360−64=296px / 390−64=326px.
- Estimación de ancho de `--pixel` (Press Start 2P) a `font-size:10px`: ≈0.7em/carácter + `letter-spacing:0.08em` ⇒ ≈7.8px por carácter (glifo o espacio), consistente con el ratio implícito usado en la corrida `chrome` para el logo del nav.
- **Asteroides** — dpad (`◀`,`▶`, 1 carácter c/u, `min-width:52px` domina sobre contenido): `52+52+10(gap)=114px`. actions (`▲ IMPULSO`, `● DISPARO`, 9 caracteres c/u ⇒ 9×7.8+24(padding)≈94px cada uno): `94+94+10=198px`. Sin wrap: `114+16(gap entre grupos)+198=328px` > 256px → **desborda** a 320px (y sigue desbordando a 360px: 328>296). Con `flex-wrap:wrap` en `.touch-controls`: dpad (114px) y actions (198px) caen en filas separadas, cada una muy por debajo de 256px (≈142px y ≈58px de margen respectivamente) → cabe en las 3 anchuras auditadas.
- **Tetris** — dpad (`◀`,`▶`,`▼ BAJAR`; el tercero con 7 caracteres ⇒ 7×7.8+24≈79px, los otros 2 a `min-width:52px`): `52+52+79+2×10(gap)=203px`. actions (`⟳ ROTAR` 7 car.≈79px, `⤓ CAER` 6 car.≈71px): `79+71+10=160px`. Sin wrap: `203+16+160=379px` > 256px → desborda. Con wrap: fila dpad 203px (≈53px de margen a 256px, ≈93px a 360px) y fila actions 160px (holgada) → cabe.
- **Snake** — dpad (`▲`,`▼`,`◀`,`▶`, todas `min-width:52px`, sin `actions`): `52×4+3×10=238px` en una sola fila, `< 256px` (margen ≈18px a 320px) → ya cabía sin wrap, el fix no lo afecta negativamente.
- **Arkanoid** — `mode:"drag"`, solo renderiza `.touch-hint` (texto centrado, `margin:0 auto`), sin botones — no aplica el cálculo anterior; el texto envuelve libremente dentro de 256px sin riesgo de overflow horizontal.

**Greps de regresión (alcance: `.av-player`/`.crt*`/`.player-hud`/`.hud-*`/`.touch-*`/`.tetris-*`/`.modal*` en `app/globals.css`, más los 5 archivos `.tsx`/`.ts` de `jugar` tocados):**

- `grid-template-columns:[^;]*[0-9]px` sin override — cero coincidencias en el bloque `jugar` (líneas 1159–1650 tras esta corrida); las únicas coincidencias del archivo con `px` pertenecen a `.hall-detail`/`.hall-table` (`detalle`/`salon`, ya auditadas en sus propias corridas).
- `[0-9]vh` en alturas de layout — 2 coincidencias en el bloque `jugar`, ambas con fallback `dvh` inmediatamente después (`.crt-screen` línea 1259, `.crt-screen` dentro del nuevo `@media landscape` línea 2115); la 3ª coincidencia del archivo (`min-height: calc(100vh - 60px)`) es de `home`, fuera de alcance.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero coincidencias en el bloque `jugar` (1159–1650) ni en el nuevo bloque M8 (2077–2126); confirmado con `sed`+`grep` línea por línea.
- `position:\s*(fixed|sticky)` sin safe-area — única coincidencia del bloque `jugar` es `.modal-bd` (línea 1549), ahora con `env(safe-area-inset-*)` en los 4 lados.

**`git diff --stat` de esta corrida:** `app/globals.css`, `app/juegos/[id]/jugar/game-player.tsx`, `app/juegos/[id]/jugar/asteroids-canvas.tsx`, `app/juegos/[id]/jugar/snake-canvas.tsx`, `app/juegos/[id]/jugar/arkanoid-canvas.tsx`, `app/juegos/[id]/jugar/arkanoid-engine.ts` — ninguna otra ruta cambió (`app/juegos/[id]/jugar/page.tsx` y `app/juegos/[id]/jugar/tetris-*` no se tocaron; los demás archivos con cambios sin commitear en el árbol de trabajo pertenecen a corridas previas de `chrome`/`salon`/`detalle`).

**Gotchas:**

- `tetris-canvas.tsx`/`tetris-engine.ts` quedaron **fuera de alcance de M9** por su mecanismo distinto de escalado (`transform: scale`, no `width/height:100%`) — ver nota detallada en `## Pendientes y riesgos conocidos`.
- El fix de M9 en `arkanoid-engine.ts` fue el único punto de esta corrida donde tocar "backing store sizing" obligó a tocar una línea de lógica del motor (conversión de coordenadas de input). Se documentó explícitamente por qué era necesario y por qué no es un cambio de mecánica (ver Correcciones) — se prefirió esto a dejar el control del paddle roto en pantallas hi-dpi.
- `npm run lint`/`npm run build` limpios sobre los archivos tocados; los errores preexistentes de lint (`game-player.tsx:18` `setState en efecto`, `hall-of-fame.tsx:18`, y varios bajo `references/templates/**`/`references/started-games/**`) ya estaban documentados en la corrida `chrome` y no se tocaron.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano (incluida la estimación de ancho de glifo de Press Start 2P, que es una aproximación, no una medición real); queda pendiente que alguien lo confirme visualmente, especialmente el layout landscape de M8 y la nitidez real de M9 en un dispositivo hi-dpi.

**`git diff --stat` de esta corrida:** `app/components/nav.tsx`, `app/globals.css`, `app/juegos/[id]/jugar/page.tsx`, `app/layout.tsx` — ninguna otra ruta cambió.

**Gotchas:**

- El breakpoint `840px` del nav se dejó como ad-hoc (no se migró a `--bp-md: 720px`): el nav necesita colapsar antes que el resto del sitio porque logo + acciones no caben ya a 840px con el contenido actual; migrarlo a 720px encogería aún más el espacio disponible en el rango 721–840px. Documentado en el comentario junto al `@media` (`app/globals.css:274-277`).
- `npm run lint` reporta errores preexistentes no relacionados (p. ej. `app/juegos/[id]/jugar/game-player.tsx:18` "setState en efecto", y varios en `references/templates/**`/`references/started-games/**`); confirmado con `git stash` que ya existían antes de esta corrida. Ningún archivo tocado por `chrome` introduce errores nuevos de lint.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano; queda pendiente que alguien lo confirme visualmente.

### salon

**Hallazgos (antes de corregir):**

- **M2** `app/globals.css:1859` (pre-corrida, `.hall-table .th`/`.tr`, `grid-template-columns: 70px 1fr 1fr 140px`) — override en `@media (max-width: 720px)` (línea ~1934, `50px 1fr 90px 90px`) ya existía y cubre ≤480px, pero ninguna celda `1fr` (`.pl`, JUGADOR) tenía `min-width:0` + `text-overflow:ellipsis`; a 320px la aritmética (ver abajo) deja solo ~2px al track flexible, suficiente para desbordar sin la elipsis.
- **M4** `app/globals.css:1816` (pre-corrida) `.podium-slot .date` en `--mono` a `11px`, bajo el piso de 12px de M4. `app/globals.css:1890` (pre-corrida) `.hall-table .tr.you-label` en `--pixel` a `9px` (clase sin uso actual en `hall-of-fame.tsx`, pero vive en el bloque CSS de esta ruta). `app/salon/hall-of-fame.tsx:93` (pre-corrida) — "CAMPEÓN" del podio en `--pixel` con `style={{ fontSize: 9 }}`, bajo el piso de 10px.
- **M3** `app/globals.css:612-620` (`.chip`, compartida con `games`) — `padding: 12px 14px` + `font-size: 9px` ≈ altura efectiva 12·2+9·1.4≈36.6px, bajo 44px en `pointer:coarse`; usada en `.hall-tabs` de esta ruta.
- **M1** Consecuencia directa de M2 sin resolver: sin `min-width:0`+elipsis, el nombre de jugador en `.hall-table .tr .pl` podía forzar el track 1fr por encima del espacio calculado a 320/360/390px, empujando la fila fuera del viewport (mitigado hoy solo por la deuda `body{overflow-x:hidden}`, `app/globals.css:71`).
- **M5/M6** Sin hallazgos: `.av-hall`/`.hall-table`/`.podium` no usan `vh` ni `position: fixed|sticky` — confirmado por grep dentro del bloque `1727-2040`.
- **M10** Sin hallazgo nuevo: la animación `rise` de `.hall-table .tr` (`app/globals.css:1919-1924`) ya queda cubierta por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en la corrida `chrome` (`app/globals.css:47-58`).

**Correcciones:**

- `app/salon/hall-of-fame.tsx:93` — `fontSize: 9 → 10` en la etiqueta "CAMPEÓN" del podio (M4).
- `app/globals.css` (`.podium-slot .date`) — `font-size: 11px → 12px` (M4).
- `app/globals.css` (`.hall-table .tr.you-label`) — `font-size: 9px → 10px` (M4; clase actualmente sin uso en el componente, corregida por consistencia del bloque CSS de la ruta).
- `app/globals.css` (tras `.hall-tabs`) — nuevo `.hall-tabs .chip { font-size: 10px }` (M4) y `@media (hover: none) and (pointer: coarse) { .hall-tabs .chip { min-height: 44px; display:inline-flex; align-items:center } }` (M3), **scoped a `.hall-tabs`** para no tocar `.chip` global (compartida con la ruta `games`, aún pendiente).
- `app/globals.css` (tras la declaración de `.hall-table .th, .tr`) — nuevo `.hall-table .th > div, .hall-table .tr > div { min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis }` (M2/M1).
- `app/globals.css` — nuevo `@media (max-width: 480px) { .hall-table .th, .hall-table .tr { grid-template-columns: 34px 1fr 70px 60px; gap: 6px; padding: 8px 8px; } }`, breakpoint nuevo en la escala canónica (`--bp-sm`), agregado después del bloque `@media (max-width:720px)` existente; no se cambió `font-size` en este bloque (queda heredado en 12px del bloque de 720px, respetando el piso de M4). Reduce el padding/gap y angosta RANGO/FECHA para devolverle espacio real al nombre del jugador en vez de dejar la elipsis como único recurso.

**Aritmética de ancho (M1/M2), `.hall-table` a 320/360/390px:**

- `.av-hall` padding a ≤720px: `16px` por lado (regla preexistente) ⇒ contenido a 320px = `288px`, a 360px = `328px`, a 390px = `358px`.
- **Antes de la corrida** (`grid-template-columns: 50px 1fr 90px 90px`, `gap:10px`, `padding:10px 12px`, `box-sizing:border-box` global `app/globals.css:61-63`): disponible para tracks = `288 − 2(border) − 24(padding) = 262px`; menos `3×10=30px` de gaps y `50+90+90=230px` fijos ⇒ el track `1fr` (JUGADOR) queda en `262−30−230 = 2px` a 320px. Sin `min-width:0`, el `min-content` del nombre podía exceder ese track y desbordar la fila.
- **Tras la corrida**, con el nuevo `@media (max-width:480px)` (`grid-template-columns: 34px 1fr 70px 60px`, `gap:6px`, `padding:8px 8px`): disponible = `288 − 2 − 16 = 270px`; menos `3×6=18px` de gaps y `34+70+60=164px` fijos ⇒ track `1fr` = `270−18−164 = 88px` a 320px, `128px` a 360px, `158px` a 390px — espacio utilizable real para el nombre del jugador, no solo un track de 2px salvado por elipsis.
- `min-width:0` en `.hall-table .th > div/.tr > div` garantiza que ningún contenido de celda (incluidas las columnas fijas `RANGO`/`PUNTUACIÓN`/`FECHA`, donde `PUNTUACIÓN` en `--pixel` con `letter-spacing:0.16em` puede exceder su columna de `70px`) empuje el ancho total de la fila más allá de los `288/328/358px` de contenido — el exceso se recorta con `text-overflow:ellipsis` dentro del track ya calculado, sin generar scroll horizontal de página.
- `.podium` ya tenía `grid-template-columns: 1fr` en `@media (max-width:720px)` (preexistente, sin valores px) ⇒ a 320/360/390px cada `.podium-slot` ocupa el 100% del contenido de `.av-hall`, sin desborde.
- `.hall-tabs` (`display:flex; flex-wrap:wrap`, preexistente) con el chip más largo del catálogo actual ("DUELO PIXEL", `app/data/games.ts:107`) ≈ `11 chars × ~7px + letter-spacing 0.12em×10px×11 + padding 28px ≈ 118px`, cabe holgado en 288px y de sobra en 328/358px; sin riesgo de desborde de fila individual.

**Greps de regresión (alcance: `app/globals.css:1727-2040`, bloques de `salon`, y `app/salon/hall-of-fame.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — únicas coincidencias son `.hall-table` (línea base + overrides en 720px y en el nuevo 480px); ambas cubiertas.
- `[0-9]vh` en alturas de layout — cero coincidencias en el bloque de `salon`.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.tr.you-label` y "CAMPEÓN" corregidos a 10px); `.chip` global (9px, fuera del scope de `salon`) sigue en 9px pero ya no aplica al piso porque `.hall-tabs .chip` lo sobreescribe a 10px.
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en el bloque de `salon` (ni `.av-hall`, ni `.hall-table`, ni `.podium` usan `position:fixed|sticky`).

**`git diff --stat` de esta corrida:** `app/globals.css`, `app/salon/hall-of-fame.tsx` — ninguna otra ruta cambió (los cambios previos de la corrida `chrome` en `app/components/nav.tsx`, `app/layout.tsx`, `app/juegos/[id]/jugar/page.tsx` seguían sin commitear pero no se tocaron en esta corrida).

**Gotchas:**

- `.chip` es compartida entre `salon` y `games`; se evitó tocar la regla global para no adelantar la corrida de `games` — ver nota en Pendientes.
- El mapa de rutas del agente asigna `.top-row` a `salon`, pero esa clase pertenece a `home` (`app/home-content.tsx`); no se tocó — ver nota en Pendientes.
- `.hall-table .tr.you-label` no tiene uso actual en `hall-of-fame.tsx` (posible resto de una función "resaltar mi puntaje" no implementada); se corrigió su `font-size` por consistencia del bloque CSS pero no se investigó ni se agregó la funcionalidad (fuera de alcance de `mobile-porter`).
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano; queda pendiente que alguien lo confirme visualmente.

### home

**Hallazgos (antes de corregir):**

- **M2** `app/globals.css:2788-2795` (pre-corrida, `.top-row`, `grid-template-columns: 36px 1fr auto auto`) — la 2ª columna (`1fr`) corresponde a `.tp-bar` (`app/globals.css:2799-2801`, `position:absolute`), que no consume espacio real de grid (los ítems `absolute` no contribuyen al sizing de tracks); la columna que de verdad necesita ser flexible es la 3ª (`.tp-p`, nombre de jugador), que estaba en `auto` (sin límite superior real bajo presión de espacio) y sin `min-width:0`/ellipsis. `app/globals.css:2740` (`.tk-p`, celda `1fr` real de `.tick-row`) tampoco tenía `min-width:0`/ellipsis pese a ser la columna correcta.
- **M4** `--pixel` bajo 10px: `app/globals.css:2264` `.hero-scroll` (9px), `app/globals.css:2698` `.lb-link` (9px), `app/globals.css:2669` `.live-led` (8px, clase sin uso actual en `home-content.tsx`), `app/globals.css:2901` `.pc-label` (9px, vía clase `.pixel` en `page.tsx`), `app/globals.css:2935` `.pc-tag` (9px). `--mono` bajo 12px: `app/globals.css:2493` `.mini-cat` (10px), `app/globals.css:2557` `.stat-s` (11px), `app/globals.css:2752` `.tk-t` (11px, hereda `font-family` de `.tick-row`), `app/globals.css:2960` `.pc-foot` (11px). `app/home-content.tsx:349,381` — párrafos "AÚN NO HAY..." en clase `.mono` con `fontSize: 11` inline.
- **M1** Consecuencia directa de M2 sin resolver en `.top-row`/`.tick-row`: sin `min-width:0`+ellipsis, un nombre de jugador largo en `.tp-p` (columna `auto`, no flexible) o `.tk-p` podía forzar el ancho de la fila por encima del contenido disponible, con `body{overflow-x:hidden}` (deuda, `app/globals.css:71`) como único freno.
- **M3** `app/globals.css:2690-2707` (`.lb-link`, pre-corrida) — `padding:6px 10px` + `font-size:9px` ⇒ alto efectivo ≈6·2+9·1.4≈24.6px, muy por debajo de 44px bajo `pointer:coarse`; es un `<Link>` real ("VER SALÓN →", `app/home-content.tsx:374`), no decorativo.
- **M5** `app/globals.css:2195` (`.home-hero`, pre-corrida) — `min-height: calc(100vh - 60px)` sin fallback `dvh`; en móviles con barra de navegador dinámica el hero podía calcular su alto sobre el viewport grande, dejando contenido (CTA, scroll hint) fuera de la parte visible real al cargar.
- **M6** Sin hallazgos: grep dentro del bloque `home` (`app/globals.css:2193-2960`) no encontró `position: fixed|sticky` — la ruta no tiene contenido fijo/sticky propio (el nav sticky ya se cubrió en `chrome`).
- **M10** Sin hallazgo nuevo: `.hero-scroll .arrow` (`animation: bounce...infinite`), `.home-silos .silo` (`animation: float...infinite`), `.live-led span` (`animation: pulse-led...infinite`) son las únicas animaciones infinitas del bloque `home`; las 3 ya quedan cubiertas por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en `chrome` (`app/globals.css:49-58`, selector universal `*`). `.tick-row{animation:tickin 360ms ease-out forwards}` no es infinita (una sola pasada), no requiere cobertura adicional.

**Correcciones:**

- `app/globals.css` (`.home-hero`) — `min-height: calc(100vh - 60px); min-height: calc(100dvh - 60px);` (M5, fallback inmediatamente antes).
- `app/globals.css` — pisos M4 a 10px en `--pixel`: `.hero-scroll`, `.lb-link`, `.live-led` (sin uso actual, corregida por consistencia del bloque CSS de la ruta, igual que hizo `salon` con `.tr.you-label`), `.pc-label`, `.pc-tag`. Pisos M4 a 12px en `--mono`: `.mini-cat`, `.stat-s`, `.tk-t`, `.pc-foot`. `app/home-content.tsx:349,381` — `fontSize: 11 → 12` en los 2 párrafos "AÚN NO HAY...".
- `app/globals.css` (`.top-row`) — `grid-template-columns: 36px 1fr auto auto → 36px auto 1fr auto` (mueve el track flexible de la columna de `.tp-bar`, decorativa y `absolute`, a la de `.tp-p`, el nombre real); `.tp-p` gana `min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis` (M2/M1).
- `app/globals.css` (`.tk-p`) — mismo tratamiento `min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis` (M2/M1); ya estaba en el track `1fr` correcto, no requirió cambio de `grid-template-columns`.
- `app/globals.css` — nuevo `@media (hover: none) and (pointer: coarse) { .lb-link { min-height: 44px; display:inline-flex; align-items:center } }` (M3).

**Aritmética de ancho (M1/M2) a 320/360/390px:**

- `.home-section` no tiene override de `padding` en ningún `@media` (preexistente, sin cambios esta corrida) ⇒ `padding: 0 32px` fijo ⇒ contenido a 320px = `256px`, a 360px = `296px`, a 390px = `326px`. `.activity-grid` a ≤900px ya es `1fr` (preexistente) ⇒ `.activity-card` ocupa el contenido completo de `.home-section`.
- **`.tick-row`** (dentro de `.ticker`/`.activity-card`, sin padding propio de `.activity-card`, border `1px` × 2 ≈ 2px): a ≤520px `grid-template-columns: 1fr auto` (preexistente), `gap:12px` (columna, heredado del `gap:12px` base; la media query solo overridea `row-gap`), `padding: 11px 18px` (18px × 2 = 36px). Contenido de fila a 320px = `256 − 2 − 36 = 218px`. `.tk-s` (auto, ej. `+45.320`, `--pixel` 11px sin `letter-spacing` extra ⇒ estimado ≈7.5px/carácter × 7 ≈ 53px) deja `218 − 53 − 12(gap) = 153px` para `.tk-p` (1fr, nombre del jugador) — suficiente para un nombre truncado con elipsis en vez de desbordar. A 360/390px: `296−2−36=258px` / `326−2−36=288px` de contenido, con aún más margen para `.tk-p`.
- **`.top-row`** (dentro de `.top-list`, padding `10px 18px 18px` ⇒ 18px × 2 = 36px lateral): contenido a 320px = `256 − 36 = 220px`. Tras el fix, columnas: `36px` (`.tp-rk`) + `auto` (`.tp-bar`, `position:absolute`, **no contribuye** al sizing de tracks per spec de CSS Grid ⇒ efectivamente `0px`) + `1fr` (`.tp-p`) + `auto` (`.tp-s`, ej. `45.320`, `--pixel` 11px ⇒ ≈6 dígitos × 7.5px ≈ 45px), gaps `3 × 10px = 30px`. Espacio fijo = `36 + 0 + 45 + 30 = 111px` ⇒ `.tp-p` (1fr) = `220 − 111 = 109px` a 320px, `149px` a 360px (contenido 260px), `179px` a 390px (contenido 290px) — espacio real utilizable para el nombre, con `min-width:0`+ellipsis como respaldo ante un nombre aún más largo. **Antes de la corrida** (sin swap, `.tp-p` en columna `auto`), esa misma cantidad de espacio (~109px a 320px) no limitaba el track — un nombre más largo que eso simplemente empujaba el ancho total de la fila (y de `.top-list`) más allá de los 220px de contenido disponible, generando el desborde real que `body{overflow-x:hidden}` ocultaba en vez de resolver.
- `.feature-grid` (1 columna a ≤520px, preexistente) y `.mini-rail` (2 columnas a ≤600px, preexistente) no requieren cambios: a 320px, `.mini-rail` con `gap:16px` da `(256−16)/2=120px` por `.mini-card`, sin mínimo declarado que lo exceda.
- `.pricing-grid` (1 columna a ≤900px, preexistente): `.price-card` ocupa `256px`; `padding:32px 28px` deja `256 − 2(border) − 56 = 198px` de contenido interno, suficiente para `.pc-amount-n` ("$0", `--pixel` 64px, ≈2 caracteres ≈90px) y `.pc-list li` (mono 13px, envuelve normalmente sin `white-space:nowrap`).

**Greps de regresión (alcance: `app/globals.css:2193-2965`, bloques de `home`, y `app/home-content.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — única coincidencia en el bloque es `.top-row` (`36px auto 1fr auto`, tras el fix); no requiere un `@media` adicional a ≤480px porque el track fijo (`36px`) es pequeño y el resto ya es flexible/auto con ellipsis (ver aritmética arriba, mismo criterio que usó `games` para `.av-grid`).
- `[0-9]vh` en alturas de layout — 1 coincidencia en el bloque `home` (`.home-hero`, `min-height: calc(100vh - 60px)`), con fallback `dvh` inmediatamente después.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.hero-scroll`, `.lb-link`, `.live-led`, `.pc-label`, `.pc-tag` corregidos a 10px). Bajo 12 dentro de `--mono` — cero tras la corrida (`.mini-cat`, `.stat-s`, `.tk-t`, `.pc-foot` corregidos a 12px).
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en el bloque `home` (M6 marcado `⬛`: la ruta no tiene contenido fijo/sticky propio).

**`git diff --stat` de esta corrida:** `app/globals.css`, `app/home-content.tsx` — ninguna otra ruta cambió (los cambios previos de `chrome`/`jugar`/`salon`/`detalle`/`games` en otros archivos seguían sin commitear pero no se tocaron en esta corrida).

**Gotchas:**

- `.tp-bar`/`.tp-fill` (`app/globals.css:2799-2801`, barra de progreso decorativa del ranking "Top jugadores") parecen una funcionalidad incompleta preexistente: `.tp-bar` es `position:absolute` sin `top/left/right/bottom`, y `.tp-fill` (el `width` calculado en `app/home-content.tsx:396-404`) no tiene ninguna regla CSS propia en `globals.css` (sin `position`/`height`/`background`), por lo que hoy no se renderiza visualmente como barra. No se investigó ni se implementó — fuera de alcance de `mobile-porter` (no es un problema de responsive/accesibilidad, es una función visual no terminada); documentado aquí porque el fix de M2 en `.top-row` depende de entender que `.tp-bar` no contribuye al sizing del grid por ser `absolute`.
- `.live-led`/`.live-led span` no se usan en ningún componente actual de `home` (`grep -rn "live-led" app/` solo encuentra el CSS) — se corrigió su `font-size` por consistencia del bloque CSS de la ruta, sin investigar ni agregar la funcionalidad, mismo criterio que `salon` aplicó a `.tr.you-label`.
- El mapa de rutas del agente asigna `.highlight-row` y `.contact-grid` a `home`, pero ambas clases viven en la sección `/* ===== ABOUT PAGE ===== */` de `app/globals.css` y se usan solo en `app/about/page.tsx` — no se tocaron esta corrida; ver tercera discrepancia anotada en Pendientes.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano (incluida la estimación de ancho de glifo de Press Start 2P, una aproximación); queda pendiente que alguien lo confirme visualmente, en particular si `.tp-bar`/`.tp-fill` alguna vez se completan como barra de progreso real (tendría que revisarse de nuevo su impacto en el sizing del grid de `.top-row`).

### games

**Hallazgos (antes de corregir):**

- **M3** `app/globals.css:612-620` (`.chip`, pre-corrida) — `padding: 12px 14px` + `font-size: 9px` ⇒ alto efectivo ≈12·2+9·1.4≈36.6px, bajo 44px en `pointer:coarse`. Usada como filtro de categoría real (`<button onClick>`, `app/games/games-library.tsx:91-98`), no decorativo.
- **M4** `app/globals.css:615` (`.chip`, pre-corrida) `font-size: 9px` en `--pixel`, bajo el piso de 10px. `app/globals.css:700` (`.card .cover .label`, pre-corrida) `font-size: 8px` en `--pixel`, bajo el piso. `app/globals.css:723` (`.score-badge`, pre-corrida) `font-size: 10px` en `--mono` ("MEJOR PUNTUACIÓN"), bajo el piso de 12px para texto de lectura corrida.
- **M1** Sin desborde real encontrado: `.av-filters`/`.av-chips` ya usan `flex-wrap: wrap` (preexistente) en ambos niveles, así que `.av-search` (`min-width:220px`) y los `.chip` individuales se apilan en filas propias antes de exceder 288/328/358px de contenido (ver aritmética abajo). No requirió cambios de layout, solo los pisos de M3/M4 de arriba.
- **M2** `app/globals.css:634` (`.av-grid`, `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`) contiene un valor en px (280px) pero es el patrón responsive `auto-fill`/`minmax`, no columnas fijas: el propio grid decide cuántas columnas caben y estira la última a `1fr`, así que nunca fuerza un ancho de columna mayor al contenido disponible (ver aritmética abajo — cabe con margen en las 3 anchuras auditadas sin necesitar `@media` nuevo). Ninguna celda del grid es una `1fr` de texto crudo (cada celda es `.card`, un contenedor flex-column con imagen+texto), así que la parte de M2 sobre `min-width:0`+ellipsis no aplica aquí; sí se revisó `.card .title`/`.desc` (envuelven normalmente, sin `white-space:nowrap`, sin riesgo de overflow).
- **M5/M6** Sin hallazgos: grep dentro del bloque `530-760` de `app/globals.css` no encontró `vh` ni `position:fixed|sticky` (la ruta no tiene contenido fijo/sticky propio; el nav sticky ya se cubrió en `chrome`).
- **M10** Sin hallazgo nuevo: `.blink` (`app/globals.css:558-562`, usado en `.av-hero .sub .blink`) es la única animación infinita del bloque `games`; ya queda cubierta por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en `chrome` (`app/globals.css:49-58`, selector universal `*`).

**Correcciones:**

- `app/globals.css` (`.chip`) — `font-size: 9px → 10px` (M4) y nuevo `@media (hover: none) and (pointer: coarse) { .chip { min-height: 44px; display:inline-flex; align-items:center } }` (M3). Se generalizó en `.chip` global (en vez de scoped) porque esta corrida es la dueña de la clase según el mapa de rutas Fase 4; se retiró el override duplicado `.hall-tabs .chip` que había dejado la corrida `salon` (ver Registro/Pendientes).
- `app/globals.css` (`.card .cover .label`) — `font-size: 8px → 10px` (M4).
- `app/globals.css` (`.score-badge`) — `font-size: 10px → 12px` (M4).
- Sin cambios en `app/games/games-library.tsx` (ningún hallazgo requería tocar el componente).

**Aritmética de ancho (M1/M2) a 320/360/390px:**

- `.av-filters`/`.av-grid`/`.av-hero` padding a ≤720px (preexistente, `app/globals.css:1987-1995`): `16px` por lado ⇒ contenido a 320px = `288px`, a 360px = `328px`, a 390px = `358px`.
- **`.av-filters`**: `.av-search { min-width:220px; flex:1 }` + `.av-chips` (flex-wrap propio). A 288px: `220px` (search) + el chip más ancho en una sola línea de `.av-chips` (`"DUELO PIXEL"`, ≈`11×7.02px(9px/char pre-corrida) + 24px padding ≈101px`, o ≈`11×7.8+24≈110px` tras subir a 10px) superan 288px juntos (`220+110=330>288`), por lo que `.av-filters` (flex-wrap:wrap) manda `.av-chips` a su propia fila; dentro de esa fila, `.av-chips` (flex-wrap:wrap) acomoda cada chip individualmente sin exceder 288/328/358px — ningún chip individual (máx. ≈110px) se acerca al límite. Sin cambios de layout necesarios.
- **`.av-grid`**: `minmax(280px, 1fr)` con `gap:22px`. A 320px (contenido 288px): `n=1` columna cabe (`280≤288`, margen 8px); `n=2` no cabe (`280×2+22=582>288`). Con 1 columna, `1fr` estira la única `.card` a los `288px` completos del contenedor — nunca menos que los `280px` mínimos, nunca desborda. A 360px (328px) y 390px (358px): mismo resultado, 1 columna, `.card` ocupa el ancho completo sin desborde. El comportamiento es idéntico en las 3 anchuras auditadas porque el punto de quiebre a 2 columnas (`582px` de contenido) está muy por encima del rango móvil relevante.
- **`.card .row`** (score-badge + botón "JUGAR") dentro de `.card` a 288px de card width menos `14px×2` de padding = `260px` de contenido: `.score-badge` ("MEJOR PUNTUACIÓN", 16 car., `--mono` 12px tras la corrida, `letter-spacing:0.08em` ⇒ ≈`12×0.6+12×0.08≈8.16px/car ⇒ ≈130px`) + `.btn` ("JUGAR", 5 car., `--pixel` 10px, `padding:12px 20px` ⇒ ≈`5×(10×0.6+10×0.16)+40≈78px`) + `gap:10px` ⇒ total ≈`130+78+10=218px` ≤ `260px` → cabe con ~42px de margen en las 3 anchuras (el ancho de card solo crece con el viewport).

**Greps de regresión (alcance: `app/globals.css:530-760`, bloques `.av-hero`/`.av-filters`/`.av-search`/`.chip`/`.av-grid`/`.card`/`.score-badge`, y `app/games/games-library.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — única coincidencia del bloque es `.av-grid` (línea 634, `minmax(280px, 1fr)`); no requiere override a ≤480px por ser `auto-fill`/`minmax` responsive (ver aritmética arriba), documentado en vez de silenciado.
- `[0-9]vh` en alturas de layout — cero coincidencias en el bloque `games`.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.chip` y `.card .cover .label` corregidos a 10px); `--mono` bajo 12px — cero tras la corrida (`.score-badge` corregido a 12px).
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en el bloque `games` (M6 marcado `⬛` por ausencia real de contenido fijo/sticky propio de esta ruta, no por omisión).

**`git diff --stat` de esta corrida:** `app/globals.css` únicamente (el `.chip` compartido y las clases de `card`/`score-badge` viven ahí; `app/games/games-library.tsx` no requirió cambios). Los demás archivos con diffs sin commitear en el árbol de trabajo (`app/components/nav.tsx`, `app/layout.tsx`, `app/juegos/[id]/**`, `app/salon/hall-of-fame.tsx`) pertenecen a corridas previas (`chrome`/`jugar`/`detalle`/`salon`) y no se tocaron en esta corrida.

**Gotchas:**

- El fix de `.chip` se hizo en el selector global en vez de scoped a `.av-chips`, porque `games` es la ruta dueña de la clase en el mapa Fase 4 y el fix debe beneficiar también a `salon` (que ya lo necesitaba y lo había scoped temporalmente). Se retiró el override duplicado `.hall-tabs .chip` de la corrida `salon` para no dejar CSS muerto — documentado con un comentario en su lugar original (`app/globals.css` ~":1819").
- M2 se marcó `✅` (no `⬛`) pese a no requerir ningún cambio de código: el grid sí contiene un valor en px (`minmax(280px, …)`) y la rúbrica pide verificar ese caso explícitamente; la aritmética documentada arriba es la evidencia de cumplimiento, no una omisión.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano (incluida la estimación de ancho de glifo de Press Start 2P/JetBrains Mono, una aproximación); queda pendiente que alguien lo confirme visualmente.

### detalle

**Hallazgos (antes de corregir):**

- **M2** `app/globals.css:1102` (`.lb-row`, `grid-template-columns: 36px 1fr 110px`) — sin override a ≤480px y sin `min-width:0`/elipsis en la celda `1fr` (`.pl`, nombre del jugador). A 320px el track 1fr calculaba ~90px (ver aritmética abajo), suficiente en el caso general pero sin garantía ante un nombre largo — regla M2 se aplica sin condicionar al resultado numérico, igual que el precedente de `salon`.
- **M4** `app/globals.css:1041` (pre-corrida) `.detail-tags span` en `--pixel` a `9px`, bajo el piso de 10px. `app/globals.css:1067` (pre-corrida) `.stat-strip .l` en `--mono` a `10px`, bajo el piso de 12px. `app/juegos/[id]/page.tsx:69` (pre-corrida) párrafo "AÚN NO HAY PUNTUACIONES..." en `--mono` (clase `.mono`) a `fontSize: 11`, bajo 12px. `app/juegos/[id]/page.tsx:84` (pre-corrida) fecha bajo el nombre del jugador en `.lb-row`, hereda `--mono` de `.lb-row` (`font-family` línea 1107) con `fontSize: 10` inline, bajo 12px.
- **M1** Consecuencia potencial de M2 sin resolver: sin `min-width:0` en `.pl`, un nombre de jugador largo podía forzar el track `1fr` de `.lb-row` por encima del espacio disponible, con `body{overflow-x:hidden}` (deuda) como único freno.
- **M3** Sin hallazgos: `.btn.xl` (`padding:20px 36px`, `font-size:14px` ⇒ alto efectivo ≈20·2+14·1.4≈59.6px) y `.btn.ghost.lg` (`padding:16px 28px`, `font-size:12px` ⇒ ≈16·2+12·1.4≈48.8px) en `.detail-actions` ya superan 44px; no hay otros controles interactivos en la ruta.
- **M5/M6** Sin hallazgos: grep dentro de los bloques de `detalle` (`app/globals.css:1003-1160`, `:1952-1958`) no encontró `vh` ni `position: fixed|sticky` — las 2 únicas ocurrencias de `vh` del archivo (`:1246` `.crt-screen`, `:2117` `main`/layout genérico) y las 6 de `position:fixed|sticky` pertenecen a otras rutas (`jugar`, `chrome`, `games`).
- **M10** Sin hallazgo nuevo: `.fade-in`/`fadeIn` (`app/globals.css:2036-2048`, usado en `page.tsx:14`) es una animación de una sola pasada (240ms, no infinita) y ya queda cubierta de todos modos por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en `chrome` (`app/globals.css:49-58`, selector `*`).

**Correcciones:**

- `app/globals.css` (`.detail-tags span`) — `font-size: 9px → 10px` (M4).
- `app/globals.css` (`.stat-strip .l`) — `font-size: 10px → 12px` (M4).
- `app/juegos/[id]/page.tsx:69` — `fontSize: 11 → 12` en el párrafo "AÚN NO HAY PUNTUACIONES..." (M4).
- `app/juegos/[id]/page.tsx:83-86` — nombre del jugador envuelto en `<span className="pl-name">` (antes texto suelto en `.pl`); `fontSize: 10 → 12` en la fecha bajo el nombre (M4).
- `app/globals.css` (tras `.lb-row .rk`) — `.lb-row .pl { min-width: 0 }` (M2/M1) y nueva `.lb-row .pl-name { overflow:hidden; white-space:nowrap; text-overflow:ellipsis }` (M2), aplicada al nuevo `span` de `page.tsx`.
- `app/globals.css` — nuevo `@media (max-width: 480px) { .lb-row { grid-template-columns: 28px 1fr 80px; gap: 8px; padding: 8px 10px; } }` (M2), breakpoint en la escala canónica (`--bp-sm`), angostando RANGO/PUNTUACIÓN para devolverle espacio real al nombre en vez de depender solo de la elipsis.

**Aritmética de ancho (M1/M2), `.lb-row` dentro de `.leaderboard`/`.av-detail` a 320/360/390px:**

- `.av-detail` padding a ≤720px (preexistente, `app/globals.css:1952-1955`): `16px` por lado ⇒ contenido a 320px = `288px`, a 360px = `328px`, a 390px = `358px` (a ≤900px `.av-detail` ya es `grid-template-columns: 1fr`, así que `.leaderboard` ocupa el ancho completo del contenido).
- **Antes de la corrida** (`grid-template-columns: 36px 1fr 110px`, `gap:10px`, `padding:10px 16px`, `box-sizing:border-box` global): disponible para tracks a 320px = `288 − 2(border) − 32(padding) = 254px`; menos `2×10=20px` de gaps y `36+110=146px` fijos ⇒ track `1fr` (nombre) = `254−20−146 = 88px`. Suficiente para nombres cortos, pero sin `min-width:0` un nombre largo en `--mono` 13px podía forzar el track por encima de 88px y desbordar la fila.
- **Tras la corrida**, con el nuevo `@media (max-width:480px)` (`grid-template-columns: 28px 1fr 80px`, `gap:8px`, `padding:8px 10px`): disponible a 320px = `288 − 2 − 20 = 266px`; menos `2×8=16px` de gaps y `28+80=108px` fijos ⇒ track `1fr` = `266−16−108 = 142px` a 320px, `182px` a 360px (contenido 328px), `212px` a 390px (contenido 358px) — más margen que antes, y `min-width:0` + `.pl-name { text-overflow:ellipsis }` garantizan que un nombre aún más largo se recorta dentro del track en vez de desbordar la fila.
- `.stat-strip`: `grid-template-columns: repeat(3, 1fr)` (sin valores px, fuera del alcance de M2) ⇒ a 320px cada columna ≈ `(288−2)/3 ≈ 95px` menos `14px×2` de padding = `67px` de contenido por columna; las etiquetas (`.l`, ahora 12px `--mono` mayúscula) envuelven en 2-3 líneas sin overflow porque no llevan `white-space:nowrap`.
- `.detail-tags`: `display:flex; flex-wrap:wrap` (preexistente) ⇒ los 4 tags (`.cat`, "1 JUGADOR", "TECLADO / TÁCTIL", "RETRO 1985") se acomodan en 2+ filas a 288px de contenido sin forzar overflow horizontal.
- `.detail-actions`: `display:flex; flex-wrap:wrap` (preexistente) ⇒ `.btn.xl` ("▶ JUGAR AHORA", ancho estimado con `--pixel` 14px + `letter-spacing:0.2em` + padding 36px×2 ≈ 250-280px) puede exceder 288px de contenido en el peor caso, pero `flex-wrap:wrap` lo empuja a su propia fila en vez de desbordar la página; `.btn.ghost.lg` ("VOLVER AL VAULT", más corto) queda debajo. Sin desborde real, solo apilado vertical.

**Greps de regresión (alcance: `app/globals.css:1003-1160`, `:1952-1958`, `app/juegos/[id]/page.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — única coincidencia en el bloque es `.lb-row` (línea base + el nuevo override en `@media (max-width:480px)`); ambas cubiertas. `.stat-strip`/`.av-detail` no usan px.
- `[0-9]vh` en alturas de layout — cero coincidencias en los bloques de `detalle`.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.detail-tags span` corregido a 10px; `.lb-row .rk` ya estaba en 11px, `.leaderboard h3` en 11px, `.lb-row .sc` en 12px, todos ≥10).
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en los bloques de `detalle`.

**`git diff --stat` de esta corrida:** `app/globals.css`, `app/juegos/[id]/page.tsx` — ninguna otra ruta cambió (los cambios previos de `chrome`/`salon` en `app/components/nav.tsx`, `app/layout.tsx`, `app/juegos/[id]/jugar/page.tsx`, `app/salon/hall-of-fame.tsx` seguían sin commitear pero no se tocaron en esta corrida).

**Gotchas:**

- `.lb-link` está mapeada a `detalle` en la Fase 4 del agente pero pertenece a `home` (`app/home-content.tsx:374`) — ver segunda discrepancia anotada en Pendientes; no se tocó en esta corrida.
- No se investigó por qué `.lb-row .rk`/`.sc` ya cumplían M4 (11px/12px `--pixel`) mientras `.detail-tags span` (9px) y `.stat-strip .l` (10px `--mono`) no — probablemente inconsistencia de implementación original, no un patrón intencional a preservar.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano; queda pendiente que alguien lo confirme visualmente.

### about

**Hallazgos (antes de corregir):**

- **M1** `app/globals.css:3116-3126` (pre-corrida, `.about-divider .div-pixels`) — 24 `span` de `6px` + 23 gaps de `4px` = `236px`, más los dos `gap:16px` de `.about-divider` a cada lado del bloque = `268px` mínimo (los `.div-bar` flex:1 pueden encoger hasta 0 al no tener contenido). `.about-divider` tiene `padding: 0 32px` ⇒ contenido a 320px = `256px`. `268px > 256px` → desborde horizontal real a 320px (a 360/390px, `296px`/`326px`, ya cabía). Es el único hallazgo M1 real de la ruta; el resto de `.about-hero`/`.highlight-row`/`.contact-grid`/`.contact-form` envuelve texto normalmente (sin `white-space:nowrap`) y no arriesga desborde.
- **M2** n/a — `.highlight-row` (`repeat(3,1fr)` → `1fr` a ≤820px) y `.contact-grid` (`1fr 1.2fr` → `1fr` a ≤900px) no usan ningún valor en px en `grid-template-columns`; ninguna celda `1fr` es una celda de texto crudo con riesgo de desborde (son contenedores flex con `padding`/`gap` propios, ya auditados en M1). Marcado `⬛`.
- **M3** `app/globals.css:508-512` (`.btn.xl`, usado por el submit "▶ ENVIAR MENSAJE") ya cumple (`padding:20px 36px` + `font-size:14px` ⇒ alto efectivo ≈59.6px). `app/globals.css:422-438,490-492` (`.btn.ghost` sin `.lg`/`.xl`, usado por "REINTENTAR" y "ENVIAR OTRO MENSAJE" dentro de `.terminal-error`/`.terminal-success`, `app/about/page.tsx:224-226,260-267`) hereda el padding/font-size base de `.btn` (`padding:12px 20px`, `font-size:10px`) ⇒ alto efectivo ≈12·2+10·1.4≈38px, bajo 44px en `pointer:coarse`. `.field input` (`app/globals.css:1743-1744`, compartida con `auth`) ya tenía `height:44px` — sin hallazgo.
- **M4** `--pixel` bajo 10px: `app/globals.css:3182-3190` `.contact-tips .tip` (9px), `app/globals.css:3299-3305` `.term-bar .term-title` (9px). `--mono` bajo 12px: `app/globals.css:1736-1742` `.field label` (10px, compartida con `auth`, usada por los 3 campos NOMBRE/CORREO/MENSAJE del formulario de contacto).
- **M5/M6** Sin hallazgos: grep dentro del bloque `about` (`app/globals.css:3016-3343`) no encontró `vh` ni `position:fixed|sticky` — la ruta no tiene contenido fijo/sticky ni alturas basadas en viewport propias.
- **M10** Sin hallazgo nuevo: `.div-pixels span { animation: pxblink 2.4s steps(2) infinite }` y `.term-body .caret { animation: blink 1s steps(1) infinite }` son las únicas animaciones infinitas del bloque `about`; ambas ya quedan cubiertas por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en la corrida `chrome` (`app/globals.css:49-58`, selector universal `*`). `.contact-form.shake { animation: shake 0.4s }` no es infinita, sin cobertura adicional necesaria.

**Correcciones:**

- `app/globals.css` (`.div-pixels`/`.div-pixels span`) — nuevo `@media (max-width: 480px) { .div-pixels { gap: 3px } .div-pixels span { width: 4px; height: 4px } }` (M1), breakpoint en la escala canónica (`--bp-sm`, valor literal por convención del archivo, mismo criterio que usaron `salon`/`detalle`).
- `app/globals.css` (`.contact-tips .tip`, `.term-bar .term-title`) — `font-size: 9px → 10px` (M4).
- `app/globals.css` — nuevo `.contact-form .field label { font-size: 12px }` (M4), **scoped a `.contact-form`** para no tocar la regla global `.field label` (compartida con `auth`, aún sin trabajar por `mobile-porter`), mismo criterio que usó `salon` con `.hall-tabs .chip`.
- `app/globals.css` — nuevo `@media (hover: none) and (pointer: coarse) { .about-contact .btn.ghost { min-height: 44px } }` (M3), **scoped a `.about-contact`** para no tocar `.btn.ghost` global (usado en `chrome`/`jugar`/`detalle`/`auth`, algunos ya con su propio piso ≥44px vía `.lg`/`.xl`, otros aún sin auditar).

**Aritmética de ancho (M1), `.about-divider .div-pixels` a 320/360/390px:**

- `.about-divider` (preexistente, sin cambios): `padding: 0 32px` ⇒ contenido a 320px = `256px`, 360px = `296px`, 390px = `326px`.
- **Antes de la corrida**: `div-pixels` = `24×6 + 23×4 = 144+92 = 236px`; más `2×16px` de `gap` de `.about-divider` entre `div-bar`/`div-pixels`/`div-bar` = `32px` ⇒ mínimo total (con ambos `.div-bar` en `flex:1` encogidos a `0`, su `min-width:auto` resuelve a `min-content≈0` al no tener contenido) = `236+32=268px`. A 320px: `268>256` → desborde de `12px`. A 360/390px: `268≤296/326` → ya cabía.
- **Tras la corrida** (`@media max-width:480px`): `div-pixels` = `24×4 + 23×3 = 96+69 = 165px`; más los mismos `32px` de gap ⇒ `197px` mínimo. A 320px: `256−197=59px` de margen; a 360px: `99px`; a 390px: `129px`. Cabe en las 3 anchuras con margen real, no solo en el límite.

**Aritmética de ancho (M1, verificación), `.about-hero`/`.contact-form` a 320px:**

- `.about-hero` `padding: 80px 32px 40px` ⇒ contenido = `256px` a 320px. `.about-title` (`clamp(26px,5vw,52px)`, `--pixel`, `h1` con `white-space` normal) envuelve libremente. `.highlight-row` en `1fr` a ≤820px (preexistente) ⇒ `.highlight` ocupa `256px`; `padding:18px 20px` + borde `2px` ⇒ contenido interno `256−2−40=214px` para `.hl-icon` (36px, `flex:none`) + `gap:16px` + `.hl-text` (`214−36−16=162px`, envuelve normalmente, sin `nowrap`) → sin riesgo de desborde.
- `.about-contact` `padding: 0 32px` ⇒ contenido = `256px` a 320px. `.contact-form` `padding:28px` + borde `2px` ⇒ contenido interno `256−2−56=198px`; `.field input`/`textarea` a `width:100%` caben exactos; `.btn.xl` a `width:100%` (inline, `page.tsx:234`) cabe exacto. `.term-bar` (dentro de `.terminal-error`, anidado en `.contact-form`): padding `8px 12px` ⇒ contenido `198−24=174px`; `3×.dot(10px)+2×gap(8px)=46px` + `margin-left:8px` en `.term-title` = `54px` fijos, dejando `120px` para `.term-title` (texto "VAULT-OS // TERMINAL", ≈20 car. en `--pixel` 10px tras el fix ⇒ ≈`168px` estimado) — el texto excede el espacio remanente, pero `.term-title` no tiene `white-space:nowrap` ni `flex-shrink:0`, así que envuelve a una 2ª línea dentro de `.term-bar` en vez de desbordar horizontalmente; no es un hallazgo M1 (sin overflow de viewport), solo un reflow vertical esperado.

**Greps de regresión (alcance: `app/globals.css:3016-3352`, más `.field`/`.btn` líneas tocadas):**

- `grid-template-columns:[^;]*[0-9]px` sin override — cero coincidencias en el bloque `about` (`.highlight-row`/`.contact-grid` solo usan `fr`).
- `[0-9]vh` en alturas de layout — cero coincidencias en el bloque `about`.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.contact-tips .tip`, `.term-bar .term-title` corregidos a 10px). Bajo 12 dentro de `--mono` — cero en el bloque `about` propio (`.contact-form .field label` corregido a 12px, scoped); `.field label` global (compartida con `auth`) sigue en 10px fuera del scope de esta corrida, documentado.
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en el bloque `about` (M6 marcado `⬛` por ausencia real de contenido fijo/sticky propio de esta ruta).

**`git diff --stat` de esta corrida:** `app/globals.css` únicamente (`app/about/page.tsx` no requirió cambios; ningún hallazgo obligaba a tocar el componente). Los demás archivos con diffs sin commitear en el árbol de trabajo (`app/components/nav.tsx`, `app/layout.tsx`, `app/home-content.tsx`, `app/juegos/[id]/**`, `app/salon/hall-of-fame.tsx`) pertenecen a corridas previas (`chrome`/`jugar`/`salon`/`home`/`detalle`) y no se tocaron en esta corrida.

**Gotchas:**

- `.field label` (10px `--mono`) y `.btn.ghost` base (≈38px de alto) quedan sin corregir en su forma global — ambas son propiedad de la ruta `auth` según el mapa Fase 4 (`.field` vive en el bloque CSS de `auth`, junto a `.auth-tabs`/`.auth-header`) y `.btn.ghost` es un botón de sistema de diseño compartido por todo el sitio. Se aplicó el mismo patrón de scoping que usó `salon` con `.hall-tabs .chip`: fix local a `about`, generalización pendiente para cuando se trabaje `auth` (o cualquier ruta que audite `.btn` base explícitamente).
- La sección `/* ===== ABOUT PAGE ===== */` de `app/globals.css` (antes `:3016-3343`, ahora más larga tras esta corrida) es la que la corrida `home` había dejado documentada como conteniendo `.highlight-row`/`.contact-grid` — confirmado y cerrado en esta corrida, ver `## Pendientes y riesgos conocidos`.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano (incluida la estimación de ancho de glifo de Press Start 2P, una aproximación); queda pendiente que alguien lo confirme visualmente, en particular el reflow de `.term-bar .term-title` a 2 líneas en pantallas angostas.

### auth

**Hallazgos (antes de corregir):**

- **M3** `app/globals.css:1715-1723` (pre-corrida, `.auth-tabs button`) — `padding:12px` + `font-size:9px` ⇒ alto efectivo ≈12·2+9·1.4≈36.6px, bajo 44px en `pointer:coarse`. `app/globals.css:1792-1795` (pre-corrida, `.social .btn`) — mismo cálculo, mismo resultado (`padding:12px`, `font-size:9px`). `app/auth/page.tsx:74` (`.btn.ghost` sin `.lg`/`.xl`, "JUGAR COMO INVITADO") hereda el padding/font-size base de `.btn` (`padding:12px 20px`, `font-size:10px`) ⇒ alto efectivo ≈12·2+10·1.4≈38px, bajo 44px — mismo hallazgo que había dejado pendiente la corrida `about` para cuando se trabajara `auth` (ver su Gotcha).
- **M4** `--pixel` bajo 10px: `app/globals.css:1718` `.auth-tabs button` (9px), `app/globals.css:1764` `.auth-divider` (8px), `app/globals.css:1782` `.social .btn` (9px, override de `.btn` sobre los botones GOOGLE/GITHUB). `--mono` bajo 12px: `app/globals.css:1738` `.field label` (10px, usada por los 3 campos Usuario/Correo/Contraseña) — mismo hallazgo que `about` había dejado pendiente por no ser la ruta dueña de `.field`. `app/auth/page.tsx:23` (pre-corrida) — "ACCESO AL SISTEMA · v2.6" en clase `.mono` con `fontSize:11` inline. `app/auth/page.tsx:84` (pre-corrida) — "AL ENTRAR ACEPTAS LOS TÉRMINOS..." en `--mono` (heredado, sin clase `.mono` explícita pero mismo `font-family` del `body`) con `fontSize:11` inline.
- **M1** Sin desborde real encontrado: `.auth-card` (`width: min(440px, 100%)`) más `.av-auth-wrap { padding: 60px 20px }` da un contenido interno acotado (ver aritmética abajo); ningún hijo usa `white-space:nowrap`, así que el peor caso (texto largo en `.auth-tabs button`/`.auth-header h2`) resuelve con reflow a 2 líneas en vez de overflow horizontal de viewport.
- **M2** n/a — `.auth-tabs` y `.social` usan `grid-template-columns: 1fr 1fr` sin ningún valor en px; ninguna celda es una `1fr` de texto crudo sin wrap (los botones envuelven normalmente). Marcado `⬛`.
- **M5/M6** Sin hallazgos: grep dentro del bloque `auth` (`app/globals.css:1663-1810`) no encontró `vh` ni `position:fixed|sticky` — la ruta no tiene contenido fijo/sticky ni alturas basadas en viewport propias. Marcados `⬛`.
- **M10** Sin hallazgo nuevo: `.fade-in` (`av-auth-wrap`) y `.slide-in` (campo de correo al cambiar a "CREAR CUENTA") son animaciones de una sola pasada, no infinitas — no hay ninguna animación infinita propia del bloque `auth`; de existir alguna, ya quedaría cubierta por el bloque global `@media (prefers-reduced-motion: reduce)` sembrado en la corrida `chrome` (`app/globals.css:49-58`, selector universal `*`).

**Correcciones:**

- `app/globals.css` (`.auth-tabs button`) — `font-size: 9px → 10px` (M4) y nuevo `@media (hover: none) and (pointer: coarse) { .auth-tabs button { min-height: 44px } }` (M3).
- `app/globals.css` (`.auth-divider`) — `font-size: 8px → 10px` (M4).
- `app/globals.css` (`.social .btn`) — `font-size: 9px → 10px` (M4) y nuevo `@media (hover: none) and (pointer: coarse) { .social .btn { min-height: 44px } }` (M3).
- `app/globals.css` — nuevo `@media (hover: none) and (pointer: coarse) { .auth-card .btn.ghost { min-height: 44px } }` (M3), **scoped a `.auth-card`** (mismo patrón que usó `about` con `.about-contact .btn.ghost`), cubre "JUGAR COMO INVITADO", "◆ GOOGLE" y "▣ GITHUB" sin tocar `.btn.ghost` global (compartido con `chrome`/`jugar`/`detalle`, aún sin auditar explícitamente por ninguna corrida de `mobile-porter`).
- `app/globals.css` (`.field label`) — `font-size: 10px → 12px` (M4), **generalizado en la regla global** porque `auth` es la ruta dueña de `.field` per el mapa Fase 4; cierra el gotcha pendiente que había dejado `about`. Se retiró el override `.contact-form .field label` (ahora redundante) y se dejó un comentario en su lugar en vez de un borrado silencioso.
- `app/auth/page.tsx:24` y `:92` (tras formateo automático) — `fontSize: 11 → 12` en "ACCESO AL SISTEMA · v2.6" y en el texto de términos (M4).

**Aritmética de ancho (M1), `.auth-card` a 320/360/390px:**

- `.av-auth-wrap { padding: 60px 20px }` (sin `@media`, fijo en las 3 anchuras) ⇒ disponible = viewport − 40px. A 320px: 280px. A 360px: 320px. A 390px: 350px.
- `.auth-card { width: min(440px, 100%) }` ⇒ a 320/360/390px toma el 100% disponible (280/320/350px), por debajo del tope de 440px. `padding:28px` + `border:1px` por lado ⇒ contenido interno = ancho − 2×1 − 2×28 = ancho − 58px. A 320px: `280−58=222px`. A 360px: `320−58=262px`. A 390px: `350−58=292px`.
- `.auth-tabs` (`grid-template-columns: 1fr 1fr`, `gap:0`, sin padding propio, dentro de `border:1px`) ⇒ 2 columnas de `(222−2)/2≈110px` a 320px; cada `.auth-tabs button` (`padding:12px`, contenido `110−24=86px`) con texto "INICIAR SESIÓN" (14 caracteres, `--pixel` 10px tras el fix, `letter-spacing:0.14em`; estimación consistente con el ratio usado en `chrome`/`home` de ≈0.7em/carácter total con letter-spacing ⇒ ≈7px/carácter a 10px ⇒ ≈98px) excede los 86px de contenido — pero el botón no usa `white-space:nowrap`, así que el texto envuelve a 2 líneas dentro del botón (`min-height:44px` tras el fix de M3 da espacio vertical de sobra para 2 líneas de 10px) en vez de desbordar horizontalmente el viewport. No es un hallazgo M1 nuevo, solo confirma que el reflow vertical (no el overflow) es el comportamiento resultante.
- `.social` (`grid-template-columns: 1fr 1fr`, `gap:10px`) a 320px: `(222−10)/2=106px` por columna; `.social .btn` (`padding:12px`, contenido `106−24=82px`) con texto "◆ GOOGLE" (8 caracteres ≈56px) y "▣ GITHUB" (8 caracteres ≈56px) caben sin envolver.
- `.btn.lg` de ancho completo ("ENTRAR AL VAULT" / "CREAR Y JUGAR", `width:100%` inline) a 320px: ancho = 222px, `padding:16px 28px` + `border:1px` ⇒ contenido `222−2−56=164px`; "ENTRAR AL VAULT" (15 caracteres, `--pixel` 12px, `letter-spacing:0.16em` ⇒ ≈8.6px/carácter ⇒ ≈129px) cabe con margen (~35px) en las 3 anchuras.
- `.auth-header h2` ("ARCADE VAULT", 12 caracteres, `--pixel` 16px, `letter-spacing:0.1em` ⇒ ≈11.1px/carácter estimado ⇒ ≈133px) cabe holgado dentro de los 222/262/292px de contenido del `.auth-card`, centrado por `text-align:center` en `.auth-header`.
- `.field input` (`height:44px`, sin `width` explícito ⇒ hereda `width:100%` del flex column `.field`) cabe exacto en los 222/262/292px de contenido en las 3 anchuras, sin desborde.

**Greps de regresión (alcance: `app/globals.css:1663-1815`, más `app/auth/page.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — cero coincidencias en el bloque `auth` (`.auth-tabs`/`.social` solo usan `fr`).
- `[0-9]vh` en alturas de layout — cero coincidencias en el bloque `auth`.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — cero tras la corrida (`.auth-tabs button`, `.auth-divider`, `.social .btn` corregidos a 10px). Bajo 12 dentro de `--mono` — cero tras la corrida (`.field label` corregido a 12px; los 2 `fontSize:11` inline de `app/auth/page.tsx` corregidos a 12).
- `position:\s*(fixed|sticky)` sin safe-area — cero coincidencias en el bloque `auth` (M6 marcado `⬛` por ausencia real de contenido fijo/sticky propio de esta ruta).

**`git diff --stat` de esta corrida:** `app/globals.css`, `app/auth/page.tsx` — ninguna otra ruta cambió (los cambios previos de `chrome`/`jugar`/`salon`/`home`/`detalle`/`about` en otros archivos seguían sin commitear pero no se tocaron en esta corrida).

**Gotchas:**

- Cierra los 2 gotchas que había dejado pendientes la corrida `about`: `.field label` ahora generalizada a 12px en la regla global (`auth` es su ruta dueña per el mapa Fase 4); `.btn.ghost` base sigue **sin generalizar** — se resolvió scoped a `.auth-card .btn.ghost`, igual que `about` lo había hecho con `.about-contact .btn.ghost`, porque `.btn.ghost` es un botón de sistema compartido por rutas aún no auditadas explícitamente (`chrome`/`jugar`/`detalle` usan variantes `.lg`/`.xl` en algunos casos, pero no todos) — generalizarlo queda fuera de alcance de esta corrida.
- El formateador automático del proyecto reindentó el bloque `style={{...}}` de `app/auth/page.tsx` (línea ~21) tras el primer `Edit` de esta corrida, expandiéndolo a formato multilínea; el resto de las ediciones se hicieron sobre el archivo ya reformateado, sin pérdida de cambios.
- **Sin verificación en navegador ni en dispositivo real.** Todo lo anterior es lectura de código + aritmética a mano (incluida la estimación de ancho de glifo de Press Start 2P, una aproximación); queda pendiente que alguien lo confirme visualmente, en particular el reflow a 2 líneas de `.auth-tabs button` en pantallas de 320px.

### pwa

**Hallazgos (antes de corregir):**

- **M11** No existía `app/manifest.ts` (ni `app/manifest.json`/`.webmanifest`) en todo `app/` (confirmado con `find app -iname "manifest*"` sin resultados) — sin manifest, `next build` no generaba ninguna ruta `/manifest.webmanifest`, y el sitio no era instalable como PWA. No existía tampoco ningún icono de app en `public/` — solo los SVG de ejemplo de la plantilla de Next (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`), ninguno con la identidad del sitio ni en tamaños 192/512. `app/layout.tsx:19-22` (`metadata`) no tenía ningún vínculo a un manifest (Next 16 lo detecta automáticamente vía el archivo especial `app/manifest.ts`, sin necesitar `<link rel="manifest">` manual — confirmado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`). `app/layout.tsx:24-28` (`viewport`) no declaraba `themeColor`.
- **M6** No aplica como hallazgo propio de esta corrida: `viewportFit: "cover"` ya se había declarado en `app/layout.tsx` durante los cimientos compartidos de la corrida `chrome` (2026-08-24, ver `### chrome`); `pwa` no agrega contenido fijo/sticky propio. Marcado `⬛` en la tabla de Estado (no `✅`, para no reclamar aquí un trabajo hecho en otra corrida).
- Resto de reglas (M1–M5, M7–M10, M12) — `⬛ n/a`: `pwa` no es una ruta de contenido navegable, es el manifest + iconos; ninguna de esas reglas tiene superficie propia en `app/manifest.ts` ni en `public/icons/`.

**Correcciones:**

- Nuevo `app/manifest.ts` (Route Handler especial de Next 16, `MetadataRoute.Manifest`, ver guide citado arriba): `name`/`short_name`: "Arcade Vault"; `description` igual a `app/layout.tsx:21`; `start_url: "/"`; `display: "standalone"`; `background_color`/`theme_color: "#0a0a0f"` (= `--bg`, `app/globals.css:14`, la paleta oscura fija del sitio — no un color nuevo); `icons`: 192×192 (`purpose:"any"`), 512×512 (`purpose:"any"`), 512×512 (`purpose:"maskable"`).
- Nuevos `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png` — generados con `sharp` (dependencia ya presente en `node_modules`, sin agregar dependencias nuevas) a partir de dos SVG temporales (no versionados, vivían en el scratchpad de la sesión) que replican el motivo visual existente de `.av-nav .logo-mark` (`app/globals.css:238-249`: cuadrado rotado 45°, mitad `--magenta`/mitad `--cyan` con `mix-blend-mode:screen`, sobre fondo `--bg`) — no es un diseño nuevo, es el logo ya usado en el nav, reexportado como icono de app. La variante `maskable` reduce el cuadrado interno (144px de lado sobre lienzo 512px, extensión máxima desde el centro ≈101.8px) para que quede dentro de la "safe zone" de iconos maskable (radio ≈204.8px = 40% de 512px) y el fondo `#0a0a0f` cubre el lienzo completo hasta el borde, como exige el maskable spec.
- `app/layout.tsx` (`viewport`) — nuevo `themeColor: "#0a0a0f"`, alineado con `theme_color`/`background_color` del manifest y con `--bg`.

**Verificación (M11, sin navegador — por build/lectura):**

- `npm run build` genera `Route (app)` con `○ /manifest.webmanifest` (estático) — confirmado en la salida del build de esta corrida.
- Contenido servido inspeccionado en `.next/server/app/manifest.webmanifest.body` tras el build: `{"name":"Arcade Vault","short_name":"Arcade Vault","description":"Juega en línea y compite por el puntaje más alto.","start_url":"/","display":"standalone","background_color":"#0a0a0f","theme_color":"#0a0a0f","icons":[{"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"/icons/icon-512-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}` — confirma `display:"standalone"`, los 3 iconos (192/512/512-maskable), y `purpose:"maskable"` presente en uno de ellos.
- `file public/icons/*.png` confirma dimensiones reales: `icon-192.png` 192×192, `icon-512.png` y `icon-512-maskable.png` 512×512, los 3 RGBA PNG válidos — no placeholders vacíos.
- No hay equivalente de "aritmética de ancho a 320/360/390px" para esta corrida: `pwa` no tiene grid/flex de layout, es un archivo de configuración + assets estáticos; la evidencia de cumplimiento es el build + inspección del manifest servido, documentada arriba.

**Greps de regresión (alcance: `app/manifest.ts`, `app/layout.tsx`):**

- `grid-template-columns:[^;]*[0-9]px` sin override — n/a, `pwa` no toca CSS.
- `[0-9]vh` en alturas de layout — n/a, sin cambios de CSS.
- `font-size:\s*[0-9]px` bajo 10 dentro de `--pixel` — n/a, sin cambios de CSS.
- `position:\s*(fixed|sticky)` sin safe-area — n/a, sin cambios de CSS; `viewportFit`/`themeColor` viven en `Viewport`, no en CSS.

**`git diff --stat` de esta corrida:** `app/layout.tsx` (solo el nuevo `themeColor` en `viewport`); nuevos `app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png` — ninguna otra ruta cambió. Los demás archivos con diffs sin commitear en el árbol de trabajo (`app/components/nav.tsx`, `app/globals.css`, `app/home-content.tsx`, `app/juegos/[id]/**`, `app/salon/hall-of-fame.tsx`, `app/auth/page.tsx`) pertenecen a corridas previas (`chrome`/`jugar`/`salon`/`home`/`detalle`/`about`/`auth`) y no se tocaron en esta corrida.

**Gotchas:**

- `sharp` no es una dependencia declarada de primer nivel en `package.json` (es transitiva, probablemente de Next/Turbopack); se usó solo como herramienta puntual de esta corrida para rasterizar los SVG a PNG, vía `node -e` fuera del código de la app — no se agregó como `import` en ningún archivo de `app/`, así que no crea una dependencia nueva del proyecto. Si `sharp` deja de estar disponible en el árbol de `node_modules` en el futuro, los 3 PNG ya generados en `public/icons/` no necesitan regenerarse (son artefactos versionados, no generados en build time).
- El diseño de los iconos reutiliza el motivo de `.logo-mark` en vez de inventar un ícono nuevo, respetando la regla dura de "no rediseñar" de `mobile-porter" — no se tocó paleta ni skins (eso es trabajo de `skin-designer`), solo se reexportó el motivo visual ya existente del nav a formato PNG para el manifest.
- No se agregó `<link rel="apple-touch-icon">` ni metadata específica de iOS (`app/layout.tsx` `metadata.icons`) porque la rúbrica M11 solo pide `manifest.ts` + iconos 192/512/maskable + `display`/colores — extender a metadata de iOS es una mejora razonable pero fuera del enunciado comprobable de M11; queda como posible pendiente si se decide dar soporte explícito a "Add to Home Screen" de iOS Safari (que no lee `manifest.json` para el icono, solo `apple-touch-icon`).
- **Sin verificación en navegador ni en dispositivo real.** No se instaló la PWA en ningún dispositivo ni se abrió el sitio en Chrome DevTools > Application > Manifest; toda la verificación de esta corrida es lectura de código, `npm run build`, e inspección del manifest servido (`.next/server/app/manifest.webmanifest.body`) y de los PNG generados (`file`), no una instalación real ni una captura de pantalla del ícono en un launcher.
