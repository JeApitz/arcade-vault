# 11 — Controles táctiles móviles

**Estado:** Aprobado
**Depende de:** SPEC 05, SPEC 08, SPEC 09, SPEC 10
**Fecha:** 2026-08-24
**Objetivo:** Agregar controles táctiles, visibles solo en dispositivos móviles/táctiles, a los cuatro juegos existentes (Asteroides, Tetris, Arkanoid, Snake) para que sean jugables por completo en pantallas táctiles, con un contrato reusable en `engines.ts` para que juegos futuros declaren sus propios controles sin rediseñar el sistema.

## Alcance

**Incluye:**

- Nuevo campo `touchControls` en `GameEngineEntry` (`app/juegos/[id]/jugar/engines.ts`), obligatorio para cada entrada de `ENGINES`, con dos modos:
  - `{ mode: "buttons", buttons: TouchButton[] }`: panel de botones. Cada `TouchButton` es `{ key: string; label: string; area: "dpad" | "action"; repeat?: boolean }`. `key` debe coincidir exactamente con el `code`/string que el motor ya espera (mismo valor que usaba `e.code` en su `handleKeyDown`/`handleKeyUp` actual).
  - `{ mode: "drag", hint: string }`: sin botones; el propio motor ya maneja touch directo sobre el canvas (caso Arkanoid), `hint` es la leyenda mostrada en el panel en vez de botones.
- Componente nuevo `app/juegos/[id]/jugar/touch-controls.tsx` (`TouchControls`), recibe `touchControls: GameEngineEntry["touchControls"]` y una ref al `GameCanvasHandle` actual; renderiza el panel fijo debajo del `.crt-screen`, siempre presente en el DOM pero oculto por CSS salvo en dispositivos táctiles (mismo mecanismo que ya usaba `.kbd-notice`: `display: none` por defecto, `display: flex` dentro de `@media (hover: none) and (pointer: coarse)`). Usa Pointer Events (`onPointerDown`/`onPointerUp`/`onPointerCancel`/`onPointerLeave`) para soportar multi-touch real (varios botones sostenidos a la vez, ej. rotar + impulso + disparo en Asteroides simultáneamente).
- Cada botón sin `repeat` llama `handle.setKey(key, true)` en `pointerdown` y `handle.setKey(key, false)` en `pointerup`/`pointercancel`/`pointerleave`, replicando 1:1 el par `keydown`/`keyup` que ya escucha el motor.
- Cada botón con `repeat: true` (movimiento/softdrop de Tetris) además dispara `setKey(key, true)` en un `setInterval` cada ~130ms mientras se mantiene presionado (delay inicial ~200ms), imitando el auto-repeat de teclado del sistema operativo, porque esos tres inputs de Tetris son de disparo único por evento (no leen un estado continuo por frame).
- `GameCanvasHandle` (en `engines.ts`) gana un método opcional `setKey?(key: string, pressed: boolean): void`.
- `AsteroidsEngine`, `TetrisEngine`, `SnakeEngine` ganan un método público `setKey(code: string, pressed: boolean)`:
  - Asteroides: `if (pressed && !this.keys[code]) this.justPressed[code] = true; this.keys[code] = pressed;` — idéntico al par `handleKeyDown`/`handleKeyUp` actual, sostenido = continuo (rotación/impulso), disparo (`Space`) sigue siendo de un solo tiro por pulsación por el guard de `justPressed`.
  - Tetris: en `pressed === true` ejecuta exactamente la misma lógica que su `handleKeyDown` actual (switch por `code`); `pressed === false` no hace nada (Tetris no tiene `keyup`).
  - Snake: en `pressed === true` ejecuta exactamente la misma lógica que su `handleKeyDown` actual (switch por `code`, respeta `isOpposite`); `pressed === false` no hace nada.
