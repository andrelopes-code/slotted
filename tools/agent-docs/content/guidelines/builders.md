---
topic: builders
prefix: BD
triggers:
  [
    builder,
    rule,
    rule builder,
    condition,
    condition tree,
    nested group,
    workflow,
    automation,
    designer,
    definition,
    and,
    or,
    drag,
    reorder,
    move,
    limit,
    depth,
    flow,
    trace,
    run history,
  ]
families: [segmented-control, select, multi-select, menu, inline-message, typography]
---

# Builders

How a screen lets a person write a rule the system runs later — a trigger, a
tree of conditions, the actions — and how that rule is read by someone who
cannot change it. The library gives `filter-bar` a builder for a filter
applied to a list, `menu` a place for a node's commands and the field families
an operand; it does not say how a stored rule reads aloud, where a limit the
backend enforces is said, or how a tree narrows to a phone.

### BD-01 · A definition reads as a rule before a form

Level: SHOULD
Applies to: a stored rule — a workflow's trigger, conditions and actions — on its record
Rule: The record shows the rule as it reads — When, If, Then, Otherwise — every later line of the condition tree led by its join in words and every nested group opened by its own ("any of:", "all of:"); the editor opens from that reading in the section it is read in; a reader without the permission to edit reads the rule and is not shown an editor.
Why: A rule shown only as a form makes a reader who cannot edit it decode disabled controls, and makes one who can open an editor to learn what the rule does.
Do: Set the trigger beside "When", the conditions the way a query is set — the join in a column of its own at the start of each later line, a group's children stepped in one step under the line that opens it, a guide down every level — and the actions numbered under "Then". The editor is a query parameter of the record (FM-12) and stands in the same section (FM-07).
Don't: Draw the editor in a read-only state for a reader, or join the conditions by color, a border or indentation alone.
Seen in: Nexora · the workflow record · corrected
Verified in: the Automation routes suite, "reads the nested tree as a rule, every later line led by its join" and "lets an executive and an auditor read a workflow with no editor, and names who writes them"
Check: Open a stored rule as a reader who may edit it and as one who may not: both read When, If, Then, Otherwise with every later line led by its join in words, and only the first is offered the editor.

### BD-02 · A structural limit is said before it is reached

Level: SHOULD
Applies to: a builder whose backend limits the tree — conditions per rule, levels of nesting
Rule: Under the tree the builder states what it holds and what remains of each limit, and a control that would cross a limit is disabled with the limit as its stated reason.
Why: A limit met only as a refusal after the save is a tree written past what the backend accepts, and a control that silently does nothing at the limit reads as a broken control.
Do: Write one line under the root: the conditions and levels used of their maxima, and how many more of each can be added. At a limit, the add control in the group's foot is disabled and the same item in the group's `menu` carries the limit in its `description`.
Don't: Let the add control stay live at the limit and answer with the backend's refusal.
Seen in: Nexora · the Rule Builder · corrected
Verified in: the automation module suite, "says each level's join in words, and what remains before the limits"
Check: Fill a tree to one of its limits: the line under the tree says nothing remains of it, and each control that would cross it is disabled with the limit as its reason.

### BD-03 · A refusal that names no node is marked at the node before the request

Level: MUST
Applies to: a tree the backend validates and refuses under one field, with no path to the node
Rule: The builder runs the backend's own check on every change and, once a save is tried, marks each node it would refuse with its message before any request is sent; a group with nothing in it is marked from the moment it is empty.
Why: After the request the screen knows only that the conditions were refused, not which of fifty; before it, the same check knows the node.
Do: Run the backend's validation code in the browser rather than writing a second one, key its issues by the node's path, outline the node and put the message under it, and keep the form's summary for the same messages (FM-03).
Don't: Send the tree and translate the backend's list of messages back onto nodes, or mark every node as invalid while the reader is still writing.
Seen in: Nexora · New workflow, an empty group saved · corrected
Verified in: the automation module suite, "marks an empty group, a sixth level and a fifty-first condition at their node, before any request"; tools/journey-g.mjs, "a save with an empty group is refused in the browser"
Check: Save a tree that holds an empty group and a node past a limit: each is marked at its node with its message, and the network log holds no request.

