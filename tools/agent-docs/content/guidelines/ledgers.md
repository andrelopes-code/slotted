---
topic: ledgers
prefix: LG
triggers:
  [
    ledger,
    movement,
    stock movement,
    posting,
    history,
    audit trail,
    delta,
    balance,
    source,
    immutable,
  ]
families: [data-grid, table, drawer, description-list, link]
---

# Ledgers

How an immutable record of changes reads: one movement, the record that
caused it, and the balance it left. The library draws rows and cells; it does
not say how a signed change is written, where a movement's cause leads, or
when a running balance can be trusted.

### LG-01 · A movement names its change, its cause and its place

Level: SHOULD
Applies to: a row of a ledger — a stock movement, a posting, an entry of an audit trail
Rule: The row states the signed change at the unit's own precision, what caused it as words that lead to that record, where and when it happened and who did it; a cause without a screen leads to the ledger narrowed to what that cause moved, and no identifier is shown raw.
Why: A ledger is read to answer "why did this change", and a row that shows an id or no way to the cause answers only "that it changed".
Do: Write the change with its sign, and give the tone as a second signal beside the sign. Keep a word for every cause type the backend writes and a word for an unknown one, and link a cause to its record or to the ledger filtered by the cause's id. Open one movement over the ledger it belongs to, so the list stays under it and the address names it.
Don't: Print a cause type as the backend spells it, a correlation id or an entity id as the cause, or link a cause to a screen that does not exist.
Seen in: Nexora · Movements, the adjustment and return causes printed raw on the SKU record · corrected
Verified in: the inventory module suite, "names every source the backend writes and never shows a raw type" and "leads a source to its record, or to what it moved where it has no screen"
Check: Read the cause of a row of each cause type: it is words, it leads to the record that caused the movement or to the ledger narrowed to what that cause moved, and no row shows an identifier.

### LG-02 · A running balance is drawn where one position is read

Level: SHOULD
Applies to: a ledger table that shows the quantity each movement left
Rule: The balance after each movement is drawn only where the ledger is narrowed to one item in one place, and it is walked back from that position's current quantity.
Why: A balance over many items or places is a sum of unrelated quantities, and a balance computed forward from the first page misses every movement before it.
Do: Take the current quantity from the position the page already reads, subtract each newer change in turn, and say under the table how the balance was derived.
Don't: Add a balance column to the whole ledger, or compute it forward from the oldest row on screen.
Seen in: Nexora · the stock of one SKU, its warehouse's movements · corrected
Verified in: the inventory module suite, "writes the movement into the ledger and finds it there"
Check: Record a movement on one item in one place: the first row's balance equals the position's new quantity, and the unfiltered ledger shows no balance column.
