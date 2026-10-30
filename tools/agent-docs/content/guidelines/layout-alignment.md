---
topic: layout alignment
prefix: LA
triggers:
  [
    pagination,
    pager,
    align,
    alignment,
    right,
    end,
    left,
    start,
    header,
    footer,
    column,
    sidebar,
    nav,
    inset,
    padding,
    row,
    avatar,
    workspace,
    sticky,
    preview,
  ]
families: [pagination, page, page-header, app-shell, side-navigation, list]
---

# Layout alignment

Where a control stands inside the row or region that holds it. The library
sizes each family and publishes the measures a frame's rows stand on; it does
not decide which end of a line a pager takes or that a consumer's header row
inside the navigation column reads the same inset the destinations do.

### LA-01 · The pager stands at the end of the line

Level: SHOULD
Applies to: `pagination` under a `list`, a `data-grid` or any paged region
Rule: A pager under a paged region is aligned to the end of the line.
Why: The reader's eye rests at the end of the last row, where the row actions are; a pager at the start sits under the labels and reads as part of the content.
Do: Align the pager's row to the end. Where a summary of the page ("1–25 of 112") accompanies it, the summary takes the start and the pager the end of the same line.
Don't: Leave the pager at the start of the line because that is where a block begins.
Seen in: Nexora · Notifications page · corrected
Check: Under a paged list, the pager's last control ends on the region's end edge, the edge the rows' actions are inset from.

### LA-02 · Pinned rows of the column write the row inset and the mark

Level: MUST
Applies to: what a consumer places in `app-shell`'s `nav-header` and `nav-footer` — a workspace row, an account row, a status row
Rule: A consumer's row in the navigation column's pinned parts is inset by `--slotted-app-shell-row-inset` and starts with a mark column `--slotted-app-shell-row-mark` wide, the avatar centerd in it.
Why: The destinations under it are `side-navigation` rows on the same measures; a header row without them stands on the region's edge and its avatar off the icon column.
Do: Read the two published measures on the row. In the rail the words are hidden and the mark stays centerd; in the overlay card the frame adds its own inset and the row's inset stacks on it, as the destinations' does.
Don't: Write a bare avatar and text into the header, or pad the header by a number.
Seen in: Nexora · navigation column header, on the overlay card at phone width · ledger rows "nav-header and nav-footer carry block padding only" and "the overlay layer is a card"
Check: The header's avatar and the first destination's icon share a left edge, in the column, in the rail and in the overlay.

### LA-03 · A phone's header keeps its actions on one row

Level: SHOULD
Applies to: what a consumer places in `page-header`'s `actions`, under any title
Rule: Below the header's narrow step the header's actions occupy one row: one action beside a plain title becomes its icon-only form, and two or more stand in a `toolbar` that folds into its menu, each item with its counterpart and the primary one without, so it stays. Beside a plain title that row is the title's line; under a rich title (visual, marks, subheading) `page-header` gives the toolbar a full row of its own.
Why: Loose actions wrap, and a wrapped row under a heading puts the title at the start of one line and the actions at the end of the next, aligned with nothing; four labelled buttons in an inline row took three rows of a phone's header.
Do: Write the action twice — the labelled control and its icon-only twin with the same accessible name, the same states and the same handler — and show one per side of the header's own container query; write two or more as `toolbar` items with counterparts.
Don't: Leave labelled buttons in an inline row that wraps, or shrink a control under the touch target to make it fit.
Seen in: Nexora · Notifications page on a phone, "Mark all as read" under the title · corrected
Check: At 360 pixels with a coarse pointer, the header's actions occupy one row, and every action is reachable in it or in its menu.

### LA-04 · A page's views are the header's tabs

Level: SHOULD
Applies to: `tabs` that switch what a page's body shows — views, filters by state, sections of one record
Rule: Tabs that change the page's content stand in `page-header`'s `tabs` slot, not in the body.
Why: The header sticks and its tabs slot is the bottom of it, so the views stay in reach while the list scrolls; tabs in the body scroll away with the first rows and the reader loses where they are.
Do: Place the `tabs` root in the header's `tabs` slot; the family draws the rule under the title area and keeps the row pinned.
Don't: Write the tab strip as the first block of the body with a margin under it.
Seen in: Nexora · Notifications page, All / Unread / Archived scrolled out of view · corrected
Check: Scroll a long list under the header: the tab strip stays visible under the title.

