# Field Primitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `field` family in React and Angular, and generalise the `L0` contract schema that the button family currently defines alone.

**Architecture:** A shared schema module holds the contract vocabulary and shape assertion; each family's test calls it and then asserts what is true only of itself. The field family derives every identifier from one base, provides them through React context and Angular dependency injection, and applies them to a control through `fieldControl` so a plain native input works. No new package: React uses `useId`, Angular gets an injectable factory.

**Tech Stack:** pnpm workspaces, Turborepo, Vitest, `node:test`, jsdom, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-08-31-field-primitive-design.md`

## Global Constraints

- Node `>=24 <25`; pnpm `11.24.0`.
- Namespace `slotted`; Angular selectors prefixed `sl`.
- Boolean state attributes are present-or-absent with an empty value: `'' : undefined` in React, `"'' : null"` in Angular.
- Every Angular component in the library uses `ViewEncapsulation.None`.
- All component CSS lives in `@slotted/styles`, inside `@layer slotted.components`.
- `pnpm format:check` and `pnpm lint --max-warnings=0` pass at every commit. Check the exit status directly; piping into `tail` discards it.
- `git add` names files, never directories: `docs/ui-roadmap-scratch.md` is untracked on purpose, and `pnpm-lock.yaml` sits at the root where a `packages` path will miss it.
- The full gate is `pnpm check:full`.
- The consumer's explicit value always wins over one the field supplies.

---

### Task 1: Extract the shared contract schema

**Files:**

- Create: `specs/contract.schema.mjs`
- Modify: `specs/components/button/contract.test.mjs`
- Modify: `packages/storybook-workbench/src/scenarios.tsx`
- Modify: `packages/storybook-workbench/src/scenarios.test.ts`
- Modify: `packages/storybook-workbench/src/index.tsx`
- Modify: `packages/react/src/button/button.stories.test.ts`
- Modify: `packages/angular/button/src/button.stories.spec.ts`

**Interfaces:**

- Produces: `specs/contract.schema.mjs` exporting `SCHEMA_VERSION` (4), `PSEUDO_STATES`, `ATTRIBUTE_STATES`, `STATE_ATTRIBUTES`, `KNOWN_CAPABILITIES`, and `assertContractShape(contract)`, which throws a `node:assert` failure describing the first violation.
- Removes: `BUTTON_FAMILY_SCENARIOS` from `@slotted/storybook-workbench`. Each family's stories test imports its own contract and passes `contract.scenarios` to `scenarioCoverageErrors`, which is unchanged.

- [ ] **Step 1: Write the failing test**

Create `specs/contract.schema.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from './contract.schema.mjs';

const valid = {
  schemaVersion: 4,
  family: 'example',
  stateAttributes: { disabled: 'data-disabled' },
  members: {
    example: {
      nativeElement: 'div',
      defaults: {},
      capabilities: ['disabled'],
      states: ['default', 'disabled'],
      parts: ['root'],
    },
  },
  scenarios: { example: ['playground'] },
};

test('accepts a contract without appearance axes', () => {
  assert.doesNotThrow(() => assertContractShape(valid));
});

test('rejects an attribute-driven state with no declared attribute', () => {
  const contract = structuredClone(valid);
  contract.members.example.states.push('invalid');
  assert.throws(() => assertContractShape(contract), /invalid/);
});

test('rejects a pseudo-class state given an attribute', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.hover = 'data-hover';
  assert.throws(() => assertContractShape(contract), /hover/);
});

test('rejects a state attribute that disagrees with the shared vocabulary', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.disabled = 'data-off';
  assert.throws(() => assertContractShape(contract), /disabled/);
});

test('rejects a scenario page that names no member', () => {
  const contract = structuredClone(valid);
  contract.scenarios.ghost = ['playground'];
  assert.throws(() => assertContractShape(contract), /ghost/);
});

test('rejects duplicate scenario ids within a page', () => {
  const contract = structuredClone(valid);
  contract.scenarios.example = ['playground', 'playground'];
  assert.throws(() => assertContractShape(contract), /playground/);
});

