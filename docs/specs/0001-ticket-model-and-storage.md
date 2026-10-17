# 0001. Ticket model and storage on Neon Postgres

**Date**: 2026-10-17
**Status**: Accepted

## Summary

Tickets live in a hosted Postgres database on Neon, in one table that holds every ticket. Four fixed lists (department, category, priority, status) are enforced by the database itself. The app talks to the table through Drizzle, which gives typed queries and one migration file per change. Both slices (report a ticket, resolve a ticket) build on this single data layer and one pair of server action signatures, so the shape is settled before either page exists.

## Context

> ⚠️ Premise note: A one table helpdesk does not usually need a hosted database. A file based database would remove the network hop, the free tier account and the secret. The hosted choice buys a real Postgres that outlives the course project, at the cost of a demo that fails when the network or the free tier does. The ticket also grew from the four fields the scope promised (title, description, status, created time) to ten, adding a reporter identity, a department, a category and a priority. That is more form work than the scope line suggested. Both are accepted tradeoffs, recorded here so nobody rediscovers them mid build.

The product is a small internal helpdesk for one university project. A person reports a problem, and one admin works through the list. There are no accounts and no roles. Volume is tiny: tens of records, one admin, one page of work.

The ticket is the only record, and it carries personal data: a reporter name, an email and a department. The department, category, priority and status are each a closed list. Two rules matter for later slices: a ticket only moves forward through its states, and a resolved ticket keeps the moment it was resolved. The list reads newest first, twenty at a time.

The team is one developer working inside a course deadline. The framework is Next.js 16 with Cache Components enabled, strict TypeScript, and pnpm. No test runner is configured yet, so the first checks are manual and the build plan says what to check. Demo reliability matters more than throughput.

Without this decision every later slice would invent the ticket shape, the table, the allowed values and the list query for itself. The two slices would then disagree, and the second one would force a change to the first.

## Requirements

**User stories**:
- As a reporter, I want my ticket stored with my contact details so the admin can act on it and reply.
- As the admin, I want the newest tickets first, twenty at a time, so I can work through a queue without scrolling forever.
- As the developer, I want one typed ticket contract and one migration history so both slices build on the same shape.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `pnpm db:migrate` against an empty Neon database creates the `tickets` table with the four enum types, every column, the length and state checks and the `created_at` index. Running it a second time changes nothing.
- **AC-2**: A ticket created through `createTicket` comes back with a generated uuid, status `Open`, `created_at` and `updated_at` set and `resolved_at` null. A separate Node process started after the dev server has stopped reads the same ticket through `getTicket`.
- **AC-3**: `createTicket` refuses invalid input before any write: a missing name, email, department, category, priority or description; an unknown enum value; a title outside 3 to 120 characters; a description outside 10 to 2000 characters; an email that is not an email. Each refusal names the field, and the row count does not change.
- **AC-4**: `listTickets(1)` returns at most 20 tickets, newest first with `created_at` then `id` as the order, plus the total count. `listTickets(2)` returns the next 20 with no overlap when more than 20 exist, even when two tickets share a timestamp. `pageCount` is the total divided by 20, rounded up, and never below 1.
- **AC-5**: `setTicketStatus` accepts the forward moves only: `Open` to `In progress`, `Open` to `Resolved` and `In progress` to `Resolved`. Moving to `Resolved` sets `resolved_at`. Every accepted move refreshes `updated_at`. Any backward move, and a move to the status the ticket already has, is refused with `invalid_move`.
- **AC-6**: Two updates that resolve the same ticket from `Open` at the same time leave exactly one winner. The other returns `status_changed`, `resolved_at` keeps the winner's value, and no row is left half updated.
- **AC-7**: `parsePageParam(value: string | string[] | undefined)` turns a missing, empty, non numeric, zero or negative value into page 1, accepts digits only after trimming, caps the result at 1,000,000, never throws, and never passes a non integer to SQL. A page past the last page returns an empty items list together with the real total and page count, so the list page can show an empty state and a link to page 1.
- **AC-8**: With `DATABASE_URL` missing, the app does not crash at import, and the first data access throws an error whose message names `DATABASE_URL` and prints no connection string. `app/error.tsx` exists as the shared error boundary, renders a fixed message with a retry control, and from slice 1 on it catches any page below it that cannot reach the database.
- **AC-9**: No code path logs a reporter email, and no thrown message or error copy contains one. The database layer and the actions put no email value into a `console` call, a thrown error or an error boundary message; messages name the field only. The form may echo the submitted value and the list may display the column.
- **AC-10**: `pnpm db:seed` inserts 25 demo tickets when the table is empty and refuses with a message when it is not. It never runs during build, dev, migrate or start.
- **AC-11**: The two server actions expose typed results the slices can consume, and neither throws for expected validation, state or database failures. `createTicketAction` returns a `CreateTicketState` with per field errors, the submitted values and, on success, the new id. `setTicketStatusAction` returns `{ ok: true, ticket }` or `{ ok: false, code }` from the `TicketErrorCode` union. Both revalidate `/admin`.

