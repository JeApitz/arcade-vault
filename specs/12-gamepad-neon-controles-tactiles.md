# 12 — Gamepad neón para controles táctiles

**Estado:** Implementado
**Depende de:** SPEC 11
**Fecha:** 2026-08-24
**Objetivo:** Rediseñar visualmente el panel de controles táctiles (`TouchControls`) de Asteroides y Tetris con la estética de gamepad neón de `references/gamepad-assets/` (d-pad en cruz con hub, botones de acción circulares bicolor), sin tocar el contrato funcional ni el comportamiento de `setKey`/auto-repeat de la SPEC 11.

## Alcance

**Incluye:**

- Nuevo chasis visual tipo consola (`.touch-controls.touch-controls--gamepad`) para juegos cuya área `dpad` y área `action` tienen ambas al menos un botón — hoy Asteroides y Tetris. Reutiliza la paleta ya existente (`--cyan`, `--magenta`, fondo `--bg`), con borde, textura de puntos sutil y `box-shadow` de profundidad equivalentes a `.gp`/`.gp::after` de `gamepad.html`, adaptados a los tokens de `globals.css` del sitio (no se copian los valores hex de la referencia, se reexpresan con las variables del sitio).
- D-pad en cruz compacta: solo se posicionan los botones que el juego declara en `area: "dpad"` (Asteroides: ◀▶ centrados horizontalmente; Tetris: ◀▶▼ en cruz sin el brazo superior), sin dibujar huecos para las posiciones ausentes. La posición de cada botón dentro de la cruz se infiere del valor de `button.key` (`ArrowUp`→arriba, `ArrowDown`→abajo, `ArrowLeft`→izquierda, `ArrowRight`→derecha). Incluye un hub central decorativo (`.dpad-hub`) igual que en la referencia, solo cuando hay 3 o más botones de dpad (Tetris); con 2 botones (Asteroides) no hay hub, solo los dos botones lado a lado.
- Botones de acción circulares (`.touch-btn-action` pasa de rectangular a `border-radius: 50%`), con glow alternado por posición: el primer botón de acción declarado en `engines.ts` usa cian, el segundo magenta (mismo criterio visual que B/A en la referencia). Se implementa con una clase de módulo (`nth-of-type` o clase explícita `touch-btn-action-0`/`touch-btn-action-1`) — no depende del `key` ni del `label`.
- Snake (4 botones dpad, 0 acción) y Arkanoid (`mode: "drag"`) **no** reciben el chasis nuevo: conservan exactamente el estilo plano actual (`.touch-controls` sin modificador, botones cuadrados, hint de texto), sin cambios de CSS ni de componente para estos dos casos.
- `TouchControls` decide el modificador de chasis en runtime: si `touchControls.mode === "buttons"` y hay al menos un botón `area: "dpad"` y al menos un botón `area: "action"`, aplica la clase `touch-controls--gamepad`; en cualquier otro caso (incluye Snake y el modo `"drag"` de Arkanoid) no la aplica.
- En `engines.ts`, los `label` de los botones de área `"action"` de Asteroides y Tetris se simplifican de texto largo a solo el símbolo: `"▲ IMPULSO"` → `"▲"`, `"● DISPARO"` → `"●"`, `"⟳ ROTAR"` → `"⟳"`, `"⤓ CAER"` → `"⤓"`. Los `label` de área `"dpad"` (`◀`/`▶`/`▼`) no cambian, ya eran solo símbolo. Ningún `key` cambia.
- Se agrega `aria-label` explícito en cada `TouchControlButton` con el texto descriptivo completo que tenía el `label` antes de simplificarse (ej. el botón con `label: "●"` y `key: "Space"` en Asteroides lleva `aria-label="Disparo"`), para no perder accesibilidad al pasar a solo ícono. Este texto vive como una tabla de traducción local dentro de `touch-controls.tsx` (mapa `key → aria-label` por juego) — no se agrega un campo nuevo a `TouchButton` en `engines.ts`.
- Íconos siguen siendo caracteres unicode (los mismos ◀▶▼▲●⟳⤓ ya usados en el sitio), no se introducen SVGs.

**No incluye (fuera de alcance de este spec):**