### LA-05 · Controls side by side share their top

Level: MUST
Applies to: fields on one line — a table row of editable cells, an inline group of fields, a grid of fields with an action button — where some carry a line of help or an error and others do not
Rule: Fields on one line are aligned to the start of the block axis, so every control of the line starts at the same height and has the same height whatever stands under it. A button on the line stands on the controls' row, not on the labels' or the help's.
Why: Centerd or aligned to the end, a field with a line of help under it stands its control higher than its neighbour without one, and the line of controls the eye follows across the row breaks by the help's height.
Do: Set the `cellAlign` axis to `start` on a `table` whose cells hold fields, and the `align` axis to `start` on an `inline` of fields. In a grid of fields with a button, give the grid three rows — label, control, help — each field spanning them with `grid-template-rows: subgrid`, and place the button in the control row; a value read beside the controls is centerd on the controls' height.
Don't: Keep the table's centerd cells for a row of fields, where a quantity with help stood 21 pixels above the cost beside it. Align a grid of fields with `align-items: end` to bring a button level with the controls: the field with help lifts its control by the help's height.
Seen in: Nexora · new purchase order, the lines table (ledger row "table, field") · corrected. Nexora · new quote, the line picker: Discount with "Percent off the list price." stood 24 pixels above Item and Quantity · corrected
Check: On a line where one field carries help and another does not, every control and the button share one top and one height, measured by bounding box.

### LA-06 · A sticky element of the screen's own stops under the page's chrome

Level: MUST
Applies to: an element a screen makes `position: sticky` inside a page — a preview beside a form, a summary beside a list, a column's own header
Rule: The element's offset starts at the page's published `--slotted-page-sticky-top`, the measured height of the chrome that stays (the stuck page-header's title area, a sticky section's header), and an element that may be taller than what stays visible caps its height by the same property and scrolls inside.
Why: An offset from the scroller's edge alone — `inset-block-start: var(--slotted-space-4)` — sticks the element behind the stuck header, which is painted above it: its top is hidden for as long as it is stuck.
Do: Write `inset-block-start: calc(var(--slotted-page-sticky-top, 0px) + <gap>)` and, when the element can outgrow the view, `max-block-size: calc(var(--slotted-page-scrollport-block-size, 100dvh) - var(--slotted-page-sticky-top, 0px) - var(--slotted-page-sticky-bottom, 0px) - 2 * <gap>)` with `overflow: auto`: the page publishes the scroller's own height, which an inset application frame makes shorter than the viewport.
Don't: Measure the header or the scroller in the screen's own code, hard-code the header's height, or cap the element by the viewport's height, which overshoots a scroller the application frame insets: the header collapses, wraps and changes with the density, and the page already measures both.
Seen in: Nexora · the workflow editor, its "As it will run" preview stuck under the page header · corrected
Verified in: tools/look.mjs on the workflow editor at 1440×900, main scrolled to 500 and 700 (208 against 176)
Check: Scroll the page until the header sticks, at two scroll positions: the sticky element's top stands at or below the bottom of the stuck header's title area each time.

### LA-07 · A page footer's action-bar holds one row on a phone

Level: MUST
Applies to: an `action-bar` in a page's footer or a detail panel's footer
Rule: The bar holds one row below its narrow step: the action that confirms declares no counterpart and stays, every other action declares a counterpart, and the bar's overflow control ends the run.
Why: A bar without an overflow control stacks its actions into a column below 24rem: three actions stood in a footer 164 pixels tall on a 358 pixel phone, a quarter of the screen that the content scrolls under.
Do: Give each action that is not the confirming one its counterpart, and close the run with the bar's overflow control.
Don't: Leave the secondary actions without counterparts, or drop the overflow control from a bar of three or more actions.
Seen in: a consumer application · a record form's footer with Discard, Save and add another, Save · reported
Check: At 360 pixels with a coarse pointer, the footer's actions occupy one row and the overflow control holds the actions that folded.
