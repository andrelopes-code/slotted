# Button Family and Storybook Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete first Button-family slice in native React and Angular, backed by first-class theme tokens and two visually coherent internal Storybooks.

**Architecture:** A private machine-readable contract owns cross-framework facts while React and Angular keep independent native runtimes and framework-owned CSS. A private `@slotted/storybook-workbench` package shares Storybook manager theming, Docs primitives, scenario metadata, snippet validation, and preview styles without leaking into published component entry points.

**Tech Stack:** pnpm 11, Turborepo 2, TypeScript 6, React 19, Angular 22, Storybook 10, Vite 8, Vitest 4, Testing Library, ng-packagr, CSS custom properties, Prettier 3.

---

## Execution policy

- Execute one numbered task through its commit before changing subsystem.
- Checkbox steps are small implementation actions, not human review gates. Continue within a task while the expected failure or success is understood.
- Use focused package tests during red/green work. Do not run both Storybook builds after every edit.
- Do not use Playwright, screenshots, Chromatic, or an agent-authored visual verdict.
- Do not implement Storybook composition, GitHub Pages, public documentation, or npm publication.
- Stop for human visual review only in Task 17, after deterministic integration checks pass and both servers are reachable.
- Time targets are diagnostic rather than hard failure rules. Split a task only when evidence reveals an independent behavior or repeated attempts stop producing new information.
- Preserve unrelated user changes. Every commit command stages only the files named by its task.

Suggested run boundaries are soft dependency boundaries, not timeouts:

| Run | Tasks | Result |
| --- | --- | --- |
| A | 1–2 | stable contract and complete default theme |
| B | 3–7 | verified React family |
| C | 8–12 | verified Angular family |
| D | 13–14 | private workbench foundation |
| E | 15 | React Storybook adoption and static build |
| F | 16 | Angular Storybook adoption and static build |
| G | 17 | integration and one human visual review |

An executor may stop cleanly after any committed task. It should not add reviewer passes between checkbox steps or rerun full-repository gates before Run G.

## Dependency order

```text
contract ──> tokens/default theme ──> React family ─────┐
                               └───> Angular family ────┼──> shared workbench ──> stories/docs ──> integration
                                                       ┘
```

React and Angular tasks can be implemented independently after Task 2, but this plan keeps them sequential to avoid concurrent edits to the shared worktree and component contract.

## File map

### Shared contract and themes

- Modify `package.json` — add the fast contract-test command to the root check.
- Modify `specs/components/button/contract.json` — canonical family members, axes, defaults, capabilities, states, parts, and required scenario IDs.
- Create `specs/components/button/contract.test.mjs` — semantic validation of the private contract.
- Modify `specs/components/button/README.md` — normative semantic and extension guidance.
- Modify `packages/tokens/src/contract.json` — public Button-family theme token names.
- Modify `packages/themes/default/src/theme.json` — complete values for both schemes and densities.
- Create `packages/themes/default/test/contrast.test.mjs` — deterministic solid-tone contrast assertions.

### React family

- Modify `packages/react/src/button/button.constants.ts` — shared axes and defaults.
- Modify `packages/react/src/button/button.types.ts` — public React family types.
- Create `packages/react/src/button/button-content.tsx` — labeled and loading content layers.
- Create `packages/react/src/button/button-root.ts` — class, state, data-attribute, and blocked-event helpers.
- Modify `packages/react/src/button/button.tsx` — action Button, full width, and controlled loading.
- Create `packages/react/src/button/button-link.tsx` — native-anchor and router-adapter navigation.
- Create `packages/react/src/button/icon-button.tsx` — accessible icon-only action.
- Create `packages/react/src/button/toggle-button.tsx` — controlled pressed action.
- Create `packages/react/src/button/button-group.tsx` — semantic horizontal or vertical grouping.
- Modify `packages/react/src/button/button.css` — complete framework-owned family CSS.
- Modify `packages/react/src/button/index.ts` — family exports.
- Create focused `*.test.tsx` files beside each public member.
- Modify `packages/react/src/button/button.styles.test.mjs` — state and token-selector coverage.

### Angular family

- Modify `packages/angular/button/src/button.constants.ts` — axes and defaults matching the contract.
- Create `packages/angular/button/src/button-appearance.ts` — shared appearance types and host-value helpers, with no framework-neutral runtime.
- Modify `packages/angular/button/src/button.ts` — action Button, full width, and controlled loading.
- Create `packages/angular/button/src/button-link.ts` — native-anchor navigation and disabled-link behavior.
- Create `packages/angular/button/src/icon-button.ts` — icon-only action and development accessible-name assertion.
- Create `packages/angular/button/src/toggle-button.ts` — controlled pressed state and output.
- Create `packages/angular/button/src/button-group.ts` — semantic grouping and orientation.
- Modify `packages/angular/button/src/button.css` and create `button-group.css` — complete Angular family styling.
- Modify `packages/angular/button/src/public-api.ts` — secondary-entry-point exports.
- Create focused `*.spec.ts` files and extend the static CSS test.

### Shared Storybook workbench

- Create `packages/storybook-workbench/package.json`, `tsconfig.json`, and `vitest.config.ts` — private tooling package.
- Create `packages/storybook-workbench/src/manager-theme.ts` and `manager.ts` — stable manager chrome.
- Create `packages/storybook-workbench/src/globals.ts` — safe theme, scheme, and density resolution.
- Create `packages/storybook-workbench/src/reference-page.tsx` — custom compact Docs page factory.
- Create `packages/storybook-workbench/src/matrix.tsx`, `api-table.tsx`, `code-drawer.tsx`, and `framework-badge.tsx` — focused presentation primitives.
- Create `packages/storybook-workbench/src/scenarios.ts` and `snippets.ts` — metadata definitions and deterministic validation.
- Create `packages/storybook-workbench/src/workbench.css` — shared visual system and responsive behavior.
- Create focused `*.test.ts` and `*.test.tsx` files for globals, metadata, drawer behavior, and CSS invariants.

### Framework stories and integration

- Replace the single React and Angular Button story modules with one overview plus one story module per family member.
- Create framework-local `*.docs.ts` metadata files with API rows, accessibility notes, public tokens, and curated snippets.
- Modify both `.storybook/main.ts`, `.storybook/preview.*`, and create `.storybook/manager.ts`.
- Modify both Storybook app manifests and TypeScript includes.
- Modify component package manifests only with development-time workbench dependencies.
- Update `packages/react/README.md`, `packages/angular/README.md`, and root `README.md` with the implemented family and local workbench commands.

## Task 1: Promote the Button contract to a family contract

**Files:**

- Modify: `package.json`
- Modify: `specs/components/button/contract.json`
- Create: `specs/components/button/contract.test.mjs`
- Modify: `specs/components/button/README.md`

- [ ] **Step 1: Add a failing semantic contract test**

Create `specs/components/button/contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('./contract.json', import.meta.url), 'utf8'),
);

const memberNames = ['button', 'buttonLink', 'iconButton', 'toggleButton', 'buttonGroup'];
const appearanceMembers = ['button', 'buttonLink', 'iconButton', 'toggleButton'];
const allowedCapabilities = new Set([
  'appearance',
  'content',
  'fullWidth',
  'disabled',
  'loading',
  'pressed',
  'orientation',
]);
const allowedStates = new Set([
  'default',
  'hover',
  'active',
  'focus-visible',
  'disabled',
  'loading',
  'pressed',
]);

test('defines the exact first Button family', () => {
  assert.equal(contract.schemaVersion, 2);
  assert.equal(contract.family, 'button');
  assert.deepEqual(Object.keys(contract.members), memberNames);
  assert.deepEqual(contract.axes.variant, ['solid', 'outline', 'ghost']);
  assert.deepEqual(contract.axes.tone, [
    'neutral',
    'accent',
    'success',
    'warning',
    'danger',
  ]);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
});

test('keeps defaults inside their declared axes', () => {
  for (const name of appearanceMembers) {
    const defaults = contract.members[name].defaults;
    assert.ok(contract.axes.variant.includes(defaults.variant), `${name}.variant`);
    assert.ok(contract.axes.tone.includes(defaults.tone), `${name}.tone`);
    assert.ok(contract.axes.size.includes(defaults.size), `${name}.size`);
  }

  assert.equal(contract.members.button.defaults.type, 'button');
  assert.equal(contract.members.toggleButton.defaults.pressed, false);
  assert.equal(contract.members.buttonGroup.defaults.orientation, 'horizontal');
});

test('uses only known capabilities and states', () => {
  for (const [name, member] of Object.entries(contract.members)) {
    assert.equal(new Set(member.capabilities).size, member.capabilities.length, name);
    assert.equal(new Set(member.states).size, member.states.length, name);
    for (const capability of member.capabilities) {
      assert.ok(allowedCapabilities.has(capability), `${name}.${capability}`);
    }
    for (const state of member.states) {
      assert.ok(allowedStates.has(state), `${name}.${state}`);
    }
  }
});

test('declares unique scenario ids for every navigation page', () => {
  for (const [page, scenarioIds] of Object.entries(contract.scenarios)) {
    assert.ok(scenarioIds.length > 0, page);
    assert.equal(new Set(scenarioIds).size, scenarioIds.length, page);
    for (const id of scenarioIds) assert.match(id, /^[a-z][a-zA-Z]+$/);
  }
});
```

- [ ] **Step 2: Register the test and verify the old contract fails**

Modify the root scripts:

```json
{
  "scripts": {
    "test:contracts": "node --test specs/components/*/*.test.mjs",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:contracts"
  }
}
```

Run:

```bash
pnpm test:contracts
```

Expected: FAIL because the current contract has no `schemaVersion`, `members`, or family scenario map.

- [ ] **Step 3: Replace the walking-skeleton JSON with the approved family facts**

Replace `specs/components/button/contract.json` with:

```json
{
  "schemaVersion": 2,
  "family": "button",
  "axes": {
    "variant": ["solid", "outline", "ghost"],
    "tone": ["neutral", "accent", "success", "warning", "danger"],
    "size": ["sm", "md", "lg"]
  },
  "orientations": ["horizontal", "vertical"],
  "members": {
    "button": {
      "nativeElement": "button",
      "defaults": { "variant": "solid", "tone": "accent", "size": "md", "type": "button" },
      "capabilities": ["appearance", "content", "fullWidth", "disabled", "loading"],
      "states": ["default", "hover", "active", "focus-visible", "disabled", "loading"],
      "parts": ["leading", "label", "trailing", "loading-indicator"]
    },
    "buttonLink": {
      "nativeElement": "a",
      "defaults": { "variant": "solid", "tone": "accent", "size": "md" },
      "capabilities": ["appearance", "content", "fullWidth", "disabled"],
      "states": ["default", "hover", "active", "focus-visible", "disabled"],
      "parts": ["leading", "label", "trailing"]
    },
    "iconButton": {
      "nativeElement": "button",
      "defaults": { "variant": "ghost", "tone": "neutral", "size": "md", "type": "button" },
      "capabilities": ["appearance", "fullWidth", "disabled", "loading"],
      "states": ["default", "hover", "active", "focus-visible", "disabled", "loading"],
      "parts": ["icon", "loading-indicator"]
    },
    "toggleButton": {
      "nativeElement": "button",
      "defaults": { "variant": "outline", "tone": "neutral", "size": "md", "type": "button", "pressed": false },
      "capabilities": ["appearance", "content", "fullWidth", "disabled", "pressed"],
      "states": ["default", "hover", "active", "focus-visible", "disabled", "pressed"],
      "parts": ["leading", "label", "trailing"]
    },
    "buttonGroup": {
      "nativeElement": "div",
      "defaults": { "orientation": "horizontal" },
      "capabilities": ["orientation"],
      "states": [],
      "parts": ["group"]
    }
  },
  "scenarios": {
    "overview": ["matrix", "themes", "densities"],
    "button": ["playground", "states", "content", "fullWidth", "loading", "accessibility"],
    "buttonLink": ["playground", "states", "routerIntegration", "accessibility"],
    "iconButton": ["playground", "sizes", "states", "loading", "accessibility"],
    "toggleButton": ["playground", "pressed", "states", "accessibility"],
    "buttonGroup": ["playground", "orientations", "splitAction", "accessibility"]
  }
}
```

- [ ] **Step 4: Replace the non-normative horizon with the family rules**

Update `specs/components/button/README.md` so it states, in prose and a compact applicability table:

```markdown
## Implemented Family

Button is an action, ButtonLink is navigation, IconButton is an explicitly named icon-only action, ToggleButton is a controlled pressed action, and ButtonGroup is semantic grouping. These members share appearance vocabulary but never coerce one native semantic into another.

| Member | Native root | Exclusive behavior |
| --- | --- | --- |
| Button | `button` | controlled loading and form type |
| ButtonLink | `a` | native or router-owned navigation; documented disabled-link behavior |
| IconButton | `button` | mandatory `aria-label` or `aria-labelledby` |
| ToggleButton | `button` | controlled `aria-pressed` |
| ButtonGroup | `div` with `role="group"` | horizontal or vertical layout |

New capabilities extend the member that owns their semantics or introduce a new family member. They do not accumulate on a polymorphic Button.
```

Keep the existing contract escape-hatch section. Update references from the old flat `states`, `parts`, and `stories` fields to their member and scenario-map locations.

- [ ] **Step 5: Run the focused contract gate and commit**

Run:

```bash
pnpm test:contracts
pnpm exec prettier --check package.json specs/components/button
git diff --check
```

Expected: four contract tests pass; formatting and diff checks are silent.

Commit:

```bash
git add package.json specs/components/button
git commit -m "feat(contract): define button family"
```

## Task 2: Extend the token contract and default theme

**Files:**

- Modify: `packages/tokens/src/contract.json`
- Modify: `packages/themes/default/src/theme.json`
- Create: `packages/themes/default/test/contrast.test.mjs`

- [ ] **Step 1: Add a failing solid-tone contrast test**

Create `packages/themes/default/test/contrast.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const theme = JSON.parse(
  readFileSync(new URL('../src/theme.json', import.meta.url), 'utf8'),
);
const tones = ['neutral', 'accent', 'success', 'warning', 'danger'];
const solidStates = ['solid', 'solid-hover', 'solid-active'];

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  assert.ok(match, `Expected a literal six-digit hex color, received ${hex}`);
  const [, red = '00', green = '00', blue = '00'] = match;
  return (
    0.2126 * channel(Number.parseInt(red, 16)) +
    0.7152 * channel(Number.parseInt(green, 16)) +
    0.0722 * channel(Number.parseInt(blue, 16))
  );
}

function contrast(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

for (const [scheme, values] of Object.entries(theme.schemes)) {
  test(`${scheme} solid tones meet text contrast`, () => {
    for (const tone of tones) {
      const foreground = values[`--slotted-tone-${tone}-on-solid`];
      for (const state of solidStates) {
        const background = values[`--slotted-tone-${tone}-${state}`];
        assert.ok(
          contrast(background, foreground) >= 4.5,
          `${scheme}.${tone}.${state} has insufficient contrast`,
        );
      }
    }
  });
}

test('danger remains a strong surface with white text', () => {
  for (const values of Object.values(theme.schemes)) {
    assert.equal(values['--slotted-tone-danger-on-solid'], '#ffffff');
  }
});
```

