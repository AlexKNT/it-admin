# Verify: Report a ticket · spec 0002 · updated 2026-10-17
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] `pnpm dev`, open `/` → seven labelled controls, Department and Category read `Choose one`, Priority reads `Normal` → AC-2
- [ ] Submit the untouched form → one summary alert saying six fields need attention, focus lands on it, a message under each bad field → AC-4
- [ ] Inspect a bad control → `aria-invalid="true"` and `aria-describedby` names its message element → AC-4
- [ ] Fill title, description, name and email, submit with both selects empty → typed values still in the fields, two field messages → AC-4
- [ ] Submit the same invalid values again without editing → values still there, the count is unchanged → AC-4
- [ ] Fill every field, choose IT and Hardware, send → success alert with the full uuid and a link to `/admin` → AC-3
- [ ] After the save → text fields empty, Department and Category back to `Choose one`, Priority back to `Normal` → AC-3
- [ ] Send twice quickly → the button is disabled with the pending label, one ticket is written → AC-5
- [ ] Open `/admin` → the new ticket is first with an `Open` badge → AC-3, AC-6
- [ ] Inspect a row → title, one line excerpt, reporter name, email, department, category, priority badge, status badge, UTC time and eight character id → AC-6
- [ ] `/admin?page=2`, then back → no ticket appears on both pages, `Previous` disabled on page 1, `Next` disabled on the last page → AC-7
- [ ] Read the paging row → `Page X of Y, N tickets` matches the rows shown → AC-7
- [ ] `/admin?page=abc`, `?page=0`, `?page=-3` and `/admin?page=` → each lands on page 1 → AC-7
- [ ] `/admin?page=99` → out of range panel with the real total, the real page count and a link to page 1 → AC-7
- [ ] Empty the table, reload `/admin` → empty state with its link to `/` → AC-8 (not exercised in the build run, the seeded table had rows)
- [ ] Point `DATABASE_URL` at an unreachable host and restart → `/` renders, a submit shows `The database could not be reached. Try again.` with the values kept, `/admin` shows the error boundary → AC-9
- [ ] At 375 pixels wide → one card per ticket, every value readable, no horizontal page scroll → AC-10
- [ ] At 1024 pixels and wider → a table with the same values → AC-10
- [ ] Set the operating system or browser timezone to another zone and reload `/admin` → the same UTC strings → AC-10
- [ ] Watch the console on `/admin` → no hydration warning → AC-10
- [ ] Submit a bad form, then read every alert and the server output → no reporter email anywhere → AC-11
- [ ] Change the email cursor into another field: a reporter email is only ever echoed as a field value and shown as a list cell → AC-11
- [ ] Open the three selects → the choices are exactly `departmentKindEnum`, `ticketCategoryEnum` and `ticketPriorityEnum` → value sourcing
- [ ] Post a 400 character description → the row excerpt is one line, cut near 120 characters, never mid word → value sourcing
- [ ] Compare the eight character id on the row with the full uuid in the success alert → the row shows its first eight characters → value sourcing
- [ ] Confirm the priority and status badges change style across `Low`, `Normal`, `High` and `Open`, `In progress`, `Resolved` → value sourcing

## Commands

- [ ] `pnpm exec tsc --noEmit` → no errors → AC-1
- [ ] `pnpm lint` → no errors → AC-1
- [ ] `pnpm build` → succeeds, `/` static, `/admin` a partial prerender, no blocking route error → AC-12

## Acceptance-criteria coverage

- AC-1 … covered by the lint, tsc and build commands, plus the `components.json`, `lib/utils.ts` and `app/globals.css` inspection
- AC-2 … covered by the first UI step
- AC-3 … covered by the success alert, the cleared fields and the admin row steps
- AC-4 … covered by the empty submit, the aria inspection, the kept values and the repeated submit steps
- AC-5 … covered by the double send step
- AC-6 … covered by the row inspection step
- AC-7 … covered by the paging, label, bad page and out of range steps
- AC-8 … covered by the empty table step
- AC-9 … covered by the unreachable host step
- AC-10 … covered by the narrow width, wide width, timezone and console steps
- AC-11 … covered by the alert, server output and email placement steps
- AC-12 … covered by the build command