### BD-04 · The keyboard and the pointer make the same moves

Level: SHOULD
Applies to: moving the nodes of a tree — up, down, into the group above, out of the group
Rule: Every node's menu carries its moves and its removal, the grip's drag makes the same moves, and both refuse the same places — a group into itself, a level past the limit — with the reason said.
Why: A drag with no menu shuts out the keyboard and a phone's scrolling finger, and two code paths with two sets of boundaries let one of them build a tree the other refuses.
Do: Compute every move from one function over the tree and its limits; disable a menu move that would be refused, with the reason as the item's `description`; outline the place a drag is over when it is refused and announce the reason politely; keep the focus on the moved node's menu after a keyboard move.
Don't: Offer dragging alone, or let the drop answer with a backend refusal.
Seen in: Nexora · the Rule Builder · corrected
Verified in: the automation module suite, "moves a condition from its menu and keeps the focus on it" and "drags a condition by its grip into a group, and refuses a group dropped into itself"
Check: Move one node with the keyboard from its menu and the same node by its grip: both reach the same places, both refuse a group dropped into itself with the reason said, and after the keyboard move the focus is on the node's menu.

### BD-05 · A tree narrows by stepping in, never by scrolling

Level: SHOULD
Applies to: a nested builder below the width its rows' three controls need, at 570 pixels and on a phone
Rule: Each level steps in by one space step behind a rule, and below the width a condition's field, operator and value fit on one line the field takes its own line and the operator and the value share the next; the tree never scrolls sideways.
Why: A tree five levels deep that indents by a column, or keeps three controls on one line, is wider than a phone, and a builder that scrolls sideways hides the join of the level the reader is in.
Do: Make the builder a container and switch the row's grid on its own width (OE-09), keep the grip and the node's menu at the row's two ends with the words between them wrapping, and leave the operator's popup to the family, which keeps it inside the viewport.
Don't: Indent by more than one space step per level, or give the tree a horizontal scroller.
Seen in: Nexora · the Rule Builder at 570, 390 and 360 pixels · corrected
Verified in: tools/look.mjs on a workflow's editor at 570, 390 and 360 pixels; tools/journey-g.mjs at 390×844 and 360×780
Check: At 390 and 360 pixels open a tree five levels deep: nothing scrolls sideways, each level steps in by one space step, and a condition's field stands on its own line.

### BD-06 · A rule's record shows what flowed through it, and the rule carries its own figures

Level: SHOULD
Applies to: a stored rule's record, its run history and its editor — a trigger, a decision over a condition tree, the actions in order
Rule: The record opens on how the rule runs — every event of a stated period split where the conditions decide, the events let through split again by how their run ended, each band as thick as the events in it, the three totals over its columns — and then the rule itself, with each step's own figure at the end of its line. A run opens on the same rule as its trace, the rail lit as far as the run went; the editor, where the container has room, sets the draft the same way beside the form.
Why: Read as text, the rule says what it does and not how often; read as rows, the history says what happened and not where in the rule. The split by volume answers the first question a reader of a rule brings — how much of what arrives does it act on — in one look, and the figure at the end of each line answers where.
Do: Draw the split as an element of the screen's own (OE-01) from the measured width, with the figures in words over it. Set the rule as a sheet of four lines — When, If, Then, Otherwise — down a rail, the figures in an end column aligned across the lines, and no card, tile or badge around a step. Narrow, stand each label over its step and the end column under it.
Don't: Build the flow from stat cards, tiles and tags; give a figure only by a band's thickness or a tone; keep a second rendering of the rule for the trace and the preview.
Seen in: Nexora · the workflow record, its history and its editor · corrected
Verified in: the Automation routes suite, "draws what the workflow did in fourteen days on its map, and a day of the strip opens the history on it" and "opens a run action by action, its record at the record's own address"; tools/look.mjs on the record at 1280, 570, 390 and 360 pixels
Check: Open a rule's record: the split of its period's events comes before the rule with its totals in words, each line of the rule ends in its own figure, a run opens on the same rule lit as far as it went, and at 390 pixels nothing scrolls sideways.
