# 0001 — One top-level cascade layer, `slotted`

Status: accepted, 2026-08-31.
Sublayer order superseded by `0004-theming-architecture.md`.

## Context

The library shipped four layer names — `slotted.tokens`, `slotted.theme`,
`slotted.components`, `slotted.overrides` — declared in one order statement
emitted by the build of `@slotted/theme`, today
`packages/theme/scripts/write-styles.mjs`. Two of the four held rules.

The statement reached the document only through `@slotted/theme/styles.css`.
Angular ships no stylesheet: its component CSS is inlined and injected when a
component first renders, so an Angular application that imported the theme and
nothing else registered no order at all. React had the same gap through
`@slotted/react/styles.css`.

A layer takes its position from the first mention of its name. An application
that mentioned a `slotted` sublayer before the library did — writing into
`slotted.overrides`, the layer the library invited it to use — registered that
layer below `slotted.components`, and its rules lost with no error.

## Decision

`slotted` is the only top-level layer, and the only name in the public
contract. An application orders the entire library against its own CSS with
`@layer slotted, app;`.

The published internal order is
`@layer slotted.reset, slotted.tokens, slotted.theme, slotted.components;`.
It is exported once as `LAYER_ORDER_STATEMENT` from
`@slotted/theme/layer-order` and emitted at the top of every distributed
stylesheet, so any single import establishes it. Restating it is inert.

`slotted.overrides` is removed. Unlayered application CSS already beats every
layer, and an application that layers everything uses the one-line
declaration. A layer named by the library is a layer whose position the
library controls, which makes it the wrong place for rules the application
owns.

`slotted.reset` and `slotted.tokens` are declared and empty. A name inserted
later would reorder what already shipped; reserving a position costs a string.

## Consequences

`@slotted/themes` is the entry that carries the order for Angular. It
was already a required import, since every family reads its values from the
theme.

Four checks hold the contract: `packages/theme/src/layer-order.test.ts` pins
the string, `packages/theme/test/styles.test.mjs` pins
`@slotted/theme/styles.css` opening with it, `packages/theme/src/render.test.ts`
pins every theme stylesheet opening with it, and
`packages/react/package-boundary.verify.mjs` fails the React build when the
bundled stylesheet does not open with it.

Applications written against `slotted.overrides` before this change move those
rules to their own layer or leave them unlayered.

## Addendum, 3 September 2026

The CSS theming design adds two layer
names, `slotted.theme-overrides` and `slotted.preferences`, and does not
revive `slotted.overrides`.

The decision above stands as written. A theme is not the case it ruled on: its
rules are scoped by `data-slotted-theme`, and the validator that admits a theme
requires the file to open with `LAYER_ORDER_STATEMENT`. That obligation is what
application CSS never carried, and it is what made the removed layer lose its
rules silently. Both new names belong to artifacts the library validates, so
their position is one the library still controls.
