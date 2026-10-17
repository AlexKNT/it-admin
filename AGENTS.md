<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# it-admin

## Stack

- **Language / Runtime**: TypeScript 5, React 19.3, Node 20 type definitions
- **Framework**: Next.js 16.4.2, App Router, Turbopack for dev
- **Key dependencies**: Tailwind CSS 4 through `@tailwindcss/turbopack`, `eslint-config-next`, Drizzle ORM with `postgres` against Neon Postgres, `zod` for input checks
- **Package manager**: pnpm 12.11.2, pinned in `packageManager`

## Build approach

Tracer Bullet: each slice runs end to end through storage, logic and page, so every slice is working and demoable. Workflow tier: Prototype.

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
# none configured yet, /test sets one up on first use

# Database (needs DATABASE_URL in .env.local; the Neon CLI pulls it with `neon deploy`)
pnpm db:generate   # write a migration from db/schema.ts
pnpm db:migrate    # apply pending migrations
pnpm db:seed       # 25 demo tickets, refuses when the table is not empty
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Strict TypeScript, no `any`. If a type is genuinely awkward, say so rather than cast.
- Comment the decisions, not the syntax.
- Use `pnpm` only. The lockfile is `pnpm-lock.yaml` and `packageManager` pins the version.
- App Router only, pages live in `app/`. The `@/*` alias points at the repo root.
- `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts`. Read `node_modules/next/dist/docs/` before changing framework behaviour, this major version differs from what older docs describe.
- Keep answers short. When a decision is needed, ask one question and say which way you would go.
- Say plainly when something failed. Never work around a failure quietly.
- `db/schema.ts` is the source of truth for the database shape. Change it, then `pnpm db:generate` and `pnpm db:migrate`; never hand edit the Neon console, the next migration reverts it.
- A `"use server"` module may only export async functions, so shared action types and initial state live in `lib/`, not beside the actions.
- Never log, throw or render a reporter email. Error messages name the field only.
- `.agents/` holds vendored skill content and is excluded from ESLint. Put lint rules in `eslint.config.mjs`, not on those files.
- pnpm blocks dependency build scripts by default. A tool that needs one (esbuild, used by `tsx` and `drizzle-kit`) goes in `pnpm-workspace.yaml` under `allowBuilds`.

## Context files

- [db/AGENTS.md](db/AGENTS.md): the ticket store, its schema, migrations and data layer functions

## Agent skills

- [architect](.agents/skills/architect/): `JavaScript-Mastery-Pro/skills`, designs features and writes specs
- [scope](.agents/skills/scope/): `JavaScript-Mastery-Pro/skills`, keeps the product scope in `docs/scope/`
- [develop](.agents/skills/develop/): `JavaScript-Mastery-Pro/skills`, builds features from a spec
- [test](.agents/skills/test/): `JavaScript-Mastery-Pro/skills`, writes test suites for changed code
- [check](.agents/skills/check/): `JavaScript-Mastery-Pro/skills`, verifies work before it ships
- [debug](.agents/skills/debug/): `JavaScript-Mastery-Pro/skills`, finds and fixes a bug's root cause
- [audit](.agents/skills/audit/): `JavaScript-Mastery-Pro/skills`, writes and maintains these context files
- [sync](.agents/skills/sync/): `JavaScript-Mastery-Pro/skills`, refreshes context after a change
- [document](.agents/skills/document/): `JavaScript-Mastery-Pro/skills`, writes PR notes and changelogs
- [neon-drizzle](.agents/skills/neon-drizzle/): `neondatabase/ai-rules`, Drizzle ORM on Neon (schema, migrations, connection setup)

MCP servers: Neon (connected)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
