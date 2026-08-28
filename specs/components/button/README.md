# Button Contract

## Purpose

Button performs an immediate action. Navigation belongs to the future LinkButton family member, and pressed state belongs to ToggleButton.

## Invariants

- Render a native `button` in both frameworks.
- Default `type` to `button`; preserve explicit `submit` and `reset`.
- Preserve native attributes, events, focus, disabled behavior, and accessible naming.
- Use logical leading and trailing parts rather than left and right.
- Keep React and Angular semantics and visual axes equivalent without sharing runtime code.

## Implemented Slice

The implemented slice is the exact machine-readable surface in `contract.json`.

## Accessibility

Visible text supplies the accessible name. Icon-only usage is not part of this slice; future IconButton requires an explicit accessible name. Disabled uses the native disabled state. Focus is shown only for `:focus-visible`.

## Theme Contract

Button consumes public `--slotted-*` custom properties. Internal classes are private.

## Capability Horizon

Future slices may add loading, icon-only actions, full-width layout, RTL hardening, forced colors, LinkButton, ToggleButton, ButtonGroup, SplitButton, and composed menu actions. This list is non-normative and is not an implementation backlog.

## Contract Escape Hatch

`contract.json` exists only while at least two deterministic checks consume it usefully. It is not a runtime or published API and may evolve with the component.

After the third component is implemented, review whether structured JSON is reducing real cross-framework drift. If fewer than two useful deterministic checks still consume it, remove the format before it becomes a repository convention.
