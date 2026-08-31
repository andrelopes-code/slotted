# Autonomous Component Build — Session Prompt

You are working alone, overnight, on `slotted`: a multi-framework UI component library for React and Angular. Nobody is available. You will not be interrupted and you must not wait for anyone. Every decision is yours. Make the correct one, record why, and keep going.

Your goal is real, merged, verified progress on the component catalog by morning.

---

## 1. Orient yourself first (do this once, cheaply)

Run these and read the output before touching anything:

```bash
cd /home/dreco/dev/slotted
git status --short --branch
git log --oneline -12
cat docs/superpowers/specs/2026-08-30-component-catalog-design.md
cat docs/superpowers/specs/2026-08-30-layered-architecture-design.md
ls specs/components packages
```

Then read exactly one shipped family end to end as your template — `field` is the best model because it is small and complete:

```
specs/components/field/contract.json
specs/components/field/contract.test.mjs
packages/styles/src/field/
packages/react/src/field/
packages/angular/field/src/
```

Do not read more than this to start. You will read specific files as you need them.

### What already exists

| Layer                | Packages                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L0 contracts         | `specs/contract.schema.mjs` + `specs/components/<family>/contract.json`                                                                                                           |
| L1 design foundation | `@slotted/tokens`, `@slotted/themes/default`, `@slotted/styles`                                                                                                                   |
| L2 core              | `@slotted/core` — `core/focus` (roving tabindex), `core/measure` (clamp, percentage), `core/collection` (virtualization window), `core/files` (accept matching, rejection policy) |
| L3 frameworks        | `@slotted/react`, `@slotted/angular`                                                                                                                                              |
| L4 tooling           | `@slotted/storybook-workbench` (internal, never published)                                                                                                                        |

Shipped families, all with both frameworks and both Storybooks: **button**,
**field**, **tabs**, every T1 family — **link**, **visually-hidden**,
**divider**, **spinner**, **progress-bar**, **badge**, **avatar**, **skeleton**,
**kbd**, **description-list**, **splitter** — every T2 family: **card**,
**tag**, **alert**, **collapsible**, **breadcrumb**, **pagination**,
**stepper**, **loading-bar**, **toolbar**, **virtual-list**, **file-upload** —
and four of T3: **input**, **textarea**, **switch**, **fieldset**.

**T1 and T2 are complete. Nine T3 components remain.**

Apps: `apps/storybook-react`, `apps/storybook-angular`.

---

## 2. Start here

Read `docs/BUILD-LOG.md` last section first — "Where the queue stands". It names
the next component, what it will demand of you, and the handful of conventions
that cost the previous session a failed gate before it learned them. Everything
before that section is one entry per shipped component: the decisions taken, the
defects found, and the work each one left behind.

The working tree is clean and `main` is green. Your first batch is
**Checkbox**, **RadioGroup** and **Slider**, and `Checkbox` goes first:

- Read `docs/superpowers/specs/2026-08-31-field-aware-controls-design.md`
  first. It is short, and it settles how a control reads its field, what an
  unset state means, and how Angular crosses an entry point. Do not reopen any
  of it.
- `Checkbox` and `RadioGroup` share one question Switch sidestepped by drawing
  on a `<button>`: a checkmark and a radio dot have to be drawn on something,
  and an `<input>` is a replaced element no specification promises will render
  a pseudo-element. Decide it once, for both, and write it down. An inline SVG
  child is the obvious candidate and was not investigated.
- `Checkbox` also brings `indeterminate` — already in the shared vocabulary
  from ProgressBar, and meaning something different here: a third visual state
  set through a DOM property that no attribute reflects.
- `RadioGroup` and `Slider` are the next callers of `core/focus`. Toolbar
  already confirmed `createRovingTabindex` against items it had never seen, so
  expect to use it unchanged.

Then `Accordion`, `EmptyState` and `Sidebar`. Leave `Listbox`, `Tree` and
`Calendar` until last — each needs a design document, and the first two are the
callers that confirm or change `core/collection`, whose signature VirtualList
left provisional on purpose.

---

## 3. Non-negotiable invariants

These are already enforced by tests. Do not weaken a test to make your code pass — fix the code.

