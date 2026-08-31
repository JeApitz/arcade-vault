-- Arcade Vault — catálogo de juegos (copia literal de dev, 2026-08-31).
-- Idempotente: on conflict re-sincroniza cada fila sin duplicar ni romper FK de scores.
-- No incluye scores ni usuarios: PROD arranca con el leaderboard vacío.

insert into public.games (id, title, short, long, cat, cover, color, best, plays) values
('arkanoid','ARKANOID','Destruye hileras de bloques a base de rebotes calculados.','Una pala se desliza al borde de la pantalla, lanzando una pelota que astilla bloques de colores en explosiones de píxeles. Cinco niveles de dificultad creciente ponen a prueba tu reflejo antes de que la pelota caiga en el vacío.','ARCADE','cover-arkanoid','green',0,'0'),
('asteroides','ASTEROIDES','Sobrevive al campo de rocas espaciales.','Pilota tu nave triangular entre bloques de roca a la deriva. Dispara para partirlos en fragmentos cada vez más pequeños, encadena niveles y no dejes que el vacío te consuma.','SHOOTER','cover-asteroides','cyan',63700,'3.9K'),
('frogger','FROGGER','Cruza la carretera y el río sin convertirte en papilla.','Guía a tu rana a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.','ARCADE','cover-frogger','lime',0,'0'),
('snake','SNAKE','Crece sin morder tu propia cola.','Una serpiente de luz recorre una grilla oscura cazando fruta real, pixel a pixel. Cada bocado la alarga y acelera el ritmo del juego. Un giro en falso contra el borde o tu propia cola y todo termina ahí.','ARCADE','cover-snake','green',0,'0'),
('tetris','TETRIS','Encaja piezas geométricas antes de que se acumulen hasta el techo.','Bloques de siete formas caen desde la oscuridad del vacío digital. Rótalos, encástralos y despeja líneas completas para sobrevivir a un ritmo que solo acelera. Un clásico reescrito en píxeles de neón.','PUZZLE','cover-tetris','yellow',0,'0')
on conflict (id) do update set
  title = excluded.title,
  short = excluded.short,
  long  = excluded.long,
  cat   = excluded.cat,
  cover = excluded.cover,
  color = excluded.color,
  best  = excluded.best,
  plays = excluded.plays;
