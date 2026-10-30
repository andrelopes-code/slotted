# Build briefing

Read before every `/component` invocation. It holds what does not change between
families. It directs judgement; it does not replace it. Where it decides
something, it says why, and a better reason beats it.

`docs/process/build-order.md` says what each family delivers, and which invocations
reopen a family already delivered. If the invoked family has no scope written
there yet, derive it from its section in `docs/component-features.md`, write it
in as part of the work, and carry on. The scopes of the families delivered in
pass 1 are.

## Read first

- `docs/token-foundation.md` — layers, scales, schemes, densities, target size
- `docs/state-and-events.md` — controlled and uncontrolled, `reason`, `data-ui`,
  state precedence
- `docs/component-features.md` — the feature guide: the section covering this
  family, plus section 2 (global contract) and section 18 (definition of done)
- `.claude/skills/component/references/rubric.md`
- `.claude/skills/component/references/stories.md` — what the two reference
  pages have to prove

## Environment

Work in this worktree, on the branch already checked out. **Do not create a
branch or a worktree, and do not check anything out.** Storybook runs here and a
human watches it live.

Shell state does not survive between tool calls, and the `node` on `PATH` is
older than `.node-version` requires, so prefix every `node` and `pnpm` command:

```bash
export PATH="$(ls -d ~/.nvm/versions/node/v$(cat .node-version)*/bin | tail -1):$PATH"
```

## Storybook

React on <http://localhost:6006>, Angular on <http://localhost:6007>, started by
the reviewer. A reference page renders on its own at
`iframe.html?viewMode=docs&id=components-<family>--reference`, which is what a
screenshot can be taken of. If a port answers nothing, say so at the gate rather
than assuming the pages were seen.

The toolbar exposes `scheme` (`light`, `dark`, `high-contrast`), `density`
(`comfortable`, `compact`, `dense`) and `direction` (`ltr`, `rtl`). The reviewer
uses all of them.

- **Both Storybooks need a restart when a family lands** — React because the new
  subpath export in `packages/styles/package.json` is invisible to a running Vite
  server, Angular because it reads the entry-point directories once, at startup.
  Say so at the gate rather than restarting unannounced.
- `pnpm build` covers every generated artefact in dependency order and is cached;
  run it rather than deciding which build applies. A token or theme change needs
  it before Storybook and the harness see the new value.
- Nothing else needs building. Both Storybooks read `packages/styles`,
  `packages/react/src`, `packages/angular/*/src` and `packages/core/src` from
  source, so a stylesheet edit is on the page on save. If it is not, a `dist`
  bundle has been imported into a preview again, which `CONTRIBUTING.md` forbids.

## Two gates

The skill stops twice. The **visual gate**, once the stylesheet and the harness
captures are right and before either framework is bound: the anatomy and the
picture are confirmed there, while a correction still costs the stylesheet
rather than the family. The **release gate**, at the end, for everything built
on top of it.

Nothing else is a gate. Between them, record the decision and carry on.

## Leave no uncertainty open

A family is not finished while a question about it is still open. Decide it,
choosing what is right for a durable package rather than what is quickest, and
record the decision and its cost where it belongs — see the routing below. If
two answers are defensible, take the one that fails more loudly.

The gate carries decisions already made. Two things may be raised there instead:
a decision that changes a public contract **outside** this family, and something
this machine cannot verify — a real screen, a screen reader, a touch device —
stated alongside what was checked in its place.

A defect in shared tooling is fixed as part of the work, in its own commit,
before the family that found it. Reported and left in place, the next family
inherits it.

A decision that binds another family belongs in
_Decisions already taken_ below; a pending item belongs in
`docs/process/build-order.md` — in the family's scope when it is not built yet, in
_Reopenings promised in writing_ when it is; a convention belongs in the
comment of the test that enforces it. What is left for the log is a defect with a lesson, or a debt
nobody else owns — and nothing at all is a valid entry.

## Constraints

The foundation is enforced by tests, and each one says what it wants when it
fails. In short: tokens are consumed, not restated; a family is selected by
`data-ui` and its parts by `data-part`, never by a class; the contract and its
test come before the implementation; durations come from the motion scale; a
weaker state holds itself back for the stronger ones; and the family answers
every density, `dir="rtl"` and `high-contrast` through logical properties.

Both frameworks share the conceptual contract and nothing else: React stays
idiomatic React, Angular idiomatic Angular, and native props, events and
consumer values survive in both.

A new step in a token scale, a new capability or a new state changes ground that
other families stand on. Justify it at the gate before writing it.

## Decisions already taken

