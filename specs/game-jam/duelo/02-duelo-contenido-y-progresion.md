# 02 — Juego Duelo — Contenido y progresión

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, SPEC 07, `specs/game-jam/duelo/01-duelo-nucleo-jugable.md`
**Fecha:** 2026-08-20
**Objetivo:** Extender `DueloEngine` con una partida a mejor de varios sets y una dificultad de CPU creciente por set, dando a `level` y `score` un significado real de progresión.

## Alcance

**Incluye:**

- Extensión del mismo motor `app/juegos/[id]/jugar/duelo-engine.ts` creado en SPEC 01 (no se crea un motor nuevo): la partida pasa de "un único set a 11 puntos" a **mejor de 5 sets** (`SETS_TO_WIN = 3`); cada set individual se sigue jugando hasta `WIN_SCORE = 11` puntos, igual que en SPEC 01.
- Nuevo módulo `app/juegos/[id]/jugar/duelo-levels.ts`, siguiendo el mismo patrón que `arkanoid-levels.ts`: exporta `DIFFICULTY: DuelDifficulty[]`, un arreglo de 5 entradas (una por set) con `cpuMaxSpeed` creciente y `cpuErrorMargin` (zona muerta de la IA) decreciente a medida que avanza el número de set, de forma que la CPU sea perceptiblemente más difícil de vencer en el set 5 que en el set 1.
- `DueloEngine` gana estado interno nuevo: `setsWonPlayer`, `setsWonCpu`, `playerSetScore`, `cpuSetScore` (marcador del set en curso). Al llegar cualquiera de los dos marcadores del set a `WIN_SCORE`, el motor: incrementa `setsWonPlayer`/`setsWonCpu`, resetea `playerSetScore`/`cpuSetScore` a 0, sube `level` en 1 (hasta un máximo de 5), aplica la entrada correspondiente de `DIFFICULTY[level - 1]` a la IA de la CPU, y vuelve a sacar desde el centro. Si `setsWonPlayer` o `setsWonCpu` llegan a `SETS_TO_WIN`, la partida termina en `status: "gameover"`.
- Reinterpretación de las stats reportadas (mismo contrato `DueloStats` de SPEC 01, mismos nombres de campo, semántica ajustada):
  - `score` deja de ser el marcador de un único set y pasa a ser la **suma acumulada de puntos anotados por el jugador a lo largo de toda la partida** (todos los sets jugados hasta el momento), sin resetear entre sets. Da al leaderboard un rango mucho mayor que 0–11.
  - `rival` (→ `secondary`, `hudLabel: "RIVAL"`) sigue representando el marcador de la CPU, pero ahora es el del **set en curso** (`cpuSetScore`), y se resetea a 0 al empezar cada set nuevo — refleja el marcador visible del set que se está jugando en ese momento, igual que lo haría un marcador real de Pong por sets.
  - `level` pasa de estar fijo en `1` a representar el **número de set actual** (`1`..`5`), subiendo cada vez que se cierra un set.
- Ajuste de `onStats`: sigue notificando solo en cambios de `score`/`rival`/`level`/`status`, ahora incluyendo también los cambios que ocurren al cerrar un set (reinicio de `rival`, incremento de `level`).
- El HUD genérico de `game-player.tsx` no cambia de código (sigue leyendo `score`/`secondary`/`level`/`status` tal cual), pero ahora muestra números con el significado nuevo descrito arriba, sin ningún cambio en `engines.ts` más allá de que la partida dura más.

**No incluye (fuera de alcance de este spec):**