test('carries the states Field introduces', () => {
  assert.equal(STATE_ATTRIBUTES.invalid, 'data-invalid');
  assert.equal(STATE_ATTRIBUTES.required, 'data-required');
  assert.equal(STATE_ATTRIBUTES.readonly, 'data-readonly');
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test specs/contract.schema.test.mjs`
Expected: FAIL with `Cannot find module` for `./contract.schema.mjs`.

- [ ] **Step 3: Write the schema module**

Create `specs/contract.schema.mjs`:

```js
import assert from 'node:assert/strict';

export const SCHEMA_VERSION = 4;

export const PSEUDO_STATES = ['default', 'hover', 'active', 'focus-visible'];

export const STATE_ATTRIBUTES = {
  disabled: 'data-disabled',
  loading: 'data-loading',
  pressed: 'data-pressed',
  invalid: 'data-invalid',
  required: 'data-required',
  readonly: 'data-readonly',
};

export const ATTRIBUTE_STATES = Object.keys(STATE_ATTRIBUTES);

export const KNOWN_CAPABILITIES = [
  'appearance',
  'content',
  'fullWidth',
  'disabled',
  'loading',
  'pressed',
  'orientation',
  'invalid',
  'required',
  'readOnly',
  'wiring',
];

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} contains duplicates`);
}

export function assertContractShape(contract) {
  assert.equal(contract.schemaVersion, SCHEMA_VERSION, 'schemaVersion');
  assert.ok(
    typeof contract.family === 'string' && contract.family.length > 0,
    'family must be a non-empty string',
  );

  const memberNames = Object.keys(contract.members ?? {});
  assert.ok(memberNames.length > 0, 'contract declares no members');

  const declaredStates = new Set();
  for (const [name, member] of Object.entries(contract.members)) {
    for (const field of ['nativeElement', 'defaults', 'capabilities', 'states', 'parts']) {
      assert.ok(field in member, `${name} is missing ${field}`);
    }
    assertUnique(member.capabilities, `${name} capabilities`);
    assertUnique(member.states, `${name} states`);
    assertUnique(member.parts, `${name} parts`);

    for (const capability of member.capabilities) {
      assert.ok(KNOWN_CAPABILITIES.includes(capability), `${name} unknown capability ${capability}`);
    }
    for (const state of member.states) {
      assert.ok(
        PSEUDO_STATES.includes(state) || ATTRIBUTE_STATES.includes(state),
        `${name} unknown state ${state}`,
      );
      declaredStates.add(state);
    }
  }

  const stateAttributes = contract.stateAttributes ?? {};
  for (const state of declaredStates) {
    if (PSEUDO_STATES.includes(state)) {
      assert.ok(!(state in stateAttributes), `${state} must not declare an attribute`);
      continue;
    }
    assert.ok(state in stateAttributes, `${state} needs a declared attribute`);
  }
  for (const [state, attribute] of Object.entries(stateAttributes)) {
    assert.equal(attribute, STATE_ATTRIBUTES[state], `${state} disagrees with the vocabulary`);
    assert.ok(declaredStates.has(state), `${state} is declared but no member uses it`);
  }

  for (const [page, ids] of Object.entries(contract.scenarios ?? {})) {
    assert.ok(page === 'overview' || memberNames.includes(page), `scenario page ${page}`);
    assertUnique(ids, `scenario page ${page}`);
    assert.ok(ids.length > 0, `scenario page ${page} is empty`);
  }
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `node --test specs/contract.schema.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Make the button test call the shared assertion**

In `specs/components/button/contract.test.mjs`, add the import and replace the two tests that duplicate what the schema now checks — `maps every attribute-driven state to a boolean data attribute` and the capability and state vocabulary halves of `limits member capabilities and states to the family vocabulary` — with one call:

```js
import { assertContractShape } from '../../contract.schema.mjs';

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});
```

Keep every assertion that is specific to the button family: the member ordering, the parts map, the axes, the orientations, the semantic defaults, and the scenario page ordering.

- [ ] **Step 6: Decouple the workbench from the contracts**

In `packages/storybook-workbench/src/scenarios.tsx`, delete the contract import, the `BUTTON_FAMILY_SCENARIOS` export, and the `ScenarioPage` type. Keep `scenario`, `storyScenarioIds`, `scenarioCoverageErrors`, and `apiMetadataErrors`.

Extend `capabilityApi` in the same file with the field family's capabilities:

```ts
  invalid: ['invalid'],
  required: ['required'],
  readOnly: ['readOnly'],
  wiring: [],
```

In `packages/storybook-workbench/src/index.tsx`, drop `BUTTON_FAMILY_SCENARIOS` and `ScenarioPage` from the export list.

In `packages/storybook-workbench/src/scenarios.test.ts`, delete the contract import and the test that asserted the derived list.

In `packages/react/src/button/button.stories.test.ts` and `packages/angular/button/src/button.stories.spec.ts`, replace `BUTTON_FAMILY_SCENARIOS` with `contract.scenarios`, which both files already import.

- [ ] **Step 7: Run the full gate and commit**

```bash
pnpm check:full
echo "exit=$?"
npx prettier --check .
git add specs/contract.schema.mjs specs/contract.schema.test.mjs specs/components/button/contract.test.mjs packages/storybook-workbench/src/scenarios.tsx packages/storybook-workbench/src/scenarios.test.ts packages/storybook-workbench/src/index.tsx packages/react/src/button/button.stories.test.ts packages/angular/button/src/button.stories.spec.ts
git commit -m "refactor(specs): extract the shared contract schema"
```

---

### Task 2: Write the field contract

**Files:**

- Create: `specs/components/field/contract.json`
- Create: `specs/components/field/contract.test.mjs`

**Interfaces:**

- Produces: a contract with `family: "field"`, no `axes` and no `orientations`, members `field`, `fieldLabel`, `fieldDescription`, `fieldError`, `fieldControl`, and one scenario page named `field`.

- [ ] **Step 1: Write the failing test**

Create `specs/components/field/contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('defines the ordered field family structure', () => {
  assert.equal(contract.family, 'field');
  assert.deepEqual(Object.keys(contract.members), [
    'field',
    'fieldLabel',
    'fieldDescription',
    'fieldError',
    'fieldControl',
  ]);
  assert.ok(!('axes' in contract), 'the field family has no appearance axes');
});

test('gives each member its native element and parts', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    {
      field: 'div',
      fieldLabel: 'label',
      fieldDescription: 'p',
      fieldError: 'p',
      fieldControl: 'input',
    },
  );
  assert.deepEqual(contract.members.field.parts, ['root']);
});

test('carries the field state vocabulary on the root only', () => {
  assert.deepEqual(contract.members.field.states, [
    'default',
    'disabled',
    'invalid',
    'required',
    'readonly',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    required: 'data-required',
    readonly: 'data-readonly',
  });
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['field']);
  assert.deepEqual(contract.scenarios.field, [
    'playground',
    'states',
    'description',
    'error',
    'accessibility',
  ]);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test specs/components/field/contract.test.mjs`
Expected: FAIL with `ENOENT` on `contract.json`.

- [ ] **Step 3: Write the contract**

Create `specs/components/field/contract.json`:

```json
{
  "schemaVersion": 4,
  "family": "field",
  "stateAttributes": {
    "disabled": "data-disabled",
    "invalid": "data-invalid",
    "required": "data-required",
    "readonly": "data-readonly"
  },
  "members": {
    "field": {
      "nativeElement": "div",
      "defaults": {
        "disabled": false,
        "invalid": false,
        "readOnly": false,
        "required": false
      },
      "capabilities": ["disabled", "invalid", "required", "readOnly"],
      "states": ["default", "disabled", "invalid", "required", "readonly"],
      "parts": ["root"]
    },
    "fieldLabel": {
      "nativeElement": "label",
      "defaults": {},
      "capabilities": ["wiring"],
      "states": ["default"],
      "parts": ["label"]
    },
    "fieldDescription": {
      "nativeElement": "p",
      "defaults": {},
      "capabilities": ["wiring"],
      "states": ["default"],
      "parts": ["description"]
    },
    "fieldError": {
      "nativeElement": "p",
      "defaults": {},
      "capabilities": ["wiring"],
      "states": ["default"],
      "parts": ["error"]
    },
    "fieldControl": {
      "nativeElement": "input",
      "defaults": {},
      "capabilities": ["wiring"],
      "states": ["default"],
      "parts": ["control"]
    }
  },
  "scenarios": {
    "field": ["playground", "states", "description", "error", "accessibility"]
  }
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `node --test specs/components/field/contract.test.mjs`
Expected: PASS, 5 tests. `pnpm test:contracts` picks the file up through its existing glob with no change.

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add specs/components/field/contract.json specs/components/field/contract.test.mjs
git commit -m "feat(contract): define the field family"
```

---

### Task 3: Write the field stylesheet

**Files:**

- Create: `packages/styles/src/field/field.css`
- Create: `packages/styles/src/field/field.tokens.json`
- Modify: `packages/styles/package.json`
- Modify: `packages/styles/src/button/button.styles.test.mjs` → rename to `packages/styles/src/tokens.test.mjs` for the shared part, or add a field style test beside it

**Interfaces:**

- Produces: `@slotted/styles/field/field.css` and `@slotted/styles/field/tokens.json`.

- [ ] **Step 1: Write the failing test**

Create `packages/styles/src/field/field.styles.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/field/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./field.css', import.meta.url), 'utf8');
const normalized = css.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['label', 'description', 'error', 'control']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('styles every state the contract declares on the root', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing state ${state}`);
  }
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(
    readFileSync(new URL('./field.tokens.json', import.meta.url), 'utf8'),
  );
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test packages/styles/src/field/field.styles.test.mjs`
Expected: FAIL with `ENOENT` on `field.css`.

- [ ] **Step 3: Write the stylesheet**

Create `packages/styles/src/field/field.css`. Every declaration reads a token so the theme owns the decisions:

```css
@layer slotted.components {
  .slotted-field {
    display: grid;
    gap: var(--slotted-field-gap, 0.375rem);
    min-inline-size: 0;
  }

  .slotted-field [data-part='label'] {
    color: var(--slotted-field-label-color, CanvasText);
    font-family: var(--slotted-control-font-family, system-ui, sans-serif);
    font-size: var(--slotted-field-label-font-size, 0.8125rem);
    font-weight: var(--slotted-field-label-font-weight, 600);
    line-height: var(--slotted-control-line-height, 1);
  }

  .slotted-field[data-required] [data-part='label']::after {
    color: var(--slotted-field-required-color, var(--slotted-tone-danger-text));
    content: var(--slotted-field-required-marker, '*');
    margin-inline-start: var(--slotted-field-required-gap, 0.25rem);
  }

  .slotted-field [data-part='description'],
  .slotted-field [data-part='error'] {
    font-family: var(--slotted-control-font-family, system-ui, sans-serif);
    font-size: var(--slotted-field-message-font-size, 0.75rem);
    line-height: var(--slotted-field-message-line-height, 1.45);
    margin: 0;
  }

  .slotted-field [data-part='description'] {
    color: var(--slotted-field-description-color, GrayText);
  }

  .slotted-field [data-part='error'] {
    color: var(--slotted-field-error-color, var(--slotted-tone-danger-text));
  }

  .slotted-field[data-invalid] [data-part='label'] {
    color: var(--slotted-field-invalid-label-color, var(--slotted-tone-danger-text));
  }

  .slotted-field[data-disabled] {
    color: var(--slotted-disabled-foreground, GrayText);
  }

  .slotted-field[data-disabled] [data-part='label'],
  .slotted-field[data-disabled] [data-part='description'] {
    color: var(--slotted-disabled-foreground, GrayText);
  }

  .slotted-field[data-readonly] [data-part='control'] {
    cursor: var(--slotted-field-readonly-cursor, default);
  }
}
```

Generate the token file the same way the button family's was generated, then verify:

```bash
node -e "
const { readFileSync, writeFileSync } = require('node:fs');
const css = readFileSync('packages/styles/src/field/field.css', 'utf8');
const tokens = [...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map((m) => m[1]))].sort();
writeFileSync('packages/styles/src/field/field.tokens.json', JSON.stringify(tokens, null, 2) + '\n');
console.log(tokens.length + ' tokens');
"
```

Add both exports to `packages/styles/package.json`, and add the new test to its `test` and `typecheck` scripts.

- [ ] **Step 4: Run it to make sure it passes**

```bash
pnpm --filter @slotted/styles verify
echo "exit=$?"
```

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add packages/styles/src/field packages/styles/package.json
git commit -m "feat(styles): add the field stylesheet"
```

