# Button Contract, Tokens, and Default Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the private Button contract, CSS token contract, deterministic theme validation, and the first A+B default theme as independently buildable workspace packages.

**Architecture:** A small JSON token contract classifies variables as base, scheme, or density values. The default theme implements every required token; repository-owned Node scripts validate the theme and emit static CSS without adding a token-platform dependency.

**Tech Stack:** Node.js 24 ESM, JSON, CSS custom properties, Node test runner, pnpm workspaces, Turborepo.

---

## Files

- Create: `specs/components/button/contract.json`
- Create: `specs/components/button/README.md`
- Create: `packages/tokens/package.json`
- Create: `packages/tokens/src/contract.json`
- Create: `packages/tokens/src/validate-theme.mjs`
- Create: `packages/tokens/scripts/build.mjs`
- Create: `packages/tokens/test/validate-theme.test.mjs`
- Create: `packages/themes/default/package.json`
- Create: `packages/themes/default/src/theme.json`
- Create: `packages/themes/default/scripts/build-theme.mjs`
- Create: `packages/themes/default/test/build-theme.test.mjs`
- Modify: `pnpm-workspace.yaml`

### Task 1: Define the Current Button Contract

- [ ] **Step 1: Create the machine-readable contract**

Create `specs/components/button/contract.json`:

```json
{
  "component": "button",
  "nativeElement": "button",
  "defaults": {
    "variant": "solid",
    "tone": "accent",
    "size": "md",
    "type": "button"
  },
  "axes": {
    "variant": ["solid", "outline", "ghost"],
    "tone": ["accent", "neutral", "danger"],
    "size": ["sm", "md", "lg"]
  },
  "states": ["default", "hover", "active", "focus-visible", "disabled"],
  "parts": ["leading", "label", "trailing"],
  "stories": [
    "overview",
    "variants",
    "tones",
    "sizes",
    "states",
    "content",
    "densities",
    "schemes",
    "accessibility"
  ]
}
```

- [ ] **Step 2: Create the human contract**

Create `specs/components/button/README.md`:

```markdown
# Button Contract

## Purpose

Button performs an immediate action. Navigation belongs to the future LinkButton family member, and pressed state belongs to ToggleButton.

## Invariants

- Render a native `button` in both frameworks.
- Default `type` to `button`; preserve explicit `submit` and `reset`.
- Preserve native attributes, events, focus, disabled behavior, and accessible naming.
- Use logical leading and trailing parts rather than left and right.
- Keep React and Angular semantics and visual axes equivalent without sharing runtime code.

## Implemented Slice

The implemented slice is the exact machine-readable surface in `contract.json`.

## Accessibility

Visible text supplies the accessible name. Icon-only usage is not part of this slice; future IconButton requires an explicit accessible name. Disabled uses the native disabled state. Focus is shown only for `:focus-visible`.

## Theme Contract

Button consumes public `--slotted-*` custom properties. Internal classes are private.

## Capability Horizon

Future slices may add loading, icon-only actions, full-width layout, RTL hardening, forced colors, LinkButton, ToggleButton, ButtonGroup, SplitButton, and composed menu actions. This list is non-normative and is not an implementation backlog.

## Contract Escape Hatch

`contract.json` exists only while at least two deterministic checks consume it usefully. It is not a runtime or published API and may evolve with the component.

After the third component is implemented, review whether structured JSON is reducing real cross-framework drift. If fewer than two useful deterministic checks still consume it, remove the format before it becomes a repository convention.
```

