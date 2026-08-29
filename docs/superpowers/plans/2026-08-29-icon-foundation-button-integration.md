# Icon Foundation and Button Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-authored Storybook icons with tree-shakeable Lucide integrations while preserving a vendor-neutral Button API in React and Angular.

**Architecture:** React stories consume named `lucide-react` components. Angular stories consume named `@ng-icons/lucide` data through `@ng-icons/core`, registering only the icons used by each story module. Button slots own layout, inherited sizing, and color but never import or resolve icon assets.

**Tech Stack:** React 19, Angular 22, Storybook 10, Lucide 1, ng-icons 35, CSS, Vitest, Node test runner, pnpm.

---

### Task 1: Lock the icon dependencies and rejection contracts

**Files:**
- Modify: `packages/react/package.json`
- Modify: `packages/angular/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/storybook-workbench/src/workbench.styles.test.mjs`
- Modify: `packages/react/src/button/button.stories.test.ts`
- Modify: `packages/angular/button/src/button.stories.spec.ts`

- [ ] **Step 1: Write the failing source contracts**

Replace the workbench icon-catalog assertion with a rejection assertion:

```js
test('workbench does not own icon glyph data', () => {
  assert.doesNotMatch(css, /slotted-demo-icon|mask-image:\s*url\(["']data:image\/svg\+xml/);
});
```

Update React story assertions to require a Lucide SVG instead of `.slotted-demo-icon`:

```ts
expect(iconButton.querySelector('svg.lucide[aria-hidden="true"]')).not.toBeNull();
expect(container.querySelector('svg.lucide-chevron-down')).not.toBeNull();
```

Update Angular template assertions to require registered `ng-icon` elements:

```ts
expect(iconButton.querySelector('ng-icon[name][aria-hidden="true"]')).not.toBeNull();
expect(group?.querySelector('ng-icon[name="lucideChevronDown"]')).not.toBeNull();
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
pnpm --filter @slotted/storybook-workbench test
pnpm --filter @slotted/react test
pnpm --filter @slotted/angular test
```

Expected: failures identify the remaining CSS-mask icon catalog and story markup.

- [ ] **Step 3: Add development-only dependencies**

Add these exact entries without changing runtime or peer dependencies:

```json
// packages/react/package.json devDependencies
"lucide-react": "1.24.0"

// packages/angular/package.json devDependencies
"@ng-icons/core": "35.0.1",
"@ng-icons/lucide": "35.0.1"
```

Run `pnpm install --lockfile-only` to update `pnpm-lock.yaml`, followed by `pnpm install --offline` if the workspace links are not yet materialized.

### Task 2: Replace React demonstration glyphs

**Files:**
- Modify: `packages/react/src/button/button-family.stories.tsx`
- Modify: `packages/react/src/button/button-group.stories.tsx`
- Modify: `packages/react/src/button/button.stories.tsx`
- Modify: `packages/react/src/button/button-link.stories.tsx`
- Modify: `packages/react/src/button/icon-button.stories.tsx`
- Modify: `packages/react/src/button/button.docs.ts`

- [ ] **Step 1: Import only named Lucide icons**

Use named imports for the exact glyphs referenced by each file. The complete set across the Button stories is:

```ts
import {
  ChevronDown,
  ExternalLink,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react';
```

Do not import `icons`, `createLucideIcon`, a wildcard namespace, or the dynamic icon component.

- [ ] **Step 2: Replace local glyph data with upstream components**

Where a name-based helper keeps a dense story readable, map only the imported components:

```tsx
const demoIcons = {
  'chevron-down': ChevronDown,
  plus: Plus,
  redo: Redo2,
  save: Save,
  trash: Trash2,
  undo: Undo2,
} as const;

function DemoIcon({ name }: { name: keyof typeof demoIcons }) {
  const Icon = demoIcons[name];
  return <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />;
}
```

For single-icon files, render the named component directly with the same decorative props. Preserve existing labels, Button props, group geometry, and Storybook scenario structure.

- [ ] **Step 3: Make copied React snippets concrete**

Replace placeholder component names such as `SaveIcon`, `CloseIcon`, and `MoreIcon` with Lucide names (`Save`, `X`, and `ChevronDown`) and include the corresponding import in each snippet where the snippet format permits TypeScript. Keep icons decorative because visible text or the parent `aria-label` supplies the accessible name.

- [ ] **Step 4: Run React tests**

Run `pnpm --filter @slotted/react test`.

Expected: all Vitest and CSS contract tests pass, and no story contains `.slotted-demo-icon`.

### Task 3: Replace Angular demonstration glyphs

**Files:**
- Modify: `packages/angular/button/src/button-family.stories.ts`
- Modify: `packages/angular/button/src/button-group.stories.ts`
- Modify: `packages/angular/button/src/button.stories.ts`
- Modify: `packages/angular/button/src/button-link.stories.ts`
- Modify: `packages/angular/button/src/icon-button.stories.ts`
- Modify: `packages/angular/button/src/button.docs.ts`

