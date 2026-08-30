# Single-Source Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two remaining copies of data that already exists elsewhere — the scenario list restated in the workbench, and the public token list restated in both framework packages — and make the token list verifiable against the stylesheet it describes.

**Architecture:** The scenario list moves to a single read of `specs/components/button/contract.json`. The token list moves to `@slotted/styles`, beside the CSS it documents, and a test asserts it equals the set of `--slotted-*` custom properties the stylesheet actually references. The per-framework API tables are deliberately left alone.

**Tech Stack:** pnpm workspaces, Turborepo, Vitest, `node:test`, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-08-30-layered-architecture-design.md`, section "L0 — Contracts".

## Scope Note

The spec says "Documentation prose derives from the contract rather than being restated per framework, replacing the duplicated conceptual sections of `button.docs.ts`". Measurement does not support the whole of that sentence, and this plan implements the part it does support.

`packages/react/src/button/button.docs.ts` and `packages/angular/button/src/button.docs.ts` are 257 and 273 lines. After normalising the framework name, 154 lines differ. The differences are substantive, not cosmetic:

- React exposes `leading` and `trailing` as props typed `ReactNode`; Angular exposes them as the content-projection selectors `[slButtonLeading]` and `[slButtonTrailing]`.
- React types `loadingText` as `ReactNode`; Angular types it as `string`.
- Angular descriptions name the binding syntax, as in "Semantic intent via [variant]".

PRD §27 states that the library pursues conceptual parity and that "the APIs may differ", and §46.1 names a generic layer that harms both frameworks as a risk to avoid. Forcing these two tables into one shape would be that mistake, so the API tables stay per framework.

What is genuinely duplicated with no reason to differ is the token list: `REACT_BUTTON_TOKENS` and `ANGULAR_BUTTON_TOKENS` are byte-identical, 38 lines each, and describe the stylesheet rather than either framework. That is what this plan unifies.

The plan also corrects the spec sentence above.

## Global Constraints

- Node `>=24 <25`; pnpm `11.24.0`.
- Namespace is `slotted`.
- Layer ranks unchanged; `pnpm test:layers` stays green.
- `pnpm format:check` and `pnpm lint --max-warnings=0` pass at every commit. Check the exit status directly; piping into `tail` discards it.
- The full gate is `pnpm check:full`.
- No new dependency.
- Internal custom properties are underscore-prefixed (`--_solid`) and are never part of the public token list.

---

## File Structure

**Created**

| File | Responsibility |
| --- | --- |
| `packages/styles/src/button/button.tokens.json` | The button family's public custom properties, in one authored place |

**Modified**

| File | Change |
| --- | --- |
| `packages/storybook-workbench/src/scenarios.tsx` | Reads the scenario list from the contract; drops the literal |
| `packages/storybook-workbench/src/scenarios.test.ts` | Asserts the derived value against the contract |
| `packages/storybook-workbench/src/index.tsx` | Export list follows |
| `packages/react/src/button/button.stories.test.ts` | Consumes the derived scenario list |
| `packages/angular/button/src/button.stories.spec.ts` | Same |
| `packages/styles/package.json` | Exports the token file |
| `packages/styles/src/button/button.styles.test.mjs` | Asserts the token file matches the stylesheet |
| `packages/react/src/button/button.docs.ts` | Imports the shared token list |
| `packages/angular/button/src/button.docs.ts` | Same |
| `docs/superpowers/specs/2026-08-30-layered-architecture-design.md` | Corrects the documentation sentence |

---

### Task 1: Derive the scenario list from the contract

`packages/storybook-workbench/src/scenarios.tsx` restates `contract.scenarios` as a literal. The copy is currently guarded — `scenarios.test.ts:14` asserts the two are equal — so this is redundancy rather than a drift risk, and removing it deletes the guard along with the copy.

**Files:**

- Modify: `packages/storybook-workbench/src/scenarios.tsx`
- Modify: `packages/storybook-workbench/src/scenarios.test.ts`
- Modify: `packages/react/src/button/button.stories.test.ts`
- Modify: `packages/angular/button/src/button.stories.spec.ts`

**Interfaces:**

- Produces: `BUTTON_FAMILY_SCENARIOS` keeps its name, its export path, and its exact runtime value, so no consumer changes shape. Only its origin changes, from a literal to `contract.scenarios`. `ScenarioPage` keeps deriving from it.

Keeping the name is deliberate: five call sites across two framework packages already read it, and renaming would enlarge a change whose whole point is deletion.

- [ ] **Step 1: Write the failing test**

Replace the body of `packages/storybook-workbench/src/scenarios.test.ts`'s first test with an assertion that the value is the contract's own object rather than a copy that happens to be equal:

```ts
it('reads the scenario list from the contract instead of restating it', () => {
  expect(BUTTON_FAMILY_SCENARIOS).toEqual(contract.scenarios);

  const source = readFileSync(new URL('./scenarios.tsx', import.meta.url), 'utf8');
  expect(source).toContain('contract.scenarios');
  expect(source).not.toMatch(/playground['"]?\s*,/);
});
```

Add `import { readFileSync } from 'node:fs';` at the top of that file.

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @slotted/storybook-workbench exec vitest run src/scenarios.test.ts`
Expected: FAIL — the source still contains the literal scenario names and no reference to `contract.scenarios`.

- [ ] **Step 3: Derive the value**

In `packages/storybook-workbench/src/scenarios.tsx`, replace the literal with a read of the contract:

```ts
import contract from '../../../specs/components/button/contract.json';

export const BUTTON_FAMILY_SCENARIOS = contract.scenarios;

export type ScenarioPage = keyof typeof BUTTON_FAMILY_SCENARIOS;
```

`packages/storybook-workbench/src/scenarios.test.ts` already imports the contract by that same relative path, so the path and the JSON module resolution are known to work in this package.

- [ ] **Step 4: Run the tests to make sure they pass**

```bash
pnpm --filter @slotted/storybook-workbench verify
pnpm --filter @slotted/react verify
pnpm --filter @slotted/angular verify
```

Expected: green. If TypeScript widens `contract.scenarios` to `string[]` and a consumer needed the literal tuple type, add `as const` to the import site rather than reintroducing the literal — record which consumer needed it in the commit message.

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add packages
git commit -m "refactor(workbench): read the scenario list from the contract"
```

---

### Task 2: Give the public token list one verified source

`REACT_BUTTON_TOKENS` and `ANGULAR_BUTTON_TOKENS` are byte-identical 38-line lists. Nothing checks them against the stylesheet, and they are already wrong: the stylesheet reads `--slotted-button-radius-sm`, `--slotted-button-radius-md`, and `--slotted-button-radius-lg`, and the documented list omits all three, so the Storybook token table understates what a consumer may override.

Both lists are replaced by one authored file next to the CSS, and a test asserts it equals the set of public custom properties the stylesheet actually references. Authored rather than generated: a generated file needs a build step and still needs the same test, while an authored file plus the test makes drift impossible with no machinery.

**Files:**

- Create: `packages/styles/src/button/button.tokens.json`
- Modify: `packages/styles/package.json`
- Modify: `packages/styles/src/button/button.styles.test.mjs`
- Modify: `packages/react/src/button/button.docs.ts`
- Modify: `packages/angular/button/src/button.docs.ts`

**Interfaces:**

- Produces: `@slotted/styles/button/tokens.json`, a JSON array of every public custom property the button stylesheet reads, sorted. `REACT_BUTTON_TOKENS` and `ANGULAR_BUTTON_TOKENS` keep their names and export sites and become re-exports of that array, so the six story files that import them are untouched.

- [ ] **Step 1: Write the failing test**

Append to `packages/styles/src/button/button.styles.test.mjs`:

```js
test('documents exactly the public custom properties the stylesheet reads', async () => {
  const declared = JSON.parse(
    readFileSync(new URL('./button.tokens.json', import.meta.url), 'utf8'),
  );

  const referenced = [...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(
    ([, token]) => token,
  ))].sort();

  assert.deepEqual(declared, referenced);
  assert.ok(
    declared.every((token) => !token.startsWith('--_')),
    'Internal custom properties must not be documented',
  );
});
```

`css` in that file already concatenates `button.css` and `button-group.css`, so both stylesheets are covered.

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test packages/styles/src/button/button.styles.test.mjs`
Expected: FAIL with `ENOENT` on `button.tokens.json`.

- [ ] **Step 3: Generate the file once, then keep it authored**

Produce the initial content from the stylesheet, then commit it as an authored file that the test guards:

```bash
node -e "
const { readFileSync, writeFileSync } = require('node:fs');
const css = ['button.css','button-group.css']
  .map((name) => readFileSync('packages/styles/src/button/' + name, 'utf8'))
  .join('\n');
const tokens = [...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map((m) => m[1]))].sort();
writeFileSync('packages/styles/src/button/button.tokens.json', JSON.stringify(tokens, null, 2) + '\n');
console.log(tokens.length + ' tokens');
"
```

Expected: 82 tokens — the 79 previously documented plus the three missing radius tokens.

Add the export to `packages/styles/package.json`, after the two CSS entries:

```json
    "./button/tokens.json": "./src/button/button.tokens.json"
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `node --test packages/styles/src/button/button.styles.test.mjs`
Expected: PASS.

- [ ] **Step 5: Point both docs files at the shared list**

In `packages/react/src/button/button.docs.ts`, delete the whole `REACT_BUTTON_TOKENS` array literal along with the now-unused `variantTokenSuffixes` constant and the `BUTTON_SIZES`/`BUTTON_VARIANTS` import if nothing else in the file uses them, and replace with:

```ts
import buttonTokens from '@slotted/styles/button/tokens.json';

export const REACT_BUTTON_TOKENS = buttonTokens;
```

Apply the same change in `packages/angular/button/src/button.docs.ts`, keeping the name `ANGULAR_BUTTON_TOKENS`.

Add `"@slotted/styles": "workspace:*"` to `packages/angular/package.json` `devDependencies` — the React package already declares it. Both are development dependencies: `button.docs.ts` is imported only by story files and is not reachable from `public-api.ts`, so it never enters a published artifact.

- [ ] **Step 6: Run the full gate**

```bash
pnpm check:full
echo "exit=$?"
```

Expected: `exit=0`.

Confirm the three tokens are now documented:

```bash
grep -c 'slotted-button-radius' packages/styles/src/button/button.tokens.json
```

Expected: `3`.

- [ ] **Step 7: Correct the spec**

In `docs/superpowers/specs/2026-08-30-layered-architecture-design.md`, replace:

> Documentation prose derives from the contract rather than being restated per framework, replacing the duplicated conceptual sections of `button.docs.ts`.

with:

> The public token list has one authored source in `@slotted/styles`, verified against the stylesheet it describes, and both framework packages re-export it. API tables stay per framework: after normalising the framework name, 154 of the 530 lines across the two `button.docs.ts` files differ, and they differ because the APIs genuinely differ — React takes `leading` as a `ReactNode` prop where Angular projects `[slButtonLeading]` content. PRD §27 allows the APIs to differ and §46.1 warns against the generic layer that unifying them would create.

- [ ] **Step 8: Commit**

```bash
npx prettier --check .
git add packages docs
git commit -m "refactor(styles): give the public token list one verified source"
```

---

## Verification

- `pnpm check:full` exits `0`.
- `grep -rn "playground" packages/storybook-workbench/src/scenarios.tsx` returns nothing.
- `packages/styles/src/button/button.tokens.json` lists 82 tokens, including the three `--slotted-button-radius-*` entries that were previously undocumented.
- Adding a `var(--slotted-button-new-thing)` reference to the stylesheet makes `pnpm --filter @slotted/styles test` fail until the token file is updated.
- The Storybook token table on every button page still renders, now with the radius tokens present.

## Known Follow-On

`@slotted/styles` will need one token file per component family as the catalog grows. The test generalises by iterating the directory rather than naming one file; do that at the second family, not before.