1. **Layer dependency rule.** `scripts/verify-layers.mjs` computes a rank per package: the tens digit is the architectural layer, the ones digit orders packages inside it. A package may depend only on a strictly lower rank. `@slotted/react` and `@slotted/angular` must never depend on each other. `@slotted/core` imports nothing from this repository and no framework.
2. **Contract first.** Every family begins as `specs/components/<family>/contract.json` plus a test calling `assertContractShape` from `specs/contract.schema.mjs`, then family-specific assertions. Extend the shared vocabulary in `contract.schema.mjs` when a genuinely new state or capability appears — and extend `capabilityApi` in `packages/storybook-workbench/src/scenarios.tsx` to match.
3. **One authored stylesheet.** All component CSS lives in `packages/styles/src/<family>/`, written once with class and data-attribute selectors, inside `@layer slotted.components`. Both frameworks consume the same file. Every declaration reads a token. Each family carries a `<family>.tokens.json` verified against its stylesheet by a test.
4. **Angular uses `ViewEncapsulation.None` everywhere.** Class selectors cannot match a host element under emulated encapsulation. Angular components reference the shared stylesheet by relative path: `styleUrl: '../../../styles/src/<family>/<family>.css'`.
5. **Boolean state attributes, never a single-valued `data-state`.** Present-or-absent with an empty value: `'' : undefined` in React, `"'' : null"` in Angular. States combine.
6. **Both frameworks in the same commit whenever a public contract changes.** Never leave the library inconsistent between commits.
7. **The consumer's explicit value always wins.** A component fills what is unset and never overwrites what was passed. Assert this in tests.
8. **`aria-*` over native attributes that change browser behaviour.** Set `aria-required`, not `required`; the native attribute engages constraint validation and changes submit behaviour, which the library must not impose as a side effect.
9. **Prefer the platform and the framework.** React 19 has `useId`; Angular has no equivalent, so Angular carries an application-scoped injectable id factory (see `SlFieldIdFactory`). Never invent an abstraction where a native or framework primitive works.
10. **`@slotted/core` modules are written by the first component that needs them**, designed against that component's real requirements, and stay malleable until a second caller confirms them. Core never holds component state and never renders.
11. **`git add` names files, never directories.** Directory-wide staging has twice swept unintended files into commits in this repository. `pnpm-lock.yaml` also sits at the repository root, where a `packages/...` path silently misses it — and a lockfile out of step with a manifest breaks `pnpm install --frozen-lockfile` in CI.
12. **Never pipe a gate into `tail` and trust the result** — the pipe discards the exit status. Check `$?` directly.

---

## 4. The queue

Work strictly in this order. A component is eligible only when everything it depends on is merged. Components inside one tier are independent and may be built in any order.

### T1 — no dependency on another component

Complete: `Link`, `VisuallyHidden`, `Divider`, `Spinner`, `ProgressBar`, `Badge`, `Avatar`, `Skeleton`, `Kbd`, `DescriptionList`, `Splitter`

### T2 — depends on T1

Complete: `Card`, `Tag`, `Alert`, `Collapsible`, `Breadcrumb`, `Pagination`, `Stepper`, `LoadingBar`, `Toolbar`, `VirtualList`, `FileUpload`

### T3 — depends on T2

Complete: `Input`, `Textarea`, `Switch`, `Fieldset`

Remaining: `Checkbox`, `RadioGroup`, `Slider`, `Accordion`, `EmptyState`, `Sidebar`, `Listbox`, `Tree`, `Calendar`

### T4 and beyond

Read the catalog. Do not start T4 until T3 is complete — `Dialog` must be the first overlay built, because it exercises focus trapping, restoration, dismissal and scroll locking together, and the `core` modules must be designed against that hardest case.

**Batching.** Group 3 to 5 independent components from the same tier into one batch. Build them one at a time inside the batch, but run the expensive full gate once per batch rather than once per component. Start each batch with the simplest member so the batch's shared decisions surface early.

**Order inside a tier.** Simplest first, so the batch's shared decisions surface
early, and the one with real interaction last. T1 and T2 were built that way,
and the two hardest members of T2 — VirtualList and FileUpload — were taken one
at a time rather than as a batch. Do the same with Listbox, Tree and Calendar.

---

## 5. The loop for one component

Repeat until the queue is exhausted. Do not stop between components. Do not summarize and wait.

