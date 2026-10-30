---
name: waiting-states
description: Use when building or reviewing anything a person waits in front of in an application built with {{package}} — placeholders, a control's own loading state, a loading overlay, a progress indicator, or the empty and error states beside them. Decides which indicator answers which wait and how placeholders are built from the anatomy they stand in for.
---

# Waiting states

A waiting state is a screen the reader sees, not a gap in one. It is built from
the anatomy it stands in for, and it is finished when the loaded screen and the
pending screen occupy the same boxes.

The failure this skill prevents: three grey bars of equal length where a table,
a card and a list should have been.

Rules cited here are in `{{docsDir}}/guidelines/async-feedback.md`. Each family
named here has its page: `{{docsDir}}/<family>.md`.

## 1. Which indicator answers which wait

Answer in order and stop at the first row that decides.

| The wait                                                                                                         | The indicator                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Structure is known before the data arrives — a list, a table, a card, a form                                     | `skeleton` placeholders                                                                                               |
| Data already on screen is read again for the whole page — a Refresh, a refetch after a write, a refetch on focus | the `page-header` progress part in the page header; the region keeps its items and no control draws its own indicator |
| A control started the request and stays on screen — a button, a field, a menu item                               | that family's own `loading` state                                                                                     |
| A region already painted is being replaced and must not be touched meanwhile                                     | `loading-overlay`                                                                                                     |
| The work reports how much is done                                                                                | `progress-indicator` with a value                                                                                     |
| Nothing above: duration unknown, structure unknown, area small                                                   | `progress-indicator` in its `indeterminate` state                                                                     |

Two indicators never answer the same wait in the same region. Placeholders
under an overlay, an indeterminate indicator inside placeholders, and a
progress indicator over a control that already waits are each one indicator
too many.

A region that already shows items is busy, not pending: it keeps its items,
carries `aria-busy`, and swaps them when the newer answer arrives (AF-02,
AF-07). Replacing read content with placeholders on every refresh is how a
screen flickers. A change of view or page is different: the rows on screen are
removed and placeholders stand in their place (AF-04).

A control that starts a request waits on it: it is in its `loading` state from
activation until the answer, refuses a second activation and shows the
family's indicator (AF-03).

## 2. Placeholders are the anatomy, not rectangles

Placeholders are the same layout as the content, drawn in one color. Build
them from the loaded markup:

1. Keep the container, the parts, the grid, the inset and the gap tokens the
   loaded content uses. Copy the structure; replace only what carries data.
2. Text becomes `skeleton` text lines at the same type size, so the reserved
   height is the height the text will take.
3. Media — avatar, thumbnail, chart — becomes a shape of its own measured box.
4. Repetition takes the real count: a list reserves the rows its first page
   returns, a table reserves its columns at their real widths, a card reserves
   the avatar and the two lines that card holds.
5. Stop where the reader stops. A row's badge, a trailing icon and a caption
   belong to the loaded row, not to its placeholder.

Line lengths vary the way text varies: the last line of a paragraph is short,
a name is shorter than a description. A stack of bars of equal length is the
defect this section names.

### What never gets placeholders

Chrome that is already painted renders with its real content: the application
bar, the navigation column, the page header's title, a toolbar, a tab strip, a
section heading. Only what is being fetched is reserved. An action nobody can
press yet is absent, not drawn as a placeholder.

## 3. The test: nothing moves

The pending state and the loaded state occupy the same boxes. Capture both at
the same width, in the same scheme, and compare their bounding boxes: any box
that moves between them is a defect.

Where the two cannot match exactly — an unknown number of rows, a description
of unknown length — reserve the smaller of the two and let the content grow
downward, never a box that shrinks.

## 4. Timing

- A region's placeholders appear at once; they are never delayed (AF-05).
- A control's indicator may wait for the family's `loadingDelay`, so a request
  that answers first shows no indicator; the control still refuses a second
  activation (AF-05).
- Once painted, placeholders stay for one minimum duration the application
  states once for the whole product — the `minDuration` of `skeleton` and
  `loading-overlay` — even when the answer has already arrived (AF-06).

## 5. Announcement and focus

- Placeholders are out of the accessibility tree. They describe nothing; the
  region says what is happening.
- One announcement per region, `polite`, once — not one per placeholder.
  `skeleton` and `loading-overlay` announce through their `live` axis, `polite`
  by default: keep it on the one that stands for the region and set it to `off`
  on every other placeholder in that region.
- The region carries `aria-busy` while it waits and drops it when the answer
  arrives.
- Focus does not move, on entry or on arrival. Content that lands under the
  reader's focus does not take it, and a placeholder never holds a tab stop.

## 6. Motion

One shimmer per region, from the family's own animation, not one per bar.
Under `prefers-reduced-motion: reduce` the animation stops and the reserved
shape stays.

## 7. Pending, empty and error are three states

| State      | What it says                              | What it offers                            |
| ---------- | ----------------------------------------- | ----------------------------------------- |
| Pending    | the answer is coming                      | nothing to press                          |
| Empty      | an answer arrived and it holds zero items | the action that creates the first one     |
| No results | the filter excluded everything            | clearing the filter                       |
| Error      | the answer did not arrive                 | retry; the data that is still valid stays |

The empty state appears only after an answer holding zero items, never while
the first answer is pending (AF-01). Empty, no results and error are drawn by
`result-state`. An error replaces the indicator; it never leaves placeholders
animating behind a message.

## 8. Before calling a wait done

- [ ] The indicator matches the wait, by the table in section 1, and there is
      only one.
- [ ] Placeholders mirror the anatomy: same parts, same grid, same tokens, real
      counts.
- [ ] Loaded and pending captured at the same width: no box moves.
- [ ] Line lengths vary; no stack of equal bars.
- [ ] Chrome that already exists is painted with its real content.
- [ ] Placeholders are not delayed; the minimum duration is stated once.
- [ ] One polite announcement per region, `aria-busy` on the region, focus
      untouched.
- [ ] Reduced motion stops the animation and keeps the shape.
- [ ] Empty, no results and error are distinct states, each with its next step.
- [ ] For each control that writes, the regions on any screen whose figures
      the write changes are listed, and each is shown read again after the
      write (AF-08).
- [ ] Each `Check` of AF-01 to AF-08 passes.
