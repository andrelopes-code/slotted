---
version: 1
slug: 'apps-docs-src-pages-index-astro'
primary_target: 'apps/docs/src/pages/index.astro'
related_targets:
  ['apps/docs/src/pages/[framework]/components/[family].astro', 'apps/docs/src/layouts/Base.astro']
---

# Surface brief — docs site (home + component pages)

Scope: `apps/docs` home (`/`) is Persuade; component and foundation pages are Read.

Audience and job: engineers evaluating adoption (home) and engineers consulting examples, API and behavior (component pages), equal weight.

Constraints: chrome built from `@slotted/react` on `@slotted/themes`; site CSS reaches a family only through public tokens and `data-slotted-*` axes. Scheme follows the system. English. No invented claims; no logo (the name is text, provisional). References pinned by the user: Tailwind docs (frame grammar), Stripe docs (API reference, restraint), reui (component craft).

Rejected direction (2026-10-01): left headline + screenshot-right hero, dot-grid with glow, punchline section titles, invented logo, a 12-row orders demo, a Field as the density specimen.

## Direction contract

THESIS: A drafting sheet. Hairline rails and hatched margins measure the page the way Tailwind's docs do, and the library's own operations console runs inside that frame at full width. Refuses the split hero, glows and dot fields.

OWN-WORLD: theme neutrals; hairlines at text 5% (light) and 10% (dark); 2.5rem gutters hatched at 315°, 1px every 10px, fixed; code in a dark double frame (outer `rounded-xl` p-1, inner `rounded-lg` at 10% with an inset ring), scoped with `data-slotted-scheme="dark"` so token colors stay legible; the theme accent marks current state only; Geist and Geist Mono.

STORY: The visitor reads one sentence of what this is, then operates a real console (navigation with groups, dashboard, orders grid with selection, filters and a detail panel), then sees the theme axes act on a dense table, then the full family index. On a family page they read, run the example, copy the code.

FIRST VIEWPORT: Home at 1440×900 — rails at the container edges, hatched gutters outside; headline 2 lines, 72px/500, tracking −0.04em, left in the content column; one sentence and two actions below; the console's frame begins near y≈430 and fills the container width. Docs — 56px header; grid `18rem nav | 2.5rem hatch | content | 2.5rem hatch`; content `48rem` prose plus a `13rem` "On this page" column at ≥80rem; h1 30px/500; body 16/28.

FORM: user-pinned references (Tailwind docs, Stripe docs, reui); no concept-seed roll; code-led (no image generation).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction

The console is navigable: side navigation switches screens in place; the axis bar above it re-scopes scheme and density on the console alone.

## Revision (2026-10-01, user)

- The home ground is monochrome light: three rays from above the opening that sway on their own, a breathing glow at their source and a light under the pointer on a damped spring, drawn into a canvas a sixth of its size (a third on a light ground) and scaled up by the browser, dithered against 8-bit banding (`lib/rays.ts`). 60 fps with a software compositor. Rejected by the user the same day: contour lines (ugly, laggy), a colour shader (psychedelic), a static CSS beam (stiff).
- The hatched band behind the console is gone. The console stays inside the rails; the column is 86rem so the overview's dashboard reads at its expanded class.
- The stage (axis bar and console) can take the whole screen (`fullscreen` family).
