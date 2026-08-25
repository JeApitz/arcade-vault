---
name: spec-impl-game
description: Implementa un spec de juego aprobado de Arcade Vault y, al terminar, encadena skin-designer y mobile-porter en secuencia. Valida que el estado signifique "Aprobado" (en cualquier idioma), crea una rama git a partir del spec, y empieza la implementación paso a paso con pausas para revisar el diff.
disable-model-invocation: true
argument-hint: <NN-juego-nombre | carpeta/NN-spec>
allowed-tools: Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*), Bash(npm run build), Bash(npm run lint)
---

# /spec-impl-game — Implementador de specs de juego + skins + móvil

Es un `/spec-impl` especializado en juegos de Arcade Vault: mismas cuatro fases, mismos bloqueos (solo specs cuyo estado significa "Aprobado", rama `spec-NN-slug`, implementación paso a paso con pausas, nunca commits automáticos). La diferencia es que **este comando reconoce los dos formatos de spec de juego** (plano y en carpeta) y, al cerrar la implementación con el build limpio, **encadena automáticamente tres agentes, uno después de otro, nunca en paralelo**: `skin-designer <game-id>` → `mobile-porter jugar` → `mobile-porter detalle`. Así ningún juego nuevo llega a producción sin sus tres skins ni sin auditoría móvil.

## Contexto de sesión

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs planos disponibles en `specs/`:
!`ls specs/*.md 2>/dev/null || echo "No hay specs planos en specs/"`

Carpetas de specs escalonados en `specs/`:
!`ls -d specs/*/ 2>/dev/null || echo "No hay carpetas de specs"`

Configuración de creación de rama:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, sin archivo de config)"`

---

## Instrucciones

Sigue estas seis fases en orden estricto. **No avances a la siguiente fase si la anterior no se completó correctamente.**

---

### Fase 1 — Identificar el spec

El argumento recibido es: `$ARGUMENTS`

Si `$ARGUMENTS` viene vacío:

- Lista los specs planos y las carpetas disponibles (ya los tienes arriba).
- Pide al usuario el nombre exacto del spec (o de la carpeta, si quiere que se le muestren sus specs).
- Detente y espera respuesta. No continúes.

Si `$ARGUMENTS` tiene valor, resuelve en este orden:

1. **Formato plano** (`specs/NN-juego-<nombre>.md`, el que produce `/spec-game`): el usuario puede haber escrito el nombre completo (`08-juego-tetris`), solo el número (`08`) o solo el slug (`juego-tetris` o `tetris`). Busca el archivo correspondiente en `specs/`.
2. **Formato carpeta** (`specs/<game-id>/NN-*.md`, el que produce `game-jam`, p. ej. `specs/frogger/01-frogger-core.md`): el usuario puede haber escrito `frogger/01`, `frogger/01-frogger-core`, la ruta completa, o solo `frogger`.
   - Si escribió una ruta completa o `carpeta/NN[-slug]`: resuelve ese archivo directamente.
   - Si escribió **solo el nombre de la carpeta** y esta tiene varios specs (el patrón escalonado de `game-jam`: núcleo → contenido → identidad): **lista los specs de esa carpeta y pregunta cuál implementar.** No elijas por tu cuenta — un spec por corrida, igual que `mobile-porter`/`skin-designer` trabajan una unidad por corrida.
3. Si no encuentras el archivo en ninguno de los dos formatos, muestra los specs y carpetas disponibles y pide al usuario que corrija el nombre.

Una vez localizado el archivo, continúa a la Fase 2.

---

### Fase 2 — Validar el estado del spec

Lee el archivo del spec localizado en la Fase 1.

Busca la línea de estado. La etiqueta suele ser `**Status:**` (inglés) o `**Estado:**` (español), pero puede estar en cualquier idioma. Identifícala por posición (cerca del encabezado) y por el vocabulario de la máquina de estados, no por la etiqueta exacta.

**Regla absoluta:** solo puedes continuar si el estado **significa "Aprobado"** — sin importar el idioma.