## Options considered

### Option 1: SQLite file with better-sqlite3

One file on disk, read and written by a native Node module, with hand written SQL.

**Pros**:
- No account, no network hop, no secret. The demo runs on any laptop.
- Real SQL with constraints, and a single file to copy or delete.

**Cons**:
- The file lives with the deployment, which is awkward on serverless platforms.
- Two hosts writing the file is a problem, so the app stays on one machine.

### Option 2: Hosted Postgres on Neon with Drizzle and postgres.js

A free Neon Postgres project, typed access through Drizzle, migrations generated by drizzle-kit, and the postgres.js driver over a single pooled connection string.

**Pros**:
- A real Postgres with enum types, check constraints and predictable concurrent updates.
- Nothing to install or run locally, and the database outlives the course project.
- Typed schema and migration files give the later slices a stable contract.

**Cons**:
- The app needs the network and a free tier account to work at all.
- A connection string secret to manage, and a latency floor per query.

### Option 3: Hosted Postgres on Neon with Prisma

The same database, with Prisma's schema file, generated client and migrate command.

**Pros**:
- Very common, with a readable schema file and a well known migrate flow.
- Strong editor support and a large set of examples.

**Cons**:
- A code generation step and a client engine to keep in step with the schema.
- More moving parts for a one table project than the query needs.

### Option 4: A plain JSON file on disk

Tickets held in one JSON array, rewritten on every change.

**Pros**:
- Zero dependencies and trivial to read by hand.
- Fast enough for tens of records.

**Cons**:
- Every write rewrites the whole file, so two writes at once lose data.
- No types, no constraints, no query, and every check is hand written.

## Decision

**Chosen option**: Option 2: Hosted Postgres on Neon with Drizzle and postgres.js

Tickets are stored in one Postgres table on Neon, reached through Drizzle with postgres.js, with the closed lists as Postgres enum types, migrations generated and applied by drizzle-kit, input checked by zod, and writes exposed as server actions that return typed state.

**Implementation skills**: `neon-drizzle` (`neondatabase/ai-rules`, `.agents/skills/neon-drizzle/`)

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Database | Neon Postgres | Plain Postgres, one connection string, free tier, no platform features we would not use | Supabase |
| Query layer | Drizzle ORM | Typed schema in TypeScript, no generation step, small runtime | Prisma |
| Driver | postgres.js with `prepare: false` | Drizzle's first class driver, transactions and prepared statements, safe through a pooler later | `@neondatabase/serverless` |
| Closed lists | Postgres enum types | Enforced at the database, typed in TypeScript | Text plus check constraints |
| Times and ids | `uuid` default `gen_random_uuid()`, `timestamptz` | Postgres owns both, and time zones stay honest | Text ISO strings |
| Migrations | `drizzle-kit generate` then `drizzle-kit migrate` | A reviewed SQL file per change, one command to apply | `drizzle-kit push` |
| Validation | zod | One schema for the form and the server | Hand written checks |
| Writes | Server actions returning typed state | No API surface, expected failures are values, not exceptions | Route handlers |
| Reads | Server component calls the data layer | No round trip for a read | Server action that returns rows |
| Admin route | `/admin` | One constant the actions revalidate | Any other path |
| Report route | `/report` | The form needs one fixed path accepted by the scope | A form on the root page |
| Paging | Offset paging with a total count | The page can say "page 2 of 3" | Cursor paging |
| Page size | 20 | Small enough to scan, matches the scope answer | 10 or 50 |
| Admin gate | None | The scope says no accounts, and the project is not public | One shared password |
| Connection | One direct Neon connection string | The app is one long lived Node process, and migrations need the direct host | Pooled app URL plus a direct migration URL |
| Double submit | Button disabled while pending | No unique key exists to dedupe on, and the slice is not adding one | Server idempotency key |
| Personal data | No special handling, emails never logged | Honest for a course project | Retention and erasure path |
| Report form spam | None | Nothing public, nothing worth defending | Honeypot field |