- `AsteroidsCanvas`, `TetrisCanvas`, `SnakeCanvas` exponen `setKey` en su `useImperativeHandle`, delegando al `setKey` del engine.
- `ArkanoidEngine` gana manejo de touch nativo sobre el propio `<canvas>`, paralelo a su `mousemove`/`click` ya existente: `touchmove` mueve `paddle.x` con el mismo cálculo que `handleMouseMove` (usando `touches[0].clientX` en vez de `e.clientX`), `touchstart` lanza la bola con la misma lógica que `handleClick`. `ArkanoidCanvas`/`ArkanoidEngine` no implementan `setKey` (no lo necesitan, `touchControls.mode` es `"drag"`).
- Configuración `touchControls` por juego en `engines.ts`:
  - `asteroides`: `buttons: [{key:"ArrowLeft",label:"◀",area:"dpad"}, {key:"ArrowRight",label:"▶",area:"dpad"}, {key:"ArrowUp",label:"▲ IMPULSO",area:"action"}, {key:"Space",label:"● DISPARO",area:"action"}]`.
  - `tetris`: `buttons: [{key:"ArrowLeft",label:"◀",area:"dpad",repeat:true}, {key:"ArrowRight",label:"▶",area:"dpad",repeat:true}, {key:"ArrowDown",label:"▼ BAJAR",area:"dpad",repeat:true}, {key:"ArrowUp",label:"⟳ ROTAR",area:"action"}, {key:"Space",label:"⤓ CAER",area:"action"}]`. `Space` (hard drop) sin `repeat` a propósito, para que mantener el dedo presionado no dispare múltiples caídas.
  - `arkanoid`: `{ mode: "drag", hint: "ARRASTRA PARA MOVER · TOCA PARA LANZAR" }`.
  - `snake`: `buttons: [{key:"ArrowUp",label:"▲",area:"dpad"}, {key:"ArrowDown",label:"▼",area:"dpad"}, {key:"ArrowLeft",label:"◀",area:"dpad"}, {key:"ArrowRight",label:"▶",area:"dpad"}]`.
- `game-player.tsx` renderiza `<TouchControls touchControls={engine.touchControls} handle={canvasRef} />` debajo del `.crt` (entre `crt-bottom` y el modal de fin), reemplazando el bloque `.mono.kbd-notice` ("▸ ESTE JUEGO REQUIERE TECLADO_") en ese mismo lugar del JSX. El teclado sigue funcionando en paralelo en dispositivos con teclado físico (no se desactiva); en un dispositivo táctil los botones son el único método de control visible, ya que ahí no hay teclado.
- `app/globals.css`: nuevas clases para el panel de `TouchControls` (`.touch-controls`, `.touch-controls .dpad`, `.touch-controls .actions`, `.touch-btn`), estética consistente con `.btn`/paleta neón del sitio, dispuesto en dos grupos (`area: "dpad"` a la izquierda, `area: "action"` a la derecha) para poder presionar dirección + acción con dos dedos a la vez. `.touch-controls` reutiliza el mismo patrón CSS que tenía `.kbd-notice` (oculto por defecto, visible solo bajo `@media (hover: none) and (pointer: coarse)`); la regla `.kbd-notice` original se elimina junto con su bloque JSX.
- `touch-action: none` en `.touch-btn` y en el `<canvas>` de Arkanoid (para que arrastrar/mantener presionado no dispare scroll o gestos del navegador), más `e.preventDefault()` en los handlers `touchmove`/`touchstart` de `ArkanoidEngine` y en los `pointerdown` de `TouchControls`.
- `export const viewport: Viewport` nuevo en `app/layout.tsx` (`{ width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false }`), para evitar zoom accidental por doble-tap al jugar con los botones en pantalla.

**No incluye (fuera de alcance de este spec):**

- Joystick virtual de arrastre para Asteroides (se usan 4 botones discretos, no un stick analógico).
- Gestos de swipe para Snake o Tetris (se usan botones explícitos, no reconocimiento de gestos).
- Un botón/toggle manual para mostrar u ocultar el panel táctil — la visibilidad es automática vía `@media (hover: none) and (pointer: coarse)`, sin control manual del jugador.
- Vibración háptica (`navigator.vibrate`) al tocar los botones.
- Rediseño del layout general de `.player-hud` más allá de lo ya responsive (breakpoints existentes en `globals.css` a 720px/480px no se tocan).
- Orientación forzada (landscape lock) o mensajes de "gira tu dispositivo".
- Soporte táctil para juegos aún no implementados — solo se deja el contrato (`touchControls` obligatorio en `GameEngineEntry`), no se implementan controles de juegos futuros.
- Persistir alguna preferencia de control (táctil vs teclado) en localStorage/Supabase.