- [ ] **Step 3: Validate and commit the contract**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('specs/components/button/contract.json', 'utf8')); console.log('button contract: valid JSON')"
git diff --check
git add specs/components/button
git commit -m "docs: define initial button contract"
```

Expected: `button contract: valid JSON`, no whitespace errors, and one documentation commit.

### Task 2: Test-Drive Theme Contract Validation

- [ ] **Step 1: Register current and future package roots before installing nested themes**

Replace `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - packages/themes/*
```

- [ ] **Step 2: Create the tokens package manifest**

Create `packages/tokens/package.json`:

```json
{
  "name": "@slotted/tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./contract.json": "./src/contract.json",
    "./validate-theme": "./src/validate-theme.mjs",
    "./styles.css": "./dist/styles.css"
  },
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "node --test",
    "typecheck": "node --check src/validate-theme.mjs && node --check scripts/build.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm build"
  }
}
```

- [ ] **Step 3: Create the token contract**

Create `packages/tokens/src/contract.json`:

```json
{
  "schemaVersion": 1,
  "base": [
    "--slotted-control-font-family",
    "--slotted-control-font-weight",
    "--slotted-control-border-width",
    "--slotted-control-radius",
    "--slotted-control-transition-duration",
    "--slotted-control-transition-easing",
    "--slotted-focus-ring-width",
    "--slotted-focus-ring-offset",
    "--slotted-button-gap",
    "--slotted-button-icon-size",
    "--slotted-button-ghost-text-decoration"
  ],
  "scheme": [
    "--slotted-focus-ring-color",
    "--slotted-button-outline-background",
    "--slotted-button-ghost-background",
    "--slotted-disabled-background",
    "--slotted-disabled-foreground",
    "--slotted-disabled-border",
    "--slotted-tone-accent-solid",
    "--slotted-tone-accent-solid-hover",
    "--slotted-tone-accent-solid-active",
    "--slotted-tone-accent-on-solid",
    "--slotted-tone-accent-border",
    "--slotted-tone-accent-text",
    "--slotted-tone-accent-subtle-hover",
    "--slotted-tone-accent-subtle-active",
    "--slotted-tone-neutral-solid",
    "--slotted-tone-neutral-solid-hover",
    "--slotted-tone-neutral-solid-active",
    "--slotted-tone-neutral-on-solid",
    "--slotted-tone-neutral-border",
    "--slotted-tone-neutral-text",
    "--slotted-tone-neutral-subtle-hover",
    "--slotted-tone-neutral-subtle-active",
    "--slotted-tone-danger-solid",
    "--slotted-tone-danger-solid-hover",
    "--slotted-tone-danger-solid-active",
    "--slotted-tone-danger-on-solid",
    "--slotted-tone-danger-border",
    "--slotted-tone-danger-text",
    "--slotted-tone-danger-subtle-hover",
    "--slotted-tone-danger-subtle-active"
  ],
  "density": [
    "--slotted-button-height-sm",
    "--slotted-button-height-md",
    "--slotted-button-height-lg",
    "--slotted-button-padding-inline-sm",
    "--slotted-button-padding-inline-md",
    "--slotted-button-padding-inline-lg",
    "--slotted-button-font-size-sm",
    "--slotted-button-font-size-md",
    "--slotted-button-font-size-lg"
  ],
  "requiredSchemes": ["light", "dark"],
  "requiredDensities": ["comfortable", "compact"]
}
```

- [ ] **Step 4: Write the failing validator tests**

Create `packages/tokens/test/validate-theme.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { validateTheme } from '../src/validate-theme.mjs';

const contract = {
  base: ['--base'],
  scheme: ['--scheme'],
  density: ['--density'],
  requiredSchemes: ['light', 'dark'],
  requiredDensities: ['comfortable', 'compact'],
};

const validTheme = {
  name: 'test',
  base: { '--base': '1px' },
  schemes: {
    light: { '--scheme': '#fff' },
    dark: { '--scheme': '#000' },
  },
  densities: {
    comfortable: { '--density': '2rem' },
    compact: { '--density': '1.5rem' },
  },
};

test('accepts a complete theme', () => {
  assert.deepEqual(validateTheme(contract, validTheme), []);
});

test('reports missing tokens with their scope', () => {
  const invalid = structuredClone(validTheme);
  delete invalid.schemes.dark['--scheme'];
  assert.deepEqual(validateTheme(contract, invalid), [
    'scheme dark is missing --scheme',
  ]);
});

test('reports unknown tokens', () => {
  const invalid = structuredClone(validTheme);
  invalid.base['--unknown'] = 'value';
  assert.deepEqual(validateTheme(contract, invalid), [
    'base contains unknown token --unknown',
  ]);
});
```

- [ ] **Step 5: Run the failing test**

```bash
node --test packages/tokens/test/validate-theme.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/validate-theme.mjs`.

- [ ] **Step 6: Implement the validator**

Create `packages/tokens/src/validate-theme.mjs`:

```js
function checkTokenMap(errors, label, expectedNames, values) {
  const expected = new Set(expectedNames);
  const actual = values ?? {};

  for (const name of expectedNames) {
    if (!(name in actual)) errors.push(`${label} is missing ${name}`);
  }

  for (const name of Object.keys(actual)) {
    if (!expected.has(name)) errors.push(`${label} contains unknown token ${name}`);
  }
}

export function validateTheme(contract, theme) {
  const errors = [];
  checkTokenMap(errors, 'base', contract.base, theme.base);

  for (const scheme of contract.requiredSchemes) {
    checkTokenMap(errors, `scheme ${scheme}`, contract.scheme, theme.schemes?.[scheme]);
  }

  for (const density of contract.requiredDensities) {
    checkTokenMap(errors, `density ${density}`, contract.density, theme.densities?.[density]);
  }

  return errors;
}

export function assertValidTheme(contract, theme) {
  const errors = validateTheme(contract, theme);
  if (errors.length > 0) {
    throw new Error(`Invalid theme:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}
```

- [ ] **Step 7: Add the deterministic token build**

Create `packages/tokens/scripts/build.mjs`:

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const contractUrl = new URL('../src/contract.json', import.meta.url);
const distUrl = new URL('../dist/', import.meta.url);
const contract = JSON.parse(await readFile(contractUrl, 'utf8'));
const allNames = [...contract.base, ...contract.scheme, ...contract.density];

if (new Set(allNames).size !== allNames.length) {
  throw new Error('Token contract contains duplicate names');
}

await mkdir(distUrl, { recursive: true });
await writeFile(new URL('contract.json', distUrl), `${JSON.stringify(contract, null, 2)}\n`);
await writeFile(
  new URL('styles.css', distUrl),
  '@layer slotted.tokens, slotted.theme, slotted.components, slotted.overrides;\n',
);
```

- [ ] **Step 8: Install, verify, and commit the tokens package**

```bash
pnpm install
pnpm --dir packages/tokens verify
git add packages/tokens pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: add token contract validation"
```

Expected: 3 tests pass, syntax checks exit `0`, and `dist/contract.json` plus `dist/styles.css` are emitted but ignored by Git.

### Task 3: Test-Drive the Default Theme Build

- [ ] **Step 1: Create the default-theme package**

Create `packages/themes/default/package.json`:

```json
{
  "name": "@slotted/theme-default",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./styles.css": "./dist/styles.css"
  },
  "scripts": {
    "build": "node scripts/build-theme.mjs",
    "test": "node --test",
    "typecheck": "node --check scripts/build-theme.mjs",
    "verify": "pnpm test && pnpm typecheck && pnpm build"
  },
  "dependencies": {
    "@slotted/tokens": "workspace:*"
  }
}
```

- [ ] **Step 2: Create the complete default-theme data**

Create `packages/themes/default/src/theme.json`. The key sets must exactly match `packages/tokens/src/contract.json`:

```json
{
  "name": "default",
  "base": {
    "--slotted-control-font-family": "ui-sans-serif, system-ui, sans-serif",
    "--slotted-control-font-weight": "600",
    "--slotted-control-border-width": "1px",
    "--slotted-control-radius": "4px",
    "--slotted-control-transition-duration": "120ms",
    "--slotted-control-transition-easing": "cubic-bezier(0.2, 0, 0, 1)",
    "--slotted-focus-ring-width": "2px",
    "--slotted-focus-ring-offset": "2px",
    "--slotted-button-gap": "0.5rem",
    "--slotted-button-icon-size": "1em",
    "--slotted-button-ghost-text-decoration": "none"
  },
  "schemes": {
    "light": {
      "--slotted-focus-ring-color": "#2563eb",
      "--slotted-button-outline-background": "#ffffff",
      "--slotted-button-ghost-background": "transparent",
      "--slotted-disabled-background": "#e2e8f0",
      "--slotted-disabled-foreground": "#64748b",
      "--slotted-disabled-border": "#cbd5e1",
      "--slotted-tone-accent-solid": "#1d4ed8",
      "--slotted-tone-accent-solid-hover": "#1e40af",
      "--slotted-tone-accent-solid-active": "#1e3a8a",
      "--slotted-tone-accent-on-solid": "#ffffff",
      "--slotted-tone-accent-border": "#2563eb",
      "--slotted-tone-accent-text": "#1d4ed8",
      "--slotted-tone-accent-subtle-hover": "#dbeafe",
      "--slotted-tone-accent-subtle-active": "#bfdbfe",
      "--slotted-tone-neutral-solid": "#0f172a",
      "--slotted-tone-neutral-solid-hover": "#1e293b",
      "--slotted-tone-neutral-solid-active": "#020617",
      "--slotted-tone-neutral-on-solid": "#ffffff",
      "--slotted-tone-neutral-border": "#94a3b8",
      "--slotted-tone-neutral-text": "#172033",
      "--slotted-tone-neutral-subtle-hover": "#e2e8f0",
      "--slotted-tone-neutral-subtle-active": "#cbd5e1",
      "--slotted-tone-danger-solid": "#dc2626",
      "--slotted-tone-danger-solid-hover": "#b91c1c",
      "--slotted-tone-danger-solid-active": "#991b1b",
      "--slotted-tone-danger-on-solid": "#ffffff",
      "--slotted-tone-danger-border": "#dc2626",
      "--slotted-tone-danger-text": "#b91c1c",
      "--slotted-tone-danger-subtle-hover": "#fee2e2",
      "--slotted-tone-danger-subtle-active": "#fecaca"
    },
    "dark": {
      "--slotted-focus-ring-color": "#60a5fa",
      "--slotted-button-outline-background": "#111827",
      "--slotted-button-ghost-background": "transparent",
      "--slotted-disabled-background": "#1f2937",
      "--slotted-disabled-foreground": "#94a3b8",
      "--slotted-disabled-border": "#475569",
      "--slotted-tone-accent-solid": "#3b82f6",
      "--slotted-tone-accent-solid-hover": "#60a5fa",
      "--slotted-tone-accent-solid-active": "#2563eb",
      "--slotted-tone-accent-on-solid": "#081426",
      "--slotted-tone-accent-border": "#60a5fa",
      "--slotted-tone-accent-text": "#93c5fd",
      "--slotted-tone-accent-subtle-hover": "#172554",
      "--slotted-tone-accent-subtle-active": "#1e3a8a",
      "--slotted-tone-neutral-solid": "#f8fafc",
      "--slotted-tone-neutral-solid-hover": "#e2e8f0",
      "--slotted-tone-neutral-solid-active": "#cbd5e1",
      "--slotted-tone-neutral-on-solid": "#0f172a",
      "--slotted-tone-neutral-border": "#64748b",
      "--slotted-tone-neutral-text": "#f8fafc",
      "--slotted-tone-neutral-subtle-hover": "#1f2937",
      "--slotted-tone-neutral-subtle-active": "#334155",
      "--slotted-tone-danger-solid": "#ef4444",
      "--slotted-tone-danger-solid-hover": "#f87171",
      "--slotted-tone-danger-solid-active": "#dc2626",
      "--slotted-tone-danger-on-solid": "#ffffff",
      "--slotted-tone-danger-border": "#f87171",
      "--slotted-tone-danger-text": "#fca5a5",
      "--slotted-tone-danger-subtle-hover": "#450a0a",
      "--slotted-tone-danger-subtle-active": "#7f1d1d"
    }
  },
  "densities": {
    "comfortable": {
      "--slotted-button-height-sm": "30px",
      "--slotted-button-height-md": "34px",
      "--slotted-button-height-lg": "38px",
      "--slotted-button-padding-inline-sm": "10px",
      "--slotted-button-padding-inline-md": "13px",
      "--slotted-button-padding-inline-lg": "16px",
      "--slotted-button-font-size-sm": "12px",
      "--slotted-button-font-size-md": "13px",
      "--slotted-button-font-size-lg": "14px"
    },
    "compact": {
      "--slotted-button-height-sm": "26px",
      "--slotted-button-height-md": "28px",
      "--slotted-button-height-lg": "32px",
      "--slotted-button-padding-inline-sm": "8px",
      "--slotted-button-padding-inline-md": "10px",
      "--slotted-button-padding-inline-lg": "12px",
      "--slotted-button-font-size-sm": "12px",
      "--slotted-button-font-size-md": "12px",
      "--slotted-button-font-size-lg": "13px"
    }
  }
}
```

- [ ] **Step 3: Write and run the failing CSS-rendering test**

Create `packages/themes/default/test/build-theme.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderThemeCss } from '../scripts/build-theme.mjs';

test('renders independent theme, scheme, and density scopes', () => {
  const css = renderThemeCss(
    { base: ['--base'], scheme: ['--scheme'], density: ['--density'] },
    {
      name: 'test',
      base: { '--base': '1px' },
      schemes: { light: { '--scheme': '#fff' } },
      densities: { compact: { '--density': '2rem' } },
    },
  );

  assert.match(css, /data-slotted-theme="test"/);
  assert.match(css, /data-slotted-scheme="light"/);
  assert.match(css, /data-slotted-density="compact"/);
  assert.match(css, /--scheme: #fff/);
});
```

Run:

```bash
node --test packages/themes/default/test/build-theme.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/build-theme.mjs`.

- [ ] **Step 4: Implement the renderer and build entrypoint**

Create `packages/themes/default/scripts/build-theme.mjs`:

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { assertValidTheme } from '@slotted/tokens/validate-theme';

function declarations(names, values) {
  return names.map((name) => `    ${name}: ${values[name]};`).join('\n');
}

export function renderThemeCss(contract, theme) {
  const blocks = [
    `  [data-slotted-theme="${theme.name}"] {\n${declarations(contract.base, theme.base)}\n  }`,
  ];

  for (const [scheme, values] of Object.entries(theme.schemes)) {
    blocks.push(
      `  [data-slotted-theme="${theme.name}"][data-slotted-scheme="${scheme}"],\n` +
        `  [data-slotted-theme="${theme.name}"] [data-slotted-scheme="${scheme}"] {\n` +
        `${declarations(contract.scheme, values)}\n  }`,
    );
  }

  for (const [density, values] of Object.entries(theme.densities)) {
    blocks.push(
      `  [data-slotted-theme="${theme.name}"][data-slotted-density="${density}"],\n` +
        `  [data-slotted-theme="${theme.name}"] [data-slotted-density="${density}"] {\n` +
        `${declarations(contract.density, values)}\n  }`,
    );
  }

  return `@layer slotted.theme {\n${blocks.join('\n\n')}\n}\n`;
}

async function build() {
  const contract = JSON.parse(
    await readFile(new URL('../../../tokens/src/contract.json', import.meta.url), 'utf8'),
  );
  const theme = JSON.parse(
    await readFile(new URL('../src/theme.json', import.meta.url), 'utf8'),
  );
  assertValidTheme(contract, theme);
  const distUrl = new URL('../dist/', import.meta.url);
  await mkdir(distUrl, { recursive: true });
  await writeFile(new URL('styles.css', distUrl), renderThemeCss(contract, theme));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
}
```

- [ ] **Step 5: Verify and commit the default theme**

```bash
pnpm install
pnpm --dir packages/themes/default verify
git add packages/themes/default pnpm-lock.yaml
git commit -m "feat: add default theme product"
```

Expected: 1 test passes; the theme validator accepts every required light, dark, comfortable, and compact value; `dist/styles.css` is ignored.

### Task 4: Verify the Workspace Boundary

- [ ] **Step 1: Confirm workspace discovery remains exact**

Confirm `pnpm-workspace.yaml` is:

```yaml
packages:
  - apps/*
  - packages/*
  - packages/themes/*
```

- [ ] **Step 2: Run filtered verification**

```bash
pnpm install
pnpm --filter @slotted/tokens verify
pnpm --filter @slotted/theme-default verify
pnpm check:affected
git diff --check
```

Expected: token tests report 3 passing tests, theme tests report 1 passing test, both builds emit ignored `dist/` artifacts, and affected checks exit `0`.

- [ ] **Step 3: Verify the plan boundary**

```bash
pnpm --filter @slotted/tokens verify
pnpm --filter @slotted/theme-default verify
git log --oneline -4
git status --short
```

Expected: all checks exit `0`; the contract, token validator/workspace, and theme commits are visible; the worktree is clean.

Stop here. Plan 1 has delivered independently testable token and theme packages. Begin Plan 2 only in a new execution checkpoint.
