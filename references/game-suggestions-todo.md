# Sugerencias de juegos — ToDo

Memoria de `game-planner`. Un juego que aparece aquí no se vuelve a sugerir.
Estados: `[ ]` pendiente · `[x]` implementado · `~~tachado~~` descartado.

## Pendientes

- [ ] **DUELO** — VERSUS/magenta — Pong clásico contra la CPU, primero en llegar al marcador gana.
- [ ] **CASCADA CROMÁTICA** — PUZZLE/magenta — Bloques de colores caen en columnas, se agrupan y explotan en cascada.
- [ ] **INVERSIÓN** — PUZZLE/cyan — Gravedad direccional: rótala para deslizar y encajar piezas contra las paredes.
- [ ] **ENCASTRE** — PUZZLE/green — Piezas caen sobre un tablero con casillas objetivo que hay que cubrir exacto.
- [ ] **FUSIÓN VERTICAL** — PUZZLE/yellow — Bloques numerados caen y se fusionan al chocar, un 2048 en caída libre.
- [ ] **ESGRIMA REFLEJO** — VERSUS/cyan — Duelo de espadas: para el golpe de la CPU en la ventana exacta de tiempo.
- [ ] **PISTOLERO** — VERSUS/yellow — Duelo de desenfunde rápido: gana quien dispara más rápido tras la señal.
- [ ] **TIRA Y AFLOJA** — VERSUS/green — Pulseo de tecla contra la CPU para arrastrar la cuerda a tu lado.
- [ ] **INVASIÓN** — SHOOTER/green — Oleadas de invasores descienden en formación, defiéndete antes de que lleguen abajo.
- [ ] **TORRE DEFENSOR** — SHOOTER/yellow — Defensa de base fija disparando 360° contra oleadas desde todos los lados.
- [ ] **GALERÍA DE BLANCOS** — SHOOTER/magenta — Galería de tiro clásica: acierta blancos antes de que se acabe el tiempo.
- [ ] **LABERINTO** — ARCADE/yellow — Recolecta puntos en un laberinto fijo esquivando fantasmas patrulleros.
- [ ] **EXCAVADOR** — ARCADE/green — Cava túneles y recoge tesoros mientras un enemigo te persigue.
- [ ] **FUGA** — ARCADE/magenta — Recolecta objetos en pantalla fija mientras un enemigo te persigue con IA simple.
- [ ] **TORRE ALTA** — ARCADE/yellow — Escala plataformas esquivando barriles que caen mientras subes al objetivo.
- [ ] **PISO FRÁGIL** — ARCADE/magenta — Salta entre plataformas que se rompen al pisarlas antes de caer al vacío.
- [ ] **REBOTE LETAL** — ARCADE/cyan — Recolecta monedas en pantalla fija esquivando enemigos que rebotan en las paredes.
- [ ] **CERCO** — PUZZLE/green — Traza territorio en una cuadrícula mientras un enemigo intenta cortarte el rastro.
- [ ] **ECO MENTAL** — PUZZLE/magenta — Repite secuencias de memoria cada vez más largas antes de que se acabe el tiempo.
- [ ] **CIRCUITO** — PUZZLE/yellow — Enciende todas las celdas de la cuadrícula encadenando toggles antes del reloj.

## Ya implementados

- [x] **ASTEROIDES** — SHOOTER/cyan — spec 05
- [x] **TETRIS** — PUZZLE/yellow — spec 08
- [x] **ARKANOID** — ARCADE/green — spec 09
- [x] **SNAKE** — ARCADE/green — spec 10

## Descartados

_(ninguno)_

---

## Fichas

### DUELO

- **Encaje**: la categoría VERSUS está completamente vacía en el catálogo real (solo ARCADE, PUZZLE, SHOOTER cubiertas) y el color magenta no se usa aún. Un Pong clásico jugador-vs-CPU cabe directo en el contrato de motor: canvas 2D, un jugador humano, sesión corta, y un `score` ascendente natural (puntos anotados) que tiene sentido en `/salon`.
- **Mecánica/HUD**: `secondary` = puntos anotados por la CPU (para dar contexto del marcador sin inflar el score guardado), `hudLabel` = "RIVAL". `score` sube 1 por cada punto anotado por el jugador; la partida termina al llegar alguno de los dos a un marcador límite (p.ej. 11).
- **Controles**: Flecha arriba / Flecha abajo (o W/S) para mover la paleta vertical; Espacio para pausar.
- **Motor**: Baja — física de rebote simple (AABB + reflexión de ángulo según punto de impacto en la paleta), IA de la CPU es un seguimiento de la pelota con velocidad limitada y margen de error creciente en niveles más altos.
- **Riesgos**: definir cómo escalar dificultad de la IA por nivel, qué pasa si el jugador pierde (status "gameover" vs seguir sumando score parcial), y si el score final a guardar es "puntos anotados totales" o algún combo con margen de victoria.
- **Sugerido**: 2026-08-20

