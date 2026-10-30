---
topic: own elements
prefix: OE
triggers:
  [custom element, own component, bespoke, widget, CSS, style, token, hover, focus, animation]
families: [button, typography]
---

# Own elements

How an element no family draws is built from the theme: which tokens it reads,
how its states yield, and what it keeps under focus, touch, forced colours and
reduced motion. The families meet each rule below; an element of the
application's own meets them through the same tokens. Where a family answers
the problem, the family is used instead (CP-04).

### OE-01 · Own elements read application tokens

Level: MUST
Applies to: every element of the application's own that paints, spaces or moves
Rule: An element of the application's own reads only tokens of the groups `{{docsDir}}/tokens.md` lists for the application.
Why: A token of a family-only group is that family's adjustment and changes with it; an application group is the theme's promise.
Do: A strip of day cells spaces with `--slotted-space-2`, paints a busy day with `--slotted-tone-warning-surface` and rounds with `--slotted-radius-sm`.
Don't: A cell takes its height from `--slotted-avatar-size-sm` because the number fit.
Check: Every custom property of the element's own CSS that starts with --slotted- is listed in a group of tokens.md above "Read by their family only".

### OE-02 · Weaker states yield

Level: MUST
Applies to: an interactive element of the application's own
Rule: Where two states hold at once, the element paints the ground, the edge and the text colour of the stronger, in the order `disabled`, `loading`, `readonly`, `invalid`, `checked`, `selected`, `pressed`, `current`, `complete`, `active`, `hover`; the focus ring of OE-03 is drawn over every state.
Why: A disabled element that lights under the pointer reads as operable and answers nothing.
Do: The hover rule of a day cell excludes the disabled and the selected cell, so a selected day keeps its ground under the pointer.
Don't: A hover ground declared after the selected ground repaints the chosen day while the pointer crosses it.
Check: Put the pointer over a disabled, a selected and a current instance: each keeps the appearance of its stronger state; move focus to each: the ring is drawn on all three.

### OE-03 · Focus draws the theme's ring

Level: MUST
Applies to: every element of the application's own that takes focus
Rule: In its `focus-visible` state the element draws an outline of `--slotted-focus-ring-width` in `--slotted-focus-ring-color`, offset by `--slotted-focus-ring-offset`.
Why: The ring is the one focus indicator the families share, and the theme maps its colour to the system highlight under forced colours.
Do: A day cell draws the outline in `focus-visible` and keeps it while selected; in error it points `--slotted-focus-ring-color` at `--slotted-focus-ring-color-invalid`.
Don't: `outline: none` on the cell, with a change of ground as the only sign of focus.
Check: Move focus with the keyboard in the light, dark and high-contrast schemes: the ring is drawn at the theme's width and offset in each.

### OE-04 · Targets meet the minimum

Level: MUST
Applies to: every element of the application's own that a pointer activates
Rule: The element's hit area measures at least `--slotted-target-min` in both axes, and at least `--slotted-target-comfortable` under `pointer: coarse`.
Why: A target below the minimum fails WCAG 2.2 target size, and a fingertip misses a target sized for a mouse.
Do: A day cell narrower than the minimum keeps its drawing and extends its hit area to the minimum.
Don't: Day cells 16 pixels wide, side by side with no gap.
Check: Measure the hit area of the smallest instance with a fine pointer and under coarse-pointer emulation.

### OE-05 · One control size step

Level: SHOULD
Applies to: an element of the application's own that stands in a row of controls
Rule: The element takes its height, inline padding, font size and gap from `--slotted-control-*` tokens of one size step, the step of the controls beside it.
Why: The control tokens follow density; a control sized by hand keeps its height when the row around it shrinks.
Do: A week picker beside a `button` at the medium step reads `--slotted-control-height-md`, `--slotted-control-padding-inline-md`, `--slotted-control-font-size-md` and `--slotted-control-gap-md`.
Don't: A height taken from the space scale that matches the button only at the comfortable density.
Check: Switch the density among comfortable, compact and dense: the element's height equals the height of the button beside it in each.

### OE-06 · Forced colours keep states

Level: MUST
Applies to: an element of the application's own that shows a state
Rule: Under `forced-colors: active`, each state the element shows differs from rest by a border, an outline or text, not by a ground or a shadow alone.
Why: The system replaces every ground with its own and removes shadows, so a state carried by colour alone disappears.
Do: A selected day adds an edge of `--slotted-border-width-thick` to its tinted ground.
Don't: A selected day told apart only by `--slotted-tone-accent-surface`.
Check: Emulate forced colours and step through every state: each reads differently from rest.

### OE-07 · Motion follows the scale

Level: MUST
Applies to: every transition and animation of an element of the application's own
Rule: A transition takes its duration from the `duration` group or `--slotted-control-transition-duration`, its curve from the `easing` group or `--slotted-control-transition-easing`, and an animation that repeats stops under `prefers-reduced-motion: reduce`.
Why: The theme collapses transition durations under reduced motion; a literal duration and a loop stay outside that collapse.
Do: A cell eases its ground over `--slotted-duration-short` with `--slotted-easing-standard`; its pulsing marker stops under reduced motion and keeps its shape.
Don't: A 300 ms transition written as a literal, and a pulse that only slows down.
Check: Emulate reduced motion: no animation of the element runs, and its transitions complete at once.

### OE-08 · Own CSS stays outside families

Level: SHOULD
Applies to: the stylesheet and the markup of an element of the application's own
Rule: The element's rules stand in a layer of the application ordered after the library's, and never select or set `data-ui` or `data-part`.
Why: Those attributes name a family and its parts; a rule keyed on them changes a family, and a node that carries them is taken for one.
Do: The strip's layer is declared after the library's in the application's entry stylesheet, and its rules key on its own class names.
Don't: A rule keyed on a family's `data-part` that restyles the family beside the strip.
Check: Search the element's CSS and markup for data-ui and data-part, and read the application's layer statement: the library's layer comes first.

### OE-09 · Reflow follows the container

Level: SHOULD
Applies to: an element of the application's own that changes layout with width
Rule: The element reflows by a container query on a `container-name` of its own; a change that follows the page uses the size classes, at 600 and 1024 pixels.
Why: The families reflow by their own container and the page by its size class; a viewport query disagrees with both inside a split view.
Do: The strip names its container and drops to two rows of cells below its own threshold.
Don't: A viewport media query that folds the strip after its panel is already narrow.
Check: At a fixed viewport, resize the element's container across its threshold and the page across 600 and 1024 pixels.

### OE-10 · Elevation pairs surface and shadow

Level: SHOULD
Applies to: an element of the application's own that stands above another surface
Rule: A surface above another takes `--slotted-surface-raised` with one step of the `shadow` group, and a layer that floats over the page takes its stacking order from the `z-index` group.
Why: The theme pairs each elevation with a ground per scheme and drops shadows under forced colours; a shadow or a stacking order written by hand stays outside both.
Do: A day's detail card floats with `--slotted-surface-raised`, `--slotted-shadow-md` and `--slotted-z-index-popover`.
Don't: A shadow written as a literal and a stacking order of 9999.
Check: Every shadow and every stacking order of the element's own CSS reads a token of these two groups.