---

### Task 4: Build the React field family

**Files:**

- Create: `packages/react/src/field/field-context.ts`, `field.tsx`, `field-label.tsx`, `field-description.tsx`, `field-error.tsx`, `field-control.tsx`, `field.types.ts`, `index.ts`
- Create: `packages/react/src/field/field.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/package.json`, `packages/react/vite.config.ts`

**Interfaces:**

- Produces: `@slotted/react/field` exporting `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldControl`, and the `FieldProps` type. `Field` accepts `disabled`, `invalid`, `readOnly`, `required`, `id`, `children`, `className`, `render`.
- Context value: `{ ids: { control, label, description, error }, describedBy: string | undefined, disabled, invalid, readOnly, required, registerControl(): void }`.

- [ ] **Step 1: Write the failing test**

Create `packages/react/src/field/field.test.tsx` covering, at minimum:

```tsx
it('derives every identifier from one base', () => {
  render(
    <Field id="email">
      <FieldLabel>Email</FieldLabel>
      <FieldControl />
      <FieldDescription>Used for sign-in</FieldDescription>
    </Field>,
  );

  const control = screen.getByRole('textbox');
  expect(control).toHaveAttribute('id', 'email-control');
  expect(screen.getByText('Email')).toHaveAttribute('for', 'email-control');
  expect(screen.getByText('Used for sign-in')).toHaveAttribute('id', 'email-description');
});

it('composes aria-describedby as description then error', () => {
  render(
    <Field id="email" invalid>
      <FieldControl />
      <FieldDescription>Used for sign-in</FieldDescription>
      <FieldError>Email is not valid</FieldError>
    </Field>,
  );

  expect(screen.getByRole('textbox')).toHaveAttribute(
    'aria-describedby',
    'email-description email-error',
  );
});

it('keeps a consumer value ahead of the field value', () => {
  render(
    <Field id="email">
      <FieldControl aria-describedby="external" />
      <FieldDescription>Used for sign-in</FieldDescription>
    </Field>,
  );

  expect(screen.getByRole('textbox')).toHaveAttribute(
    'aria-describedby',
    'external email-description',
  );
});

it('never overwrites an explicit attribute', () => {
  render(
    <Field id="email" required>
      <FieldControl aria-required="false" />
    </Field>,
  );

  expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'false');
});

it('marks state on the root and on the control', () => {
  render(
    <Field disabled id="email" invalid readOnly required>
      <FieldControl />
    </Field>,
  );

  const root = screen.getByRole('textbox').closest('.slotted-field');
  for (const attribute of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
    expect(root).toHaveAttribute(attribute, '');
  }

  const control = screen.getByRole('textbox');
  expect(control).toHaveAttribute('aria-invalid', 'true');
  expect(control).toHaveAttribute('aria-required', 'true');
  expect(control).toBeDisabled();
  expect(control).toHaveAttribute('readonly');
  expect(control).not.toHaveAttribute('required');
});

it('applies the wiring through render to a consumer control', () => {
  render(
    <Field id="email">
      <FieldControl render={(props) => <textarea {...props} />} />
      <FieldDescription>Used for sign-in</FieldDescription>
    </Field>,
  );

  const control = screen.getByRole('textbox');
  expect(control.tagName).toBe('TEXTAREA');
  expect(control).toHaveAttribute('aria-describedby', 'email-description');
});

it('generates an identifier when none is given', () => {
  render(
    <Field>
      <FieldControl />
      <FieldLabel>Email</FieldLabel>
    </Field>,
  );

  const control = screen.getByRole('textbox');
  expect(control.id).toMatch(/-control$/);
  expect(screen.getByText('Email')).toHaveAttribute('for', control.id);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `pnpm --filter @slotted/react exec vitest run src/field`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the implementation**

`field-context.ts` holds the context and a `useField()` reader that returns `undefined` outside a field, so every part degrades to plain markup rather than throwing.

`field.tsx` mints the base with `useId()` when `id` is absent, derives the four identifiers, computes `describedBy` from whichever of description and error are rendered, and applies `data-*` state to the root. It renders a `div` with `className` composed as `slotted-field` plus any consumer class, and accepts `render` for a different element.

Presence of the description and the error is known without registration: `FieldDescription` and `FieldError` are the only sources, and `describedBy` is computed from a small registry the two parts write to on mount. Use a `useState` set in the context so a description added later updates `aria-describedby`.

`field-control.tsx` reads the context, merges `aria-describedby` after the consumer's value, and applies `id`, `aria-invalid`, `aria-required`, `disabled`, and `readOnly` only where the consumer left them unset.

A development-only warning fires once when a field mounts with no control registered.

Add `field` to `packages/react/src/index.ts`, to the `exports` map in `packages/react/package.json`, and to the entry map in `packages/react/vite.config.ts` beside `button`.

- [ ] **Step 4: Run them to make sure they pass**

```bash
pnpm --filter @slotted/react verify
echo "exit=$?"
```

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add packages/react/src/field packages/react/src/index.ts packages/react/package.json packages/react/vite.config.ts
git commit -m "feat(react): add the field family"
```

