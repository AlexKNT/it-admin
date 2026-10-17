# 0002. Report a ticket form and the admin list

**Date**: 2026-10-17
**Status**: Accepted

Decision history: [rationale.md](./rationale.md). Verify steps: [verify.md](./verify.md).

## Summary

The report page lives at `/` and saves a ticket through the server action that already exists. The admin list lives at `/admin`, reads the real table, and pages twenty tickets at a time. Both pages share one small header and one visual language built from shadcn/ui components (a set of copy in React components you own, built on Tailwind classes), while all validation stays on the server in the zod schema from spec 0001.

## Requirements

**User stories**:
- As a reporter, I want to describe my problem once, see clearly what went wrong if the form is refused, and know that my ticket was saved.
- As the admin, I want the newest tickets first, twenty at a time, with every fact I need to triage and reply on the row.
- As the developer, I want the two pages to share one set of controls and one copy module, so the next slice adds behaviour without restyling.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `pnpm dlx shadcn@latest init` has run and `npx shadcn@latest add button input textarea label select field alert badge table` has produced files under `@/components/ui/`. `components.json` points at `app/globals.css` and uses the existing `@/*` alias. `lib/utils.ts` exports `cn`. `app/globals.css` keeps the Tailwind import, the font tokens and the system dark preference, and the app's light and dark colours come from the generated token block. `pnpm lint` passes.
- **AC-2**: `GET /` renders the report form with exactly seven controls: title, description, reporter name, reporter email, department, category, priority. Department and category start on a `Choose one` placeholder and priority preselects `Normal`. Title carries `maxLength=120` and description `maxLength=2000`. Every control has a label tied to it by `htmlFor` and `id`. The same page renders a shared header with the links `Report a ticket` (`/`) and `Admin` (`/admin`). The root layout sets a page title and `robots: { index: false, follow: false }`.
- **AC-3**: Submitting `/` calls `createTicketAction`. On success the page shows a success alert naming the full new ticket id and linking to `/admin`, and every field returns to its default state (priority `Normal`, department and category empty, text fields empty).
- **AC-4**: On invalid input the page shows one alert at the top of the form with the number of fields that need attention, a message under each bad field, and the submitted values still in their fields. The alert receives focus after the update. Each bad control carries `aria-invalid="true"` and `aria-describedby` pointing at its message.
- **AC-5**: While the action is pending the submit button is disabled and shows a pending label, so a second click after the pending state renders sends nothing.
- **AC-6**: `GET /admin` lists at most twenty tickets, newest first, ordered by `created_at` descending then `id` descending. Each row shows the title, a one line description excerpt, the reporter name, the reporter email, the department, the category, the priority as a badge, the status as a badge, the created time in a fixed UTC format, and the first eight characters of the ticket id.
- **AC-7**: `/admin?page=2` shows the next twenty with no overlap. A paging row shows `Previous`, `Next` and `Page X of Y, N tickets`. On the first page `Previous` is a disabled control, and on the last page `Next` is disabled. A page past the last renders the empty state with the real total and page count and a link to page 1. A missing, empty, non numeric, zero or negative page renders page 1.
- **AC-8**: With no tickets, `/admin` shows an empty state with a link to `/`. With tickets but an empty page, it shows the out of range state from AC-7.
- **AC-9**: With `DATABASE_URL` unset or the database unreachable, `/` still renders the form, a submit returns the fixed `database_error` message in a failed alert with the submitted values kept, and `/admin` renders the existing error boundary from `app/error.tsx`.
- **AC-10**: At 375 pixels wide the list renders one card per ticket with every value readable and no horizontal page scroll; at 1024 pixels and wider it renders a table with the same values. The created time string is identical on the server and in the browser, with no hydration warning in the console.
- **AC-11**: No reporter email appears in a server log, a thrown error or an error boundary message. The form echoes it only as a field value, and the admin list displays it only as a cell.
- **AC-12**: `pnpm build` succeeds with `cacheComponents` on. `/` renders without a blocking route error. `/admin` awaits `searchParams` and reads the database inside an async child wrapped in `<Suspense>` with a fallback, so the shell still renders while the list loads.

## Decision

**Chosen option**: Option 1: shadcn/ui components with server side validation.

The two pages are built from shadcn components, installed with the current CLI, with the form submitting through `createTicketAction` and validating only in `ticketInputSchema`. The base the CLI writes into `components.json` (Radix or Base UI) is followed for every component; Radix is preferred when the CLI offers both, because it is the most widely documented base. The generated APIs are used as written, and bases are never mixed.

`/` is a server page (`app/page.tsx`) that renders one client form component (`app/report-form.tsx`). The page passes the department, category and priority values down as plain props taken from the enums, so Drizzle never enters the browser bundle. The form uses `useActionState(createTicketAction, initialCreateTicketState)` and uncontrolled inputs. On success the page remounts the form with a key taken from `createdId`, because React ignores a changed `defaultValue` on an input that is already mounted, and that remount is what clears the fields.

