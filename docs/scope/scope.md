# Scope: IT admin ticket queue

A small internal helpdesk. A person reports a problem as a ticket, and the admin opens one page that lists every ticket and marks the resolved ones. No accounts: one page to report, one page to administer, kept deliberately thin for a university project.

**Build approach:** Tracer Bullet (each slice runs end to end through storage, logic and page, so every slice is working and demoable).
**Workflow:** Prototype (nothing runs after `/develop`; you trust its own build time check and your own eye).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Project scaffold and stack | Foundation | existing |
| 2 | Coding standards and lint | Foundation | done |
| 3 | Ticket model and storage | Foundation | in-progress |
| 4 | Report a ticket | Slice 1 | planned |
| 5 | Resolve a ticket | Slice 2 | planned |

## Foundations

### 1. Project scaffold and stack · existing
Next.js with the App Router, strict TypeScript and Tailwind, already runnable from the starter. code in `./`

### 2. Coding standards and lint · done
Conventions captured in root `AGENTS.md` and ESLint wired to the Next.js config, so every later slice inherits the same rules.
**Done when:** root `AGENTS.md` reflects the real stack and `pnpm lint` runs clean.
- [x] Capture conventions and tooling choices: `/audit`
- [x] Confirm lint runs clean: `pnpm lint`

### 3. Ticket model and storage · in-progress
The one record everything depends on: a ticket with a title, a description, a status and a created time, plus somewhere that keeps it after a restart.
**Done when:** a ticket written on one request is read back on the next, and no later slice needs to change its shape.
- [x] Design it (spec): [0001](../specs/0001-ticket-model-and-storage.md)
- [ ] Build it: /develop ticket model and storage
  - [ ] Install Drizzle, postgres.js, zod and the database scripts, define the enums and table, apply the first migration, covers AC-1
  - [ ] Build the data layer: connection, create, read, seeded paging and the guarded status update, covers AC-2, AC-4, AC-5, AC-6, AC-7, AC-10
  - [ ] Add zod validation, the typed server actions and the shared error boundary, covers AC-3, AC-8, AC-9, AC-11

## Slice 1: The core loop

### 4. Report a ticket
The thinnest real thread through every layer: a form page saves a ticket and the admin list shows it. This is the walking skeleton, nothing is faked.
**Done when:** an empty form is refused with a visible message, a filled form saves, and the ticket appears in the list with status open.
- [ ] Design it (spec): `/architect report a ticket`

## Slice 2: Close the loop

### 5. Resolve a ticket
The admin marks a ticket resolved from the list, and the new status survives a reload.
**Done when:** the list shows open and resolved tickets apart, one click flips a ticket to resolved, and a reload keeps it resolved.
- [ ] Design it (spec): `/architect resolve a ticket`

## Deferred
Out of scope for this build pass, kept here so the plan stays honest.
- **Search and filter the list**: narrow by status or words · needs a decision
- **Comments on a ticket**: a running note between reporter and admin · needs a decision
- **File attachments**: a screenshot with the report · needs a decision
- **Email notifications**: needs a mail service · needs a decision
- **Accounts and roles**: staff and admin as real users · needs a decision
- **Admin gate and report rate limit**: only needed if the app gets a public URL · needs a decision

## Legend

- **Status** `planned` → `in-progress` → `done`, plus `existing` (built before this workflow started) and `dropped` (cut from scope, kept for history).
- **The decision box.** The box whose label ends in `(spec)`. Run `/architect` for it first; it ticks that box and fills in the build steps. Every other box is yours to run.
- **Workflow tier.** `Prototype` means `/develop` alone finishes a feature. A feature can carry a tag like `· Alpha` to do more.
- **Next step** is always the first unticked box.
