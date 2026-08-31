# Field Primitive Design

## Outcome

The `field` family gives a form control its label, description, error, and the ARIA that binds them, without taking layout or capability away from the consumer. It is the second component family, so it also generalises the `L0` contract schema that the button family currently defines alone.

It creates no new package. React uses `useId`; Angular gets an injectable identifier factory inside `@slotted/angular`.

## Why No `@slotted/core` Yet

React 19 ships `useId`, which is hydration-safe, and PRD §6.4 prefers a framework primitive to a custom abstraction.

Angular 22.1.4 has no equivalent. Its `@angular/core` type surface exposes `APP_ID` and `makeStateKey` and nothing that mints unique identifiers. Angular therefore needs its own generator, and it must be an injectable scoped to the application injector rather than a module-level counter: a module-level counter produces colliding sequences when two applications render in one server process.

What would remain for a shared package is the counter itself, roughly ten lines, consumed by one framework. That is the same emptiness that deferred `@slotted/core` once already. The generator lives in `@slotted/angular` and moves to core when a second consumer needs it.

The catalog's core table is corrected accordingly: `core/id` no longer arrives with `Field`. The first real caller of `@slotted/core` becomes `Tabs`, whose roving tabindex both frameworks need equally.

## Contract Schema Generalisation

`specs/contract.schema.mjs` becomes the shared half of every family's contract test.

It exports the vocabulary — `PSEUDO_STATES`, `ATTRIBUTE_STATES`, `STATE_ATTRIBUTES` — and one assertion, `assertContractShape(contract)`, which checks:

- `schemaVersion` is the current version and `family` is a non-empty string.
- Every member declares `nativeElement`, `defaults`, `capabilities`, `states`, and `parts`.
- `capabilities` and `states` hold no duplicates and come from the shared vocabulary.
- Every attribute-driven state a member declares appears in `contract.stateAttributes`, and no pseudo-class state does.
- `contract.stateAttributes` agrees with `STATE_ATTRIBUTES` for every key it declares, so one state name cannot mean two attributes across families.
- Scenario page keys are `overview` where present plus a subset of member names, and scenario ids are unique within a page.

`axes` and `orientations` become optional: they describe an appearance system the button family has and the field family does not.

Each family's test calls `assertContractShape` and then asserts what is true only of itself. The button test keeps its member ordering, parts map, and semantic defaults; nothing it currently checks is lost.

The shared vocabulary gains three states and their attributes, which `Field` introduces and every later form control reuses:

```
invalid   data-invalid
required  data-required
readonly  data-readonly
```

`disabled` and its `data-disabled` already exist.

## Family Anatomy

Five members, mirroring the button family's shape.

| Member | Native element | Responsibility |
| --- | --- | --- |
| `field` | `div` | Owns the identifiers and the state, and provides both to its descendants |
| `fieldLabel` | `label` | Names the control; carries `for` |
| `fieldDescription` | `p` | Helper text; joins the control's `aria-describedby` |
| `fieldError` | `p` | Error text; joins `aria-describedby` when present |
| `fieldControl` | `input` | Applies the wiring to a control that does not read the field itself |

`fieldControl` exists for a concrete reason. A native `<input>` cannot read React context, so without it the wiring would work only for controls this library ships, and a consumer bringing their own control — or a plain input — would get nothing. In Angular it is a directive on whatever element the consumer chooses, matching `slButton`. In React it renders an `input` by default and accepts `render`, matching `ButtonLink`.

Controls this library ships later read the field directly and need no wrapper, so `<Input />` inside a `Field` works bare.

## Identifiers

`field` mints one base identifier and derives the rest from it:

```
<base>-control  <base>-label  <base>-description  <base>-error
```

Derivation rather than registration means `label[for]` always resolves to the identifier the control will use, with no ordering dependency between siblings and nothing to coordinate during hydration.

The cost is a dangling `for` when a field contains no control at all. Development builds warn once in that case. A warning rather than the thrown error `IconButton` uses for a missing accessible name: a field without a control is a legitimate transient state during composition, while an icon button without a name is never correct.

## Wiring

`field` computes `aria-describedby` as the description identifier followed by the error identifier, including only those actually rendered, and passes it down with the state.

What the control receives:

| Attribute | When |
| --- | --- |
| `id` | always |
| `aria-describedby` | when a description or an error is present, merged after any value the consumer set |
| `aria-invalid="true"` | when the field is invalid |
| `aria-required="true"` | when the field is required |
| `disabled` | when the field is disabled |
| `readonly` | when the field is read-only |

`aria-required` rather than the native `required` attribute: `required` engages browser constraint validation and changes submit behaviour, which the library must not impose as a side effect of describing a field. A consumer wanting native validation sets `required` on the control themselves, and it survives, because an explicit value on the control always wins.

That last rule is the family's invariant. `field` fills what is unset and never overwrites what the consumer passed, which is what keeps composition from removing capability.

`fieldError` receives no implicit `role="alert"` and no live region. Whether an error should interrupt depends on when it appears — on submit, on blur, or from a server — which is application context that PRD §17.2 assigns to the consumer. An element that mounts and unmounts is also an unreliable live region. Consumers wanting announcement add `role="alert"` themselves.

## State Attributes

The `field` element carries `data-invalid`, `data-required`, `data-disabled`, and `data-readonly` when those are set, so the stylesheet can style the label, the description, and the error from one place without every part repeating the state.

## Styling

`@slotted/styles/field/field.css`, authored once and consumed by both frameworks, following the button family exactly. The tokens it reads are declared in `packages/styles/src/field/field.tokens.json` and verified against the stylesheet by the same test that guards the button family's list.

## Testing

- Contract: `specs/components/field/contract.test.mjs`, calling `assertContractShape` and then the field's own assertions.
- Behaviour, per framework: identifiers derive correctly, `aria-describedby` composes in order and merges with a consumer value, an explicit attribute always wins over the field's, and state propagates to both the field element and the control.
- Angular determinism: the injectable factory produces the same sequence for two independently created application injectors, which is the property server and client rendering rely on. This is asserted, not assumed.
- Style: field selectors and token list, in `@slotted/styles`.
- Storybook: one `field` page with the scenarios the contract declares.

## Workbench Coupling

`packages/storybook-workbench/src/scenarios.tsx` currently imports the button contract to export `BUTTON_FAMILY_SCENARIOS`. That coupling grows with every family, so it is removed: the workbench keeps only the functions, and each family's stories test imports its own contract. The workbench stops knowing which families exist.

## Out of Scope

`Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, and `Fieldset` are `T3` and follow separately. `Field` is verified against `fieldControl` and a plain native input, which is the same surface those controls will present.

Form-level concerns — submission, validation orchestration, error summaries — are not `Field`'s. PRD §5 lists dictating application state architecture as a non-goal.
