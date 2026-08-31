# Splitter Design

## Outcome

Two adjacent regions whose shared boundary the user can move, with the pointer
and with the keyboard. It is the last T1 component and the only one in that
tier with real interaction.

This document exists because four of its decisions would otherwise be
rediscovered: how many panes it holds, what `orientation` means when the
separator runs the other way, where the position lives in CSS, and why it
introduces no `@slotted/core` module.

## Two Panes, Not N

The family holds exactly two panes with one separator between them.

A splitter over N panes is a different problem: N−1 separators whose
constraints are coupled, because moving one can push another past its minimum,
and a policy is then needed for which neighbour absorbs the difference. That
policy is a product decision, and no two libraries make it the same way.

Two panes need no policy. Three regions are two nested splitters, which
composes without the library choosing anything on the consumer's behalf. If a
real requirement for coupled N-pane resizing appears, it is a second component
with its own contract, not a prop on this one.

## `orientation` Describes the Panes; `aria-orientation` Describes the Separator

These are perpendicular, and reading one as the other is the mistake this
section exists to prevent.

`orientation` on the root says how the two panes are arranged, matching Tabs
and ButtonGroup: `horizontal` puts them side by side. The separator between two
side-by-side panes is a vertical line, so its `aria-orientation` is `vertical`.

| Root `orientation` | Panes       | Separator line | `aria-orientation` | Arrow keys   |
| ------------------ | ----------- | -------------- | ------------------ | ------------ |
| `horizontal`       | side by side | vertical       | `vertical`         | Left, Right  |
| `vertical`         | stacked      | horizontal     | `horizontal`       | Up, Down     |

`horizontal` is the default value of `aria-orientation` on `role="separator"`,
so the attribute is written only in the horizontal-panes case. That is the same
rule Divider follows: write the departure from the element's own semantics, not
the agreement with it.

## The Position Lives in a Grid Template, Not a Custom Property

The root is a grid of three tracks — pane, handle, pane — and the position is
the first track's size, set as an inline `grid-template-columns` or
`grid-template-rows` on the root.

The alternative was a custom property on the root that the stylesheet reads
into the first pane's `flex-basis`. It was rejected for two reasons. Sizing a
pane by `:first-child` makes DOM order load-bearing in a way no test could
state clearly, and setting a custom property through a framework style binding
is the one part of that API whose support differs between React and Angular.
A grid template is an ordinary property in both, and the inline axis follows
the document's direction, so a right-to-left document needs nothing extra.

## No `@slotted/core` Module

Splitter introduces no core module, and the catalog's core table does not
list one for it.

What it needs — a rectangle, a fraction, a clamp — is four lines that read
clearly where they are used and would read worse behind a name. The rule that
`core` modules are written by the first component that genuinely needs them
cuts both ways: a module extracted here would be confirmed by no second caller
and would fix a signature around one case.

`core/focus` is not involved either. Roving tabindex coordinates a set of
peers; a splitter has one focusable separator.

## Keyboard Model

Taken from the WAI-ARIA Authoring Practices window splitter pattern.

| Key                           | Result                                            |
| ----------------------------- | ------------------------------------------------- |
| Arrow towards the start edge  | Moves the separator one `step` towards the start  |
| Arrow towards the end edge    | Moves the separator one `step` towards the end    |
| Home                          | Moves the separator to `min`                      |
| End                           | Moves the separator to `max`                      |
| Enter                         | Collapses to `min`, or restores the last position |

The arrow pair is the one perpendicular to the separator: Left and Right for a
vertical separator, Up and Down for a horizontal one. The other pair is left
alone, so a page that scrolls still scrolls.

`F6` appears in the pattern as an optional way to move focus between panes. It
is not implemented: it is a window-management convention that belongs to the
application composing the panes, not to the separator.

## Accessibility Contract

- The handle is `role="separator"` with `tabindex="0"`, which is what makes a
  separator a widget rather than a decoration.
- `aria-valuenow`, `aria-valuemin` and `aria-valuemax` report the position as a
  percentage of the container, which is the unit the value is held in.
- `aria-controls` points at the pane the value describes, so a screen reader
  can say which region the number belongs to.
- The handle needs an accessible name. A development build warns when neither
  `aria-label` nor `aria-labelledby` is present, matching ProgressBar. It
  warns rather than throws for the same reason: the layout still works.

## Value

`value` is the percentage of the container taken by the first pane, held by the
consumer or by the component, with `defaultValue`, `value` and `onValueChange`
in React and a `model` in Angular — the shape Tabs already established.

A percentage rather than a pixel count, because the container's size is not
known until layout, and a pixel value taken from one viewport is wrong on the
next. `min` and `max` are percentages for the same reason.

A value outside `min`…`max` is clamped, as ProgressBar's is, and the clamped
value is the one reported: the announcement and the layout cannot disagree.