### CASCADA CROMÁTICA

- **Encaje**: sin match-3-por-caída en el catálogo; complementa Tetris/Arkanoid con mecánica de explosión por color y reacciones en cascada.
- **Mecánica/HUD**: `secondary` = racha de combos consecutivos, `hudLabel` = "COMBO"
- **Controles**: flechas izquierda/derecha mueven la columna de caída, flecha abajo acelera; grupos de 3+ bloques del mismo color adyacentes explotan y el resto cae en cascada.
- **Motor**: Media — requiere flood fill para detectar grupos conectados y recalcular caída tras cada explosión.
- **Riesgos**: balancear la tasa de aparición de colores para evitar tableros sin combos posibles.
- **Sugerido**: 2026-08-20

### INVERSIÓN

- **Encaje**: ningún juego actual usa gravedad como mecánica central manipulable; aporta variación fuerte al eje puzzle.
- **Mecánica/HUD**: `secondary` = líneas completadas, `hudLabel` = "LÍNEAS"
- **Controles**: WASD o flechas rotan la dirección de gravedad (arriba/abajo/izq/der), espacio suelta la pieza activa.
- **Motor**: Media — simular gravedad en las cuatro direcciones sobre grid y recalcular colisiones/caída de todas las piezas.
- **Riesgos**: la reordenación masiva de piezas al cambiar gravedad puede ser costosa en canvas si no se optimiza el recorrido del grid.
- **Sugerido**: 2026-08-20

### ENCASTRE

- **Encaje**: cubre el hueco de "encaje de formas contra objetivo fijo", distinto de limpiar líneas como Tetris.
- **Mecánica/HUD**: `secondary` = casillas objetivo cubiertas, `hudLabel` = "OBJETIVOS"
- **Controles**: izquierda/derecha mueven la pieza, arriba rota, abajo acelera la caída.
- **Motor**: Media — lógica de poliominós estándar más verificación de cobertura exacta de casillas marcadas por nivel.
- **Riesgos**: generar niveles de objetivos que sean siempre solucionables con las piezas disponibles.
- **Sugerido**: 2026-08-20

### FUSIÓN VERTICAL

- **Encaje**: mecánica de fusión numérica en caída libre, sin equivalente en el catálogo; motor simple y muy jugable.
- **Mecánica/HUD**: `secondary` = valor máximo de fusión alcanzado, `hudLabel` = "MÁXIMO"
- **Controles**: izquierda/derecha mueven la columna, abajo suelta el bloque; bloques iguales se fusionan en uno de valor doble al chocar.
- **Motor**: Baja — grid simple con reglas de fusión tipo 2048, sin necesidad de flood fill ni gravedad direccional.
- **Riesgos**: evitar que el juego termine demasiado rápido por saturación de columnas; ajustar ritmo de aparición de bloques.
- **Sugerido**: 2026-08-20

### ESGRIMA REFLEJO

- **Encaje**: duelo de reflejos 1v1 contra CPU distinto de Pong: el jugador pulsa la tecla de parada correcta cuando el ícono de ataque de la CPU entra en su ventana de tiempo, con fintas que no deben pararse.
- **Mecánica/HUD**: `secondary` = golpes recibidos (vidas restantes), `hudLabel` = "GOLPES"
- **Controles**: barra espaciadora para parar, opcional flecha arriba/abajo para elegir alto/bajo.
- **Motor**: Baja — temporizadores, barra de ventana de tiempo dibujada en canvas y detección de pulsación en el frame correcto.
- **Riesgos**: diseñar la curva de dificultad para que no se sienta injusta; evitar confusión visual con DUELO (aquí no hay pelota ni pala).
- **Sugerido**: 2026-08-20

### PISTOLERO

- **Encaje**: duelo de tiro rápido estilo western por rondas, puro tiempo de reacción, sin pelota ni pala como en DUELO.
- **Mecánica/HUD**: `secondary` = racha de victorias, `hudLabel` = "RACHA"
- **Controles**: una sola tecla de disparo (barra espaciadora o clic).
- **Motor**: Baja — temporizador con delay aleatorio, medición de tiempo de reacción entre señal y pulsación, dos siluetas simples en canvas.
- **Riesgos**: penalización clara por disparo anticipado; la CPU debe variar su tiempo de reacción para mantener tensión sin ser imposible.
- **Sugerido**: 2026-08-20

