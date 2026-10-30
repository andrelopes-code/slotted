---
topic: list pages
prefix: LP
triggers:
  [
    list,
    listing,
    table,
    grid,
    data-grid,
    columns,
    rows,
    search,
    filter,
    filter-bar,
    saved view,
    preset,
    bulk,
    selection,
    action-bar,
    pagination,
    page size,
    count,
    truncate,
    phone,
    narrow,
    badge,
    tag,
  ]
families:
  [data-grid, table, filter-bar, action-bar, pagination, page, page-header, link, badge, tag]
---

# List pages

How a screen that lists records is composed: where the search, the filters
and the bulk actions stand, what a row shows when a value does not fit, how
the count and the pager share the answer, and what a list of many columns
does on a phone. The library gives `data-grid` a query, `filter-bar` a tree,
`action-bar` a place for what a selection can do and `pagination` a page;
it does not say which of them holds the search, how many columns a phone
keeps, or whether a phone is offered a page size.

### LP-01 · A phone keeps the row header and the columns of highest priority; the rest move into the row

Level: SHOULD
Applies to: a `data-grid` of many columns that uses the pop-in: narrower than 600 pixels, or on a touch screen narrower than 1024 (the pop-in is the default)
Rule: The grid shows the selection column, the row header and the columns of highest priority that fit; the others move into the row's pop-in as labelled values, by `priority`, outside the column state, and no row is wider than the frame.
Why: A grid that scrolls sideways on a phone hides the value the reader came for behind a gesture the page also answers, a grid that shrinks twelve columns into 390 pixels shows none of them, and a grid that drops the columns it cannot fit leaves the screen without the facts it exists to show.
Do: Mark the identity column as the row header and give the key columns a `priority`, lowest for the one fact that says where to look first (for customers, the health). Columns without a priority move first. Turn the pop-in off only on a column another column already repeats. Keep the selection column: the bulk action is still the phone's. The column manager marks moved columns "Shown in row". Offer the list's sort from the list tools while the pop-in holds columns, since their headers are gone.
Don't: Let the frame scroll sideways on a phone, compute a phone column set from a media query into the column state, draw a column's value under the row header by hand, or give the row header a priority.
Seen in: Nexora · Customers list at 390 pixels, twelve columns scrolling inside the frame; then a phone column set that dropped ten of them; Contacts and SKUs drawing a second value under the name by hand · corrected
Verified in: tools/column-scenarios.mjs at 390 pixels and the phone audit
Check: At 390 pixels no row is wider than the frame, the first row's pop-in holds the moved columns as labelled `popin-field`s, and the list's sort is reachable from the list tools.

### LP-02 · The bar above the grid holds search, filters and views

Level: SHOULD
Applies to: a list page composed of `page-header`, `filter-bar` and `data-grid`
Rule: The search field, the filter pills and the saved views stand in one `filter-bar` as the first block of the page body, above the grid; the header keeps the title and the actions that create or leave the list.
Why: The bar is a `search` landmark with three tab stops whatever the field count, and it is a query container that folds its pills behind "Filters (n)" on its own; a search field in the header's actions or filters in the grid's header row lose that fold and split one query across two regions.
Do: Bind the bar's tree and query and the grid's query to one store; the bar's `end` slot holds what acts on the view (save, delete). Give the bar the count of the query beside the count of the tenant, so "12 of 1,146" reads as the filter's effect.
Don't: Put the search in `page-header`'s actions, draw a second search in the grid's filter row, or keep the saved views in the header's tabs: a view is a tree the bar already edits, and its select is the bar's `preset` part.
Seen in: Nexora · Customers list · corrected
Check: Tab from the title: the search field, then the toolbar of pills, then the chips, then the grid. Below 36rem the pills fold behind "Filters (n)".

### LP-03 · A selection's actions stand in the page footer