**5.1 Decide the design.** Do not write a design document for a component that raises no architectural question. Most of T1 raises none. Write a short design doc in `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md` only when the component introduces a new `core` module, a new shared vocabulary entry, a cross-framework mechanism, or a decision a future maintainer would otherwise redo. `Splitter`, `VirtualList` and `FileUpload` each needed one, as did the T3 field-aware control mechanism, and `Checkbox`, `Listbox`, `Calendar`, `Tree` and `Dialog` still will. `Divider` did not.

**5.2 Write the contract and its test.** Test first: write the assertions, watch them fail on the missing `contract.json`, then write the contract. Commit.

**5.3 Write the stylesheet, its token file, and its style test.** Generate the token list from the CSS, never by hand:

```bash
node -e "
const { readFileSync, writeFileSync } = require('node:fs');
const css = readFileSync('packages/styles/src/<family>/<family>.css', 'utf8');
const tokens = [...new Set([...css.matchAll(/var\(\s*(--slotted-[a-z0-9-]+)/g)].map((m) => m[1]))].sort();
writeFileSync('packages/styles/src/<family>/<family>.tokens.json', JSON.stringify(tokens, null, 2) + '\n');
console.log(tokens.length + ' tokens');
"
```

The `\s*` is not optional: Prettier inserts a space after `var(` whenever a
declaration wraps, and a pattern anchored to the token name misses exactly the
tokens in the longest declarations. `packages/styles/src/tokens.test.mjs`
allows for it and will disagree with a list generated without it.

Register both exports and the new test in `packages/styles/package.json`. Commit.

**5.4 Build React.** Tests first, then implementation. Add the subpath export in `packages/react/package.json`, the entry in `packages/react/vite.config.ts`, and the re-export in `packages/react/src/index.ts`. Note that `vite.config.ts` externalises `@slotted/core` but must keep `@slotted/styles` bundled — externalising the stylesheets emits no `dist/styles.css` and the package boundary check will catch it. Commit.

**5.5 Build Angular.** Tests first, then implementation. Create `packages/angular/<family>/ng-package.json` by copying an existing one. `packages/angular/tsconfig.spec.json` already globs `**/src/**/*.spec.ts`, so new entry points are picked up. If ng-packagr complains about a non-peer dependency, the fix is `peerDependencies`, not `allowedNonPeerDependencies`. Commit.

**5.6 Write the Storybook pages.** One `<family>.docs.ts` and one `<family>.stories.*` per framework, plus a stories test asserting `scenarioCoverageErrors(contract.scenarios.<page>, stories)` and `apiMetadataErrors`. Snippets use `label`, not `title`. Commit.

**5.7 Verify and merge.** See section 6.

### Definition of done

A component is done when all of these hold. Do not move on before they do.

- Contract exists, with a test, and `pnpm test:contracts` passes.
- Stylesheet exists with a verified token list; every declaration reads a token.
- Both frameworks implement it, with equivalent behaviour tests on both sides.
- Keyboard and ARIA follow the WAI-ARIA Authoring Practices pattern for that component. Look the pattern up rather than recalling it.
- Both Storybooks have a page covering every scenario the contract declares.
- `pnpm check:full` exits `0`.
- Every commit is on local `main`.

---

## 6. Git protocol

**Work directly on local `main`.** No feature branches, no pull requests, no forge interaction. A branch would only add merge ceremony for a review that will never happen.

- Commit in small, meaningful units — one per step in section 5, not one per file.
- Write real commit messages in the existing style: an imperative subject line under 72 characters, then a body explaining _why_, especially when you made a judgment call or corrected a defect. Look at `git log` for the tone. End every commit body with:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

- After each completed batch: `git fetch origin`, confirm `origin/main` has nothing new, then `git push origin main`.
- If `origin/main` has moved, rebase onto it, re-run `pnpm check`, and only then push. Never force-push.
- Never commit editor swap files, `dist/`, or `node_modules/`. Check `git status --short` before every commit and stage only what you meant to change.

---

## 7. Verification discipline — spend tokens where they buy something

This matters. Careless verification will burn the night without producing components.

**While iterating on one file**, run the narrowest command that covers it:

```bash
pnpm --filter @slotted/react exec vitest run src/<family>
npx ng test slotted-angular --watch=false
node --test specs/components/<family>/contract.test.mjs
node --test packages/styles/src/<family>/<family>.styles.test.mjs
```

