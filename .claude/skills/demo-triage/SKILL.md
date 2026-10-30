---
name: demo-triage
description: Use when a problem is reported in a demo application under demos/ (Nexora or any other consumer app), or when a demo behaves wrongly while building it. Decides whether the fault is in the UI kit packages or in the demo's own code, and fixes it on the right side. Triggers on "in the demo", "in nexora", "the demo is", "is this a package bug?", "component X does not", a screenshot of a demo screen, or a failing demo test.
---

# Demo triage

The demos under `demos/` consume the library as a real consumer would: `@slotted/*` from
tarballs in `demos/.registry`, never from source. A problem seen there is either a defect of
the UI kit — which real consumers would hit — or a mistake in the demo. The two are fixed in
different places and never confused: a package defect is never patched around in the demo, and a
demo mistake never changes the package.

## 1. Reproduce

- Read `demos/<app>/README.md` for the run commands. The Angular demo: `pnpm start` in
  `demos/nexora/angular`, `http://localhost:4250`.
- Capture what the report describes: `node tools/shoot.mjs <url> <out.png> [light|dark] [width]`
  in the app, or a failing `pnpm test`. A screenshot is evidence; a description is not.
- Note the beta the demo consumes: the `file:` versions in its `package.json`.

## 2. Locate the boundary

Answer, in order, and stop at the first that decides:

1. **Contract.** `specs/components/<family>/contract.json` and the family's reference page
   (`packages/angular/<family>/src/<family>.docs.ts`, `packages/react/src/<family>/<family>.docs.ts`)
   say what the family promises. Does the demo use the family inside that promise? Outside it →
   demo. Inside it and it still fails → package.
2. **Storybook.** The same markup in the family's stories (`pnpm dev:angular` / `pnpm dev:react`)
   reproduces the fault? Yes → package. No → look at what the demo adds: wrapping elements,
   own CSS, `display: contents`, encapsulation, a portal boundary.
3. **Minimal test.** When 1 and 2 leave doubt, write the smallest test that shows the fault:
   `packages/angular/<family>/src/<family>.spec.ts`, or
   `packages/styles/src/<family>/<family>.styles.test.mjs` for a stylesheet rule. The test
   decides, and it stays.
4. **Backend.** In Nexora, data shapes come from `demos/nexora/backend`. A wrong count,
   label or missing field is checked against `backend/api/resources/*.ts` before anything in
   the UI is blamed.

State the verdict with its evidence before touching code: "package — the stories reproduce it
with `<markup>`" or "demo — the family expects `<x>` and the app wrote `<y>`".

## 3. Fix on the right side

**Package defect** — the fix is the one a consumer with no demo would want:

- change the family (`packages/styles`, `packages/angular`, `packages/react`, `packages/core`),
  with a test that fails before and passes after; both bindings when the defect is in the
  contract or the stylesheet;
- update `specs/components/<family>/contract.json` and the reference pages when the API moves;
- run the family's checks (`pnpm --filter @slotted/<pkg> verify`) and `pnpm check` for the
  shared surface;
- rebuild the tarballs and reinstall: `pnpm demo:refresh` at the repository root (three
  packages, current version), or `pnpm pack:beta` for all; restart the demo's dev server;
- in `demos/<app>/LIBRARY-FEEDBACK.md`, the entry gains the commit that fixed it. A fix
  that changes public API ships in a beta release (`pnpm release`) and the demo moves its
  `file:` versions deliberately.

**Demo mistake** — fix the demo. When the mistake came from an API that was easy to misuse
(unclear name, missing type, silent no-op, undocumented requirement), add a row to
`LIBRARY-FEEDBACK.md`: it is not a defect, but it is what the public-API review reads.

**Backend gap** — the `## Backend` table in `LIBRARY-FEEDBACK.md`; the backend package is not
changed from a demo session unless the task says so.

## 4. Record

Every triage ends with one row in `LIBRARY-FEEDBACK.md` — beta, family, friction, cost — and,
for a package fix, the commit hash. The file is the ledger the public-API assessment is built
from; a problem fixed without a row is a problem the next consumer meets again.

## Frictions already classified

`demos/nexora/angular/LIBRARY-FEEDBACK.md` lists what the Shell met. The rows judged
package-side at triage time, in priority order: `avatar` empty fallback erasing initials;
`top-navigation` root required as the banner's direct child, `[slTopNavigationCount]` bound to
`notifications` only, static `aria-label` on its controls; `command-palette` clicking `href`
items natively and typing its item template on the base item; `grid` rejecting string
attributes; `toast` actions only by `TemplateRef`; `app-shell` overlay closes through the
persisted `navOpen` model, and the rail leaving the consumer's nav header/footer content
visible. Each is fixed by this skill's step 3 when picked up, not by the demo.
