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
| 3 | Ticket model and storage | Foundation | done |
| 4 | Report a ticket | Slice 1 | done |
| 5 | Resolve a ticket | Slice 2 | in-progress |

## Foundations

### 1. Project scaffold and stack · existing
Next.js with the App Router, strict TypeScript and Tailwind, already runnable from the starter. code in `./`

### 2. Coding standards and lint · done
Conventions captured in root `AGENTS.md` and ESLint wired to the Next.js config, so every later slice inherits the same rules.
**Done when:** root `AGENTS.md` reflects the real stack and `pnpm lint` runs clean.
- [x] Capture conventions and tooling choices: `/audit`
- [x] Confirm lint runs clean: `pnpm lint`

### 3. Ticket model and storage · done
The one record everything depends on: a ticket with a title, a description, a status and a created time, plus somewhere that keeps it after a restart.
**Done when:** a ticket written on one request is read back on the next, and no later slice needs to change its shape.
- [x] Design it (spec): [0001](../specs/0001-ticket-model-and-storage.md)
- [x] Build it: /develop ticket model and storage
  - [x] Install Drizzle, postgres.js, zod and the database scripts, define the enums and table, apply the first migration, covers AC-1
  - [x] Build the data layer: connection, create, read, seeded paging and the guarded status update, covers AC-2, AC-4, AC-5, AC-6, AC-7, AC-10
  - [x] Add zod validation, the typed server actions and the shared error boundary, covers AC-3, AC-8, AC-9, AC-11

## Slice 1: The core loop

### 4. Report a ticket · done
The thinnest real thread through every layer: a form page saves a ticket and the admin list shows it. This is the walking skeleton, nothing is faked.
**Done when:** an empty form is refused with a visible message, a filled form saves, and the ticket appears in the list with status open.
- [x] Design it (spec): [0002](../specs/0002-report-a-ticket/index.md)
- [x] Build it: /develop report a ticket. code in `app/`, `lib/messages.ts`, `lib/format.ts`, `lib/ticket-display.ts`, `components/ui/`
  - [x] Install shadcn and the components the two pages need, covers AC-1
  - [x] Stand up the thin thread: the form writes a ticket and the list reads it back, covers AC-3, AC-6, AC-7, AC-12
  - [x] Thicken the list: full rows, badges, UTC times, table and cards, empty and out of range states, paging, covers AC-6, AC-7, AC-8, AC-10
  - [x] Thicken the form: labels, placeholders, error summary and aria wiring, pending and success states, covers AC-2, AC-3, AC-4, AC-5
  - [x] Add the shared shell, move the copy, then run the lint and build checks, covers AC-2, AC-9, AC-11, AC-12

## Slice 2: Close the loop

### 5. Resolve a ticket · in-progress
The admin marks a ticket resolved from the list, and the new status survives a reload.
**Done when:** the list shows open and resolved tickets apart, one click flips a ticket to resolved, and a reload keeps it resolved.
- [x] Design it (spec): [0003](../specs/0003-resolve-a-ticket.md)
- [x] Build it: /develop resolve a ticket. code in `app/admin/`, `lib/ticket-view.ts`, `lib/messages.ts`
  - [x] Add the two views: the `listTickets` counts, then the Unresolved and Resolved split with its own paging and empty states, covers AC-1, AC-2, AC-3, AC-10
  - [x] Add the row controls: Start work, then Resolve with the in place confirm, both sending the expected status to the existing action, covers AC-4, AC-5, AC-6, AC-7
  - [x] Thicken the feedback and the mobile card: pending labels, the live line with focus, refusal copy per failure code, covers AC-7, AC-8, AC-9
  - [x] Run the lint and build checks, then the manual scenarios in the spec, covers AC-11, AC-12

## Deferred
Out of scope for this build pass, kept here so the plan stays honest.
- **Search and filter the list**: narrow by status or words · needs a decision
- **Reopen a resolved ticket**: a way back from Resolved, which the forward only rule refuses today · needs a decision
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