- **A family's own icon is the `Glyph` element, in every family.** The close
  button's cross, a pager's chevrons, a field's clear and reveal buttons, a
  checkbox's tick: each is `<Icon><Glyph name="…" /></Icon>` (React) or
  `<span slIcon><svg slGlyph name="…"></svg></span>` (Angular), a real `<svg>`
  drawn from `@slotted/core/glyph`. No stylesheet paints an icon — no mask of a
  glyph token, no pseudo-element, no family hook falling back to one. A harness
  fragment writes `<svg data-part="glyph" data-glyph="…"></svg>` and the build
  draws it. `packages/styles/src/glyph-element.test.mjs` enforces it; its
  `PENDING` list only shrinks. Decided 2026-09-25.

- **Measure belongs to `container`, and to it alone.** No text family or layout
  primitive caps its own line length; two families offering a maximum measure
  would be two answers to one question.
- **Truncation never removes content from the DOM.** A truncated string stays
  readable to assistive technology and reachable in full when it matters.
- **A scheme is chosen by the application; the operating system's own
  high-contrast mode is served by the theme's `forced-colors` block.** A family
  writes no `forced-colors` rule unless it paints something the theme cannot
  reach.
- **No triangle glyph.** A triangle is asymmetric and reads as foreign beside
  the circles and squares every other glyph is drawn in. A status mark is one
  of the hand-drawn `status-*` glyphs of `@slotted/core/glyph`, drawn on the
  grid it is shown at; the warning mark is `status-warning`, the diamond of a
  warning sign, symmetric on both axes.
- **Overlay behaviour is composed from `packages/core`, never rewritten in a
  family.** `presence`, `portal`, `positioner`, `dismissable-layer`, `focus` and
  `live-announcer` each own one question and none imports another. An overlay
  family takes the ones it needs and no more.
- **What this library holds is the wall-clock value the reader typed, never a
  zoned instant.** `PlainDate`, `PlainTime` and `PlainDateTime` are the three
  types the date chain has, and there is no fourth. An instant is what every
  surveyed implementation gets wrong at a daylight boundary, and holding one
  would owe an answer for the hour that happens twice and the hour that never
  happens. Converting to an instant is the application's, against the zone the
  application knows. Decided in wave 7; it binds `time-field`,
  `datetime-field` and both pickers in wave 8.
- **`@floating-ui/dom` is the positioning engine, and it is invisible.** It is
  the only runtime dependency of `@slotted/core`, imported by `src/positioner`
  alone and marked external in the build. No type or option name of it appears
  in any public surface, which is what keeps CSS Anchor Positioning available as
  a replacement. `docs/product/prd.md` §48 open question 8 is answered yes for the DOM
  layer; its React and Angular packages are not adopted.
- **`echarts` is the chart engine, an optional peer, and it is invisible.**
  `@slotted/core/chart-echarts` is the only importer; it loads the engine in
  eleven chunks by `import()`, so an application without a chart installs and
  ships nothing, and a page of line charts never downloads the pie. It is
  external in the build, like `@floating-ui/dom`, and no ECharts type or option
  name appears in the public surface except `extendOption`, the declared escape
  hatch. The chart's model, keyboard, legend, tooltip and table are the
  library's own (`@slotted/core/chart`), so another engine is a new adapter,
  not a new contract. Decided with `chart` in wave 12.
- **A family that changes its own tracks with a container query needs two
  elements.** `container-type: inline-size` makes an element a query container
  for its descendants and not for itself, so a family whose query changes its
  own grid puts the container on the root and the grid one element in — which is
  the split `stepper` already had between its root and its `ol`, and the reason
  `description-list` renders a `div` around its `dl`. A family whose query only
  restyles parts needs no second element.
- **A value a stylesheet needs and only script can measure is a custom property
  under the name that says so.** `--slotted-positioner-*` for the anchor size,
  the space that is left, the transform origin and the arrow, and
  `--slotted-layer-depth` for the single overlay stack. They are runtime values,
  not design tokens, and they are not in `packages/theme/src/contract.json`.
