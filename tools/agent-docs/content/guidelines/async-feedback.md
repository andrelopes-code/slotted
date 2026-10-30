---
topic: async feedback
prefix: AF
triggers:
  [
    loading,
    pending,
    busy,
    empty,
    skeleton,
    placeholder,
    request,
    fetch,
    mutation,
    tab,
    view,
    page,
    pagination,
    popover,
    refresh,
    latency,
    spinner,
    submit,
    action,
  ]
families:
  [
    skeleton,
    button,
    popover,
    list,
    list-item,
    notification-center,
    tabs,
    pagination,
    result-state,
    page-header,
  ]
---

# Async feedback

What a screen shows between a request starting and its answer arriving. The
library gives the states — `skeleton` for a region, `loading` on a control,
`data-loading` and `aria-busy` on the families that fill themselves — and does
not say which one a screen owes at which moment. A request answers within a
second on a fast network and takes several on a slow one; a screen that shows
nothing for that long reads as a stall, and a screen that shows its empty
state reads as an answer.

### AF-01 · Pending is not empty

Level: MUST
Applies to: any region filled by a request — a `popover` body, a `list`, a `data-grid`, a `notification-center` feed, a page section
Rule: A region whose first answer has not arrived shows its pending state; the empty state appears only after an answer holding zero items.
Why: An empty state is a statement about the data, and before the answer there is no data to state anything about.
Do: Keep a loading fact beside the items, set before the request and cleared after it. Render placeholders while the fact is true and the items are none; render the empty state while the fact is false and the items are none.
Don't: Branch on the items alone. A region that opens on "Nothing waiting for you" while the request is in flight tells the reader the queue is clear, for as long as the request takes.
Seen in: Nexora · approvals and tasks panels under the banner · corrected
Verified in: the banner suite, "pending, not empty"; the demo panel's degraded transport
Check: Throttle the network to a slow profile and open the region cold; the empty words do not appear before the answer.

### AF-02 · First answer draws placeholders, later answers keep the rows

Level: SHOULD
Applies to: every region under AF-01 that is filled more than once — a panel opened again, a list read back after a mutation
Rule: A region with no items yet draws placeholders; a region that already shows items keeps them on screen and marks itself busy while a newer answer is on its way.
Why: Placeholders in place of rows the reader was looking at erase their place; rows silently replaced give no sign anything happened.
Do: Placeholders are the family `skeleton`: a region carrying the state and, inside it, the rows' own boxes — the mark, the label line, the description line — so the answer lands without a layout shift. A placeholder line is a fraction of its row, never a length: a length wider than a phone's row overflows the page and scrolls it sideways. While items are shown and a request runs, the list carries `aria-busy` and the rows stay.
Don't: Draw placeholders on every request, or clear the items before every request. Reading a list back after marking one row is a refresh, not a first load.
Seen in: Nexora · notifications panel under the bell, approvals and tasks panels, demo controls · corrected
Check: Open the region twice with the network throttled to a slow profile: placeholders on the first open, the previous rows and no placeholders on the second.

### AF-03 · The control that starts a request waits on it

Level: MUST
Applies to: any `button` member — button, icon button, toggle button — whose activation runs a request — mark as read, archive, approve, save, submit — except a control whose request reloads the whole page; the page header's progress bar answers that wait (AF-07)
Rule: From activation until the answer, the control is in its `loading` state: it refuses a second activation and shows the family's indicator.
Why: A control that looks idle invites a second press, and the second request is a duplicate the backend has to refuse or the reader has to undo.
Do: Keep, beside the data, the identity of what is in flight — the row's key for a row action, one fact for a list-wide action — and bind the control's `loading` to it. The family refuses activation on its own and names the wait for assistive technology through its loading label.
Don't: Disable the control by hand, hide it, or leave it as it was until the row disappears. Disabled says "not allowed"; loading says "working on it".
Seen in: Nexora · Notifications page, mark as read, archive, mark all as read · corrected
Verified in: the notifications store suite, "busy while its mutation is in flight"
Check: Press the control with the network throttled to a slow profile: the indicator appears, a second press does nothing, the row changes once.

### AF-04 · A change of view or page draws placeholders

