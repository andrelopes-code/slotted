---
topic: record pages
prefix: RP
triggers:
  [
    record,
    detail,
    360,
    customer detail,
    entity page,
    header,
    marks,
    subheading,
    back,
    tabs,
    sections,
    facts,
    stat card,
    related,
    notes,
    activity,
    timeline,
    archive,
    hold,
  ]
families:
  [
    page,
    page-header,
    tabs,
    stat-card,
    grid,
    table,
    description-list,
    timeline,
    toolbar,
    result-state,
  ]
---

# Record pages

How the page of one record is composed: what the header says about it, where
its facts stand, how its related records are sectioned and what happens when
the record is missing. The library gives `page-header` a title row with a
visual, marks and a subheading, `tabs` a slot under it, `stat-card` a figure
and `table` a listing; it does not say which fact is a mark and which a
figure, or that the figures stand on every section.

### RP-01 · The title row names, states and places the record

Level: SHOULD
Applies to: `page-header` of a record opened from a list
Rule: The title row holds the record's visual, its name as the heading, its lifecycle state and its health as two `tag` marks at the small size, and one subheading line with the identifier, the owner and the place; the way back to the list is the header's `back` part.
Why: A reader arriving from a list or a search asks three things first — which record, in what state, whose — and a title that answers them needs no second glance at the body.
Do: Every mark is a `tag` at the small size — the state the reader can change (active, on hold) and the health the system computes (healthy, watch, at risk) each carry their tone — so the marks read as one row of one form beside a heading that is larger than any of them. The subheading joins the account number, the owner and the city with a middle dot. The back link names the list it returns to.
Don't: Mix a `tag` and a `status-indicator` in the marks — two forms of indication at two heights, 4 pixels apart — or leave a mark at the medium size, which stands 28 pixels tall beside the heading. Do not put the state in the subheading as words.
Seen in: Nexora · Customer 360, a medium tag beside a status indicator · corrected
Verified in: With the record loaded, the title row reads name, then two small tags, then "CUS-… · owner · city"; "Customers" with the back arrow stands above it.
Check: With the record loaded, the title row reads the visual, the name, two small tags, then one subheading of identifier, owner and place; the list's name with the back arrow stands above it.

### RP-02 · The figures stand in the body, on every section

Level: SHOULD
Applies to: the numeric facts a record page shows — exposure, balances, counts
Rule: The record's figures are `stat-card`s in a `grid` at the top of the page body, before the section's content, and they stay while the section changes; the header's collapsible area does not hold them.
Why: The header's content part is a column with a measure for prose; four figures in it stacked to one narrow column. In the body, above the switch, the figures read on every section and the header keeps only the title and the tabs.
Do: Four cards at the small size in a grid that drops to two columns on a phone; each card carries the figure, its unit and one comparison line ("of R$135,000", "3 of 4 open invoices"). A threshold the domain states is said in the card's comparison line once it is crossed ("above 90% of $500,000", "under 22%: Sales approval"), in words that keep the line to one: the family's `tone` is the tone it hands to its trend and paints nothing on a card without one.
Don't: Draw the figures in the header area, or under one section only.
Seen in: Nexora · Customer 360, four cards stacked in the header's content at 160 pixels · corrected; thirty cards across the modules bound a `tone` that painted nothing (ledger row "stat-card, tone is the trend's") · corrected
Verified in: Switch sections: the four cards stay; at 390 pixels they stand two by two. Open an account above 90 percent of its limit: the credit card's comparison says so
Check: Switch sections: the figures stay; at 390 pixels they stand two by two. A figure past a threshold the domain states says so in its comparison line.

### RP-03 · Related records are the header's tabs, each a table