### TIRA Y AFLOJA

- **Encaje**: duelo de fuerza contra la CPU con marcador central que se desplaza según quién pulse su tecla más rápido, mecánica de mash totalmente distinta a mover pala o disparar.
- **Mecánica/HUD**: `secondary` = rondas ganadas, `hudLabel` = "RONDAS"
- **Controles**: tecla de pulseo (alternar Q/P o mash de espacio), con decaimiento del marcador si se deja de pulsar.
- **Motor**: Baja — posición 1D del marcador por frame según input y fuerza simulada de la CPU, sin física compleja.
- **Riesgos**: evitar que se sienta como spam de tecla repetitivo; sumar rondas cortas con dificultad creciente para dar progresión.
- **Sugerido**: 2026-08-20

### INVASIÓN

- **Encaje**: cañón fijo en la base disparando hacia arriba contra formación de invasores que descienden y se aceleran; llena el hueco de "Space Invaders clásico".
- **Mecánica/HUD**: `secondary` = vidas restantes, `hudLabel` = "VIDAS"
- **Controles**: flechas izquierda/derecha mueven el cañón, espacio dispara.
- **Motor**: Baja — grid de sprites simples, colisión AABB, sin física compleja.
- **Riesgos**: balancear velocidad de oleadas para sesión corta.
- **Sugerido**: 2026-08-20

### TORRE DEFENSOR

- **Encaje**: torreta central fija que rota y dispara en cualquier dirección mientras enemigos convergen desde los bordes; distinto de Asteroides (nave inmóvil) y de Invasión (enemigos de todos lados, no en formación única).
- **Mecánica/HUD**: `secondary` = oleada actual, `hudLabel` = "OLEADA"
- **Controles**: mouse o flechas para apuntar/rotar torreta, clic o espacio para disparar.
- **Motor**: Media — spawn de enemigos en perímetro, cálculo de ángulos y trayectorias hacia el centro, colisión circular.
- **Riesgos**: definir bien apuntado con mouse vs teclado; mantener spawns balanceados.
- **Sugerido**: 2026-08-20

### GALERÍA DE BLANCOS

- **Encaje**: shooting gallery con blancos que aparecen en posiciones aleatorias por tiempo limitado; hueco distinto a todo lo shooter existente (sin nave ni oleadas, precisión contrarreloj).
- **Mecánica/HUD**: `secondary` = tiempo restante, `hudLabel` = "TIEMPO"
- **Controles**: mouse para apuntar, clic para disparar.
- **Motor**: Baja — spawn aleatorio de blancos con timers, hit-test por clic, sin física de proyectiles.
- **Riesgos**: depender de mouse/clic puede limitar accesibilidad táctil.
- **Sugerido**: 2026-08-20

### LABERINTO

- **Encaje**: come-puntos clásico en laberinto de pantalla fija con enemigos patrulleros; mecánica de esquivar/recoger distinta a Snake (sin cola) y al resto del catálogo.
- **Mecánica/HUD**: `secondary` = vidas restantes, `hudLabel` = "VIDAS"
- **Controles**: flechas o WASD para mover por el laberinto.
- **Motor**: Media — grid de laberinto fijo + IA simple de persecución/patrulla para 2-4 enemigos, colisiones en grid.
- **Riesgos**: mantener la IA de enemigos simple (patrones fijos o BFS básico) para no inflar el alcance.
- **Sugerido**: 2026-08-20

### EXCAVADOR

- **Encaje**: cavar túneles propios en una grilla de tierra recogiendo tesoros bajo persecución; mecánica de excavación sin parentesco con Snake ni los shooters.
- **Mecánica/HUD**: `secondary` = tesoros recogidos, `hudLabel` = "TESOROS"
- **Controles**: flechas o WASD para cavar y moverse.
- **Motor**: Media — grid destructible (tierra excavable) + un enemigo con persecución simple hacia el jugador.
- **Riesgos**: balancear velocidad de excavación vs. persecución del enemigo.
- **Sugerido**: 2026-08-20

### FUGA

- **Encaje**: recolección directa en arena fija con un solo perseguidor que acelera con el tiempo; variante más simple y rápida de armar que LABERINTO.
- **Mecánica/HUD**: `secondary` = objetos recolectados, `hudLabel` = "OBJETOS"
- **Controles**: flechas o WASD para moverse por la arena.
- **Motor**: Baja — sin grid de laberinto, solo colisiones círculo-círculo entre jugador, objetos y perseguidor.
- **Riesgos**: mantener la dificultad progresiva del perseguidor balanceada.
- **Sugerido**: 2026-08-20

