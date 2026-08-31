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

## Link — 2026-08-31

- Decisions: underline is a per-instance axis, not a theme token. The same
  application under one theme wants an underline in prose and none in a
  sidebar, so a token could not express it. `always` is the default because
  colour alone does not mark a link for a reader who cannot see the difference.
- Decisions: the underline returns under `forced-colors: active` whatever the
  axis says. The palette flattens the contrast a bare link relies on, and the
  axis is a stylistic preference that must not survive into a mode chosen for
  legibility.
- Decisions: `external` sets `target`, `rel` and a hidden warning, all three
  yielding to values the consumer passed. The warning's wording is a prop with
  a contract-declared default, so it is translatable and so the two frameworks
  cannot drift to different sentences.
- Defects found: none.
- Deviations: the external hint's leading space lives inside the string, not as
  a template text node. Accessible name computation concatenates adjacent
  alternatives without a separator, and Angular strips a whitespace-only text
  node before it reaches the DOM. The React tests assert the rendered text
  rather than the computed name's spacing: `dom-accessibility-api` trims each
  alternative, so asserting spacing there would test the test library.
- Follow-on: Breadcrumb, Sidebar and EmptyState all consume this family.
  Breadcrumb will want `underline="hover"` throughout; if a third caller wants
  the same, consider whether the default belongs to a context rather than a
  prop. Angular snippets must stay under roughly 70 characters on one line —
  Prettier's angular printer breaks a longer element onto a hanging `>` even
  well inside printWidth 100, and the snippet format test then fails.

## Badge — 2026-08-31

- Decisions: the variant axis is asserted equal to the button family's rather
  than retyped, so the two cannot drift into naming the same five tones
  differently.
- Decisions: the fill axis is `solid` and `outline` only. A `subtle` fill needs
  a resting tint and the theme has none — it has `--slotted-tone-*-subtle-hover`
  and `-subtle-active`, which are interaction states and would be a lie at rest.
  Extending the token contract for a single caller is the mistake the
  core-module rule exists to prevent.
- Decisions: `appearance` covers all three axes, which obliged the family to
  have a size axis. `sm` and `md` are real: a badge in a table row and a badge
  beside a heading are not the same size.
- Decisions: no role, on either side. What a badge means comes from where it
  sits. The reference pages carry the consequence — a bare count needs an
  accessible name from the consumer.
- Defects found: `button.css` set `min-height` three times, breaking the
  logical-properties rule that had never been written as a test. The per-family
  checks added earlier tonight searched for the substring `height:`, which
  `line-height` contains, so they could not have found it. Replaced by one
  `packages/styles/src/logical.test.mjs` that walks every stylesheet, matches at
  a token boundary, and names the logical counterpart in the failure.
- Deviations: none.
- Follow-on: Tag and Alert (T2) both want a subtle fill. When the second of them
  arrives, add `--slotted-tone-*-subtle` to `packages/tokens/src/contract.json`
  and both schemes of the default theme, then give Badge, Tag and Alert the
  third fill in one change.

## Avatar — 2026-08-31

- Decisions: three members, not one component with `src` and `initials` props.
  The fallback is arbitrary content — initials, an icon, a company mark — and
  the consumer owns it.
- Decisions: `loaded` joins the state vocabulary as one boolean on the root.
  Pending and failed are the same situation for everything that reads the
  state, so a three-valued attribute would have added a distinction nothing
  acts on, and invariant 5 forbids a single-valued `data-state` anyway.
- Decisions: both parts are always rendered and the stylesheet removes one with
  `display: none`. Conditional rendering would have put the decision in two
  different places in the two frameworks, and Angular cannot project content
  inside a control-flow block without a wrapper. `display: none` also keeps the
  picture and the initials from ever both reaching the accessibility tree.
- Decisions: no shape axis. Whether avatars are round is a brand decision taken
  once per application, so it is `--slotted-avatar-radius`.
- Decisions: the image reports through a callback ref (React) and
  `ngAfterViewInit` (Angular) as well as through the load event. A picture
  already in cache finishes before the listener is attached; without the check,
  every page after the first shows initials over a picture that is already
  there. Both suites assert it by replacing the `complete` and `naturalWidth`
  getters on `HTMLImageElement.prototype`.
- Defects found: none.
- Deviations: none.
- Follow-on: an avatar group — overlapping avatars with a "+7" overflow — is a
  separate family, not a prop here. It needs a stacking direction and a
  z-ordering rule, neither of which belongs on a single avatar.

## Skeleton — 2026-08-31

- Decisions: `shape` joins the vocabulary, distinct from `size`. A text
  placeholder takes a line's height and the width available, a circle takes an
  aspect ratio, a rectangle takes what the consumer gives it — three
  relationships to the surrounding layout, not three points on one scale.
