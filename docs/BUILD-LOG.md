# Build Log

One entry per component, appended as it lands. Written for a reader with no
memory of the session that produced it.

## VisuallyHidden — 2026-08-31

- Decisions: `focusable` joins the shared capability vocabulary rather than
  being left out of the contract. The skip-link variant cannot be assembled by
  a consumer from the plain one, because the reveal has to cancel the same
  declarations that hide it. The stylesheet expresses that as one rule that
  stops matching under `:focus-within`, not as a hiding rule plus an undoing
  rule. The token list is empty on purpose: nothing about clipping is a theme
  decision.
- Decisions: the Angular selector is the bare attribute `[slVisuallyHidden]`,
  the second element-agnostic selector in the library after `slFieldControl`,
  because the element is the consumer's choice. It is a component rather than a
  directive only because a directive carries no `styleUrl`.
- Defects found: `packages/angular/button/src/bundle.styles.test.mjs` asserted
  the bundled-style invariant against one hard-coded entry point, so field and
  tabs were never checked. Generalized to walk every directory holding an
  `ng-package.json` and moved to `packages/angular/src/`.
- Deviations: none.
- Follow-on: Spinner reuses `visually-hidden.css` for its status label instead
  of duplicating the clip technique. An Angular component can list several
  entries in `styleUrls`; React imports both stylesheets. This keeps Spinner
  free of a dependency on the VisuallyHidden component while sharing its one
  authored rule.

## Divider — 2026-08-31

- Decisions: `decorative` joins the shared capability vocabulary. The rendered
  element is `hr`, so the separator role arrives from the platform and the
  component writes only its two departures from it: `role="none"` when the rule
  is decoration, `aria-orientation` when it runs vertically. Tests assert both
  absences, since setting them unconditionally would pass everything else.
- Decisions: the rule is painted with `background-color` on a border-less
  element, not with a border, so one thickness token serves both orientations.
  A vertical rule carries a minimum length, because `block-size: 100%` resolves
  to nothing in a plain block container and the rule would vanish.
- Decisions: the Angular selector is `hr[slDivider]`, element-bound, while
  React reaches other elements through `render`. Conceptual parity, not
  identical APIs.
- Defects found: none.
- Deviations: none.
- Follow-on: the family has no labelled variant — the "OR" rule with text in
  the middle — because `hr` admits no children. If one is wanted it is a
  different element and a second member, not a prop on this one. Menu (T5) will
  need a separator inside a `ul`, where `hr` is not valid content; React can use
  `render`, and Angular will need either a second selector or a `li[slDivider]`
  member. Decide it when Menu is designed.

## Spinner — 2026-08-31

- Decisions: `size` joins the vocabulary as a capability distinct from
  `appearance`. `appearance` obliges a member to document a variant, a fill and
  a size; a spinner has one axis, and claiming the larger capability would have
  meant documenting two props that do not exist.
- Decisions: `decorative` is reused from Divider rather than a second word
  invented for the same removal from the accessibility tree. A vocabulary entry
  earning its second caller is the evidence it was named at the right altitude.
- Decisions: the label is a rendered part carrying the shared
  `slotted-visually-hidden` class, not an `aria-label`. The root is a polite
  live region, and a live region announces the content it gains; an attribute
  is not content, and a string in the template is the one a translation pass
  finds. This is the first family to reach for another family's stylesheet —
  Angular through a second entry in `styleUrls`, React through a second import.
- Decisions: under `prefers-reduced-motion` the ring slows rather than stops. A
  stopped ring still claims a wait is in progress while reporting nothing about
  it.
- Defects found: none.
- Deviations: none.
- Follow-on: the Button family paints its own loading ring with
  `.slotted-button__spinner` and its own `--slotted-button-loading-indicator-*`
  tokens, which now duplicates `spinner.css`. Consolidating means pointing
  Button's default indicator at the spinner stylesheet and retiring those
  tokens from `packages/tokens/src/contract.json`, which is a token-contract
  change and a theme revalidation. It is worth doing and it is not a T1 task;
  take it as its own change with both frameworks in one commit. The class is
  internal, so no public contract moves.