Trata como estado **Aprobado** (y continúa):

- Español: `Aprobado`
- Inglés: `Approved`
- Portugués: `Aprovado`
- Francés: `Approuvé`
- Alemán: `Genehmigt`
- Italiano: `Approvato`
- …o el equivalente evidente en cualquier otro idioma

Cualquier otra cosa (`Borrador`/`Draft`, `Propuesto`, `En revisión`/`In review`, `Implementado`/`Implemented`, `Obsoleto`/`Obsolete`, o cualquier valor no reconocido) significa **detente** y muestra el mensaje de error de abajo.

Nota práctica de este repo: los specs que produce `game-jam` nacen en `Borrador`, y `specs/frogger/01-frogger-core.md` hoy dice `Propuesto` — ninguno de los dos pasa este filtro hasta que un humano lo revise y lo cambie a `Aprobado` a mano.

| Categoría de estado                        | Ejemplos (cualquier idioma)                       | Acción                                                             |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| Aprobado                                   | `Aprobado`, `Approved`, `Aprovado`, `Approuvé`, … | Continúa a la Fase 2.5.                                            |
| Borrador / Propuesto                       | `Borrador`, `Draft`, `Propuesto`, …               | Detente. Muestra el mensaje de error de abajo.                     |
| En revisión                                | `En revisión`, `In review`, …                     | Detente. Muestra el mensaje de error de abajo.                     |
| Implementado                               | `Implementado`, `Implemented`, …                  | Detente. Muestra el mensaje de error de abajo.                     |
| Obsoleto                                   | `Obsoleto`, `Obsolete`, …                         | Detente. Muestra el mensaje de error de abajo.                     |
| Línea de estado no encontrada / valor raro | —                                                 | Detente. El archivo no sigue el formato esperado. Dilo al usuario. |

Si no estás seguro de si un valor significa "Aprobado", **no supongas**. Detente y pide al usuario que aclare o actualice el spec a la palabra canónica.

**Mensaje de error estándar cuando el estado no significa Aprobado:**

```
❌ No puedo implementar este spec.

Estado actual: [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado signifique "Aprobado" (por ejemplo `Aprobado`,
`Approved`, o el equivalente en otro idioma).

Para continuar tienes dos opciones:
  1. Si el spec ya está listo para implementarse, ábrelo y cambia el estado
     a "Aprobado" (o el término equivalente de tu equipo) manualmente.
     Ese cambio lo hace un humano, no el agente.
  2. Si el spec todavía necesita trabajo, usa /spec-game o /spec [nombre] para retomarlo.
```

No ofrezcas alternativas, no sugieras "puedo empezar igual si quieres". El bloqueo es intencional.

---

### Fase 2.5 — Extraer el `game-id`

Necesario porque `skin-designer` recibe el juego como argumento posicional. Deriva el `game-id` en este orden, sin inventar:

1. El `id` de catálogo declarado explícitamente en el spec (kebab-case, el mismo valor de `game_id` en `scores` o de `cover-<id>` en `app/globals.css`). Es la fuente de verdad si está presente.
2. Si el spec no lo declara: el nombre de la carpeta (`specs/frogger/...` → `frogger`) o el slug tras `juego-` en el nombre de archivo (`08-juego-tetris.md` → `tetris`).
3. Si sigue siendo ambiguo, usa `AskUserQuestion` para confirmarlo con el usuario. No continúes sin una respuesta clara — un `game-id` equivocado hace que `skin-designer` trabaje sobre el juego incorrecto en la Fase 5.

Guarda este valor: lo necesitas para la Fase 5 y para el resumen de la Fase 3.

---

### Fase 3 — Crear la rama git y cambiar a ella

Una vez confirmado que el estado significa `Aprobado`:

