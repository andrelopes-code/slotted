# Shared Stylesheet Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move component CSS out of the two framework packages into a single authored `@slotted/styles` package, make Angular encapsulation uniform, collapse the duplicated style tests into one, and enforce the layer dependency rule in CI.

**Architecture:** `@slotted/styles` (layer L1) holds one CSS file per component, written once with class and data-attribute selectors. `@slotted/react` imports those files through its bundler; `@slotted/angular` references them through relative `styleUrl` paths with `ViewEncapsulation.None`, which ng-packagr inlines into the published bundle. A repository-level script asserts that no package imports a workspace package from its own layer or above.

**Tech Stack:** pnpm workspaces, Turborepo, Vite (React library build), ng-packagr (Angular library build), Vitest, `node:test`, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-08-30-layered-architecture-design.md`

## Global Constraints

- Node `>=24 <25`; pnpm `11.24.0`. Never change these.
- Dependency rule: `L3 → L2, L1, L0`; `L1 → L0`; `L2` imports nothing from this repository; `@slotted/react` and `@slotted/angular` never import each other.
- Layer numbers: `@slotted/tokens`, `@slotted/theme-default`, `@slotted/styles` = 1; `@slotted/core` = 2; `@slotted/react`, `@slotted/angular` = 3; `@slotted/testing`, `@slotted/storybook-workbench` = 4.
- Namespace is `slotted`: CSS custom properties `--slotted-*`, classes `.slotted-*`, data attributes `data-slotted-*`, npm scope `@slotted/*`, Angular selectors prefixed `sl`.
- Every Angular component in the library uses `ViewEncapsulation.None`.
- All library component CSS lives inside `@layer slotted.components`.
- `pnpm format:check` and `pnpm lint --max-warnings=0` must pass at every commit.
- The full gate is `pnpm check:full`. Run it before the final commit of each task.
- Workspace packages are `private: true` and `"type": "module"`, matching the existing packages.
- Do not change any public API in this plan. `data-state`, component props, and exported names stay exactly as they are; a later plan changes them.

---

## File Structure

**Created**

| File | Responsibility |
| --- | --- |
| `packages/styles/package.json` | Declares `@slotted/styles`, its per-file exports, and its `verify` script |
| `packages/styles/src/button/button.css` | Button, ButtonLink, IconButton, ToggleButton styles — the single authored source |
| `packages/styles/src/button/button-group.css` | ButtonGroup seam and layering styles |
| `packages/styles/src/button/button.styles.test.mjs` | The one style test for the button family |
| `scripts/verify-layers.mjs` | Asserts the workspace dependency graph obeys the layer rule |
| `scripts/verify-layers.test.mjs` | Tests the layer rule logic against fixtures |

**Modified**

| File | Change |
| --- | --- |
| `packages/react/package.json` | Adds the `@slotted/styles` dependency; drops the style test from `test` |
| `packages/react/src/button/button.tsx` | Imports the shared stylesheet instead of the local one |
| `packages/react/src/button/button-group.tsx` | Imports the shared group stylesheet |
| `packages/react/src/button/toggle-button.test.tsx` | Drops the CSS assertion that moved to the style test |
| `packages/angular/package.json` | Drops the style test from `test` |
| `packages/angular/button/src/button.ts` | `ViewEncapsulation.None`, shared `styleUrl` |
| `packages/angular/button/src/button-link.ts` | `ViewEncapsulation.None`, shared `styleUrl` |
| `packages/angular/button/src/icon-button.ts` | `ViewEncapsulation.None`, shared `styleUrl` |
| `packages/angular/button/src/toggle-button.ts` | `ViewEncapsulation.None`, shared `styleUrl` |
| `packages/angular/button/src/button-group.ts` | Shared `styleUrl` |
| `package.json` | Adds `verify-layers` to the root `check` script |

**Deleted**

`packages/react/src/button/button.css`, `packages/react/src/button/button.styles.test.mjs`, `packages/angular/button/src/button.css`, `packages/angular/button/src/button-group.css`, `packages/angular/button/src/button.styles.test.mjs`.

---

### Task 1: Create `@slotted/styles` with the button stylesheets and one style test

The current `packages/react/src/button/button.css` is 314 lines and holds both the button rules and the group rules. The Angular package splits them across two files, and its group file sits outside `@layer slotted.components`. The shared package uses the Angular split — two files — with the React layer membership — both inside the layer.

**Files:**

- Create: `packages/styles/package.json`
- Create: `packages/styles/src/button/button.css`
- Create: `packages/styles/src/button/button-group.css`
- Create: `packages/styles/src/button/button.styles.test.mjs`

**Interfaces:**

- Consumes: nothing.
- Produces: package `@slotted/styles`, `private: true`, with exports `"./button/button.css"` and `"./button/button-group.css"` resolving to `./src/button/button.css` and `./src/button/button-group.css`, and scripts `test` and `verify`.

- [ ] **Step 1: Split the existing stylesheet into the new package**

Both new files must be inside `@layer slotted.components`. Lines 256–297 of the React file are the group rules; everything else belongs to the button file.

```bash
mkdir -p packages/styles/src/button

# Button file: layer opening, button rules, the reduced-motion block, the layer
# close, and the keyframes — that is, the whole file minus lines 255-298.
{ sed -n '1,254p' packages/react/src/button/button.css
  sed -n '299,314p' packages/react/src/button/button.css
} > packages/styles/src/button/button.css

# Group file: the group rules, wrapped in the same cascade layer.
{ echo '@layer slotted.components {'
  sed -n '256,297p' packages/react/src/button/button.css
  echo '}'
} > packages/styles/src/button/button-group.css

npx prettier --write packages/styles/src/button/button.css packages/styles/src/button/button-group.css
```

Verify the split kept every rule:

```bash
grep -c 'slotted-button-group' packages/styles/src/button/button.css   # expect 0
grep -c 'slotted-button-group' packages/styles/src/button/button-group.css  # expect 9
grep -c '@layer slotted.components' packages/styles/src/button/button.css packages/styles/src/button/button-group.css  # expect 1 each
```

- [ ] **Step 2: Write the manifest**

Create `packages/styles/package.json`:

```json
{
  "name": "@slotted/styles",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": [
    "**/*.css"
  ],
  "exports": {
    "./button/button.css": "./src/button/button.css",
    "./button/button-group.css": "./src/button/button-group.css"
  },
  "scripts": {
    "test": "node --test src/button/button.styles.test.mjs",
    "typecheck": "node --check src/button/button.styles.test.mjs",
    "verify": "pnpm test && pnpm typecheck"
  }
}
```

- [ ] **Step 3: Move the style test and add the relocated assertion**

Create `packages/styles/src/button/button.styles.test.mjs` by copying `packages/react/src/button/button.styles.test.mjs` verbatim, then applying exactly two changes.

First, replace the single-file read:

```js
const css = readFileSync(new URL('./button.css', import.meta.url), 'utf8');
```

with a read of both files, so every existing assertion — including the group ones — keeps working unchanged:

```js
const css = [
  readFileSync(new URL('./button.css', import.meta.url), 'utf8'),
  readFileSync(new URL('./button-group.css', import.meta.url), 'utf8'),
].join('\n');
```

The contract path `../../../../specs/components/button/contract.json` is correct without change: `packages/styles/src/button/` is the same depth as `packages/react/src/button/`.

Second, append this test, which is the CSS assertion currently living in `packages/react/src/button/toggle-button.test.tsx` and which belongs with the stylesheet rather than in a React unit test:

```js
test('keeps pressed toggle surfaces outside generic interactive selectors', () => {
  const headers = [...css.matchAll(/\.slotted-button[^{}]*:(?:hover|active)[^{]*\{/g)].map(
    ([header]) => header,
  );

  assert.ok(headers.length >= 6, `Expected at least 6 interactive selectors, found ${headers.length}`);

  for (const pattern of [
    /data-fill='solid'[^{}]*:hover/,
    /data-fill='solid'[^{}]*:active/,
    /data-fill='outline'[^{}]*:hover/,
    /data-fill='outline'[^{}]*:active/,
    /data-fill='ghost'[^{}]*:hover/,
    /data-fill='ghost'[^{}]*:active/,
  ]) {
    assert.ok(
      headers.some((header) => pattern.test(header)),
      `Missing interactive selector matching ${pattern}`,
    );
  }

  for (const header of headers) {
    assert.match(header.replace(/\s+/g, ''), /:not\(\[data-state='pressed'\]\)/);
  }
});
```

- [ ] **Step 4: Run the style test**

```bash
node --test packages/styles/src/button/button.styles.test.mjs
```

Expected: 5 tests pass — the four copied from the React file plus the relocated one.

If `implements every contract state in framework-owned CSS` fails on a missing selector, the split dropped a rule; re-check the line ranges in Step 1.

- [ ] **Step 5: Register the package and commit**

`pnpm-workspace.yaml` already globs `packages/*`, so no edit is needed there.

```bash
pnpm install
pnpm --filter @slotted/styles verify
pnpm format:check
git add packages/styles pnpm-lock.yaml
git commit -m "feat(styles): add the shared button stylesheet package"
```

---

### Task 2: Point `@slotted/react` at the shared stylesheet

**Files:**

- Modify: `packages/react/package.json`
- Modify: `packages/react/src/button/button.tsx:1`
- Modify: `packages/react/src/button/button-group.tsx`
- Modify: `packages/react/src/button/toggle-button.test.tsx:1-33`
- Delete: `packages/react/src/button/button.css`
- Delete: `packages/react/src/button/button.styles.test.mjs`

**Interfaces:**

- Consumes: `@slotted/styles` exports `"./button/button.css"` and `"./button/button-group.css"` from Task 1.
- Produces: `packages/react/dist/styles.css` containing both the button and the group rules, unchanged in content from before this task.

- [ ] **Step 1: Write the failing test**

The build output is the contract that must not regress. Add this to `packages/react/package-boundary.verify.mjs`, immediately above the existing `if (violations.length > 0)` block:

```js
const bundledStyles = readFileSync(join(distDirectory, 'styles.css'), 'utf8');
const requiredSelectors = ['.slotted-button{', '.slotted-button-group{', '@layer slotted.components{'];
const missingSelectors = requiredSelectors.filter(
  (selector) => !bundledStyles.replace(/\s+/g, '').includes(selector),
);

if (missingSelectors.length > 0) {
  console.error('The bundled stylesheet lost required rules:');
  for (const selector of missingSelectors) console.error(`- ${selector}`);
  process.exitCode = 1;
}
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
rm -f packages/react/dist/styles.css
pnpm --filter @slotted/react exec node package-boundary.verify.mjs
```

Expected: FAIL with `ENOENT` on `dist/styles.css`, proving the check reads the real artifact.

- [ ] **Step 3: Rewire the imports**

Add the dependency to `packages/react/package.json`, in the `devDependencies` block, alphabetically before `@storybook/react-vite`:

```json
    "@slotted/styles": "workspace:*",
```

It is a development dependency, not a runtime one: Vite inlines the CSS into `dist/styles.css` at build time, so the published artifact does not resolve the specifier.

In the same file, change the `test` script from:

```json
    "test": "vitest run && node --test src/button/button.styles.test.mjs",
```

to:

```json
    "test": "vitest run",
```

In `packages/react/src/button/button.tsx`, replace line 1:

```ts
import '@slotted/styles/button/button.css';
```

In `packages/react/src/button/button-group.tsx`, add as the first line:

```ts
import '@slotted/styles/button/button-group.css';
```

In `packages/react/src/button/toggle-button.test.tsx`, delete the first `it` block — `keeps pressed toggle surfaces outside generic interactive selectors`, lines 13 through 33 — along with the now-unused `buttonCss` constant on line 10 and the `readFileSync` and `resolve` imports on lines 1 and 2. That assertion moved to the style test in Task 1.

Delete the two files the package no longer owns:

```bash
rm packages/react/src/button/button.css packages/react/src/button/button.styles.test.mjs
```

- [ ] **Step 4: Run the tests to make sure they pass**

```bash
pnpm install
pnpm --filter @slotted/react verify
```

Expected: Vitest passes, `tsc` passes, the Vite build emits `dist/styles.css`, and `package-boundary.verify.mjs` reports nothing.

Confirm the emitted stylesheet by hand:

```bash
grep -c 'slotted-button-group' packages/react/dist/styles.css   # expect 9
```

- [ ] **Step 5: Commit**

```bash
pnpm format:check
git add packages/react pnpm-lock.yaml
git commit -m "refactor(react): consume the shared button stylesheet"
```

---

### Task 3: Point `@slotted/angular` at the shared stylesheet with uniform encapsulation

Four components use emulated encapsulation with `:host` selectors; `button-group.ts` already uses `ViewEncapsulation.None`. Class selectors cannot work under emulated encapsulation, because Angular rewrites `.slotted-button` to `.slotted-button[_ngcontent-*]` while the class sits on the host element, which carries `_nghost-*` instead. `ViewEncapsulation.None` on every component is therefore required, not stylistic.

A relative `styleUrl` reaching into `packages/styles` resolves at build time and ng-packagr inlines the result into the published bundle as `styles: ["…"]`. This was verified against this repository's Angular 22 and ng-packagr 22 toolchain before this plan was written.

**Files:**

- Modify: `packages/angular/package.json`
- Modify: `packages/angular/button/src/button.ts:46`
- Modify: `packages/angular/button/src/button-link.ts:30`
- Modify: `packages/angular/button/src/icon-button.ts:39`
- Modify: `packages/angular/button/src/toggle-button.ts:33`
- Modify: `packages/angular/button/src/button-group.ts:9`
- Delete: `packages/angular/button/src/button.css`
- Delete: `packages/angular/button/src/button-group.css`
- Delete: `packages/angular/button/src/button.styles.test.mjs`

**Interfaces:**

- Consumes: the same two `@slotted/styles` files as Task 2.
- Produces: `packages/angular/dist/fesm2022/slotted-angular-button.mjs` carrying `encapsulation: i0.ViewEncapsulation.None` and class-selector CSS in every component's `styles` array.

- [ ] **Step 1: Write the failing test**

Create `packages/angular/button/src/bundle.styles.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bundle = readFileSync(
  new URL('../../dist/fesm2022/slotted-angular-button.mjs', import.meta.url),
  'utf8',
);

test('ships class-selector styles with encapsulation disabled', () => {
  assert.match(bundle, /encapsulation: i0\.ViewEncapsulation\.None/);
  assert.doesNotMatch(bundle, /styles: \["@layer slotted\.components\{:host/);
  assert.match(bundle, /styles: \["@layer slotted\.components\{\.slotted-button\{/);
  assert.match(bundle, /\.slotted-button-group\{/);
});
```

Register it in `packages/angular/package.json` by changing the `test` script from:

```json
    "test": "ng test slotted-angular --watch=false && node --test button/src/button.styles.test.mjs",
```

to:

```json
    "test": "ng test slotted-angular --watch=false && pnpm build && node --test button/src/bundle.styles.test.mjs",
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
pnpm --filter @slotted/angular exec ng build slotted-angular
pnpm --filter @slotted/angular exec node --test button/src/bundle.styles.test.mjs
```

Expected: FAIL. The bundle currently contains `styles: ["@layer slotted.components{:host{` and no `ViewEncapsulation.None` on these components.

- [ ] **Step 3: Switch every component to the shared stylesheet**

In each of `button.ts`, `button-link.ts`, `icon-button.ts`, and `toggle-button.ts`:

Add `ViewEncapsulation` to the existing `@angular/core` import list, keeping the list alphabetical — it goes last, after `input` and any other named import already present.

Replace the `styleUrl` line:

```ts
  styleUrl: '../../../styles/src/button/button.css',
```

Add an `encapsulation` line immediately after `changeDetection`:

```ts
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
```

In `button-group.ts`, which already declares `encapsulation`, change only the `styleUrl`:

```ts
  styleUrl: '../../../styles/src/button/button-group.css',
```

The path is relative to the component file: `packages/angular/button/src/` up three levels is `packages/`, then down into `styles/src/button/`.

Delete the files the package no longer owns:

```bash
rm packages/angular/button/src/button.css \
   packages/angular/button/src/button-group.css \
   packages/angular/button/src/button.styles.test.mjs
```

- [ ] **Step 4: Run the tests to make sure they pass**

```bash
pnpm --filter @slotted/angular verify
```

Expected: 63 Vitest tests pass, the ng-packagr build succeeds, and the bundle test passes.

- [ ] **Step 5: Commit**

```bash
pnpm format:check
git add packages/angular
git commit -m "refactor(angular): consume the shared button stylesheet"
```

---

### Task 4: Enforce the layer dependency rule

`packages/react/package-boundary.verify.mjs` checks one package's build artifacts for leaked Storybook dependencies. It stays as it is. This task adds a separate, repository-level check of the workspace dependency graph, which is what the spec's dependency rule requires.

**Files:**

- Create: `scripts/verify-layers.mjs`
- Create: `scripts/verify-layers.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: nothing.
- Produces: `scripts/verify-layers.mjs` exporting `LAYERS` (a `Record<string, number>`) and `layerViolations(manifests)`, where `manifests` is an array of `{ name: string, dependencies: { name: string, kind: 'dependencies' | 'devDependencies' | 'peerDependencies' }[] }` and the return value is an array of human-readable violation strings.

The rule carries one exemption. `@slotted/react` and `@slotted/angular` both declare `@slotted/storybook-workbench` — layer 4 — in `devDependencies`, and that is correct: the workbench is internal tooling that never reaches a published artifact, which `packages/react/package-boundary.verify.mjs` already asserts. Layer-4 packages are therefore permitted as development dependencies and forbidden everywhere else. Every other edge, including one framework package depending on the other, is a violation regardless of dependency kind.

- [ ] **Step 1: Write the failing test**

Create `scripts/verify-layers.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { LAYERS, layerViolations } from './verify-layers.mjs';

test('assigns every workspace package to a layer', () => {
  assert.deepEqual(LAYERS, {
    '@slotted/tokens': 1,
    '@slotted/theme-default': 1,
    '@slotted/styles': 1,
    '@slotted/core': 2,
    '@slotted/react': 3,
    '@slotted/angular': 3,
    '@slotted/testing': 4,
    '@slotted/storybook-workbench': 4,
  });
});

const dependency = (name, kind = 'dependencies') => ({ name, kind });

test('allows a package to depend on a lower layer', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/react', dependencies: [dependency('@slotted/styles', 'devDependencies')] },
    ]),
    [],
  );
});

test('rejects a dependency on the same layer, whatever its kind', () => {
  assert.deepEqual(
    layerViolations([
      {
        name: '@slotted/react',
        dependencies: [dependency('@slotted/angular', 'devDependencies')],
      },
    ]),
    ['@slotted/react (layer 3) must not depend on @slotted/angular (layer 3)'],
  );
});

test('rejects a dependency on a higher layer', () => {
  assert.deepEqual(
    layerViolations([{ name: '@slotted/core', dependencies: [dependency('@slotted/react')] }]),
    ['@slotted/core (layer 2) must not depend on @slotted/react (layer 3)'],
  );
});

test('permits layer 4 tooling as a development dependency', () => {
  assert.deepEqual(
    layerViolations([
      {
        name: '@slotted/react',
        dependencies: [dependency('@slotted/storybook-workbench', 'devDependencies')],
      },
    ]),
    [],
  );
});

test('rejects layer 4 tooling as a shipped dependency', () => {
  assert.deepEqual(
    layerViolations([
      {
        name: '@slotted/react',
        dependencies: [dependency('@slotted/storybook-workbench', 'dependencies')],
      },
    ]),
    ['@slotted/react (layer 3) must not depend on @slotted/storybook-workbench (layer 4)'],
  );
});

test('ignores packages outside the layer map, such as apps', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/storybook-react', dependencies: [dependency('@slotted/react')] },
    ]),
    [],
  );
});

test('ignores dependencies outside the layer map, such as react', () => {
  assert.deepEqual(
    layerViolations([{ name: '@slotted/core', dependencies: [dependency('react')] }]),
    [],
  );
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
node --test scripts/verify-layers.test.mjs
```

Expected: FAIL with `Cannot find module` for `./verify-layers.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/verify-layers.mjs`:

```js
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const LAYERS = {
  '@slotted/tokens': 1,
  '@slotted/theme-default': 1,
  '@slotted/styles': 1,
  '@slotted/core': 2,
  '@slotted/react': 3,
  '@slotted/angular': 3,
  '@slotted/testing': 4,
  '@slotted/storybook-workbench': 4,
};

const TOOLING_LAYER = 4;

export function layerViolations(manifests) {
  return manifests.flatMap((manifest) => {
    const layer = LAYERS[manifest.name];
    if (layer === undefined) return [];

    return manifest.dependencies.flatMap((dependency) => {
      const dependencyLayer = LAYERS[dependency.name];
      if (dependencyLayer === undefined || dependencyLayer < layer) return [];

      const isInternalTooling =
        dependencyLayer === TOOLING_LAYER && dependency.kind === 'devDependencies';
      if (isInternalTooling) return [];

      return [
        `${manifest.name} (layer ${layer}) must not depend on ${dependency.name} (layer ${dependencyLayer})`,
      ];
    });
  });
}

function readManifests(roots) {
  return roots.flatMap((root) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const manifestPath = join(root, entry.name, 'package.json');
        if (!existsSync(manifestPath)) return readManifests([join(root, entry.name)]);

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const kinds = ['dependencies', 'devDependencies', 'peerDependencies'];
        return [
          {
            name: manifest.name,
            dependencies: kinds.flatMap((kind) =>
              Object.keys(manifest[kind] ?? {}).map((name) => ({ name, kind })),
            ),
          },
        ];
      }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
  const violations = layerViolations(
    readManifests([join(repositoryRoot, 'packages'), join(repositoryRoot, 'apps')]),
  );

  if (violations.length > 0) {
    console.error('Layer dependency rule violated:');
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
  }
}
```

`readManifests` recurses one level when a directory has no manifest of its own, which is what `packages/themes/` requires.

- [ ] **Step 4: Run the tests to make sure they pass**

```bash
node --test scripts/verify-layers.test.mjs
node scripts/verify-layers.mjs
```

Expected: 8 tests pass, and the script prints nothing and exits `0` against the real workspace.

If the script reports a violation against the real workspace, stop and raise it rather than widening the exemption. The only edge this repository is known to carry that reaches layer 4 is `@slotted/storybook-workbench` in the `devDependencies` of both framework packages, which the tooling exemption covers by design.

- [ ] **Step 5: Wire it into the root gate and commit**

In `package.json`, change:

```json
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:contracts",
```

to:

```json
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:contracts && pnpm test:layers",
```

and add, immediately after the `test:contracts` line:

```json
    "test:layers": "node --test scripts/verify-layers.test.mjs && node scripts/verify-layers.mjs",
```

```bash
pnpm check:full
git add scripts package.json
git commit -m "test: enforce the layer dependency rule"
```

---

## Verification

After Task 4, all of the following hold:

- `pnpm check:full` passes.
- Exactly one authored `button.css` exists: `find packages -name 'button*.css' -not -path '*/node_modules/*' -not -path '*/dist/*'` lists only the two files under `packages/styles/src/button/`.
- No library CSS uses `:host`: `grep -rn ':host' packages/styles packages/angular/button/src` returns nothing.
- `packages/react/dist/styles.css` contains both `.slotted-button` and `.slotted-button-group` rules.
- The Angular bundle carries `encapsulation: i0.ViewEncapsulation.None` and class-selector styles.
- One style test file exists for the button family, not two.
- Adding `"@slotted/angular": "workspace:*"` to any dependency block of `packages/react/package.json` makes `pnpm test:layers` fail; removing it makes the check pass again.

## Known Follow-On

`packages/styles/src/button/button.styles.test.mjs` asserts `:not([data-state='pressed'])`. The next plan replaces `data-state` with independent boolean attributes and updates that assertion. Leave it as written here.
