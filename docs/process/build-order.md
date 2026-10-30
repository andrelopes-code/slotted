# Build order

Sequence of `/component` invocations, from the most primitive layer outward.
Derived from `docs/component-features.md` (feature guide) and from the current state of
`specs/components/`.

Pass 1 covered waves 0 to 8 and 79 families. This file lists what was delivered and
starts pass 2 at wave 9.

## How to read

- **Wave** is a barrier. No item of a wave starts before all items of the
  previous wave are approved at the human gate.
- Within a wave, items linked by `→` have a dependency and follow the written
  order. Items on separate lines are independent of each other.
- Each line is one invocation. A pair on the same line is a single invocation,
  justified by a shared architecture decision.
- **Mode:** `new` creates the family. `reopen` returns to a delivered family
  to add a capability promised in writing. `infra` delivers a module
  of `packages/core` without UI.
- **Guide** is the section of `docs/component-features.md` the scope derives from.
- **Scope per family.** The invocation reads the scope written here. If the family
  has no written scope, the session derives it from the guide section and writes it here as
  part of the work.

## Pass 1 — delivered

| Wave | Families                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | token contract, theme, schemes, densities, state model, ratchet, harness, skill                                                                                                                                                                     |
| 1    | `typography`, `icon`, `visually-hidden`, `divider`, `stack inline grid`, `container`, `card`                                                                                                                                                        |
| 2    | `button icon-button`, `button-group`, `link`, `badge`, `tag`, `avatar avatar-group`, `kbd`, `skeleton`, `progress-indicator`, `status-indicator`, `alert`, `inline-message`                                                                         |
| 3    | `field field-group`, `text-field`, `textarea`, `checkbox checkbox-group radio-group`, `switch`, `number-field`, `slider`, `form`, `currency-field`                                                                                                  |
| 4    | `tabs`, `breadcrumb`, `pagination`, `collapsible accordion`, `stepper`, `description-list`, `list list-item`, `prose`, `result-state`, `toolbar`                                                                                                    |
| 5    | `presence`, `dismissable-layer`, `portal`, `positioner`, `live-announcer` (infra); `tooltip`, `popover`, `dialog alert-dialog`, `drawer`, `menu menubar`, `toast`, `loading-overlay`                                                                |
| 6    | `collection` (infra); `listbox`, `select`, `combobox`, `multi-select`, `tree`, `table`                                                                                                                                                              |
| 7    | `date-field calendar date-picker`, `time-field time-picker datetime-field datetime-picker`, `upload`, `page page-header section`, `app-shell`, `action-bar`                                                                                         |
| 8    | `splitter`, `scroll-area`, `toggle-group segmented-control`, `timeline`, `date-range-picker`, `tags-input`, `filter-bar code-block`; reopening of `table` (operands `time`, `datetime`, `date-range-picker`, `tags-input` in the per-column filter) |

Guide families delivered inside another: `alert-dialog` in `dialog`;
`icon-button` in `button`; `filter-builder` in `filter-bar` (`builder` part).
`highlight` was a shared leaf in `packages/styles/src/highlight` until wave
10, when it became a family.

`packages/core` modules delivered: `clipboard`, `code`, `collection`,
`commands` (wave 9), `count`, `currency`, `date`, `disclosure`, `dismissable-layer`, `drag` (wave
9), `extent`, `files`, `filter`, `focus`, `form`, `identity`, `keys`,
`live-announcer`,
`loading`, `measure`, `number`, `overflow`, `pagination`, `pointer-intent`,
`portal`, `positioner`, `presence`, `progress`, `slider`, `state`, `steps`,
`sticky-header`, `tags`, `text` (onda 9), `timeline`, `toast`, `typeahead`,
`upload`.

## Reopenings promised in writing

Each row is a return to a delivered family, recorded in the pass 1 scope
or in a self-assessment. They are not defects: they are capabilities deferred until the
family they depend on exists. The "after" column names the barrier.

