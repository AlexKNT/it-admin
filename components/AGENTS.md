# components

The shadcn/ui component set. Everything under `ui/` is source copied into the repo by the shadcn CLI, styled with Tailwind classes and built on Radix primitives.

Governing spec: [docs/specs/0002-report-a-ticket/index.md](../docs/specs/0002-report-a-ticket/index.md).

## Files

- `ui/`: `alert`, `badge`, `button`, `field`, `input`, `label`, `select`, `separator`, `table`, `textarea`. Each exports its parts, and `button` and `badge` also export a `*Variants` map.
- [../lib/utils.ts](../lib/utils.ts): re-exports `cn`, and is the utils alias `components.json` points at.

## Commands

Run from the repo root.

```bash
pnpm dlx shadcn@latest add <component>   # add a component, keeping the radix base
```

## Conventions

- `components.json` fixes the style (`radix-nova`), the neutral base colour and the aliases (`@/components/ui`, `@/components`, `@/lib`, `@/hooks`). Never mix bases.
- Components import `{ cn } from "cn"`, the package, not `@/lib/utils`.
- Generated files are used as written. Restyle with `className` at the call site or a wrapper above `ui/`, so a later `shadcn add` stays a clean diff.
- `field`, `label`, `select`, `separator` and `table` carry `"use client"`; `alert`, `badge`, `button`, `input` and `textarea` are server safe.
- Colours and radii come from the token block in `app/globals.css` (`--background`, `--card`, `--primary`, `--border`, `--radius`), fed by `tw-animate-css` and `shadcn/tailwind.css`. Dark mode follows the operating system, there is no `.dark` toggle.
- Badge variants are picked by ticket value through the maps in [../lib/ticket-display.ts](../lib/ticket-display.ts), never inline in a page.

_Drafted by /sync from the introducing change, worth a quick human pass._