- [ ] **Step 2: Verify the missing success and warning values fail**

Run:

```bash
pnpm --filter @slotted/theme-default test
```

Expected: FAIL because success and warning solid values do not exist.

- [ ] **Step 3: Extend the public base and density token lists**

Keep the existing entries and add these exact base tokens to `packages/tokens/src/contract.json`:

```json
[
  "--slotted-control-line-height",
  "--slotted-control-letter-spacing",
  "--slotted-control-shadow",
  "--slotted-button-loading-opacity",
  "--slotted-button-loading-indicator-size",
  "--slotted-button-loading-indicator-stroke-width",
  "--slotted-button-loading-indicator-duration",
  "--slotted-button-group-gap",
  "--slotted-button-group-adjacent-offset",
  "--slotted-button-group-inner-radius"
]
```

Add these exact density tokens:

```json
[
  "--slotted-button-icon-size-sm",
  "--slotted-button-icon-size-md",
  "--slotted-button-icon-size-lg"
]
```

For each of `success` and `warning`, add the same eight scheme suffixes already used by the existing tones:

```text
solid
solid-hover
solid-active
on-solid
border
text
subtle-hover
subtle-active
```

The resulting scheme keys are `--slotted-tone-success-*` and `--slotted-tone-warning-*`. Do not add component props, theme names, or implementation-only `--_` variables to the token contract.

- [ ] **Step 4: Supply complete default-theme values**

Add these base values:

```json
{
  "--slotted-control-line-height": "1",
  "--slotted-control-letter-spacing": "0",
  "--slotted-control-shadow": "none",
  "--slotted-button-loading-opacity": "0.72",
  "--slotted-button-loading-indicator-size": "1em",
  "--slotted-button-loading-indicator-stroke-width": "2px",
  "--slotted-button-loading-indicator-duration": "700ms",
  "--slotted-button-group-gap": "0px",
  "--slotted-button-group-adjacent-offset": "calc(-1 * var(--slotted-control-border-width))",
  "--slotted-button-group-inner-radius": "0px"
}
```

Add these scheme values:

```json
{
  "light": {
    "--slotted-tone-success-solid": "#15803d",
    "--slotted-tone-success-solid-hover": "#166534",
    "--slotted-tone-success-solid-active": "#14532d",
    "--slotted-tone-success-on-solid": "#ffffff",
    "--slotted-tone-success-border": "#16a34a",
    "--slotted-tone-success-text": "#15803d",
    "--slotted-tone-success-subtle-hover": "#dcfce7",
    "--slotted-tone-success-subtle-active": "#bbf7d0",
    "--slotted-tone-warning-solid": "#facc15",
    "--slotted-tone-warning-solid-hover": "#eab308",
    "--slotted-tone-warning-solid-active": "#ca8a04",
    "--slotted-tone-warning-on-solid": "#422006",
    "--slotted-tone-warning-border": "#ca8a04",
    "--slotted-tone-warning-text": "#854d0e",
    "--slotted-tone-warning-subtle-hover": "#fef9c3",
    "--slotted-tone-warning-subtle-active": "#fef08a"
  },
  "dark": {
    "--slotted-tone-accent-solid-active": "#3b82f6",
    "--slotted-tone-success-solid": "#22c55e",
    "--slotted-tone-success-solid-hover": "#4ade80",
    "--slotted-tone-success-solid-active": "#16a34a",
    "--slotted-tone-success-on-solid": "#052e16",
    "--slotted-tone-success-border": "#4ade80",
    "--slotted-tone-success-text": "#86efac",
    "--slotted-tone-success-subtle-hover": "#052e16",
    "--slotted-tone-success-subtle-active": "#14532d",
    "--slotted-tone-warning-solid": "#facc15",
    "--slotted-tone-warning-solid-hover": "#fde047",
    "--slotted-tone-warning-solid-active": "#eab308",
    "--slotted-tone-warning-on-solid": "#422006",
    "--slotted-tone-warning-border": "#facc15",
    "--slotted-tone-warning-text": "#fde68a",
    "--slotted-tone-warning-subtle-hover": "#422006",
    "--slotted-tone-warning-subtle-active": "#713f12",
    "--slotted-tone-danger-solid": "#dc2626",
    "--slotted-tone-danger-solid-hover": "#b91c1c",
    "--slotted-tone-danger-solid-active": "#991b1b",
    "--slotted-tone-danger-on-solid": "#ffffff"
  }
}
```

Add icon sizes to both densities:

```json
{
  "comfortable": {
    "--slotted-button-icon-size-sm": "14px",
    "--slotted-button-icon-size-md": "16px",
    "--slotted-button-icon-size-lg": "18px"
  },
  "compact": {
    "--slotted-button-icon-size-sm": "13px",
    "--slotted-button-icon-size-md": "14px",
    "--slotted-button-icon-size-lg": "16px"
  }
}
```

- [ ] **Step 5: Validate the theme and commit**

Run:

```bash
pnpm --filter @slotted/tokens verify
pnpm --filter @slotted/theme-default verify
pnpm test:contracts
git diff --check
```

Expected: token validation, theme build, and all light/dark contrast tests pass.

Commit:

```bash
git add packages/tokens/src/contract.json packages/themes/default/src/theme.json packages/themes/default/test/contrast.test.mjs
git commit -m "feat(theme): extend button family tokens"
```

## Task 3: Build the React foundation and mature Button

**Files:**

- Modify: `packages/react/src/button/button.constants.ts`
- Modify: `packages/react/src/button/button.types.ts`
- Create: `packages/react/src/button/button-root.ts`
- Create: `packages/react/src/button/button-content.tsx`
- Modify: `packages/react/src/button/button.tsx`
- Modify: `packages/react/src/button/button.test.tsx`
- Modify: `packages/react/src/button/button.css`

- [ ] **Step 1: Replace the flat-axis test with member-aware failing tests**

Update `button.test.tsx` to read `contract.members.button` and add these cases before implementation:

```tsx
it('matches the Button contract defaults and axes', () => {
  expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
  expect(BUTTON_TONES).toEqual(contract.axes.tone);
  expect(BUTTON_SIZES).toEqual(contract.axes.size);
  render(<Button>Save</Button>);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toHaveAttribute('data-variant', contract.members.button.defaults.variant);
  expect(button).toHaveAttribute('data-tone', contract.members.button.defaults.tone);
  expect(button).toHaveAttribute('data-size', contract.members.button.defaults.size);
  expect(button).toHaveAttribute('type', contract.members.button.defaults.type);
});

it('exposes full-width layout without changing semantics', () => {
  render(<Button fullWidth>Save</Button>);
  expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
    'data-full-width',
    '',
  );
});

it('blocks activation while loading and preserves focus and name', () => {
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Save</Button>);
  const button = screen.getByRole('button', { name: 'Save' });
  button.focus();
  rerender(
    <Button loading onClick={onClick}>
      Save
    </Button>,
  );
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
  expect(button).not.toBeDisabled();
  expect(button).toHaveFocus();
  expect(button).toHaveAttribute('aria-busy', 'true');
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).toHaveAttribute('data-state', 'loading');
  expect(screen.getByRole('button', { name: 'Save' })).toBe(button);
});

it('supports explicit loading text and indicator content', () => {
  render(
    <Button loading loadingText="Saving" loadingIndicator={<span>spinner</span>}>
      Save
    </Button>,
  );
  expect(screen.getByRole('button', { name: 'Saving' })).toBeInTheDocument();
  expect(screen.getByText('spinner').closest('[data-part="loading-indicator"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
});
```

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx
```

Expected: FAIL on the new contract shape and missing `fullWidth`, `loading`, `loadingText`, and `loadingIndicator` props.

- [ ] **Step 2: Define exact shared constants and public types**

Replace `button.constants.ts` with:

```ts
export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export const BUTTON_GROUP_ORIENTATIONS = ['horizontal', 'vertical'] as const;

export const BUTTON_DEFAULTS = { variant: 'solid', tone: 'accent', size: 'md' } as const;
export const ICON_BUTTON_DEFAULTS = { variant: 'ghost', tone: 'neutral', size: 'md' } as const;
export const TOGGLE_BUTTON_DEFAULTS = {
  variant: 'outline',
  tone: 'neutral',
  size: 'md',
} as const;
```

Replace `button.types.ts` with the complete public family type surface:

```ts
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import type {
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonAppearanceProps {
  fullWidth?: boolean;
  size?: ButtonSize;
  tone?: ButtonTone;
  variant?: ButtonVariant;
}

export interface ButtonContentProps {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export interface ButtonLoadingProps {
  loading?: boolean;
  loadingIndicator?: ReactNode;
  loadingText?: ReactNode;
}

export interface ButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps,
    ButtonLoadingProps {
  type?: ButtonType;
}

interface ButtonLinkSharedProps extends ButtonAppearanceProps, ButtonContentProps {
  disabled?: boolean;
}

export type ButtonLinkRootProps = ComponentPropsWithRef<'a'>;

type NativeButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href: string;
    render?: never;
  };

type AdaptedButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href?: never;
    render: (rootProps: ButtonLinkRootProps) => ReactElement;
  };

export type ButtonLinkProps = NativeButtonLinkProps | AdaptedButtonLinkProps;

type IconButtonAccessibleName =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string };

export type IconButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'aria-label' | 'aria-labelledby' | 'children' | 'type'
> &
  ButtonAppearanceProps &
  Omit<ButtonLoadingProps, 'loadingText'> &
  IconButtonAccessibleName & {
    children: ReactNode;
    type?: ButtonType;
  };

export interface ToggleButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps {
  onPressedChange?: (pressed: boolean) => void;
  pressed?: boolean;
  type?: ButtonType;
}

export interface ButtonGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'role'> {
  orientation?: ButtonGroupOrientation;
}
```

- [ ] **Step 3: Add small internal root and content helpers**

Create `button-root.ts`:

```ts
import type { SyntheticEvent } from 'react';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.types';

export type ButtonState = 'disabled' | 'loading' | 'pressed' | undefined;

export function buttonClassName(className?: string) {
  return ['slotted-button', className].filter(Boolean).join(' ');
}

export function appearanceData(options: {
  component: string;
  fullWidth: boolean;
  size: ButtonSize;
  state: ButtonState;
  tone: ButtonTone;
  variant: ButtonVariant;
}) {
  return {
    'data-full-width': options.fullWidth ? '' : undefined,
    'data-size': options.size,
    'data-slotted-component': options.component,
    'data-state': options.state,
    'data-tone': options.tone,
    'data-variant': options.variant,
  } as const;
}

export function blockActivation(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}
```

Create `button-content.tsx`:

```tsx
import type { ReactNode } from 'react';

interface ButtonContentLayerProps {
  children: ReactNode;
  leading?: ReactNode;
  loading: boolean;
  loadingIndicator?: ReactNode;
  loadingText?: ReactNode;
  trailing?: ReactNode;
}

function DefaultLoadingIndicator() {
  return <span className="slotted-button__spinner" />;
}

export function ButtonContentLayer({
  children,
  leading,
  loading,
  loadingIndicator,
  loadingText,
  trailing,
}: ButtonContentLayerProps) {
  const replacesAccessibleLabel = loading && loadingText !== undefined;

  return (
    <>
      <span
        aria-hidden={replacesAccessibleLabel || undefined}
        className="slotted-button__content"
        data-loading-hidden={loading ? '' : undefined}
      >
        {leading === undefined ? null : <span data-part="leading">{leading}</span>}
        <span data-part="label">{children}</span>
        {trailing === undefined ? null : <span data-part="trailing">{trailing}</span>}
      </span>
      {loading ? (
        <span className="slotted-button__loading">
          <span aria-hidden="true" data-part="loading-indicator">
            {loadingIndicator ?? <DefaultLoadingIndicator />}
          </span>
          {loadingText === undefined ? null : <span>{loadingText}</span>}
        </span>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Implement controlled loading and full width in Button**

Replace `button.tsx` with:

```tsx
import './button.css';

import { ButtonContentLayer } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ButtonProps } from './button.types';

export function Button({
  'aria-busy': ariaBusy,
  'aria-disabled': ariaDisabled,
  children,
  className,
  disabled = false,
  fullWidth = false,
  leading,
  loading = false,
  loadingIndicator,
  loadingText,
  onClick,
  size = BUTTON_DEFAULTS.size,
  tone = BUTTON_DEFAULTS.tone,
  trailing,
  type = 'button',
  variant = BUTTON_DEFAULTS.variant,
  ...nativeProps
}: ButtonProps) {
  const state = disabled ? 'disabled' : loading ? 'loading' : undefined;

  return (
    <button
      {...nativeProps}
      {...appearanceData({ component: 'button', fullWidth, size, state, tone, variant })}
      aria-busy={loading || ariaBusy || undefined}
      aria-disabled={loading || ariaDisabled || undefined}
      className={buttonClassName(className)}
      disabled={disabled}
      onClick={(event) => {
        if (loading) return blockActivation(event);
        onClick?.(event);
      }}
      type={type}
    >
      <ButtonContentLayer
        leading={leading}
        loading={loading}
        loadingIndicator={loadingIndicator}
        loadingText={loadingText}
        trailing={trailing}
      >
        {children}
      </ButtonContentLayer>
    </button>
  );
}
```

- [ ] **Step 5: Extend CSS for layout, loading, tones, and reduced motion**

Retain the existing variant and size rules, add success and warning tone variable mappings, and make these exact structural additions in `button.css`:

```css
.slotted-button {
  box-shadow: var(--slotted-control-shadow, none);
  display: inline-grid;
  letter-spacing: var(--slotted-control-letter-spacing, 0);
  line-height: var(--slotted-control-line-height, 1);
  position: relative;
}

.slotted-button__content,
.slotted-button__loading {
  align-items: center;
  display: inline-flex;
  gap: var(--slotted-button-gap, 0.5rem);
  grid-area: 1 / 1;
  justify-content: center;
}

.slotted-button__content[data-loading-hidden] {
  opacity: 0;
}

.slotted-button[data-full-width] {
  inline-size: 100%;
}

.slotted-button[data-state='loading'] {
  cursor: progress;
  opacity: var(--slotted-button-loading-opacity, 0.72);
}

.slotted-button:disabled,
.slotted-button[data-state='disabled'] {
  background: var(--slotted-disabled-background, GrayText);
  border-color: var(--slotted-disabled-border, GrayText);
  color: var(--slotted-disabled-foreground, Canvas);
  cursor: not-allowed;
}

.slotted-button__spinner {
  animation: slotted-button-spin var(--slotted-button-loading-indicator-duration, 700ms)
    linear infinite;
  block-size: var(--slotted-button-loading-indicator-size, 1em);
  border: var(--slotted-button-loading-indicator-stroke-width, 2px) solid currentColor;
  border-inline-end-color: transparent;
  border-radius: 999px;
  display: block;
  inline-size: var(--slotted-button-loading-indicator-size, 1em);
}

@keyframes slotted-button-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slotted-button {
    transition-duration: 0.01ms;
  }

  .slotted-button__spinner {
    animation-duration: 1.8s;
  }
}
```

Use the same eight internal `--_` mappings as existing tones for `success` and `warning`. Change interactive selectors from `:not(:disabled)` to `:not(:disabled):not([aria-disabled='true'])` so loading and disabled links cannot acquire hover/active treatment.

- [ ] **Step 6: Run the React Button gate and commit**

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx
pnpm --filter @slotted/react typecheck
git diff --check
```

Expected: Button tests and typecheck pass; no style or whitespace error is reported.

Commit:

```bash
git add packages/react/src/button/button.constants.ts packages/react/src/button/button.types.ts packages/react/src/button/button-root.ts packages/react/src/button/button-content.tsx packages/react/src/button/button.tsx packages/react/src/button/button.test.tsx packages/react/src/button/button.css
git commit -m "feat(react): mature button behavior"
```

## Task 4: Add React ButtonLink

**Files:**

- Create: `packages/react/src/button/button-link.tsx`
- Create: `packages/react/src/button/button-link.test.tsx`
- Modify: `packages/react/src/button/index.ts`

- [ ] **Step 1: Write failing native, disabled, and adapter tests**

Create `button-link.test.tsx` with these core cases:

```tsx
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('renders a native anchor and forwards anchor props and ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <ButtonLink ref={ref} href="/settings" target="_blank">
        Settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.localName).toBe(contract.members.buttonLink.nativeElement);
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).toHaveAttribute('target', '_blank');
    expect(ref.current).toBe(link);
  });

  it('suppresses disabled navigation before consumer handlers', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <ButtonLink disabled href="/settings" onClick={onClick} onKeyDown={onKeyDown}>
        Settings
      </ButtonLink>,
    );
    const link = screen.getByText('Settings').closest('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    fireEvent.click(link!);
    fireEvent.keyDown(link!, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('honors an explicit disabled tab index', () => {
    render(
      <ButtonLink disabled href="/settings" tabIndex={0}>
        Settings
      </ButtonLink>,
    );
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('tabindex', '0');
  });

  it('passes complete root props to a router-owned link', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <ButtonLink
        ref={ref}
        render={(rootProps) => <a {...rootProps} data-router-link="true" href="/router" />}
      >
        Router settings
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Router settings' });
    expect(link).toHaveAttribute('data-router-link', 'true');
    expect(link).toHaveAttribute('data-variant', 'solid');
    expect(ref.current).toBe(link);
  });
});
```

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button-link.test.tsx
```