---

### Task 5: Build the Angular field family

**Files:**

- Create: `packages/angular/field/ng-package.json`, `src/public-api.ts`, `src/field-id.ts`, `src/field.ts`, `src/field-label.ts`, `src/field-description.ts`, `src/field-error.ts`, `src/field-control.ts`
- Create: `packages/angular/field/src/field.spec.ts`, `src/field-id.spec.ts`
- Modify: `packages/angular/package.json` if the build needs the entry point named

**Interfaces:**

- Produces: `@slotted/angular/field` exporting `SlField`, `SlFieldLabel`, `SlFieldDescription`, `SlFieldError`, `SlFieldControl`, and `SlFieldIdFactory`.
- `SlFieldIdFactory` is `@Injectable({ providedIn: 'root' })` with `next(): string`, returning `slotted-field-1`, `slotted-field-2`, and so on, scoped to the application injector.

- [ ] **Step 1: Write the failing test**

`field-id.spec.ts` asserts the property server and client rendering rely on:

```ts
it('produces the same sequence for two independent application injectors', () => {
  const first = Injector.create({ providers: [{ provide: SlFieldIdFactory, useClass: SlFieldIdFactory }] });
  const second = Injector.create({ providers: [{ provide: SlFieldIdFactory, useClass: SlFieldIdFactory }] });

  const a = first.get(SlFieldIdFactory);
  const b = second.get(SlFieldIdFactory);

  expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
});
```

