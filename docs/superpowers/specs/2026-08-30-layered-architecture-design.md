# Layered Architecture Design

## Outcome

Slotted gains an explicit five-layer package structure with a one-way dependency rule, a single authored stylesheet per component, a published framework-agnostic core, and cross-cutting contracts for form fields, density, icons, component state, and testing. The structure supports both simple controls and complex overlay- and form-bearing components without further structural change.

This design resolves `PROJECT-PRD.md` §49 open questions 2, 6, 7, 8, 9, 13, and 18, and implements the "shared CSS contracts", "overlay foundation", and "essential accessibility utilities" items of §48 Phase 1.

## Motivating Evidence

Measured on the single implemented family:

- `button.css` is 314 lines in each framework package; 148 lines diverge, and the divergence is mechanical — `.slotted-button` against `:host`, `.slotted-button[data-variant='accent']` against `:host([data-variant='accent'])`. Alignment is maintained by two near-identical `button.styles.test.mjs` files, by assertion rather than by construction.
- `button-group.ts` uses `ViewEncapsulation.None`; `button.ts`, `button-link.ts`, `icon-button.ts`, and `toggle-button.ts` use emulated encapsulation with `:host`. One Angular package carries two styling contracts.
- `contract.json.scenarios` and `BUTTON_FAMILY_SCENARIOS` in `packages/storybook-workbench/src/scenarios.tsx` are the same list written twice, unlinked in code.
- No package can hold focus management, dismissal, portals, positioning, or scroll locking. Dialog, Popover, Tooltip, and Menu have no place to live.
- `data-state` holds a single value, so states cannot combine. A toggle that is both pressed and disabled loses its pressed appearance.
- `[data-part] > svg` sizes only a direct SVG child, so an icon wrapped by another element falls outside the sizing contract.

One family produces 3,095 lines in React and 3,113 in Angular. Every defect above multiplies by the catalog size.

## Layer Map

```
L0  specs/                     conceptual contracts (JSON + tests)
      ^
L1  @slotted/tokens            token contract, validator, build
    @slotted/themes/*          theme products
    @slotted/styles            one authored stylesheet per component
      ^
L2  @slotted/core              imperative DOM utilities and pure algorithms
      ^
L3  @slotted/react             idiomatic React components
    @slotted/angular           idiomatic Angular components
      ^
L4  @slotted/testing           published test helpers
    storybook-workbench        internal, never published
```

### Dependency Rule

`L3` may import `L2`, `L1`, and `L0`. `L1` may import `L0`. `L2` imports nothing from this repository. `L2` never imports `L3`. `@slotted/react` and `@slotted/angular` never import each other.

Layer 1 carries an internal order, because `@slotted/theme-default` consumes the token contract to build a theme: `@slotted/tokens` and `@slotted/styles` come before `@slotted/theme-default`. The check therefore ranks packages rather than grouping them — the tens digit is the architectural layer, the ones digit orders packages inside it, and a package may depend only on a strictly lower rank. No other layer has an internal edge today.

The rule is enforced, not documented only. `packages/react/package-boundary.verify.mjs` is generalized into a repository-level check that reads each package's manifest and fails on any edge outside the graph above.

## L0 — Contracts

`specs/components/<family>/contract.json` stays the only contract shape. A family declares its members, axes, capabilities, states, parts, and scenarios, as `specs/components/button/` already does.

The four terms of PRD §38 — primitive, component, pattern, theme — are documented in the glossary required by §16, not expressed as directories. A `specs/primitives/` or `specs/patterns/` directory appears when a contract exists that the family shape cannot express, and not before.

`contract.json` becomes the single source of the scenario list. `BUTTON_FAMILY_SCENARIOS` is deleted; `packages/storybook-workbench/src/scenarios.tsx` reads the contract file. The scenario coverage check keeps its current behavior and loses its duplicate source.

