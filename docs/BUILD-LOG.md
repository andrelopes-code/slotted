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

## Splitter — 2026-08-31

- Design: `docs/superpowers/specs/2026-08-31-splitter-design.md`. The only T1
  component with real interaction, and the only one that needed a document.
- Decisions: two panes, one separator. N panes need a policy for which
  neighbour absorbs a constraint violation, and no two libraries choose the
  same one; three regions are two nested splitters, which both Storybooks show.
- Decisions: `orientation` describes the panes and `aria-orientation` describes
  the separator, and they are perpendicular. `horizontal` is the ARIA
  attribute's own default, so it is written only for side-by-side panes.
- Decisions: the position is the first grid track's size, written inline. The
  rejected alternative was a custom property read into `flex-basis` on
  `:first-child`, which makes DOM order load-bearing and relies on the one part
  of the style-binding API whose support differs between the frameworks.
- Decisions: no `@slotted/core` module. A rectangle, a fraction and a clamp are
  four lines that read better where they are used, and a module extracted here
  would have its signature fixed by one caller with no second to confirm it.
- Decisions: the arrow pair along the separator is ignored, so a scrollable
  pane still scrolls. Both suites assert the absence.
- Defects found: the design document said the handle would set `aria-controls`
  at the pane it resizes. Implementing it means the root identifying which
  projected child is the first pane — child inspection or a mount-order
  registry in React, a content query in Angular — for an attribute the
  `separator` role does not require, and the registry misbehaves under a
  double-invoked render. Corrected in the same commit as the React
  implementation; the consumer passes it and the pages show that.
- Deviations: the React implementation was written before its tests. The
  design document had settled the behaviour and the component is large; the
  tests were written immediately after and both frameworks assert the same
  seventeen behaviours. Angular followed the usual order.
- Follow-on: T1 is complete. The next tier begins with Card, Tag, Alert,
  Collapsible and Breadcrumb. Tag and Alert both want the subtle fill Badge
  deferred, so that is the point to add `--slotted-tone-*-subtle` to the token
  contract and both schemes of the default theme, and to give Badge, Tag and
  Alert the third fill in one change.

## Tone surface, Badge subtle fill — 2026-08-31

- Decisions: `--slotted-tone-<tone>-surface` is a new role, not another step on
  the `subtle-hover` / `subtle-active` ladder. Those two are what a transparent
  control becomes on interaction; using one as a resting fill would make the
  name a lie and leave an interactive component nowhere to move on hover. The
  defaults reuse palette steps the theme already names, so the change adds no
  colour decisions.
- Decisions: the rejected alternative was shifting `subtle-hover` and
  `subtle-active` up a step to make room, which changes how the shipped Button
  family looks for a reason no consumer asked for.
- Decisions: Badge's third fill landed across contract, stylesheet, both
  frameworks and both reference pages in one commit, because a public axis
  gained a value and no commit may leave the frameworks disagreeing.

## Card — 2026-08-31

- Decisions: no axes at all. Every difference between one card and another in
  an application is a token decision, and a variant prop would be the library
  guessing which differences matter.
- Decisions: transparent surface with a border. The theme owns no neutral
  surface colour and adding one to serve a single component is backwards;
  `--slotted-card-background` fills a card when a theme wants that.
- Decisions: a region at either end takes the padding its missing neighbour
  would have carried, so a card of only a body is not visibly tighter than a
  full one. Asserted, because that is the case a three-region layout usually
  gets wrong.
- Deviations: the Angular card stories import Badge and Divider by relative
  path across entry points. Stories are not reachable from any `public-api.ts`,
  so this is not a runtime dependency and ng-packagr builds unchanged. Keeping
  the two Storybooks scenario for scenario is worth more than an import purity
  no check measures.

## Tag — 2026-08-31

- Decisions: two members — the value and the control that removes it. The
  appearance axes are asserted equal to Badge's rather than retyped.
- Decisions: selection is absent. A selectable tag is a toggle, and the button
  family already owns that behaviour.
- Decisions: the cross on the remove control is drawn in CSS, so neither
  framework ships a glyph and the two cannot drift. The bars are centred with
  `inset: 0; margin: auto`, which is symmetric in either reading direction — a
  logical inset plus a physical percentage translation is not.
- Decisions: the hover and press washes mix `currentColor`, so they lighten a
  solid tag and darken a subtle one without a token per case.
- Defects found: none.
- Follow-on: the library now has two answers for a missing accessible name.
  IconButton throws; ProgressBar, SplitterHandle and TagRemove warn. The rule
  that fits the evidence is: throw when the component cannot do its job without
  the name, warn when it still does its job and only the announcement suffers.
  Worth writing down as a policy the next component can follow rather than
  rediscover.

## Alert — 2026-08-31

- Decisions: `live` joins the capability vocabulary — `off` sets no role,
  `polite` sets `role="status"`, `assertive` sets `role="alert"`. Whether a
  message interrupts is the one thing the library cannot infer, and `off` is
  the default because most alerts are on the page before anyone reads it.