## Rationale

The engineer chose a hosted Postgres, and the choice holds up on its own terms. The record is relational, the two later slices both need the same constraints, and concurrent status changes are easier to get right with a real database than with a file. The cost is honest: every page view needs the network, and the demo depends on a free tier account. A file based database would have been cheaper to run, and it was rejected because a hosted Postgres gives the course project a database that keeps working after submission.

Neon over Supabase is about surface area. The project needs Postgres and a connection string. Supabase brings auth, storage and a dashboard that this app does not use, and its extra features would invite the very accounts the scope rules out. Drizzle over Prisma is the same reasoning at the query layer: Drizzle needs no generated client, its schema is ordinary TypeScript, and drizzle-kit writes the SQL file that can be reviewed before it touches the database.

The driver is the one place this spec departs from the installed Neon skill, which prefers `@neondatabase/serverless` on a Node server. postgres.js stays because the engineer chose it and because it keeps transactions and prepared statements on the plain Node server this app runs on. `prepare: false` costs nothing now and keeps the same connection string working through a pooler if the app is ever deployed.

The enum types, the length checks and the state check put the invariants where they cannot be bypassed. The app still validates with zod for a good message, but the database is the last line. That matters because the two slices are written at different times, and the second one should not have to trust the first.

## Feature design

**Data model sketch**:

Table `tickets`. TypeScript property names are camelCase and map to snake_case columns; `type Ticket = typeof tickets.$inferSelect` and `type NewTicket = typeof tickets.$inferInsert` are the only ticket types in the app.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `title` | `text` | required, check `char_length` between 3 and 120 |
| `description` | `text` | required, check `char_length` between 10 and 2000 |
| `reporter_name` | `text` | required, check `char_length` between 2 and 80 |
| `reporter_email` | `text` | required, stored trimmed and lowercased, format checked by zod only |
| `department` | `department_kind` enum | required, values `IT`, `Sales`, `Customer`, `Management` |
| `category` | `ticket_category` enum | required, values `Hardware`, `Software`, `Account`, `Network`, `Other` |
| `priority` | `ticket_priority` enum | required, values `Low`, `Normal`, `High`, no default |
| `status` | `ticket_status` enum | required, values `Open`, `In progress`, `Resolved`, default `Open` |
| `created_at` | `timestamptz` | required, default `now()` |
| `updated_at` | `timestamptz` | required, default `now()`, refreshed by the data layer on every update |
| `resolved_at` | `timestamptz` | nullable, set when status becomes `Resolved` |

Enum type names: `department_kind`, `ticket_category`, `ticket_priority`, `ticket_status`. No foreign keys, no unique constraints, no deletion path. Index `tickets_created_at_idx` on `created_at`, scanned backwards for the newest first list. Named checks: `tickets_title_length`, `tickets_description_length`, `tickets_reporter_name_length`, `tickets_resolved_at_matches_status`.

**State transitions**:

`Open` to `In progress`, `Open` to `Resolved`, `In progress` to `Resolved`. Nothing moves backwards. `resolved_at` is non null exactly when status is `Resolved`, enforced by the `tickets_resolved_at_matches_status` check.

