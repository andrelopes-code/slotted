---
topic: composition
prefix: CP
triggers:
  [
    slot,
    part,
    anatomy,
    where,
    place,
    compose,
    wrap,
    body,
    header,
    inside,
    beside,
    own element,
    custom,
    creative,
    bespoke,
    no family,
    token,
    literal,
    hard-coded,
  ]
families:
  [
    alert,
    inline-message,
    page-header,
    app-shell,
    top-navigation,
    popover,
    drawer,
    dialog,
    tabs,
    toolbar,
    inline,
    stack,
    grid,
    typography,
  ]
---

# Composition

Where a consumer's element goes in relation to a family: in a slot the family
names, or beside the family as a block of the consumer's own. Every family
publishes its anatomy — the parts it draws and the slots it leaves for the
consumer — and a screen that improvises a block where a slot exists loses what
the slot carries: a position, a sticky edge, a fold, a keyboard order.

### CP-01 · A slot the family names before a block of your own

Level: MUST
Applies to: any element a page places inside or beside a family — a tab strip, a toolbar, a search field, a workspace row, a footer link
Rule: Before writing an element next to a family, the family's anatomy is read; when it names a slot for that element, the element stands in the slot.
Why: The slot is where the family's promises hold — the header's tabs stay pinned, the bar's search folds, the column's header takes the row inset; a block written beside the family carries none of them and reads as a defect of the family.
Do: Open the reference page's anatomy table and match the element to a part described as "the slot a … sits in". Compose with the family's own members; wrap a family's part in a component of the page's own only when the host has no box.
Don't: Place a family's content as the first block of a body, a sibling of the family or a child of the wrong part because the markup is shorter that way.
Seen in: Nexora · Notifications tabs in the body (LA-04); the workspace text in the bar's `context` slot, which holds a control (ledger row "context is a slot for a control"); the search trigger in the bar's `search` slot, which holds a field (SC-01); a page's prose in `page-header`'s `title`, which is a wrapping row and put the paragraph beside the heading, instead of in `content` (ledger row "description is a part of content"); a report's period controls written as the body's first block, where the header's `content` names filters (RE-06) · corrected
Check: For every element of the page's own inside a family's root, the family's anatomy names the part it stands in; every "slot a … sits in" the page needs is used rather than imitated.

### CP-02 · Siblings of the page's own stand in a layout family

Level: MUST
Applies to: two or more elements a page writes beside each other with no family between them — a name and a badge, a run of tags, the lines of an address, a figure and its caption
Rule: Sibling elements of the page's own stand in `inline` (one row) or `stack` (one column) with a gap from the space scale, and text of the page's own takes its size from the typography family; bare inline siblings and bare text are not written.
Why: Two inline elements with nothing between them touch, and a badge beside a word sits on the text baseline rather than the row's centre; bare text takes the document's 16-pixel body size inside a region whose families set 13.
Do: Wrap the run in `inline` (centre-aligned by default, a two-step gap for marks beside a word) and each line of a block in `stack`; give every span of the page's own the typography family's `size`. The families' own parts — a list item's label, a cell's value, a description — already carry their size and gap and need none of this.
Don't: Write a name and a `badge` run together as text in a cell, a `description-list` value holding three tags with nothing between them, or address lines as plain spans.
Seen in: Nexora · Customer 360 — tags touching in the Account list, "Primary" hanging off a contact's name, addresses at 16 pixels beside a 13-pixel description list · corrected
Check: Every element of the page's own that has a sibling is a child of `inline` or `stack`; no bare span inside a family's part carries the body size.

### CP-03 · A track that holds a family states a zero minimum

Level: MUST
Applies to: a `grid` or a flex line of the page's own holding a family that scrolls its own content — `table`, `data-grid`, `scroll-area`
Rule: The track the family stands in is written with a zero minimum (`minmax(0, 1fr)`, or `min-inline-size: 0` on a flex child), so the family's scroller is what scrolls.
Why: A track is `auto` by default and a grid item's minimum is its content, so a table wider than the page stretches the track and pushes every sibling — the figures, the header — out of the frame, instead of scrolling inside the scroller the family already draws.
Do: State the single column as `minmax(0, 1fr)` on the region that holds the listing, and let the family's `scroll` part take the overflow.
Don't: Rely on the family to constrain itself: it cannot measure a parent that grows with it.
Seen in: Nexora · Customer 360, a six-column contacts table pushing the four `stat-card`s past the frame at 1280 · corrected
Check: At 1280 with the widest tab open, the page's scroll width equals the viewport and the family's own scroller is the only thing wider than its box.

### CP-04 · Where no family answers the problem, the screen composes its own

