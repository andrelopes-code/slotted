---
name: loading-states
description: Use when building or reviewing anything a person waits in front of — a skeleton, a spinner, a progress bar, a loading overlay, a control's own loading state, or the empty and error states beside them — in a demo under demos/, in a consumer application, or in a family under packages/. Decides which indicator answers which wait and how a skeleton is built from the anatomy it stands in for. Triggers on "skeleton", "loading", "still loading", "loading state", "placeholder", "shimmer", "spinner", "screen flickers", "layout shift", a screenshot of a half-loaded screen.
---

# Loading states

A loading state is a screen the reader sees, not a gap in one. It is built from the
anatomy it stands in for, and it is finished when the loaded screen and the loading
screen occupy the same boxes.

The failure this skill exists to stop: three grey bars of equal length where a table,
a card and a list all should have been. That output passes every test in the
repository, and it is wrong.

## 1. Which indicator answers which wait

Answer in order and stop at the first that decides.

| The wait                                                                                    | The indicator               |
| ------------------------------------------------------------------------------------------- | --------------------------- |
| Structure is known before the data arrives — a list, a table, a card, a form                | `skeleton`                  |
| A control started the work and the control stays on screen — a button, a field, a menu item | that family's own `loading` |
| A region already painted is being replaced and must not be touched meanwhile                | `loading-overlay`           |
| The work reports how much is done                                                           | `progress-indicator`        |
| Nothing above: duration unknown, structure unknown, area small                              | `spinner`                   |

Two indicators never answer the same wait in the same region. A spinner inside a
skeleton, a skeleton under an overlay, and a progress bar over a button that is
already `loading` are each one indicator too many.

Refreshing data that is already on screen is not a loading state: the region keeps
the values it has, takes `aria-busy`, and swaps when the new ones arrive. Replacing
read content with a skeleton on every refresh is how a screen flickers.

## 2. The skeleton is the anatomy, not a rectangle

A skeleton is the same layout as the content, drawn in one color. Build it from the
loaded markup:

1. Keep the container, the parts, the grid, the inset and the gap tokens the loaded
   content uses. Copy the structure; replace only what carries data.
2. Text becomes `skeleton` text lines at the same type size, so the reserved height is
   the height the text will take.
3. Media — avatar, thumbnail, chart — becomes a shape of its own measured box.
4. Repetition becomes the real count: a list reserves the rows its first page returns,
   a table reserves its columns at their real widths, a card reserves the avatar and
   the two lines that card holds.
5. Stop where the reader stops. A row's badge, a trailing icon and a caption belong to
   the loaded row, not to its skeleton; a skeleton that draws every glyph reads as a
   second interface.

Line lengths vary the way text varies — the last line of a paragraph is short, a name
is shorter than a description. A stack of bars of equal length is the defect this
section names.

### What never gets a skeleton

Chrome that is already painted renders with its real content: the application bar, the
navigation column, the page header's title, a toolbar, a tab strip, a section heading.
Only what is being fetched is reserved. An action nobody can press yet is absent, not
skeletonised — a button outline that cannot be clicked is a control that lies.

## 3. The test: nothing moves

The loading state and the loaded state occupy the same boxes. Capture both at the same
width, in the same scheme, and compare: any box that moves between them is a defect,
and the reader experiences it as the page jumping under the pointer.

Where the two cannot match exactly — an unknown number of rows, a description of
unknown length — reserve the smaller of the two and let the content grow downward,
never a box that shrinks.

## 4. Timing

Two numbers, both on the family:

- `delay` — how long the work may take before the indicator appears. Below it nothing
  is drawn, so a response that arrives in 80 ms never flashes a skeleton. 200 ms.
- `minDuration` — how long the indicator stays once drawn, so it does not appear and
  vanish within one frame. 400 ms.

An application states them once, where it states its other defaults. A screen that
sets neither flickers on a fast connection and looks broken on a slow one.

## 5. Announcement and focus

- The skeleton itself is out of the accessibility tree. It describes nothing; the
  region says what is happening.
- One announcement per region, `polite`, once — not one per skeleton part.
- The region carries `aria-busy` while it waits and drops it when content arrives.
- Focus does not move, on entry or on arrival. Content that lands under the reader's
  focus does not steal it, and a skeleton never holds a tab stop.

## 6. Motion

One shimmer per region, from the family's own animation, not one per bar: parallel
animations on twenty rows read as noise and cost twenty compositor layers. Under
`prefers-reduced-motion: reduce` the animation stops and the reserved shape stays.

## 7. Loading, empty and error are three states

| State      | What it says                   | What it offers                                |
| ---------- | ------------------------------ | --------------------------------------------- |
| Loading    | the answer is coming           | nothing to press                              |
| Empty      | there is nothing to show       | the action that creates the first one         |
| No results | the filter excluded everything | clearing the filter                           |
| Error      | the answer did not arrive      | retry, and the data that is still valid stays |

A region that finishes loading with nothing to show renders the empty state, never an
empty skeleton and never a blank box. An error replaces the indicator; it never leaves
a skeleton animating behind a message.

## 8. Before calling a loading state done

- [ ] The indicator matches the wait, by the table in section 1, and there is only one.
- [ ] The skeleton mirrors the anatomy: same parts, same grid, same tokens, real counts.
- [ ] Loaded and loading captured at the same width: no box moves.
- [ ] Line lengths vary; no stack of equal bars.
- [ ] Chrome that already exists is painted with its real content.
- [ ] `delay` and `minDuration` are set; a fast response draws nothing.
- [ ] One polite announcement per region, `aria-busy` on the region, focus untouched.
- [ ] Reduced motion stops the animation and keeps the shape.
- [ ] Empty, no-results and error are distinct states, each with its own next step.
- [ ] Read in light and dark: the skeleton is a plane below the content, not above it.
