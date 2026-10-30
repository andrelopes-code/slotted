---
name: build-own-element
description: Use when writing a component, widget or visual element that no family of {{package}} draws — a timeline strip, a seat map, a heat grid, a bespoke control. Proves first that no family answers, then builds the element from the theme's tokens with the states, focus, target size, forced colors and motion the families keep.
---

# Build an element of the application's own

An element of the application's own is a node the application writes and
styles itself, outside any family (CP-04). It is the last resort, and it is
built from the same theme as the families beside it.

## 1. Prove that no family answers

1. Read `{{docsDir}}/index.md` and list the families whose line is near the
   element.
2. Read `{{docsDir}}/<family>.md` for each: its anatomy, its slots, its axes.
   When a family draws the element, or names a slot that holds it, the family
   is used (CP-01).
3. When a family draws a part of the element — a toggle, a popup, a list, a
   tooltip — that part is the family, and only the rest is written.
4. Write, in a comment above the element, the families read and what each
   lacks.

## 2. What is free and what is fixed

Free, decided by the problem:

- the element's shape, its arrangement and how it encodes the data — a strip,
  a grid, a ring, a map;
- which states it has, and what each state shows;
- its layout inside the box it is given.

Fixed, read from the theme:

- every value it paints comes from a token of the group
  `{{docsDir}}/tokens.md` lists for that decision (OE-01, CP-05);
- a tone carries the meaning the `tone` group gives it, and a data series takes
  the `data` slots in order;
- how its states yield, how focus is drawn, how large a target is, what forced
  colors keep and how it moves (OE-02 to OE-07).

A new appearance is a new combination of tokens, never a new value.

## 3. Map each decision to a group

| Decision                                       | Group in `{{docsDir}}/tokens.md`                    |
| ---------------------------------------------- | --------------------------------------------------- |
| Distance between parts, inner padding          | `space`                                             |
| Corners                                        | `radius`                                            |
| Ground of the element and its parts            | `surface`; `tone` when the ground carries an intent |
| Text                                           | `text`, `font-size`, `font-weight`, `line-height`   |
| Edges                                          | `border`, `border-width`                            |
| Series and categories of data                  | `data`                                              |
| The place the reader is on, a matched span     | `current`, `highlight`                              |
| Focus                                          | `focus-ring`                                        |
| Hit area                                       | `target`                                            |
| A part that stands beside controls             | `control`, `control-size`                           |
| Movement                                       | `duration`, `easing`                                |
| A surface above another, a layer over the page | `shadow`, `z-index`                                 |
| A disabled part                                | `disabled`                                          |

A decision no group names is written as a literal beside a comment that says
why no token covers it (CP-05).

## 4. Write it

1. Give each interactive part the native element that carries its role: a
   button for an action, a link for a destination, an input for a value. Add
   ARIA only where no element carries the role.
2. List the element's states, and paint each pair that can hold at once in the
   order of OE-02.
3. Draw focus on `:focus-visible` as an outline of `--slotted-focus-ring-width`
   in `--slotted-focus-ring-color`, offset by `--slotted-focus-ring-offset`
   (OE-03). Size every target to `--slotted-target-min` (OE-04), and take the
   control step of the controls beside it (OE-05).
4. Under `forced-colors: active`, tell each state from rest by a border,
   an outline or text (OE-06). Move with the motion tokens, and stop a
   repeating animation under `prefers-reduced-motion: reduce` (OE-07).
5. Write the CSS in a layer of the application after the library's, on class
   names of the element's own (OE-08). Reflow by a container query on a
   container of its own (OE-09). Float with a raised surface and one shadow
   step (OE-10).
6. Text that stands alone takes its size from the `typography` family (CP-02).

## 5. Done

1. Each `Check` of `{{docsDir}}/guidelines/own-elements.md` passes.
2. The element's CSS holds no color or length literal without its comment.
3. Every custom property the element reads is listed in
   `{{docsDir}}/tokens.md` above "Read by their family only".
