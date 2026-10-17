# 0003. Resolve a ticket from the admin queue

**Date**: 2026-10-17
**Status**: In Progress

## Summary

The admin works the queue from one page. A ticket that is Open gets a Start work control, a ticket that is In progress gets a Resolve control that asks once before it acts, and resolved tickets move to their own view with the time they were closed. Nothing new is stored: the ticket table already holds the status, the resolved time and the rule that only forward moves are allowed, and the status action is already written. This slice adds the two views and the per row controls, and reuses that action unchanged.

## Context

The product is a small internal helpdesk, built by one developer inside a course deadline. A reporter files a ticket from the report page, and one admin works through the queue on `/admin`, newest first, twenty at a time. There are no accounts on purpose, so there is no admin identity to attribute a move to and no gate in front of the page.

Slice 1 shipped the report form and the admin list. The storage layer from spec 0001 already carries everything this slice needs: the `status` column with its three values, the `updated_at` column, a nullable `resolved_at` whose presence is tied to the Resolved status by a database check, a data function that only accepts forward moves and guards each write against the status the caller expected, and a server action that validates the requested values, revalidates `/admin` and returns typed results. Ticket rows also already render a status badge with one style per value.

The list today shows every ticket in one stream, resolved ones included. The admin cannot change anything from it, so the queue only grows. The slice has to give the admin a control that closes a ticket, keep resolved work out of the way, and make sure the change survives a reload. The demo has to stay reliable with one admin on one screen, a slow network and a seeded database.

The consequence of not deciding this is that the build invents the split, the control placement, the confirmation behaviour and the failure copy on the fly, and the next slice inherits whatever it happened to pick.

> ⚠️ Premise note: the scope's done line reads "one click flips a ticket to resolved". The design you chose puts two forward steps on the row, so a freshly reported ticket needs Start work and then Confirm resolve, two clicks and a confirmation, not one. That is a deliberate trade: the intermediate status becomes visible and the state machine's full forward path is exercised, at the cost of the scope sentence no longer describing the interaction literally. The Follow-up section records the wording change. A second honest note: Resolved is terminal, and no reopen exists, so the confirm step carries real weight, it is not decoration. A misclick without it can only be undone in SQL.

## Requirements

