# Button Family Contract

## Purpose

The Button family defines related action, navigation, toggle, icon-only, and grouping semantics. Its machine-readable contract describes shared axes, each member's defaults, parts, capabilities, states, and the scenarios that document the family.

## Implemented Family

| Member       | Purpose and native semantics                                                                 |
| ------------ | -------------------------------------------------------------------------------------------- |
| Button       | Performs an action; renders a native `button`.                                               |
| ButtonLink   | Navigates; renders a native `a`.                                                             |
| IconButton   | Performs an icon-only action and requires an explicit accessible name.                       |
| ToggleButton | Represents a controlled pressed state.                                                       |
| ButtonGroup  | Provides semantic grouping; orientation and exclusive behavior belong to the group contract. |

## Invariants

- Members use their declared native elements and semantic defaults.
- Button, IconButton, and ToggleButton default `type` to `button`; Button preserves explicit `submit` and `reset`.
- Preserve native attributes, events, focus, disabled behavior, and accessible naming.
- Use logical leading and trailing parts rather than left and right.
- Keep React and Angular semantics and shared family axes equivalent without sharing runtime code.

## Implemented Slice

The implemented family is the exact machine-readable surface in `contract.json`: shared axes and orientations, member definitions with defaults, parts, capabilities, and states, plus page scenarios.

## Accessibility

Visible text supplies the accessible name. IconButton always requires an explicit accessible name. Disabled uses the native disabled state where applicable. Focus is shown only for `:focus-visible`.

## Theme Contract

Button consumes public `--slotted-*` custom properties. Internal classes are private.

## Capability Horizon

Future slices may add RTL hardening, forced colors, SplitButton, and composed menu actions. This list is non-normative and is not an implementation backlog.

## Contract Escape Hatch

`contract.json` exists only while at least two deterministic checks consume it usefully. It is not a runtime or published API and may evolve with the component.

After the third component is implemented, review whether structured JSON is reducing real cross-framework drift. If fewer than two useful deterministic checks still consume it, remove the format before it becomes a repository convention.