0. **Revisa primero el árbol de trabajo.** Mira la salida de `git status --short` del contexto de sesión de arriba. Si **no está vacía**, detente, muestra los cambios pendientes y pregunta:

   ```
   ⚠️ Hay cambios sin confirmar en el árbol de trabajo.
   Cambiar de rama los arrastraría. ¿Qué quieres hacer?
     1. Confirmarlos o guardarlos en stash tú mismo, y volver a correr este comando (recomendado)
     2. Continuar de todas formas — los cambios viajan a la rama nueva
   ```

   Espera la respuesta. **No hagas stash ni commit por tu cuenta** salvo que el usuario lo pida explícitamente. Si el árbol está limpio, salta directo al paso 1 sin mencionarlo.

1. Deriva el nombre de la rama del archivo del spec, sin extensión:
   - Spec plano: `NN-juego-<nombre>.md` → rama `spec-NN-juego-<nombre>`. Ejemplo: `08-juego-tetris.md` → `spec-08-juego-tetris`.
   - Spec en carpeta: `specs/<carpeta>/NN-slug.md` → rama `spec-<carpeta>-NN-slug`, para no colisionar con los números planos de `specs/`. Ejemplo: `specs/frogger/01-frogger-core.md` → `spec-frogger-01-frogger-core`.

2. Lee la bandera `AutoCreateBranch` de la configuración mostrada en el contexto de sesión.
   - Si el archivo de config no existe, falta el valor, o el valor no se reconoce → trátalo como `true` (default).
   - Solo un `false` explícito (en cualquier capitalización) desactiva la creación automática.

   **Si `AutoCreateBranch` es `true` (default):** continúa sin preguntar.
   - Si la rama **no existe**: créala con `git checkout -b <rama>`.
   - Si **ya existe**: se está retomando trabajo previo. Cambia a ella, lee `git log --oneline` sobre la rama, y dile al usuario qué pasos del plan ya se ven hechos y desde cuál propones retomar. Espera confirmación del punto de retoma antes de implementar nada.
   - En ambos casos: cambia a la rama con `git checkout <rama>` y confirma el cambio antes de continuar.

   **Si `AutoCreateBranch` es `false`:** pregunta antes de tocar git. Muestra:

   ```
   AutoCreateBranch está en false.
   ¿Creo y cambio a la rama <rama>? [y/N]
   ```

   - Si el usuario responde **sí**: crea/cambia a la rama igual que en el caso `true`.
   - Si responde **no** o deja vacío: **no crees ninguna rama.** Dile que implementarás en la rama actual (la que muestra el contexto de sesión) y pide confirmación explícita para continuar ahí. No improvises — espera la respuesta.

3. Confirma visualmente al usuario que el spec está listo y qué rama está activa:

   ```
   ✅ Listo para implementar.

   Spec:    <ruta del spec>
   Juego:   <game-id>
   Rama:    <rama>  (activa)   (← o la rama actual, si no se creó una nueva)
   Estado:  Aprobado   (← el valor real encontrado en el spec)
   ```

4. **No empieces a implementar todavía.** Primero muestra el resumen del spec para que el usuario lo tenga fresco. Extrae y muestra:
   - El **objetivo** (línea después de `**Objetivo:**` / `**Objective:**` / equivalente).
   - El **alcance** (sección `## Scope` / `## Alcance` / equivalente).
   - El **plan de implementación** (sección con los pasos numerados — `## Implementation plan` / `## Plan de implementación` / equivalente).
   - Los **criterios de aceptación** (el checklist — `## Acceptance criteria` / `## Criterios de aceptación` / equivalente).

Empareja los encabezados por significado, no por texto exacto — el spec puede estar en cualquier idioma.

---

### Fase 4 — Implementar paso a paso

Después de mostrar el resumen del spec, dile al usuario:

```
Voy a implementar el spec siguiendo el plan de implementación al pie de la letra.
Pausaré después de cada paso para que revises el diff.

¿Empezamos con el Paso 1?
```

Espera confirmación explícita ("sí", "dale", "adelante", o equivalente). No empieces sin ella.