**User stories**:
- As the admin, I want to move a waiting ticket forward from the list without leaving it, so the queue reflects reality while I work.
- As the admin, I want resolved tickets kept out of my working view and set apart with the time they closed, so the open work stays visible.
- As the developer, I want the existing status action, move rules and error copy reused as they are, so this slice adds no second way to write a status.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `listTickets(page, view)` accepts a view of `all`, `unresolved` or `resolved`, with `all` as the default. `unresolved` reads rows whose status is not `Resolved`; `resolved` reads rows whose status is `Resolved`. Both keep the existing order (created time descending, then id descending) and the twenty row page. The result gains `counts: { unresolved: number; resolved: number }`, derived from one grouped count by status (`select status, count(*) from tickets group by status`) that runs in the same `Promise.all` as the items query. The view's `total` is its own count, and `all` sums both. `listTickets(1)` still returns every ticket with the same total and page count spec 0001 fixed, and a page past the end still returns an empty items list with the real total and page count for that view.
- **AC-2**: `GET /admin` renders the unresolved view, and its own address is bare `/admin`. `?status=resolved` renders the resolved view. The parser reads the first value when the parameter repeats, and only the exact string `resolved` selects the resolved view: a missing, empty, repeated, unknown or `all` value renders the unresolved view. `?status=resolved&page=2` pages the resolved view alone, with no unresolved row in it, and a reload keeps the same view.
- **AC-3**: `/admin` renders two navigation links, `Unresolved` and `Resolved`, each followed by its count from `listTickets`. The active view carries `aria-current="page"` and a visibly different style. Each link targets page 1 of its own view, so switching views returns to page 1. The links render inside the async list component, above the empty and out of range branches, so they stay visible in those states; the Suspense fallback shows no links.
- **AC-4**: In the unresolved view, every `Open` row carries a `Start work` control and every `In progress` row carries a `Resolve` control. A `Resolved` row carries no control in either view. The controls exist both in the desktop table and in the mobile card, and each accessible name includes the ticket title, built by a message function per control (for example `Start work on "Password reset"`), never by ad hoc concatenation.
- **AC-5**: Clicking `Resolve` sends no request. The control is replaced in place by `Confirm resolve` and `Cancel`, focus moves to `Confirm resolve`, and `Escape`, `Cancel` or the timeout puts focus back on `Resolve`. The confirm state clears six seconds after it opened, the timer is not restarted by a re-render, and only one row can hold it at a time, so using another row's control closes it. Every label (`Start work`, `Resolve`, `Confirm resolve`, `Cancel`, `Starting` and `Resolving`) comes from `lib/messages.ts`. `Start work` asks for nothing and sends immediately.
- **AC-6**: `Confirm resolve` calls the existing `setTicketStatusAction` with `next: 'Resolved'` and `expected: 'In progress'`. `Start work` calls it with `next: 'In progress'` and `expected: 'Open'`. The row runs the action inside `useTransition`, awaits the result and clears the pending state in a `finally`, so a throw cannot leave it stuck. While a row's move is pending, that row's controls are disabled and show a pending label, and every other row stays usable.
- **AC-7**: On success the list renders what the server now holds. `Start work` keeps the row in the unresolved view, now badged `In progress` and offering `Resolve`. `Resolve` removes the row from the unresolved view, and the same ticket appears in the resolved view with its resolved time. A polite live line above the list names the short ticket id, the new status and, for a resolve, the view the ticket moved to. That line takes focus the moment the action returns `ok` for a resolve, before the refreshed list removes the row, so focus never drops to the page body.
- **AC-8**: Every refusal puts its `ticketErrorMessages` copy in the live line above the list, because `status_changed` and `not_found` refresh the row away and copy under it could never be read. `database_error` also renders its copy under that row's controls, since that is the one case where the row certainly stays. `status_changed`, `invalid_move` and `not_found` call `router.refresh()` so the list shows the true state, and `not_found` therefore loses its row. `database_error` does not refresh. A rejected promise or a throw outside the action is caught in the row, shows the `database_error` copy and clears the pending state in `finally`, so no control is ever left disabled. Each row's component is keyed by `ticket.id`, so a local message survives a refresh that keeps the row.
- **AC-9**: The resolved view shows both the created time and a `Resolved` time, the latter read from `resolved_at` through `formatUtcDateTime`, with a fixed `No resolved time` fallback if the column is ever null, because strict TypeScript types it as nullable even though the check constraint forbids null. The time appears in a `Resolved` column in the table and a `Resolved at` field in the card. The unresolved view keeps the created time only. Every time string is identical on the server and in the browser, so the console shows no hydration warning.
- **AC-10**: The empty states are chosen in this order: when the chosen view's `total` is 0, that view's empty state renders (`Unresolved` says nothing is waiting and links to the resolved view, `Resolved` says nothing has been resolved yet); otherwise, when the page holds no rows, the out of range state renders. That covers resolving the last row of page 2: the admin stays on the page and sees the out of range state with its link to page 1, and no redirect is invented. The paging row reads `Page X of Y, N tickets` from the chosen view's total, `Previous` and `Next` carry the `status` parameter, and a missing, non numeric, zero or negative page still lands on page 1.
- **AC-11**: No status can move backward. A resolved ticket offers no control anywhere, and a request that asks for a backward move or for the status the ticket already holds is refused with `invalid_move`. `pnpm lint` and `pnpm build` pass with `cacheComponents` on, and `/admin` still streams its shell while the list loads inside `<Suspense>`.
- **AC-12**: No reporter email appears in any message, log or thrown error this slice produces. The existing `app/error.tsx` still catches a database failure that happens while the list loads.

## Options considered

### Option 1: Two forward steps on the row, two paged views, server confirmed

Row controls send the move to the existing action, the action revalidates the route, and the page renders whatever the database now holds. The list splits into Unresolved and Resolved with counts and independent paging. Resolve asks once, in place.

**Pros**:
- Every move goes through the one action and the one guard, so there is no second write path and no client copy of the state machine.
- The badge, the row's tab and the paging total all come from the server, so a stale tab cannot show a state that is no longer true.
- The intermediate status becomes visible and the whole forward map gets exercised.

