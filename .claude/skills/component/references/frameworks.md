# Framework requirements

Share the family contract, authored stylesheet, semantics, and behavioural intent. Do not force React and Angular through one implementation or make their public APIs artificially identical.

The lists below are two different things, and only the first one has been enforced until now. Idiom is how the binding is _written_. Integration is what the binding _reaches_ in its ecosystem, and it is where a family stops being a styled box and starts being usable in a real application.

## Idiom

### React

- Use function components.
- Use `useId` for identifiers that must be unique and stable across hydration.
- Use context for state shared by a compound family.
- Use a `render` prop where the consumer must substitute the rendered element.
- Pass native props, events, `aria-*`, and `data-*` attributes through to the element that owns them.
- Respect `exactOptionalPropertyTypes`; absence and explicit `undefined` are not interchangeable by accident.
- Make shared state `undefined` by default so an unset value can defer to a provider or native default.
- Preserve ref access to the relevant native element when the existing family pattern exposes it.

### Angular

- Use standalone components and directives.
- Use `input()`, `model()`, and `output()` signals for public values and events.
- Use `computed` for derived state.
- Put host attributes, classes, styles, roles, and listeners in `host` metadata rather than `@HostBinding` or `@HostListener`.
- Use `ViewEncapsulation.None` with the one authored family stylesheet.
- Add `exportAs` when a template needs the component or directive instance.
- Prefer `inject()` over constructor parameters.
- Import another Slotted entry point only through `@slotted/angular/<name>`; never reach into its source or private path.
- Preserve native attributes and events on the element that owns them, including forms behaviour where applicable.

## Integration

Answer every line below in writing, for both bindings, before implementing either. Each gets `yes` and where it lives, or `no` and one sentence naming why the family does not need it. A blank line is an unanswered question, not a "no".

### React

| Question                                                                                            | Answered by                                                          |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Does a mutable value ship a controlled and uncontrolled pair, plus the request carrying a reason?   | `value` / `defaultValue` / `onValueChange(value, reason, event)`     |
| Can an application set this family's defaults once, rather than per instance?                       | a context provider, and the hook that reads it                       |
| Can a consumer substitute the rendered element of each public part?                                 | `render`, or a documented reason a part is fixed                     |
| Does the consumer's own handler still run when the family handles the same event?                   | compose, never replace                                               |
| Can a consumer reach the native element, and the imperative action it cannot express declaratively? | `ref`, and a named handle for `focus()` / `open()` / `scrollToKey()` |
| Does it render on the server without a hydration mismatch?                                          | `useId`, no layout read during render                                |
| Does every state a consumer may style appear in the DOM?                                            | the `data-*` vocabulary the contract declares                        |
| Is each part's props type the native element's, extended — not a hand-written subset?               | `ComponentPropsWithRef<'…'>`                                         |

### Angular

| Question                                                                           | Answered by                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Does a two-way value use the signal form the ecosystem expects?                    | `model()`, and `output()` for a request that carries a reason                                    |
| Does a control that belongs in a form work with Reactive Forms and template forms? | `ControlValueAccessor`, plus `Validator` where the family owns validity                          |
| Can an application set this family's defaults once, rather than per instance?      | an injection token and a `provideX()` function                                                   |
| Can a template reach the instance?                                                 | `exportAs`                                                                                       |
| Can a consumer substitute projected content, and keep it lazy?                     | named `ng-content` slots, `ngProjectAs`, `NgTemplateOutlet` for content that must be re-rendered |
| Is it correct with zoneless change detection and `OnPush`?                         | signals throughout; no `markForCheck` scattered to compensate                                    |
| Is every subscription and listener torn down?                                      | `takeUntilDestroyed`, `DestroyRef`                                                               |
| Does a static attribute the consumer wrote survive the host bindings?              | read it with `HostAttributeToken` before writing over it                                         |
| Does an entry point that others depend on stay a single class?                     | imported through `@slotted/angular/<name>`                                                       |

## Both

The consumer's explicit value always wins over context, inference, a provider, or derived state. Prefer the platform before ARIA or proprietary behaviour. Keep internal DOM private unless the contract explicitly exposes a part. Validate equivalent concepts and outcomes, not implementation parity.

Equivalent does not mean equally small. If one ecosystem offers a real integration point the other lacks — Reactive Forms, DI-provided defaults — the binding that has it uses it, and the self-assessment records the asymmetry instead of levelling both down to the smaller shape.
