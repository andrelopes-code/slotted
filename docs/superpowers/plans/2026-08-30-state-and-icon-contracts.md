# Public State and Icon Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-valued `data-state` attribute with independent boolean state attributes so states combine, keep a disabled toggle's pressed value visible, and widen the icon slot contract so any icon source fits, not only a direct `svg` child.

**Architecture:** `specs/components/button/contract.json` gains the state-attribute vocabulary and becomes the source the style test keys off. The shared stylesheet, both framework packages, and every affected test change together in one commit, because a public attribute contract cannot be half-migrated. Two follow-on tasks fix the defects the migration exposes.

**Tech Stack:** pnpm workspaces, Turborepo, Vitest, `node:test`, jsdom, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-08-30-layered-architecture-design.md`, sections "State Attributes" and "Icons".

## Global Constraints

- Node `>=24 <25`; pnpm `11.24.0`.
- Namespace is `slotted`: `--slotted-*`, `.slotted-*`, `data-slotted-*`, `@slotted/*`, Angular selectors prefixed `sl`.
- Boolean state attributes are present-or-absent with an empty string value, matching the existing `data-full-width` precedent: `'' : undefined` in React, `"'' : null"` in Angular.
- All library component CSS lives inside `@layer slotted.components`.
- Layer ranks are unchanged; `pnpm test:layers` must stay green.
- `pnpm format:check` and `pnpm lint --max-warnings=0` pass at every commit.
- The full gate is `pnpm check:full`.
- No new runtime dependency. `jsdom` may be added to `@slotted/styles` as a development dependency only.
- Colour decisions use existing tokens. Any foreground-on-background pair must clear 4.5:1; any non-text boundary must clear 3:1.

---

## File Structure

**Modified**

| File | Change |
| --- | --- |
| `specs/components/button/contract.json` | Adds `stateAttributes`; bumps `schemaVersion` to 4 |
| `specs/components/button/contract.test.mjs` | Asserts the new field and version |
| `packages/styles/src/button/button.css` | Boolean state selectors; pressed-disabled border; widened icon slots |
| `packages/styles/src/button/button-group.css` | Boolean state selector |
| `packages/styles/src/button/button.styles.test.mjs` | Reads selectors from the contract; adds the four-shape icon test |
| `packages/styles/package.json` | Adds `jsdom` as a development dependency |
| `packages/react/src/button/button-root.ts` | `appearanceData` emits boolean attributes |
| `packages/react/src/button/button.tsx` | Passes booleans instead of a state string |
| `packages/react/src/button/button-link.tsx` | Same |
| `packages/react/src/button/icon-button.tsx` | Same |
| `packages/react/src/button/toggle-button.tsx` | Same |
| `packages/react/src/button/*.test.tsx` | Assert the new attributes |
| `packages/angular/button/src/button-appearance.ts` | Replaces `buttonState` with boolean helpers |
| `packages/angular/button/src/button.ts` | Host bindings emit boolean attributes |
| `packages/angular/button/src/button-link.ts` | Same |
| `packages/angular/button/src/icon-button.ts` | Same |
| `packages/angular/button/src/toggle-button.ts` | Same |
| `packages/angular/button/src/*.spec.ts` | Assert the new attributes |

---

### Task 1: Record the state attribute vocabulary in the contract

The style test currently hardcodes a map from conceptual state names to CSS selectors. Moving the attribute names into the contract removes that drift and gives both frameworks one place to read them from.

**Files:**

- Modify: `specs/components/button/contract.json`
- Modify: `specs/components/button/contract.test.mjs`

**Interfaces:**

- Produces: `contract.stateAttributes`, an object mapping each stateful state name to its DOM attribute — `{ "disabled": "data-disabled", "loading": "data-loading", "pressed": "data-pressed" }`. States that are pseudo-class driven — `default`, `hover`, `active`, `focus-visible` — are absent by design, because no attribute expresses them.

- [ ] **Step 1: Write the failing test**

Add to `specs/components/button/contract.test.mjs`:

```js
test('maps every attribute-driven state to a boolean data attribute', () => {
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    loading: 'data-loading',
    pressed: 'data-pressed',
  });

  const pseudoStates = new Set(['default', 'hover', 'active', 'focus-visible']);
  const declaredStates = new Set(
    Object.values(contract.members).flatMap((member) => member.states),
  );

  for (const state of declaredStates) {
    if (pseudoStates.has(state)) {
      assert.ok(!(state in contract.stateAttributes), `${state} must not have an attribute`);
      continue;
    }
    assert.ok(state in contract.stateAttributes, `${state} needs an attribute`);
  }
});
```

Change the existing version assertion in the same file from `assert.equal(contract.schemaVersion, 3);` to:

```js
  assert.equal(contract.schemaVersion, 4);
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test specs/components/button/contract.test.mjs`
Expected: FAIL twice — `schemaVersion` is 3, and `contract.stateAttributes` is `undefined`.

- [ ] **Step 3: Write the contract change**

In `specs/components/button/contract.json`, set `"schemaVersion": 4` and insert `stateAttributes` immediately after `orientations`:

```json
  "stateAttributes": {
    "disabled": "data-disabled",
    "loading": "data-loading",
    "pressed": "data-pressed"
  },
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `node --test specs/components/button/contract.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
pnpm format:check
git add specs/components/button
git commit -m "feat(contract): record the button state attribute vocabulary"
```

---

### Task 2: Replace `data-state` with independent boolean attributes

This task is deliberately not split by package. `data-state` is a public attribute read by the shared stylesheet and written by both frameworks; migrating one side alone leaves the library rendering incorrectly between commits.

The defect being fixed is in both frameworks' state derivation:

```ts
const state = disabled ? 'disabled' : pressed ? 'pressed' : undefined;
```

A pressed and disabled toggle therefore never matches `[data-state='pressed']`.

**Files:**

- Modify: `packages/styles/src/button/button.css`
- Modify: `packages/styles/src/button/button-group.css`
- Modify: `packages/styles/src/button/button.styles.test.mjs`
- Modify: `packages/react/src/button/button-root.ts`
- Modify: `packages/react/src/button/{button,button-link,icon-button,toggle-button}.tsx`
- Modify: `packages/react/src/button/{button,button-link,icon-button,toggle-button}.test.tsx`
- Modify: `packages/angular/button/src/button-appearance.ts`
- Modify: `packages/angular/button/src/{button,button-link,icon-button,toggle-button}.ts`
- Modify: `packages/angular/button/src/*.spec.ts` where they assert `data-state`

**Interfaces:**

- Consumes: `contract.stateAttributes` from Task 1.
- Produces: React `appearanceData(options)` taking `disabled: boolean`, `loading: boolean`, `pressed: boolean` in place of `state: ButtonState`, and returning `'data-disabled' | 'data-loading' | 'data-pressed'` as `'' | undefined`. Angular exports `stateAttribute(active: boolean): '' | null` from `button-appearance.ts`; `buttonState` and the `ButtonState` type are removed.

- [ ] **Step 1: Write the failing test**

Add to `packages/react/src/button/toggle-button.test.tsx`, inside the existing `describe('ToggleButton')`:

```tsx
it('keeps the pressed value visible while disabled', () => {
  render(
    <ToggleButton disabled pressed>
      Pin
    </ToggleButton>,
  );

  const button = screen.getByRole('button', { name: 'Pin' });
  expect(button).toHaveAttribute('data-pressed', '');
  expect(button).toHaveAttribute('data-disabled', '');
  expect(button).not.toHaveAttribute('data-state');
});
```

Add the equivalent to `packages/angular/button/src/toggle-button.spec.ts`, following the rendering pattern already used in that file:

```ts
it('keeps the pressed value visible while disabled', () => {
  const fixture = TestBed.createComponent(ToggleButtonHost);
  fixture.componentRef.setInput('disabled', true);
  fixture.componentRef.setInput('pressed', true);
  fixture.detectChanges();

  const button = fixture.nativeElement.querySelector('button');
  expect(button.getAttribute('data-pressed')).toBe('');
  expect(button.getAttribute('data-disabled')).toBe('');
  expect(button.hasAttribute('data-state')).toBe(false);
});
```

Read the existing spec file first and reuse its host component and input-setting idiom rather than inventing a new one; if that file drives inputs through a template host instead of `setInput`, follow the template idiom.

- [ ] **Step 2: Run them to make sure they fail**

```bash
pnpm --filter @slotted/react exec vitest run src/button/toggle-button.test.tsx
pnpm --filter @slotted/angular exec ng test slotted-angular --watch=false
```

Expected: both FAIL. The element carries `data-state="disabled"` and no boolean attributes.

- [ ] **Step 3: Migrate the stylesheet**

In `packages/styles/src/button/button.css`, make exactly these substitutions:

- `[data-state='pressed']` becomes `[data-pressed]` — 7 occurrences, one on line 109 and six inside the `:not(...)` guards of the hover and active rules.
- `.slotted-button[data-state='disabled']` becomes `.slotted-button[data-disabled]` — line 161.
- `.slotted-button[data-state='loading']` becomes `.slotted-button[data-loading]` — line 192.

Keep the `data-slotted-component='toggle-button'` qualifier on line 109. Dropping it would lower that rule's specificity from `0,3,0` to `0,2,0`, and specificity is doing real work here relative to the fill rules that follow.

In `packages/styles/src/button/button-group.css`, line 37, apply the same `[data-state='pressed']` to `[data-pressed]` substitution.

- [ ] **Step 4: Drive the style test from the contract**

In `packages/styles/src/button/button.styles.test.mjs`, replace the hardcoded `disabled`, `loading`, and `pressed` entries of the `selectors` object with values built from the contract, so the test fails if the contract and the stylesheet drift apart:

```js
    disabled: `[${contract.stateAttributes.disabled}]`,
    loading: `[${contract.stateAttributes.loading}]`,
    pressed: `[${contract.stateAttributes.pressed}]`,
```

In the same file, the relocated `keeps pressed toggle surfaces outside generic interactive selectors` test asserts `:not\(\[data-state='pressed'\]\)`. Change that assertion to:

```js
    assert.match(header.replace(/\s+/g, ''), /:not\(\[data-pressed\]\)/);
```

- [ ] **Step 5: Migrate the React package**

In `packages/react/src/button/button-root.ts`, delete the `ButtonState` type and change `appearanceData`:

```ts
export function appearanceData(options: {
  component: string;
  disabled?: boolean;
  fill: ButtonFill;
  fullWidth: boolean;
  loading?: boolean;
  pressed?: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
}) {
  return {
    'data-disabled': options.disabled ? '' : undefined,
    'data-fill': options.fill,
    'data-full-width': options.fullWidth ? '' : undefined,
    'data-loading': options.loading ? '' : undefined,
    'data-pressed': options.pressed ? '' : undefined,
    'data-size': options.size,
    'data-slotted-component': options.component,
    'data-variant': options.variant,
  } as const;
}
```

In each of the four components, delete the `const state = ...` line and pass the booleans through instead of `state`:

- `button.tsx`: `disabled, loading` — it has both.
- `button-link.tsx`: `disabled: interactionBlocked` — the link's disabled surface already derives from `interactionBlocked`, which folds in `aria-disabled`.
- `icon-button.tsx`: `disabled, loading`.
- `toggle-button.tsx`: `disabled, pressed`.

Update every `data-state` assertion in `packages/react/src/button/*.test.tsx` to the corresponding boolean attribute. The existing assertions are one in `button.test.tsx`, one in `icon-button.test.tsx`, three in `button-link.test.tsx`, and four in `toggle-button.test.tsx`.

- [ ] **Step 6: Migrate the Angular package**

In `packages/angular/button/src/button-appearance.ts`, delete `buttonState` and add:

```ts
export function stateAttribute(active: boolean) {
  return active ? '' : null;
}
```

In each of the four components, delete the `state` computed signal and replace the `'[attr.data-state]': 'state()'` host binding with the attributes that component actually carries:

- `button.ts` and `icon-button.ts`:

```ts
    '[attr.data-disabled]': 'stateAttribute(disabled())',
    '[attr.data-loading]': 'stateAttribute(loading())',
```

- `button-link.ts`:

```ts
    '[attr.data-disabled]': 'stateAttribute(interactionBlocked())',
```

- `toggle-button.ts`:

```ts
    '[attr.data-disabled]': 'stateAttribute(disabled())',
    '[attr.data-pressed]': 'stateAttribute(pressed())',
```

Host bindings call class members, so add a passthrough to each component class:

```ts
  readonly stateAttribute = stateAttribute;
```

Update every `data-state` assertion in `packages/angular/button/src/*.spec.ts` the same way.

- [ ] **Step 7: Run the full gate**

```bash
pnpm check:full
```

Expected: every package green, including the two tests written in Step 1.

Then confirm by hand that the two attributes now coexist:

```bash
grep -c 'data-state' packages/styles/src/button/button.css packages/react/src/button/button-root.ts
```

Expected: `0` for both.

- [ ] **Step 8: Commit**

```bash
pnpm format:check
git add specs packages
git commit -m "feat!: replace data-state with independent boolean attributes"
```

---

### Task 3: Keep a disabled toggle's pressed value distinguishable

Task 2 makes `data-pressed` survive alongside `data-disabled`, but the stylesheet still paints every disabled control with one flat treatment, so a disabled toggle looks the same whether it is on or off. The attribute change is what makes this fixable.

The fix uses tokens that already exist. Setting the border rather than the surface is deliberate: `--slotted-disabled-foreground` on `--slotted-disabled-background` reaches 3.86:1 in the light scheme and 3.66:1 in the dark one, clearing the 3:1 required of a non-text boundary. Recolouring the surface instead would put `#64748b` text on `#cbd5e1`, which is 3.21:1 and fails the 4.5:1 required of text.

**Files:**

- Modify: `packages/styles/src/button/button.css`
- Modify: `packages/styles/src/button/button.styles.test.mjs`

**Interfaces:**

- Consumes: the boolean attributes from Task 2.
- Produces: no API change. A new rule `.slotted-button[data-disabled][data-pressed]`.

- [ ] **Step 1: Write the failing test**

Add to `packages/styles/src/button/button.styles.test.mjs`:

```js
test('keeps a disabled toggle distinguishable when pressed', () => {
  assertNormalizedRuleDeclarations('.slotted-button[data-disabled][data-pressed]', [
    'border-color: var(--slotted-disabled-foreground, GrayText);',
  ]);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test packages/styles/src/button/button.styles.test.mjs`
Expected: FAIL with `Missing selector: .slotted-button[data-disabled][data-pressed]`.

- [ ] **Step 3: Add the rule**

In `packages/styles/src/button/button.css`, immediately after the `.slotted-button:disabled, .slotted-button[data-disabled]` rule:

```css
  .slotted-button[data-disabled][data-pressed] {
    border-color: var(--slotted-disabled-foreground, GrayText);
  }
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `node --test packages/styles/src/button/button.styles.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm check:full
pnpm format:check
git add packages/styles
git commit -m "fix(styles): keep a disabled toggle's pressed value visible"
```

---

### Task 4: Widen the icon slot to any icon source

`.slotted-button [data-part] > svg` sizes only a direct `svg` child. `@ng-icons` renders its `svg` one level deeper inside an `<ng-icon>` element, so it falls outside this contract and is sized today only by that library's own `em` convention. A consumer wrapping an icon in any element hits the same gap.

The replacement sizes the slot's contents at any depth, and is scoped to the icon-bearing parts so a consumer's `svg` inside a text label is not forced to fill.

**Files:**

- Modify: `packages/styles/src/button/button.css`
- Modify: `packages/styles/src/button/button.styles.test.mjs`
- Modify: `packages/styles/package.json`

**Interfaces:**

- Produces: no API change. The icon sizing rules cover four shapes: a bare `svg`, a component rendering an `svg` directly, a wrapper element containing a nested `svg`, and an element sized in `em`.

- [ ] **Step 1: Write the failing test**

Add `jsdom` to `packages/styles/package.json` as the only entry in a new `devDependencies` block:

```json
  "devDependencies": {
    "jsdom": "30.0.1"
  },
```

Append to `packages/styles/src/button/button.styles.test.mjs`:

```js
test('sizes every icon shape a consumer can supply', async () => {
  const { JSDOM } = await import('jsdom');
  const shapes = {
    'bare svg': '<svg data-probe></svg>',
    'component rendering an svg': '<svg data-probe class="lucide"></svg>',
    'wrapper with a nested svg': '<ng-icon><svg data-probe></svg></ng-icon>',
    'element sized in em': '<i data-probe class="icon-font"></i>',
  };

  for (const [shape, markup] of Object.entries(shapes)) {
    const dom = new JSDOM(
      `<button class="slotted-button"><span data-part="icon">${markup}</span></button>`,
    );
    const probe = dom.window.document.querySelector('[data-probe]');

    const sized = [
      ".slotted-button [data-part='icon'] > *",
      ".slotted-button [data-part='icon'] svg",
    ].some((selector) => probe.matches(selector));

    assert.ok(sized, `${shape} is not covered by an icon sizing rule`);
  }
});

test('does not force sizing on content inside the label slot', () => {
  assert.doesNotMatch(css, /\.slotted-button \[data-part\] > svg/);
  assert.doesNotMatch(css, /\[data-part='label'\][^{]*>\s*\*/);
});
```

The first test asserts coverage structurally. jsdom computes no layout, so a geometric assertion is impossible here; visual regression remains the recorded gap in the spec that would cover it.

Update the existing `sizes consumer supplied SVG icons without imposing an icon visual language` test, whose first assertion targets the selector being removed:

```js
  assertRuleDeclarations(".slotted-button [data-part='icon'] svg", [
    'block-size: 100%;',
    'display: block;',
    'inline-size: 100%;',
  ]);
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
pnpm install
node --test packages/styles/src/button/button.styles.test.mjs
```

Expected: FAIL. The wrapper and `em` shapes match nothing, and `.slotted-button [data-part] > svg` still exists.

- [ ] **Step 3: Widen the rules**

In `packages/styles/src/button/button.css`, replace the `.slotted-button [data-part] > svg` rule with:

```css
  .slotted-button [data-part='icon'] > *,
  .slotted-button [data-part='leading'] > *,
  .slotted-button [data-part='trailing'] > * {
    block-size: 100%;
    display: block;
    inline-size: 100%;
  }

  .slotted-button [data-part='icon'] svg,
  .slotted-button [data-part='leading'] svg,
  .slotted-button [data-part='trailing'] svg,
  .slotted-button [data-part='loading-indicator'] svg {
    block-size: 100%;
    display: block;
    inline-size: 100%;
  }