Una vez confirmado, sigue estas reglas durante toda la implementación:

**Nunca commitees automáticamente.** Ni por paso, ni al final. Tú escribes el código y muestras el diff; commitear es decisión y orden del usuario. Solo commitea si te lo pide explícitamente.

**Regla por encima de todas:** implementa lo que dice el spec. Si algo del spec te parece subóptimo, menciónalo como observación pero implementa lo acordado. Los cambios al spec van al spec, no al código por sorpresa.

**Ritmo de trabajo:**

- Implementa un paso del plan.
- Muestra un resumen de qué archivos tocaste y qué hiciste.
- Di: `Paso N completado. ¿Revisas el diff y me dices si sigo con el Paso N+1?`
- Espera confirmación antes de continuar.

**Si durante la implementación encuentras una ambigüedad** que el spec no resuelve:

- Detente.
- Describe la ambigüedad exactamente.
- Presenta dos o tres opciones concretas.
- Espera la decisión del usuario.
- No improvises.

**Si el usuario pide algo fuera del alcance del spec:**

- Recuérdale que está fuera del alcance de este spec.
- Sugiere anotarlo para el siguiente spec.
- No lo implementes en esta rama.

**Al terminar el último paso del plan:**

1. Verifica los criterios de aceptación del spec uno por uno.
2. Corre `npm run build` (y `npm run lint` si el spec o el proyecto lo esperan).
3. Si algún criterio no pasa, o el build falla: **detente aquí, no avances a la Fase 5.** Muestra qué falló y trabaja con el usuario para resolverlo — lanzar `skin-designer` o `mobile-porter` sobre un motor que no compila solo produce ruido en sus propias verificaciones (ambos corren `npm run build`/`lint` como parte de su Fase 5).
4. Si todo pasa, anuncia:

   ```
   ✅ Todos los pasos del plan están implementados y npm run build/lint pasan limpio.

   Ahora encadeno los agentes de post-proceso, uno después de otro:
   skin-designer <game-id> → mobile-porter jugar → mobile-porter detalle.
   ```

   y continúa directo a la Fase 5 — no hace falta pedir confirmación adicional para esto, ya está implícito en haber pedido este comando.

---

### Fase 5 — Encadenar skin-designer y mobile-porter

Solo se entra aquí con la implementación cerrada y el build limpio (Fase 4). Es la razón de ser de este comando frente a `/spec-impl` genérico.

**Regla dura, sin excepción:** las tres invocaciones del tool `Agent` van en **tres llamadas separadas, cada una en su propio turno, esperando el resultado de la anterior antes de lanzar la siguiente**. Nunca en el mismo bloque de mensaje, nunca en paralelo — `skin-designer` y `mobile-porter` tocan los mismos archivos (`app/juegos/[id]/jugar/*`, `app/globals.css`) y correr dos a la vez los haría pisarse.

1. **`skin-designer`** — `subagent_type: "skin-designer"`. Prompt: el `game-id` de la Fase 2.5 como instrucción de qué juego trabajar, más contexto mínimo que un agente fresco necesita: qué spec se acaba de implementar, en qué rama está el trabajo, y si el juego usa sprites (y de qué tipo: pixel-art/rampa o fotográfico) según lo que hayas visto al implementar — para que no tenga que re-descubrirlo. No le pidas que haga nada distinto a lo que su propia definición ya establece.
   - Al volver, resume en 2–3 líneas para el usuario: los tres skins quedaron listos o no, los ratios de contraste si los reportó, y si `npm run build`/`lint` pasaron según su propio reporte.

2. **`mobile-porter jugar`** — `subagent_type: "mobile-porter"`. Prompt: `jugar` como ruta a auditar, más una nota de que el juego `<game-id>` acaba de aterrizar en `ENGINES` (así el agente sabe que el reproductor tiene una superficie nueva que revisar, aunque su rúbrica M1–M12 ya cubre la ruta en general).
   - Al volver, resume: reglas M pasadas/falladas/n/a, y si quedó build/lint limpio.