Level: MAY
Applies to: a problem no published family covers — two versions of one value side by side, a step of a lifecycle drawn on a row, a figure with its own shape, a summary that is neither a list nor a table
Rule: When the families' anatomies have been read and none of them answers the problem, the screen writes an element of its own rather than bending a family into a shape it does not have.
Why: A family used against its anatomy reads as a defect of the library — a `list-item` made to hold a chart, a `badge` made to hold a sentence — and the screen still does not answer the problem; a screen that draws only what a family draws cannot answer anything the library has not met yet.
Do: Read the anatomies first, and name the one that came closest and what it does not carry (CP-01 is the earlier question, not a veto). Then compose: the layout families for the arrangement (`inline`, `stack`, `grid`), the families that do fit for the parts they own, the typography family for every word, and the theme's tokens for every value the element paints (CP-05). The element takes one of three shapes, and each is legitimate — a block in the screen's template, a component of the screen's own named after what it shows, or a component the module's screens share — and it carries the state attributes the vocabulary already has, so it reads as part of the system. A screen whose problem is dense is expected to reach this rule: a flagship screen composed only of untouched families is usually a screen that gave up on its problem. Add a ledger row when a family would plausibly have covered the case: that row is what grows the library.
Don't: Reach for the nearest family and override its stylesheet; copy a family's parts into markup of your own; or leave the problem half-answered because no family draws it.
Seen in: Nexora · Customer 360, the version-conflict panel — no family shows two values of one field and the two ways out, so the panel is a `stack` of rows inside an `inline-message` · corrected
Check: For every element of the page's own, the family that came closest is named in a comment or a ledger row, and what it does not carry is named as a **part of its anatomy** — not as an impression of its examples. A claim that a family "does not do this" which its anatomy table contradicts is the defect; the approval chain was written by hand beside `timeline`, whose `rail`, `marker` and `connector` are exactly that shape, and the hand-drawn thread broke on the first step that carried a comment.

### CP-05 · An element of the page's own is built from the theme's tokens

Level: MUST
Applies to: any CSS a screen writes for an element of its own, under CP-04 or beside a family
Rule: Every value the element paints comes from the theme — space, type, ink, border, radius, elevation and motion — where the theme has a token for it; a literal is written only beside a comment that says what decided it and why no token covers it.
Why: A literal is what makes a screen look adjacent to the product rather than part of it: it ignores the scheme switch, the three densities and the theme's own retuning, and it is the first thing that drifts when the theme moves.
Do: Read `--slotted-space-*` for every gap and inset, `--slotted-text-*` and `--slotted-surface-*` for ink and ground, the typography family's `size` for every word, and the published measures of the family the element stands in — `--slotted-app-shell-row-inset` inside the navigation column, the control heights beside a control. Some values have no token and never will: a measure a column is capped at, a container query's step, an optical nudge of a pixel, the geometry of a shape the screen draws. Write those, in rem where the value scales with the type and in pixels where it does not, and put the reason beside them — the check reads that comment and passes. The escape is for a value the theme does not hold, not for a value it does.
Don't: Write a hex colour, a font size or a gap the theme already holds a token for, and do not read another family's private custom property. A literal with no reason beside it is the defect this rule is about; a reasoned one is a decision the next reader can weigh.
Seen in: Nexora · Customer 360 and Import customers, every element of the page's own · corrected
Verified in: specs/demo-screen-tokens.test.mjs, "no screen paints with a literal a token covers"
Check: Read every stylesheet of the screen, skipping media and container queries, hairlines and any line whose comment gives its reason: no colour, type size or gap remains that a theme token covers.

### CP-06 · A state the family already draws is not drawn again

Level: SHOULD
Applies to: the axes a screen passes to a family — `variant`, `tone`, `size`, `current`, `complete` — and any mark a screen adds beside a part the family fills
Rule: A screen states a state once. Where the family has a state for it, the screen sets that state and adds nothing louder beside it.
Why: The second statement is never the same size as the first: `current` on a `timeline` item draws a target, and the `solid` `variant` over it adds a halo two rules wide that crowds the title; a `badge` beside a description that already says "Waiting on this role" says it twice at two weights.
Do: Set the state the family names, read what it draws, and stop. Where an axis is passed as well, the screen can say what that axis adds which the state does not already carry.
Don't: Reach for the loudest variant to make a state visible, or add a mark beside a part that already carries the words.
Seen in: Nexora · the approval chain — a solid marker on the current step, and a status badge beside the sentence that said the same thing · corrected
Verified in: the approval panel suite, "leaves the marker to the family and asks for no louder variant" and "says the role and what the step waits on, once each"
Check: For every axis a screen passes to a family, the screen can name what it adds beyond the family's own state.