- **A mark beside a line of text is aligned to the text, not to the line box.**
  A box one line tall with its artwork centred in it lands on the centre of the
  line box, which is not where the words are. Measured on the default theme at
  `comfortable`: the line is 19.5 pixels and its centre 9.75 from the top, the
  baseline is 14 down, a capital is 9 tall and an x is 7 — so the centred mark
  sits a quarter of a pixel below the capitals and three quarters above the band
  the lowercase letters occupy, and it reads high. The two centres agree only
  because this font's ascent and descent happen to make them agree; a theme with
  a deeper descent moves the text and leaves the mark behind.

  The browser is asked for the baseline instead of the number being assumed. The
  slot stays one line box tall and the artwork becomes an inline-block on that
  line, so the browser places it against the same baseline the title's first
  line uses; `vertical-align: calc((<band> - <mark size>) / 2)` then centres the
  mark on whichever band of the text the family names.

  `toast` names the midpoint of the two, `calc((1cap + 1ex) / 2)`, and the three
  candidates were rendered at four times the type size and read against the word
  `Hxp` before one was chosen — every quantity in the rule is font-relative, so
  the ratio judged there is the ratio at thirteen pixels, four times easier to
  see. `1cap` is where a mark drawn at cap height belongs and it reads high,
  because every glyph in the icon scale is taller than a capital — twelve pixels
  of ink against nine — and the overshoot above a cap line has nothing to sit
  against. `1ex` puts the mark's ink where the text's ink is and reads low,
  because the mark then hangs below the descender line. Both readings came from
  the reviewer, one after the other, which is what fixed the answer between
  them.

  `alert`, `inline-message`, `status-indicator`, `list-item` and `badge` still
  centre their marks in the line box: they predate the measurement, and none of
  them is this session's to edit. Each takes the rule when it is next opened.

- **A dismissable layer takes `Escape` in the capture phase, and refusing it is
  how a family stages the key.** `packages/core/src/dismissable-layer` registers
  its document listeners with `capture: true`, so a handler on the layer's own
  content runs after the layer has already asked to close, and
  `stopPropagation` from inside is too late. `onDismiss` is an ask: a family
  that wants `Escape` to do something else first — `select`'s search clears its
  query before it closes the popup — decides it there and simply does not call
  `setOpen`. Handling the key on the element that holds focus emptied the query
  _and_ closed the surface, on one press.

- **A family that renders another family's part composes its ref, not only its
  props.** `menu`'s trigger hands `render` a `ref` alongside the wiring, and it
  is the anchor the positioner measures against. `toolbar`'s overflow control
  spread the props and then wrote its own `ref` after them, which replaced the
  anchor: the surface opened at the corner of the page with the trigger sitting
  correctly in the bar. Nothing failed — no test, no type, no lint — because a
  ref that is never called is not an error. The rendered page is what showed it.

  So: destructure the `ref` out of what `render` gives you, and attach it beside
  your own. A part that takes a `ref` from another family is taking a
  measurement, and dropping it is dropping the measurement.

- **Two Angular directives on one element write host attributes into the same
  slot, and a binding of `null` removes what the author wrote.** `menu` records
  the rule for its own trigger; the family that puts that trigger on its own
  part inherits it from the other side. `toolbar`'s overflow control declared
  `data-part="overflow"` as a static attribute and `slMenuTriggerFor` erased it,
  which took the stylesheet's geometry with it and made the family stop
  recognising its own part in the DOM.

  React does not have the problem, because the family's own props are spread
  after the other family's. In Angular, write the part back after the first
  change detection — the erasing expression is a constant, so nothing writes
  over it again — and say in a comment which directive erased it.

- **The filter vocabulary is `@slotted/core/filter`, and no family writes its
  own.** The operators per kind, the descriptor `{ kind, join, conditions }`, the
  predicate, the query-string codec and the readable summary live there;
  `table` edits one column's condition in its header, `filter-bar` edits the same
  descriptor in a bar above the table, and `data-grid` carries it in a query. A
  family-local vocabulary would be three families disagreeing about one object,
  which is the argument that put `sort` in the shared contract schema. The module
  is outside `packages/core/src/index.ts` for two reasons: `collection` already
  exports a `Filter` type and a `createFilter`, and a family that imports a
  button should not pull a filter engine.

  Two rules of it bind every consumer. A condition missing an operand its
  operator needs is **inactive**, an inactive condition is dropped before the
  join under `and` and `or` alike, and a filter with no active condition matches
  everything — an unfinished condition is not an always-true condition.
  `parseFilter` is **total**: an unknown kind, an unknown operator or a
  malformed operand gives `null`, so a bookmark written by an older version of
  an application degrades to no filter rather than to an error on first paint.