Level: SHOULD
Applies to: contacts, orders, invoices, tickets, notes and activity of a record
Rule: Each kind of related record is a tab in the header's `tabs` slot with its count in the label; a tab's content is a `table` of that kind with a caption, or a `timeline` for activity; the empty state is the table's own `empty` part.
Why: The related records are answers to different questions and rarely read together; one long page of six tables scrolls past the one the reader came for, and the tabs stay under the title while the section scrolls (LA-04).
Do: Load the record once and derive the counts from it; a tab with zero items still exists and says so in its empty part. On a phone the table takes its fixed layout and keeps the columns that decide — the identifier and the amount, or the identifier and the status — so no table is wider than the frame.
Don't: Hide a tab because it is empty, or let a table on a phone scroll sideways inside its frame.
Seen in: Nexora · Customer 360 · corrected
Check: Every tab label carries a count once the record has loaded; at 390 pixels every table fits the frame and its empty state is the table's.

### RP-04 · A missing record is the page's own answer

Level: MUST
Applies to: a record page opened with an id the backend does not hold, or under a failed transport
Rule: The page keeps its header with the way back and shows a `result-state` in the body: `not-found` for an id that does not exist, `error` with Try again for a transport failure; the URL stays.
Why: A deep link a colleague pasted still says where it was pointing, and a reader who arrived by the back gesture leaves the same way.
Do: Read the error's code: not found has no retry, only the way back; every other failure offers Try again and the way back.
Don't: Redirect to the list, or show the list's empty state.
Seen in: Nexora · Customer 360 · corrected
Verified in: /crm/customers/cus_does_not_exist
Check: Open a record address whose id does not exist: the header names the record type with the way back, the body's `result-state` says the record does not exist, and the address keeps the id.

### RP-05 · The action that adds to a tab stands in the record's toolbar

Level: SHOULD
Applies to: an action that adds a related record — a contact, a note, an address — to a record page's tab
Rule: While its tab is open, the action stands in the record header's `toolbar` beside the record's own actions, and the form it opens takes the place of the tab's listing.
Why: The tab's content is a `table` with a caption (RP-03) and no slot for a control; a bar of the page's own above the table is a second row of actions on a page that already has one, and the header's toolbar already folds into its menu on a phone.
Do: Show the action only while its tab is open, and word it for what it adds ("New contact"). The form replaces the table in the tab, keeping the header, the figures and the tabs where they are (FM-07). A section that is not a tab — the addresses on the overview — uses `section`'s own `actions` instead.
Don't: Draw a toolbar of the page's own above a tab's table, or leave the action in the header while another tab is open.
Seen in: Nexora · Customer 360, New contact on the Contacts tab · corrected
Verified in: Open the Contacts tab: the action appears in the header's toolbar and folds into its menu at phone width; open another tab and it leaves
Check: Open a tab that can be added to: the action appears in the header's toolbar and folds into its menu at phone width; open another tab and it leaves.

### RP-06 · A record with a lifecycle shows where it stands before what it holds

Level: SHOULD
Applies to: a record that moves through states other people watch — an order, a quote, a shipment, a ticket
Rule: The page answers "where is this" above the record's contents: the steps it has passed, the step it is on, what that step is waiting on, and one sentence naming what happens next.
Why: A reader opening an order is asking what is holding it up, not what is on line seven; a status word alone says where it is and not what it is waiting for, and the lines say neither.
Do: Draw the steps as the record's own element (CP-04) with the state each one is in, and give the stopped record its own tone — a hold and a cancellation are not the same colour as progress. The figures stay above it (RP-02) and the related records below (RP-03).
Don't: Leave the lifecycle to a status `tag` in the header, or bury it under the lines.
Seen in: Nexora · the sales order workspace and its five steps · corrected
Verified in: Open an order waiting on an approval: the page says the step, who it is waiting on and what happens next, above the lines
Check: Open a record waiting on a step: the page says the step, who it waits on and what happens next, above its contents.

### RP-07 · A table that takes a figure apart ends in the total it adds back up

