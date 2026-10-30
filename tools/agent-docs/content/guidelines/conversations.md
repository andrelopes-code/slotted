---
topic: conversations
prefix: CV
triggers:
  [
    conversation,
    thread,
    message,
    reply,
    composer,
    internal note,
    ticket,
    inbox,
    sla,
    clock,
    business hours,
    queue,
  ]
families: [message, message-scroller, prompt-composer, filter-bar, tabs, page-header]
---

# Conversations

How a record that is a conversation with a clock is read and answered: a
support ticket, and anything else whose body is messages. The library gives
`message` a thread row, `message-scroller` a log that follows new rows and
`prompt-composer` a field that sends; it does not say where the composer
stands when the thread is long, how a service-level clock is said, or how an
inbox's queues and its filters stay one thing.

### CV-01 · The composer stays in reach of a scrolled conversation

Level: MUST
Applies to: a record whose body is a conversation the reader answers
Rule: From 600 pixels the conversation fills its region and scrolls on its own with the composer under it, and the record's context scrolls on its own beside it or behind a tab of the header; below 600 pixels the page scrolls, the composer is stuck to the bottom of the screen, and the record opens on its last message.
Why: A thread of 120 messages scrolled with the page put the composer 120 messages away from the line it answers, and a context that scrolled with the thread left the customer and the clocks behind.
Do: Give the thread a `message-scroller` that opens at its `end`, keep the composer in the row under it, and draw the context as its own scrolling column; on a phone, make the composer's row sticky on the page's ground.
Don't: Put the composer at the end of the page's flow, or let the context scroll away with the thread.
Seen in: Nexora · the support ticket, in the inbox and on its own address · corrected
Verified in: tools/journey-d.mjs at 390×844 and 360×780; tools/look.mjs at 1280 and 1600 pixels on the flagship ticket
Check: Open a conversation of more than one screen of messages at 1280 and at 390 pixels: it opens on its last message, and the composer is on screen without a scroll at both widths.

### CV-02 · A service-level clock is said in business time, with the hour it falls due

Level: SHOULD
Applies to: a clock counted in business hours — a first response, a resolution
Rule: A running clock says the business time left and the hour it falls due in the organization's zone, a passed one by how much and when it was due, a paused one that it is stopped and why; a queue's row says the span alone, and no clock is ever said in raw minutes.
Why: "1 h 20 min left" read at 19:00 is tomorrow morning: the span alone hides that the time outside business hours does not count, and the hour alone hides how much work time is left.
Do: Take the remaining minutes from the backend, say them in minutes, hours and business days of the organization's own length, and add the due hour; state the policy once beside the clocks, with the business hours.
Don't: Recompute a clock in the client, or let a colour alone say that a clock is at risk or passed.
Seen in: Nexora · the ticket's service-level section and the inbox's rows · corrected
Verified in: the support suite, "says a running clock with its due hour, a breached one by how much, and a paused one as stopped"
Check: Read a running, a passed and a paused clock: the first names its due hour, the second how much it passed by, the third that it is stopped and why; none is a count of minutes above 59.

### CV-03 · A queue is a view of the bar, never a second filter

Level: SHOULD
Applies to: a list worked as named queues — mine, unassigned, at risk, escalated
Rule: Each queue is a view of the list's `filter-bar`, a tree of the bar's own fields, labelled with the count of the rows it opens on; choosing it writes its pills, and editing a pill leaves a view the bar marks as changed.
Why: A queue picker beside the bar's pills is two answers to "what am I looking at", and they disagree the moment the reader edits a pill.
Do: Hand the queues to the bar as its `preset` views, count each with the list's own total for its tree, and let a door open a queue by naming it in the address.
Don't: Keep the chosen queue in a state of its own, or count a queue with a figure the list does not reproduce.
Seen in: Nexora · the support inbox's queues · corrected
Verified in: the support suite, "counts each queue as the rows it opens on, and the navigation draws the reader's own"
Check: Choose each queue: the bar shows its pills and the list's total equals the queue's count; remove one pill: the bar marks the view as changed.