- **Where the page chrome ends is a property the page publishes, and every
  sticky thing under it reads.** `page` writes `--slotted-page-sticky-top` on
  the element that scrolls — the title area's height, plus the tabs, plus the
  header area while it is pinned or revealed — `--slotted-page-sticky-bottom`
  for its footer, and `--slotted-page-scrollport-block-size` for the
  scroller's own visible height, which an inset application frame makes
  shorter than the viewport; and it bridges the first into `--slotted-table-sticky-offset` on
  its own root. `section` sticks its header at that height; `table` already
  reads the bridge. A family that adds a sticky part to a page reads the same
  property and never measures the header itself, and a family that adds
  chrome of its own to the page adds it to that number rather than publishing
  a second one — `section` does exactly that: a sticky section measures its
  header and its body republishes the property as page plus header, so a table
  or a nested section inside stops under the section's header, and layers add
  up under one name. Decided in wave 7 for `page`, `page-header` and
  `section`; it binds `anchor-nav`, `app-shell` and `filter-bar` in wave 8.
- **The edge of a control at rest is a line, not a separator.**
  `--slotted-control-border-color` reads 1.7:1 in `light` and 1.8:1 in `dark`,
  held to a 1.5:1 floor by `theme-conformance`; `--slotted-border-strong` and
  the focus ring keep 3:1. At 3:1 the edge was the darkest line on every form
  and both schemes read as high-contrast. A control is identified by its fill,
  `--slotted-control-shadow` — now `0 1px 2px` at an ink that is visible — its
  label and its size; the states that carry meaning keep their ratio. A family
  that needs a 3:1 line on a control at rest states which state it marks and
  reads that state's token, not the resting edge.
- **A scroll-driven change carries the reason `scroll`.** The header area
  collapsing because the reader scrolled past it is a change the consumer did
  not make and may refuse; `specs/contract.schema.mjs` names the reason, so a
  handler can tell a scroll from a click without inspecting an event.
- **A `plain` control is a control whose box belongs to something else, and it
  paints nothing past that box.** A cell, a row, another control's frame. The
  variant already gave up its edge, its ground and its lift at rest; it kept a
  corner radius, an outward focus ring and the recoloured lift under focus, and
  a `plain` text field focused in a table cell was a rounded pill floating two
  pixels past the row's rule. So, in `packages/styles/src/plain-variant.test.mjs`:
  `border-radius` is `--slotted-radius-none`, because a cell has no corner; the
  focus ring is drawn inward, `outline-offset: calc(var(--slotted-focus-ring-offset) * -1)`,
  the way every inner control already draws it; and focus adds no shadow. The
  hover wash and the invalid edge stay, square. What the variant does not decide
  is the inset: a host that gives a cell to a `plain` control gives up the cell's
  own padding and hands it to the control through `--slotted-control-padding-inline-*`,
  as `date-range-picker` does for its two `date-field`s and `table` does for its
  sort control; that rule is written in the host's stylesheet. The corner is
  the host's as well: a rounded box whose children reach its edge clips them —
  `table`'s framed variant already does, with `overflow: clip`, because a row's
  ground is square — and a `plain` control does not inherit a radius, since
  `inherit` rounds all four corners of a control that touches one or none. Decided in wave 8
  across the eleven root-framed field families and `date-range-picker`'s control;
  `table`'s cell rule is pending in its scope.
- **What stands inside a control is the height the foundation gives the inside
  of a control, `--slotted-control-inner-size-{sm,md,lg}`, and the container
  says so.** A key in a search field, a chip in a multi-select, a chip in a
  tags input: each took its height from its own type, which drops one pixel
  between comfortable and dense while the control around it drops eight, and at
  dense a 24-pixel key sat in a 26-pixel field. The scale is the control's
  height less two steps of air per density (`docs/token-foundation.md`, Control
  geometry). A container that holds such a thing writes
  `--slotted-control-inner-size` from its own size step — `text-field` on its
  adornments beside `--slotted-icon-size`, `multi-select` and `tags-input` on
  their row of chips — and `kbd` and `tag` read it as their block size,
  deriving line and inset from it; on their own they keep the height their type
  gives them. `--slotted-tag-inset-block` stays as the standalone inset. Decided
  in wave 8 at `filter-bar`'s release gate. The R2 inner controls (clear,
  reveal, steppers, close, dismiss, the rest of
  `packages/styles/src/inner-control.test.mjs`) read the same scale as a cap:
  their box is `min(glyph + a step of air a side, --slotted-control-inner-size-*)`
  at the family's own size step, never a control height; the 24-pixel target
  is recovered by the box or by a transparent halo, as before. Decided in
  round 13 of pass 2.