| Family                          | What goes in                                                                                                                                                                                                                                                                            | After                                     | Record                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `table`                         | `time-range-picker` and `datetime-range-picker` as the single operand of `between` in the `time` and `datetime` kinds                                                                                                                                                                   | `time-range-picker datetime-range-picker` | —                                                                              |
| `date-range-picker`             | the one-row frame of `time-range-picker` (`summary`, fields in the panel band): two fields in the frame break it into two rows in a form column and contradict the shared height of the controls                                                                                        | —                                         | —                                                                              |
| `upload`                        | compose `media-viewer` in place of the own viewer: the `viewer*` parts leave the `upload` contract, and the viewer gains zoom, rotation, pan, thumbnails, and swipe steps                                                                                                               | `media-viewer`                            | —                                                                              |
| `table`                         | a cell with a `plain` control yields the inset to the control (`padding-inline: 0` on the cell, `--slotted-control-padding-inline-*` on the control)                                                                                                                                    | —                                         | `docs/build-briefing.md`                                                       |
| `multi-select`                  | read `splitValues`, `admitValues`, and `constraintVerdict` from `@slotted/core/tags` in place of the two local copies; `commitOnBlur` with three values                                                                                                                                 | —                                         | —                                                                              |
| `prose`, `table`, `tabs`        | replace the own scroll measure with `scroll-area`                                                                                                                                                                                                                                       | —                                         | —                                                                              |
| `scroll-area`                   | veil by `animation-timeline: scroll()`                                                                                                                                                                                                                                                  | —                                         | `2026-09-13-scroll-area-design.md` §5                                          |
| `listbox`, `tree`, `tags-input` | reorder by drag                                                                                                                                                                                                                                                                         | `drag-and-drop`                           | inventories of `listbox` (line 125), `tree` (line 101), `tags-input` (line 90) |
| `tags-input`, `multi-select`    | `Alt`+arrow becomes `moveBy` from `@slotted/core/drag`, emitting the same event as the drag                                                                                                                                                                                             | —                                         | `2026-09-15-drag-design.md` §1                                                 |
| `app-shell`                     | `[data-ui='app-shell'] [data-part='brand']` becomes `> [data-part='banner'] > [data-part='brand']`: the descendant selector reaches the `brand` of `top-navigation` inside the `banner`                                                                                                 | —                                         | `2026-09-15-top-navigation-design.md` §9; `top-navigation.styles.test.mjs`     |
| `dialog`                        | `sl-dialog` accepts `ariaLabel` as an input; today the host `aria-label` is static and `command-palette` names the dialog with an `<h2 slDialogTitle hidden>`                                                                                                                           | —                                         | `2026-09-15-command-palette-self-assessment.md` §8                             |
| `combobox`                      | adopt `createRanker` from `@slotted/core/collection` as the default ordering, in place of `filter` plus the consumer's order                                                                                                                                                            | —                                         | `2026-09-15-command-palette-design.md` §2                                      |
| `time-range-picker`             | `wrap`: a shift that crosses midnight is not an `order` error; the duration counts across midnight and the end list does not strike out the hours before the start. `table` passes it in the `between` of the `time` kind, whose engine already reads `22:00 – 02:00` as a night window | —                                         | `2026-09-16-table-range-operands-design.md` §1                                 |
| `number-field`                  | `text-align: inherit` on the `input` (outside the `:dir(rtl)` guard), so a `plain` field in a numeric cell aligns the digits to the end as `text-field` already does                                                                                                                    | —                                         | `2026-09-16-table-range-operands-design.md` §2                                 |
| `currency-field`                | featured amount (36 px, weight 600, no frame, end-aligned) as a size shape of the contract, seen in step 2 of ReUI's `wizard-7`                                                                                                                                                         | —                                         | `2026-10-01-currency-field-reui-dossier.md` § 6                                |
| `popover`, `tooltip`            | arrow with `--slotted-border-width-medium` (1.5 px): the 1 px edge of the square rotated 45° is antialiased into two half-pixels and reads thinner than the panel border; `hover-card` exposes it next to a link and does not alter it                                                  | —                                         | visual gate of `context-menu hover-card`, 2026-09-16                           |
| `positioner`                    | `inline`: a link that wraps onto two lines measures as the box around both, and a `hover-card` can point at the gap between them; the `inline()` middleware of Floating UI handles it and the module does not expose it                                                                 | —                                         | `2026-09-16-context-menu-hover-card-capability-inventory.md` §6                |
| `typography`                    | read the `4xl` step (`--slotted-font-size-4xl`, `--slotted-line-height-4xl`) that `stat-card` opened for `size="lg"`                                                                                                                                                                    | —                                         | `2026-09-16-stat-card-sparkline-design.md` §2                                  |
| `chart`                         | the sequential ramp and the diverging pair that the data scale lacks; texture as a second channel under `forced-colors`; per-point tooltip and highlight that `sparkline` declined                                                                                                      | `chart` (wave 12)                         | `2026-09-16-stat-card-sparkline-design.md` §1; inventory §2                    |
| `chart` (slice 2)               | heatmap, radar, funnel, treemap, gauge, sankey, and candlestick, each as an adapter chunk under the same series contract; range selection (brush) as a second mutable value, distinct from `zoom`, with its own keyboard                                                                | `chart` (wave 12)                         | `2026-09-23-chart-capability-inventory.md` §2, lines 34 and 35                 |
| `table`, `filter-bar`           | the compact form of the `data-grid` filter: 24 rem panel, one condition per row (7 rem operator and operand, at `sm`), the segmented join on the second row, Clear/Apply at `sm`; `set` as `select` `multiple`; the operator as a symbol in the row                                     | —                                         | `2026-09-16-data-grid-design.md` §5                                            |
| `table`                         | expose `columnState` (`GridColumnState`) so `column-manager` serves both families; today the `table` columns are consumer markup and the contract does not declare the model                                                                                                            | —                                         | `2026-09-23-column-management-design.md` §1 (Gaps)                             |
| `data-grid`                     | print view: an `@media print` sheet that turns off the virtual window, the frame, and the height, and prints the rows the query left                                                                                                                                                    | —                                         | `2026-09-16-data-grid-self-assessment.md` §1 (9)                               |
| `menu`                          | stop importing `highlight/highlight.css` (React and Angular): the family imports its own sheet and a `mark` in an item comes from `Highlight` / `[slHighlight]`; the file was being edited by `context-menu hover-card` in the same round                                               | —                                         | `2026-09-16-highlight-design.md` §5                                            |
| `tree`                          | the unidentified `<mark>` of the search becomes `Highlight` / `[slHighlight]` inside the label, and the `highlight/highlight.css` sheet is no longer imported                                                                                                                           | —                                         | `2026-09-16-highlight-design.md` §5                                            |
| `toggle-group`                  | the `item` becomes the `toggle` family deferring to the group context (the Base UI shape); the item painting, written in `toggle-group.css` and in `toggle.css` under two prefixes, leaves one of the two; the group remains the sole owner of the value                                | —                                         | `2026-09-16-split-button-toggle-design.md` §2                                  |
| `prose`                         | the headings' `scroll-margin-block-start` adds `--slotted-page-sticky-top` to the `_flow` spacing, as `section` reads the property: a native jump (`#id` in the URL) lands under the `page` chrome; `table-of-contents` compensates when scrolling on its own                           | —                                         | `2026-09-16-table-of-contents-design.md` §5                                    |
| `page-header`, `section`        | `deferTo: "anchor-nav"` in the three pointers of the contracts becomes `table-of-contents`, the name the family was delivered with                                                                                                                                                      | —                                         | `2026-09-16-table-of-contents-capability-inventory.md` §5                      |
| `list-item`                     | hover and press of a row whose target is a stretched descendant (`title::after` of `data-list`) without another family writing `--_fill`: an attribute or a public part that the row reads                                                                                              | —                                         | `2026-09-24-data-list-self-assessment.md` §5                                   |
| `chart`                         | the own fullscreen (`requestFullscreen` on the host, fixed layer) becomes `@slotted/core/fullscreen`: context restore, `webkit`, following portal, and emitted error                                                                                                                    | —                                         | `2026-09-24-fullscreen-design.md` §7                                           |
| `upload`                        | animated exit of the removed row: the binding retains the row after `onFilesChange` until the end of an `opacity` and `translate` transition on `--slotted-easing-exit`, without a second state beside the controlled `files`; the entry is already in `@starting-style`                | —                                         | —                                                                              |
| `filter-bar`                    | per-row menu in the builder (duplicate, wrap in a group), when `data-grid` decides the inline builder; today `Add group` composes the wrapping and the negated operators cover negation                                                                                                 | `data-grid`                               | `2026-09-30-filter-bar-reui-dossier.md` §6                                     |
| `badge`                         | `size="sm"` reads `--slotted-control-inner-size` when a container writes it, like `tag` and `kbd`: in dense the badge measures 18.8 px and the `field` label row 17.39, and the header row grows 1.41 px                                                                                | —                                         | —                                                                              |

Reopenings without a barrier enter the review pass (`docs/process/implementation-review.md`).
Those with a barrier enter the wave in which the barrier falls.

## Wave 9 — what wave 8 left

Families listed in wave 8 of pass 1 and not built, plus the infrastructure
that three self-assessments requested.

| Invocation                                | Mode  | Guide |
| ----------------------------------------- | ----- | ----- |
| `drag-and-drop`                           | infra | 3     |
| `side-navigation`                         | novo  | 7     |
| `top-navigation`                          | novo  | 7     |
| `command-palette`                         | novo  | 5     |
| `time-range-picker datetime-range-picker` | novo  | 6     |
| `drag-and-drop` → `data-grid`             | new   | 12    |

`drag-and-drop` first. The other five rows are independent of each other;
`data-grid` depends on `drag-and-drop` for column reordering.

### Scope per family — wave 9

- `drag-and-drop` — module `@slotted/core/drag`, no UI. Pointer, touch, and
  keyboard; preview, handle, valid zones, auto-scroll, cancellation by
  Escape, and announcement through the `live-announcer`. The event carries items, source,
  destination, position, and allowed operation; the data model is the consumer's and
  not the DOM geometry. The keyboard alternative (pick up, move with arrows,
  drop) is built first and the pointer derives from it. Planned consumers:
  `data-grid` (columns), `listbox`, `tree`, `tags-input`,
  `dashboard-grid`.

  Delivered on 2026-09-15. Inventory in
  , decisions in
  , self-assessment in
  . The session is the
  design: `pickUp`, `move`, `drop`, `cancel` over positions (`between`, `on`,
  `root`) derived from the consumer's `items()`; the pointer resolves a point to
  the same position. `moveBy` is the session in one call, for the `Alt`+arrow that
  `tags-input` and `multi-select` already press. The module stays outside
  `packages/core/src/index.ts`, like `filter`. The core harness —
  `node tools/harness/core.mjs drag` — bundles the module into the page and the reviewer
  drives it by keyboard and pointer. What the consumers inherit: the binding
  renders `data-dragging`, `data-drop-target`, and `data-drop-invalid` from
  `state` (the module writes no attribute on a registered element); the key
  that **opens** the session belongs to the family; `Escape` is taken on `window` in the
  capture phase and does not reach `dismissable-layer`.

