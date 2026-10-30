---
topic: workspaces
prefix: WS
triggers:
  [
    workspace,
    reconciliation,
    match,
    candidate,
    confidence,
    score,
    queue,
    three columns,
    dense,
    phone,
  ]
families: [detail-panel, list, list-item, table, filter-bar, scroll-area, tag]
---

# Workspaces

How a dense screen that works a queue against candidates is composed: what a
phone keeps of its regions, and how a machine's score is put before a person
who confirms it. The library gives `detail-panel` a main column and an aside,
`list` rows that lead somewhere and `table` a summary row; it does not say
how three regions become one on a phone, or that a score is shown taken apart.

### WS-01 · A phone reads one region at a time

Level: SHOULD
Applies to: a workspace of three regions — a queue, the record opened from it, and what the record is matched against
Rule: Below 600 pixels the workspace shows the queue, and opening a row goes to the row's own address, where the record's page holds the other two regions, the third under the second; the back gesture returns to the queue.
Why: Three columns in 390 pixels are three columns nobody can read, and a region hidden on a phone is work a phone reader cannot finish.
Do: Make the opened record a place in the address at every width, so the selection is a link and the back gesture walks it back. From 600 pixels keep the queue beside the record and draw the record as a `detail-panel` whose `aside` is the third region, so the family decides whether it stands beside or under. Drop nothing: the phone reaches every region, one at a time.
Don't: Scroll the workspace sideways, hide the third region on a phone, or keep the selection in the page's state alone.
Seen in: Nexora · the reconciliation workspace, deposits, candidates and open invoices · corrected
Verified in: tools/journey-c.mjs at 390×844 and 360×780
Check: At 390 pixels, open a row of the queue: the address changes, the record and the third region stand one under the other with no sideways scroll, and the back gesture returns to the queue.

### WS-02 · A score that decides is taken apart

Level: SHOULD
Applies to: a score a person confirms or refuses — a match confidence, a risk rating the reader acts on
Rule: The score is shown as a table of its criteria, each with the points it earned or none of its points, ending in the summary row that adds back up to the score and says where a cap applies, and its band is one mark beside one sentence giving the thresholds.
Why: A number or a band alone asks the reader to trust the machine, and a confirmation given on trust is the one a person was asked to give.
Do: Map each criterion the backend reports to its points, draw the ones the candidate did not earn as "0 of N", sum them in the table's `summary` (RP-07), and state the bands once ("high from 85, medium from 60"). Say the difference between the two compared amounts beside the command that confirms.
Don't: Show the band twice at two weights (CP-06), or put the reasons in a tooltip.
Seen in: Nexora · the reconciliation workspace's candidates · corrected
Verified in: the reconciliation suite, "takes every score apart into criteria that add up to it, capped at 100, in its band"
Check: Read one score: its criteria rows add up to the summary row, the summary equals the score or names its cap, and the band is stated once with its thresholds.