The public token list has one authored source in `@slotted/styles`, verified against the stylesheet it describes, and both framework packages re-export it. API tables stay per framework: after normalising the framework name, 154 of the 530 lines across the two `button.docs.ts` files differ, and they differ because the APIs genuinely differ — React takes `leading` as a `ReactNode` prop where Angular projects `[slButtonLeading]` content. PRD §27 allows the APIs to differ and §46.1 warns against the generic layer that unifying them would create.

## L1 — Design Foundation

`@slotted/tokens` and `@slotted/themes/*` keep their current responsibilities.

### Shared Stylesheet

`@slotted/styles` holds one CSS file per component, authored once with class and data-attribute selectors:

```
packages/styles/src/button/button.css
packages/styles/src/button/button-group.css
packages/styles/src/field/field.css
```

Exported per file so a consumer importing one component never loads the catalog:

```json
{ "exports": { "./button/*.css": "./src/button/*.css" } }
```

React imports the file from the component module, as it does today. Angular consumes the same file through `styleUrl`.

### Encapsulation

Every Angular component in the library uses `ViewEncapsulation.None`. Emulated encapsulation is incompatible with a shared stylesheet written against classes, and the current mix of both is already a divergence between two components of one family.

Consequence: Angular component styles are global and namespaced by the `slotted` prefix, matching the React package's behavior. The two frameworks then present one styling contract rather than two.

## L2 — Core

`@slotted/core` is published, not internal. PRD §8 Level 4 promises consumers primitives, accessibility utilities, and overlay infrastructure for building components the catalog does not contain; that promise requires a public package.

### Boundaries

The core holds no component state, performs no rendering, and imports no framework. Every export is either a pure function or an imperative function that takes an element and returns a disposer. Each is testable in jsdom without React or Angular.

### Modules

```
core/focus        trapFocus, restoreFocus, createRovingTabindex, createTypeahead
core/dismiss      onDismiss — Escape, outside pointer, focus loss
core/overlay      placeFloating, lockScroll, stacking layer management
core/id           deterministic ids, stable across server and client render
core/collection   filtering, comparison, date arithmetic, virtualization math
core/glyphs       path data for the glyphs the library itself renders
```

`core/id` is the mechanism that satisfies PRD §22: ids are derived deterministically so server and client markup match.

### Overlay

`@floating-ui/dom` is the single positioning and collision engine, wrapped by `core/overlay`. Angular CDK is not adopted. One engine gives both frameworks identical collision behavior and keeps overlay infrastructure inside the shared layer; two engines would place it outside.

Portals, stacking, and scroll locking are built on platform features — the native `dialog` element and the popover attribute where they apply — per PRD §6.4.

## L3 — Framework Packages

The first version targets React and Angular only. No third framework package is planned, and PRD §5 lists supporting every framework as a non-goal.

The dependency rule nonetheless keeps a future framework additive rather than structural: `L0`, `L1`, and `L2` contain no React or Angular import, so a third package would consume the existing contracts, stylesheet, and core without altering them. That is a property of the layering, not a commitment.

Current structure is kept: subpath exports in React, ng-packagr secondary entry points in Angular. Each component wraps `L2` in the local idiom — a hook in React, a directive or injectable service in Angular — applies the `L1` classes, and satisfies the `L0` contract.

Directives sit on native elements wherever the native element suffices, as `slButton` already does, so `formControlName`, `ngModel`, and native attributes reach the real element.

## L4 — Support Packages

`@slotted/testing` publishes the contract matchers currently held in `packages/storybook-workbench/src/testing.ts`, plus helpers that assert documented state attributes and parts, and a harness that renders a subject under a given theme, scheme, and density. Consumers use it to validate their own extensions against the same contract the library validates itself against.

`storybook-workbench` remains internal and unpublished.

## Cross-Cutting Contracts

### Field and Forms

`Field` is a component family, contracted at `specs/components/field/` with members `field`, `fieldLabel`, `fieldDescription`, and `fieldError`, and published in the same entry point as the form controls. It is composition-shaped, but it is not filed apart from the controls: nobody reaches for `Field` without a control, and the family shape already carried by `specs/components/button/` expresses it without new contract machinery.