- **A drag is a session over the consumer's model, and `Escape` during one
  belongs to the drag.** `@slotted/core/drag` holds `pickUp`, `move`, `drop`,
  `cancel` over positions — `between` a splice index, `on` an item, `root` an
  empty container — read from the consumer's `items()`; the pointer resolves
  a point to the same position, and the drop event carries keys and indexes
  and never a pixel. The module writes nothing on a registered element: a
  family renders `data-dragging`, `data-drop-target` and `data-drop-invalid`
  from `state`. While a session is open the module takes `Escape` on `window`
  in the capture phase and stops it, so `dismissable-layer` does not see the
  key and a drag inside a dialog cancels without closing the dialog. A drop on
  the position the item came from, on nothing, or on a refused position is a
  cancel and emits no drop. Decided in wave 9; it binds `data-grid`,
  `listbox`, `tree`, `tags-input` and `dashboard-grid`.

- **A grid that animates an `fr` track beside an `auto` track packs its
  tracks at the start.** `side-navigation` opens a group on the technique
  `collapsible` uses — a track transitioning between `0fr` and `1fr` — but
  puts the row in an `auto` track of the same grid. While the fr track is
  between the two values the grid holds free space, and the default
  `align-content: normal` stretches the `auto` track with it: measured, the
  row grew from 34 to 60 pixels at the middle of every open and close and came
  back, a bounce on the row the reader had just pressed. `align-content:
start` on the grid is the fix, and `collapsible` never met it because its
  animated track is alone in its grid.
- **A demonstration whose picture depends on its width is laid out in a room
  of a stated width, never in the docs column.** The docs column measures 676
  pixels at 1280 and 1030 at 1920, and a grid of two columns halves it: every
  scene of `top-navigation` — a bar whose widest step is 1024 — was squeezed
  into a picture the family never paints. `.slotted-demo-room[data-room]` in
  `tools/storybook-workbench` gives a scene `desktop` (1024), `laptop`
  (900), `tablet` (640) or `phone` (375) pixels, one room per column, and
  scrolls sideways when the column is narrower than the room. The room's
  child measures the room's width as content box, so a container query inside
  reads the stated number. The test in `workbench.styles.test.mjs` holds the
  four widths.

## Working beside another session

Another session may be building a different family in this same worktree at the
same time. What breaks here is
not recoverable from the index, so:

1. **Write only your own family's files**, plus the shared registries below.
   Another family's file is never yours to fix, however plainly broken.
2. **Treat the registries as append-only**, re-reading each immediately before
   writing: `packages/react/package.json`, `packages/react/src/index.ts`,
   `packages/styles/package.json` and `docs/process/build-order.md`. Insert your entry; reorder and reformat
   nothing. The React build entries (`packages/react/vite.config.ts`) and the
   Angular path mapping (`tsconfig.base.json`) are derived from the family
   folders and take no entry.
3. **Keep git narrow.** Stage explicit paths. No `git add -A`, `commit -a`,
   `checkout`, `restore`, `stash` or `clean`. Format with
   `pnpm exec prettier --write <your paths>`, never `pnpm format`. Stage and
   commit in one command: the index is shared, and a commit by the other
   lane takes whatever you left staged — `detail-panel`'s stylesheet and
   registry hunks landed inside `table-of-contents`'s commits that way, and a
   registry entry was committed twice.
4. **A failure outside your family is not yours.** `pnpm check:full` sees the
   other lane mid-write. Report it at the gate and carry on.
5. **Ask before restarting a Storybook.** It interrupts the other lane too.

The harness output is yours alone: it is named after the family.

## Visual loop

```bash
node tools/harness/build.mjs <family>
node tools/harness/shoot.mjs <family> --scheme light --width 420
node tools/harness/shoot.mjs <family> --scheme dark --width 420
node tools/harness/shoot.mjs <family> --scheme high-contrast --width 420
node tools/harness/shoot.mjs <family> --scheme light --width 240
node tools/harness/shoot.mjs <family> --scheme light --density dense
node tools/harness/shoot.mjs <family> --scheme light --dir rtl
```

The capture is the whole page; `--scene <name>` narrows it to one scene. Read
every image. The exit condition is the right picture, not finished code.

A module of `packages/core` with a `<module>.harness.html` beside it is built
by `node tools/harness/core.mjs <module>` instead: the fragment carries its own
`<style>` and a `<script type="module">` that imports `@slotted/core/<module>`,
and the page ships the module bundled, so the reviewer drives it live. The
shooter reads the same `out/<module>.html`.

## Verification

```bash
node --test specs/components/<family>/*.test.mjs
pnpm check
pnpm check:full
```

## The gate

Stop before committing and hand over the harness path and the captures read, the
reference-page URLs with the widths and schemes they were read at and the output
of `tools/harness/audit.mjs` on both, the weighing
from step 3, the self-assessment against the rubric and section 18, and the
decisions taken on what would otherwise have been left open. Then wait.