Level: SHOULD
Applies to: a table whose rows are one quantity split by place, period or party, standing under the figure that states the whole
Rule: The table carries the column summaries the table element has for it, holding the same totals as the figures above, and says in one line what the rows are counted in.
Why: A row of figures and a table of parts are two statements about one number, and a reader who cannot add five rows in their head has been given two numbers with no way to reconcile them — which is what a decomposition is for.
Do: Sum each column the figures state and put the sums in the table's summary row, naming how many rows were added and in what unit. A column the rows carry but the whole has no total for — a threshold, a rate — leaves its summary cell empty rather than adding thresholds together.
Don't: Leave the table without its summary, or sum a column whose total means nothing.
Seen in: Nexora · the SKU record, stock by warehouse under the availability figures · corrected
Verified in: the SKU page suite, "the warehouse rows add up to the figure the card states"; Open a SKU held in several warehouses: the summary row's numbers equal the figures above it
Check: Open a record whose table takes a figure apart: the summary row's numbers equal the figure above it.

### RP-08 · A figure over records of mixed units counts records

Level: SHOULD
Applies to: a `stat-card` over a set of related records whose quantities are not counted in one unit
Rule: Where the records do not share a unit the figure counts records; a quantity is summed only where one unit covers the whole set, and the page says which unit that is.
Why: A total over each, metres and kilograms is a number of nothing, and it is read as a quantity because that is what the card's shape says it is.
Do: Count what the reader would act on — how many are out of stock, how many are below their reorder point — and put the units question under the table as one sentence: the unit when there is one, and that the rows are read one at a time when there is not.
Don't: Add quantities across units, or leave a summed figure without naming its unit.
Seen in: Nexora · the product record, its SKUs counted rather than their stock summed · corrected
Verified in: A product whose SKUs are counted in one unit says so under its table; its figures are counts of SKUs, not quantities
Check: Read a figure over rows of different units: it counts rows and says so under its table; a quantity is summed only where every row shares one unit.

### RP-09 · A step waiting on someone else says who, and offers nothing it gates

Level: SHOULD
Applies to: a record whose step waits on a decision the reader cannot give — an approval by a role the reader does not hold
Rule: The step names the role it waits on and the page draws no control for the command that the decision gates; the control appears in the one state the backend accepts it.
Why: A control the backend will refuse until someone else acts is a refusal the reader provokes, and a waiting step with no name leaves the reader to guess whom to ask.
Do: Put the role in the step's detail and in the record's sentence (RP-06), show the approval chain under it, and derive the gated command's presence from the approval's own status.
Don't: Draw the gated command disabled with no reason, or draw it enabled and translate the refusal afterwards.
Seen in: Nexora · a cycle count submitted above US$2,500, waiting on a warehouse manager · corrected
Verified in: the inventory module suite, "asks for an approval when the variance is worth US$2,500 or more, and offers no Complete meanwhile".
Check: Open a record waiting on a decision as a reader without the deciding role: the step names the role and no control for the gated command is drawn; open it in the state the backend accepts the command: the control is drawn.

### RP-10 · A score is read against its peers and says what it counts

Level: SHOULD
Applies to: a figure that scores a record — a supplier's on-time share, quality and lead time
Rule: The figure's comparison line gives the median of the record's peers, one sentence under the figures says what each score counts and who the peers are, and a score with nothing behind it is not drawn as a number.
Why: A score alone does not say whether it is good, and a backend that writes nought or a hundred for a record with no history reads as the worst or the best of them.
Do: Read the peers once — the records of the same category — leave out of each median the peers with nothing behind that score, say "under median" in the comparison line only where the score falls under it by a margin the product states, and state that margin in the sentence under the figures, and draw a dash with the words "no line received in full yet" where the record has no history.
Don't: Compare with the whole tenant, draw a chart of every peer to answer one record's question, or show 100 for a supplier that has delivered nothing.
Seen in: Nexora · the supplier record's scorecard, and the supplier list's "No delivery yet" · corrected
Verified in: the procurement module suite, "reads the scorecard against the median of the supplier's own category".
Check: Read a scored figure: its comparison line gives the peers' median, one sentence names what each score counts and who the peers are, and a score with nothing behind it shows no number.

