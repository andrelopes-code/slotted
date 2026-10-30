# Button family contract

## Purpose

A momentary action, navigation wearing the same surface, an action with no room
for a label, and an action that stays on. `contract.json` is the
machine-readable form: the identifier, the axes, and each member's element,
defaults, capabilities, states and parts.

## Members

| Member       | Element  | What only it does                                                 |
| ------------ | -------- | ----------------------------------------------------------------- |
| Button       | `button` | A momentary action                                                |
| ButtonLink   | `a`      | Navigation, native or router-owned, and a destination it can lose |
| IconButton   | `button` | A square control with a mandatory name, `shape` and `pressed`     |
| ToggleButton | `button` | `aria-pressed`, with a label that never changes with the state    |

## Identity

The root of every member carries `data-ui="button"` and `data-part="root"`.
IconButton is a member rather than a family: it is the same surface, the same
state machine and the same geometry scale, and what differs is its content and
the shape that follows from it. `[data-ui='button'][data-shape]` is how an
icon-only control is selected in public.

Class names and the shape of the tree below the root are not contract.

## Axes

`tone` names one of the five semantic colors; `variant` names how it is
painted — `solid`, `outline` or `ghost`; `size` names the step of the control
scale; `shape` belongs to IconButton alone. There is no `fill`: it was the old
name of `variant`, and `variant` was the old name of `tone`. There is no `soft`
either: a pale tinted fill read as a control on its way to being unavailable
rather than as a quieter action, so a bounded quiet action is `outline` and an
unbounded one is `ghost`.

## Invariants

- Every geometric value is read from `--slotted-control-*`. The family declares
  no component token, so a theme retunes every control once.
- **No state changes a size.** A state may change a color and nothing else;
  the two that need more weight than a color are drawn outside the border box,
  by a ring and by an outline. A control is exactly the height its density
  states.
- `loading` refuses activation, announces itself through a named `progressbar`,
  keeps focus, and preserves both the inline size and the accessible name. The
  ring takes the first visual slot the control has; a control with none fades
  its label in place. `loadingDelay` holds the picture back without letting the
  action through.
- `disabled` refuses the action. `focusableWhenDisabled` decides whether it also
  leaves the tab sequence, which is a second decision the platform does not
  separate from the first.
- `pressed` belongs to ToggleButton and IconButton. Button is a momentary
  action and never carries it.
- An application sets the family's defaults once, per axis, and an axis it
  leaves unset keeps each member its own.
- A change is a request carrying the value, the value it replaces, the reason,
  the originating event and `cancel()`.
- Native props, events, refs and form behavior reach the element that owns
  them, and an explicit consumer value always wins.

## Accessibility

The visible label supplies the accessible name; IconButton requires an explicit
`aria-label` or `aria-labelledby`. Focus is shown for `:focus-visible` only.
`disabled` is the platform's on a button unless `focusableWhenDisabled` asks for
`aria-disabled` and a refusal the family enforces itself. A waiting control is
always of the second kind: focus has to survive an action the person just
started. An anchor has no native disabled
state, so a disabled ButtonLink loses its `href` and gains `role="link"`,
`aria-disabled="true"` and `tabindex="0"`.

## Theming

The family consumes public `--slotted-*` custom properties and declares none of
its own. `packages/styles/src/button/button.tokens.json` lists exactly what its
stylesheet reads.