Level: SHOULD
Applies to: `tabs` that switch the content of a region, `pagination`, any filter whose answer replaces the rows rather than refreshing them
Rule: When the reader asks for different rows, the rows on screen are removed and placeholders stand in their place until the answer arrives.
Why: The rows on screen are the previous answer; leaving them under the new tab says the tab did nothing until, half a second later, it does.
Do: Empty the items on the change and let AF-01 draw the placeholders. Keep what does not change — the tab strip, the pager, the header — where it is.
Don't: Keep the old rows until the new ones arrive, or replace the whole region including the tab strip with a placeholder block.
Seen in: Nexora · Notifications page, All / Unread / Archived and the pager · corrected
Check: Switch the view with the network throttled to a slow profile: placeholders at once, the tab strip and the pager still in place, rows on the answer.

### AF-05 · An indicator may wait for the request to be slow

Level: MAY
Applies to: a control under AF-03 whose request usually answers under the indicator's own entrance
Rule: A control's indicator may be delayed by the family's loading delay, so a request that answers first shows no indicator; a region's placeholders are never delayed.
Why: An indicator that appears and leaves within one frame is a flicker, and a region with nothing in it is a stall from the first frame.
Do: Use the family's delay on a control whose request is short in the normal case and leave the control refusing activation from the first instant, which the family does regardless of the delay.
Don't: Delay a region's placeholders, or delay a control's refusal of activation.
Seen in: —
Check: On an unthrottled network a short request shows no indicator and still ignores a second press; with the network throttled to a slow profile, the indicator appears.

### AF-06 · Placeholders are held once they are drawn

Level: SHOULD
Applies to: every region under AF-01, through the application's own defaults for the family
Rule: The application states one minimum duration for the whole product: once placeholders are painted they stay for it, even when the answer has already arrived.
Why: A request on a fast network answers within a few hundred milliseconds, so an undelayed region paints and is replaced inside a few frames — a blink the reader reads as a fault rather than as a wait.
Do: State the minimum where the application states its other family defaults, and leave the delay at nothing: AF-05 keeps a region's placeholders undelayed, and the minimum is the other half of the same decision.
Don't: Set the minimum per screen, or reach for a delay to stop the blink — a delay is a region showing nothing for as long as it lasts.
Seen in: Nexora · the catalogue screens, whose tab changes and category reads answer inside one frame · corrected
Check: On an unthrottled network, open a screen of placeholders twice: the placeholders are visible on both, and no region paints and empties within one frame.

### AF-07 · A record another actor changes offers Refresh

Level: SHOULD
Applies to: a record page, or a list, whose data another person or process can change while it is open — an order, an invoice, a customer another writer edits
Rule: The page offers Refresh among the header's actions, and a refresh keeps the values on screen, marks the page busy and replaces them when the answer arrives.
Why: Without it the reader reloads the browser, which loses the scroll, the open tab and any draft, and a refresh that blanks the record flickers what was already read.
Do: Put an icon button named "Refresh" in the header's actions toolbar with its menu counterpart. The wait is the page's, not the button's: the `page-header` progress part shows it, with `loading` bound to "reading again while data is shown", over the header's closing line; the button draws no indicator of its own, and a second press while the read runs starts nothing — the read in flight answers it. The body keeps its rows and draws no placeholder.
Don't: Offer Refresh on a record nothing else writes, or clear the record and draw its skeleton on every read after the first.
Seen in: Nexora · customer, quote, purchase order, order, invoice and cycle count records · corrected
Verified in: Press Refresh on an order: the header's bar runs over the closing line, the button shows no spinner and ignores a second press, the values stay
Check: Press Refresh: the header's bar runs over the closing line, the button shows no spinner and ignores a second press, the values stay.

### AF-08 · A write refreshes every view it changed

Level: MUST
Applies to: every control that writes — a create, an edit, a delete, a categorisation — and every region on any screen whose figures the write can change
Rule: A successful write marks stale every query whose answer the write can change, and the regions on screen read again; an application that cannot list them marks every query stale; a region that reads again keeps its rows and dims them (LP-06).
Why: Categorising a transaction left the category totals and the rules' coverage at their old figures until a reload, and the reader reloaded after every action to trust the screen.
Do: Beside each write, list the queries its answer changes — the record, the lists it appears in, the totals and counts over them — and invalidate them on success; where the list cannot be stated, invalidate every query after a successful write.
Don't: Refresh only the region the control stands in, or rely on the next navigation to read the other figures again.
Seen in: a consumer application · categorising a transaction left the category totals and the rules' coverage stale · corrected
Check: Perform each write: every figure on screen that the write changes shows the new value without a reload.
