# VirtualList Design

## Outcome

A list of arbitrary length that keeps only the rows near the viewport in the
DOM, and still reports its real length to assistive technology.

It is the first caller of `@slotted/core/collection`, and the last component in
T2 that raises architectural questions. Four of them would otherwise be
rediscovered by whoever writes Listbox: whether rows are measured or uniform,
which element scrolls, what a screen reader is told about rows that are not
rendered, and why the component binds no keys at all.

## Uniform Item Size, Not Measured Heights

`itemSize` is a required number, in pixels, and every row is that tall.

Measured heights are a different component. They need a per-row size cache, a
`ResizeObserver` on every rendered row, a prefix-sum table to turn an index
into an offset without walking the cache, an estimate for rows never yet
rendered, and a scroll-anchoring policy for what happens to the reader's
position when a row above the viewport turns out to be taller than estimated.
The last of those is the hard part, and it is a product decision: anchoring to
the topmost visible row, to the scroll offset, or to a focused row all give
different and defensible behaviour.

Uniform rows need none of it. An index is an offset, an offset is an index, and
both directions are one multiplication. The arithmetic is exact rather than
converging, so the scroll position never drifts and there is no policy to pick.

`core/collection` is written against uniform rows for that reason, and its
signature stays provisional. When a measured variant is genuinely needed it
supplies an offset lookup where the module now multiplies; that is a change to
the module, not a second module, and it is deliberately not anticipated here.
A signature fixed around one imagined caller is worse than one fixed around a
real one.

## The Root Is the Scroll Container

The root element scrolls. The consumer gives it a block size; the component
gives it `overflow: auto` and reads `scrollTop` and `clientHeight` from it.
`overflow` rather than the logical `overflow-block`, because the axis-neutral
form needs no right-to-left counterpart and leaves a row wider than the list
reachable instead of clipped.

The alternative is window scrolling, or scrolling on an ancestor the consumer
nominates. Both mean the component has to find an element it does not own,
observe it, and compute its own position within it — which changes on every
layout, not only on scroll. That is a second measurement problem in service of
a layout the consumer can express by putting the size on the root instead.

The root is not the only element. Inside it sits a canvas whose block size is
the full `itemCount × itemSize`, and rows are absolutely positioned within the
canvas at `index × itemSize`. The canvas is what gives the scrollbar its real
length; without it the scrollbar would describe the window, not the list.

| Element | `data-part` | Job                                            |
| ------- | ----------- | ---------------------------------------------- |
| Root    | `root`      | Scrolls, is measured, is focusable             |
| Canvas  | `canvas`    | Holds the full list's block size               |
| Row     | `item`      | Positioned at its index, carries set semantics |

Only the block axis is virtualized. A horizontal virtual list is the same
arithmetic on the other axis, but it doubles the positioning rules in the
stylesheet and needs its own answer for right-to-left. It is left out rather
than half-built.

## The Full Length Is Reported, and the Window Is Not Mentioned

The root is `role="list"`. Each rendered row is `role="listitem"` carrying
`aria-setsize` set to `itemCount` and `aria-posinset` set to `index + 1`.

This is what those two attributes exist for. Without them a screen reader
counts the elements it can see and announces "list, 14 items" for a list of ten
thousand, which is not a degraded experience but a false one. With them the
list reports its real size and each row reports where it sits in it, and the
fact that the other rows are absent from the DOM is never surfaced.

The canvas between the root and the rows is `role="none"`, so the rows are
owned by the list directly. `role="list"` requires `listitem` children, and an
intervening generic element breaks that ownership.

Nothing announces that the window moved. A live region on a scrolling list
would speak on every frame of a drag, and the platform already announces rows
as focus and the virtual cursor reach them.

## The Root Is Focusable, Which Is a Scrolling Requirement

The root carries `tabindex="0"`.

A scrollable region that holds no focusable element cannot be scrolled by a
keyboard-only reader — there is nothing to put focus on, so the arrow keys go
somewhere else. Making the scroll container itself focusable is the standard
remedy, and it is what automated checks look for.