**Cons**:
- Resolving a fresh ticket takes two clicks plus a confirmation, which is slower than the scope's one click line.
- Two views and a query parameter add routing surface, and the counts need a second grouped query beside the items page.

### Option 2: One click resolve, one list with a resolved section

A single Resolve control on every unresolved row, and the same page shows open rows first with resolved rows under a divider.

**Pros**:
- The smallest change: no view parameter, no second query, no confirm step.
- The scope sentence is satisfied literally, one click closes a ticket.

**Cons**:
- Resolved rows still consume page slots, so on a busy queue the working rows get pushed off page 1.
- The split is only visual, so the admin still scrolls past closed work.

### Option 3: One click resolve with undo, filters, optimistic rows

The row flips at once, an Undo strip appears for a few seconds, and the browser holds the optimistic state until the server answers.

**Pros**:
- Fastest feel, and a misclick is recoverable within the undo window.
- Filters can be added later without changing the list component.

**Cons**:
- Undo needs a reverse move, which the forward only rule refuses today, so either the rule bends or a second write path appears.
- Client held state duplicates the state machine and can show a status the server rejected.

### Option 4: A ticket detail page with a status control

Each row links to `/admin/tickets/<id>` and the move happens on that page with a status picker.

**Pros**:
- Room for comments, attachments and history later.
- One place to read a long description in full.

**Cons**:
- Much more surface than this slice needs, and it leaves the queue for every move.
- A status picker invites backward moves the data layer must then refuse, which is a worse experience than a single correct control.

## Decision

**Chosen option**: Option 1: Two forward steps on the row, two paged views, server confirmed.

The unresolved view offers `Start work` on an `Open` row and `Resolve` on an `In progress` row, so each row shows exactly one correct next move. Resolve asks once, in place. Nothing about the write path changes: `setTicketStatusAction` and `setTicketStatus` are reused as they are, `expected` is the status the row was rendered with, and the route revalidation from the action is what redraws the row.

One detail the build needs: the action revalidates `/admin` only when the move succeeds, and a successful action inside a transition redraws the list on its own. A refusal returns before any revalidation, so the row component calls `router.refresh()` on refusal only, which is what corrects a row whose status changed in another tab. Each row's component is keyed by `ticket.id`.

The list intro copy changes with the views. `adminMessages.intro` currently says "Newest first, twenty tickets per page", which no longer describes a filtered list, so it is rewritten and the new labels, empty states, live line copy and no time fallback all join the rest of the strings in `lib/messages.ts`.

**Implementation skills**: none relevant to this slice. It adds no schema change and no new integration, so the workflow skills in `AGENTS.md` cover it.

## Rationale

The write path is the strongest reason. Spec 0001 already built a guarded update that takes the expected status, refuses backward moves, stamps `resolved_at` and refreshes `updated_at`, plus an action that validates both status values against the enum and returns typed failure codes. Any option that flips the row in the browser or adds an undo would either duplicate that logic or weaken the forward only rule the database check depends on. Reusing it means this slice cannot introduce a state the table would reject.

The two views answer the scope's "apart" requirement with paging that stays honest. One stream with a divider was tempting for its small diff, but it keeps closed work in the working view and makes page one mostly history on a real queue. The counts cost one aggregate in a query the page already runs.

The confirm step is a consequence of Resolved being terminal. There is no reopen in this slice, so a misclick is only fixable in SQL. Asking once, in place, pays for itself the first time an admin clicks the wrong row, and it avoids adding a dialog component to the project for one question.

The trade you accepted: the scope's "one click" line no longer describes the interaction, because an Open ticket goes Start work then Resolve. The intermediate status is worth that, and the Follow-up section says what to change in the scope.

## Feature design

**Data model sketch**:
No change, no migration. The slice reads and writes the single `tickets` table frozen in spec 0001.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | used for the action input and the short display id |
| `title` | text, required | shown in the accessible name of each control |
| `status` | `ticket_status` enum, required, default `Open` | decides which control a row offers |
| `resolved_at` | timestamptz, nullable | set on the move to Resolved, shown in the resolved view |
| `created_at` | timestamptz, required | order and the created time in both views |
| `updated_at` | timestamptz, required | refreshed by every accepted move, not displayed in this slice |

