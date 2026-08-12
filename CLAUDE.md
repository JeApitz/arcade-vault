# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform to play games online and compete for the highest score (per README.md, in Spanish). Currently an unmodified `create-next-app` scaffold; no game features, routes, or tests exist yet beyond the default homepage.

## Commands

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`)

There is no test runner configured yet.

## Architecture

- Next.js 16 App Router, single route at `app/page.tsx` / `app/layout.tsx`. No other routes, API handlers, or components exist yet.
- Styling via Tailwind CSS v4 (`@tailwindcss/postcss`), global styles in `app/globals.css`.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Uses [fernando-skills](https://github.com/Klerith/fernando-skills) spec-driven design skills (`/spec`, `/spec-impl`), installed via `npx skills@latest add Klerith/fernando-skills`.

## Before writing code

Per `AGENTS.md`, this project pins a Next.js version with breaking changes relative to training data. Read the relevant guide under `node_modules/next/dist/docs/` before implementing anything Next.js-specific (routing, data fetching, config, etc.), and follow any deprecation notices found there.