It is unusual on a `list`, which is not a widget. It is correct here because
the element is two things at once: the list, and the region that scrolls it.
The alternative is a wrapper element that scrolls and a `list` inside it, which
puts a generic focusable div in the accessibility tree with no name and no role
and gains nothing.

## No Keyboard Handlers

VirtualList binds no keys.

A focused scroll container already answers Arrow keys, Page Up, Page Down,
Home and End by scrolling, in every browser, with the platform's own
acceleration and the reader's own preferences. Reimplementing that would
replace correct behaviour with an approximation of it.

A list is not a widget: it has no selection, no active descendant, and no
roving focus. Listbox is the component that adds those, and it will bring
`core/focus` with it. Keeping them out here is what leaves that seam clean.

## Measurement and SSR

The viewport size starts at nought and is measured after the first render.

That is what makes the component safe to render on a server: the first render
on the server and the first render on the client both compute their window from
a viewport of nought, so the markup matches and hydration is quiet. The measured
size arrives in an effect afterwards and widens the window.

A window computed from a viewport of nought is not empty. `overscan` — four
rows by default — is applied on both sides regardless of viewport size, so a
server renders the first four rows and a reader with no JavaScript sees the top
of the list rather than a blank box. That is a consequence of the arithmetic
rather than a special case in it, which is why `virtualWindow` has no branch
for it.

Resizes are observed with `ResizeObserver` where it exists, and the check is a
`typeof` guard rather than an assumption: the component must render under a
server and under jsdom, where it does not.

## `virtualWindow`

`@slotted/core/collection` exports one function, because the four numbers it
returns must agree with each other and returning them separately invites a
caller to compute three of them and take one.

```ts
virtualWindow({ itemCount, itemSize, overscan, scrollOffset, viewportSize }): {
  startIndex; // first row to render
  endIndex; // one past the last, so it slices
  startOffset; // where startIndex sits, in pixels
  totalSize; // the canvas's block size
};
```

`overscan` defaults to nought in the module and to four in the component. Core
owns the arithmetic and not the product decision, and a caller that wants no
buffer should not have to ask for zero.

The degenerate cases are answered rather than guarded against, because a list
whose count or size is nought is a list that is loading, not a caller error:

- `itemCount` or `itemSize` at nought or below yields an empty window and a
  total of nought.
- A scroll offset outside the list is clamped into it, which is what a
  rubber-band overscroll produces on every frame.
- A negative `overscan` is treated as nought.
- `endIndex` is never below `startIndex`, so the render slice is always valid.

## The Consumer Renders the Row; the Library Places It

Virtualization takes the decision of which rows exist away from the consumer —
that is the whole point of it — so the row cannot be an ordinary child. What
the consumer keeps is what the row contains.

React passes a function as `children`, called once per index in the window. The
returned element is expected to be a `VirtualListItem`, which reads `itemSize`
and `itemCount` from context and derives its own offset, `aria-posinset` and
`aria-setsize` from the one `index` it is given.

Angular exposes the window as a signal through `exportAs`, and the consumer
writes an ordinary `@for` over it with `slVirtualListItem` on the row.

```html
<div slVirtualList #list="slVirtualList" [itemCount]="10000" [itemSize]="40">
  @for (index of list.indices(); track index) {
  <div slVirtualListItem [index]="index">Row {{ index }}</div>
  }
</div>
```

The APIs differ and the model does not: in both, the library decides which
indices exist and where each one sits, and the consumer decides what a row
looks like. PRD §27 asks for conceptual parity, not identical signatures, and a
render prop in Angular or a template reference in React would each be a foreign
body in the other framework.

Deriving the row's position and set semantics inside the item, from its index,
is what stops a consumer getting them wrong. There is no arrangement in which a
row is placed at the wrong offset or claims the wrong position in the set,
because neither is something the consumer writes.
