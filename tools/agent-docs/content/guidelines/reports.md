---
topic: reports
prefix: RE
triggers:
  [
    report,
    analytics,
    period,
    comparison,
    compare,
    trend,
    segment,
    drill-down,
    download,
    csv,
    anomaly,
    annotation,
    coverage,
    history,
    ranking,
  ]
families: [page-header, select, stat-card, chart, table, list, section, alert]
---

# Reports

How a screen that reads records over a chosen period is composed: what it
reads from the operational screens, how a period and its comparison are
chosen and kept, what it says where the records are not kept, how a figure
is flagged and how a breakdown is downloaded. The library gives `chart` a
period of data, `stat-card` a change and its base, `table` a summary row; it
does not say that a period lives in the address, that a figure the history
does not hold is no number, or which rule flags a figure.

### RE-01 · A report reads a period; an overview reads today

Level: SHOULD
Applies to: a report that shows a state of today beside its period's flows — receivables, a backlog, stock on hand
Rule: A figure of the report is a flow over its period against a period of the same length; a state of today is read through the operational screen's own read, says "as of today", and opens the operational screen's door.
Why: Two reads of one state drift — a receivables figure computed twice says two numbers on two screens — and a state read beside a period reads as the period's.
Do: Read the overview's answer beside the report's and draw its figures from it, with the overview's door and the overview's thresholds; give the read a region of its own, so a failure of either leaves the other on screen.
Don't: Recompute an overview's figure inside the report, or draw a state of today without saying it is today's.
Seen in: Nexora · Executive and Finance reports, the receivables read from the finance overview; Support report, the backlog from the inbox's metrics · corrected
Verified in: the report page suite, "stays useful when the book of receivables does not arrive, and says what is missing"; the backend suite, "says on the dashboard the numbers the executive report says"
Check: Read each state of today on the report: it says "as of today", equals the figure of the operational screen it opens, and stays on screen when the report's own read fails.

### RE-02 · The period is the address

Level: SHOULD
Applies to: the period, the comparison and the segment filters of a report
Rule: They are query parameters of the report's address; a report opened without them takes the ones last chosen on any report, and the back gesture from a list it opened returns to the same period.
Why: A period held in the page alone is lost on the way back from a drill-down, and a reader moving from one report to the next would choose it again on each.
Do: Write each choice into the address by replacing the current history entry, so a change of period is no step of the history and the back gesture leaves the report; remember the last choice for the next report opened without one.
Don't: Keep the period in a store the address does not name, or push a history entry per change.
Seen in: Nexora · Analytics, from the executive report to the orders it counts and back · corrected
Verified in: the report page suite, "returns from a list it opened to the report on the same period" and "takes the period last chosen when a report is opened with none"; tools/analytics-drill.mjs
Check: Choose a period, open a figure's list and go back: the report is on the same period. Open another report with no period in its address: it takes the period last chosen.

### RE-03 · What the records do not cover is not a number

Level: MUST
Applies to: a period, a comparison or a measure whose records the backend does not keep for all of its days
Rule: The period control offers only the periods the report's records are kept for; a figure, a cell or a breakdown whose records start after its range says "not kept" and from when, and is never drawn as a number.
Why: A sum over the days that happen to be kept is a part drawn as a whole: a ninety-day ratio over thirty days of invoices read 84 days of sales outstanding where the book held about 35.
Do: State once, under the controls, from which day each kind of record is kept; leave a comparison that starts earlier as "kept from", and replace a breakdown that cannot be read with the sentence that says why and which period can.
Don't: Draw a zero, a dash or a short bar for days the history does not hold, or offer a period the report will answer with nothing.
Seen in: Nexora · Sales report over twelve months, its products and representatives; Finance overview's DSO (ledger row "DSO over a part of the window") · corrected
Verified in: the report page suite, "offers only the periods its records are kept for" and "draws nothing as a number where the records are not kept"; the backend suite, "answers what is not kept as missing, never as a zero"
Check: Choose the longest period offered: every figure whose records start after its range says "not kept" and from when, and the period control offers no period the records do not cover.

### RE-04 · A change says its base

Level: SHOULD
Applies to: the change a `stat-card` draws against a comparison period
Rule: The comparison line names the value compared with and the period it belongs to; an amount and a count move by a percentage, a share by points, a duration in its own unit.
Why: "+7%" with no base is a number a reader cannot check, and a share that moves from 36% to 37% reads as a 3% rise when it is one point.
Do: Hand the card the change and write "vs $15.22M, the 30 days before" in its `comparison`, on one line cut with its title; tell the card from the measure which direction is good, so a rise in discounts or in days to ship reads as a fall in quality.
Don't: Draw a relative change of a share, or a change whose base period the page does not name.
Seen in: Nexora · Analytics, every figure with a comparison · corrected
Check: Read each card with a change: the base value and its period stand on its comparison line, and a share's change ends in "pts".

