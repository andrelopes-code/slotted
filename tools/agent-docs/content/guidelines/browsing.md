---
topic: browsing
prefix: BR
triggers:
  [
    tree,
    category,
    categories,
    hierarchy,
    branch,
    leaf,
    taxonomy,
    browse,
    facet,
    drill,
    place,
    scope,
    breadcrumb,
    count,
    grain,
    catalogue,
  ]
families: [tree, breadcrumb, page-header, filter-bar, data-grid]
---

# Browsing

How a reader moves through a set that is arranged rather than listed: a tree
of categories over a list of records, and one concept a backend answers for at
two grains. The library gives `tree` a hierarchy with a keyboard and a query,
`breadcrumb` a trail and `filter-bar` a tree of conditions; it does not say
whether a branch is a filter or a place, which of a node's two counts a row
draws, or how a list that reads products and a list that reads stock lead to
each other.

### BR-01 · A branch is the list's place, not one of its pills

Level: SHOULD
Applies to: a list reached by choosing a node in a `tree`, and the `filter-bar` above that list
Rule: The branch a reader chose is the list's heading and its `breadcrumb`; the filter bar keeps the facets and holds no pill for it.
Why: A place is where the reader is and a facet is what they asked for; a branch drawn as a pill reads as one condition among many, and the way back out of it becomes a chip to delete rather than a trail to walk.
Do: Name the list after the branch, put the trail from the catalogue's root in the header's breadcrumb with every ancestor a link, and narrow the query from the place rather than from the bar. The way out is the trail's first crumb, which names the whole set.
Don't: Write the branch into the bar's tree, or leave the list titled after the resource while its rows come from one branch.
Seen in: Nexora · Products opened from the category tree · corrected
Verified in: the catalogue list screens suite, "a place names the list and the bar keeps only the facets".
Check: Open a branch from the tree: the heading is the branch's name, the trail stands above it, and the bar's pill count is unchanged.

### BR-02 · A place holds what is under it, and says how much of it there is

Level: MUST
Applies to: a list narrowed to a branch of a hierarchy
Rule: The query covers the branch and every node beneath it, and the page states how many nodes that is beside how many records they hold.
Why: A backend that files a record on a leaf answers nothing for the branch above it; a list that asked for the branch alone would tell a reader a whole department is empty, and a list that asks for the subtree without saying so leaves a count nobody can reconcile with the tree.
Do: Read the hierarchy before the rows, send the branch and its descendants as one condition, and write the sentence under the title: how many records the place holds, how many nodes it covers, and how many the whole set holds.
Don't: Narrow to the chosen node alone, or state a count without saying what it is counted over.
Seen in: Nexora · Products in a category · corrected
Verified in: the catalogue listings suite, "a place holds what is under it, not only what is filed on it".
Check: Open a branch whose own records are none: the list is not empty and the sentence names the nodes it covers.

### BR-03 · A node's own count and its branch's count are two numbers

Level: MUST
Applies to: a count drawn on a `tree` node
Rule: The number on a row is one of the two and the screen says which; where a node holds records of its own and has nodes under it, the second number is said apart from the first.
Why: The two answer different questions — how big this branch is, and how much is filed at this level — and a tree that prints one of them without saying which is read as the other.
Do: Put the branch's whole count in the row's trailing cell, the one the family keeps at its intrinsic width, and say in the region's own words what that number counts. Where a node also holds records directly, say how many on the row's second line, which the family already draws in the muted step.
Don't: Draw the backend's own field without adding the descendants, or print two bare numbers on one row.
Seen in: Nexora · Categories · corrected
Verified in: the categories store suite, "separates what a category holds itself from what its branch holds".
Check: A branch whose records are all on its leaves shows the leaves' total, not nought.

### BR-04 · One concept at two grains is two lists that name each other

Level: SHOULD
Applies to: a resource the backend answers for at two grains — a family header and the item that is counted, ordered and priced
Rule: Each grain is its own route with its own columns and its own filters, and each page names the other above its rows.
Why: The two grains are asked different questions and filtered by different fields; one bar cannot hold both sets of conditions, and a reader looking for what is below its reorder point is not looking for a family header.
Do: Give each list the filters its own resource offers, say in one sentence what the grain is and what the other one is for, and carry the reader's place from one to the other so a branch survives the move.
Don't: Put a view switch over one filter bar whose fields belong to one of the two, or leave the second grain reachable only through a record of the first.
Seen in: Nexora · Products and SKUs · corrected
Check: The two routes are in the navigation, each header links to the other, and a place chosen on one is still the place on the other.
