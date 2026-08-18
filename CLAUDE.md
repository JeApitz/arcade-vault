# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform to play games online and compete for the highest score (per README.md, in Spanish). Implemented: home, game catalog/detail pages, auth, about + contact form, a game player with playable games (Asteroids, Tetris, Arkanoid, Snake and more...), and a Supabase-backed leaderboard / hall of fame.

There is no test runner configured yet.

## Skills

- Usa siempre /frontend-design para diseñar la interfaz de usuario.
- Usa /spec-game para diseñar el spec de un juego nuevo antes de programarlo (motor, canvas, catálogo en Supabase, leaderboard). Pregunta antes de escribir.
- Antes de implementar un juego nuevo, revisa `references/implemented-games.md` para saber qué juegos ya están implementados (ID, título, categoría, descripción breve, color) y evitar duplicados.
- Sigue usando /spec y /spec-impl (fernando-skills) para specs no relacionados a juegos.

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
