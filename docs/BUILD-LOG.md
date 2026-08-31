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