`Field` generates ids through `core/id`, composes `aria-describedby` from description and error, and propagates `invalid`, `required`, `disabled`, and `readOnly` to the control — through context in React, through dependency injection in Angular.

```tsx
<Field invalid>
  <Field.Label>Email</Field.Label>
  <Input name="email" />
  <Field.Description>Used for sign-in</Field.Description>
  <Field.Error>Email is not valid</Field.Error>
</Field>
```

Three invariants keep capability with the consumer:

1. Every control works standalone. Outside a `Field` it accepts native attributes directly and association becomes the consumer's responsibility, as in plain HTML.
2. An explicit property always wins. `Field` fills what is unset and never overwrites what the consumer passed.
3. Field layout is consumer DOM. `Field.Label`, `Field.Description`, and `Field.Error` are elements the consumer positions.

The library ships no `<Input label="..." error="...">` shorthand. Such a property set would move field layout into internal DOM, which PRD §14 declares outside the versioned contract, and would create a second API surface that drifts from the composition. The shorthand belongs to the application as `AppField` — PRD §7.2 case D and §8 Level 3 — and the library documents it as the extension story required by §42.

React controls expose the controlled and uncontrolled duality of PRD §28.8: `defaultValue`, or `value` with `onValueChange`. `name` and `form` reach the native element, so `FormData` and form libraries work without an adapter.

Angular form controls implement `ControlValueAccessor`, so reactive forms, `ngModel`, and Signal Forms bind to the real element.

### Density and Scheme

Density is an environment, not a component property (PRD §13).

```
data-slotted-density="comfortable | default | compact"
data-slotted-scheme="light | dark"
```

Either attribute on any ancestor changes everything beneath it. CSS cascade resolves it, so no JavaScript runs and server render is correct. React exposes `DensityProvider`; Angular exposes an `slDensity` directive. Both only write the attribute.

`size` on a control stays and is orthogonal: density is the scale of the environment, `size` is the hierarchy of one control inside it.

### Icons

No official icon set, no `@slotted/icons` package. Consumers use any source — `lucide-react`, `react-icons`, `@ng-icons`, a private icon component, or a raw SVG element.

The sizing contract is the slot, not the shape of the DOM inside it:

```css
[data-part='icon'],
[data-part='leading'],
[data-part='trailing'] {
  block-size: var(--_button-icon-size);
  inline-size: var(--_button-icon-size);
  font-size: var(--_button-icon-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

[data-part] > * { block-size: 100%; inline-size: 100%; display: block; }
[data-part] svg { block-size: 100%; inline-size: 100%; display: block; }
```

This covers four shapes with one rule: a bare `<svg>`, a component that renders an `svg` directly, a wrapper element with a nested `svg`, and a glyph sized in `em`. The current `[data-part] > svg` rule covers only the first two; `<ng-icon>` renders its `svg` one level deeper and is sized today only by the `em` convention of that library, not by this contract.

A contract test renders all four shapes and asserts one resulting box.

Icons inherit `currentColor`. The library imposes no fill or stroke geometry.

Glyphs the library itself renders — the chevron in a select, the check in a checkbox, the calendar in a date picker — take their path data from `core/glyphs` and are rendered by each framework's template. Each is a documented, replaceable slot.

### State Attributes

`data-state` is replaced by independent boolean attributes, matching the example in PRD §30.

```
data-disabled  data-loading   data-pressed   data-selected
data-checked   data-expanded  data-invalid   data-required  data-readonly
```

`data-state` survives only where a genuine enumeration exists, such as `data-state="open"` against `data-state="closed"`.

The present single-valued attribute makes states mutually exclusive by construction:

```ts
const state = disabled ? 'disabled' : pressed ? 'pressed' : undefined;
```

A pressed and disabled toggle therefore fails to match `[data-state='pressed']` and loses its pressed appearance. The same pattern exists in `button.tsx` and `icon-button.tsx` between `disabled` and `loading`.