- [ ] **Step 1: Register only the icons used by each story module**

Import `NgIcon` and `provideIcons` from `@ng-icons/core`, and named constants from `@ng-icons/lucide`:

```ts
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideExternalLink,
  lucidePlus,
  lucideRedo2,
  lucideSave,
  lucideTrash2,
  lucideUndo2,
} from '@ng-icons/lucide';
```

Add `NgIcon` to `moduleMetadata({ imports: [...] })` and add `provideIcons({ ...onlyIconsUsedByThisFile })` to that decorator's providers. Do not register the whole package and do not use wildcard imports.

- [ ] **Step 2: Replace CSS-mask spans with `ng-icon`**

Use the existing projection marker on the `ng-icon` host when necessary:

```html
<ng-icon slButtonLeading name="lucideSave" aria-hidden="true"></ng-icon>
<ng-icon slButtonTrailing name="lucideChevronDown" aria-hidden="true"></ng-icon>
<button slIconButton aria-label="Undo">
  <ng-icon name="lucideUndo2" aria-hidden="true"></ng-icon>
</button>
```

Preserve the existing Button, ButtonGroup, SplitAction, and accessibility attributes.

- [ ] **Step 3: Make copied Angular snippets concrete**

Replace placeholder elements such as `app-save-icon`, `app-close-icon`, and `app-more-icon` with registered `ng-icon` markup using `lucideSave`, `lucideX`, and `lucideChevronDown`. Keep the snippets valid Angular templates and rely on the page guidance for `provideIcons` registration.

- [ ] **Step 4: Run Angular tests**

Run `pnpm --filter @slotted/angular test`.

Expected: all Vitest and CSS contract tests pass; templates contain only explicitly named `ng-icon` elements.

### Task 4: Remove the hand-authored catalog and harden slot compatibility

**Files:**
- Modify: `packages/storybook-workbench/src/workbench.css`
- Modify: `packages/react/src/button/button.css`
- Modify: `packages/angular/button/src/button.css`
- Modify: `packages/react/src/button/button.styles.test.mjs`
- Modify: `packages/angular/button/src/button.styles.test.mjs`

- [ ] **Step 1: Delete repository-owned glyph CSS**

Remove `.slotted-demo-icon` and every `[data-icon='...']` mask rule from `workbench.css`. Do not replace them with copied SVG, background images, icon fonts, or a new glyph registry.

- [ ] **Step 2: Write the slot-sizing contract**

Extend the existing icon-slot CSS assertions to require inherited sizing and color neutrality:

```js
assert.match(
  css,
  /\[data-part='icon'\],[\s\S]*?font-size:\s*var\(--_button-icon-size\)[\s\S]*?line-height:\s*1/,
);
assert.doesNotMatch(css, /\[data-part='icon'\][\s\S]*?(?:fill|stroke):/);
```

- [ ] **Step 3: Implement library-neutral sizing**

Add `font-size: var(--_button-icon-size);` and `line-height: 1;` to the existing leading, trailing, and icon part rule in both framework stylesheets. Retain the direct-SVG `block-size: 100%`, `inline-size: 100%`, and `display: block` rule. Do not add Lucide or ng-icons selectors to public component CSS.

- [ ] **Step 4: Run the workbench and framework checks**

Run:

```bash
pnpm --filter @slotted/storybook-workbench verify
pnpm --filter @slotted/react verify
pnpm --filter @slotted/angular verify
```

Expected: all package tests, typechecks, and builds pass.

### Task 5: Verify documentation pipelines and repository contracts

**Files:**
- Verify only: `apps/storybook-react`
- Verify only: `apps/storybook-angular`
- Verify only: repository dependency graph and lockfile

- [ ] **Step 1: Run affected checks**

Run `pnpm check:affected`.

Expected: all changed packages and dependents pass formatting, linting, typechecking, tests, contracts, and builds.

- [ ] **Step 2: Build both static Storybooks**

Run:

```bash
pnpm --filter @slotted/storybook-react build:storybook
pnpm --filter @slotted/storybook-angular build:storybook
```

Expected: both Storybook builds complete without unresolved icon imports or Angular provider errors.

- [ ] **Step 3: Audit forbidden patterns and package boundaries**

Run:

```bash
rg -n "slotted-demo-icon|mask-image:.*data:image/svg|import \* as .*lucide|from '@lucide/angular'" packages apps
```

Expected: no matches. Confirm `lucide-react`, `@ng-icons/core`, and `@ng-icons/lucide` appear only in development dependencies and Storybook/example sources.

- [ ] **Step 4: Commit the coherent change**

Stage only the spec, plan, manifests, lockfile, Button story/docs/test/style files, and workbench CSS/test files changed by this plan. Commit with:

```bash
git commit -m "fix(storybook): adopt Lucide icon foundation"
```
