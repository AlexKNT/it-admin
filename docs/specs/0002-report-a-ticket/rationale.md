# 0002. Report a ticket form and the admin list · decision record

**Date**: 2026-10-17

The build spec lives in [index.md](./index.md). This file holds the reasoning behind the chosen option.

## Context

> ⚠️ Premise note: the report form is public by scope decision. Anyone who reaches the app can create a ticket, and `/admin` is a plain URL with no gate, so the same visitor can read every reporter name and email. That is acceptable for a course demo, and it must not be shared on a public URL before a gate and a rate limit land. This spec builds the honest version of the scope, not a secure one.

Spec 0001 settled the hard part: one `tickets` table on Neon Postgres, a typed data layer, a zod input schema, and two server action signatures with typed results. Nothing here changes that shape. What is missing is the two pages the scope promised, and the only real design questions left are how those pages look, how they behave when input is bad or the database is down, and what the admin sees on each row.

The reporter may be on a phone, so the form has to read in one column and the list has to work at a narrow width. The admin works a queue, so the list must show enough on a row to triage and reply without a detail page, and it must page rather than scroll forever. The ticket carries personal data (a name and an email), so no email value may reach a log or an error message.

The framework is Next.js 16 with `cacheComponents` and `partialPrefetching` switched on, which changes how a page that reads the query string and the database has to be composed. Tailwind 4 is already wired through the Turbopack loader, and there is no component library yet. Without this decision the next slice would invent a second look for the list, a second set of form controls, and its own copy, and the two would drift.

## Options considered

### Option 1: shadcn/ui components with server side validation

A set of components copied into the repo through the shadcn CLI, styled with Tailwind, plus the existing zod schema and server action as the only validator.

**Pros**:
- Accessible primitives (labels, focus handling, alert roles) come ready, and every component is local code you can read and change.
- One look for both pages, and the next slice reuses the badges, table and field pieces instead of inventing them.
- No runtime design system to keep in step: the styled source lives in the repo.

**Cons**:
- Several new dependencies arrive (Radix or Base UI primitives, `clsx`, `tailwind-merge`, `class-variance-authority`), and the copied files are yours to maintain.
- The select control is a client component, so the form becomes a client component with a small JavaScript bundle.

### Option 2: Hand written Tailwind primitives

Four small components written by hand (`Field`, `Button`, `Alert`, `Badge`) and a plain semantic table, with no library.

**Pros**:
- No new dependency at all, and the whole surface stays tiny.
- Total control over markup, with nothing to learn from generated files.

**Cons**:
- Focus rings, invalid states, keyboard behaviour for the select and the badge variants all have to be built and tested by hand.
- The result tends to drift between the form and the list, which is exactly what the next slice would then inherit.

### Option 3: A complete component framework (MUI or Ant Design)

A full design system package with its own theming layer and form components.

**Pros**:
- Many components out of the box, with documentation and a large community.
- Little visual work up front.

**Cons**:
- It brings its own styling engine, which fights the Tailwind pipeline already configured here.
- Far more than two pages need, and a heavier bundle for a tiny demo.

## Rationale

The engineer picked shadcn over hand written primitives, and the stack makes that cheap: Tailwind 4 is already the styling pipeline, and shadcn components are copied source rather than a runtime dependency, so the look stays editable. The real gain is the accessible behaviour behind a select, a labeled field and an alert, which a hand written version tends to get wrong quietly. The cost is a handful of new packages and files the repo now owns.

Validation stays on the server because spec 0001 already made `createTicketAction` return per field messages. Adding react-hook-form with a mirrored schema would put the same rules in two places, and the two would drift the first time a length changes. The runner up was react-hook-form for instant feedback, which is genuinely nicer on a slow connection but costs a second source of truth for seven fields.

The list uses a table above `md` and cards below it, from one row model, so the admin sees every fact at any width. The runner up, a table with horizontal scroll, is less code and worse to use on a phone. Dates are formatted in UTC on the server because a fixed string is identical in the browser, which removes a hydration mismatch instead of papering over one.