**API surface**:

All of these are server only. There is no public API and no auth gate by decision.

| Surface | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `createTicket` | data layer function | `NewTicket` minus the generated columns | the stored ticket row | none | database check failure, connection failure |
| `getTicket` | data layer function | `id: string`, checked as a uuid | the ticket or `null` | none | connection failure; a bad id returns `null` |
| `listTickets` | data layer function | `page: number` (req) | `{ items, total, page, pageSize, pageCount }` | none | connection failure |
| `setTicketStatus` | data layer function | `id: string`, `next: TicketStatus`, `expected: TicketStatus` | `{ ok: true, ticket }` or `{ ok: false, code }` | none | `not_found`, `status_changed`, `invalid_move`, `database_error` |
| `createTicketAction` | server action | previous state, `FormData` | `CreateTicketState` | none | field errors, `database_error` |
| `setTicketStatusAction` | server action | `{ id, next, expected }` | `SetTicketStatusResult` | none | the four codes above |

zod runs in the actions. `setTicketStatus` checks the move with a pure `isAllowedMove(current, next)` in `lib/ticket-status.ts` before it writes, so a backward move or a move to the same status returns `invalid_move` without touching the row. A valid move runs one guarded update:

```sql
update tickets
set status = $next, resolved_at = case when $next = 'Resolved' then now() else resolved_at end, updated_at = now()
where id = $id and status = $expected
returning *
```

Zero rows changed triggers a follow up read: no row means `not_found`, a row in another state means `status_changed`. Any thrown database error is caught by the action and returned as `database_error`. Both actions call `revalidatePath('/admin')` after a successful write.

The action types are fixed here so both slices share them:

```ts
type TicketField =
  | 'title' | 'description' | 'reporterName' | 'reporterEmail'
  | 'department' | 'category' | 'priority';

type TicketFormValues = Partial<Record<TicketField, string>>;

type CreateTicketState =
  | { status: 'idle'; fieldErrors: Partial<Record<TicketField, string>>; values: TicketFormValues }
  | { status: 'invalid'; fieldErrors: Partial<Record<TicketField, string>>; values: TicketFormValues }
  | { status: 'failed'; formError: string; values: TicketFormValues }
  | { status: 'created'; createdId: string; values: TicketFormValues };

type TicketErrorCode = 'not_found' | 'status_changed' | 'invalid_move' | 'database_error';
type SetTicketStatusResult = { ok: true; ticket: Ticket } | { ok: false; code: TicketErrorCode };
```

`initialCreateTicketState` is exported beside the type. `createTicketAction` returns the new id rather than redirecting, because a redirect throws and would defeat the typed result. All user facing copy lives in `lib/messages.ts`, one string per field and one per error code.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| `createTicket` | `id` | database default `gen_random_uuid()` |
| `createTicket` | `created_at`, `updated_at` | database defaults `now()` |
| `createTicket` | `status`, `resolved_at` | database defaults `Open` and null |
| `createTicket` | every other column | validated form input from `createTicketAction` |
| `createTicketAction` | `fieldErrors` | zod `safeParse` result, field names only, never field values |
| `createTicketAction` | echoed form values | the submitted `FormData`, with the email kept as typed |
| `listTickets` | `items` | tickets ordered by `created_at` descending then `id` descending, offset `(page - 1) * 20`, limit 20 |
| `listTickets` | `total`, `pageCount` | `Number(count(*))` over the same filter, page count rounded up, minimum 1 |
| `listTickets` | `page` | `parsePageParam` over the list page's awaited `searchParams.page` |
| `setTicketStatus` | `status` | the action input, checked against the allowed forward moves |
| `setTicketStatus` | `resolved_at` | `now()` in the same update that moves the status to `Resolved`, never accepted from input |
| `setTicketStatus` | `updated_at` | `now()` on every accepted update |
| `setTicketStatusAction` | `code` | `isAllowedMove` for the move check, then the guarded update result |
| list page display | reporter email, department, category, priority, status, times | the corresponding column, formatted by the list slice; no formatting decision lives here |
| every error message | text | `lib/messages.ts`, one fixed string per field and per error code; no email value |