### RP-11 · Authority that depends on an amount is said first

Level: MUST
Applies to: a command whose required role depends on the record's value — a write-off by balance, a discount by size
Rule: The record's sentence states, before any control, which authority the current value needs, measured in the unit the policy states, and the command is drawn only in the form that authority gives the reader.
Why: A control drawn the same for every balance is refused for the balances above the reader, and a refusal after the press teaches the policy one balance at a time.
Do: Compute the value the backend measures — the balance in the policy's currency at the document's own rate — and name the tier it falls in with the threshold ("above US$500: only a Finance Manager writes it off"). Name the control for what it does in that tier ("Request write-off approval" where an approval follows), draw none where the reader's role is below the tier, and let the sentence name the role that decides. While an approval the command asked for is pending, the control is not drawn (RP-09).
Don't: Draw the command for every holder of its permission and translate the refusal, or state the threshold in the document's currency when the policy states it in another.
Seen in: Nexora · the invoice record's write-off, a balance in reais measured in dollars (ledger row "invoices.writeOff measured the balance … in the invoice's own minor units") · corrected
Verified in: the invoice suite, "measures a balance in reais in US dollars, and lets an accountant write off up to US$500", "tells an accountant that a balance above US$500 is a Finance Manager’s, and draws no control" and "asks for an approval above US$5,000, hides the control while it waits, and the controller’s approval writes it off".
Check: Open a record whose value needs more authority than the reader holds: before any control, the sentence names that authority and the measure in the policy's unit, and the command is not drawn.

### RP-12 · A document without a destination lives under what it changes

Level: SHOULD
Applies to: a record the navigation gives no destination — a credit memo, a refund — beside a destination whose records it changes
Rule: The document's list and record stand under the destination whose records it changes, declared before that destination's own record address, and every record of that destination that issued or took one links to it.
Why: A document of its own destination is a list nobody walks to, and a document kept only as a tab of one record loses the documents no record issued.
Do: Give the list a segment under the destination (the invoices' credit memos), make its way back name the destination, open its create form from the record with the record and its customer chosen, and link each application or refund from the records it touched. A refund, which changes a credit, is written from the credit memo or the payment whose credit it spends.
Don't: Add a destination the navigation's map does not hold, or reach the documents only through one record's tab.
Seen in: Nexora · credit memos and refunds under Invoices · corrected
Verified in: the Finance routes suite, "declares /new and credit-memos before :id, so neither is read as a record id"; the credit memo suite, "opens a draft, refuses as typed an application above what the invoice owes or the memo holds, and applies it whole".
Check: Open the document's create route and a record address of the same destination: neither is read as the other, and each record that issued or took a document links to it.

### RP-13 · An entry a workflow wrote names the workflow and opens its run

Level: SHOULD
Applies to: a record's activity, where an automation's action and a person's command both write entries
Rule: An entry written by a workflow's action names the workflow as its actor and, for a reader of workflows, opens the run that wrote it; it never reads as the work of the person whose command set the workflow off.
Why: A hold placed by a workflow and drawn under the name of the agent who escalated a ticket blames the agent for a rule they never saw, and leaves the reader no way to the rule.
Do: Read the actor from the entry's workflow, say it as "Workflow “name”", and put "Open the run" in the timeline item's actions where the reader holds the permission to read workflows.
Don't: Draw the automation actor's bare name, or the name of the person whose command produced the event.
Seen in: Nexora · Customer 360's activity, a customer held by a workflow · corrected
Verified in: the automation module suite, "names the workflow that wrote an activity entry, and opens its run".
Check: Read an entry a workflow wrote: its actor is the workflow, and for a reader of workflows it opens the run that wrote it.