- Cualquier cambio a `TouchControlsConfig`, `TouchButton`, `setKey`, la lógica de auto-repeat, o el manejo táctil nativo de Arkanoid — todo eso es de la SPEC 11 y se mantiene intacto.
- Cambiar qué `key` dispara cada botón o agregar/quitar botones por juego.
- Rediseño de Snake o Arkanoid — conservan el estilo plano actual de la SPEC 11 sin modificación.
- Migrar íconos a SVG.
- Vibración háptica, joystick analógico o gestos de swipe (ya excluidos en SPEC 11 y siguen fuera de alcance).
- Persistir alguna preferencia visual del panel.

## Datos

Esta spec no introduce estructuras de datos nuevas. Reutiliza `TouchControlsConfig`/`TouchButton` de la SPEC 11 (`app/juegos/[id]/jugar/engines.ts`), sin cambios de forma — solo se editan valores de `label` en las dos entradas de `ENGINES` (`asteroides`, `tetris`).

## Plan de implementación

1. **Simplificar labels en `engines.ts`.** Cambiar los 4 `label` de área `"action"` de Asteroides y Tetris a solo símbolo, como se describe en Alcance. `npm run build` sigue pasando sin cambios de tipos (solo valores de string).
2. **Mapa de `aria-label` en `touch-controls.tsx`.** Agregar el mapa local `key → aria-label` (español, descriptivo) para los 4 botones de acción afectados, y usarlo en el `aria-label` del `<button>` de `TouchControlButton` en vez del texto de `label` crudo. Verificable inspeccionando el DOM/accesibilidad del panel sin cambiar nada visual todavía.
3. **Clase de chasis condicional.** En `TouchControls`, calcular si aplica `touch-controls--gamepad` según la regla de Alcance (hay `dpad` y hay `action`) y agregarla al `div.touch-controls` cuando corresponda. Sin CSS nuevo todavía, no cambia nada visible.
4. **D-pad en cruz con posicionamiento por `key`.** En `touch-controls.tsx`, para el grupo `dpad` calcular la posición (arriba/abajo/izquierda/derecha) de cada botón según su `key` y renderizarlos con una clase `touch-dpad-up`/`-down`/`-left`/`-right`; agregar `.dpad-hub` decorativo solo si hay 3 o más botones de dpad. En `globals.css`, agregar el CSS de `.touch-controls--gamepad .dpad` (posicionamiento relativo/absoluto tipo cruz, tamaños, `.dpad-hub`) reexpresando los valores de `gamepad.html` con las variables del sitio. Verificable visualmente: Asteroides muestra ◀▶ lado a lado sin hub, Tetris muestra ◀▶▼ en cruz con hub, Snake no cambia.
5. **Botones de acción circulares bicolor.** En `globals.css`, agregar `.touch-controls--gamepad .touch-btn-action` con `border-radius: 50%`, tamaño fijo (ej. `64px`), y las clases `touch-btn-action-0` (glow cian) / `touch-btn-action-1` (glow magenta) asignadas por posición desde `touch-controls.tsx` según el índice del botón dentro del array de `area: "action"`. El estilo `:active`/glow reutiliza los `box-shadow` que ya existen para `.touch-btn`/`.touch-btn-action`, adaptados a círculo. Verificable visualmente en Asteroides (impulso cian, disparo magenta) y Tetris (rotar cian, caer magenta).
6. **Chasis exterior (`.touch-controls--gamepad`).** Agregar en `globals.css` el fondo, borde, `border-radius`, textura de puntos y `box-shadow` de profundidad para el modificador de chasis, aplicados solo al contenedor `.touch-controls.touch-controls--gamepad` (Snake y Arkanoid, sin el modificador, no se ven afectados). Verificable visualmente comparando Asteroides/Tetris (con chasis) contra Snake/Arkanoid (sin cambios).
7. **Verificación manual en dispositivo/emulador táctil.** Confirmar en los 4 juegos: Asteroides y Tetris muestran el chasis nuevo con d-pad en cruz y botones circulares bicolor; Snake y Arkanoid se ven exactamente igual que antes de esta spec; todos los botones siguen produciendo el mismo `setKey` que antes (sin regresión funcional); el auto-repeat de Tetris sigue funcionando igual; `npm run build` sin errores.

Cada paso deja el sistema funcional y es commiteable por separado.

## Criterios de aceptación