### TORRE ALTA

- **Encaje**: escenario único vertical estilo Donkey Kong con barriles que caen mientras se sube hasta la meta; llena el hueco de "plataformas de escalada".
- **Mecánica/HUD**: `secondary` = vidas restantes, `hudLabel` = "VIDAS"
- **Controles**: flechas/WASD para moverse y subir escaleras, espacio para saltar un barril.
- **Motor**: Media — física simple de gravedad+colisión AABB, spawn periódico de barriles con trayectoria descendente.
- **Riesgos**: ajustar dificultad de spawn de barriles para que sea justo; requiere tilemap simple de plataformas/escaleras.
- **Sugerido**: 2026-08-20

### PISO FRÁGIL

- **Encaje**: pantalla única con grid de plataformas que se agrietan y rompen tras pisarlas; mecánica de gestión de riesgo distinta a lo ya implementado.
- **Mecánica/HUD**: `secondary` = plataformas restantes intactas, `hudLabel` = "PISO"
- **Controles**: flechas/WASD para moverse, espacio para saltar entre plataformas.
- **Motor**: Baja — grid estático de tiles con estado (intacto/agrietado/roto), sin enemigos IA complejos.
- **Riesgos**: balancear velocidad de degradación del piso para sesión corta pero justa.
- **Sugerido**: 2026-08-20

### REBOTE LETAL

- **Encaje**: escenario único con plataformas fijas, recolección de monedas esquivando enemigos que rebotan en línea recta contra paredes (estilo Bomb Jack simplificado).
- **Mecánica/HUD**: `secondary` = monedas recolectadas, `hudLabel` = "MONEDAS"
- **Controles**: flechas/WASD para moverse y saltar entre plataformas.
- **Motor**: Media — IA de rebote simple (reflexión de vector de velocidad), colisión jugador-enemigo y jugador-moneda.
- **Riesgos**: evitar que el patrón de rebote se vuelva predecible; cuidar el número de enemigos simultáneos por rendimiento.
- **Sugerido**: 2026-08-20

### CERCO

- **Encaje**: llena hueco de "trazado de territorio con persecución" (tipo Qix), mecánica no representada en el catálogo actual.
- **Mecánica/HUD**: `secondary` = porcentaje de área cercada, `hudLabel` = "ÁREA %"; `level` sube al superar umbrales de cobertura (75%, 90%...).
- **Controles**: flechas/WASD para mover el trazador por el borde y el interior de la cuadrícula.
- **Motor**: Media — relleno de polígono/flood-fill sobre grid y colisión rastro-enemigo, sin física compleja.
- **Riesgos**: el algoritmo de "cerrar área" es la parte más delicada de depurar; mantener grid pequeño (ej. 30x20) por rendimiento.
- **Sugerido**: 2026-08-20

### ECO MENTAL

- **Encaje**: puzzle de memoria contrarreloj puro, distinto a cualquier mecánica existente; encaje técnico directo (score = ronda alcanzada, sesión corta).
- **Mecánica/HUD**: `secondary` = vidas restantes, `hudLabel` = "VIDAS"; `level` = número de ronda/longitud de secuencia.
- **Controles**: clic/tap o teclas 1-4 sobre 4 celdas de color que se iluminan en secuencia.
- **Motor**: Baja — lógica de estados simple (mostrar secuencia, leer input, comparar), sin física ni colisiones.
- **Riesgos**: cuidar el timing de animación de "mostrar secuencia" para que no se sienta injusto en dificultades altas.
- **Sugerido**: 2026-08-20

### CIRCUITO

- **Encaje**: variante de lights-out con límite de tiempo y cadena de propagación, mecánica de puzzle lógico no presente en el catálogo.
- **Mecánica/HUD**: `secondary` = movimientos usados, `hudLabel` = "MOVIMIENTOS"; `level` = número de tablero/dificultad.
- **Controles**: clic/tap sobre celdas de una cuadrícula (ej. 5x5); cada clic alterna la celda y sus vecinas.
- **Motor**: Baja-Media — lógica de grid y toggle en cadena simple; generar tableros solucionables requiere cuidado.
- **Riesgos**: garantizar que cada tablero generado sea siempre resoluble (generación por "solución inversa" desde todo apagado).
- **Sugerido**: 2026-08-20