## Contrato en `engines.ts`

```ts
export interface TouchButton {
  key: string; // debe matchear el `code` que el motor ya usa en su handleKeyDown/keyup
  label: string;
  area: "dpad" | "action";
  repeat?: boolean; // true = auto-repeat mientras se mantiene presionado (solo Tetris mover/bajar)
}

export type TouchControlsConfig =
  { mode: "buttons"; buttons: TouchButton[] } | { mode: "drag"; hint: string };

export interface GameCanvasHandle {
  forceGameOver: () => void;
  setKey?: (key: string, pressed: boolean) => void;
}

interface GameEngineEntry {
  // ...campos existentes (Canvas, hudLabel, initialStats, crtAspect, hidePauseOverlay)
  touchControls: TouchControlsConfig;
}
```

## Plan de implementación

1. **Contrato y viewport.** Agregar `TouchButton`/`TouchControlsConfig` y el campo obligatorio `touchControls` a `GameEngineEntry` en `engines.ts`, con la configuración de los 4 juegos descrita arriba. Agregar `setKey?` a `GameCanvasHandle`. Agregar `export const viewport` en `app/layout.tsx`. El build sigue pasando (TypeScript exige `touchControls` en las 4 entradas de `ENGINES`, ya declaradas en este mismo paso).
2. **`setKey` en Asteroides, Tetris y Snake.** Agregar el método público `setKey(code, pressed)` a `AsteroidsEngine`, `TetrisEngine`, `SnakeEngine` como se describe en Alcance, exponerlo en `AsteroidsCanvas`/`TetrisCanvas`/`SnakeCanvas` vía `useImperativeHandle`. Sin UI nueva todavía; verificable llamando `setKey` manualmente desde devtools mientras se juega con teclado en paralelo.
3. **Touch nativo en Arkanoid.** Agregar `touchmove`/`touchstart` (con `{ passive: false }` y `preventDefault`) a `ArkanoidEngine`, replicando `handleMouseMove`/`handleClick`. Verificable arrastrando el dedo sobre el canvas en un dispositivo/emulador táctil.
4. **Componente `TouchControls`.** Crear `app/juegos/[id]/jugar/touch-controls.tsx`: panel con grupo `dpad` (izquierda) y `actions` (derecha) para `mode: "buttons"`, leyenda de texto para `mode: "drag"`. Pointer events con lógica de `repeat` para los botones que lo declaran. Sin conectar todavía a `game-player.tsx`.
5. **Integración en el reproductor.** En `game-player.tsx`: renderizar `<TouchControls touchControls={engine.touchControls} handle={canvasRef} />` debajo de `.crt`, eliminar el bloque `.kbd-notice`. En `globals.css`: agregar estilos `.touch-controls`/`.touch-btn` y quitar la regla `.kbd-notice` y su media query.
6. **Verificación manual en dispositivo/emulador táctil.** Para cada uno de los 4 juegos: jugar una partida completa usando solo los botones táctiles (sin teclado ni mouse), confirmar que cada botón hace exactamente lo mismo que su tecla equivalente, que Asteroides permite sostener rotación+impulso+disparo a la vez (multi-touch), que en Tetris mover/bajar se repite al mantener presionado pero `⤓ CAER` no se repite aunque se mantenga el dedo, que en Snake un toque cambia de dirección sin invertir 180°, que Arkanoid responde al arrastre y al toque para lanzar la bola sin que la página haga scroll/zoom. Confirmar también que el teclado sigue funcionando en paralelo en un dispositivo con teclado físico + pantalla táctil. `npm run build` sin errores de tipos.

