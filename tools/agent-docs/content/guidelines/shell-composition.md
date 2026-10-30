---
topic: shell composition
prefix: SC
triggers:
  [
    app-shell,
    shell,
    banner,
    header bar,
    top-navigation,
    search,
    command palette,
    magnifier,
    mobile,
    narrow,
    overlay,
    drawer,
    dialog,
    layer,
    host,
    popover,
    notification-center,
    brand,
  ]
families: [app-shell, top-navigation, command-palette, popover, drawer, dialog, notification-center]
---

# Shell composition

How the application frame is put together from `app-shell`, the bar inside its
banner and the layers the bar opens. Each family states its own anatomy; the
seams between them — what stands in the search slot, what a component host
costs in a flex row, how wide a panel is when its content has no width — are
the consumer's to get right.

### SC-01 · A palette trigger is not a search field

Level: MUST
Applies to: `top-navigation`'s `search` region when what stands in it opens a `command-palette` rather than filtering in place
Rule: Below the bar's medium step, the magnifier opens the palette directly; the search region is never expanded over the bar.
Why: The bar's fold is written for a text field — open the region, move focus to its input. A region holding a trigger button costs the reader a second press and shows a button beside a close control, aligned with nothing.
Do: Answer the bar's request to open the search by cancelling it and opening the palette. Above the step the region shows the trigger as it always did.
Don't: Let the region open, or hide the magnifier and leave a narrow bar with no way to the palette.
Seen in: Nexora · banner at phone width · ledger row "search-toggle opens the region and moves focus to its first input"
Verified in: the banner suite, "opens the command palette from the magnifier"
Check: At a width under the medium step, one press on the magnifier shows the palette and the bar does not carry the open-search state.

### SC-02 · Layer hosts leave the banner's row

Level: MUST
Applies to: a consumer component placed inside `app-shell`'s `banner` whose only output is a layer — a palette, a drawer, a dialog
Rule: A component host inside the banner that draws no box of its own contributes no box to the banner's row.
Why: The banner is a flex row with a gap; an empty host is still a flex item and costs one gap, which is air on one end of the bar and not the other.
Do: Give such a host no box — the library's own layer hosts have none — or place the component outside the banner.
Don't: Leave a consumer host in the row because its content is portalled anyway.
Seen in: Nexora · banner, two of the row's gaps more air at the end than at the start · ledger row "a consumer component's host in it is an empty box"
Verified in: the banner suite, "leaves nothing but the bar in the banner row"
Check: The bar's first and last controls stand the same distance from the frame's two edges.

### SC-03 · A panel around a query container states its measure

Level: SHOULD
Applies to: a `popover` whose content is a family that is a container query — `notification-center`, any consumer region with inline-size containment
Rule: The consumer states the content's inline size, and its block cap, on the content; the popover's measure alone does not size it.
Why: A query container contributes no intrinsic width, so a panel sized to its content settles at the family's floor whatever the popover's measure says, and a panel with no cap runs to the bottom of the viewport.
Do: Size the content to the popover's measure less the layer's own gap, bounded by the viewport on a phone, and cap its block size so the family's scrolling part scrolls.
Don't: Retune the popover's measure and expect a query container to grow into it.
Seen in: Nexora · notifications panel under the bell · ledger row "notification-center is a query container and contributes no width"
Check: The panel is as wide as the popover's measure allows and no taller than the stated cap; the feed scrolls inside it.

### SC-04 · The search slot stands one space step off the brand

Level: SHOULD
Applies to: `top-navigation`'s `search` region when nothing — no context, no destinations — stands between it and `brand`
Rule: The search region carries one space step of leading margin beyond the bar's own gap.
Why: The bar's gap is the air between the mark and the wordmark; a bordered field at that distance reads as a third part of the brand.
Do: Add one space step at the region's start. When the region takes the whole bar below the medium step it has its own inset and the margin does not apply.
Don't: Widen the bar's gap, which also moves the actions apart.
Seen in: Nexora · banner · ledger row "search follows brand at the root's own gap"
Check: The field's left edge stands one space step further from the wordmark than the wordmark stands from the mark.

### SC-05 · A phone's bar holds five controls

Level: SHOULD
Applies to: what a consumer places in `top-navigation`'s `actions` — `action` controls of the product's own, beside the family's bell, help and account
Rule: Below the bar's high step the actions hold the search toggle, the bell, the help and the account; a product's own `action` leaves the bar and stays reachable from the navigation column or the palette.
Why: On a touch screen every control is a 44-pixel target; nine of them with the mark and the shell's toggle are wider than a phone, and the family folds none of a consumer's actions.
Do: Hide the product's own actions under the bar's own container query at the high step, and keep each one a destination in the column or a command in the palette.
Don't: Keep every action in the bar and let the cluster overflow, or shrink the controls under the touch target.
Seen in: Nexora · banner on a phone, approvals and tasks over the mark · ledger row "brand shrank under its own marks"
Check: At 390px with a coarse pointer, the bar's first and last controls are whole and no control overlaps another.

### SC-06 · No key legends where there are no keys

Level: SHOULD
Applies to: a `kbd` or `shortcut` drawn as a hint beside a control — the search trigger's hotkey, a menu item's shortcut, a footer of hints
Rule: Where the primary input is a touch screen — `(hover: none) and (pointer: coarse)` — a shortcut drawn as a hint is not shown.
Why: The legend names a key the reader has no way to press; on a phone it is noise beside the control it decorates.
Do: Hide the hint under the media query. Keep a `kbd` that is content — a settings page listing the application's shortcuts — because it documents rather than hints.
Don't: Hide the control the hint stands beside, or key the rule on width: a narrow window on a laptop still has a keyboard.
Seen in: Nexora · the search trigger's Ctrl+K on a phone; the palette's footer, which the family now hides itself · corrected
Check: On a touch screen the search trigger shows the magnifier and the words alone, and the palette's footer is absent.