```markdown
- [ ] Asteroides muestra el panel con chasis tipo gamepad: d-pad con solo ◀▶ (sin hub, sin huecos de arriba/abajo) y dos botones de acción circulares, el de impulso (▲) en cian y el de disparo (●) en magenta.
- [ ] Tetris muestra el panel con chasis tipo gamepad: d-pad en cruz con ◀▶▼ y hub central decorativo, y dos botones de acción circulares, rotar (⟳) en cian y caer (⤓) en magenta.
- [ ] Snake muestra el panel exactamente igual que antes de esta spec (sin chasis, botones cuadrados como hoy).
- [ ] Arkanoid muestra el hint de texto exactamente igual que antes de esta spec (sin chasis, sin d-pad).
- [ ] Cada botón de acción tiene un `aria-label` descriptivo en español (no el símbolo unicode crudo).
- [ ] Presionar cada botón sigue disparando el mismo `setKey(key, pressed)` que antes de esta spec (sin cambios de `key` en `engines.ts`).
- [ ] El auto-repeat de Tetris (◀/▶/▼) y el disparo único de ⤓ CAER siguen funcionando igual que en la SPEC 11.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

## Decisiones

- **Chasis solo cuando hay dpad + action juntos:** se eligió no aplicar el rediseño a Snake (solo dpad) ni a Arkanoid (solo hint) para no forzar un chasis vacío o desbalanceado — el gamepad de referencia asume ambos lados presentes, y replicarlo con un lado vacío se vería roto. Snake y Arkanoid conservan el estilo plano de la SPEC 11.
- **Posición del d-pad inferida por `key`, no por un campo nuevo:** evita tocar el contrato `TouchButton` de la SPEC 11; el mapeo `ArrowUp/Down/Left/Right → posición` es determinista y ya es el único vocabulario de `key` usado en los botones de dpad de los 4 juegos.
- **Hub central solo con 3+ botones de dpad:** con solo 2 botones (Asteroides, ◀▶) un hub entre ellos se vería como una cruz incompleta y confusa; se omite y quedan los dos botones simplemente lado a lado.
- **Color de acción por posición (índice), no por `key` o `label`:** alternar cian/magenta según el orden de declaración en `engines.ts` es más simple y predecible que inferir el color por semántica del botón, y coincide con el resultado deseado (impulso/rotar en cian, disparo/caer en magenta) sin necesidad de una tabla de mapeo adicional.
- **Labels a solo ícono + `aria-label` separado en el componente (no en `engines.ts`):** se prefiere no ampliar `TouchButton` con un campo nuevo (`ariaLabel`) porque el texto accesible solo hace falta para 4 botones específicos; un mapa local en `touch-controls.tsx` cubre el caso sin tocar el contrato de la SPEC 11.
- **Unicode en vez de SVG:** consistente con el resto de la UI del sitio (ya usa caracteres unicode en HUD, catálogo, etc.), evita agregar assets/íconos nuevos por juego.

## Riesgos

| Riesgo                                                                                                                                                         | Mitigación                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El chasis nuevo (con padding/borde extra) puede empujar el layout en pantallas muy angostas (breakpoint 480px ya ajustado en SPEC 11 para el aviso de scroll). | Los tamaños del chasis y del d-pad se definen con las mismas unidades relativas/clamp ya usadas en `.touch-controls`/`.touch-btn` actuales, sin agregar alturas fijas grandes; se verifica visualmente en el paso 7 contra el mismo viewport angosto que ya se validó en SPEC 11. |
| Confundir qué botón es cian vs. magenta si en el futuro se reordena el array de `area: "action"` en `engines.ts`.                                              | Documentado en Decisiones: el color depende del orden de declaración, así que reordenar botones en `engines.ts` cambia el color — comportamiento esperado, no un bug.                                                                                                             |

## Lo que **no** está en esta spec

- Ningún cambio a `TouchControlsConfig`, `setKey`, auto-repeat o al manejo táctil nativo de Arkanoid (SPEC 11 intacta).
- Rediseño de Snake o Arkanoid.
- Íconos SVG, vibración háptica, joystick analógico, gestos de swipe.
- Nuevos campos en `TouchButton` (`ariaLabel` vive solo como mapa local en el componente).

Cada uno de estos, si se necesita, va en su propia spec.