Cada paso deja el sistema funcional y es commiteable por separado.

## Criterios de aceptación

```markdown
- [ ] Los 4 juegos (Asteroides, Tetris, Arkanoid, Snake) muestran su panel de controles táctiles debajo del `.crt-screen` en un dispositivo/emulador táctil (`pointer: coarse`).
- [ ] En un navegador de escritorio con mouse/teclado (`pointer: fine`), el panel de controles táctiles no aparece.
- [ ] Cada botón táctil produce exactamente el mismo efecto que su tecla equivalente (verificado 1:1 contra el mapeo de teclas documentado en cada spec de juego).
- [ ] En Asteroides, sostener rotación + impulso + disparo con distintos dedos funciona simultáneamente (multi-touch real, sin que un botón cancele a otro).
- [ ] En Tetris, mantener presionado ◀/▶/▼ mueve/baja repetidamente; mantener presionado ⤓ CAER ejecuta un solo hard-drop, no varios.
- [ ] En Snake, tocar una dirección opuesta a la actual en el mismo tick se ignora (no permite invertir 180°), igual que con teclado.
- [ ] En Arkanoid, arrastrar el dedo sobre el canvas mueve la paleta y tocar lanza la bola, sin disparar scroll ni zoom del navegador.
- [ ] El teclado físico sigue funcionando en paralelo a los botones táctiles en los 4 juegos (no se desactivó ningún listener existente).
- [ ] El aviso "▸ ESTE JUEGO REQUIERE TECLADO_" ya no aparece en ningún juego.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

## Decisiones y riesgos

- **`setKey(code, pressed)` como método único, pero con semántica distinta por motor:** se eligió mantener el mismo nombre de método en los tres motores porque hace el contrato predecible desde `TouchControls`, aunque internamente Asteroides lo trata como estado continuo (`keys[code]`) y Tetris/Snake como disparo único en `pressed === true` — porque así ya funcionan hoy con teclado (`handleKeyDown` sin `keyup` en esos dos). No se reescribe el modelo de input de ningún motor, solo se expone una segunda vía de entrada equivalente a la del teclado.
- **Auto-repeat en el componente de UI, no en el motor:** el `setInterval` que repite `setKey(key, true)` para mover/bajar en Tetris vive en `TouchControls`, no en `TetrisEngine`, para no introducir un segundo modelo de temporización dentro del motor y mantenerlo agnóstico de si el input vino de teclado (repeat de SO) o de un botón táctil (repeat de la UI).
- **Arkanoid usa drag nativo, no botones:** ya tenía `mousemove`/`click` implementados; agregar `touchmove`/`touchstart` es la extensión más directa y preserva la precisión de arrastre que ya tiene con mouse, en vez de forzarlo a un esquema de 2 botones ◀/▶ menos preciso.
- **Panel visible solo en dispositivos táctiles, vía media query (no JS):** decisión explícita del usuario — igual que el aviso `.kbd-notice` que reemplaza, se usa `@media (hover: none) and (pointer: coarse)` en vez de detección por JavaScript, para no depender de hidratación ni introducir un estado adicional (`isTouchDevice`) que pueda parpadear en el primer render.
- **`touchControls` obligatorio (no opcional) en `GameEngineEntry`:** fuerza que cualquier juego futuro declare su esquema de controles táctiles al momento de registrarse en `ENGINES`, en vez de quedar sin soporte táctil por omisión silenciosa.
- **Riesgo conocido:** `userScalable: false` en el `viewport` reduce accesibilidad para usuarios que dependen de zoom del navegador; se acepta porque sin él, tocar repetidamente los botones del panel puede disparar zoom accidental y romper la jugabilidad — mismo trade-off que otros sitios de juegos táctiles.
- **Riesgo conocido:** un dispositivo híbrido (laptop con pantalla táctil y mouse) puede no calzar limpiamente en `pointer: coarse`/`pointer: fine`; se acepta el mismo comportamiento que ya tenía `.kbd-notice` en producción, sin resolverlo de forma especial en este spec.