### CP-07 · A page's width is its type's

Status: retired · rewritten as CP-10, which gives every destination one width

### CP-08 · A control that changes mode keeps every box where it was

Level: MUST
Applies to: a segmented control, a tab or a toggle that switches what one region holds — a reply or an internal note, one view or another — and the text beside it
Rule: Switching the mode changes the words and the values in the region, never the size, the line count or the position of any box in it or around it; text whose length differs between modes stands on one line, cut with an ellipsis and read whole from its title.
Why: The line beside Reply and Internal note was longer in one mode and wrapped under the control at narrow widths, so every switch moved the composer and the conversation above it under the reader's eyes and pointer.
Do: Give the varying text `flex: 1 1 0`, `min-inline-size: 0` and a one-line cut, write the two texts to similar lengths, and keep a control's label set fixed across modes.
Don't: Let a mode add or remove a line, a hint or a control that changes the region's height, or let a row wrap differently in one mode than in the other.
Seen in: Nexora · the ticket composer's mode line · corrected
Verified in: tools/look.mjs at 1280, 570 and 390 pixels on the ticket composer
Check: At 1280, 570 and 390 pixels, switch the mode and read the bounding box of each box in the region: every top and height is the same in both modes.

### CP-09 · A control that switches a region does not render the region in its own frame

Level: MUST
Applies to: tabs, a segmented control, a route link or a filter whose change mounts a region holding tables, grids, charts or forms
Rule: The control's own state — the selected tab, the pressed segment — updates in the interaction's frame; the region renders from a deferred value (in React, useDeferredValue or startTransition) and states aria-busy while the shown value lags the selected one.
Why: Mounting a region of families in the click's task blocks the next paint, and Interaction to Next Paint above 200 ms is "needs improvement" and above 500 ms "poor": a table of a hundred rows of twenty cells measured 160 ms in one task in a development build, and a 4× CPU throttle takes its 93 ms in a production build past the first threshold.
Do: Keep the selection state urgent and hand the region the deferred value; mount only the selected panel, with mount active.
Don't: Set the selection and the region from one state update inside the click handler, or mount every panel to make switching look instant.
Check: Switch the control with the CPU throttled 4× in Chrome: the selection marker moves in the next frame, and the Performance panel shows no long task between the click and that paint.

### CP-10 · Every destination has one width

Level: SHOULD
Applies to: every `page`
Rule: Every destination of the navigation — a list, a record, a dashboard, an overview — is `full`, so moving between destinations never moves the column's edges; a create or edit form is `wide` and lays its fields out in a grid of the form's own; a page of preferences read as prose is `measure`.
Why: A list at `bleed`, a record at `wide` and a form at `content` moved the column's edges on every move between destinations, and a form 56rem wide stood narrow in a desktop frame; the owner read the pages as squeezed and without a pattern.
Do: Set `full` on every destination and `wide` on every form, on the page and nowhere else; a list keeps `fill` (LP-12); a form arranges its fields in a `grid` within that width.
Don't: Give each page type a measure of its own, or cap a form's body with a width of the screen's own.
Seen in: a consumer application · Transactions at `bleed`, Categories at `wide`, new transaction at `content` · corrected
Check: Move between two destinations of the navigation: the header's and the body's start and end edges stay on the same lines.

### CP-11 · A message about a region is an alert

Level: SHOULD
Applies to: every message a screen shows that is not a `toast` — a notice, a warning, a refusal, a pending state, an absence explained
Rule: A message about one control or one value is an `inline-message` under or beside that control; a message about anything larger — a section, a form, a panel, a list, a record, the page — is an `alert` at the head of that region.
Why: `inline-message` is a line of muted text with no frame, sized to stay quieter than the control above it; standing alone at the head of a region it reads as a stray caption, and the region's notice loses the title, the frame and the actions that `alert` carries.
Do: Name the one control or value each `inline-message` is attached to; where there is none, use `alert` with the tone of the message, a title when the message has more than one sentence, and its actions part for what the reader does next. A control inside `field` takes the field's error and description parts, which render an `inline-message` already.
Don't: Put an `inline-message` at the top of a section, a card, a drawer, a dialog or a page; give it a larger size to make it read as a section notice; or stack several of them as a list of a region's problems.
Seen in: a consumer application · settings, the market data notices — a missing source, an overdue source, an update running and a refused change each drawn as an `inline-message` at the head of the section · corrected
Check: For each `inline-message` on the screen, point at the one control or value it describes, in the same row or the row above; a message with no such control, or one placed above a region's content, fails.