- `side-navigation` — nested items and groups, `expanded` and `selected`, optional
  icon, `badge`, compact mode. Selection derives from the route and expansion is
  independent of it. On a narrow screen it becomes a `drawer` and returns focus to the trigger.
  Icons without a label only in compact mode, with `tooltip`. Occupies the `nav` region of
  `app-shell` and reads `collapsedTo="rail"` from it. Builds on `list-item`,
  `collapsible`, and `@slotted/core/disclosure`; the region mark reuses
  `--slotted-icon-panel-open`/`-close`, flipped by side and by direction.

  Delivered on 2026-09-15. Inventory in
  ,
  decisions,
  self-assessment in
  . Seventeen
  parts; three models (`value`, `expanded`, `flyout`); the gutter read from the
  width of the root itself (`compactAt: 96`) and not from the shell context, with
  `landmark` resolved by the context (`nav` alone, `div` in the `nav` region);
  the flyout composed of `portal`, `positioner`, `presence`, and
  `dismissable-layer`; `truncate: end | middle | none` with the middle cut
  in `@slotted/core/text` and the tooltip carrying the whole text; `count` as
  its own part, the `badge` at `end`. The command item is a `button` in the part
  `link`. The `app-shell` demos build the navigation with the family.
  Refused in writing: edge status bar (R1), own drawer
  (`app-shell`), horizontal (`top-navigation`), reorder (reopening after
  `drag-and-drop`), search (`text-field` + the consumer's filter).

- `top-navigation` — regions for brand, navigation, search, context, help,
  notifications, and account, with collapse priority by container query. Occupies the
  `header` region of `app-shell`. Landmarks and skip link; the bar is not a
  `toolbar` with one tab stop per region. Composes `text-field`,
  `avatar`, `menu`, and `badge`; defines none of them.

  Delivered on 2026-09-15. Inventory in
  ,
  decisions,
  self-assessment in
  . Twenty-four
  parts; three models (`moreOpen`, `searchOpen`, `value`); the collapse
  in three literal steps (`collapseAt`: 1024, 768, 480) over a per-item `priority`,
  decided by the sheet before the script; the `more` panel is a Disclosure
  inside the root, with the same DOM moved (Angular) or ported (React); the
  search becomes a trigger below 768 and takes the open bar; `context` collapses
  into the panel below 768 and `help` below 480, `notifications` and
  `account` never;
  `frame` and `landmark` resolved by the shell context; the glyph
  `--slotted-icon-bell` enters the scale. Refused in writing: `sticky`
  (two consumer rows), search results (`combobox`,
  `command-palette`), own switcher (`menu`), `display: stack`
  (`page-header`), `menubar` (the APG warning), collapsible extra actions
  (reopening if a product asks).

- `navigation-menu` — sections of a site or application in a row or
  column, each a Disclosure `button` that shows a panel of links; direct links
  beside them. Panel in the trigger's `li` and a shared surface
  (`viewport`) measured by `@slotted/core/navigation-menu`, which transitions
  size and position between sections; optional `arrow`; hover with delay,
  switch without delay when a section is open, never by touch; optional APG arrows, `Home`, and
  `End` without roving tabindex; rich links (`icon`, `label`,
  `description`), `group`, `footer`, `data-columns` 1–3 with reflow by
  container query; vertical with `data-placement` `beside`/`below`;
  second level by the family itself (`data-nested`). Inventory in
  ,
  decisions.
  Refused in writing: `menu` role, backdrop, featured card (`card`),
  porting the panel to the viewport.
  Reopens `top-navigation`: the bar's `nav` is a root of this family and the
  bar section stops using `menu` (`2026-09-15-top-navigation-design.md`
  §11).

- `command-palette` — `dialog` with `combobox` + `listbox` inside. Items with
  `id`, `label`, `keywords`, `group`, `disabled`, and handler or destination; controllable
  `query`; `loading` and `empty`; shortcuts, history, async actions, and
  subcommands as a stacked page. Ordering is a replaceable adapter;
  the default is the `typeahead` of `packages/core`. Does not run a `disabled` item;
  announces the number of results through the `live-announcer`. Refusal recorded in
  `menu` (inventory, line 119): a menu filtered by text is this family.

  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  .
  Twenty-six parts; five models (`open`, `query`, `current` as a
  `item` + `page` set, `recent` under `queue`). Composes the `dialog` family
  (`surface="plain"`, `placement="top"`, `escape="none"`) and `kbd` (`outline`
  keycaps in `inherit`); `presentation="inline"` is the filtered menu that
  `menu` refused. The list order is `@slotted/core/commands`
  (`resolveCommands`, `createCommandRanker`), over the new `createRanker` of
  `collection/filter` — the `typeahead` that the scope named does not score; the
  open shortcut uses the new `matchesShortcut` and `isEditableTarget` of
  `keys`. Refused in writing: `close` part (scrim and `Escape`), per-item shortcuts
  wired by the family (`matchesShortcut` in the consumer), prefix
  modes (composition), virtualization (`collection`), `vimBindings`.

- `time-range-picker datetime-range-picker` — one session: two `time-picker`,
  or two `datetime-picker`, with the `max` of one bound to the `min` of the other, behind
  a trigger. They inherit from `date-range-picker` the band with the length stated
  while the range is drawn, `minLength`/`maxLength`, `contiguous`, the
  `preset` part, and the draft that never reaches a form. The engine is
  `@slotted/core/date` (`date-range.ts` extended to `PlainTime` and
  `PlainDateTime`). The `table` reopening that replaces the two pickers of the
  `between` is a separate session, in wave 10.
  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  . Twenty-six /
  twenty-eight parts; three models (`value`, `open`, `current` as a
  `position` + `highlighted` set). The frame is one row at control
  height — `summary` with the value as text, `clear`, two `hidden-input` —
  and the panel is one endpoint at a time: two tabs (Start / End), the field of the
  current endpoint (fine pointer only), `hint` with what is missing or what is
  wrong, and the list for that endpoint (**[DT]** beside the grid in range
  mode); choosing one endpoint leads to the other, the second closes, `done` is the
  exit of the sheet. The two lists side by side of the first round were
  refused at the launch gate. The duration on each row
  (`option-duration`; **[DT]** only on the same day). Engine in `@slotted/core/date/time-range.ts`
  (`timeRangeProblems`, `dateTimeRangeProblems`, `durationLabel`,
  `runRefusal`, `openingIndex`). Additive outside the family: `label` on
  Angular `time-field` and `datetime-field`; the three Angular fields do not reset
  the segments during a digit sequence.
- `data-grid` — the family that **applies** the descriptor of `@slotted/core/filter`:
  owns the data model and calls `createFilterPredicate`; `table` reports and the
  consumer filters. Inherits the four capabilities that `table` refused because of the
  ARIA role: column resize, row and column virtualization, multi-key
  sorting, and row activation. `role="grid"` with cell cursor, arrows,
  Home/End/Page. Columns with `id`, `label`, `type`, `align`, `width/min/max`,
  `sortable`, `filterable`, `editable`, `hidden`, `pinned`, renderer, editor, and
  accessor. Single serializable query for client and server: multi-column
  sorting, typed filters, search, pagination by page or cursor,
  grouping. Selection `single | multiple | range`, select-all of the filtered
  set, row activation separate from selection. Editing by cell or row,
  sync/async validation, commit/cancel, conflict, optimistic update; an error
  does not discard the typed value. Reorder, show/hide, pin, and fit
  columns through `@slotted/core/drag` and keyboard. Aggregate footer and detail
  row. Export, charts, and pivot stay out. The column manager
  as a panel is `column-manager`, wave 10; the grid exposes the model it
  edits.
  Delivered on 2026-09-17. Inventory in
  ,
  decisions,
  self-assessment in
  . Thirty-six
  parts; `role="grid"` on `div`, each row a `display: grid` over the
  template that the binding writes; seven models (`query` shared by `sort`
  and `filter`, `columnState` in the new `columns` capability, `value` and `range`
  for the selection, `current`, `expanded`, and `expandedGroups`) and editing as a
  session through the handle. Engine in `@slotted/core/grid` (`applyQuery`, cursor,
  columns, serializable query). The compact form of the filter — 24 rem panel
  with one condition per row and the filter row with the operator as a symbol —
  is the one that `table` and `filter-bar` inherit (reopening). The glyph
  `--slotted-icon-funnel` enters the theme. Angular: `sl-data-grid` with
  `model()` for the seven values and `ControlValueAccessor` on the selection.

## Wave 10 — missing Core compositions and Extended over what exists

Each family composes delivered families. None brings a new engine in
`packages/core`, except where the scope says so.

| Invocation            | Mode   | Guide |
| --------------------- | ------ | ----- |
| `table`               | reopen | 12    |
| `data-entry-form`     | novo   | 15    |
| `crud-list`           | novo   | 15    |
| `context-menu`        | novo   | 8     |
| `hover-card`          | novo   | 8     |
| `split-button`        | novo   | 5     |
| `toggle`              | novo   | 5     |
| `otp-input`           | novo   | 6     |
| `highlight`           | novo   | 10    |
| `aspect-ratio image`  | novo   | 4, 14 |
| `stat-card sparkline` | novo   | 13    |
| `table-of-contents`   | novo   | 7     |
| `selection-toolbar`   | novo   | 11    |
| `column-manager`      | novo   | 12    |
| `data-list`           | novo   | 12    |

Independentes entre si. `crud-list` depende de `selection-toolbar` e de
`data-grid` (wave 9) and closes the wave.

### Scope per family — wave 10

- `table` (reopen) — `time-range-picker` as the single operand of `between` in the
  `time` kind and `datetime-range-picker` in the `datetime` kind, in place of the
  two pickers that `TableTimeFilter` and `TableDateTimeFilter` draw. The
  descriptor, the predicate, the codec, and the summary do not change; what changes is the
  control inside `filter-operand`. In the same session, the pending cell
  rule: a cell with a `plain` control yields the inset to the control.

  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  .
  `between` of `time` and `datetime` is a range picker with `presets`, marked
  `data-range`; `Enter` on the trigger opens the picker and does not apply. The cell also
  yields the block inset: the `plain` control receives the row's minimum height
  through the `--slotted-control-height-*` tokens, and the row does not grow. The selector
  enumerates the fourteen `plain` families; `table.styles.test.mjs` reads the list from
  `plain-variant.test.mjs`. Two reopenings are recorded above: `wrap`
  in `time-range-picker` (the night window that the engine accepts and the picker marks
  `order`) and `text-align: inherit` on the `input` of `number-field`.

- `data-entry-form` — sections with headings, responsive `grid` layout, contextual
  help, validation by `form`, dirty state, optional autosave, actions by
  `action-bar`, and an error summary with focus on the first field. Conditional fields
  derive validity from the model and not from visibility; when hiding, the policy of
  keeping or clearing the value is declared. Duplicate submit is blocked; leaving with
  changes asks for confirmation through `alert-dialog` only when there is real loss. It is a
  composition: `form`, `field-group`, `section`, `grid`, `action-bar`,
  `inline-message`. New engine: none; `@slotted/core/form` gains the per-field
  dirty state if it does not have it yet.
- `crud-list` — `page-header` + `filter-bar` + `data-grid` or `table` +
  `pagination` + `selection-toolbar` + `result-state`, with create, edit, and
  detail in a `drawer` or route. Single serializable query state (the URL codec of
  `filter-bar` plus sorting and page); returning from detail preserves
  filters, page, selection, and scroll position. It is the reference page that
  shows the other families in real use.
- `context-menu` — the core of `menu`, opened by secondary click, context key,
  or Shift+F10 on a target. Point positioning through the `positioner`'s
  virtual anchor (inventory of `tooltip`, line 71). Returns focus to the
  target. The actions also exist through another path: the family documents the
  requirement and the reference page shows it.

  Delivered on 2026-09-16, in a session with `hover-card`. Inventory in
  ,
  decisions,
  self-assessment in
  .
  The root is the target (`div`, `render` for a row); the surface is `menu` without
  re-exporting anything, like `menubar`. `menu` gained `anchor` and `finalFocus`, which
  its inventory (line 117) and its contract (`focus.finalFocus`) promised.
  Opens by `contextmenu`, long press (500 ms, threshold 10 px), and `Shift+F10`/
  `ContextMenu` anchored to the target; focus returns to the element focused at opening.

- `hover-card` — preview of a link or entity that opens on hover and focus
  with a delay and a tolerance area; the trigger remains a `link` or focusable
  element; optional navigable content. Touch opens by click. `tooltip` refused
  `openOnHover` for this family (inventory, line 116). Composes `popover` with
  `positioner` and `presence`; does not replace `dialog`.

  Delivered on 2026-09-16, in the `context-menu` session (same three documents).
  The root is the trigger (`a`, `render` for `Link`); the surface is `popover` without
  re-exporting anything, with `autoFocus` off and `sideOffset` 4 px through
  the contract's `overrides`. `popover` now honors the consumer's explicit
  `role`: the panel is `presentation` until `navigable`, when it becomes `dialog`
  and the link receives `aria-haspopup`. Delays 600/300 ms, grace by
  `pointer-intent`, focus opens without delay on `:focus-visible`, touch opens on
  the first tap. Reopenings recorded above: the `popover`/`tooltip` arrow and
  `inline` in the `positioner`.

- `split-button` — main action and a menu of alternatives; `primary` and
  `menu-trigger` parts with distinct accessible names. Composes `button`, `button-group`
  (joined variant), and `menu`. The choice in the menu only updates the main action under
  a declared option (`remember`), because a silent update changes what
  the next click does.

  Delivered on 2026-09-16, in a session with `toggle`. Inventory in
  ,
  decisions,
  self-assessment in
  .
  The root is a `div[role=group]`; the two halves are `button` elements
  (Button and IconButton as the `menu` trigger) carrying the `primary` and
  `menu-trigger` parts — `button` is selected by `data-ui` only and the part slot
  belongs to the composing family. The joint rewrites that of `button-group` for two
  children; the chevron is `--slotted-icon-chevron-down` and does not rotate. `loading` on
  the root: the primary shows the `button` indicator, the trigger stays
  `aria-disabled`, focusable, and painted in the tone. `remember` binds `value`/
  `defaultValue`/`onValueChange` to the radio group of `menu` through
  `SplitButtonChoices` / `slSplitButtonChoices`. The trigger name is
  required (a type in React, a `SlIconButton` check in Angular).
  `@slotted/angular/button` now exports `BUTTON_WAIT`, `resolveInertness`,
  `resolveLoadingIndicator`, `stateAttribute`, and `blockActivation`, so a
  family can extend a member without reaching into its source; the Angular trigger
  hosts `slMenuTriggerFor` through `hostDirectives`. In the same session, `menu`
  now draws the hand on items (`cursor: pointer`; `not-allowed` on the
  unavailable item): the arrow followed the platform menus, and the surface is a
  `div` in the page like the one in `select`.

- `toggle` — a `button` with `aria-pressed` outside a group. The item that
  `toggle-group` already draws, published as a family of its own for the toolbar
  and for the standalone control (`wrap` of `code-block` is one). Does not
  replace `checkbox` in a form.

  Delivered on 2026-09-16, in the `split-button` session (same three documents).
  A mode — Bold, Wrap, Pin — true at the instant it is pressed, neutral
  until on and of a single color when on (the accent pair); `ToggleButton` of
  `button` remains the action that persists and waits. Parts `root`, `icon`,
  `label`; axes `size` and `variant` (`outline`, `ghost`); `pressed` model
  identical to that of `ToggleButton`; no `loading`, no tones, no `value`, no
  `ControlValueAccessor`. Inside `toolbar` the bar owns the tab
  stop. The painting is that of the `toggle-group` item, written under its own
  prefix; the reopening above makes the item this family.

- `otp-input` — a single value distributed across N boxes; length, numeric
  or alphanumeric type, full paste, `autocomplete="one-time-code"`,
  optional mask. One logical focus stop: the real input is a single, hidden one, and
  the boxes are painting; error and screen reader reading describe one field.
  `field` for label and message; `ControlValueAccessor` and `name`.

  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  . Parts
  `root`, `input`, `group`, `separator`, `slot`; `length`, `type`, `pattern`,
  `transform`, `groups`, `attached`, `placeholder`, `mask` (the input becomes
  `type="password"`), `autoSubmit`, `webOtp` (opt-in), `onComplete`,
  `onRejected`; selection normalized to one character, every native key; the row
  is always LTR. Pure engine in `@slotted/core/otp` (`sanitize`,
  `normalizeSelection`, `currentSlots`, `spreadPlaceholder`). Angular:
  `[slOtpInput]` + `input[slOtpInputControl]` with `ControlValueAccessor`.

- `highlight` — the shared sheet in `packages/styles/src/highlight` becomes a
  family with a binding: receives `ranges` or a replaceable `matcher`, preserves the
  original text and diacritics, does not inject HTML, and does not mark when the query is
  empty. `combobox`, `select`, `listbox`, and `menu` use the family in
  place of the sheet. Engine: `@slotted/core/highlight` with the normalization that
  `typeahead` already does.

  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  . The root is
  the element that holds the text and the mark is `[data-part='match']` inside it;
  all occurrences by default (`occurrences`); `current` to locate
  on the page, painted with the solid accent pair; own or inherited `disabled`.
  `@slotted/core/highlight` has `findMatch`, `matchRanges`, `normalizeRanges`,
  `splitRanges`, and `highlightRuns`; `collection/filter` imports the scan from here.
  Migraram `combobox`, `select`, `multi-select` e `command-palette` nos dois
  bindings e `listbox` deixou de importar a folha. `menu` e `tree` ficam
  recorded above.

- `aspect-ratio image` — one session: `aspect-ratio` reserves proportion before the
  media loads and does not crop; `image` composes over it with `src`/`srcset`,
  `alt`, `fit`, `position`, `loading`, fallback, and error state. Zoom and
  preview are a separate capability (`dialog`). `avatar` and `upload`
  will read `image` when reopened; nothing changes in this session.

  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  .
  `aspect-ratio` is native `aspect-ratio` with five names (`square`,
  `landscape`, `portrait`, `video`, `wide`) and a number or pair; the frame grows
  when the content does not fit and fits a replaced child with `contain`. `image`
  renders the `aspect-ratio` root inside its own when there is a `ratio`; three
  layouts (`intrinsic`, `fill`, `framed`); `status` derived without a model;
  `fallbackSrc` before `error`; `sources` for `<picture>`; new glyph
  `--slotted-icon-image-off`. `card` reads `image` in its `media` part when
  reopened.

- `stat-card sparkline` — one session: `stat-card` with label, value, unit,
  delta, period, trend, comparison, status, and detail action; the tone derives
  from the metric's semantics and not from the mathematical sign (`goodWhen: up | down`).
  `sparkline` is the compact trend inside the card and the table cell:
  `data`, `line | bar`, reference, tone, and a text description of the last value and
  of the trend. No interactive axes. `loading` and error preserve the layout through
  `skeleton`. It is the first SVG drawn by the library; the data palette
  is a new scale of the semantic layer.
  Delivered on 2026-09-16. Inventory in
  ,
  decisions,
  self-assessment in
  .
  The `--slotted-data-1…8` scale (semantic, fixed order measured in the three
  schemes), the `4xl` steps, and the `trending-up` glyph entered the foundation.
  `sparkline`: eight parts, `type`, `size`, `curve`, `tone`, `series`,
  `reference`, `min`/`max`, generated and localized description; geometry in
  `@slotted/core/sparkline`, measured by `ResizeObserver`, marker and ring as
  zero-length strokes. `stat-card`: fifteen parts, `goodWhen` that
  derives the delta tone and hands it to the `trend`, `fill` with `plain`, `layout`,
  `status` with `message`, `loading` through `skeleton`, 10 rem floor, grid that
  levels rows. No mutable state in either.
- `table-of-contents` — links to headings with active state through
  `IntersectionObserver`, scroll offset read from `--slotted-page-sticky-top`,
  optional URL update. Focus after navigation; reduced motion respected.
  On a narrow screen it collapses into a `select` or `popover`. Answers the capability that
  `page` deferred (inventory, line 154).

  Delivered on 2026-09-17. Inventory in
  ,
  decisions,
  self-assessment in
  .
  Twelve parts, three layouts (`vertical`, `horizontal` for the `tabs` slot of
  `page-header`, `collapsed` with a trigger and a layer through `dismissable-layer`),
  `items`, `source` (headings read by `@slotted/core/outline`, `id` written
  on those that lack one), `sticky`, `history` (`push`, `replace`, `none`),
  `numbered`, `levels`, `offset`, `loading`, hidden when empty. Models `current`
  (`value`, reasons `scroll`, `pointer`, `keyboard`, `programmatic`) and `open`.
  `@slotted/core/scroll-spy`: current by geometry with `IntersectionObserver`
  and coalesced `scroll`, last target at the end of the scroller, first at the start;
  `landOn` reads `--slotted-page-sticky-top` from the scroller and adds the
  `scroll-margin` that is smaller than the chrome; `focusTarget`. Scrolling is driven
  by the family and the URL written by `history.pushState`/`replaceState`: `:target`
  and `hashchange` do not respond. The collapse is an in-flow layer under the trigger,
  without `select`. Two reopenings are recorded above: `prose`
  (`scroll-margin` with the chrome) and the `anchor-nav` pointers of `page-header` and
  `section`. Shared defect fixed: the workbench API table
  keyed rows by name and lost the second of two same-named props in
  different parts.

- `selection-toolbar` — appears when a selection exists: count, select-all of the
  filtered set, clear, allowed actions. Distinguishes "items on this page" from
  "all results"; a destructive action confirms the scope through `alert-dialog`.
  Composes `toolbar` and `action-bar`; reads the selection of `table`, `data-grid`,
  `listbox`, or `tree` through a common model from `@slotted/core/collection`.
- `column-manager` — searchable list of columns with visibility, order, pin,
  and restore; prevents hiding a required column. Applies live or on
  confirmation, a single policy per instance. Serializable and versioned
  preferences. Edits the column model of `data-grid` and `table`; opens in a
  `popover` or `drawer`. Reorder through `@slotted/core/drag` and keyboard.

  Delivered on 2026-09-23 with `saved-views` (named views over `GridView`) and
  the `data-grid` extensions (per-column help, responsive priority,
  per-grid density, fit all, announcement on hide). Decisions in
  . Serves only
  `data-grid`: the `table` reopening is in the table above.

  On 2026-09-23 the responsive priority became pop-in: the column that does not fit
  enters the row as a label/value pair instead of being dropped. Decisions in
  .

- `data-list` — the responsive recipe for a small tabular set when the
  table does not fit: each item shows priority labels and values. Keeps
  the sorting, filters, and selection of the data model; does not offer grid
  navigation. Composes `list-item` and `description-list`; `table` under `wrap` remains
  the answer for sets that fit. A tabular collection in `data-grid` no longer
  needs it on a phone: the `data-grid` pop-in covers that case.

  Delivered on 2026-09-24. Reads `GridColumn` and `GridQuery` from `@slotted/core/grid`
  and composes `list` and `list-item`; the pairs use the `data-grid` pop-in
  geometry instead of `description-list`. Decisions in
  .

## Wave 11 — mid-cost Extended

Each family brings its own model or a data adapter. None depends
on another in the same wave.

| Invocation            | Mode | Guide |
| --------------------- | ---- | ----- |
| `transfer`            | new  | 11    |
| `entity-picker`       | novo | 11    |
| `hierarchical-picker` | novo | 6     |
| `master-detail`       | novo | 4     |
| `dashboard-grid`      | novo | 4     |
| `wizard`              | novo | 15    |
| `detail-panel`        | novo | 15    |
| `notification-center` | novo | 15    |
| `markdown`            | novo | 10    |
| `tour`                | novo | 7     |
| `action-sheet`        | novo | 8     |
| `fullscreen`          | new  | 8     |

### Scope per family — wave 11

- `transfer` — two `listbox` with search, counts, bulk selection,
  `disabled`, and optional ordering. Contract: `sourceItems`, `targetKeys`,
  `selectedKeys` per pane, and a move event with direction and reason. On a
  narrow screen it becomes two steps. The actions have a label in addition to the arrow.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . `items` replaces
  `sourceItems` (the collection draws both sides); `selectedKeys` is a set and each
  pane reads its intersection. Arithmetic in `@slotted/core/transfer`.

- `entity-picker` — `combobox` oriented to remote entities: search, rich result
  (`avatar`, enough identifiers to disambiguate), filters,
  optional creation, recents and favorites, single or multiple selection. The public
  value is the ID or the normalized object; query, pagination, and ID resolution
  are adapters.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . Own implementation
  (does not compose `combobox` or `multi-select`) over `@slotted/core/entity-picker`: search with
  delay and cancellation, cache by id, batch resolution, `chosen`/`favorites`/
  `recent`/results sections, and key decision. The field stays on one row in a form (visual
  gate): `overflow` `collapse` (default, "+N" chip) | `wrap`, scope as a `select` attached to the
  front. React `EntityPicker` (`source` or `items`, `onCreate`, `renderOption`,
  `renderChip`); Angular `sl-entity-picker` (`[createEntity]`, option and chip templates,
  `ControlValueAccessor` + `Validator` with `unresolved`).

- `hierarchical-picker` — tree or cascade selection without exposing `tree` +
  `select`. Nodes with `id`, `parent`/`children`, lazy loading, leaf
  or ancestor selection, visible path, and search. TreeSelect and Cascader are two
  recipes of the same core. On a narrow screen it navigates by levels.

  Delivered on 2026-10-01 as `cascader`, which fulfills this entire scope: the
  `layout` axis (`auto`, `columns`, `drill`, `tree`) is the recipe and the
  `@slotted/core/cascader` core is a single one. Inventory and decisions in
  , self-assessment in
  . React `Cascader` and
  `CascaderPanel`; Angular `sl-cascader` (`ControlValueAccessor` + `Validator`) and
  `sl-cascader-panel`.

- `master-detail` — coordinates a list or grid and a detail: selection by URL or ID,
  empty state, and focus return. Desktop uses panes (`splitter`); a narrow
  screen uses navigation or a `drawer` with predictable return. The detail preserves
  the list's context and position.
- `dashboard-grid` — responsive widget layout with minimum size,
  optional reordering and resizing through `@slotted/core/drag` and keyboard,
  persistence, and an explicit edit mode. Each widget is a `card` with heading,
  empty/error/loading states, and a detail action.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . The layout is an ordered
  list `{ key, columns, rows, hidden? }` that serves the three size classes of the container
  itself (600, 1024); no `x`/`y`. Models `layout` and `editing`; new capabilities and
  `editing` state in the schema; glyph `--slotted-icon-resize`. Arithmetic in
  `@slotted/core/dashboard-grid`. React `DashboardGrid` + `DashboardWidget`
  (`usePersistedDashboardLayout`); Angular `[slDashboardGrid]` + `sl-dashboard-widget`
  (content in templates, in the manner of `mat-tab`; `persistedDashboardLayout`).

- `wizard` — steps with accumulated data, per-step validation, back/next/
  submit, draft, resume, and global error. State lives outside `stepper`,
  which only draws it. Direct navigation depends on completed steps; URL, reload,
  and recovery are declared policies.

  Delivered on 2026-09-25. Inventory and decisions in
  , self-assessment in
  . Each step is a `form` of
  `form`; the value is the answers accepted by step `name`; the steps are the ones the
  consumer renders, and the destination after accepting a step is decided after the consumer's
  render. Arithmetic and draft in `@slotted/core/wizard` (`storagePersistence`). React
  `Wizard`, `WizardStep`, `WizardEdit`, `WizardComplete`, actions in `Button`; Angular
  `[slWizard]`, `ng-template[slWizardStep]`, the consumer's `form[slWizardForm]`.

- `detail-panel` — summary, metadata, status, `tabs` or sections, actions, and
  history (`timeline`). Opens in a page, `drawer`, or `master-detail` depending on
  depth; URL and focus make opening shareable and reversible. Does not
  host a long editing flow.

  Delivered on 2026-09-17. Inventory in
  ,
  decisions,
  self-assessment in
  . An
  `article` whose top is a `page-header` without a wrapper; parts `root`, `body`,
  `banner`, `columns`, `main`, `section`, `section-actions`, `aside`,
  `message`, `footer`. Axes `layout` (`stacked` | `tabs`), `aside` (`end` |
  `start` | `none`), `level`, `size`, `scroll` (`ancestor` | `self`), `mount`,
  `status` (`ready` | `not-found` | `error`); `loading` state; `current` model
  (`section` / `defaultSection` / `onSectionChange` with `pointer`, `keyboard`,
  `programmatic`). The strip is `tabs` with only the list, in the header slot; the
  sections are the tabpanels linked by id (Angular's injector is the reason). The
  panel supplies the `page-header` defaults (`level`, `size`) to its
  subtree; `recordKey` changes and focus goes to the heading. No `close` (drawer),
  no fixed or hidden aside; scroll-spy deferred to `table-of-contents`.
  React: `DetailPanel` (`footer`), `DetailPanelBody` (`banner`, `aside`,
  `message`), `DetailPanelSection`, `DetailPanelTabs`. Angular:
  `[slDetailPanel]`, `[slDetailPanelBody]`, `ng-template[slDetailPanelSection]`,
  `[slDetailPanelTabs]` (host directive `slPageHeaderTabs`),
  `aside[slDetailPanelAside]`, `[slDetailPanelBanner]`, `[slDetailPanelMessage]`,
  `footer[slDetailPanelFooter]`.

- `notification-center` — persistent list with read/unread, groups, filters,
  mark all, actions, and incremental pagination. `badge`, `popover`, and full
  page share the model; live updates do not steal focus or
  reorder while the reader reads (the `fresh` part of `timeline`).

  Delivered on 2026-09-18. Inventory in
  ,
  decisions,
  self-assessment in
  .
  A `section` (a region named by its own title) with the APG Feed inside;
  parts `root`, `header`, `title`, `count`, `mark-all`, `actions`,
  `views`, `fresh`, `feed`, `group`, `group-label`, `item`, `visual`,
  `content`, `description`, `time`, `controls`, `read-toggle`, `dismiss`,
  `more`, `empty`, `footer`. Eixos `size` (`sm` | `md`), `level` (2–4),
  `growing` (`none` | `button` | `scroll`), `arrivals` (`hold` | `show`),
  `timeFormat`, `controls` (`both` | `read` | `dismiss` | `none`), per-item `tone`;
  states `read` (new in the vocabulary, 24cfc95) and `loading`; `current`
  model (`view` / `defaultView` / `onViewChange`, built-in views `all` and
  `unread`). The family does not store facts: `onReadChange({ keys, read })`,
  `onRemove`, `onOpen` (cancelable before navigation), `onReveal`,
  `onLoadMore` request with a reason and the store answers through the array; `onUnreadChange`
  is a fact for the bell. Arrivals are held behind `fresh` while focus
  is in the feed or the scroller is past the start. Unread is the wash in the
  tone and the semibold title — four marks refused at the visual gate; an
  item with a tone and no visual receives the tone glyph in a circle
  (triangles refused across the whole library, see briefing). `sm` declares
  a minimum width of 22rem for the popover. The strip is `tabs` with only the list and the
  feed as the single panel: `Tab` gained `controls` in both bindings. No
  `badge` (the count is its own chip), no bell (`top-navigation`), no
  open/close (`popover`), no bulk selection (`selection-toolbar`), no
  collapsible groups. React: `NotificationCenter` (`items`, `renderItem`,
  `actions`, `footer`, `empty`, `groupBy`, `ref` with `focus`/`reveal`/
  `markAllRead`). Angular: `section[slNotificationCenter]`, `[(view)]`,
  `ng-template[slNotificationItem | slNotificationVisual |
slNotificationActions]`, `[slNotificationCenterActions | Footer | Empty]`,
  `provideNotificationCenterDefaults()`. Shared fix: the workbench
  addressed every `h2` of the reference page and reached the family
  title; the rule became `.slotted-reference-page__section > h2`.

- `markdown` — rendering with an allowlist of elements and URLs, headings with stable
  IDs, external links, tables, code through `code-block`, empty content and
  error. Mandatory sanitization; opt-in plugins. The typography is `prose`. The
  parser is an adapter: the family receives a tree and never HTML, as
  `code-block` receives tokens.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . The input is
  mdast by shape (remark output passes without conversion; `fromMarkedTokens`
  maps the marked lexer) and `prepareMarkdown` in `@slotted/core/markdown`
  decides everything that is not an element: allowed types (`allow`, no `html`),
  URL policy (`transformUrl`; http, https, mailto, tel, and relative links,
  http, https, and relative images), ids by github-slugger with `idPrefix`,
  notes numbered by first reference, `> [!NOTE]` alerts in `alert`
  (`live="off"`), fence metadata (`title="…"`, `{1,4-6}`,
  `showLineNumbers`) for `code-block`, tables with logical alignment.
  `completeMarkdown` closes a source cut off during streaming. No state
  model: tasks and retry are requested with a reason. Parts `root`, `embed`,
  `alert-body`, `task-list`, `task`, `task-body`, `backref`, `empty`, `error`,
  around the `prose` region. React `Markdown` (`renderers`, `extensions`,
  `onTaskChange`, `onRetry`); Angular `[slMarkdown]`
  (`ng-template[slMarkdownNode]`, `[slMarkdownChildren]`, `[slMarkdownEmpty]`,
  `editableTasks`, `retryable`).

- `tour` — steps with anchor, title, content, placement, progress,
  next/previous/skip, and an availability condition. Moves focus only when
  appropriate, has an alternative without spotlight, and recovers from a missing anchor.
  Persistence and versioning belong to the product. Composes `popover` and `dialog`.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . Composes the core modules of
  `popover` and `dialog`, not the families (`popover` does not anchor to an external target). Navigation in
  `@slotted/core/tour`; `dismissable-layer.raise()`, `portal.raise()`, and `focus-scope` now
  serve a layer that returns to the top over a dialog opened mid-tour.

- `action-sheet` — variant of `menu` for touch: short actions, explicit
  cancellation, safe area, optional modal. Composes `drawer` with `side="bottom"`.
  Does not duplicate `dialog` with a form.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . A dialog that contains a
  `menu`; composes the `drawer` modules (`portal`, `dismissable-layer`, `presence`, `focus`)
  instead of its parts, and the recomposition over `drawer` is in the reopenings. React
  `ActionSheet` and parts; Angular `sl-action-sheet` and `SL_ACTION_SHEET`.

- `fullscreen` — requests and exits native fullscreen, exposes state and error, restores
  the context; label and icon follow the state. "Expand in layout" fallback
  when the API does not exist. Never blocks the browser's Escape. Engine:
  `@slotted/core/fullscreen`.

  Delivered on 2026-09-24. Inventory and decisions in
  , self-assessment in
  . `mode` is
  `auto | layout`: the API refusal falls into `layout` and emits the error. Shared
  fix: the root of `@slotted/core/portal` follows the fullscreen element.

## Wave 12 — high-cost Extended

Each family brings a subsystem. One session per family.

| Invocation             | Mode | Guide |
| ---------------------- | ---- | ----- |
| `chart`                | new  | 13    |
| `event-calendar`       | novo | 16    |
| `audit-log`            | novo | 15    |
| `workflow-tracker`     | novo | 15    |
| `import-export-center` | novo | 15    |
| `search-results`       | new  | 15    |

### Scope per family — wave 12

- `chart` — the chart system from section 13 of the guide: base types (line, bar,
  area, pie/donut, scatter), axes, legends, tooltip, selection, zoom,
  empty/error/loading states, an equivalent data table, and a text
  description. The data palette is the scale that `sparkline` opened in wave 10. The
  drawing engine is an adapter; the data contract and accessibility belong
  to the family.
- `event-calendar` — month/week/day/list views, timezone, events,
  all-day, recurrence, time navigation, filters, and opening detail.
  Does not derive from `date-picker`; reuses `@slotted/core/date` and the grid of
  `calendar` only in the month view. Overlapping events and DST have a declared
  policy. A narrow screen prioritizes the list view.
- `audit-log` — immutable event with actor, action, target, timestamp with timezone,
  origin, and an accessible diff with a text version. Search, filter, and export are
  adapters. Composes `timeline`, `table`, and `filter-bar`.
- `workflow-tracker` — current, completed, and blocked steps, owners,
  deadlines, transitions, and history. A progress view, not a workflow editor;
  an invalid action explains the precondition. `stepper` and `timeline` are the visual
  recipes.
- `import-export-center` — jobs with type, file, progress, status, per-row errors,
  cancel/retry, and result download. The operation continues outside the
  page; `toast` points to the job. Composes `upload`, `progress-indicator`,
  `table`, and `result-state`.

  Delivered on 2026-09-25. Inventory and decisions in
  , self-assessment in
  . Five states
  (`queued`, `running`, `succeeded`, `failed`, `canceled`) and the `partial` outcome derived from the
  counts; per-state controls, file availability (deadline, permission), progress
  text, time estimate, transitions, warnings, and focus destination in
  `@slotted/core/import-export-center`. Models `current` (view) and `open` (details). From
  42rem the list is a grid and each job a subgrid. `upload` enters through the import dialog in the
  `actions` slot, not in the header. React `ImportExportCenter` and `useJobToasts`; Angular
  `section[slImportExportCenter]`, `[(view)]`, `[(expanded)]`, and `jobToasts`.

- `search-results` — query, scope, filters, sorting, facets, suggestions,
  results with `highlight`, pagination or continuous load, and no-results
  and error states. Keeps URL and focus; announces the count; offers query
  correction without silently replacing it. Composes `filter-bar`, `list`,
  `pagination`, and `result-state`.

## Outside pass 2 — Specialized

Twenty-five guide families marked `[Specialized]`: `floating-action-button`,
`color-picker`, `rating`, `navigation-rail`, `floating-window`, `tree-grid`,
`pivot-grid`, `spreadsheet`, `gauge`, `map`, `diagram`, `carousel`,
`rich-text-editor`, `code-editor`, `document-viewer`, `media-player`,
`barcode`, `permission-matrix`, `resource-scheduler`, `kanban`, `gantt`,
`org-chart`, `ai-conversation`, `prompt-composer`, `speech-input`. They enter by
product decision, one at a time, with the scope written here before the invocation.
Two already have a capability deferred to them in writing: `floating-window` (drag
and resize of `dialog`) and `gauge` (arc of `progress-indicator`).

- `media-viewer` — invoked on 2026-10-30 by finding #50: the viewer that an `attachment`
  trigger opens. Composes `dialog` (`fullScreen="always"`, `surface="plain"`); fit drawn by CSS, zoom
  1–4 by buttons, wheel (summed distance), pinch, and keys around a point, pan, rotation,
  steps by buttons, arrows, and swipe, backdrop that closes without drag, PDF and text in a frame, native video and audio,
  text (JSON, YAML, CSV, code) drawn as text, empty states with tile, retry, and
  download for the rest, caption and thumbnails. Design
  .
- `carousel` — invoked on 2026-10-01 with "and things like that": slideshow, card rail, gallery
  with thumbnails, and rotation are one family with one member, `data-ui="carousel"`. Native viewport with
  scroll-snap (touch, trackpad, and browser keyboard), pages measured from the slide boxes
  (`slidesPerView` writes `--slotted-carousel-slides-per-view`, `slidesPerMove` number or `page`,
  floor `--slotted-carousel-slide-min-size`), `align` `start`/`center`, `orientation`,
  `transition` `slide`/`fade`, `arrows` `inset`/`outside`, `size`; `loop` without clones; drag with
  mouse; click on a slide that peeks. Parts `viewport`, `slide`, `previous`, `next`, `controls`
  (`below`/`overlay`), `autoplay`, `indicators` (`dots`/`line`/`thumbnails`, adaptive dots from
  eight pages), `indicator`, `counter`. States `page`/`defaultPage`/`onPageChange` and
  `playing`/`defaultPlaying`/`onPlayingChange` (new `playback` capability); APG rotation: never by
  default, does not start with reduced motion, pauses on hover and with the browser tab hidden, stops on
  keyboard focus, time on the current indicator by `--slotted-carousel-autoplay-delay`. Behavior in
  `@slotted/core/carousel`. React `Carousel` and parts, `CarouselDefaultsProvider`, `handleRef`;
  Angular `section[slCarousel]` com `[(page)]`, `[(playing)]`, `exportAs`, `slCarouselIndicatorTemplate`,
  `provideCarouselDefaults()`. `marquee` refused (decorative motion). Design in
  .
- `rating` — invoked on 2026-09-25, revised on 2026-09-28. Three members under `data-ui="rating"`:
  `rating`, a `radiogroup` of native radios (one per value, two per symbol with `step` 0.5), with
  `value`/`defaultValue`/`onValueChange` and reasons `pointer`, `keyboard`, `clear`, `clearable`,
  `readOnly`, `disabled`, `required`, `invalid`, preview by `:hover`, drag by touch, and
  `onPreviewChange` event; `ratingDisplay`, `role="img"`, free fractions through
  `--slotted-rating-fill`, parts `value` and `count`, variants `compact` and `histogram`; `ratingSummary`,
  `bars` or `spectrum` (mean, 95% interval, and conclusion of `summariseRatings`), aggregate and
  distribution per level with `selectedLevels`/`defaultSelectedLevels`/`onSelectedLevelsChange`.
  Arrows without wrap to the start, `Home`/`End`, `Backspace`/`Delete` clear. `size` `sm`/`md`/`lg` outside
  the density; `tone` without `secondary`; scheme edge `--slotted-rating-edge`. Behavior in
  `@slotted/core/rating`. React `Rating`, `RatingDisplay`, `RatingSummary`, `RatingProvider`;
  Angular `div[slRating]` com `ControlValueAccessor`, `div[slRatingDisplay]`,
  `section[slRatingSummary]`, `provideRating()`. Desenho em
  .

- `attachment` — invoked on 2026-09-30, deferred by the ReUI dossier of `upload` (section 6). A file
  that already belongs to a message, a record, or a tray: one member under `data-ui="attachment"`,
  with the set as the `group` part (`ul`, `layout` `list`/`grid`/`strip`). Parts `preview` (tile
  from the `--slotted-upload-kind-*` scale or thumbnail with fallback to the tile), `body`, `trigger` (`a` or
  `button` stretched over the root), `filename`/`name`/`extension`, `detail`, `message`, `progress`
  (`ProgressBar`), `actions`, `action`, `remove`. States `invalid`, `loading`, `disabled`; `size`
  `sm`/`md`/`lg`, `orientation` `horizontal`/`vertical`. Removal is a request without a value (`remove`,
  `keyboard`), with `Backspace`/`Delete` and focus by `removal-focus`. React `Attachment`,
  `AttachmentGroup` and parts, `AttachmentDefaultsProvider`; Angular `[slAttachment]`,
  `[slAttachmentGroup]`, `provideAttachmentDefaults()`. Design in
  , self-assessment in
  . The animated exit of a removed
  attachment stays open, like that of the `upload` row.

- `prompt-composer` — invoked on 2026-09-30 by the request for the inputs (queue, item 2). Multi-line
  frame under `data-ui="prompt-composer"`: `root` (`form`), `header`, `input` (`textarea`
  with `field-sizing: content`, `rows` floor and `maxRows` ceiling), `footer`, `action`, `attach`,
  `submit`. `value`/`defaultValue`/`onValueChange` with reasons `keyboard` and `submit`;
  cancelable `onValueSubmit`; `submitOn` `enter`/`mod-enter` with IME guard; consumer `status`
  `ready`/`submitted`/`streaming`/`error`, with submit turning into stop and `onStop`;
  `onAttach` by button, paste, and drop, validated by `selectFiles` of `@slotted/core/upload`;
  attachments drawn by the consumer with `attachment`. React `PromptComposer` and parts,
  `PromptComposerDefaultsProvider`; Angular `form[slPromptComposer]`,
  `textarea[slPromptComposerInput]` com `ControlValueAccessor`, `providePromptComposerDefaults()`.
  Desenho em.

- `color-picker` — invoked on 2026-10-01 by the request for the inputs (queue, item 3). Two members
  under `data-ui="color-picker"`: `colorPicker` (saturation and brightness area, `hue` and `alpha` channels,
  `swatch` and `previous`, value text in a `text-field` frame, `format` by `menu`,
  `eyedropper` where `EyeDropper` exists, `presets` in a `radiogroup`, `contrast` against
  `contrastWith`, `gamut`) and `colorField` (`text-field` with the swatch at `start` opening the panel
  in a `popover`). String value in the current format (`hex`/`rgb`/`hsl`/`oklch`) with reasons
  `pointer`, `keyboard`, `select`, `programmatic`; `format` with its own pair. Core
  `@slotted/core/color`. React `ColorPicker` (parts by children) and `ColorField`; Angular
  `div[slColorPicker]` and `div[slColorField]` with `ControlValueAccessor`. Design in
  .

- `message` — invocada em 2026-09-30 pelo `/reui build` de mensagem, bolha e scroller. Dois membros
  sob `data-ui="message"`: `message` (`article` com `group`, `avatar`, `body`, `header`, `author`,
  `time`, `footer`, `receipt`, `actions`, `activity`, `activity-step`, `versions`) e `bubble` (raiz
  `data-part="bubble"`, com `content`, `meta`, `quote`, `more`, `stream`, `stream-chunk`, `caret`,
  `typing`, `retry`,
  `reactions`, `reaction`). `align` `start`/`end`, `layout` `bubble`/`thread`, `status`
  `sending`/`sent`/`delivered`/`read`/`failed`/`streaming`; `variant` `solid`/`soft`/`outline`/`plain`
  × `tone`, inferred from the row when omitted. States `current` (versions), `pressed` (reaction),
  `revealed` (`maxLines`), with reason. Glyph `check-check` added to the scale. React `Message`,
  `MessageGroup`, `Bubble` and parts, `MessageDefaultsProvider`; Angular `[slMessage]`,
  `[slMessageGroup]`, `[slBubble]` and parts, `provideMessageDefaults()`. Design in
  , dossier in
  , self-assessment in
  . The animated exit of a removed
  message stays open. Streaming text enters word by word through `@slotted/core/text-stream`
  (revision of 2026-10-01).

- `message-scroller` — invoked with `message`. Focusable region around a `log`: `root`,
  `viewport`, `content`, `item`, `separator` (pinned while the day is in view), `unread`, `loader`,
  `jump`, `jump-count`. No mutable value: events `reachStart`, `anchorChange`, `scrollableChange`
  with reason; commands `scrollToMessage` (with `data-current` highlight), `scrollToEnd`,
  `scrollToStart`, `focus`. `follow`, `defaultPosition` `start`/`end`/`last-anchor`, `peek`,
  `scrollMargin`, `preserveOnPrepend`, `busy` announced by the `live-announcer`. Engine in
  `@slotted/core/message-scroller` with `overflow-anchor: none` and a reference restored by the engine
  itself. React `MessageScroller` with `ref` and parts; Angular `[slMessageScroller]` with `exportAs`.
  Design and self-assessment shared with `message`.

## Commit rule

One family per commit, `pnpm check` per family and `pnpm check:full` per wave.
A reopening that changes a `packages/core` module commits the module and the
touched consumers together, so the tree never has two versions of a
vocabulary.
