---
topic: overviews
prefix: OV
triggers:
  [overview, dashboard, flagship, figure, stat card, exception, summary, chart, door, phone, narrow]
families: [stat-card, chart, list, list-item, table, section, grid, dashboard-grid, card]
---

# Overviews

How a screen that summarizes a module is composed: what its figures lead to,
what a phone keeps first, and when a chart earns its place. The library gives
`stat-card` a figure and an action, `chart` a comparison and its table, and
`list` rows that are destinations; it does not say that a figure is a door, in
which order a phone reads a summary, or that a comparison of one is not a
chart.

### OV-01 · Every figure opens the list it counts

Level: SHOULD
Applies to: a `stat-card` on an overview whose number counts records a list page holds
Rule: The figure leads to the list page of the records it counts, and that list opens with the figure's condition applied as the bar's own pills, which the reader removes like any other.
Why: A number the reader cannot open is a question with no way to its answer, and a list opened without the condition makes the reader rebuild the filter the figure already stood for.
Do: Put the door in the card's `action` part at the desk. Keep the list a destination of its own in the navigation, and let the overview summarize and lead rather than hold the list in its body. Carry the condition in the address, so the door is a link a colleague can paste.
Don't: Draw a figure with no way to the records, open the unfiltered list, or narrow the list through a place the bar does not show.
Seen in: Nexora · Inventory overview, the four exception figures and the stock list they open · corrected
Check: Press each figure's door: the list's bar shows the figure's pill and its count equals the figure.

### OV-02 · A phone reads the summary in the order it is acted on

Level: SHOULD
Applies to: an overview in the compact size class
Rule: Below 600 pixels the figures are one `list` of rows that are destinations — label, comparison, number — followed by the records to act on, the work in flight, the charts, and the history last.
Why: Five cards two by two fill a phone's first screen before a single record is named, and each card's door wraps under its label below the label's floor.
Do: Draw the same figures as `list-item` rows whose content is the link and whose `end` holds the number, and place the regions by one grid whose areas change at the expanded size class.
Don't: Keep the desk's card grid on a phone, or put the charts above the records a reader acts on.
Seen in: Nexora · Inventory overview at 390 pixels, five cards filling the first screen · corrected
Check: At 390 pixels with a coarse pointer, the first screen holds the four figures as rows at least a touch target tall and the heading of the records to act on.

### OV-03 · A comparison of one is a sentence

Level: SHOULD
Applies to: a `chart` that compares categories whose number depends on the reader's scope — warehouses, teams, regions
Rule: Where the reader's scope holds one category, the chart is not drawn and one sentence states the numbers it would have compared.
Why: A bar chart of one category compares nothing, and it takes a chart's height to say three numbers.
Do: Decide the chart from the scope the page already reads, and write the sentence with the numbers and their unit.
Don't: Draw one group of bars, or leave an empty chart region for a reader scoped to one place.
Seen in: Nexora · Inventory overview read by a warehouse operator scoped to CHI-01 · corrected
Verified in: Sign in as Jordan Wells: the overview has no warehouse chart and says CHI-01's three counts in one sentence
Check: Sign in as a reader whose scope holds one category: the overview draws no comparison chart, and one sentence states that category's numbers.

### OV-04 · A threshold is said, then painted

Level: SHOULD
Applies to: a figure of an overview whose reading changes at a share the product states — overdue receivables against all receivables
Rule: The thresholds are stated once in words beside the figures, and a figure past one says so in its own comparison line, on the line the placeholder reserves; the card takes `attention` at the threshold's level (`warning` or `danger`).
Why: Color is a second channel: `attention` paints the value and the edge of the card, and a reader who does not see the color reads the crossing in the comparison. The card's `tone` is the trend's and paints nothing on a card without one, and a mark added beside the label moves the card's header to a second line.
Do: Keep the shares in one place of the page's code and one sentence on screen ("a warning from 20 percent of receivables and a danger from 33"), end the crossed figure's comparison with the threshold it passed ("26% of receivables, above 20%"), and set `attention` to `warning` on that card.
Don't: Set `attention` on a card whose comparison does not name the threshold, set `tone` to flag a crossing, or add a badge to the card's header for the crossing.
Seen in: Nexora · Finance overview, overdue receivables in healthy and in collections pressure (ledger row "stat-card, tone is the trend's") · corrected
Verified in: the finance overview suite, "turns the overdue figure to a warning and a danger at the shares the page states" and "reads differently under collections pressure: the overdue share crosses the danger".
Check: Bring a figure past each stated threshold: the threshold sentence stands beside the figures, the figure's own comparison line says it crossed, on the line its placeholder reserved, and the card carries `attention` at the threshold's level.