- HUD propio dibujado en canvas (marcador arcade, indicador visual de sets ganados, línea central estilizada, estela de partícula de la pelota, animación de "SET GANADO"): eso es SPEC 03.
- Cambios a la fila `duelo` en `games`, a `.cover-duelo`, o a la migración de catálogo: la fila ya existe desde SPEC 01 y no se vuelve a tocar.
- Assets binarios en `public/juegos/duelo/`: la dificultad progresiva se implementa solo con datos (`duelo-levels.ts`) y ajustes de física, sin sprites ni sonido.
- Nuevos controles o teclas: se sigue jugando exclusivamente con `↑`/`↓`/`W`/`S`.
- Multijugador local o online.
- Sonido/efectos de audio.
- Controles táctiles/en pantalla para mobile.
- Persistencia adicional más allá de `scores` (sin localStorage, sin IndexedDB).
- Recalcular dinámicamente `best`/`plays` de la fila `duelo` en `games` tras jugar.
- Rate limiting, captcha o cualquier protección anti-spam sobre el insert público de `scores` (mismo riesgo conocido documentado desde SPEC 06).
- Deduplicación o límite de puntajes por jugador.
- Cualquier cambio a `app/data/games.ts`.

## Modelo de datos

```ts
// app/juegos/[id]/jugar/duelo-levels.ts
export interface DuelDifficulty {
  cpuMaxSpeed: number; // px/s, velocidad máxima de la pala de la CPU — sube con el set
  cpuErrorMargin: number; // px, zona muerta central de la IA — baja con el set (CPU más precisa)
}

export const DIFFICULTY: DuelDifficulty[]; // 5 elementos, uno por set (índice 0 = set 1 .. índice 4 = set 5)
```

```ts
// app/juegos/[id]/jugar/duelo-engine.ts (mismo contrato de SPEC 01, semántica de campos ajustada)
interface DueloStats {
  score: number; // puntos del jugador acumulados en TODA la partida (todos los sets), nunca resetea dentro de la partida
  rival: number; // puntos de la CPU en el SET actual — se mapea a `secondary`, se resetea al empezar cada set
  level: number; // número de set actual, 1..5, sube al cerrar un set
  status: "playing" | "dead" | "gameover"; // "gameover" cuando setsWonPlayer o setsWonCpu llega a 3
}
```

`DueloEngine` gana los campos internos `setsWonPlayer`, `setsWonCpu`, `playerSetScore`, `cpuSetScore` (no forman parte de `DueloStats`, son estado interno del motor igual que `killsSinceSpawn` en `AsteroidsEngine`). No hay más datos fuera de este contrato.

### HUD propio

Ninguno todavía en este spec (llega en SPEC 03). El HUD genérico sigue siendo la única superficie visible de estas stats.

## Plan de implementación

1. **Tabla de dificultad.** Crear `app/juegos/[id]/jugar/duelo-levels.ts` con `DIFFICULTY: DuelDifficulty[]` (5 entradas, `cpuMaxSpeed` creciente y `cpuErrorMargin` decreciente). Sin conectar todavía al motor.
2. **Motor.** Extender `app/juegos/[id]/jugar/duelo-engine.ts` (creado en SPEC 01): agregar `setsWonPlayer`/`setsWonCpu`/`playerSetScore`/`cpuSetScore`, lógica de cierre de set (reset de marcador de set, incremento de `level`, aplicación de `DIFFICULTY[level - 1]` a la IA), y condición de fin de partida a `SETS_TO_WIN = 3` sets ganados. Ajustar el cálculo de `score` reportado a la suma acumulada de puntos del jugador en toda la partida.
3. **Verificación manual.** `npm run dev`, jugar una partida completa en `/juegos/duelo/jugar` hasta el final (mejor de 5 sets): confirmar que `level` sube de 1 a 5 a medida que se cierran sets, que `RIVAL` se resetea a 0 al empezar cada set nuevo, que `Puntuación` sigue acumulando puntos del jugador sin resetear entre sets, que la CPU se siente perceptiblemente más difícil en el set 4–5 que en el set 1 (velocidad de pala y precisión), y que la partida termina en `gameover` exactamente cuando el jugador o la CPU ganan 3 sets (no antes). Confirmar que `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` siguen funcionando igual que en SPEC 01 con la nueva estructura de sets. Guardar el puntaje final (acumulado de toda la partida) y verlo reflejado en `/salon` (pestaña DUELO) y en el leaderboard de `/juegos/duelo` tras recargar.
4. **Build.** `npm run build` sin errores de tipos ni de rutas.

Cada paso deja el sistema funcional y es commiteable por separado.

## Criterios de aceptación