- Decisions: the four regions are placed by grid area, not source order, so a
  message with no title or no icon collapses that track instead of shifting
  everything else. The icon spans both rows.
- Decisions: only the solid fill takes the tone as its text colour. Tone-
  coloured body text on a tinted surface is harder to read, and the surface and
  the icon already carry the tone.
- Decisions: the icon is `aria-hidden` by default, with the explicit
  `aria-hidden="false"` escape hatch Skeleton established.
- Defects found: none.
- Deviations: a shell heredoc generating the Angular part directives produced
  `selector: ''` — zsh reads `$el[...]` as an array subscript. Caught by the
  Angular compiler before the commit; the files are now generated from Python.
- Follow-on: Alert has no dismiss member. Dismissal is a button the consumer
  puts in `alertActions`, and the focus that button leaves behind is an
  application decision. Revisit if Toast (T4) needs the same affordance, which
  would be its second caller.

## Breadcrumb — 2026-08-31

- Decisions: no separator member. A slash between crumbs is decoration a screen
  reader should not read, so the stylesheet draws it from a token on every item
  after the first. The contract records `separator: "stylesheet"` so the
  absence reads as a decision.
- Decisions: `current` joins both vocabularies — the capability and the
  `data-current` state. The current crumb keeps its href and carries
  `aria-current="page"`, as the Authoring Practices example does; dropping the
  link would take it out of the tab order and out of the enumerable links.
- Decisions: the nav takes a default name of "Breadcrumb", which steps aside
  when the consumer passes `aria-labelledby`. Two unnamed navigation landmarks
  give a screen reader two identical entries.
- Defects found: the separator's colour originally fell back to `GrayText`,
  which the fallbacks test forbids in a decorative pseudo-element. Removed: with
  no theme the declaration is invalid and the separator takes the colour around
  it, which is what decoration should do.

## Collapsible — 2026-08-31

- Decisions: `details` and `summary`, not a button and a div. The disclosure
  role, the expanded state, Enter and Space, and find-in-page reaching text
  inside a closed region all come from the platform. The costs are real and
  recorded: `details` does not animate its own height, and the trigger must be
  the first child.
- Decisions: the state is read from the platform's `open` attribute, recorded
  as `openAttribute`, rather than duplicated as a `data-expanded` that nothing
  would keep in step.
- Decisions: a controlled React Collapsible is put back where the consumer says
  it is. A `details` opens itself and React re-renders nothing when the consumer
  ignores the change, so without the reassignment "controlled" would have meant
  "notified". Angular's `model` writes the change back instead, which is the
  same guarantee reached the framework's own way.
- Defects found: none.
- Deviations: Angular's `model()` accepts no `transform`, unlike `input()`, so
  `open` is a plain boolean model. Worth remembering for every later component
  with a two-way boolean.
- Follow-on: Accordion (T3) is a group of these. `<details name="...">` gives
  exclusive opening natively and would mean Accordion adds a name and nothing
  else; check the support floor when it is planned.

## core/measure, LoadingBar — 2026-08-31

- Decisions: `@slotted/core/measure` is written now because three callers wanted
  the same arithmetic. ProgressBar wrote it inline, Splitter wrote a second
  copy, and LoadingBar would have been the third; the rule that a core module
  stays malleable until a second caller confirms it had been satisfied twice
  over. It is arithmetic only — no DOM, no framework, no state — so "a value
  outside the range is clamped, not rejected" means one thing library-wide.
  ProgressBar and Splitter were refactored onto it with every behaviour test
  unchanged.
- Decisions: LoadingBar's contract asserts what it shares with ProgressBar by
  reading that contract — role, minimum, parts, indeterminate state — rather
  than repeating it. `placement` is the only real difference and joins the
  vocabulary.
- Decisions: `value` defaults to null, so a LoadingBar is indeterminate unless
  told otherwise. A page-level bar usually does not know how much is left, and
  defaulting to zero would report a position nobody claimed.
- Decisions: the track is transparent where ProgressBar's is painted. A
  page-level bar on a permanent grey band reads as a rule under the header.
- Defects found: the Angular LoadingBar reference page carried a `tsx` snippet
  showing React code. Every check passed — the snippet formatter parsed it
  happily, because it was valid TSX. Added `pnpm test:docs`
  (`scripts/verify-docs-snippets.test.mjs`), which walks every reference page in
  both packages and fails a snippet whose language or id belongs to the other
  framework. It runs inside `pnpm check`.
- Deviations: none.
- Follow-on: FileUpload and Stepper both report progress and can now take the
  same measurement from core/measure rather than a fourth inline copy.

## Stepper — 2026-08-31

- Decisions: where a step sits is an axis with three values, not two booleans.
  `upcoming`, `current` and `complete` are mutually exclusive, and a pair of
  flags would admit a step that is both. Invariant 5 forbids a single-valued
  `data-state`, and this is not one: `data-status` is an appearance axis like
  `data-fill`, chosen from a closed set the contract names.