`field.spec.ts` mirrors the React behaviour tests through a `BoundHost` component, following the idiom already used in `toggle-button.spec.ts`.

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx ng test slotted-angular --watch=false`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the implementation**

`SlField` is `div[slField]` with `ViewEncapsulation.None`, `class: 'slotted-field'`, and `styleUrl: '../../../styles/src/field/field.css'`, matching the relative path the button family uses.

The parts are directives on native elements — `label[slFieldLabel]`, `p[slFieldDescription]`, `p[slFieldError]`, `[slFieldControl]` — each injecting `SlField` and reading its signals. `SlFieldControl` sets attributes through host bindings only where the host element does not already carry them, which preserves the invariant that an explicit value wins.

Register the entry point the same way `packages/angular/button` is registered.

- [ ] **Step 4: Run them to make sure they pass**

```bash
pnpm --filter @slotted/angular verify
echo "exit=$?"
```

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add packages/angular/field packages/angular/package.json
git commit -m "feat(angular): add the field family"
```

---

### Task 6: Document the family in both Storybooks

**Files:**

- Create: `packages/react/src/field/field.docs.ts`, `field.stories.tsx`, `field.stories.test.ts`
- Create: `packages/angular/field/src/field.docs.ts`, `field.stories.ts`, `field.stories.spec.ts`