The existing check `tickets_resolved_at_matches_status` keeps `resolved_at` set if and only if the status is `Resolved`, so a resolved row always has one at read time. Strict TypeScript still types the column as nullable, so the display keeps a fallback rather than an assertion.

**State transitions**:
`Open` to `In progress` (Start work) and `In progress` to `Resolved` (Resolve, after the confirm). The data layer also allows `Open` to `Resolved`, but this slice never offers it. No transition leaves `Resolved`, and a move to the current status is refused.

| From | To | Offered in this slice | Effect |
|---|---|---|---|
| `Open` | `In progress` | yes, `Start work` | `updated_at` refreshed, row stays in the unresolved view |
| `In progress` | `Resolved` | yes, `Resolve` then `Confirm resolve` | `resolved_at` and `updated_at` set, row leaves the unresolved view |
| `Open` | `Resolved` | no control | still allowed by the data layer, unused here |
| any | same or backward | no control | refused with `invalid_move` |

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/admin` | server page, async list in `<Suspense>` | `searchParams.status`, `searchParams.page` | two view links with counts, rows for the chosen view, paging row, empty state | none | the existing `app/error.tsx` on a database failure |
| `setTicketStatusAction` | existing server action, unchanged | `id: string`, `next: 'In progress' \| 'Resolved'`, `expected: 'Open' \| 'In progress'` | `{ ok: true, ticket }` or `{ ok: false, code }` | none | `status_changed`, `not_found`, `invalid_move`, `database_error` |
| `listTickets` | existing data function, extended | `page: number`, `view?: 'all' \| 'unresolved' \| 'resolved'` | `items`, `total`, `page`, `pageSize`, `pageCount`, `counts` | server only | throws, caught by the error boundary |
| `parseTicketViewParam` | new helper | `string \| string[] \| undefined` | `'unresolved'` or `'resolved'` | server render | never throws |
| `adminPath` | new helper | `view`, `page` | `/admin`, `/admin?page=2`, `/admin?status=resolved&page=2` | none | none |
| `TicketActions` | new client component, one per row | `id`, `title`, `status` | the row's controls, confirm state, pending state, refusal copy | none | renders `ticketErrorMessages` |
| `QueueFeedbackProvider` | new client component wrapping the list | server rendered children | the polite live line above the list, shared confirm id | none | none |

**Value sourcing** (every value each action produces, computes or displays names where it comes from):

| Action | Value produced or displayed | Source |
|---|---|---|
| `/admin` | the chosen view | `parseTicketViewParam` over the awaited `searchParams.status` |
| `/admin` | the page | `parsePageParam` over the awaited `searchParams.page`, unchanged from spec 0002 |
| `/admin` | the rows | `listTickets(page, view).items` |
| `/admin` | the two counts on the view links | `listTickets(page, view).counts.unresolved` and `.counts.resolved` |
| `/admin` | the two link labels | `lib/messages.ts` |
| `/admin` | the active link style and `aria-current` | the parsed view |
| `/admin` | the paging label and `Previous` / `Next` targets | `page`, `pageCount` and `total` from `listTickets` for the chosen view, through `adminPath` |
| `/admin` | the view's empty state copy | `lib/messages.ts`, chosen by the parsed view when `total === 0` |
| `/admin` | the out of range copy | `lib/messages.ts` with the chosen view's `total` and `pageCount` |
| row control | which control appears | `tickets.status` on the rendered row (`Open` gives `Start work`, `In progress` gives `Resolve`, `Resolved` gives none) |
| row control | the accessible name | `tickets.title` plus the control label from `lib/messages.ts` |
| row control | the `expected` value sent | the same rendered `tickets.status` |
| row control | the `next` value sent | the control used: the literal `In progress` or `Resolved`, both members of `ticketStatusEnum` |
| row control | the pending label | `lib/messages.ts` |
| row control | the refusal copy | `ticketErrorMessages[code]` from `lib/messages.ts`, shown in the live line, and under the row for `database_error` |
| `/admin` | the intro line above the views | `adminMessages.intro` in `lib/messages.ts`, rewritten to describe the two views |
| resolved row | the null fallback for a missing resolution time | `lib/messages.ts` |
| live line | the short ticket id | `shortTicketId` over `tickets.id` from the action's returned ticket |
| live line | the new status and its wording | the action's returned `ticket.status`, turned into copy by `lib/messages.ts` |
| resolved row | the resolved time | `tickets.resolved_at` through `formatUtcDateTime`, which adds the ` UTC` suffix |
| both views | the created time | `tickets.created_at` through `formatUtcDateTime` |

**Key invariants**:
- Only `setTicketStatusAction` changes a status. No browser code holds the move rules or writes a status directly.
- The requested status is one of two enum values and is checked against `ticketStatusEnum` by the action, never taken from free text.
- Every move is conditional on the status the row was rendered with, so a tab left open cannot overwrite a newer state.
- A row is only offered a move the forward map allows, and a resolved row is offered none.
- No view returns more than twenty rows, and no query is unbounded.
- The rows, the page total and the two counts come from one `listTickets` call, so a tab count and its page label cannot disagree.
- Every displayed time goes through `formatUtcDateTime`, so server and browser agree.
- No message this slice renders contains a reporter email.
- Switching views always resets to page 1; paging never leaks a page number across views.

**Security model**:
There are no accounts by the scope decision, so anyone who reaches `/admin` can move any ticket. That is recorded as an accepted limitation of this build pass, and the admin gate stays deferred. This slice adds no read of personal data beyond what spec 0002 already renders, and writes only `status`, `resolved_at` and `updated_at`. The action validates both status values against the enum, so a crafted request cannot write an arbitrary string, and the guarded update makes a stale request fail rather than overwrite. Next.js applies its origin check to server actions, so no extra token is added. No reporter email enters a message, a log or a thrown error. No new secret or environment variable is introduced, and nothing new is exposed to the browser beyond the ticket id, title and status a row already shows.

**Configuration required**:
None. The slice adds no environment variable, secret or third party credential.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: seed 25 tickets, open `/admin` and read `Unresolved 21` and `Resolved 4`, press `Start work` on an Open row and see it become `In progress` with a `Resolve` control, press `Resolve`, `Confirm resolve`, and watch the row leave the unresolved view and appear in the resolved view with its resolved time, then reload and confirm it stayed resolved, verifies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-9**.
- Failure case: open the same `In progress` ticket in two tabs, resolve it in the first, then press `Confirm resolve` in the second and read the `status_changed` copy in the live line, with the list correcting itself to the resolved state and no control left disabled, verifies **AC-8**.
- Failure case: with `DATABASE_URL` unset, `/admin` still reaches the existing error boundary, and a move from a page already rendered shows the `database_error` copy on the live line and under the row without leaving a control pending, verifies **AC-8**, **AC-12**.
- Edge case: resolve the last unresolved ticket and read the unresolved empty state with its link to the resolved view; empty page 2 of the unresolved view by resolving its last row and read the out of range state with its link to page 1; open `?status=resolved&page=9` and read the out of range state naming 4 tickets across 1 page; open `?status=bogus` and land on the unresolved view, verifies **AC-2**, **AC-10**.
- Edge case: open a ticket whose status moved to Resolved elsewhere and press `Resolve` from a stale page, then read the live line and confirm the row is gone after the refresh, verifies **AC-8**.
- Auth/permission: no gate exists by decision, so a visitor can move a ticket, while a request asking for a backward move or the same status is refused with `invalid_move`, and no email appears in a log, a message or an error, verifies **AC-8**, **AC-11**, **AC-12**.

## Build plan

Tracer Bullet order, per the project approach: get one real move working through the row, the action, the database and the refreshed page, then widen to the second move and thicken the feedback. The table needs no migration, so the first task is the read path the views depend on, not a schema change.

1. Extend `listTickets` with the optional view and the two counts in one query, keeping `all` as the default so `listTickets(1)` behaves exactly as spec 0001 fixed, satisfies **AC-1**.
2. Wire the view into the route: the `parseTicketViewParam` and `adminPath` helpers, the two links with counts and `aria-current` rendered above both empty branches, the intro copy, then paging, empty and out of range states read from the chosen view in the order AC-10 fixes, satisfies **AC-2**, **AC-3**, **AC-10**.
3. Stand up the thinnest control: a `Start work` button on an `Open` row in the desktop table, sending `{ next: 'In progress', expected: 'Open' }` to the existing action, with no confirm and no polish, satisfies **AC-4**, **AC-6**, **AC-7**.
4. Prove the thread in the browser: press `Start work` on a seeded Open ticket, see the badge change to `In progress` and the control become `Resolve`, then reload and confirm the change survived, satisfies **AC-6**, **AC-7**.
5. Add the `Resolve` control with the in place confirm: `Confirm resolve` and `Cancel`, focus moved to the confirm, `Escape` and the six second timer cancelling it, and only one row confirming at a time, satisfies **AC-4**, **AC-5**.
6. Prove the resolve thread: `Resolve` a seeded `In progress` ticket, confirm, and watch the row leave the unresolved view, appear in the resolved view with its resolved time, and stay after a reload, satisfies **AC-6**, **AC-7**, **AC-9**.
7. Thicken the feedback: the pending label per row cleared in `finally`, the polite live line above the list with focus on a successful resolve, refusal copy on the live line with the under row copy for `database_error`, the catch for a throw or a dropped request, and the refresh rules per failure code, satisfies **AC-7**, **AC-8**.
8. Thicken the mobile card with the same controls and the `Resolved at` field, and confirm the narrow layout has no horizontal scroll, satisfies **AC-4**, **AC-9**.
9. Verify: `pnpm lint` and `pnpm build`, then the manual checks in the critical test scenarios, including two tabs on one ticket, a missing `DATABASE_URL`, the seeded counts and a clean console with no hydration warning, satisfies **AC-11**, **AC-12**.

**Build notes**:
- The active view is two links styled as a segmented control, not the shadcn `Tabs` component. Each view is a server render with its own page, so a link is the honest control and it keeps the view shareable and reloadable.
- The live line and the shared confirm id need one client boundary around the list. A small provider wrapping the server rendered children passes the server markup through, so the table stays a server component.
- Spec 0001 allows `Open` to `Resolved`, but no control uses it here. That stays true unless a later slice offers a one step close.
- The seeded database gives the demo a realistic split out of the box: 17 Open, 4 In progress and 4 Resolved rows, so the two counts read 21 and 4.
- The counts need two queries, not three: the items page plus one grouped count by status. A separate count per view would re-read the table twice and can disagree with the rows on a fast write.
- A refusal is the only path that calls `router.refresh()`. A successful action already revalidates `/admin`, and refreshing on top of it doubles the read for no visible gain.

## Consequences

**Positive**:
- Every move goes through the one guarded action, so the client cannot invent a state the table forbids.
- The working view only holds work that is still open, and its counts tell the admin how much is left.
- The ticket's closure time is visible, which makes the resolved view worth opening.
- A misclick on the terminal move costs one confirmation, not a manual SQL fix.

**Negative or tradeoffs**:
- A fresh ticket needs two clicks and a confirmation to close, so the scope's "one click" line no longer describes it.
- The view parameter adds a second way to reach the same page, and every paging link must remember to carry it.
- The counts add an aggregate to a query that already runs on every list load. That is fine at tens of rows, and would be the first thing to cache at a larger size.
- The live line and the single confirm id need a client boundary above server rendered rows, which is one more component than a purely server list.

**Neutral**:
- `listTickets` gains an optional parameter and a `counts` field. The change is additive, so spec 0001's contract still holds.
- `lib/messages.ts` grows the view labels, the control labels, the pending labels, the live line copy and the two empty states, keeping every string in one place.
- No migration, no new dependency, no new environment variable.

## Follow-up

- [ ] Update scope row 5's done line, which says one click resolves a ticket, to describe the two forward steps and the confirm. `/scope` owns that file.
- [ ] Decide whether a resolved ticket may ever be reopened. Until then a wrong resolve is only fixable in SQL, which the confirm step mitigates but does not remove.
- [ ] Record who resolved a ticket once accounts exist. There is no field for it now, and free text would not be trustworthy.
- [ ] Add the admin gate and a rate limit before this app gets a public URL, as the scope's deferred list already says.
- [ ] Set up a test runner. This slice is checked by hand per the Prototype tier, and the move rules and the view parsing are the first things worth a real test.