```markdown
- [ ] La partida se juega a mejor de 5 sets (termina cuando el jugador o la CPU ganan 3), no a un único set a 11 como en SPEC 01.
- [ ] `level` (HUD genérico) sube de 1 a 5 a medida que se cierran sets sucesivos.
- [ ] `Puntuación` (`score`) acumula los puntos del jugador de todos los sets jugados en la partida, sin resetear al cerrar un set.
- [ ] `RIVAL` (`secondary`) refleja el marcador de la CPU del set en curso y vuelve a 0 al empezar cada set nuevo.
- [ ] La dificultad de la CPU (velocidad máxima de pala, precisión/zona muerta) aumenta perceptiblemente en sets más avanzados, según `duelo-levels.ts`.
- [ ] La partida termina en `status: "gameover"` exactamente cuando el jugador o la CPU ganan 3 sets.
- [ ] `PAUSA`/`REANUDAR`, `FIN` y `JUGAR DE NUEVO` siguen funcionando con la estructura de sets, sin romper el flujo descrito en SPEC 01.
- [ ] Guardar el puntaje final (acumulado) al terminar la partida lo hace aparecer en `/salon` y en el leaderboard de `/juegos/duelo` tras recargar la página.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.
```

## Decisiones tomadas y descartadas

- **Mejor de 5 sets (`SETS_TO_WIN = 3`), cada set a 11 puntos, en vez de un único set más largo (ej. a 21 puntos).** Da progresión real de dificultad y una razón natural para que `level` suba, sin inventar una mecánica ajena a Pong; alternativa descartada: subir el nivel cada N puntos anotados sin estructura de sets, que sería menos legible para el jugador (no sabría cuándo "sube de nivel").
- **`score` guardado pasa a ser acumulado de toda la partida, no del set actual.** Resuelve directamente el riesgo de rango bajo (0–11) documentado en SPEC 01; con 5 sets a 11 puntos el rango práctico sube a decenas, más coherente con el resto del catálogo en `/salon`.
- **`rival`/`secondary` se mantiene como marcador del set en curso (no acumulado), a diferencia de `score`.** Refleja el marcador real y visible de un set de Pong en juego; acumular también `rival` haría que el HUD genérico no reflejara nunca el "11 a X" real de un set, que es la referencia visual esperada por el jugador mientras compite.
- **Tabla de dificultad extraída a `duelo-levels.ts`, no como constantes sueltas dentro del motor.** Sigue el precedente ya establecido por `arkanoid-levels.ts` (SPEC 09) para mantener datos de contenido separados de la lógica del motor.
- **Dirección de la escala de dificultad: velocidad de la CPU sube y su margen de error baja a medida que sube el nivel/set (CPU más difícil, no más fácil).** Se documenta explícitamente porque es la interpretación con sentido para una progresión de dificultad ascendente; una escala inversa dejaría los sets finales más fáciles que los iniciales, lo cual contradice el objetivo de este spec.
- **Sin HUD propio en canvas todavía.** Se pospone a SPEC 03 para mantener este spec centrado exclusivamente en datos/progresión, sin mezclar cambios de lógica con cambios visuales.

## Riesgos identificados

- **Curva de dificultad mal calibrada puede hacer el set 5 injugable o el set 1 demasiado fácil.** Mitigación: verificación manual explícita en el paso 3 jugando una partida completa de principio a fin, ajustando `DIFFICULTY` si la CPU se siente injusta en los extremos.
- **Reinterpretar `score`/`rival` a mitad del desarrollo del juego (distinto significado que en SPEC 01) puede confundir en `/spec-impl` si no queda claro que es un cambio intencional.** Mitigación: la semántica nueva está documentada explícitamente en "Modelo de datos" y "Decisiones", contrastada línea por línea contra SPEC 01.
- **El reseteo de `playerSetScore`/`cpuSetScore` al cerrar un set podría no dispararse en el mismo frame en que se cumple la condición de victoria del set, dejando el marcador un frame "atascado" en 11.** Mitigación: el cierre de set se resuelve de forma síncrona dentro del mismo `update()` que detecta el punto ganador, antes del siguiente `reportStats()`, verificado manualmente en el paso 3.