Expected: FAIL because `button-link.tsx` does not exist.

- [ ] **Step 2: Implement the anchor and narrow render adapter**

Create `button-link.tsx`:

```tsx
import { ButtonContentLayer } from './button-content';
import { BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { ButtonLinkProps, ButtonLinkRootProps } from './button.types';

export function ButtonLink({
  children,
  className,
  disabled = false,
  fullWidth = false,
  href,
  leading,
  onAuxClick,
  onClick,
  onKeyDown,
  render,
  size = BUTTON_DEFAULTS.size,
  tabIndex,
  tone = BUTTON_DEFAULTS.tone,
  trailing,
  variant = BUTTON_DEFAULTS.variant,
  ...anchorProps
}: ButtonLinkProps) {
  const rootProps: ButtonLinkRootProps = {
    ...anchorProps,
    ...appearanceData({
      component: 'button-link',
      fullWidth,
      size,
      state: disabled ? 'disabled' : undefined,
      tone,
      variant,
    }),
    'aria-disabled': disabled || anchorProps['aria-disabled'] || undefined,
    children: (
      <ButtonContentLayer leading={leading} loading={false} trailing={trailing}>
        {children}
      </ButtonContentLayer>
    ),
    className: buttonClassName(className),
    href,
    onAuxClick: (event) => {
      if (disabled) return blockActivation(event);
      onAuxClick?.(event);
    },
    onClick: (event) => {
      if (disabled) return blockActivation(event);
      onClick?.(event);
    },
    onKeyDown: (event) => {
      if (disabled && (event.key === 'Enter' || event.key === ' ')) {
        return blockActivation(event);
      }
      onKeyDown?.(event);
    },
    tabIndex: disabled ? (tabIndex ?? -1) : tabIndex,
  };

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}
```

The union in Task 3 makes native `href` and `render` mutually exclusive. Do not add `as`, `asChild`, button `type`, or router-library dependencies.

- [ ] **Step 3: Export, verify, and commit ButtonLink**

Add to `index.ts`:

```ts
export { ButtonLink } from './button-link';
export type { ButtonLinkProps, ButtonLinkRootProps } from './button.types';
```

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button-link.test.tsx
pnpm --filter @slotted/react typecheck
```

Expected: four ButtonLink tests and typecheck pass.

Commit:

```bash
git add packages/react/src/button/button-link.tsx packages/react/src/button/button-link.test.tsx packages/react/src/button/index.ts
git commit -m "feat(react): add button link"
```

## Task 5: Add React IconButton

**Files:**

- Create: `packages/react/src/button/icon-button.tsx`
- Create: `packages/react/src/button/icon-button.test.tsx`
- Modify: `packages/react/src/button/button.css`
- Modify: `packages/react/src/button/index.ts`
- Modify: `packages/react/tsconfig.json`

- [ ] **Step 1: Write failing semantic and loading tests**

Create `icon-button.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('uses icon defaults and an explicit accessible name', () => {
    render(<IconButton aria-label="Close">×</IconButton>);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-tone', 'neutral');
    expect(button).toHaveAttribute('data-part-root', 'icon');
  });

  it('throws a development error when runtime callers bypass the name type', () => {
    expect(() => render(<IconButton {...({} as never)}>×</IconButton>)).toThrow(
      'IconButton requires aria-label or aria-labelledby',
    );
  });

  it('blocks activation while loading without removing focus', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Refresh" loading onClick={onClick}>
        ↻
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Refresh' });
    button.focus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
```

Run the file and expect a missing-module failure.

- [ ] **Step 2: Implement the icon-only action**

Create `icon-button.tsx`:

```tsx
import { ICON_BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, blockActivation, buttonClassName } from './button-root';
import type { IconButtonProps } from './button.types';

function DefaultLoadingIndicator() {
  return <span className="slotted-button__spinner" />;
}

export function IconButton({
  'aria-busy': ariaBusy,
  'aria-disabled': ariaDisabled,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  className,
  disabled = false,
  fullWidth = false,
  loading = false,
  loadingIndicator,
  onClick,
  size = ICON_BUTTON_DEFAULTS.size,
  tone = ICON_BUTTON_DEFAULTS.tone,
  type = 'button',
  variant = ICON_BUTTON_DEFAULTS.variant,
  ...nativeProps
}: IconButtonProps) {
  if (import.meta.env.DEV && ariaLabel === undefined && ariaLabelledBy === undefined) {
    throw new Error('IconButton requires aria-label or aria-labelledby');
  }

  const state = disabled ? 'disabled' : loading ? 'loading' : undefined;

  return (
    <button
      {...nativeProps}
      {...appearanceData({ component: 'icon-button', fullWidth, size, state, tone, variant })}
      aria-busy={loading || ariaBusy || undefined}
      aria-disabled={loading || ariaDisabled || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={buttonClassName(className)}
      data-part-root="icon"
      disabled={disabled}
      onClick={(event) => {
        if (loading) return blockActivation(event);
        onClick?.(event);
      }}
      type={type}
    >
      <span className="slotted-button__content" data-loading-hidden={loading ? '' : undefined}>
        <span data-part="icon">{children}</span>
      </span>
      {loading ? (
        <span className="slotted-button__loading">
          <span aria-hidden="true" data-part="loading-indicator">
            {loadingIndicator ?? <DefaultLoadingIndicator />}
          </span>
        </span>
      ) : null}
    </button>
  );
}
```

Do not infer a label from `title`, child text, or SVG metadata.

Add `vite/client` to the existing `compilerOptions.types` array in `packages/react/tsconfig.json` so `import.meta.env.DEV` is typed and statically replaced by Vite. The production library build must not retain the development assertion branch.

- [ ] **Step 3: Add square sizing and export the component**

Add to `button.css`:

```css
.slotted-button[data-part-root='icon']:not([data-full-width]) {
  aspect-ratio: 1;
  inline-size: var(--_button-height);
  padding-inline: 0;
}

.slotted-button[data-size='sm'] {
  --_button-height: var(--slotted-button-height-sm, 1.875rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-sm,
    var(--slotted-button-icon-size, 1em)
  );
}

.slotted-button[data-size='md'] {
  --_button-height: var(--slotted-button-height-md, 2.125rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-md,
    var(--slotted-button-icon-size, 1em)
  );
}

.slotted-button[data-size='lg'] {
  --_button-height: var(--slotted-button-height-lg, 2.375rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-lg,
    var(--slotted-button-icon-size, 1em)
  );
}

.slotted-button [data-part='icon'],
.slotted-button [data-part='leading'],
.slotted-button [data-part='trailing'] {
  block-size: var(--_button-icon-size);
  inline-size: var(--_button-icon-size);
}
```

Set `data-part-root="icon"` on the root. Export `IconButton` and `IconButtonProps` from `index.ts`.

- [ ] **Step 4: Verify and commit IconButton**

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/icon-button.test.tsx
pnpm --filter @slotted/react typecheck
git diff --check
```

Expected: three tests and typecheck pass.

Commit the new member, its test, CSS, export, and React TypeScript environment update as `feat(react): add icon button`.

## Task 6: Add React ToggleButton

**Files:**

- Create: `packages/react/src/button/toggle-button.tsx`
- Create: `packages/react/src/button/toggle-button.test.tsx`
- Modify: `packages/react/src/button/button.css`
- Modify: `packages/react/src/button/index.ts`

- [ ] **Step 1: Write failing controlled-state tests**

Create tests that prove:

```tsx
it('reflects controlled pressed state without mutating itself', () => {
  const onPressedChange = vi.fn();
  const { rerender } = render(
    <ToggleButton pressed={false} onPressedChange={onPressedChange}>Pin</ToggleButton>,
  );
  const button = screen.getByRole('button', { name: 'Pin' });
  fireEvent.click(button);
  expect(onPressedChange).toHaveBeenCalledWith(true);
  expect(button).toHaveAttribute('aria-pressed', 'false');
  rerender(<ToggleButton pressed>Pin</ToggleButton>);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(button).toHaveAttribute('data-state', 'pressed');
});

it('does not request a state change when disabled', () => {
  const onPressedChange = vi.fn();
  render(
    <ToggleButton disabled pressed={false} onPressedChange={onPressedChange}>
      Pin
    </ToggleButton>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
  expect(onPressedChange).not.toHaveBeenCalled();
});
```

Run the file and expect a missing-module failure.

- [ ] **Step 2: Implement controlled pressed behavior**

Create `toggle-button.tsx`:

```tsx
import { ButtonContentLayer } from './button-content';
import { TOGGLE_BUTTON_DEFAULTS } from './button.constants';
import { appearanceData, buttonClassName } from './button-root';
import type { ToggleButtonProps } from './button.types';

export function ToggleButton({
  children,
  className,
  disabled = false,
  fullWidth = false,
  leading,
  onClick,
  onPressedChange,
  pressed = false,
  size = TOGGLE_BUTTON_DEFAULTS.size,
  tone = TOGGLE_BUTTON_DEFAULTS.tone,
  trailing,
  type = 'button',
  variant = TOGGLE_BUTTON_DEFAULTS.variant,
  ...nativeProps
}: ToggleButtonProps) {
  const state = disabled ? 'disabled' : pressed ? 'pressed' : undefined;
  return (
    <button
      {...nativeProps}
      {...appearanceData({ component: 'toggle-button', fullWidth, size, state, tone, variant })}
      aria-pressed={pressed}
      className={buttonClassName(className)}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange?.(!pressed);
      }}
      type={type}
    >
      <ButtonContentLayer leading={leading} loading={false} trailing={trailing}>
        {children}
      </ButtonContentLayer>
    </button>
  );
}
```

Do not add internal state or `defaultPressed` in this phase.

- [ ] **Step 3: Add pressed styling, export, verify, and commit**

Add:

```css
.slotted-button[data-slotted-component='toggle-button'][data-state='pressed'] {
  background: var(--_solid, ButtonFace);
  border-color: var(--_solid, ButtonBorder);
  color: var(--_on-solid, ButtonText);
}
```

Export `ToggleButton` and `ToggleButtonProps`. Run the focused test and React typecheck; expect both to pass. Commit as `feat(react): add toggle button`.

## Task 7: Add React ButtonGroup and close React family verification

**Files:**

- Create: `packages/react/src/button/button-group.tsx`
- Create: `packages/react/src/button/button-group.test.tsx`
- Modify: `packages/react/src/button/button.css`
- Modify: `packages/react/src/button/button.styles.test.mjs`
- Modify: `packages/react/src/button/index.ts`
- Modify: `packages/react/README.md`

- [ ] **Step 1: Write failing semantic group tests**

Create `button-group.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { ButtonGroup } from './button-group';

describe('ButtonGroup', () => {
  it('renders a labeled horizontal group by default', () => {
    render(
      <ButtonGroup aria-label="Editing actions">
        <Button>Save</Button>
        <Button>Discard</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Editing actions' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveAttribute('data-slotted-component', 'button-group');
  });

  it('preserves vertical orientation and native div props', () => {
    render(<ButtonGroup orientation="vertical" data-testid="group" />);
    expect(screen.getByTestId('group')).toHaveAttribute('data-orientation', 'vertical');
  });
});
```

- [ ] **Step 2: Implement the non-mutating group**

Create `button-group.tsx`:

```tsx
import type { ButtonGroupProps } from './button.types';

export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  ...nativeProps
}: ButtonGroupProps) {
  return (
    <div
      {...nativeProps}
      className={['slotted-button-group', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      data-slotted-component="button-group"
      role="group"
    >
      {children}
    </div>
  );
}
```

Do not inspect, clone, or inject appearance props into children.

- [ ] **Step 3: Add orientation, seam, and focus-clearance CSS**

Append:

```css
.slotted-button-group {
  align-items: stretch;
  display: inline-flex;
  gap: var(--slotted-button-group-gap, 0px);
  isolation: isolate;
}

.slotted-button-group[data-orientation='vertical'] {
  flex-direction: column;
}

.slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:first-child) {
  border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);
  margin-inline-start: var(--slotted-button-group-adjacent-offset, -1px);
}

.slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:last-child) {
  border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);
}

.slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:first-child) {
  border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);
  margin-block-start: var(--slotted-button-group-adjacent-offset, -1px);
}

.slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:last-child) {
  border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);
}

.slotted-button-group > .slotted-button:focus-visible {
  z-index: 1;
}
```

- [ ] **Step 4: Update static CSS contract assertions**

Change `button.styles.test.mjs` to flatten member states and check exact representative selectors:

```js
const requiredStates = new Set(
  Object.values(contract.members).flatMap((member) => member.states),
);
const selectors = {
  default: '.slotted-button {',
  hover: ":hover:not(:disabled):not([aria-disabled='true'])",
  active: ":active:not(:disabled):not([aria-disabled='true'])",
  'focus-visible': '.slotted-button:focus-visible',
  disabled: "[data-state='disabled']",
  loading: "[data-state='loading']",
  pressed: "[data-state='pressed']",
};

assert.deepEqual(new Set(Object.keys(selectors)), requiredStates);
for (const selector of Object.values(selectors)) {
  assert.ok(css.includes(selector), `Missing state selector: ${selector}`);
}
for (const tone of contract.axes.tone) {
  assert.ok(css.includes(`[data-tone='${tone}']`), `Missing tone: ${tone}`);
}
```

- [ ] **Step 5: Export, document, verify, and commit the React boundary**

Export `ButtonGroup`, `ButtonGroupProps`, and `ButtonGroupOrientation`. Update the React README family table and retain the statement that styling comes from `@slotted/react/styles.css` plus a complete theme.

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx src/button/button-link.test.tsx src/button/icon-button.test.tsx src/button/toggle-button.test.tsx src/button/button-group.test.tsx
pnpm --filter @slotted/react exec node --test src/button/button.styles.test.mjs
pnpm --filter @slotted/react typecheck
pnpm --filter @slotted/react build
pnpm test:contracts
git diff --check
```

Expected: all React family DOM tests, static CSS assertions, typecheck, and library build pass. Do not run the package-wide story test until Task 15 replaces the walking-skeleton stories.

Commit all Task 7 files as `feat(react): add button group`.

## Task 8: Build the Angular foundation and mature SlButton

**Files:**

- Modify: `packages/angular/button/src/button.constants.ts`
- Create: `packages/angular/button/src/button-appearance.ts`
- Modify: `packages/angular/button/src/button.ts`
- Modify: `packages/angular/button/src/button.spec.ts`
- Modify: `packages/angular/button/src/button.css`

- [ ] **Step 1: Add failing Angular loading and family-contract tests**

Update the `TestHost` in `button.spec.ts` with `loading`, `loadingText`, and `fullWidth` signals and bindings. Replace old flat contract reads with `contract.members.button`, then add:

```ts
it('blocks activation while loading without using native disabled', async () => {
  const fixture = TestBed.createComponent(TestHost);
  fixture.componentInstance.loading.set(true);
  await fixture.whenStable();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  button.focus();
  button.click();
  expect(button.disabled).toBe(false);
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(button.getAttribute('aria-disabled')).toBe('true');
  expect(button.dataset['state']).toBe('loading');
  expect(document.activeElement).toBe(button);
  expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
});

it('renders explicit loading text and a replaceable indicator slot', async () => {
  const fixture = TestBed.createComponent(TestHost);
  fixture.componentInstance.loading.set(true);
  fixture.componentInstance.loadingText.set('Saving');
  await fixture.whenStable();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  expect(button.textContent).toContain('Saving');
  expect(button.querySelector('[data-part="loading-indicator"]')).not.toBeNull();
});

it('exposes full-width layout as a data fact', async () => {
  const fixture = TestBed.createComponent(TestHost);
  fixture.componentInstance.fullWidth.set(true);
  await fixture.whenStable();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  expect(button.getAttribute('data-full-width')).toBe('');
});
```

Run:

```bash
pnpm --filter @slotted/angular exec ng test slotted-angular --watch=false --include button/src/button.spec.ts
```

Expected: FAIL on the new contract shape and missing inputs.

- [ ] **Step 2: Define Angular constants and event helpers**

Replace `button.constants.ts` with the same arrays and defaults as React, plus exported derived types:

```ts
export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export const BUTTON_GROUP_ORIENTATIONS = ['horizontal', 'vertical'] as const;

export const BUTTON_DEFAULTS = { variant: 'solid', tone: 'accent', size: 'md' } as const;
export const ICON_BUTTON_DEFAULTS = { variant: 'ghost', tone: 'neutral', size: 'md' } as const;
export const TOGGLE_BUTTON_DEFAULTS = {
  variant: 'outline',
  tone: 'neutral',
  size: 'md',
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
```

Create `button-appearance.ts`:

```ts
export type ButtonState = 'disabled' | 'loading' | 'pressed' | null;

export function buttonState(options: {
  disabled: boolean;
  loading?: boolean;
  pressed?: boolean;
}): ButtonState {
  if (options.disabled) return 'disabled';
  if (options.loading) return 'loading';
  if (options.pressed) return 'pressed';
  return null;
}

export function blockActivation(event: Event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}
```

- [ ] **Step 3: Implement the mature native Angular Button**

Replace `button.ts` with a standalone native-button component that keeps the current selector and uses this complete public surface and template:

```ts
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { blockActivation, buttonState } from './button-appearance';
import { BUTTON_DEFAULTS } from './button.constants';
import type { ButtonSize, ButtonTone, ButtonType, ButtonVariant } from './button.constants';

@Component({
  selector: 'button[slButton]',
  standalone: true,
  template: `
    <span
      class="slotted-button__content"
      [attr.aria-hidden]="loading() && loadingText() !== undefined ? 'true' : null"
      [attr.data-loading-hidden]="loading() ? '' : null"
    >
      <span data-part="leading"><ng-content select="[slButtonLeading]"></ng-content></span>
      <span data-part="label"><ng-content></ng-content></span>
      <span data-part="trailing"><ng-content select="[slButtonTrailing]"></ng-content></span>
    </span>
    @if (loading()) {
      <span class="slotted-button__loading">
        <span aria-hidden="true" data-part="loading-indicator">
          <ng-content select="[slButtonLoadingIndicator]"></ng-content>
          <span class="slotted-button__spinner"></span>
        </span>
        @if (loadingText(); as text) { <span>{{ text }}</span> }
      </span>
    }
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'button',
    '[attr.aria-busy]': 'loading() || ariaBusy() || null',
    '[attr.aria-disabled]': 'loading() || ariaDisabled() || null',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'state()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[disabled]': 'disabled()',
    '[attr.type]': 'type()',
    '(click)': 'handleClick($event)',
  },
})
export class SlButton {
  readonly ariaBusy = input<boolean | string | null>(null, { alias: 'aria-busy' });
  readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingText = input<string>();
  readonly size = input<ButtonSize>(BUTTON_DEFAULTS.size);
  readonly tone = input<ButtonTone>(BUTTON_DEFAULTS.tone);
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>(BUTTON_DEFAULTS.variant);
  readonly state = computed(() =>
    buttonState({ disabled: this.disabled(), loading: this.loading() }),
  );

  handleClick(event: Event) {
    if (this.loading()) blockActivation(event);
  }
}
```

Use CSS `:has([slButtonLoadingIndicator])` to hide the default spinner only when a replacement is projected:

```css
:host [data-part='loading-indicator']:has([slButtonLoadingIndicator])
  > .slotted-button__spinner {
  display: none;
}
```

Keep the current accent, neutral, and danger mappings, then add these exact Angular-host rules. The stylesheet remains framework-owned and does not import React CSS:

```css
:host {
  box-shadow: var(--slotted-control-shadow, none);
  display: inline-grid;
  letter-spacing: var(--slotted-control-letter-spacing, 0);
  line-height: var(--slotted-control-line-height, 1);
  position: relative;
}

:host([data-tone='success']) {
  --_solid: var(--slotted-tone-success-solid);
  --_solid-hover: var(--slotted-tone-success-solid-hover);
  --_solid-active: var(--slotted-tone-success-solid-active);
  --_on-solid: var(--slotted-tone-success-on-solid);
  --_border: var(--slotted-tone-success-border);
  --_text: var(--slotted-tone-success-text);
  --_subtle-hover: var(--slotted-tone-success-subtle-hover);
  --_subtle-active: var(--slotted-tone-success-subtle-active);
}

:host([data-tone='warning']) {
  --_solid: var(--slotted-tone-warning-solid);
  --_solid-hover: var(--slotted-tone-warning-solid-hover);
  --_solid-active: var(--slotted-tone-warning-solid-active);
  --_on-solid: var(--slotted-tone-warning-on-solid);
  --_border: var(--slotted-tone-warning-border);
  --_text: var(--slotted-tone-warning-text);
  --_subtle-hover: var(--slotted-tone-warning-subtle-hover);
  --_subtle-active: var(--slotted-tone-warning-subtle-active);
}

:host .slotted-button__content,
:host .slotted-button__loading {
  align-items: center;
  display: inline-flex;
  gap: var(--slotted-button-gap, 0.5rem);
  grid-area: 1 / 1;
  justify-content: center;
}

:host .slotted-button__content[data-loading-hidden] {
  opacity: 0;
}

:host([data-full-width]) {
  inline-size: 100%;
}

:host([data-state='loading']) {
  cursor: progress;
  opacity: var(--slotted-button-loading-opacity, 0.72);
}

:host(:disabled),
:host([data-state='disabled']) {
  background: var(--slotted-disabled-background, GrayText);
  border-color: var(--slotted-disabled-border, GrayText);
  color: var(--slotted-disabled-foreground, Canvas);
  cursor: not-allowed;
}

:host .slotted-button__spinner {
  animation: slotted-button-spin var(--slotted-button-loading-indicator-duration, 700ms)
    linear infinite;
  block-size: var(--slotted-button-loading-indicator-size, 1em);
  border: var(--slotted-button-loading-indicator-stroke-width, 2px) solid currentColor;
  border-inline-end-color: transparent;
  border-radius: 999px;
  display: block;
  inline-size: var(--slotted-button-loading-indicator-size, 1em);
}

@keyframes slotted-button-spin {
  to {
    transform: rotate(1turn);
  }
}

@media (prefers-reduced-motion: reduce) {
  :host {
    transition-duration: 0.01ms;
  }

  :host .slotted-button__spinner {
    animation-duration: 1.8s;
  }
}
```

Change every existing hover/active selector suffix from `:not(:disabled)` to `:not(:disabled):not([aria-disabled='true'])`.

- [ ] **Step 4: Verify and commit the Angular Button boundary**

Run the focused Angular test and `pnpm --filter @slotted/angular typecheck`. Expected: all Button cases pass, including the consumer click spy remaining untouched while loading.

Commit Task 8 files as `feat(angular): mature button behavior`.

## Task 9: Add Angular SlButtonLink

**Files:**

- Create: `packages/angular/button/src/button-link.ts`
- Create: `packages/angular/button/src/button-link.spec.ts`
- Modify: `packages/angular/button/src/public-api.ts`

- [ ] **Step 1: Write failing native-anchor and disabled-link tests**

Create a standalone test host that imports `SlButtonLink` and renders:

```html
<a
  slButtonLink
  href="/settings"
  [disabled]="disabled()"
  [tabIndex]="tabIndex()"
  (click)="clickSpy()"
  (keydown)="keySpy()"
>
  Settings
</a>
```

Assert the native `a`, preserved `href`, default appearance data, and projected label. In the disabled case assert `aria-disabled="true"`, default `tabindex="-1"`, click and Enter suppression, and explicit `tabindex="0"` preservation. Run the focused spec and expect a missing-module failure.

- [ ] **Step 2: Implement the native-anchor component**

Create `button-link.ts` with the same labeled template, appearance inputs, and defaults as `SlButton`, excluding type and loading. Its host contract is:

```ts
host: {
  class: 'slotted-button',
  'data-slotted-component': 'button-link',
  '[attr.aria-disabled]': 'disabled() || ariaDisabled() || null',
  '[attr.data-full-width]': 'fullWidth() ? "" : null',
  '[attr.data-size]': 'size()',
  '[attr.data-state]': 'disabled() ? "disabled" : null',
  '[attr.data-tone]': 'tone()',
  '[attr.data-variant]': 'variant()',
  '[attr.tabindex]': 'disabled() ? (tabIndex() ?? -1) : tabIndex()',
  '(auxclick)': 'handleBlockedEvent($event)',
  '(click)': 'handleBlockedEvent($event)',
  '(keydown)': 'handleKeydown($event)',
}
```

Use:

```ts
readonly ariaDisabled = input<boolean | string | null>(null, { alias: 'aria-disabled' });
readonly disabled = input(false, { transform: booleanAttribute });
readonly fullWidth = input(false, { transform: booleanAttribute });
readonly tabIndex = input<number | string | null>(null, { alias: 'tabIndex' });

handleBlockedEvent(event: Event) {
  if (this.disabled()) blockActivation(event);
}

handleKeydown(event: KeyboardEvent) {
  if (this.disabled() && (event.key === 'Enter' || event.key === ' ')) {
    blockActivation(event);
  }
}
```

Do not bind or remove `href`; this preserves native `href` and permits Angular Router's `routerLink` to own the same anchor.

- [ ] **Step 3: Export, verify, and commit SlButtonLink**

Export `SlButtonLink` from the secondary entry point. Run the focused spec and Angular typecheck; expect both to pass. Commit as `feat(angular): add button link`.

## Task 10: Add Angular SlIconButton

**Files:**

- Create: `packages/angular/button/src/icon-button.ts`
- Create: `packages/angular/button/src/icon-button.spec.ts`
- Modify: `packages/angular/button/src/button.css`
- Modify: `packages/angular/button/src/public-api.ts`

- [ ] **Step 1: Write failing accessible-name and loading tests**

Create named and unnamed host components. The named host renders:

```html
<button slIconButton aria-label="Close" [loading]="loading()" (click)="clickSpy()">
  <span aria-hidden="true">×</span>
</button>
```

Assert icon defaults, native type `button`, accessible name, loading activation suppression, focus preservation, and `aria-busy`. Assert that creating and stabilizing the unnamed host throws `IconButton requires aria-label or aria-labelledby` in development.

- [ ] **Step 2: Implement icon-only action and the dev assertion**

Create `icon-button.ts` with the Button loading inputs and event handling, `ICON_BUTTON_DEFAULTS`, `data-part-root="icon"`, and this template:

```html
<span class="slotted-button__content" [attr.data-loading-hidden]="loading() ? '' : null">
  <span data-part="icon"><ng-content></ng-content></span>
</span>
@if (loading()) {
  <span class="slotted-button__loading">
    <span aria-hidden="true" data-part="loading-indicator">
      <ng-content select="[slButtonLoadingIndicator]"></ng-content>
      <span class="slotted-button__spinner"></span>
    </span>
  </span>
}
```

Implement `AfterViewInit` with an injected `ElementRef<HTMLButtonElement>`:

```ts
ngAfterViewInit() {
  if (
    isDevMode() &&
    !this.element.nativeElement.hasAttribute('aria-label') &&
    !this.element.nativeElement.hasAttribute('aria-labelledby')
  ) {
    throw new Error('IconButton requires aria-label or aria-labelledby');
  }
}
```

Use the same disabled/loading precedence and native-disabled rule as React.

- [ ] **Step 3: Export, verify, and commit SlIconButton**

Add these exact square icon-root selectors, export the class, and run the focused spec plus Angular typecheck:

```css
:host([data-part-root='icon']:not([data-full-width])) {
  aspect-ratio: 1;
  inline-size: var(--_button-height);
  padding-inline: 0;
}

:host([data-size='sm']) {
  --_button-height: var(--slotted-button-height-sm, 1.875rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-sm,
    var(--slotted-button-icon-size, 1em)
  );
}

:host([data-size='md']) {
  --_button-height: var(--slotted-button-height-md, 2.125rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-md,
    var(--slotted-button-icon-size, 1em)
  );
}

:host([data-size='lg']) {
  --_button-height: var(--slotted-button-height-lg, 2.375rem);
  --_button-icon-size: var(
    --slotted-button-icon-size-lg,
    var(--slotted-button-icon-size, 1em)
  );
}

:host [data-part='icon'],
:host [data-part='leading'],
:host [data-part='trailing'] {
  block-size: var(--_button-icon-size);
  inline-size: var(--_button-icon-size);
}
```

Commit as `feat(angular): add icon button`.

## Task 11: Add Angular SlToggleButton

**Files:**

- Create: `packages/angular/button/src/toggle-button.ts`
- Create: `packages/angular/button/src/toggle-button.spec.ts`
- Modify: `packages/angular/button/src/button.css`
- Modify: `packages/angular/button/src/public-api.ts`

- [ ] **Step 1: Write failing controlled pressed tests**

Use a host with `[(pressed)]="pressed"`. Assert default false, emitted next value after click, reflected `aria-pressed`, `data-state="pressed"` only after the host value changes, and no output while disabled.

- [ ] **Step 2: Implement the controlled toggle**

Create `toggle-button.ts` with the labeled template, `TOGGLE_BUTTON_DEFAULTS`, appearance/full-width inputs, native disabled and type, plus:

```ts
readonly pressed = input(false, { transform: booleanAttribute });
readonly pressedChange = output<boolean>();
readonly state = computed(() =>
  buttonState({ disabled: this.disabled(), pressed: this.pressed() }),
);

handleClick(event: MouseEvent) {
  if (!this.disabled() && !event.defaultPrevented) {
    this.pressedChange.emit(!this.pressed());
  }
}
```

Bind `[attr.aria-pressed]` to `pressed()`, state with disabled precedence, and component id `toggle-button`. Do not write back to `pressed` internally.

- [ ] **Step 3: Add pressed styles, export, verify, and commit**

Add the exact pressed selector, export the class, run the focused spec and Angular typecheck, and commit as `feat(angular): add toggle button`:

```css
:host([data-slotted-component='toggle-button'][data-state='pressed']) {
  background: var(--_solid, ButtonFace);
  border-color: var(--_solid, ButtonBorder);
  color: var(--_on-solid, ButtonText);
}
```

## Task 12: Add Angular SlButtonGroup and close Angular verification

**Files:**

- Create: `packages/angular/button/src/button-group.ts`
- Create: `packages/angular/button/src/button-group.css`
- Create: `packages/angular/button/src/button-group.spec.ts`
- Modify: `packages/angular/button/src/button.styles.test.mjs`
- Modify: `packages/angular/button/src/public-api.ts`
- Modify: `packages/angular/README.md`

- [ ] **Step 1: Write failing semantic group tests**

Create a host that imports `SlButtonGroup` and `SlButton`, then assert this template produces a named group whose buttons remain native descendants:

```html
<div slButtonGroup aria-label="Editing actions" [orientation]="orientation()">
  <button slButton>Save</button>
  <button slButton>Discard</button>
</div>
```

Test horizontal default and vertical updates. Expect a missing-module failure first.

- [ ] **Step 2: Implement the group host**

Create `button-group.ts`:

```ts
import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ButtonGroupOrientation } from './button.constants';

@Component({
  selector: 'div[slButtonGroup]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: './button-group.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button-group',
    role: 'group',
    'data-slotted-component': 'button-group',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SlButtonGroup {
  readonly orientation = input<ButtonGroupOrientation>('horizontal');
}
```

- [ ] **Step 3: Add namespaced global group CSS**

Create `button-group.css` with:

```css
.slotted-button-group {
  align-items: stretch;
  display: inline-flex;
  gap: var(--slotted-button-group-gap, 0px);
  isolation: isolate;
}

.slotted-button-group[data-orientation='vertical'] {
  flex-direction: column;
}

.slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:first-child) {
  border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);
  margin-inline-start: var(--slotted-button-group-adjacent-offset, -1px);
}

.slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:last-child) {
  border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);
}

.slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:first-child) {
  border-start-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-start-end-radius: var(--slotted-button-group-inner-radius, 0px);
  margin-block-start: var(--slotted-button-group-adjacent-offset, -1px);
}

.slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:last-child) {
  border-end-start-radius: var(--slotted-button-group-inner-radius, 0px);
  border-end-end-radius: var(--slotted-button-group-inner-radius, 0px);
}

.slotted-button-group > .slotted-button:focus-visible {
  z-index: 1;
}
```

Because every selector is rooted at `.slotted-button-group`, `ViewEncapsulation.None` does not create generic global element rules.

- [ ] **Step 4: Complete static parity and public exports**

Update the Angular CSS test to read both `button.css` and `button-group.css`, flatten member states exactly as the React static test does, assert all five tones, both orientations, reduced motion, and the group root selector.

Make `public-api.ts` export:

```ts
export { SlButton } from './button';
export { SlButtonGroup } from './button-group';
export { SlButtonLink } from './button-link';
export { SlIconButton } from './icon-button';
export { SlToggleButton } from './toggle-button';
export type {
  ButtonGroupOrientation,
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from './button.constants';
```

Update the Angular README with the native selectors, loading semantics, disabled-link behavior, controlled pressed binding, and group example.

- [ ] **Step 5: Verify and commit the Angular boundary**

Run:

```bash
pnpm --filter @slotted/angular exec ng test slotted-angular --watch=false --include button/src/button.spec.ts --include button/src/button-link.spec.ts --include button/src/icon-button.spec.ts --include button/src/toggle-button.spec.ts --include button/src/button-group.spec.ts
pnpm --filter @slotted/angular exec node --test button/src/button.styles.test.mjs
pnpm --filter @slotted/angular build
pnpm test:contracts
git diff --check
```

Expected: all Angular family DOM tests, CSS assertions, ng-packagr build, and contract tests pass. Do not run the package-wide story spec until Task 16 replaces the walking-skeleton stories.

Commit Task 12 files as `feat(angular): add button group`.

## Task 13: Create the private Storybook workbench foundation

**Files:**

- Create: `packages/storybook-workbench/package.json`
- Create: `packages/storybook-workbench/tsconfig.json`
- Create: `packages/storybook-workbench/vitest.config.ts`
- Create: `packages/storybook-workbench/src/manager-theme.ts`
- Create: `packages/storybook-workbench/src/manager.ts`
- Create: `packages/storybook-workbench/src/globals.ts`
- Create: `packages/storybook-workbench/src/globals.test.ts`
- Create: `packages/storybook-workbench/src/test/setup.ts`
- Create: `packages/storybook-workbench/src/index.ts`

- [ ] **Step 1: Scaffold a private source-consumed workspace package**

Create `package.json`:

```json
{
  "name": "@slotted/storybook-workbench",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./manager": "./src/manager.ts",
    "./styles.css": "./src/workbench.css",
    "./testing": "./src/testing.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit --pretty false",
    "verify": "pnpm test && pnpm typecheck"
  },
  "dependencies": {
    "@storybook/addon-docs": "10.5.10",
    "react": "19.2.8",
    "storybook": "10.5.10"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "24.13.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "@vitejs/plugin-react": "6.1.1",
    "jsdom": "30.0.1",
    "prettier": "3.9.6",
    "react-dom": "19.2.8",
    "typescript": "6.0.3",
    "vitest": "4.1.11"
  }
}
```

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
```

Install locally bundled fonts into only this private package:

```bash
pnpm --filter @slotted/storybook-workbench add --save-exact @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

Expected: the manifest and lockfile contain exact resolved versions; no remote font URL is introduced.

- [ ] **Step 2: Write failing safe-global tests**

Create `globals.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { INITIAL_GLOBALS, resolveWorkbenchGlobals } from './globals';

describe('resolveWorkbenchGlobals', () => {
  it('returns safe defaults for an absent Storybook context', () => {
    expect(resolveWorkbenchGlobals(undefined)).toEqual({
      background: '#f4f6f8',
      density: 'comfortable',
      scheme: 'light',
      theme: 'default',
    });
  });

  it('resolves supported dark compact values', () => {
    expect(
      resolveWorkbenchGlobals({ theme: 'default', scheme: 'dark', density: 'compact' }),
    ).toEqual({
      background: '#0e1117',
      density: 'compact',
      scheme: 'dark',
      theme: 'default',
    });
  });

  it('keeps initial globals aligned with the resolver', () => {
    expect(resolveWorkbenchGlobals(INITIAL_GLOBALS)).toMatchObject(INITIAL_GLOBALS);
  });
});
```

Run the workbench test and expect a missing-module failure.

- [ ] **Step 3: Implement shared globals without unsafe destructuring**

Create `globals.ts`:

```ts
export const INITIAL_GLOBALS = {
  theme: 'default',
  scheme: 'light',
  density: 'comfortable',
} as const;

export const GLOBAL_TYPES = {
  theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
  scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
  density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
} as const;

type StorybookGlobals = Record<string, unknown> | undefined;

export function resolveWorkbenchGlobals(globals: StorybookGlobals) {
  const theme = globals?.['theme'] === 'default' ? 'default' : 'default';
  const scheme = globals?.['scheme'] === 'dark' ? 'dark' : 'light';
  const density = globals?.['density'] === 'compact' ? 'compact' : 'comfortable';

  return {
    background: scheme === 'dark' ? '#0e1117' : '#f4f6f8',
    density,
    scheme,
    theme,
  } as const;
}
```

Every consumer must call `resolveWorkbenchGlobals(context?.globals)`. Do not destructure `globals` from a callback argument that Storybook may omit; this preserves the Angular runtime fix already proven in the repository.

- [ ] **Step 4: Create and configure the manager theme**

Create `manager-theme.ts`:

```ts
import { create } from 'storybook/theming/create';

export const managerTheme = create({
  base: 'dark',
  brandTitle: 'Slotted Workbench',
  brandUrl: '/',
  brandTarget: '_self',
  colorPrimary: '#8997ff',
  colorSecondary: '#7c8cff',
  appBg: '#0b0e14',
  appContentBg: '#f4f6f8',
  appPreviewBg: '#f4f6f8',
  appBorderColor: '#252b36',
  appBorderRadius: 6,
  textColor: '#e8ecf3',
  textInverseColor: '#11141a',
  barTextColor: '#aeb6c5',
  barSelectedColor: '#a8b2ff',
  barHoverColor: '#ffffff',
  barBg: '#11151d',
  inputBg: '#171c26',
  inputBorder: '#343b48',
  inputTextColor: '#eef1f6',
  inputBorderRadius: 5,
  fontBase: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',
  fontCode: '"JetBrains Mono Variable", ui-monospace, monospace',
});
```

Create `manager.ts`:

```ts
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import { addons } from 'storybook/manager-api';

import { managerTheme } from './manager-theme';

export function configureSlottedManager() {
  addons.setConfig({
    theme: managerTheme,
    sidebar: { showRoots: true },
    toolbar: { title: false },
  });
}
```

- [ ] **Step 5: Export, verify, and commit the foundation**

Create `index.ts` with:

```ts
export { GLOBAL_TYPES, INITIAL_GLOBALS, resolveWorkbenchGlobals } from './globals';
```

Run:

```bash
pnpm install --frozen-lockfile
pnpm --filter @slotted/storybook-workbench verify
git diff --check
```

Expected: three globals tests and workbench typecheck pass.

Commit the new package and `pnpm-lock.yaml` as `feat(storybook): add workbench foundation`.

## Task 14: Build the reference-sheet primitives and workbench styles

**Files:**

- Create: `packages/storybook-workbench/src/framework-badge.tsx`
- Create: `packages/storybook-workbench/src/matrix.tsx`
- Create: `packages/storybook-workbench/src/api-table.tsx`
- Create: `packages/storybook-workbench/src/code-drawer.tsx`
- Create: `packages/storybook-workbench/src/code-drawer.test.tsx`
- Create: `packages/storybook-workbench/src/reference-page.tsx`
- Create: `packages/storybook-workbench/src/scenarios.ts`
- Create: `packages/storybook-workbench/src/scenarios.test.ts`
- Create: `packages/storybook-workbench/src/snippets.ts`
- Create: `packages/storybook-workbench/src/testing.ts`
- Create: `packages/storybook-workbench/src/workbench.css`
- Create: `packages/storybook-workbench/src/workbench.styles.test.mjs`
- Modify: `packages/storybook-workbench/src/index.ts`
- Modify: `packages/storybook-workbench/package.json`

- [ ] **Step 1: Define scenario metadata and prove it matches the contract**

Create `scenarios.ts`:

```ts
export const BUTTON_FAMILY_SCENARIOS = {
  overview: ['matrix', 'themes', 'densities'],
  button: ['playground', 'states', 'content', 'fullWidth', 'loading', 'accessibility'],
  buttonLink: ['playground', 'states', 'routerIntegration', 'accessibility'],
  iconButton: ['playground', 'sizes', 'states', 'loading', 'accessibility'],
  toggleButton: ['playground', 'pressed', 'states', 'accessibility'],
  buttonGroup: ['playground', 'orientations', 'splitAction', 'accessibility'],
} as const;

export type ScenarioPage = keyof typeof BUTTON_FAMILY_SCENARIOS;

export function scenario(id: string) {
  return { slotted: { scenarioId: id } } as const;
}

export function storyScenarioIds(storyModule: Record<string, unknown>) {
  return Object.entries(storyModule)
    .filter(([name]) => name !== 'default')
    .flatMap(([, value]) => {
      if (typeof value !== 'object' || value === null) return [];
      const parameters = Reflect.get(value, 'parameters');
      const slotted =
        typeof parameters === 'object' && parameters !== null
          ? Reflect.get(parameters, 'slotted')
          : undefined;
      const id =
        typeof slotted === 'object' && slotted !== null
          ? Reflect.get(slotted, 'scenarioId')
          : undefined;
      return typeof id === 'string' ? [id] : [];
    });
}

export function scenarioCoverageErrors(
  expected: readonly string[],
  storyModule: Record<string, unknown>,
) {
  const actual = storyScenarioIds(storyModule);
  return [
    ...expected.filter((id) => !actual.includes(id)).map((id) => `missing ${id}`),
    ...actual.filter((id) => !expected.includes(id)).map((id) => `unknown ${id}`),
  ];
}

interface ContractMember {
  capabilities: readonly string[];
  defaults: Record<string, boolean | string>;
}

const capabilityApi = {
  appearance: ['variant', 'tone', 'size'],
  content: ['leading', 'trailing'],
  fullWidth: ['fullWidth'],
  disabled: ['disabled'],
  loading: ['loading'],
  pressed: ['pressed'],
  orientation: ['orientation'],
} as const;

export function apiMetadataErrors(member: ContractMember, rows: readonly { name: string; defaultValue: string }[]) {
  const errors: string[] = [];
  const names = rows.map((row) => row.name);
  for (const capability of member.capabilities) {
    const required = capabilityApi[capability as keyof typeof capabilityApi] ?? [];
    for (const name of required) {
      if (!names.includes(name)) errors.push(`missing API ${name}`);
    }
  }
  for (const [name, value] of Object.entries(member.defaults)) {
    const row = rows.find((candidate) => candidate.name === name);
    if (row === undefined) errors.push(`missing default ${name}`);
    else if (row.defaultValue !== String(value)) {
      errors.push(`default ${name}: expected ${String(value)}, received ${row.defaultValue}`);
    }
  }
  return errors;
}
```

Create a test importing `specs/components/button/contract.json` and asserting `BUTTON_FAMILY_SCENARIOS` deeply equals `contract.scenarios`. Also test missing and unknown story IDs with small fake modules, plus one `apiMetadataErrors` fixture that catches a missing capability row and a wrong default.

- [ ] **Step 2: Define snippets and test-only formatting validation**

Create `snippets.ts`:

```ts
export type SnippetLanguage = 'angular' | 'tsx';

export interface WorkbenchSnippet {
  id: string;
  label: string;
  language: SnippetLanguage;
  source: string;
}

export function defineSnippet(snippet: WorkbenchSnippet): WorkbenchSnippet {
  return Object.freeze({ ...snippet, source: `${snippet.source.trim()}\n` });
}
```

Create `testing.ts`:

```ts
import { check, resolveConfig } from 'prettier';

import type { WorkbenchSnippet } from './snippets';

export async function snippetFormatErrors(snippets: readonly WorkbenchSnippet[]) {
  const errors: string[] = [];
  const config = (await resolveConfig(process.cwd())) ?? {};
  for (const snippet of snippets) {
    const parser = snippet.language === 'angular' ? 'angular' : 'babel-ts';
    try {
      if (!(await check(snippet.source, { ...config, parser }))) {
        errors.push(`unformatted ${snippet.id}`);
      }
    } catch (error) {
      errors.push(`invalid ${snippet.id}: ${String(error)}`);
    }
  }
  return errors;
}
```

This utility belongs to the `./testing` export only. Runtime Docs code never imports Prettier.

- [ ] **Step 3: Test-drive the accessible code drawer**

Create a test with fake timers and a mocked `navigator.clipboard.writeText`. Assert the drawer starts closed, reveals the exact source, writes that exact source, announces `Copied`, resets to `Copy code`, and announces `Copy failed` when both copy paths fail. Add a second test with `navigator.clipboard` absent and `document.execCommand('copy')` mocked to `true`; this covers remote HTTP access through `devserver.local` where the modern Clipboard API may be unavailable.

Implement `code-drawer.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';

import type { WorkbenchSnippet } from './snippets';

export function CodeDrawer({ snippet }: { snippet: WorkbenchSnippet }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function writeSource() {
    if (navigator.clipboard?.writeText !== undefined) {
      try {
        await navigator.clipboard.writeText(snippet.source);
        return;
      } catch {
        // Continue to the synchronous fallback used by remote HTTP dev servers.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = snippet.source;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      textarea.remove();
    }
    if (!copied) throw new Error('Fallback copy failed');
  }

  async function copy() {
    try {
      await writeSource();
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus('idle'), 1800);
  }

  const message =
    status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : '';

  return (
    <details className="slotted-code-drawer">
      <summary>{snippet.label}</summary>
      <div className="slotted-code-drawer__toolbar">
        <span>{snippet.language === 'angular' ? 'Angular' : 'React'}</span>
        <button aria-label={`Copy ${snippet.label}`} onClick={copy} type="button">
          {status === 'copied' ? 'Copied' : 'Copy code'}
        </button>
        <span aria-live="polite" className="slotted-visually-hidden">
          {message}
        </span>
      </div>
      <pre data-language={snippet.language}>
        <code>{snippet.source}</code>
      </pre>
    </details>
  );
}
```

- [ ] **Step 4: Add focused display primitives**

Create `framework-badge.tsx`:

```tsx
export function FrameworkBadge({ framework }: { framework: 'Angular' | 'React' }) {
  return <span className="slotted-framework-badge">{framework}</span>;
}
```

Create `matrix.tsx`:

```tsx
import type { ReactNode } from 'react';

export function WorkbenchMatrix({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly { label: string; cells: readonly ReactNode[] }[];
}) {
  return (
    <div className="slotted-matrix-scroll" role="region" aria-label="Component comparison">
      <div className="slotted-matrix" style={{ '--slotted-columns': columns.length } as never}>
        <div aria-hidden="true" className="slotted-matrix__corner" />
        {columns.map((column) => (
          <div className="slotted-matrix__heading" key={column}>{column}</div>
        ))}
        {rows.flatMap((row) => [
          <div className="slotted-matrix__row-label" key={`${row.label}-label`}>{row.label}</div>,
          ...row.cells.map((cell, index) => (
            <div className="slotted-matrix__cell" key={`${row.label}-${columns[index]}`}>{cell}</div>
          )),
        ])}
      </div>
    </div>
  );
}
```

Create `api-table.tsx`:

```tsx
export interface ApiRow {
  name: string;
  type: string;
  defaultValue: string;
  appliesTo: string;
  description: string;
}

export function ApiTable({ rows }: { rows: readonly ApiRow[] }) {
  return (
    <div className="slotted-api-scroll">
      <table className="slotted-api-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Applies to</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td><code>{row.name}</code></td>
              <td><code>{row.type}</code></td>
              <td><code>{row.defaultValue}</code></td>
              <td>{row.appliesTo}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Create the small `WorkbenchSection` inside `reference-page.tsx`; do not create a generic layout package.

- [ ] **Step 5: Implement the custom reference page factory**

Create `reference-page.tsx` with:

```tsx
import { Canvas } from '@storybook/addon-docs/blocks';
import type { ComponentProps, ReactNode } from 'react';

import { ApiTable } from './api-table';
import type { ApiRow } from './api-table';
import { CodeDrawer } from './code-drawer';
import { FrameworkBadge } from './framework-badge';
import type { WorkbenchSnippet } from './snippets';

type StoryReference = NonNullable<ComponentProps<typeof Canvas>['of']>;

export interface ReferencePageConfig {
  accessibility: readonly string[];
  api: readonly ApiRow[];
  description: string;
  framework: 'Angular' | 'React';
  snippets: readonly WorkbenchSnippet[];
  stories: () => {
    essential: StoryReference;
    matrix?: StoryReference;
  };
  title: string;
  tokens: readonly { name: string; purpose: string }[];
}

function WorkbenchSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="slotted-reference-page__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function TokenTable({ tokens }: { tokens: ReferencePageConfig['tokens'] }) {
  return (
    <div className="slotted-token-scroll">
      <table className="slotted-token-table">
        <thead><tr><th scope="col">Token</th><th scope="col">Purpose</th></tr></thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.name}>
              <td><code>{token.name}</code></td>
              <td>{token.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function createReferencePage(config: ReferencePageConfig) {
  return function ReferencePage() {
    const stories = config.stories();
    return (
      <main className="slotted-reference-page">
        <header className="slotted-reference-page__header">
          <div className="slotted-reference-page__title-row">
            <h1>{config.title}</h1>
            <FrameworkBadge framework={config.framework} />
          </div>
          <p>{config.description}</p>
        </header>
        <WorkbenchSection title="Essential usage">
          <Canvas of={stories.essential} sourceState="none" />
        </WorkbenchSection>
        {stories.matrix === undefined ? null : (
          <WorkbenchSection title="Visual matrix">
            <Canvas of={stories.matrix} sourceState="none" />
          </WorkbenchSection>
        )}
        {config.api.length === 0 ? null : (
          <WorkbenchSection title="API"><ApiTable rows={config.api} /></WorkbenchSection>
        )}
        {config.accessibility.length === 0 ? null : (
          <WorkbenchSection title="Accessibility">
            <ul>{config.accessibility.map((item) => <li key={item}>{item}</li>)}</ul>
          </WorkbenchSection>
        )}
        {config.tokens.length === 0 ? null : (
          <WorkbenchSection title="Public tokens"><TokenTable tokens={config.tokens} /></WorkbenchSection>
        )}
        {config.snippets.length === 0 ? null : (
          <WorkbenchSection title="Code">
            {config.snippets.map((snippet) => <CodeDrawer key={snippet.id} snippet={snippet} />)}
          </WorkbenchSection>
        )}
      </main>
    );
  };
}
```

This factory never renders Storybook's generated `Source` block or a global Controls table.

- [ ] **Step 6: Establish the visual system in one CSS file**

Create `workbench.css` with these stable workbench tokens and layout rules:

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

:root {
  --slotted-workbench-canvas: #f4f6f8;
  --slotted-workbench-panel: #ffffff;
  --slotted-workbench-panel-subtle: #f8f9fb;
  --slotted-workbench-border: #dfe3e9;
  --slotted-workbench-text: #171a21;
  --slotted-workbench-muted: #697386;
  --slotted-workbench-accent: #4d5fd7;
  --slotted-workbench-code: #11151d;
  font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
}

[data-slotted-scheme='dark'] {
  --slotted-workbench-canvas: #0e1117;
  --slotted-workbench-panel: #151922;
  --slotted-workbench-panel-subtle: #191e28;
  --slotted-workbench-border: #2d3441;
  --slotted-workbench-text: #edf0f5;
  --slotted-workbench-muted: #a4adbc;
  --slotted-workbench-accent: #a8b2ff;
  --slotted-workbench-code: #090c11;
}

.slotted-workbench-preview {
  background: var(--slotted-workbench-canvas);
  box-sizing: border-box;
  color: var(--slotted-workbench-text);
  min-block-size: 100vh;
  padding: clamp(16px, 2.5vw, 32px);
}

.slotted-reference-page {
  margin-inline: auto;
  max-inline-size: 1480px;
}

.slotted-reference-page__header,
.slotted-reference-page__section {
  border-block-end: 1px solid var(--slotted-workbench-border);
  padding-block: 24px;
}

.slotted-matrix-scroll {
  max-inline-size: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.slotted-matrix {
  display: grid;
  grid-template-columns: minmax(112px, 0.72fr) repeat(
      var(--slotted-columns),
      minmax(136px, 1fr)
    );
  min-inline-size: max-content;
}

.slotted-matrix__heading,
.slotted-matrix__row-label,
.slotted-matrix__cell {
  align-items: center;
  border-block-end: 1px solid var(--slotted-workbench-border);
  display: flex;
  min-block-size: 56px;
  padding: 10px 12px;
}

.slotted-code-drawer {
  background: var(--slotted-workbench-code);
  border: 1px solid var(--slotted-workbench-border);
  border-radius: 6px;
  color: #eef1f6;
  inline-size: 100%;
}

.slotted-code-drawer pre {
  font: 12.5px/1.65 'JetBrains Mono Variable', ui-monospace, monospace;
  margin: 0;
  overflow: auto;
  padding: 16px 18px 20px;
}

.slotted-visually-hidden {
  block-size: 1px;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  inline-size: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .slotted-workbench-preview {
    padding: 14px;
  }

  .slotted-reference-page__header,
  .slotted-reference-page__section {
    padding-block: 18px;
  }
}
```

Append the remaining presentation rules exactly as a compact baseline:

```css
.slotted-reference-page h1 {
  font-size: clamp(26px, 3vw, 36px);
  letter-spacing: -0.035em;
  line-height: 1.08;
  margin: 0;
}

.slotted-reference-page h2 {
  font-size: 16px;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 0 0 12px;
}

.slotted-reference-page p,
.slotted-reference-page li {
  color: var(--slotted-workbench-muted);
  font-size: 13.5px;
  line-height: 1.62;
}

.slotted-reference-page__title-row {
  align-items: center;
  display: flex;
  gap: 10px;
}

.slotted-framework-badge {
  background: var(--slotted-workbench-panel-subtle);
  border: 1px solid var(--slotted-workbench-border);
  border-radius: 4px;
  color: var(--slotted-workbench-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 6px;
  text-transform: uppercase;
}

.slotted-api-scroll,
.slotted-token-scroll {
  max-inline-size: 100%;
  overflow-x: auto;
}

.slotted-api-table,
.slotted-token-table {
  border-collapse: collapse;
  font-size: 12.5px;
  inline-size: 100%;
  min-inline-size: 680px;
}

.slotted-api-table th,
.slotted-api-table td,
.slotted-token-table th,
.slotted-token-table td {
  border-block-end: 1px solid var(--slotted-workbench-border);
  padding: 10px 12px;
  text-align: start;
  vertical-align: top;
}

.slotted-api-table th,
.slotted-token-table th,
.slotted-matrix__heading,
.slotted-matrix__row-label {
  color: var(--slotted-workbench-muted);
  font-size: 10.5px;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.slotted-api-table code,
.slotted-token-table code {
  font: 11.5px/1.5 'JetBrains Mono Variable', ui-monospace, monospace;
}

.slotted-code-drawer + .slotted-code-drawer {
  margin-block-start: 10px;
}

.slotted-code-drawer summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  list-style-position: inside;
  padding: 12px 14px;
}

.slotted-code-drawer summary:hover,
.slotted-code-drawer summary:focus-visible {
  color: #ffffff;
}

.slotted-code-drawer summary:focus-visible,
.slotted-code-drawer button:focus-visible {
  outline: 2px solid #a8b2ff;
  outline-offset: 2px;
}

.slotted-code-drawer__toolbar {
  align-items: center;
  border-block-start: 1px solid #2d3441;
  color: #9da7b7;
  display: flex;
  font-size: 10.5px;
  justify-content: space-between;
  padding: 8px 12px;
}

.slotted-code-drawer__toolbar button {
  background: #202634;
  border: 1px solid #394253;
  border-radius: 4px;
  color: #eef1f6;
  cursor: pointer;
  font: inherit;
  padding: 5px 8px;
}

.slotted-code-drawer__toolbar button:hover {
  background: #2a3242;
}

.slotted-matrix__cell {
  background: var(--slotted-workbench-panel);
  border-inline-start: 1px solid var(--slotted-workbench-border);
}

.slotted-matrix__heading,
.slotted-matrix__row-label,
.slotted-matrix__corner {
  background: var(--slotted-workbench-panel-subtle);
}

.sbdocs-wrapper,
.sbdocs-content {
  background: var(--slotted-workbench-canvas) !important;
  color: var(--slotted-workbench-text);
  max-inline-size: none !important;
}
```

Do not introduce gradients, large hero spacing, pill-shaped containers, or generic element selectors outside `.slotted-*` and the two explicit Storybook Docs roots.

- [ ] **Step 7: Add static CSS invariants and export the package**

The Node style test reads `workbench.css` and asserts the local font imports, 1480px reference width, local matrix overflow, narrow breakpoint, focus-visible selectors, dark-scheme variables, and visually-hidden utility. Change the package script to:

```json
{
  "scripts": {
    "test": "vitest run && node --test src/workbench.styles.test.mjs"
  }
}
```

Export all runtime primitives, metadata, and snippet types from `index.ts`; keep `snippetFormatErrors` only in `testing.ts`.

Run:

```bash
pnpm --filter @slotted/storybook-workbench verify
git diff --check
```

Expected: globals, scenarios, drawer, CSS, and typecheck all pass.

Commit Task 14 as `feat(storybook): add workbench reference sheets`.

## Task 15: Adopt the workbench in React Storybook

**Files:**

- Modify: `packages/react/package.json`
- Create: `packages/react/src/button/button.docs.ts`
- Create: `packages/react/src/button/button-family.stories.tsx`
- Modify: `packages/react/src/button/button.stories.tsx`
- Create: `packages/react/src/button/button-link.stories.tsx`
- Create: `packages/react/src/button/icon-button.stories.tsx`
- Create: `packages/react/src/button/toggle-button.stories.tsx`
- Create: `packages/react/src/button/button-group.stories.tsx`
- Modify: `packages/react/src/button/button.stories.test.ts`
- Modify: `apps/storybook-react/package.json`
- Modify: `apps/storybook-react/.storybook/main.ts`
- Create: `apps/storybook-react/.storybook/manager.ts`
- Create: `apps/storybook-react/.storybook/config.spec.ts`
- Modify: `apps/storybook-react/.storybook/preview.tsx`
- Modify: `apps/storybook-react/tsconfig.json`
- Create: `apps/storybook-react/vitest.config.ts`

- [ ] **Step 1: Add private development dependencies**

Add `@slotted/storybook-workbench: workspace:*` to React's `devDependencies` and React Storybook's `dependencies`. Add exact `vitest: 4.1.11` to the Storybook app dev dependencies, add `test: vitest run --config vitest.config.ts`, and change its `verify` script to `pnpm test && pnpm typecheck`. Do not add the workbench to React's runtime dependencies, peer dependencies, Vite entry points, or package exports.

Run `pnpm install --reporter=silent` immediately after the manifest edits and include `pnpm-lock.yaml` in the Task 15 commit.

- [ ] **Step 2: Define React reference metadata and curated snippets**

Create `button.docs.ts` exporting one object per navigation page. Use this exact shape:

```ts
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

import { BUTTON_SIZES, BUTTON_TONES } from './button.constants';

type ApiTuple = readonly [
  name: string,
  type: string,
  defaultValue: string,
  appliesTo: string,
  description: string,
];

const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

const toneSuffixes = [
  'solid',
  'solid-hover',
  'solid-active',
  'on-solid',
  'border',
  'text',
  'subtle-hover',
  'subtle-active',
] as const;

export const REACT_BUTTON_TOKENS = [
  '--slotted-control-font-family',
  '--slotted-control-font-weight',
  '--slotted-control-line-height',
  '--slotted-control-letter-spacing',
  '--slotted-control-border-width',
  '--slotted-control-radius',
  '--slotted-control-shadow',
  '--slotted-control-transition-duration',
  '--slotted-control-transition-easing',
  '--slotted-focus-ring-width',
  '--slotted-focus-ring-offset',
  '--slotted-focus-ring-color',
  '--slotted-button-gap',
  '--slotted-button-icon-size',
  '--slotted-button-loading-opacity',
  '--slotted-button-loading-indicator-size',
  '--slotted-button-loading-indicator-stroke-width',
  '--slotted-button-loading-indicator-duration',
  '--slotted-button-group-gap',
  '--slotted-button-group-adjacent-offset',
  '--slotted-button-group-inner-radius',
  '--slotted-button-outline-background',
  '--slotted-button-ghost-background',
  '--slotted-button-ghost-text-decoration',
  '--slotted-disabled-background',
  '--slotted-disabled-foreground',
  '--slotted-disabled-border',
  ...BUTTON_SIZES.flatMap((size) => [
    `--slotted-button-height-${size}`,
    `--slotted-button-padding-inline-${size}`,
    `--slotted-button-font-size-${size}`,
    `--slotted-button-icon-size-${size}`,
  ]),
  ...BUTTON_TONES.flatMap((tone) =>
    toneSuffixes.map((suffix) => `--slotted-tone-${tone}-${suffix}`),
  ),
].map((name) => ({ name, purpose: 'Theme-owned Button family decision' }));

export const REACT_BUTTON_DOCS = {
  button: {
    api: apiRows([
      ['variant', 'solid | outline | ghost', 'solid', 'Button', 'Visual emphasis'],
      ['tone', 'neutral | accent | success | warning | danger', 'accent', 'Button', 'Semantic intent'],
      ['size', 'sm | md | lg', 'md', 'Button', 'Control scale'],
      ['leading', 'ReactNode', '—', 'Button', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'Button', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'Button', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'Button', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'Button', 'Controlled busy state'],
      ['loadingText', 'ReactNode', '—', 'Button', 'Explicit busy label'],
      ['loadingIndicator', 'ReactNode', 'spinner', 'Button', 'Replacement indicator'],
      ['type', 'button | submit | reset', 'button', 'Button', 'Native button type'],
    ]),
    accessibility: [
      'Visible label supplies the accessible name.',
      'Loading preserves focus, sets aria-busy and aria-disabled, and blocks activation.',
      'Use submit only for an intentional form submission.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-basic',
        label: 'Basic action',
        language: 'tsx',
        source: `<Button tone="accent" leading={<SaveIcon />}>Save changes</Button>;`,
      }),
      defineSnippet({
        id: 'react-button-loading',
        label: 'Controlled loading',
        language: 'tsx',
        source: `<Button loading={saving} loadingText="Saving">Save</Button>;`,
      }),
    ],
  },
  buttonLink: {
    api: apiRows([
      ['href', 'string', 'required in native mode', 'ButtonLink', 'Native navigation destination'],
      ['render', '(rootProps) => ReactElement', '—', 'ButtonLink', 'Router-owned link adapter'],
      ['disabled', 'boolean', 'false', 'ButtonLink', 'Suppress navigation and sequential focus'],
      ['variant', 'solid | outline | ghost', 'solid', 'ButtonLink', 'Visual emphasis'],
      ['tone', 'ButtonTone', 'accent', 'ButtonLink', 'Semantic intent'],
      ['size', 'sm | md | lg', 'md', 'ButtonLink', 'Control scale'],
      ['leading', 'ReactNode', '—', 'ButtonLink', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'ButtonLink', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'ButtonLink', 'Fill the inline container'],
    ]),
    accessibility: [
      'Use ButtonLink only for navigation.',
      'Disabled navigation sets aria-disabled, suppresses activation, and defaults to tabIndex -1.',
      'The render adapter must preserve every supplied root prop and accessible name.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-link-native',
        label: 'Native navigation',
        language: 'tsx',
        source: `<ButtonLink href="/settings">Settings</ButtonLink>;`,
      }),
      defineSnippet({
        id: 'react-button-link-router',
        label: 'Router-owned navigation',
        language: 'tsx',
        source: `<ButtonLink render={(props) => <RouterLink to="/settings" {...props} />}>Settings</ButtonLink>;`,
      }),
    ],
  },
  iconButton: {
    api: apiRows([
      ['aria-label | aria-labelledby', 'string', 'required', 'IconButton', 'Explicit accessible name'],
      ['variant', 'solid | outline | ghost', 'ghost', 'IconButton', 'Visual emphasis'],
      ['tone', 'ButtonTone', 'neutral', 'IconButton', 'Semantic intent'],
      ['size', 'sm | md | lg', 'md', 'IconButton', 'Square control scale'],
      ['fullWidth', 'boolean', 'false', 'IconButton', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'IconButton', 'Native disabled state'],
      ['loading', 'boolean', 'false', 'IconButton', 'Controlled busy state'],
      ['loadingIndicator', 'ReactNode', 'spinner', 'IconButton', 'Replacement indicator'],
      ['type', 'button | submit | reset', 'button', 'IconButton', 'Native button type'],
    ]),
    accessibility: [
      'An explicit aria-label or aria-labelledby is mandatory.',
      'The visible icon is decorative relative to that accessible name.',
      'Loading preserves the explicit accessible name and focus.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-icon-button',
        label: 'Named icon action',
        language: 'tsx',
        source: `
<IconButton aria-label="Close" variant="ghost">
  <CloseIcon />
</IconButton>;
`,
      }),
    ],
  },
  toggleButton: {
    api: apiRows([
      ['pressed', 'boolean', 'false', 'ToggleButton', 'Controlled pressed state'],
      ['onPressedChange', '(next: boolean) => void', '—', 'ToggleButton', 'Requests the next state'],
      ['variant', 'solid | outline | ghost', 'outline', 'ToggleButton', 'Visual emphasis'],
      ['tone', 'ButtonTone', 'neutral', 'ToggleButton', 'Semantic intent'],
      ['size', 'sm | md | lg', 'md', 'ToggleButton', 'Control scale'],
      ['leading', 'ReactNode', '—', 'ToggleButton', 'Logical leading content'],
      ['trailing', 'ReactNode', '—', 'ToggleButton', 'Logical trailing content'],
      ['fullWidth', 'boolean', 'false', 'ToggleButton', 'Fill the inline container'],
      ['disabled', 'boolean', 'false', 'ToggleButton', 'Native disabled state'],
      ['type', 'button | submit | reset', 'button', 'ToggleButton', 'Native button type'],
    ]),
    accessibility: [
      'aria-pressed always reflects the controlled pressed prop.',
      'The label describes the toggled feature rather than its next action.',
      'Disabled toggles do not request state changes.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-toggle-button',
        label: 'Controlled toggle',
        language: 'tsx',
        source: `
<ToggleButton pressed={pinned} onPressedChange={setPinned}>
  Pin
</ToggleButton>;
`,
      }),
    ],
  },
  buttonGroup: {
    api: apiRows([
      ['orientation', 'horizontal | vertical', 'horizontal', 'ButtonGroup', 'Logical group direction'],
      ['aria-label | aria-labelledby', 'string', 'contextual', 'ButtonGroup', 'Names the related action set'],
    ]),
    accessibility: [
      'Name the group when surrounding context does not already identify it.',
      'Children retain their own button or link semantics and tab order.',
      'A split-action example does not imply menu keyboard behavior.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-group',
        label: 'Grouped actions',
        language: 'tsx',
        source: `
<ButtonGroup aria-label="Editing actions">
  <Button>Save</Button>
  <IconButton aria-label="More save options">
    <MoreIcon />
  </IconButton>
</ButtonGroup>;
`,
      }),
    ],
  },
} as const;
```

Pass `REACT_BUTTON_TOKENS` to every member reference page. Do not expose internal `--_` variables.

- [ ] **Step 3: Write the failing story/scenario/snippet test**

Replace `button.stories.test.ts` with imports for all six story modules and `REACT_BUTTON_DOCS`. For each page, assert `scenarioCoverageErrors(BUTTON_FAMILY_SCENARIOS[page], module)` is empty. For each component member, assert `apiMetadataErrors(contract.members[page], REACT_BUTTON_DOCS[page].api)` is empty. Flatten all snippet arrays and assert `await snippetFormatErrors(snippets)` is empty.

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.stories.test.ts
```

Expected: FAIL because the new modules and scenario parameters do not exist.

- [ ] **Step 4: Build the full-width overview matrix**

Create `button-family.stories.tsx` with title `Components/Button family/Overview`, no Controls, and three exports carrying `scenario('matrix')`, `scenario('themes')`, and `scenario('densities')`.

The Matrix story uses `WorkbenchMatrix` with columns `Neutral`, `Accent`, `Success`, `Warning`, `Danger`; rows `Solid`, `Outline`, and `Ghost`; and a `Button` in every cell. After the main matrix, render compact rows for sizes, disabled/loading, icon positions, and a composed split action:

```tsx
<ButtonGroup aria-label="Save actions">
  <Button leading={<SaveIcon />}>Save</Button>
  <IconButton aria-label="More save options">⌄</IconButton>
</ButtonGroup>
```

Themes renders the same representative action in light and dark themed panels. Densities renders comfortable and compact panels. Use inline SVG story icons with `aria-hidden="true"`; add no icon-package dependency.

- [ ] **Step 5: Create one native story module per family member**

Use these exact titles and named scenario exports:

| File | Title | Exports / scenario IDs |
| --- | --- | --- |
| `button.stories.tsx` | `Components/Button family/Button` | `Playground/playground`, `States/states`, `Content/content`, `FullWidth/fullWidth`, `Loading/loading`, `Accessibility/accessibility` |
| `button-link.stories.tsx` | `Components/Button family/ButtonLink` | `Playground/playground`, `States/states`, `RouterIntegration/routerIntegration`, `Accessibility/accessibility` |
| `icon-button.stories.tsx` | `Components/Button family/IconButton` | `Playground/playground`, `Sizes/sizes`, `States/states`, `Loading/loading`, `Accessibility/accessibility` |
| `toggle-button.stories.tsx` | `Components/Button family/ToggleButton` | `Playground/playground`, `Pressed/pressed`, `States/states`, `Accessibility/accessibility` |
| `button-group.stories.tsx` | `Components/Button family/ButtonGroup` | `Playground/playground`, `Orientations/orientations`, `SplitAction/splitAction`, `Accessibility/accessibility` |

Each meta disables Controls by default. Only `Playground` sets `controls.disable: false`. Each meta sets `docs.page` to `createReferencePage(...)`, closes over its named story exports through the `stories` callback, and passes framework `React`, exact API rows, accessibility notes, public tokens, and snippets from `button.docs.ts`. Set every Canvas in the reference factory to `sourceState="none"` so artificial generated source is not offered.

States show only representative defaults, disabled, loading, and pressed combinations; do not render the Cartesian product again. `RouterIntegration` uses the narrow render adapter with a router-like native anchor and no router package. `SplitAction` stops at the menu-trigger icon and does not render a popup.

- [ ] **Step 6: Install the shared manager and preview presentation**

Create `.storybook/manager.ts`:

```ts
import { configureSlottedManager } from '@slotted/storybook-workbench/manager';

configureSlottedManager();
```

Replace `preview.tsx` with shared CSS/globals and this safe decorator core:

```tsx
const preview: Preview = {
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    (Story, context) => {
      const values = resolveWorkbenchGlobals(context?.globals);
      return (
        <div
          className="slotted-workbench-preview"
          data-slotted-density={values.density}
          data-slotted-scheme={values.scheme}
          data-slotted-theme={values.theme}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    a11y: { test: 'off' },
    controls: { expanded: false },
    docs: { source: { state: 'none' }, toc: true },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Components', ['Button family', ['Overview', 'Button', 'ButtonLink', 'IconButton', 'ToggleButton', 'ButtonGroup']]],
      },
    },
  },
};
```

Keep imports for tokens, default theme, and React styles, then import workbench styles last. Update `main.ts` with `docs: { defaultName: 'Reference' }`. Preserve the existing Storybook 10 renderer and addons.

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['.storybook/**/*.spec.ts'] },
});
```

Create `.storybook/config.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

describe('React Storybook remote development server', () => {
  it('binds all interfaces on the documented port', () => {
    expect(manifest.scripts.dev).toContain('--host 0.0.0.0');
    expect(manifest.scripts.dev).toContain('--port 6006');
    expect(manifest.scripts.dev).toContain('--no-open');
  });
});
```

- [ ] **Step 7: Verify React stories and the static app build**

Run:

```bash
pnpm --filter @slotted/react test
pnpm --filter @slotted/react typecheck
pnpm --filter @slotted/storybook-react test
pnpm --filter @slotted/storybook-react typecheck
pnpm --filter @slotted/storybook-react build:storybook
test -f apps/storybook-react/dist/index.html
git diff --check
```

Expected: scenario and snippet validation pass, the static build exits `0`, and `index.html` exists. Do not open Playwright or collect screenshots.

Commit Task 15 as `docs(react): adopt storybook workbench`.

## Task 16: Adopt the same workbench in Angular Storybook

**Files:**

- Modify: `packages/angular/package.json`
- Create: `packages/angular/button/src/button.docs.ts`
- Create: `packages/angular/button/src/button-family.stories.ts`
- Modify: `packages/angular/button/src/button.stories.ts`
- Create: `packages/angular/button/src/button-link.stories.ts`
- Create: `packages/angular/button/src/icon-button.stories.ts`
- Create: `packages/angular/button/src/toggle-button.stories.ts`
- Create: `packages/angular/button/src/button-group.stories.ts`
- Modify: `packages/angular/button/src/button.stories.spec.ts`
- Modify: `apps/storybook-angular/package.json`
- Modify: `apps/storybook-angular/.storybook/main.ts`
- Create: `apps/storybook-angular/.storybook/manager.ts`
- Modify: `apps/storybook-angular/.storybook/preview.ts`
- Modify: `apps/storybook-angular/.storybook/preview.spec.ts`
- Modify: `apps/storybook-angular/tsconfig.json`

- [ ] **Step 1: Add only development-time workbench and router dependencies**

Add `@slotted/storybook-workbench: workspace:*` to Angular package dev dependencies and Angular Storybook dependencies. Add exact `@angular/router: 22.1.4` to Angular package dev dependencies for story compilation and to the Angular Storybook app for rendering. Do not add Router to `@slotted/angular` peers or runtime dependencies.

Run `pnpm install --reporter=silent` immediately after the manifest edits and include `pnpm-lock.yaml` in the Task 16 commit.

- [ ] **Step 2: Create Angular-native reference metadata and snippets**

Create `button.docs.ts` with the same semantic descriptions, accessibility guidance, and public token list as React, but Angular API names and minimal native templates:

```ts
const snippets = [
  defineSnippet({
    id: 'angular-button-basic',
    label: 'Basic action',
    language: 'angular',
    source: `<button slButton tone="accent"><app-save-icon slButtonLeading />Save changes</button>`,
  }),
  defineSnippet({
    id: 'angular-button-loading',
    label: 'Controlled loading',
    language: 'angular',
    source: `<button slButton [loading]="saving" loadingText="Saving">Save</button>`,
  }),
  defineSnippet({
    id: 'angular-button-link-router',
    label: 'Router navigation',
    language: 'angular',
    source: `<a slButtonLink routerLink="/settings">Settings</a>`,
  }),
  defineSnippet({
    id: 'angular-icon-button',
    label: 'Named icon action',
    language: 'angular',
    source: `<button slIconButton aria-label="Close"><app-close-icon /></button>`,
  }),
  defineSnippet({
    id: 'angular-toggle-button',
    label: 'Controlled toggle',
    language: 'angular',
    source: `<button slToggleButton [(pressed)]="pinned">Pin</button>`,
  }),
  defineSnippet({
    id: 'angular-button-group',
    label: 'Grouped actions',
    language: 'angular',
    source: `
<div slButtonGroup aria-label="Editing actions">
  <button slButton>Save</button>
  <button slIconButton aria-label="More save options">
    <app-more-icon />
  </button>
</div>
`,
  }),
];
```

Build `ApiRow[]` with the local tuple helper used in the React metadata and these exact rows/defaults:

| Page | Required API rows |
| --- | --- |
| Button | `variant=solid`, `tone=accent`, `size=md`, `fullWidth=false`, `disabled=false`, `loading=false`, `loadingText=—`, `type=button`, `leading ([slButtonLeading])`, `trailing ([slButtonTrailing])`, `[slButtonLoadingIndicator]` |
| ButtonLink | `variant=solid`, `tone=accent`, `size=md`, `fullWidth=false`, `disabled=false`, `tabIndex=automatic`, `href/routerLink`, `leading ([slButtonLeading])`, `trailing ([slButtonTrailing])` |
| IconButton | `aria-label/aria-labelledby=required`, `variant=ghost`, `tone=neutral`, `size=md`, `fullWidth=false`, `disabled=false`, `loading=false`, `type=button`, `[slButtonLoadingIndicator]` |
| ToggleButton | `pressed=false`, `pressedChange=—`, `variant=outline`, `tone=neutral`, `size=md`, `fullWidth=false`, `disabled=false`, `type=button`, `leading ([slButtonLeading])`, `trailing ([slButtonTrailing])` |
| ButtonGroup | `orientation=horizontal`, `aria-label/aria-labelledby=contextual` |

Use the exact camel-case contract names (`fullWidth`, `pressed`) for rows checked by `apiMetadataErrors`, while descriptions show Angular binding syntax. Do not translate React prop names into Angular prose or claim `routerLink` is owned by Slotted.

- [ ] **Step 3: Replace the parity test with all Angular pages**

Update `button.stories.spec.ts` to import all six modules, compare their scenario IDs to `BUTTON_FAMILY_SCENARIOS`, validate every Angular API array with `apiMetadataErrors`, and run `snippetFormatErrors` over every Angular snippet. First run must fail on missing modules or IDs.

- [ ] **Step 4: Build the Angular-native dense matrix and member stories**

Create these Angular-native page titles and named exports:

| File | Title | Exports / scenario IDs |
| --- | --- | --- |
| `button-family.stories.ts` | `Components/Button family/Overview` | `Matrix/matrix`, `Themes/themes`, `Densities/densities` |
| `button.stories.ts` | `Components/Button family/Button` | `Playground/playground`, `States/states`, `Content/content`, `FullWidth/fullWidth`, `Loading/loading`, `Accessibility/accessibility` |
| `button-link.stories.ts` | `Components/Button family/ButtonLink` | `Playground/playground`, `States/states`, `RouterIntegration/routerIntegration`, `Accessibility/accessibility` |
| `icon-button.stories.ts` | `Components/Button family/IconButton` | `Playground/playground`, `Sizes/sizes`, `States/states`, `Loading/loading`, `Accessibility/accessibility` |
| `toggle-button.stories.ts` | `Components/Button family/ToggleButton` | `Playground/playground`, `Pressed/pressed`, `States/states`, `Accessibility/accessibility` |
| `button-group.stories.ts` | `Components/Button family/ButtonGroup` | `Playground/playground`, `Orientations/orientations`, `SplitAction/splitAction`, `Accessibility/accessibility` |

Use Angular templates and `moduleMetadata` imports; do not render React product components inside a Canvas.

The overview Matrix uses `.slotted-matrix` markup with `style="--slotted-columns: 5"`, the five tone headings, and three variant rows. Every cell contains a native `<button slButton ...>`. Follow it with native size/state/content/group rows. Themes and Densities use the same shared data attributes as React.

For `RouterIntegration`, import `RouterLink`, add `provideRouter([])` through `applicationConfig`, and render `<a slButtonLink routerLink="/settings">Settings</a>`. For the split-action story, stop at the native menu-trigger `SlIconButton`.

Each meta uses the same custom `createReferencePage`, controls policy, API/token metadata, and curated code drawers as React with framework badge `Angular`.

- [ ] **Step 5: Reuse manager configuration and safely wrap Angular stories**

Create the same two-line `.storybook/manager.ts` as React. In `preview.ts`, import workbench styles last and configure:

```ts
const preview: Preview = {
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="slotted-workbench-preview" [attr.data-slotted-theme]="slottedTheme" [attr.data-slotted-scheme]="slottedScheme" [attr.data-slotted-density]="slottedDensity">${story}</div>`,
      (context) => {
        const values = resolveWorkbenchGlobals(context?.globals);
        return {
          slottedDensity: values.density,
          slottedScheme: values.scheme,
          slottedTheme: values.theme,
        };
      },
    ),
  ],
  parameters: {
    a11y: { test: 'off' },
    controls: { expanded: false },
    docs: { source: { state: 'none' }, toc: true },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Components', ['Button family', ['Overview', 'Button', 'ButtonLink', 'IconButton', 'ToggleButton', 'ButtonGroup']]],
      },
    },
  },
};
```

Update `preview.spec.ts` to call the decorator's props callback with light/default, dark/compact, and `undefined`, proving it never reads `.globals` from an absent context. In the same file, read `../package.json` relative to the spec and assert the `dev` script contains `--host 0.0.0.0`, `--port 6007`, and `--no-open`. Update `main.ts` with `docs.defaultName = 'Reference'` and include all new story files through the existing glob.

- [ ] **Step 6: Verify Angular stories and the static app build**

Run:

```bash
pnpm --filter @slotted/angular test
pnpm --filter @slotted/angular typecheck
pnpm --filter @slotted/storybook-angular test
pnpm --filter @slotted/storybook-angular typecheck
pnpm --filter @slotted/storybook-angular build:storybook
test -f apps/storybook-angular/dist/index.html
git diff --check
```

Expected: scenario/snippet parity, the `globals` regression test, Angular compiler, and static Storybook build all pass without a browser session.

Commit Task 16 as `docs(angular): adopt storybook workbench`.

## Task 17: Integrate, inspect once, and close the phase

**Files:**

- Modify: `README.md`
- Modify: `packages/react/README.md` if integration exposed a correction
- Modify: `packages/angular/README.md` if integration exposed a correction
- Modify: `docs/superpowers/plans/2026-08-28-button-04-composition-pages.md` — mark it deferred behind the accepted workbench baseline without executing it.

- [ ] **Step 1: Prove no private workbench code leaked into library artifacts**

Run:

```bash
pnpm --filter @slotted/react build
pnpm --filter @slotted/angular build
! rg -n "storybook-workbench|@storybook|fontsource" packages/react/dist packages/angular/dist
```

Expected: both builds pass and `rg` returns no matches.

- [ ] **Step 2: Run the proportional full deterministic gate once**

Run:

```bash
pnpm check:full
pnpm --filter @slotted/storybook-react build:storybook
pnpm --filter @slotted/storybook-angular build:storybook
git diff --check
```

Expected: every workspace `verify` task passes, both static builds exit `0`, and diff validation is silent.

- [ ] **Step 3: Run the frontend craft-floor detector once**

Run exactly once across both applications:

```bash
node /home/dreco/.agents/skills/impeccable/scripts/craft.mjs --target apps
```

Expected: no blocking generic frontend craft-floor issue. Treat any finding as a source-level audit lead; do not respond by launching screenshot automation.

- [ ] **Step 4: Start both remotely reachable development servers for one human review**

Run in separate persistent terminals:

```bash
pnpm --filter @slotted/storybook-react dev
pnpm --filter @slotted/storybook-angular dev
```

Confirm from server logs that React listens on `0.0.0.0:6006` and Angular on `0.0.0.0:6007`. Ask the human to inspect:

```text
http://devserver.local:6006/?path=/story/components-button-family-overview--matrix
http://devserver.local:6007/?path=/story/components-button-family-overview--matrix
```

Review only these material criteria: dense scanning, narrow viewport behavior, light/dark and comfortable/compact globals, all five tones, danger contrast, code formatting/copy, focus visibility, loading width, group seams, and React/Angular consistency. Record concrete feedback; do not manufacture a pass from automated screenshots.

- [ ] **Step 5: Update current project guidance after acceptance**

Update root README commands and current status:

```markdown
pnpm --filter @slotted/storybook-react dev   # 0.0.0.0:6006
pnpm --filter @slotted/storybook-angular dev # 0.0.0.0:6007
```

State that Storybook is the internal workbench, not public documentation. In the old composition/Pages plan, add a top status note: `Deferred until the Button-family workbench baseline is accepted; do not execute as part of this phase.` Do not delete the earlier plan.

- [ ] **Step 6: Re-run only checks affected by visual-review corrections**

For CSS or stories, run the affected package test/typecheck and its one static Storybook build. For component behavior, run the affected member test and framework verify. If no correction was required, do not repeat Task 17 Step 2.

- [ ] **Step 7: Commit integration documentation and report evidence**

Run:

```bash
git status --short
git diff --check
```

Commit only actual final documentation or review corrections:

```bash
git add README.md packages/react/README.md packages/angular/README.md docs/superpowers/plans/2026-08-28-button-04-composition-pages.md
git commit -m "docs: close button workbench phase"
```

If one of those files did not change, omit it from `git add`. Report the exact focused checks, full gate, two static builds, remote URLs, and human visual-review result. Do not claim npm, Pages, composition, public docs, browser automation, or the next component was delivered.