Level: SHOULD
Applies to: bulk actions over a `data-grid` selection
Rule: The actions a selection allows stand in an `action-bar` in `page`'s footer part, open while the selection is not empty, with the count and Clear at the start and the action that confirms at the end.
Why: The footer is the page's own bar for what finishes a task and stays at the bottom of the scroll; a bar drawn above the grid moves the rows when it appears, and one floating over them covers the last rows.
Do: Open the footer on the selection; the bar takes its `plain` variant because the footer already paints a ground. Rank the actions so that the confirming one never moves and the rest give way to the overflow. On a phone the bar becomes a column; offer the mutations only — a file export is a desk's task.
Don't: Draw the selection bar inside the grid's footer beside the pager, or leave the export in the phone's column.
Seen in: Nexora · Customers list, the bar in the page footer · corrected (the bar's width in a flex footer is the ledger row "action-bar shrank to nothing in the page footer")
Verified in: Select two rows: the footer opens with "2 customers selected", Clear, and the actions end-aligned; clear the selection and the footer leaves
Check: Select two rows: the footer opens with the selection count, Clear, and the actions end-aligned; clear the selection and the footer leaves.

### LP-04 · A value that does not fit truncates, and the row does not grow

Level: MUST
Applies to: any text cell of a listing, the row header in particular
Rule: A value longer than its column is cut with an ellipsis and kept whole in the cell's title; a cell template that replaces the family's value carries the cut, the title and the value's own maximum.
Why: A row that grows with its longest value pushes every other column out of the frame, a value that wraps makes rows of two heights in a list the eye scans by line, and a value wider than its column is drawn over the next one — a value in the wrong column.
Do: Leave the column's text mode at its default, `truncate`, and let the family cut the value. Where the cell is a template — a link on the name, a name over a second line — the template carries three things and not one: the cut, the title, and a maximum of the whole width. The maximum is the part that is easy to leave out and the only one that fails silently: the families that draw a name size their box to their content, a value that never wraps has its whole string as its minimum, and the grid bounds the cell's own child and reaches no further. Give near-duplicate names a column that tells them apart: the account number.
Don't: Put a name column in its `wrap` mode, ask for a cut without an ellipsis, or let a template's value keep its content's width inside a layout family the template wrapped it in.
Seen in: Nexora · Customers list, "Alimentos Continental do Brasil" on two lines in a cell template · corrected; SKUs list, a code drawn over the Name column once its own column was dragged narrower than the code (ledger row "a value drawn in a cell keeps its content's width")
Verified in: the catalogue list screens suite, "a value drawn in a cell states its maximum as well as its cut" and "no catalogue column asks for a cut without an ellipsis".
Check: Drag the column narrower than its longest value: the value ends in an ellipsis at the column's edge and nothing of it stands in the next column.

### LP-05 · The count is the bar's; the range is the pager's

Level: SHOULD
Applies to: a paged listing with a `filter-bar` above and a `pagination` in the grid's footer
Rule: The filter bar states how many rows the query kept of how many there are; the pager states the range on screen and moves the page; the grid's own range line is off.
Why: Three numbers saying overlapping things — "1,146 of 1,146", "1–25 of 1,146", "1–25 of 1146" — are two too many; each part answers one question: what the filter did, and where in it the reader is.
Do: The bar's `count` part reads the query's count and the tenant's total; the grid's range line is off; the pager with its `status`, its `page-size` and the two triggers is projected as the grid's `footer`. Below the phone step the page size is not offered: the footer is the range and the triggers.
Don't: Draw the pager under the grid as a block of the page, or let the grid's range and the pager's status both stand.
Seen in: Nexora · Customers list · corrected
Check: One count above the grid, one range in its footer; on a phone the footer is one line.

### LP-06 · A change of query empties the rows; a mutation keeps them

Level: SHOULD
Applies to: a `data-grid` in server mode over a store
Rule: A sort, a filter, a search, a page or a view removes the rows before the request and the grid draws its placeholders; a mutation read back keeps the rows in the grid's loading state, and the grid dims them.
Why: AF-04 and AF-02 applied to the grid: the family draws placeholders when it has no rows and dims the ones it has, so the store decides which of the two the reader sees by what it does with the rows.
Do: In the store, empty the rows when the incoming query differs from the current one and keep them when it is the same; keep one request sequence and discard an answer that a later request has overtaken.
Don't: Empty the rows on every request, or keep the previous page's rows under a new page while the answer is on its way.
Seen in: Nexora · Customers list · corrected
Verified in: the customers store suite, "empties the rows on a different query" and "keeps the rows while the same query is read back". With the transport degraded, a page change shows skeleton rows at once and a hold keeps the rows dimmed.
Check: With the network throttled to a slow profile, a page change shows placeholder rows at once, and a mutation read back keeps the rows on screen, dimmed, in the grid's loading state.

### LP-07 · The grid fills the body and scrolls its own rows

Status: retired · rewritten as LP-12, which keeps the page to one scroller below the compact size class as well

### LP-08 · Every number on the screen names what it counts

Level: SHOULD
Applies to: a list page whose rows and whose pages count different things — contacts read account by account, lines read order by order
Rule: The bar's count, the pager's range and its page size name their unit in words.
Why: "62 of 62" above "1–25 of 1,146" reads as one number that contradicts itself; a reader cannot tell that one counts people and the other accounts.
Do: Pass the words to the families that draw the numbers — `filter-bar`'s `count` label and `pagination`'s `range` and page-size labels — and write one sentence between them that says what the page holds and what the pager turns.
Don't: Leave two bare ranges on one screen, or explain the difference only in a tooltip.
Seen in: Nexora · Contacts · corrected
Verified in: Read the screen's numbers aloud: "62 contacts", "Accounts per page 25", "Accounts 1–25 of 1,146"
Check: Read the screen's numbers aloud: each names what it counts — the query's count, the page size, the range.

### LP-09 · A queue with no endpoint is the list its work is written against

Level: SHOULD
Applies to: a work queue the backend has no resource for — what to receive, what to ship, what to count
Rule: The queue is the list of the records the work is written against, narrowed by the states in which the work can be done and by the reader's scope, stated as the page's place; opening a row opens the form that does the work for a reader who can do it.
Why: A queue drawn from a resource that is not the work — a list of receipts already written — answers what was done instead of what is waiting, and a second copy of the records with a filter of its own drifts from the list it copies.
Do: Read the records' own list with the states as the page's place (BR-01), sort the flagged records first and then by what should already be done, let the bar's pills narrow within the place, and name the record the form writes where it is read — its address under the queue's destination.
Don't: Draw the states as the bar's pills a reader can remove, or open a row on the record and make the reader find the form.
Seen in: Nexora · Receiving, the purchase orders sent, acknowledged or partly received, with no list of goods receipts in the backend · corrected
Verified in: the procurement module suite, "queues for Jordan only what CHI-01 can receive".
Check: Open the queue as a reader with a narrowed scope: every row is a record in a state where the work can be done within that scope, the page's place states the narrowing, and opening a row opens the form that does the work.

### LP-10 · A chart about the list's records is the page's second tab

Level: SHOULD
Applies to: a comparison chart over the records of a list page that fills its body (LP-12)
Rule: The chart stands in the header's second tab, beside the list's own, and never as a block above the list.
Why: A chart above a list that fills the page takes the height the rows need: at 800 pixels a receiving queue under its chart showed two rows.
Do: Give the header two tabs — the list and the comparison — and draw the chart at its own size in its tab; where the comparison has one category, drop the tab and state its numbers in one sentence above the bar (OV-03).
Don't: Shrink the chart's plot under the family's smallest step to make room, or let the page scroll to reach the rows.
Seen in: Nexora · Receiving at 1280 by 800, the chart by warehouse over the queue · corrected
Verified in: At 1280 by 800 the receiving queue shows its rows from the top of the body; "By warehouse" draws the chart and Jordan Wells sees one sentence and no tabs.
Check: At 1280 by 800 the list shows its rows from the top of the body; the header's second tab draws the chart, and no chart stands above the list.

### LP-11 · A control that changes nothing under the pointer is not offered

Level: SHOULD
Applies to: the list tools in the filter bar's `end` slot — the density control in particular
Rule: Where the primary input is a touch screen, the list tools leave out the row density: the theme raises every density's rows to the touch target, and the tools keep the sort, the views and the columns on one line.
Why: Three densities that draw the same 44-pixel rows are a control that answers nothing, and on a phone it took the line that pushed the grid down to one visible row.
Do: Decide the density control's presence from the pointer, not from the width: a narrow window with a mouse keeps it.
Don't: Keep every desk tool on a phone and let the `end` slot wrap to three lines above the rows.
Seen in: Nexora · Receiving at 390 pixels, the list tools on three lines above one visible row · corrected
Check: With touch emulation at 390 pixels the filter bar's `end` slot is one line and holds no density control; with a mouse at the same width it does.

### LP-12 · One scroller: the grid's above 600 pixels, the page's below

Level: MUST
Applies to: a page whose body is a `data-grid` or a `table` over a store, with a bar or a message above it
Rule: From 600 pixels of the page's width the listing takes the height the bar and the messages leave and scrolls its own rows while the page does not scroll; below 600 the page's `fill` does not apply, the listing is as tall as its rows and the page scrolls. Below 600 the grid therefore windows nothing, and a store that can pass a hundred rows is served in pages: the grid asks for the next one when its last `loadMoreThreshold` rows come into view of the page's scroller, not of its own box.
Why: Two scrollers on one screen let the wheel answer whichever is under the pointer; and on a phone a filled page left the rows 155 pixels of a 667-pixel screen under a header, a banner and the tools.
Do: Write the page with `fill`; make the region a flex column that takes its parent's full height with a zero minimum, and give the listing `flex: 1 1 0` with `min-block-size: 0`, and below 600 pixels a flex basis of auto, so the listing fills a column that has a height and takes its rows' height in one that has none. The page's footer bar (LP-03) stays outside it.
Don't: Keep the zero basis below 600 pixels, which collapses the listing to nothing once the column loses its height, or give it an `auto` basis above 600, where its rows' height climbs the column and the page scrolls again.
Seen in: Nexora · Contacts, a grid of sixty-two rows that scrolled the page under the pointer and its own rows over it; Suppliers at 375×667, rows in 23% of the screen (ledger row "page, page-header, data-grid") · corrected
Check: At 1280 with a full page of rows, the document's scroll height equals its client height and the wheel over a row moves the rows; at 375×667 the document scrolls, the grid is as tall as its rows, opening the page over a store served 30 rows at a time requests pages only until the grid's last `loadMoreThreshold` rows are below the screen's edge, and scrolling to the end requests the next one.

### LP-13 · A mark in a cell is the small step

Level: SHOULD
Applies to: a `badge` or a `tag` drawn in a cell of a `data-grid` or a `table`
Rule: The mark takes the `sm` `size`; the default `md` belongs to a record's header and to a region with room around it.
Why: A row sets its text at the small type step, 13 pixels in a 34-pixel row; an `md` badge sets 13-pixel words in a 24-pixel box and stands taller and louder than the cells beside it, so a state column outweighs the record's name.
Do: Give every mark a cell holds — a state, a flag, a warning — the `sm` `size`: 12-pixel words in a 19-pixel box.
Don't: Leave a cell's mark at the family's default, or size it up to make a state stand out; a tone says that.
Seen in: Nexora · Products, SKUs and Customers, the state column at `md` beside lists at `sm` (review of the screens) · corrected
Check: On every list, every `badge` and `tag` inside a cell of a `data-grid` or a `table` carries the `sm` `size`.

### LP-14 · A list that can pass a hundred rows is a data-grid

Level: MUST
Applies to: a list of records whose count the reader does not bound — transactions, postings, imports
Rule: A list that can hold more than a hundred rows, or more than twenty columns, is a `data-grid`, which windows rows and middle columns under its default `virtualize` of `auto` wherever it has a height of its own; below 600 pixels, where it is as tall as its rows (LP-12), the store is served in pages instead. `table` is for sets the page bounds, such as a statement's lines or a record's related rows.
Why: `table` mounts every cell: a hundred rows of twenty columns measured 93 ms in one task with a production build of React in Chrome and 160 ms with a development build, and the count of rows the store returns sets that cost.
Do: Give the store's list a `data-grid` with its query, and keep `table` for the bounded sets inside a record or a document.
Don't: Render an unbounded store into a `table`, or page a `table` to keep it under a hundred rows where the grid's window would have kept the whole set reachable.
Check: Every list over an unbounded store is a `data-grid`; every `table` on a page renders a set the page bounds.

### LP-15 · A grid on the page's surface is framed

Level: SHOULD
Applies to: a `data-grid` or a `table` on a list page, a record or an overview
Rule: A grid that stands on the page's surface beside other blocks takes the `framed` `variant`; a grid that is the page's only body under a `bleed` page may stay `ruled`; `plain` is for a grid inside a `card` or a panel that already draws the frame.
Why: `ruled`, the grid's default, draws rules between rows and no outer edge, and on a raised page surface every grid read as a bare slab beside blocks that have edges.
Do: Give every grid that shares the page with a header area, a filter bar or other blocks the `framed` `variant`, and leave `ruled` to the full-bleed list whose edges are the page's.
Don't: Leave the variant at its default on a page whose width is not `bleed`, or frame a grid a second time inside a card.
Seen in: a consumer application · Transactions, Categories, Rules · corrected
Check: Every `data-grid` with no `variant` stands on a page whose `width` is `bleed`; every grid inside a `card` is `plain`.

### LP-16 · A list's header says what the list covers

Level: SHOULD
Applies to: the `page-header` of a list page
Rule: A list page's header holds a subheading that says what the list covers, the control of the period when the list reads one, the page's figures for that period in the header area as label-over-figure pairs, and the primary action as the last, solid control; a refresh control is an icon button and never the only action.
Why: A header with a heading and a refresh icon left the period and the totals with no place, and the reader learned what the list covered only by reading its rows.
Do: Write the `page-header`'s `subheading` part for what the list covers, the period's control and the figures in its `header-area` as `figure` parts, and end its `actions` with the solid primary action; the refresh stands before it as the `button` family's `iconButton`.
Don't: Leave a list's header as a heading alone, put its figures in a row of cards above the grid, or make a refresh icon the header's only control.
Seen in: a consumer application · Transactions and Categories headers · corrected
Check: Every list page's header has a subheading, its figures in the header area, and a solid primary action last; no header's only control is a refresh.

### LP-17 · The row header and the row's actions stay in the frame

Level: SHOULD
Applies to: a `data-grid` whose columns can scroll sideways
Rule: The column of kind `actions` stays pinned to the end, which is the grid's default, and the row header is pinned to the start with `pinned: 'start'` when it is the first column; no other column is pinned without a reason the page states.
Why: When the columns scrolled sideways the row's menu left the frame, and on a narrow frame the reader scrolled away from the actions to reach them.
Do: Keep the `actions` column at its default pin, write `pinned: 'start'` on a row header that is the first column, and pin nothing else.
Don't: Unpin the actions column, or pin a column the reader did not ask to keep in view.
Seen in: a consumer application · Categories, Payees and Rules grids, row menus out of reach on narrow frames · corrected
Check: In a frame narrower than the grid's columns, scrolled to the end, every row's actions cell is in view, and so is the row header when it is the first column.