`/admin` is a server page (`app/admin/page.tsx`). It passes the `searchParams` promise into an async child (`app/admin/ticket-list.tsx`) inside `<Suspense>`, and that child awaits the promise, calls `parsePageParam`, and then calls `listTickets`. The table is rendered above `md` and one card per ticket below it, from the same row data.

The shared header lives in `app/components/site-header.tsx` and renders on both pages.

One display module (`lib/ticket-display.ts`) owns the badge style for each status and priority value and the excerpt helper, so slice 2 (resolve a ticket) reuses the status map instead of copying it. One format helper (`lib/format.ts`) owns the UTC date string. All new plain copy (header links, page titles, headings, placeholders, paging labels, empty state, pending label, success text) lives in `lib/messages.ts`, which already holds the field and error copy.

## Feature design

**Data model sketch**:
No change. This slice reads and writes the `tickets` table frozen in spec 0001: `id` uuid primary key, `title`, `description`, `reporter_name`, `reporter_email`, four enum columns (`department`, `category`, `priority`, `status`), `created_at`, `updated_at` and a nullable `resolved_at`. No relationships, no new index, no migration.

**State transitions**:
The form only creates. A new row starts at `Open` by database default, and the browser never sends a status. The moves to `In progress` and `Resolved` belong to slice 2.

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/` | server page plus client form | none | the seven field form, the shared header | none | renders the form even when the database is down |
| `/admin` | server page plus async list | `searchParams.page` | paged rows, paging row, empty state | none | `app/error.tsx` on a database failure |
| `createTicketAction` | existing server action | previous state, `FormData` | `CreateTicketState` | none | `invalid` with field errors, `failed` with fixed copy |
| `listTickets` | existing data function | `page: number` | `{ items, total, page, pageSize, pageCount }` | none | connection failure, caught by the error boundary |
| `parsePageParam` | existing helper | `string | string[] | undefined` | a page number from 1 to 1,000,000 | none | never throws |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| report page | the department, category and priority choices | `departmentKindEnum.enumValues`, `ticketCategoryEnum.enumValues`, `ticketPriorityEnum.enumValues`, passed from the server page as props |
| report page | the `Normal` priority default | the literal `Normal`, which is a valid `ticketPriorityEnum` value |
| report page | field labels, placeholders, heading, pending label | `lib/messages.ts` |
| report form | the submitted values, per field errors, failure copy, new id | the `CreateTicketState` returned by `createTicketAction` |
| report form | the count in the summary alert | the number of keys in `state.fieldErrors` |
| report form | the cleared fields after a save | the form remount keyed on `state.createdId`, with empty defaults |
| shared header | both link targets and labels | `/`, `/admin`, and `lib/messages.ts` |
| list page | rows | `listTickets(page).items` |
| list page | page | `parsePageParam` over the awaited `searchParams.page` |
| list page | total, page count, page size | `listTickets(page)` |
| list page | description excerpt | `tickets.description`, cut at a word boundary near 120 characters by `lib/ticket-display.ts` |
| list page | priority and status badge style | the `tickets.priority` and `tickets.status` columns through the map in `lib/ticket-display.ts` |
| list page | created time | `tickets.created_at` through `lib/format.ts` with `Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })` plus ` UTC` |
| list page | short ticket id | the first eight characters of `tickets.id` |
| list page | paging control state | `page` and `pageCount` from `listTickets(page)` |
| list page | empty and out of range copy | `lib/messages.ts`, chosen by `total === 0` and `items.length === 0` |

**Key invariants**:
- A ticket is written only through `createTicketAction` and `createTicket`; no browser code touches SQL.
- `status` is never accepted from the browser, so every new ticket is `Open`.
- Every list read has a page and a limit; no query returns an unbounded set.
- A rendered list never shows more than twenty rows.
- Every displayed time goes through the one UTC formatter, so server and browser agree.
- No rendered message contains a reporter email.
- The only validator for the form is `ticketInputSchema` on the server.
- The submit control cannot be clicked again once the pending state has rendered.
- The status and priority display maps cover every enum value, so a new value without a style fails the type check.

**Security model**:
There are no accounts, by the scope decision. Anyone who reaches the app can create a ticket and open `/admin` to read every row. The rows hold a name and an email as personal data in plain text, as recorded in spec 0001. This feature adds no new read or write: it renders the same rows and writes the same columns. The report form has no rate limit and no captcha, which stays deferred in the scope and is only acceptable while the app is not public. React escapes every rendered string and no component uses raw HTML injection. The server action relies on the origin check Next.js applies to actions, so no extra token is added. The root layout marks the app `noindex` so the pages are not indexed by accident. No new secret or environment variable is introduced, and the reporter email is never logged.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: fill the form at `/`, submit, read the new id in the success alert, then open `/admin` and find the ticket first with an `Open` badge, verifies **AC-3**, **AC-6**.
- Failure case: submit the empty form and confirm the summary count, the seven field messages, the kept values and the focus on the summary, verifies **AC-4**.
- Failure case: with `DATABASE_URL` unset, `/` still renders, a submit shows the fixed database message, and `/admin` shows the error boundary, verifies **AC-9**.
- Edge case: with 25 seeded tickets, page 2 has no overlap, page 9 is the out of range state with the real count, and `?page=abc` lands on page 1, verifies **AC-7**.
- Edge case: with an empty table, `/admin` shows the empty state and its link to `/`, verifies **AC-8**.
- Auth/permission: no gate exists by decision; the test records that a visitor can report and read, that no email appears in a log or an error, and that one pending click sends one ticket, verifies **AC-5**, **AC-11**.

## Build plan

Tracer Bullet order: stand up one real thread from the form to the table to the list, then thicken each end. The table already exists, so the thin thread is short: a form that writes and a list that reads, both real, before any polish.

1. Install shadcn with `pnpm dlx shadcn@latest init`, add `button input textarea label select field alert badge table`, and verify `components.json`, `lib/utils.ts` and the token block in `app/globals.css` against the existing system dark preference. Confirm `pnpm lint` passes, satisfies **AC-1**. Done.
2. Build the thinnest `/admin`: accept the `searchParams` promise at the page, pass it to an async child inside `<Suspense>`, call `parsePageParam` then `listTickets`, and render a plain table of title, status and created time with `Previous` and `Next` links, satisfies **AC-7**, **AC-12**. Done.
3. Build the thinnest `/`: one client form component with the seven inputs, `useActionState` and uncontrolled fields, submitting to `createTicketAction`, rendering a plain success block or a plain error block, satisfies **AC-3**, **AC-4**, **AC-5**. Done.
4. Prove the thread in the browser: submit one ticket at `/` and see it first at `/admin`. This is the working skeleton, satisfies **AC-3**, **AC-6**. Done.
5. Thicken the list: all eight facts per row, the excerpt helper, the status and priority badges, the UTC formatter, the eight character id, a table above `md` and stacked cards below it, the empty state, the out of range state, disabled `Previous` and `Next` at the ends, and the `Page X of Y, N tickets` label, satisfies **AC-6**, **AC-7**, **AC-8**, **AC-10**. Done.
6. Thicken the form: shadcn `Field` wrappers, labels and placeholders, the `Normal` default, the two `maxLength` values, the summary alert with focus, per field messages with `aria-invalid` and `aria-describedby`, the disabled pending button, the success alert with the id and the `/admin` link, and the remount key that clears the fields, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**. Done.
7. Add the shared shell: the header component on both pages, the root layout title and `noindex`, and the new copy moved into `lib/messages.ts`, satisfies **AC-2**, **AC-11**. Done.
8. Verify: `pnpm lint` and `pnpm build`, then the manual checks in the critical test scenarios, including a narrow width, a missing `DATABASE_URL`, and a clean console with no hydration warning, satisfies **AC-9**, **AC-11**, **AC-12**. Done.

**Build notes**:
- The empty form shows six field messages, not seven, because priority preselects `Normal` and is therefore already valid. AC-2 and AC-4 together make six the correct count.
- The CLI wrote `--font-sans: var(--font-sans)` into the token block, which points at itself. It is restored to `var(--font-geist-sans)`.
- The CLI swaps dark mode to a `.dark` class. The generated dark token block is applied under `@media (prefers-color-scheme: dark)` instead, because this app has no toggle.

## Consequences

**Positive**:
- One look and one set of controls for both pages, which the next slice reuses.
- Accessibility details (labels, focus, alert roles, invalid state) come from maintained components instead of being reinvented.
- Validation stays in one place, so the form and the action cannot disagree.
- The admin can triage and reply from one row at any width.

**Negative or tradeoffs**:
- New dependencies and copied component files the repo now owns and must keep current.
- The form becomes a client component with a small JavaScript bundle, because the select control is interactive.
- The report page is public and the admin page is ungated; this slice makes that visible rather than fixing it.
- A double submit is still possible in a narrow race, as recorded in spec 0001; only the disabled button guards it.
- Every admin page view needs the network and a database round trip.

**Neutral**:
- `components.json`, `lib/utils.ts` and `@/components/ui/` become fixed paths that later slices follow.
- `app/globals.css` gains a shadcn token block; the existing font tokens and the system dark preference stay.
- There is no theme toggle; dark mode follows the operating system.

## Follow-up

- [ ] Record the declined Agent Skill and MCP search for this stack in the `Declined:` line of root `AGENTS.md`, so a later run does not offer it again.
- [ ] Add shadcn, its dependencies, `components.json` and `lib/utils.ts` to the key dependencies line in `AGENTS.md` once they are installed.
- [ ] The installed `neon-drizzle` skill is still missing from the `## Agent skills` section of root `AGENTS.md`, carried over from spec 0001.
- [ ] No test runner is configured. Run `/test` after the build so AC-1 to AC-12 become automated checks.
- [ ] Slice 2 reuses `lib/ticket-display.ts` for the status badge and the paging row, so keep those pieces free of slice 1 specifics.
- [ ] If the app ever gets a public URL, add a gate on `/admin` and a rate limit on the report form before sharing it.
