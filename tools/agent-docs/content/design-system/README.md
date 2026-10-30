Slotted is a library of component families for React (`@slotted/react`) and Angular (`@slotted/angular`). Each family draws one kind of interface — a button, a field, a data grid, a page header — and reads every value it paints from the theme. These rules hold for a screen built from the families and for anything built beside them. An id such as CP-01 names a rule of the Slotted guidelines; each package ships them in the guidelines index of its documentation directory: dist/docs in the React package, docs in the Angular one.

## Build with the families

- Compose a screen from the families first. Before writing an element next to a family, read the family's anatomy: when it names a slot for that element, put the element in the slot (CP-01).
- Change a family's look through its own options — its size, variant and tone — never through CSS on its parts.
- Write an element of your own only where no family answers the problem (CP-04), and paint it with the tokens below, never with a literal (CP-05).
- Space siblings of your own with `inline` or `stack` and a step of the space scale, and size their text with the `typography` family (CP-02).

## Color

- Stand the page's content and a card on `--slotted-surface`. Lift a popover, a menu or a dialog onto `--slotted-surface-raised` with one step of the shadow scale. Set the canvas under the content in `--slotted-surface-sunken`.
- Write text in `--slotted-text`; text that ranks below the text beside it — a caption, a hint, a secondary value — in `--slotted-text-muted`; text on `--slotted-surface-inverse` in `--slotted-text-inverse`.
- Draw a rule inside a surface — a divider, the edge of a region — with `--slotted-border-subtle`, and the line between two surfaces with `--slotted-border-strong`.
- Paint an intent with its tone: `accent` for the product's intent — the primary action, the chosen option, the current place; `secondary` for a second intent that must not compete with it; `success` for a result that completed or a healthy state; `warning` for a state that needs attention before it fails; `danger` for a failure, an error or an action that destroys data.
- Every tone has the same roles. `--slotted-tone-accent-solid` fills a ground and `--slotted-tone-accent-on-solid` writes text and icons on it; `--slotted-tone-accent-surface` tints a ground, and a state that must be seen pairs it with `--slotted-tone-accent-border`; `--slotted-tone-accent-text` writes in the tone on a surface.
- Draw a series of data with `--slotted-data-1` and the slots after it, in order, never skipping one.
- Dim the page behind a modal with `--slotted-scrim`.
- Set color through the five seeds — `--slotted-seed-accent`, `--slotted-seed-neutral`, `--slotted-seed-success`, `--slotted-seed-warning` and `--slotted-seed-danger`. Every color token derives from them within contrast bounds, so a new seed keeps the ratios of every scheme.

## Schemes and density

- Every color has a value in `light`, `dark` and `high-contrast`. Name the scheme with `data-slotted-scheme` on any element; `system` follows the reader's preference.
- In `high-contrast`, states differ by edge width as well as color: an invalid control adds `--slotted-control-invalid-edge-width` inside its border.
- Density is `comfortable`, `compact` or `dense`, named with `data-slotted-density`. Controls take their height, inline padding and font size from the control size tokens of their step, such as `--slotted-control-height-md`.

## Type

- Set text in `--slotted-font-family-sans` (Geist), code and figures that align in `--slotted-font-family-mono` (Geist Mono), and headings in `--slotted-font-family-heading`.
- Take sizes from the steps `--slotted-font-size-xs` to `--slotted-font-size-4xl`, each with the line height of the same step, such as `--slotted-line-height-md` beside `--slotted-font-size-md`.
- Weigh text with `--slotted-font-weight-regular`, `--slotted-font-weight-medium` and `--slotted-font-weight-semibold`.

## Space, corners and lines

- Space with the twelve steps `--slotted-space-1` to `--slotted-space-12`; a step is never replaced by a literal.
- Round with `--slotted-radius-xs` to `--slotted-radius-lg`, `--slotted-radius-none` for square and `--slotted-radius-full` for a pill.
- Draw lines at `--slotted-border-width-thin`, `--slotted-border-width-medium` or `--slotted-border-width-thick`.

## States and focus

- Where two states hold at once, paint the stronger, in the order `disabled`, `loading`, `readonly`, `invalid`, `checked`, `selected`, `pressed`, `current`, `complete`, `active`, `hover` (OE-02).
- Draw keyboard focus as an outline of `--slotted-focus-ring-width` in `--slotted-focus-ring-color`, offset by `--slotted-focus-ring-offset`, over every state (OE-03).
- Give every target at least `--slotted-target-min`, and `--slotted-target-comfortable` under a coarse pointer (OE-04).
- Paint a disabled part with `--slotted-disabled-background`, `--slotted-disabled-foreground` and `--slotted-disabled-border`.

## Elevation and motion

- Stack a layer over the page by the `z-index` scale: `--slotted-z-index-sticky`, `--slotted-z-index-overlay`, `--slotted-z-index-popover` and `--slotted-z-index-toast` (OE-10).
- Move with a duration of the `duration` group and a curve of the `easing` group, such as `--slotted-duration-short` with `--slotted-easing-standard`; stop a repeating animation under reduced motion (OE-07).

## Waiting, empty and error

- A region whose first answer has not arrived shows its pending state, never its empty state (AF-01).
- A region with no items yet draws placeholders shaped like the content they stand in for (AF-02).
- A control that starts a request is in its `loading` state until the answer, and refuses a second activation (AF-03).

## Iconography

- A family draws its own icons with the Glyph element, from the theme's glyph set; no stylesheet paints an icon.
- An icon that carries meaning has a text alternative, and a state is never told by an icon or a color alone.
