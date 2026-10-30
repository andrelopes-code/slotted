---
topic: procurement costs
prefix: PC
triggers: [cost, price, supplier, purchase order, receipt, spend]
families: [data-grid, stat-card, table]
---

# Procurement costs

What a procurement screen reads under the cost permission. The rules for any
value a permission withholds ship in the library's `reading-permissions.md`
(PM-01, PM-02).

PC-01 replaces the library's PM-03, retired there as a rule of this domain.

### PC-01 · A price paid is a cost

Level: MUST
Applies to: every value that states what is paid to a supplier — a purchase order's unit costs, line totals and total, a supplier's price list and its spend, a goods receipt's unit cost
Rule: A price paid to a supplier is read under the cost permission on every screen that draws it, and PM-01 and PM-02 apply to it as to a standard cost.
Why: The catalogue already withholds a supplier's unit cost from a reader without the cost permission, and the same number on an order or a receipt would hand back what the catalogue withheld.
Do: Decide the money columns, figures and summary rows of a procurement screen from the cost permission, never from the answer; state once, with the roles, who sees them. A preview that needs the cost — the approval an order will ask for — states its rule in words for a reader without it (FM-11).
Don't: Treat the purchase-order permission as a license to read its money, or draw an order's total because the list answer carries it.
Seen in: Nexora · purchase orders, suppliers and goods receipts read by a warehouse operator · corrected, and the backend writes the money down to nought for that reader (ledger row "the money of an order")
Check: Spec: the procurement module suite, "leaves the spend and the totals out of the models without cost.view" and "never reads the totals GET /purchase-orders hands a warehouse operator".