These attributes are public API. Their names and semantics follow the vocabulary of PRD §15 and change only under the versioning rules of §34.

### Testing

| Layer | Location | Current state |
| --- | --- | --- |
| Contract | `specs/**/contract.test.mjs` | exists |
| Unit and interaction | per framework package | exists |
| Style | `@slotted/styles`, one file | duplicated across two packages |
| Accessibility | `@storybook/addon-a11y` | installed, not a gate |
| SSR | Node render per framework | absent |
| Visual regression | — | absent |

The two `button.styles.test.mjs` files collapse into one in `@slotted/styles`.

Accessibility becomes a release gate together with L1. SSR tests enter with the first component that has a client-only effect, which is the first overlay component in L2. Visual regression is recorded as a known gap: `PRODUCT.md` establishes that visual acceptance remains a human decision in this phase and that browser automation is not a release gate.

## Migration of Existing Code

1. Create `@slotted/styles`. Split `packages/react/src/button/button.css` into `button/button.css` and `button/button-group.css`, since the React file currently carries the group rules that Angular keeps in a separate file. Delete the Angular `:host` dialect of `button.css` and the now-redundant `packages/angular/button/src/button-group.css`.
2. Set `ViewEncapsulation.None` on `button.ts`, `button-link.ts`, `icon-button.ts`, and `toggle-button.ts`.
3. Collapse the two `button.styles.test.mjs` files into one in `@slotted/styles`.
4. Replace `data-state` with the boolean attributes in both frameworks, the shared stylesheet, and the contract.
5. Widen the icon slot rules and add the four-shape contract test.
6. Delete `BUTTON_FAMILY_SCENARIOS` and read `specs/components/button/contract.json` in the workbench.
7. Create `@slotted/core` with `core/id` and `core/focus`, the two modules the current catalog can already use.
8. Generalize `package-boundary.verify.mjs` into a repository-level layer check.

Steps 1 through 6 apply to code that exists and are verifiable against the current test suite. Steps 7 and 8 create the layers the next components require.

## Decisions to Record as ADRs

| ADR | Subject | PRD §49 question |
| --- | --- | --- |
| Namespace `slotted` confirmed for properties, classes, data attributes, and packages; `sl` for Angular selectors | §11 | 1 |
| Package boundaries and the five-layer dependency rule | §25 | 2 |
| Shared authored stylesheet and uniform `ViewEncapsulation.None` | §30 | — |
| `@floating-ui/dom` as the single overlay engine; Angular CDK not adopted | §20, §24 | 7, 8, 9 |
| Bring-your-own icons with a slot-based sizing contract | §31 | 6 |
| Boolean state attributes as public API | §30, §15 | 13 |
| `@slotted/core` as the published reusable primitive layer | §8 | 18 |

## Out of Scope

Component catalog selection and ordering. This design fixes the structure; which components are built, in which tier, and in what order is decided afterward against this structure.

Layout and typography primitives — box, stack, grid, text, heading, surface, card, scroll area, visually-hidden — are the first question that catalog work resolves, including whether each is a public component, an internal utility, or nothing the library should own at all. The layering hosts them in `L3` either way, so the decision does not change this structure.

Visual regression infrastructure, deferred as recorded above.

Publishing, versioning mechanics, and the release train, which PRD §49 questions 16 and 17 leave open and which no component work currently blocks.

## Verification

- `pnpm check:full` passes at every migration step.
- The layer check fails on an introduced edge from `@slotted/core` to a framework package, and on an introduced edge between the two framework packages.
- One authored `button.css` exists in the repository; a search for `:host(` in library CSS returns nothing.
- A toggle that is pressed and disabled carries both `data-pressed` and `data-disabled`, and renders with its pressed appearance.
- The icon contract test asserts one box across the four icon shapes.
- The workbench scenario check fails when a scenario is added to `contract.json` without a corresponding story, with no second list to update.