**Key invariants**:
- `status` is always one of the three enum values, and a ticket only moves forward.
- `resolved_at` is non null exactly when `status` is `Resolved`.
- `created_at` never changes, and `updated_at` is never earlier than `created_at`.
- Enum columns only hold their listed values, and the length checks hold at the database level.
- A guarded status update either changes exactly one row or changes none.

**Security model**:
There are no accounts, so no read or write is restricted: anyone who can reach the app can list tickets and create one. This is an accepted consequence of the scope, not an oversight. The row holds a name, an email and a department, so it is personal data stored in plain text in a hosted database. No code path logs a reporter email, and none puts one into a thrown or displayed error message. `DATABASE_URL` is the only secret, it lives in `.env.local` (already gitignored), it is never printed, and the connection uses TLS as Neon requires by default. Drizzle parameterizes every query, so the SQL above never concatenates input. The report form has no rate limit; that is acceptable while the app is not public.

**Configuration required**:
- `DATABASE_URL`: the Neon direct connection string, used by the app, by `drizzle-kit` and by the seed script. Load `.env.local` explicitly with `dotenv` in `drizzle.config.ts` and let `tsx --env-file=.env.local` load it for the scripts, because `drizzle-kit` runs outside Next.js.

`drizzle.config.ts` points `schema` at `./db/schema.ts` and `out` at `./db/migrations`.

Connection module, `db/index.ts`: one lazy client, kept on `globalThis` in development so hot reload does not open a new pool per edit. `getDb()` checks the variable first, so the app does not crash at import and the error names `DATABASE_URL`, never the connection string.

```ts
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set. Add it to .env.local.');
  if (!globalThis.__sql) {
    globalThis.__sql = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1,
      connect_timeout: 10,
    });
  }
  return drizzle(globalThis.__sql, { schema });
}
```

The `globalThis` handle is declared through a small `declare global` block. `max: 1` suits a single Node process, and `connect_timeout: 10` keeps an unreachable database from hanging a request. The app, the migrations and the seed all use the direct host. A pooled URL becomes worthwhile only if the app moves to a serverless host.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: seed 25 tickets, read one back through `getTicket` from a fresh process, then page through them, verifies **AC-2**, **AC-4**.
- Failure case: two guarded updates race to resolve the same open ticket, one wins and one returns `status_changed`, verifies **AC-6**.
- Failure case: an invalid email, a 121 character title and an unknown department are each refused with the field named, and the row count is unchanged, verifies **AC-3**.
- Failure case: `DATABASE_URL` unset, and separately an unreachable database, verifies **AC-8**.
- Auth/permission: no gate exists by decision, so the test records that every caller can read and write, and that no email appears in a log or an error message, verifies **AC-9**.

## Build plan

Tracer Bullet order: get one real ticket written to the real Neon database and read back first, then thicken the model and the rules around that working thread.

