# Field-Aware Controls Design

## Outcome

How every control this library ships gets its label, its description, its error
and its state from the `field` around it — without being asked to.

The Field design document promised it: "controls this library ships later read
the field directly and need no wrapper, so `<Input />` inside a `Field` works
bare." This is that mechanism. It is written once, by `Input`, and followed by
`Textarea`, `Switch`, `Checkbox`, `RadioGroup`, `Slider` and everything else in
T3 that sits inside a field.

## A Control Reads the Field; `fieldControl` Stays for Controls It Does Not Own

`FieldControl` and `slFieldControl` exist so that a control this library has
never seen — a plain `<input>`, or a consumer's own component — can be wired.
They are not the path for controls the library ships. Those read the field
themselves, so the consumer writes the control and nothing else.

```tsx
<Field invalid>
  <FieldLabel>Email</FieldLabel>
  <Input type="email" />
  <FieldError>That address is not valid.</FieldError>
</Field>
```

```html
<div slField invalid>
  <label slFieldLabel>Email</label>
  <input slInput type="email" />
  <p slFieldError>That address is not valid.</p>
</div>
```

The alternative in Angular was two directives on one element,
`<input slInput slFieldControl>`, which needs no dependency between entry
points and was rejected anyway. Forgetting the second directive produces a
label whose `for` resolves to nothing — a silent accessibility defect, in the
one arrangement a consumer is most likely to write. A control that wires itself
cannot be written wrong.

## Unset Means "Ask the Field"; Set Means "This, Regardless"

Every state a control shares with its field — `disabled`, `invalid`,
`required`, `readOnly` — is `undefined` by default rather than `false`.

That is what makes the two directions distinguishable. `false` cannot say
whether the consumer meant "not disabled" or said nothing at all, and a control
that defaults to `false` would quietly override a disabled field. `undefined`
defers; anything else wins, which is the field family's own invariant read from
the other side.

The reference pages document the default as "from the field, or false" rather
than as `false`, and the contract's `defaults` records only the states a control
genuinely owns — `size`, and nothing else.

## The Control Mirrors the State Onto Itself

A control carries `data-disabled`, `data-invalid`, `data-required` and
`data-readonly` on its own element, resolved from its props or from the field.

The alternative is a descendant selector — `.slotted-field[data-invalid]
.slotted-input` — which is shorter to write and wrong twice over. It cannot
style a control used outside a field at all, and it makes the field's DOM part
of the input stylesheet's contract, so moving a control inside a wrapper breaks
its appearance with no test to notice.

Mirroring costs one attribute and makes every rule in the control's stylesheet
a single class-and-attribute selector that works in both arrangements.

## `aria-required`, Never `required`

Restated from the field design, because it is the rule a control is most likely
to break: the native `required` attribute engages browser constraint validation
and changes submit behaviour, which the library must not impose as a side
effect of describing a field. Controls set `aria-required`. A consumer who
wants native validation writes `required` on the control, and it survives.

The same holds for `disabled`, which is not aria-only: `disabled` is what
removes a control from the tab order and from form submission, and that is the
behaviour the word means. It is set natively.

## Angular Crosses Entry Points by Its Published Path

`SlInput` injects `SlField`, so `@slotted/angular/input` depends on
`@slotted/angular/field`. It is the first such dependency in the package, and
the import must be written as `@slotted/angular/field` — never as a relative
path into the other entry point's source.

A relative path is refused outright by ng-packagr, which reports the other
entry point's files as outside the importing entry point's `rootDir`. That
refusal is worth understanding rather than working around: were it to succeed,
each entry point would compile its own copy of the `SlField` class, and two
copies of a class are two different injection tokens. `inject(SlField)` inside
`SlInput` would find nothing, in a build that reported no error.

With the published path, ng-packagr resolves the dependency itself and emits
`import { SlField } from '@slotted/angular/field'` into the input bundle. One
class, one token.

Two resolvers need to be told about the path, because only ng-packagr knows it
by itself:

- `packages/angular/tsconfig.spec.json` maps `@slotted/angular/*` to
  `./*/src/public-api.ts`, so the unit tests compile against source. The
  mapping is deliberately not in `tsconfig.lib.json`: that is ng-packagr's own
  configuration, and pointing it at source is how the duplicate-class failure
  above would be reintroduced.
- The Angular Storybook aliases the same specifier in its Vite configuration,
  for the same reason and to the same files.

The layer rule is unaffected. It ranks packages, and both entry points belong
to `@slotted/angular`.

React needs none of this. Both families are entry points of one Vite build, so
the shared context module is hoisted into a chunk both import, and the context
identity holds.

## What a Control Takes From the Field

The same list `fieldControl` applies, and for the same reasons:

| Attribute          | From the field when the control sets nothing |
| ------------------ | -------------------------------------------- |
| `id`               | always                                       |
| `aria-describedby` | merged after any value the consumer set      |
| `aria-invalid`     | when the field is invalid                    |
| `aria-required`    | when the field is required                   |
| `disabled`         | when the field is disabled                   |
| `readonly`         | when the field is read-only                  |

A control registers itself with the field, so the field's development-time
warning about a missing control stays accurate. Without that, a field holding
only an `Input` would warn that it has no control.

## Out of Scope

Leading and trailing adornments — an icon inside the input, a unit after it —
are not part of this. They are a layout problem with their own answers about
click targets and padding, and they are better designed against a real
requirement than added speculatively to the first control.