### RE-05 · An anomaly says its rule

Level: SHOULD
Applies to: a figure or a bucket a report flags as unusual
Rule: A value is flagged only by a rule the page states in words, and the flag names the value, the range it fell in, the band it left and opens the records of that range.
Why: A flag with no rule is an opinion the reader cannot weigh, and a flag that fires on noise teaches the reader to ignore the flags.
Do: Flag a value outside the mean of its own history plus or minus two standard deviations — the six periods of the same length before it, or the earlier buckets of the period — and keep a count's band no narrower than its chance variation; state a threshold the product sets (OV-04) beside it as a second kind of flag.
Don't: Flag by a fixed number the screen chose for itself, or by a comparison with a single earlier period.
Seen in: Nexora · Support report in the Support Incident scenario; Inventory in the Inventory Crisis; Finance's overdue share in Collections Pressure · corrected
Verified in: the report page suite, "flags an incident by its rule and opens the tickets it counts"; the backend suite, "flags the period it reads differently"
Check: Read each flag: the page states its rule in words, the flag names the value, its range and the band it left, and it opens the records of that range.

### RE-06 · A report's filters stand in the header

Level: SHOULD
Applies to: the period, comparison and segment controls of a report
Rule: They stand in `page-header`'s `content`, under the header's `toggle` and `pin`; below 600 pixels the area opens collapsed, so the figures lead the screen.
Why: The header's area is the family's place for filters, and a pinned area keeps the period in sight over a long report; a block in the body scrolls away and, on a phone, filled the first screen before a single figure.
Do: Write the controls and the one sentence of what the records cover in the `content`, and let the `subheading` say the period on the title row, where it stays when the area collapses.
Don't: Put the controls as the first block of the body, or keep the area open on a phone.
Seen in: Nexora · Analytics reports, the controls first written in the body (review of the screen) · corrected
Check: At 1280 pixels the controls stand in the header with the pin; at 390 pixels with a coarse pointer the first screen holds the figures and the collapsed area's toggle.

### RE-07 · Every number of a report opens what it counts

Level: SHOULD
Applies to: a report's figures, the bars and points of its charts, and the cells of its tables
Rule: Each opens the list of the records it counts, with its condition and its period as the list's own pills and the same total, and a record named by its id is named in the pill by its record's words.
Why: A breakdown the reader cannot open is a claim, and a pill reading "Account is any of cus_000412" says nothing a reader can check.
Do: Carry the condition in the address, field by field, and the names of the records it names beside their ids; let the list read them into its bar as it reads any filter (OV-01).
Don't: Open the unfiltered list, a list whose total differs from the number, or a pill of raw ids.
Seen in: Nexora · every report, its figures, bars and cells · corrected
Verified in: the report page suite, "opens every figure, bar and cell of the … report on a list whose pills count the same records"; tools/analytics-drill.mjs, "the list holds the figure's total"
Check: Open a figure, a bar and a cell: each list's pills name the condition and the period in words, and its total equals the number opened.

### RE-08 · A ranking draws ten

Level: SHOULD
Applies to: a `horizontal` `chart` that ranks categories whose number grows with the period or the tenant — accounts, products, representatives
Rule: The chart draws at most the ten first categories and says so in its title; the table under it holds every row and its summary.
Why: Forty-four representatives drawn on one plot stacked their names into a column nobody could read.
Do: Rank in the answer, cut the chart's data at ten and keep the rest — or one "other" row — to the table; place the section whose table holds every row last, since the wait cannot know its length and its growth then moves nothing.
Don't: Grow the plot with the categories, or cut the table with the chart.
Seen in: Nexora · Sales report, booked value by representative over seven days (review of the screen) · corrected
Verified in: tools/jump.mjs on the section above the ranking reads "top moved 0px"
Check: Choose the longest period: the ranking chart holds at most ten bars and says so in its title, and its table holds every row and the summary.

### RE-09 · A download is the table on screen

Level: SHOULD
Applies to: the file a report's section offers
Rule: The download is the section's table as the reader sees it — its columns, its rows and its summary row, in its words — built in the browser from the answer the page drew, for every reader of the report.
Why: A file built by another read can say other numbers than the screen, and a column the reader may not see on screen would reach them in the file.
Do: Offer "Download CSV" in the section's actions and write the file from the table's lines; name it by report, section and period.
Don't: Offer a server export the reader's permissions were not applied to, or a file of raw minor units the table does not show.
Seen in: Nexora · every report section · corrected
Check: Press Download CSV on a section: the file's rows are the table's rows and its summary, and a withheld column is absent from both.