**Interfaces:**

- Produces: one Storybook page per framework titled `Components/Field`, with the five scenarios the contract declares, verified by `scenarioCoverageErrors` against `contract.scenarios`.

- [ ] **Step 1: Write the failing test**

Each stories test asserts scenario coverage and API metadata, following `button.stories.test.ts`:

```ts
it('covers every required scenario', () => {
  expect(scenarioCoverageErrors(contract.scenarios.field, fieldStories)).toEqual([]);
});

it('documents each public component API', () => {
  for (const member of Object.keys(contract.members)) {
    expect(apiMetadataErrors(contract.members[member], REACT_FIELD_DOCS[member].api)).toEqual([]);
  }
});
```

- [ ] **Step 2: Run them to make sure they fail**

Expected: FAIL, stories module not found.

- [ ] **Step 3: Write the stories and docs**

Five stories matching the contract: `playground`, `states`, `description`, `error`, `accessibility`. The `accessibility` story renders a field wired to a plain native `<input>` through `FieldControl`, which is the case the family exists to serve.

Token tables read `@slotted/styles/field/tokens.json`, as the button pages read the button list.

- [ ] **Step 4: Run the full gate**

```bash
pnpm check:full
echo "exit=$?"
```

- [ ] **Step 5: Commit**

```bash
npx prettier --check .
git add packages/react/src/field packages/angular/field
git commit -m "docs(field): add the Storybook reference pages"
```

---

## Verification

- `pnpm check:full` exits `0`.
- `node --test specs/contract.schema.test.mjs` and both families' contract tests pass; `pnpm test:contracts` finds the field contract through its existing glob.
- `grep -rn "BUTTON_FAMILY_SCENARIOS" packages` returns nothing.
- A field rendered with `disabled`, `invalid`, `required`, and `readOnly` carries all four data attributes on its root, and its control carries `aria-invalid`, `aria-required`, `disabled`, and `readonly`, but not `required`.
- A consumer `aria-describedby` survives, with the field's identifiers appended after it.
- The Angular identifier factory produces the same sequence for two independent application injectors.
- Both Storybooks build.