3. **`mobile-porter detalle`** — `subagent_type: "mobile-porter"`. Prompt: `detalle` como ruta a auditar, con la misma nota sobre `<game-id>`.
   - Al volver, resume igual que el paso anterior.

Reglas duras de esta fase:

- **No reimplementes ni "corrijas" lo que hizo un agente.** Si uno reporta un fallo, un `❌`, o algo pendiente, repórtalo al usuario tal cual y sigue con el siguiente agente de la secuencia — no te desvíes a arreglarlo tú mismo dentro de este comando.
- Un fallo o pendiente de `skin-designer` **no cancela** la ejecución de `mobile-porter` — son verificaciones ortogonales (píxeles vs. layout/accesibilidad) — pero anótalo en el cierre.
- Los tres agentes escriben sus propias memorias (`references/game-with-themes.md`, `references/mobile-readiness.md`); este comando **no las toca** directamente.
- Ninguno de los tres agentes commitea, y este comando tampoco lo hace en ningún momento de la Fase 5.
- Si el usuario interrumpe la secuencia (pide detenerla entre un agente y otro), respeta eso: no lances el siguiente sin que te confirme que continúe.

---

### Fase 6 — Cierre

Reporta en una lista compacta:

- Spec implementado, `game-id`, y rama activa.
- Archivos nuevos/editados por la implementación (Fase 4).
- Resultado de `skin-designer`: skins listos o no, ratios de contraste si se reportaron.
- Resultado de cada corrida de `mobile-porter` (`jugar`, `detalle`): reglas M pasadas/falladas/n/a con motivo.
- La limitación heredada de `mobile-porter`: verificación por lectura de código, sin navegador ni dispositivo real — nunca afirmes "se ve bien en móvil".
- Recordatorio final, igual que `/spec-impl`:

  ```
  Próximo paso: verificar los criterios de aceptación del spec uno por uno.
  Si todos pasan, actualiza el estado del spec a "Implementado" (o el equivalente
  en el idioma de tu repo) y haz el commit final antes de mergear esta rama.
  ```

**Para ahí.** No mergees, no commiteas, no continúas con otro spec sin que se te pida explícitamente.

---

## Resumen del comportamiento esperado

```
/spec-impl-game 08-juego-tetris                      (spec plano)

  Fase 1    →  Encuentra specs/08-juego-tetris.md
  Fase 2    →  Estado "Aprobado" → ✅ continúa
  Fase 2.5  →  game-id = "tetris"
  Fase 3    →  git checkout -b spec-08-juego-tetris
               Muestra objetivo, alcance, plan y criterios
  Fase 4    →  Implementa paso a paso con pausas
               Verifica criterios + npm run build → limpio
  Fase 5    →  Agent(skin-designer, "tetris")        [espera resultado]
            →  Agent(mobile-porter, "jugar")          [espera resultado]
            →  Agent(mobile-porter, "detalle")        [espera resultado]
  Fase 6    →  Reporta resumen de los tres agentes + recordatorio de cierre

/spec-impl-game frogger/01-frogger-core               (spec en carpeta, estado real: Propuesto)

  Fase 1    →  Encuentra specs/frogger/01-frogger-core.md
  Fase 2    →  Estado "Propuesto" → ❌ se detiene
               Muestra el mensaje de error estándar
               No crea rama, no toca código, no lanza agentes

/spec-impl-game frogger                               (carpeta con varios specs)

  Fase 1    →  Encuentra la carpeta specs/frogger/, lista sus specs
               Pregunta cuál implementar → espera respuesta
```

**Creación de rama controlada por `AutoCreateBranch`** en `specs/.spec-config.yml`, igual que `/spec-impl`. Default `true`.

**El encadenado de agentes de la Fase 5 no tiene interruptor** — es la razón de ser de este comando frente a `/spec-impl`. Si algún día se necesita implementar un juego sin skins/móvil automáticos, se usa `/spec-impl` a secas.