1. Add `drizzle-orm`, `postgres` and `zod` to dependencies, `drizzle-kit`, `dotenv` and `tsx` to dev dependencies, and the `db:generate`, `db:migrate` and `db:seed` scripts (`db:seed` runs `tsx --env-file=.env.local scripts/seed.ts`). Install the current stable versions with pnpm, satisfies **AC-1**, **AC-10**.
2. Write `db/schema.ts` with the four `pgEnum` types, the `tickets` table, the four named checks and the `created_at` index, satisfies **AC-1**, **AC-5**.
3. Write `drizzle.config.ts` that loads `.env.local` and writes to `./db/migrations`, run `pnpm db:generate`, review the generated SQL, and apply it with `pnpm db:migrate`, satisfies **AC-1**.
4. Write `db/index.ts` with the lazy `getDb()`, the `DATABASE_URL` check, `prepare: false`, `max: 1`, `connect_timeout: 10` and the shared `globalThis` handle, satisfies **AC-8**.
5. Write `createTicket` and `getTicket` in `db/tickets.ts`, with the uuid check that makes a bad id return `null`. Prove the thread with `tsx --env-file=.env.local scripts/smoke.ts` in a fresh process: insert one ticket, exit, read it back, satisfies **AC-2**.
6. Write `scripts/seed.ts` with 25 realistic tickets, distinct timestamps and the empty table guard, so the paging check has data, satisfies **AC-10**.
7. Add `listTickets` with `Number(count(*))` and offset paging ordered by `created_at` then `id`, plus `parsePageParam` in `lib/paging.ts` with the string, array, digits only and cap rules, satisfies **AC-4**, **AC-7**.
8. Add `isAllowedMove` in `lib/ticket-status.ts` and `setTicketStatus` in `db/tickets.ts` with the guarded update, the forward move check and the `resolved_at` rule, satisfies **AC-5**, **AC-6**.
9. Write the zod input schema in `lib/ticket-input.ts`, the copy in `lib/messages.ts`, and the two server action signatures in `app/actions/tickets.ts` with the frozen types, returning state, revalidating `/admin`, catching database errors and keeping emails out of every message, satisfies **AC-3**, **AC-9**, **AC-11**.
10. Add `app/error.tsx` as the shared error boundary with fixed copy and a retry control, satisfies **AC-8**.

## Consequences

**Positive**:
- One ticket contract, one table and one migration history for both slices.
- Constraints live in Postgres, so a later slice cannot quietly break a rule.
- Nothing to install or run locally beyond the dependencies, and the database outlives the course.
- Offset paging with a total count gives the list a page count for free.

**Negative or tradeoffs**:
- Every page view needs the network. A demo without connectivity fails, and the error boundary is the honest fallback.
- A free tier account, a connection string and a database that can pause or hit a quota are now part of the project.
- Offset paging can shift rows when a ticket is inserted while someone is on page 2. Acceptable at this volume, and named here so it is not a surprise.
- Anyone with the URL can read personal data and write tickets. The scope says no accounts, so this is recorded, not fixed.
- A double submit can create two tickets. The button is disabled while pending, but no unique key exists to dedupe on, and the slice is not adding one.
- The ticket is now ten columns, which is more report form work than the scope line promised.

**Neutral**:
- New dependencies: `drizzle-orm`, `postgres`, `drizzle-kit`, `dotenv`, `tsx` and `zod`.
- `pnpm db:migrate` becomes a setup step before the app can work, and `.env.local` must exist first.
- `db/schema.ts` is the source of truth for the table. A hand edit in the Neon console will be reverted by the next migration.
- `cacheComponents` is on, so the list slice must await the `searchParams` promise and read the database inside an async child wrapped in `<Suspense>` with a fallback, or the build reports a blocking route.
- `app/error.tsx` shows fixed copy, because Next.js hides the real error message in production.
- Migrations, the seed and the app share one direct connection string. Moving to a pooled URL later means a second variable for the migrations.

## Follow-up

- [ ] Create the Neon project and put its connection string in `.env.local` as `DATABASE_URL` before the first build task. Nothing in this spec can run without it.
- [ ] The `neon-drizzle` skill is installed at `.agents/skills/neon-drizzle/` and is not yet listed in root `AGENTS.md`. Add a bullet to its `## Agent skills` section.
- [ ] Record the declined Neon MCP server in the `Declined:` line of root `AGENTS.md` so a later run does not offer it again.
- [ ] Add `drizzle-orm`, `postgres`, `drizzle-kit`, `dotenv` and `zod` to the key dependencies line in `AGENTS.md` once they are installed.
- [ ] The installed Neon skill prefers `@neondatabase/serverless` on a Node server. This spec keeps postgres.js. Revisit the driver if the app moves to a serverless host.
- [ ] No test runner is configured. Run `/test` after the build so the critical scenarios above become automated checks.
- [ ] If the app ever gets a public URL, add a rate limit to the report form and a gate on `/admin` before sharing it.
