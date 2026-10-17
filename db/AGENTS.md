# db

The ticket store. One Postgres table on Neon, reached through Drizzle with the `postgres` driver.

Governing spec: [docs/specs/0001-ticket-model-and-storage.md](../docs/specs/0001-ticket-model-and-storage.md).

## Files

- `schema.ts`: the `tickets` table, the four enum types (`department_kind`, `ticket_category`, `ticket_priority`, `ticket_status`), the four named checks and the `created_at` index. `Ticket` and `NewTicket` come from here and are the only ticket types in the app.
- `index.ts`: `getDb()` reads `DATABASE_URL`, then builds one lazy `postgres` client and keeps it on `globalThis` so dev reloads do not open a pool per edit. `closeDb()` ends it for scripts.
- `tickets.ts`: `createTicket`, `getTicket` (a bad uuid returns `null`), `listTickets` (20 per page, newest first) and the guarded `setTicketStatus`.
- `migrations/`: generated SQL plus drizzle-kit metadata. Read the SQL before applying it; never edit it by hand.

## Commands

Run from the repo root. All of these need `DATABASE_URL` in `.env.local`.

```bash
pnpm db:generate   # diff schema.ts into db/migrations
pnpm db:migrate    # apply pending migrations
pnpm db:seed       # 25 demo tickets, refuses when the table is not empty
pnpm tsx --env-file=.env.local scripts/smoke.ts   # write one ticket, read it back in a new process
```

## Conventions

- `schema.ts` is the only source of truth for the shape. Later slices add columns there and generate a migration; they do not edit the table in the Neon console.
- `drizzle.config.ts` loads `.env.local` with `dotenv` because drizzle-kit runs outside Next.js. Scripts get it from `tsx --env-file=.env.local`.
- The connection uses `prepare: false`, `max: 1` and `connect_timeout: 10`. One direct connection string serves the app, the migrations and the seed.
- `setTicketStatus` refuses backward and same status moves through `lib/ticket-status.ts` before it writes, then runs one guarded update on `id` and the expected status. Zero rows changed means a follow up read decides between `not_found` and `status_changed`.
- A ticket only moves forward, and `resolved_at` is non null exactly when the status is `Resolved`, enforced by a database check.
- No code path logs, throws or renders a reporter email.

_Drafted by /sync from the introducing change, worth a quick human pass._