```

The slot rule above already sets `font-size: var(--_button-icon-size)`, which is what carries the `em`-sized shape; no change is needed there.

- [ ] **Step 4: Run it to make sure it passes**

```bash
node --test packages/styles/src/button/button.styles.test.mjs
```

Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
pnpm check:full
pnpm format:check
git add packages/styles pnpm-lock.yaml
git commit -m "fix(styles): size any icon source in the button slots"
```

---

## Verification

- `pnpm check:full` passes.
- `grep -rn "data-state" packages specs --include='*.ts' --include='*.tsx' --include='*.css' --include='*.mjs' --include='*.json'` returns nothing outside `dist/`.
- A toggle rendered with both `disabled` and `pressed` carries `data-disabled=""` and `data-pressed=""`.
- `.slotted-button [data-part] > svg` no longer exists in the stylesheet.
- The four-shape test covers a bare `svg`, a component-rendered `svg`, a nested `svg`, and an `em`-sized element.
- The Storybook overview still renders the toggle state matrix with a visible difference between Off and On at every fill.

## Known Follow-On

The contract's `stateAttributes` currently covers only the three states the button family uses. `data-selected`, `data-checked`, `data-expanded`, `data-invalid`, `data-required`, and `data-readonly` enter the vocabulary when the first component needing them arrives; the spec lists them, and adding one is a contract edit plus a stylesheet rule, not a structural change.
