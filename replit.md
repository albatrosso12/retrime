# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/rules` — Russian-language rules website for a Garry's Mod Balkan
  Conflict RP server, styled like Google Gemini. Routes:
  - `/` — Home with the rule sections, ranks, and document templates
  - `/chat/:id` — Standalone page for a player appeal (обращение). The form
    submits to `POST /api/appeals`, which forwards to the
    `ZAPIER_WEBHOOK_URL` for AI processing and Telegram/Discord delivery.
  - Chats and settings are stored in `localStorage` via the `useChats` and
    `useSettings` hooks.
- `artifacts/api-server` — Express API server. Routes are added under
  `src/routes/` and registered in `src/routes/index.ts`. The OpenAPI spec at
  `lib/api-spec/openapi.yaml` is the source of truth — run codegen after any
  change.

## Required Secrets

- `ZAPIER_WEBHOOK_URL` — Zapier "Catch Hook" URL that receives forwarded
  appeals from `POST /api/appeals`.