- Decisions: the current step is marked by a thicker ring as well as a tone, so
  it is not colour alone; the style test asserts the ring rather than the tone.
- Decisions: the marker is `aria-hidden`. It repeats what the label and
  `aria-current` already say.
- Decisions: the connector has no member and is drawn by the stylesheet, as the
  breadcrumb separator is.
- Defects found: none.
- Deviations: none.

## Pagination — 2026-08-31

- Decisions: a `ul`, where Breadcrumb and Stepper use `ol`. The pages are
  siblings a reader may visit in any order; numbering them twice tells a screen
  reader nothing. Recorded as `listReason` so the difference reads as a
  decision rather than an inconsistency.
- Decisions: a page control is a button by default and an anchor through
  `render` (React) or by putting the attribute on an anchor (Angular). A page
  with an address should be a link — bookmarking page four and opening page five
  in a new tab are things a button cannot do.
- Decisions: Angular binds the native `disabled` attribute only when the element
  is a button, because an anchor cannot carry one and writing it there would be
  a lie nothing acts on. A test asserts the absence.
- Decisions: the previous and next controls at the ends are disabled rather than
  removed, so the row does not change length as the reader moves through it.
- Defects found: none.
- Follow-on: Toolbar, VirtualList and FileUpload are what remain in T2. Toolbar
  needs `core/focus`, which already exists from Tabs and will get its second
  caller there — the point at which its signature stops being provisional.

## Toolbar — 2026-08-31

- Decisions: no item member. A toolbar groups controls the consumer already
  has, and asking each to be wrapped would put a component between the consumer
  and the control they meant to use. The toolbar finds its focusable children;
  the contract records `items: "focusable-children"`.
- Decisions: this is the second caller of `core/focus`. Its `itemSelector` was
  designed against Tabs, where the items are elements the family renders
  itself; here they are elements it has never seen, and the signature took that
  unchanged. That is the confirmation the core rule asks for, and
  `createRovingTabindex` can now be treated as settled.
- Decisions: a MutationObserver refreshes the tab stop as the consumer's
  controls come and go. Without it a control added after mount keeps its own tab
  stop and the single-Tab promise quietly becomes two. Both suites assert it.
- Decisions: the item selector matches disabled controls. The core skips them
  when moving, and excluding them would renumber the others whenever one was
  disabled.
- Defects found: none.
- Deviations: none.
- Follow-on: VirtualList and FileUpload are what remain in T2. VirtualList needs
  `core/collection`, which does not exist yet and will be written against it.

## Where the queue stands — 2026-08-31

**T1 is complete.** Button (already shipped), Link, VisuallyHidden, Divider,
Spinner, ProgressBar, Badge, Avatar, Skeleton, Kbd, DescriptionList, Splitter.

**T2 is nine of eleven.** Field and Tabs were already shipped; Card, Tag, Alert,
Collapsible, Breadcrumb, Pagination, Stepper, LoadingBar and Toolbar landed
tonight. **VirtualList and FileUpload remain.**

Take VirtualList next, and expect it to need more than a component:

- It is the first caller of `core/collection`, which does not exist. Write the
  module against VirtualList's real requirements — item height, overscan, the
  index range for a scroll offset — and leave the signature provisional until
  Listbox and Calendar confirm it in T3. `core/measure` is the worked example of
  how that goes: three callers, then extract.
- It needs a design document. The catalog says so, and the questions are real:
  fixed against measured item heights, what the scroll container is, and whether
  the windowed rows are exposed to assistive technology at all or whether the
  list reports its full length through `aria-setsize` and `aria-posinset`.
- The two Storybooks must show the same scenarios, as everywhere else. A
  windowed list is the first component whose demonstration needs hundreds of
  rows; generate them in the story rather than writing them out.

FileUpload after it. It composes ProgressBar and Button, both shipped, and its
own question is where the drop target's accessible name comes from when the
visible affordance is a whole region rather than a control.

**Conventions worth knowing before writing a line:**

- Contract first, and assert shared vocabulary by reading the other contract
  rather than retyping it. Badge, Tag and Alert all name the same five tones and
  none of them repeats the list.
- Both frameworks in one commit whenever a public contract changes.
- `pnpm check` per component, `pnpm check:full` per batch, then push.
- Every reference page is written by copying the other framework's and editing
  it. `pnpm test:docs` now fails a snippet left in the wrong language, which is
  the one edit that copy reliably forgets.
- A React family with no `render` prop must not export a root props type. It
  cannot be produced, and the unused import trips the lint gate — Collapsible
  and Toolbar both did it.
- Angular snippets must fit on one line under roughly seventy characters, or
  Prettier's angular printer breaks them onto a hanging `>` and the format test
  fails.
- `model()` takes no `transform`, unlike `input()`.