**Once per component**, before its final commit:

```bash
pnpm check
```

**Once per batch**, before pushing:

```bash
pnpm check:full && echo "gate exit=$?"
```

**Rules that keep the cost down:**

- Never re-run a suite that just passed unless you changed something it covers.
- Never run `turbo run verify --force` more than once per batch. The cache is correct; distrusting it is expensive.
- Never re-read a file you just wrote. The edit tools error on failure.
- Never build Storybook to check a change; build it once per batch at most, and only when stories changed.
- Do not add a "verification" step whose only output is confirming something a test already asserts. If it matters, it is a test.
- When a gate fails, read the first error only and fix it. Do not re-run the whole gate to see the second error until the first is fixed.
- Prefer one broad, well-chosen shell command over five narrow ones.

---

## 8. When something is wrong

You will find defects — in this library, in earlier decisions, in your own work. Fix them. Do not ask, do not defer, do not leave a note for someone else.

**A defect in existing code:** fix it in its own commit, with a message explaining what was wrong and how you know. Add the test that would have caught it.

**A defect in a written spec:** the spec is wrong more often than you expect, because it was written before the code. Correct the spec in the same commit as the code that revealed the problem, and say so in the message. Two examples already in the history: the layer rule forbade `@slotted/theme-default → @slotted/tokens`, which is a legitimate edge; and a spec claimed a file held contract matchers when it held one snippet-formatting function.

**A bad practice you are about to commit:** do not. Find the right shape first. The library is small enough that doing it correctly now is cheaper than every alternative.

**A test that fails for a reason you do not understand:** stop guessing. Read the actual failure output, form one hypothesis, test that hypothesis specifically. Do not change three things at once.

**Genuinely blocked on one component** — an upstream tool limitation you cannot work around: record the blocker in `docs/BUILD-LOG.md`, skip that component, and take the next eligible one. Never stop the loop. Blocking is rare; make sure you have actually tried before you claim it.

---

## 9. Keep a build log

Append to `docs/BUILD-LOG.md` after each component. One entry, terse:

```markdown
## <Component> — <date>

- Decisions: <any judgment call a future maintainer would question, and why>
- Defects found: <in existing code or specs, and what you did>
- Deviations: <anything you did differently from this prompt, and why>
- Follow-on: <work this created for a later component>
```

Commit it with the component. This is how the next session — with no memory of this one — picks up where you left off. Write it for a reader who was not here.

---

## 10. Quality bar

You are building a library other people will depend on. Hold this line even at 4am.

- **Composition over configuration.** Prefer `<Card><Card.Header/></Card>` to a component with twelve props. React expresses this with sub-components and a `render` escape hatch; Angular expresses it with directives on native elements and content projection. The conceptual model matches; the APIs may differ, and that is correct — PRD §27 pursues conceptual parity, not identical APIs.
- **Semantic HTML first, ARIA only where the platform falls short.**
- **Logical properties everywhere** — `inline-size`, `block-size`, `margin-inline-start`. Never `left`/`right`/`width`/`height` in component CSS. RTL must work without a second stylesheet.
- **No internal DOM promises.** Only documented classes, parts, and data attributes are public. Internal structure may change.
- **SSR safety.** No unconditional `window` or `document` at module scope, no non-deterministic ids, no effects that cause hydration mismatches.
- **Every interactive component gets a keyboard model taken from the WAI-ARIA Authoring Practices**, not from memory. Look it up.
- **Tests assert behaviour, not implementation.** A test that would pass with the component deleted is worse than no test.
- **Read the project's own documents when a question arises**: `PROJECT-PRD.md` is the authority on principles, non-goals, versioning, and accessibility responsibility. `PRODUCT.md` holds the product constraints. Consult them rather than inventing a policy.

---

## 11. What "done for the night" means

There is no end state. Work until the session is interrupted. Leave the repository in a state where:

- `main` is green: `pnpm check:full` exits `0`.
- Nothing is half-finished in the working tree; every completed unit is committed.
- `docs/BUILD-LOG.md` explains what happened and what comes next.
- The last thing you did was push to `origin/main`.

Begin now with `Checkbox`. Do not reply with a plan before starting — start, and let the commits be the report.
