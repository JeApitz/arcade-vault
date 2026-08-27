# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform to play games online and compete for the highest score (per README.md, in Spanish). Implemented: home, game catalog/detail pages, auth, about + contact form, a game player with playable games (Asteroids, Tetris, Arkanoid, Snake, Frogger and more...), and a Supabase-backed leaderboard / hall of fame.

There is no test runner configured yet.

## Skills

- Usa siempre /frontend-design para diseñar la interfaz de usuario.
- Usa /spec-game para diseñar el spec de un juego nuevo antes de programarlo (motor, canvas, catálogo en Supabase, leaderboard). Pregunta antes de escribir.
- Sigue usando /spec y /spec-impl (fernando-skills) para specs no relacionados a juegos.
- Usa /spec-impl-game para implementar un spec de juego ya `Aprobado` (acepta specs planos `specs/NN-juego-<nombre>.md` y specs en carpeta `specs/<game-id>/NN-*.md` de `game-jam`). Al terminar la implementación con el build limpio, encadena automáticamente y en secuencia (nunca en paralelo) `skin-designer <game-id>` → `mobile-porter jugar` → `mobile-porter detalle`.
- Antes de implementar un juego nuevo, revisa `references/implemented-games.md` para saber qué juegos ya están implementados (ID, título, categoría, descripción breve, color) y evitar duplicados.

Agentes (todos solo bajo petición explícita por nombre):

- `game-planner`: decide qué juego(s) nuevo(s) agregar (`game-planner N`); memoria en `references/game-suggestions-todo.md`. Alimenta `/spec-game`.
- `game-jam`: convierte un tema en un juego nuevo con tres specs escalonados en `specs/game-jam/<game-id>/`; no escribe código.
- `skin-designer`: implementa los tres skins obligatorios de un juego (`clasico`, `neon`, `retro`); un juego por corrida (`skin-designer <juego>`); memoria en `references/game-with-themes.md`.
- `mobile-porter`: audita y corrige una ruta del sitio en móvil/PWA contra su rúbrica M1–M12; una ruta por corrida (`mobile-porter <ruta>`); memoria en `references/mobile-readiness.md`.
- `game-performance-booster`: audita y corrige rendimiento y encuadre de canvas de un juego contra su rúbrica P1–P10; un juego por corrida (`game-performance-booster <juego>`); memoria en `references/game-performance.md`.
- `security-auditor`: audita la seguridad de la base de datos Supabase y del código de la app contra la rúbrica S1–S12, en barrido completo por corrida (`security-auditor`, opcional `db`/`auth`/`app`). Solo reporta hallazgos y fixes propuestos, no corrige; memoria en `references/security/security-status.md`.

## Architecture

- Next.js 16 App Router. Routes: `/` (home), `/games` (catálogo), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (jugar), `/salon` (hall of fame / leaderboard), `/about`, `/auth`, plus `app/api/contact` (Resend).
- Cada juego tiene su propio motor + canvas en `app/juegos/[id]/jugar/` (`<game>-engine.ts`, `<game>-canvas.tsx`, sprites/levels donde aplica), registrados en `engines.ts` y renderizados vía `game-player.tsx`.
- Supabase: cliente en `app/lib/supabase/{client,server}.ts`; catálogo de juegos y scores en `app/lib/games.ts` / `app/lib/scores.ts`. Requiere `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD` (ver `.env.template`).
- Contacto vía Resend en `app/api/contact/route.ts`, requiere `RESEND_API_KEY`.
- Styling via Tailwind CSS v4 (`@tailwindcss/postcss`), global styles in `app/globals.css`.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Desarrollo spec-driven: specs viven en `specs/NN-nombre.md` (estado + dependencias); juegos de referencia sin implementar en `references/started-games/`. Usa [fernando-skills](https://github.com/Klerith/fernando-skills) (`/spec`, `/spec-impl`) y el skill local `/spec-game`, instalados via `npx skills@latest add Klerith/fernando-skills`.

## Before writing code

Per `AGENTS.md`, this project pins a Next.js version with breaking changes relative to training data. Read the relevant guide under `node_modules/next/dist/docs/` before implementing anything Next.js-specific (routing, data fetching, config, etc.), and follow any deprecation notices found there.