### OV-05 · A chart is framed only as a tile

Level: SHOULD
Applies to: `chart` and `stat-card` on an overview, a record's figures or a list's chart tab
Rule: A chart takes the `card` `variant` when it is one of two or more peer tiles in one grid with no section heading of its own, and stays `plain` when it is the body of a titled section or the only content of a tab.
Why: The section's heading and its space already frame a chart that is its body, and a card around it draws a second frame; peer tiles without headings need the frame to read as separate answers of the same height.
Do: Give a plain chart a `title` that names the measure and not the section's words again; in a grid of peer tiles, let the chart's title be the tile's title and share the row's height, as `stat-card` always does.
Don't: Frame every chart by habit, or leave a chart plain among framed tiles where it reads as the page's background.
Seen in: Nexora · inventory and finance overviews, receiving's chart tab: every chart is the plain body of a titled section · corrected
Check: For each chart, name what frames it: a titled section (plain) or a grid of peers (card); a chart with neither frame, or with both, is a finding.

### OV-06 · The stat-cards of one row share their structure

Level: SHOULD
Applies to: a row of `stat-card`s on an overview or a record page
Rule: The cards of one row carry a label of at most three words, the figure, and the same optional parts on every card — a comparison of one line on each, or on none.
Why: One card with a long label and a wrapping comparison beside three cards with a label and a value made four boxes of the tallest card's height, three of them mostly empty, and the row read as broken.
Do: Give every card a short label, its figure and one comparison line; detail that only one card has goes into its comparison or a tooltip.
Don't: Lengthen one card's label to carry its detail, or give one card of the row a part the others lack.
Seen in: a consumer application · Categories › Rules, the coverage row · corrected
Check: In every row of `stat-card`s, every label has three words or fewer, and either every card has a comparison or none does.

### OV-07 · An arranged overview is a dashboard-grid

Level: SHOULD
Applies to: an overview whose blocks the reader moves, resizes or hides
Rule: The overview is one `dashboard-grid` whose blocks are each one of its widgets, and each headline figure is a widget of its own whose title is the figure's label.
Why: A grid of the application's own with its own menu for hiding blocks repeats the editing, the keyboard moves, the persistence and the Add widget menu the family already draws.
Do: Give each widget a `value` and a `title`, and let the `auto` `rows` size a figure's widget to its content; persist the layout with the family's own persistence.
Don't: Build a `grid` of sections with a menu of the application's own that hides or orders them, or put several figures inside one widget.
Seen in: a consumer application · Overview, the indicators block and its own hide menu · rewritten
Check: Find every control of the overview that hides, moves or resizes a block: each is the `dashboard-grid`'s own.

### OV-08 · Inside a frame, a figure is plain

Level: SHOULD
Applies to: `stat-card` and `chart` inside a framed region — a widget of the `dashboard-grid`, a `section` with the `surface` `ground`, a `card`
Rule: A `stat-card` inside a framed region takes the `plain` `fill` and a `chart` takes the `plain` `variant`; a frame inside a frame is a finding.
Why: The region's frame already separates the figure from its neighbours, and a second frame inside it draws a card within a card whose inner edge sits one inset from the outer.
Do: Let the region's title name the figure, as a widget's title does, and keep the figure's own header for a status or an action.
Don't: Leave a `stat-card` at its default `outline` fill, or a `chart` at the `card` `variant`, inside a widget, a surface section or a card.
Seen in: a consumer application · Overview, outlined stat-cards inside a surface section · corrected
Check: For each `stat-card` and `chart`, name the frame around it: inside a widget, a surface section or a card, its fill or variant is `plain`.
