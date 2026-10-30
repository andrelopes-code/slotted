# State, events and identity

Repository law for every family that holds state a consumer can own, and for
the identifiers a consumer selects a family by. It is binding for every family
the rebuild has reached; the families listed in `specs/legacy-families.json`
predate it.

## Two modes, decided once

A family holds state in one of two modes.

- **Controlled.** The consumer owns the value and passes it in. The component
  never moves it; it asks, and waits for the consumer's next value.
- **Uncontrolled.** The component owns the value and reads an initial one once.
  A later change to that initial value does not silently become new state.

The mode is decided by whether the controlled value is present, and it does not
change for the life of the component. `@slotted/core/state` implements both, so
the two bindings cannot disagree about which one they are in.

Every mutable capability names its own model in the family contract:

```json
"stateModel": {
  "open": {
    "controlled": "open",
    "uncontrolled": "defaultOpen",
    "request": "onOpenChange",
    "reasons": ["pointer", "keyboard", "escape", "outsidePress"]
  }
}
```

`specs/contract.schema.mjs` rejects a mutable capability with no model, and a
model naming a capability the family does not hold.

## A change is a request, and it carries a reason

A component asks to move; it does not announce that it moved. The request
carries the new value, the value it replaces, the reason, and the originating
event, and it can be cancelled before anything commits.

The reason vocabulary is closed: `pointer`, `keyboard`, `clear`, `remove`,
`select`, `dismiss`, `escape`, `outsidePress`, `blur`, `submit`,
`programmatic`, `timeout`, `scroll`, `resize`, `back`, `dictation`. A family
declares the subset it can emit.

`timeout` says the time the component was given ran out, and it is neither of
the two words a family without it would reach for: `dismiss` is the reader
pressing the control, and `programmatic` is the application asking. It was added
when `toast` became the first family in the library to hold a timer of its own.

`scroll` says the reader scrolled past the thing and it answered; `page-header`
was the first family whose state a scroll moves. `resize` says the space the
thing was given changed and it answered; `app-shell` was the first family whose
state a width moves. Neither is `pointer`, because a wheel, a fling and a window
corner are gestures and none of them is a press on the control, and neither is
`programmatic`, because the application asked for nothing.

`back` says the platform's own way back — a phone's gesture, a browser's
button — was used while a modal layer stood over the page, and the layer
answered instead of the history. It is neither `escape`, which is a key the
platform may not have, nor `dismiss`, which is the reader pressing a control
of the layer's own. `dismissable-layer` holds one close watcher per layer
that asks for it where the platform has `CloseWatcher`, and one history entry
elsewhere, so the gesture reaches the layer and never the page under it;
`dialog`, `drawer` and `app-shell` were the first families to ask.

`dictation` says the reader spoke and the platform's speech recognition wrote
the words. It is neither `keyboard`, because no key was pressed, nor
`programmatic`, because the application asked for nothing; `prompt-composer`
was the first family to take speech.

A boolean cannot say whether a menu closed because Escape was pressed or
because focus left the layer, and a consumer that has to guess writes the wrong
handler. Two different events for the same transition are the same failure
stated twice.

The originating event has no shared type: React and Angular do not agree on
one. It is opaque in the conceptual contract and typed in each binding.

A request for a value equal to the current one is not emitted. There is nothing
to decide and nothing to cancel.

## Bindings

| Concept            | React                         | Angular                                   |
| ------------------ | ----------------------------- | ----------------------------------------- |
| current value      | `value`                       | `[value]`                                 |
| requested change   | `onValueChange(value, event)` | `(valueChange)`                           |
| uncontrolled start | `defaultValue`                | initial input plus internal state         |
| forms              | native props                  | `ControlValueAccessor` for Reactive Forms |

The names belong to the bindings. The behavior belongs to the contract, and
the contract is what the tests hold.

`ControlValueAccessor` is not part of the conceptual contract, and the Angular
binding still implements it wherever a control belongs in a form.

## Identity in the DOM

A family is selected in public by `data-ui`, whose value is the family name,
written on the root part. Its parts are selected by `data-part`. States appear
as the attributes `specs/contract.schema.mjs` declares — `data-disabled`,
`data-open`, and the rest of that vocabulary.

Class names and DOM structure are not contract. A stylesheet that keys on a
class leaves the consumer with no selector that is safe to rely on and one that
is not, and the two look identical from outside.

## Precedence between states

Two states that can be true at once resolve in the order `STATE_PRECEDENCE`
declares, strongest first: `disabled`, `loading`, `readonly`, `invalid`,
`checked`, `selected`, `pressed`, `current`, `complete`, `active`, `hover`,
`focus-visible`, `default`.

`complete` sits under `current` because where the reader is now outranks what
they have already done, and under `invalid` because a completed step that
failed is a step that failed. It was added when Stepper found the vocabulary
had no word for a step a flow has finished; `checked` and `selected` are both
the reader's own choice and neither describes it.

A weaker state holds itself back for every stronger one. A disabled control
does not answer hover; a loading control does not answer press. The library
learned this from a defect — several controls painted a hover fill on a control
the browser had already disabled — and `packages/styles/src/states.test.mjs` is
what keeps the rule from being relearned the same way.