- Decisions: `aria-hidden="true"` by default, with `aria-hidden="false"` as the
  explicit escape hatch on both sides. Announcing the wait belongs to the
  region the placeholders fill, through `aria-busy`.
- Decisions: the animation pulses opacity. A gradient sweep needs a second,
  lighter colour that the theme does not own, and inventing that token to serve
  an effect is backwards.
- Decisions: under reduced motion the animation stops outright, where Spinner's
  only slows. A spinner reports through motion and says nothing once still; a
  skeleton reports through shape, which does not move.
- Defects found: none.
- Deviations: none.
- Follow-on: React's `render` prop takes an `undefined`-valued prop as absent,
  so "pass undefined to remove the default" cannot work as an API. Any later
  component with a defaulted ARIA attribute should use an explicit value as its
  escape hatch, as this one does.

## Kbd — 2026-08-31

- Decisions: one key per element. A combination is several elements with a
  separator the consumer writes, because the separator is text in their
  language and the order of modifiers differs between platforms — a component
  rendering "Ctrl+K" from a string would have to decide both.
- Decisions: each size reads one token for both the minimum block size and the
  minimum inline size, so a single key is square whatever the type size is. The
  style test asserts the two read the same token, not that they happen to hold
  equal values today.
- Decisions: the reference pages say where a shortcut is actually announced —
  `aria-keyshortcuts` on the control that responds to it. The printed key is a
  picture of the shortcut and announces nothing.
- Defects found: none.
- Deviations: React and Angular landed in one commit rather than two. The family
  has no behaviour to speak of, and splitting it would have left the library
  inconsistent between commits for no gain.
- Follow-on: Command (T7) and Tooltip (T5) print shortcuts. If either needs a
  combination rendered from data rather than written out, the separator and the
  platform-dependent modifier order are the two questions to answer first.

## ProgressBar — 2026-08-31

- Decisions: a div with `role="progressbar"`, not the native `progress`. A
  native progress bar can only be painted through engine-specific
  pseudo-elements (`::-webkit-progress-value`, `::-moz-progress-bar`) that sit
  outside the CSS specification and cannot be written once for both engines,
  and one authored stylesheet is the library's rule.
- Decisions: `measurement` joins the capability vocabulary and `indeterminate`
  joins the state vocabulary. Checkbox in T3 needs the same state word for the
  same meaning — a value that exists but cannot be given.
- Decisions: the root is the track. A separate track part would be a second
  element that adds a name and nothing else.
- Decisions: a value outside the range is clamped, and the clamped value is
  what `aria-valuenow` reports, so the announcement and the painted bar cannot
  disagree. Progress is usually computed from numbers the application does not
  fully control.
- Decisions: a missing accessible name is a `console.warn` in development, not
  a throw. IconButton throws because a nameless icon button is unusable; a
  nameless progress bar still reports visually, and taking down a screen
  mid-upload is worse than the defect.
- Decisions: the indeterminate bar travels by animating `inset-inline-start`,
  so it runs the way the document reads. A translation runs the same way in
  both directions, which is wrong in one of them.
- Defects found: every family's token check was a copy of one pattern anchored
  directly to the token name, so it missed any `var(` Prettier had wrapped —
  the longest declarations, exactly. `skeleton.tokens.json` was short one entry,
  and nothing could notice, because the generator and the assertion shared the
  flaw. Replaced by `packages/styles/src/tokens.test.mjs`, one test over every
  family, which also fails a family shipping a stylesheet with no token list.
- Deviations: none.
- Follow-on: LoadingBar and Stepper (T2) and FileUpload (T2) build on this.
  LoadingBar is the page-level case and will want to sit fixed at the top of the
  viewport; that is a positioning decision, not a new measurement.

## DescriptionList — 2026-08-31

- Decisions: `orientation` is reused rather than a `layout` word invented for
  the same idea. The axis a term and its details are arranged along is an
  orientation. `vertical` is the default because a stacked pair survives a
  narrow column and a two-column one does not.
- Decisions: in the horizontal arrangement each part is pinned to a grid
  column. One term followed by several `dd` elements is valid HTML, and under
  auto-placement the second value takes the next term's cell and shears the
  rest of the list. Both Storybooks show that case.
- Decisions: no role anywhere. `dl`, `dt` and `dd` carry the pairing, and the
  tests assert each absence.
- Defects found: none.
- Deviations: none.
- Follow-on: the layout requires `dt` and `dd` as direct children of the `dl`.
  A wrapping `div` per pair is valid HTML and would fall out of the grid;
  `display: contents` on such a wrapper would fix the layout, and it is not
  added speculatively. If a consumer reports it, that is the one-line answer.
