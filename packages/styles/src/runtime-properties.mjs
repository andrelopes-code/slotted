/**
 * Custom properties a stylesheet reads and no theme writes.
 *
 * `docs/build-briefing.md` records the decision under _Decisions already
 * taken_: "A value a stylesheet needs and only script can measure is a custom
 * property under the name that says so." The overlay infrastructure writes
 * these from `packages/core` at runtime — where the anchor is, how much room is
 * left, where the arrow ended up, how deep in the layer stack a layer sits.
 *
 * They are not design tokens. They are absent from
 * `packages/theme/src/contract.json`, they have no foundation fallback because
 * no foundation value could answer "where is the arrow", and a reference page
 * that printed them under "Theme-owned decisions" would be telling a consumer
 * to retune something no theme can reach.
 *
 * `tokens.test.mjs` subtracts them before comparing a stylesheet to its
 * `tokens.json`, which is the whole reason this list is shared rather than
 * inlined there: the next family that meets one should find the reason written.
 */
export const RUNTIME_PROPERTY_PREFIXES = [
  /** `packages/core/src/positioner` — the anchor's size, the space left, the transform origin, the arrow. */
  '--slotted-positioner-',
  /** `packages/core/src/dismissable-layer` — this layer's position in the single stack. */
  '--slotted-layer-depth',
  /**
   * `packages/core/src/toast` — how far a message is from the front of the
   * stack, how many are visible, how tall each one is and how much room the
   * ones in front of it take, how long this one was given, whether the timers
   * are running, and how far the pointer has taken a message it is dragging
   * away.
   *
   * Two of them are the ones that look like something else and are not.
   * `--slotted-toast-duration` looks like a motion token: it is the time *this
   * message* was given, stated per message, which no theme can know, and the
   * remaining-time bar reads it so the picture and the timer are one number.
   * `--slotted-toast-height` looks like a size token: it is the height this
   * message turned out to be, measured, and it is what lets a collapsed pile
   * open into a readable column instead of snapping into one.
   *
   * They are named one by one rather than by a `--slotted-toast-` prefix,
   * because the family also owns theme tokens under that prefix — its measure,
   * its offset, its gap — and a prefix would file every one of them as a value
   * no theme can retune.
   */
  '--slotted-toast-count',
  '--slotted-toast-duration',
  '--slotted-toast-front-height',
  '--slotted-toast-height',
  '--slotted-toast-index',
  '--slotted-toast-play-state',
  '--slotted-toast-stack-height',
  '--slotted-toast-stack-offset',
  '--slotted-toast-swipe-x',
  '--slotted-toast-swipe-y',
  /**
   * `page-header` and `page` — the geometry of the chrome that stays while the
   * page scrolls. `--slotted-page-header-collapse` is the measured height of
   * the header area, which is the root's negative sticky offset: the first
   * that many pixels leave the scrollport and the title area stays.
   * `--slotted-page-sticky-top` is the height of everything that stays at the
   * top, and `--slotted-page-sticky-bottom` the height of the footer, both
   * written on the scroll container so a section's sticky header, a table's
   * sticky column header and a consumer's own sticky element inside the page
   * can stop under the chrome rather than behind it. No
   * theme can know any of the three: they are what the header turned out to
   * be, measured.
   */
  '--slotted-page-header-collapse',
  '--slotted-page-sticky-top',
  '--slotted-page-sticky-bottom',
  /**
   * `section` — the measured height of a sticky section's header, written on
   * the section's root so the body can republish `--slotted-page-sticky-top`
   * as page plus header for everything under it.
   */
  '--slotted-section-header-size',
  /**
   * `tree` — how deep in the hierarchy one node sits. The stylesheet multiplies
   * it by the indent step to inset the row, and no theme can know it: it is a
   * fact about the consumer's data, stated per node, in the same category as
   * the measured values above rather than in the category of a value a theme
   * retunes. The step itself is `--slotted-tree-indent`, which is a token and
   * is in the contract.
   *
   * It is named on its own rather than by a `--slotted-tree-` prefix, because
   * the family owns fifteen theme tokens under that prefix and a prefix would
   * file every one of them as unreachable by a theme.
   */
  '--slotted-tree-depth',
  /**
   * `tree` — where one row sits on a windowed canvas, in pixels. It is written
   * only on a row the window does not cover and the family renders anyway: the
   * active node, and the anchor a range is measured from. The number is the
   * product of a measured viewport and a scroll position, so no theme can hold
   * it, and a row without it is a row in flow that does not read it.
   */
  '--slotted-tree-row-offset',
  /**
   * `segmented-control` — how many segments the track holds, and which of them
   * is checked. The thumb is one column wide and moves by its own width times
   * the index, so the two numbers are the whole of its geometry and no theme
   * can hold either: they are facts about this consumer's options, stated per
   * instance.
   *
   * They are the first runtime properties in the library that are not
   * measured. An index and a count are known while the markup is being
   * written, which is the point of them — Mantine and Ark both measure the
   * checked node instead, and paint the thumb in the wrong place until
   * hydration.
   *
   * Named one by one rather than by a `--slotted-segmented-control-` prefix,
   * because the family owns theme tokens under that prefix — its inset, its
   * radius, its grounds — and a prefix would file every one of them as a value
   * no theme can retune.
   */
  '--slotted-segmented-control-count',
  '--slotted-segmented-control-index',
  /**
   * `data-grid` — the geometry only the binding knows. The template is one
   * track per visible column in the state's order, at the widths the reader
   * left them; the column index places a cell in it explicitly, because with
   * column virtualisation the cells that are not there would move the ones
   * that are; the pin offset is the summed width of the pinned columns
   * before this one; the level is how deep a group row sits; the drop
   * offset is where the reorder indicator stands; the window start and total
   * are the virtualiser's offset of the first mounted row and the height of
   * every row; the leading width is the gutters' sum, where a row's pop-in
   * starts. None of them is a value a theme can hold.
   *
   * Named one by one rather than by a `--slotted-data-grid-` prefix, because
   * the family owns theme tokens under that prefix — its row height, its
   * grounds, its radius — and a prefix would file every one of them as a
   * value no theme can retune.
   */
  '--slotted-data-grid-template',
  '--slotted-data-grid-column',
  '--slotted-data-grid-pin-offset',
  '--slotted-data-grid-level',
  '--slotted-data-grid-drop-offset',
  '--slotted-data-grid-drop-scroll',
  '--slotted-data-grid-changed-duration',
  '--slotted-data-grid-pinned-top-offset',
  '--slotted-data-grid-pinned-bottom-offset',
  '--slotted-data-grid-window-start',
  '--slotted-data-grid-window-total',
  /** The scroller's measured width, which holds a detail, a group row and the empty state to the frame. */
  '--slotted-data-grid-viewport',
  /** The measured body row height, which the skeleton rows take while the rows load. */
  '--slotted-data-grid-loader-row-size',
  '--slotted-data-grid-leading',
  /**
   * `upload` — how many rows of the file list are shown before the rest is
   * scrolled to. It is `maxRows`, stated per instance, and no theme can hold
   * it: a form that takes one avatar and a page that takes a folder of four
   * hundred invoices want different numbers from the same theme: it is a fact
   * about this consumer's data rather than a value a theme retunes.
   *
   * `maxRows: 0` means no bound, and the binding says so by writing the file
   * count rather than a second property: a cap that is the content's own
   * height is a cap nothing reaches.
   *
   * Named on its own rather than by a `--slotted-upload-` prefix, because the
   * family owns thirty-three theme tokens under that prefix and a prefix would
   * file every one of them as unreachable by a theme.
   */
  '--slotted-upload-visible-rows',
  /**
   * `code-block` — four facts about the content, written by the binding: how
   * many digits the last line number has, so the gutter is measured in
   * characters; the leading whitespace of a line, so a wrapped continuation
   * keeps the code's own indent; the line the block collapses after; and the
   * line it scrolls past. No theme can know any of them. Named one by one
   * rather than by a prefix, for the reason `tree-depth` is: the family owns
   * theme tokens under `--slotted-code-block-`.
   */
  '--slotted-code-block-digits',
  '--slotted-code-block-indent',
  '--slotted-code-block-collapse',
  '--slotted-code-block-max-lines',
  /**
   * `chart` — where the point the reader is on sits, in the engine's pixels,
   * and the band of its category. The crosshair, the marker and the tooltip
   * are the family's HTML drawn over the engine's drawing, and only the engine
   * knows where a mark landed. Named one by one because the family owns theme
   * tokens under `--slotted-chart-`.
   */
  '--slotted-chart-x',
  '--slotted-chart-y',
  '--slotted-chart-band-start',
  '--slotted-chart-band-size',
  '--slotted-chart-frame-start',
  '--slotted-chart-frame-size',
  /**
   * `event-calendar` — where an event is drawn, computed by
   * `@slotted/core/event-calendar` from the consumer's events: its lane in a
   * row of days and how many days its bar covers; its minute and length in a
   * column of hours, its column in a cluster of overlapping events and how many
   * columns the cluster has; and, on the grid, how many days the grid draws and
   * how many lanes each row reserves. They are facts about this consumer's data
   * and this instance's `maxEvents`, which no theme can hold.
   *
   * Named one by one rather than by a prefix: the family owns theme tokens
   * under `--slotted-event-calendar-`, and `--slotted-event-` would file them.
   */
  '--slotted-event-lane',
  '--slotted-event-span',
  '--slotted-event-start',
  '--slotted-event-length',
  '--slotted-event-column',
  '--slotted-event-columns',
  '--slotted-event-calendar-days',
  '--slotted-event-calendar-lanes',
  '--slotted-event-calendar-slot',
  /**
   * `tour` — the rectangle of the current step's target, in viewport pixels,
   * read from `getBoundingClientRect()` and kept current while the page
   * scrolls. It is a fact about the page the tour stands over.
   */
  '--slotted-tour-target-',
  /**
   * `observeKeyboardInset` in `@slotted/core/measure` — how much of the layout viewport the
   * virtual keyboard covers, read from `visualViewport`. An open overlay layer
   * writes it on its own root so what it holds lands above the keys. It is a
   * fact about the device at this moment, which no theme can hold.
   */
  '--slotted-keyboard-inset',
  /**
   * `rating` — how much of one symbol of the display member is lit, from 0 to
   * 1, written on each item by the binding from the value it reports. A 4.6 of
   * five is four items at 1 and one at 0.6; the share is a fact about this
   * instance's value, which no theme can hold. The input member derives the
   * same share in its stylesheet from the checked radio and never writes it.
   */
  '--slotted-rating-fill',
  /**
   * `rating` — one level's share of all the ratings a summary counts, from 0
   * to 1, written on the level's bar by the binding from the counts it is
   * given.
   */
  '--slotted-rating-share',
  /**
   * `rating` — where the spectrum places the mean and the two ends of its 95%
   * interval on the scale, from 1 to the maximum, written on the summary's
   * root from `summariseRatings`.
   */
  '--slotted-rating-mean',
  '--slotted-rating-low',
  '--slotted-rating-high',
  /**
   * `message` — how many lines a bubble shows before it is clamped, written on
   * the bubble by the binding from `maxLines`. It is a fact about this
   * instance's content, stated per bubble, which no theme can hold.
   */
  '--slotted-message-max-lines',
  /**
   * `message-scroller` — the room the engine keeps below the last row so an
   * anchored turn can stand at the top of the viewport while its reply is still
   * short. It is the viewport's height less what follows the anchor, measured,
   * and it shrinks to nothing as the reply grows.
   */
  '--slotted-message-scroller-room',
  /**
   * `cascader` — how deep a node sits under `layout="tree"`, counted from 0 at
   * the roots, written on each node by the binding from the collection. The
   * tree layout renders the visible nodes as one flat run with `aria-level`,
   * so the indent is this number times `--slotted-cascader-indent`, the token.
   * Named on its own for the reason `tree-depth` is.
   */
  '--slotted-cascader-depth',
  /**
   * `carousel` — how many slides one view holds, written on the root by the
   * binding from `slidesPerView`, and how long the rotation waits on a page,
   * written from `autoplay`. The first is read by the track sizing and the
   * second by the fill of the current indicator, so the picture and the timer
   * are one number. A consumer may still write the first in its own container
   * query when it passes no prop; neither is a value a theme can hold.
   */
  '--slotted-carousel-slides-per-view',
  '--slotted-carousel-autoplay-delay',
  /**
   * `carousel` — how far a drag has pulled the slides past an end, written on
   * the viewport by `@slotted/core/carousel` frame by frame as a translate
   * value, and sprung back to nothing on release. A scroller cannot draw past
   * its ends, so the pull is the slides' own `translate`.
   */
  '--slotted-carousel-overscroll',
  /**
   * `color-picker` — the colour this instance holds, with and without its
   * alpha, the hue it remembers when the colour has none, where the area's
   * thumb stands (saturation and brightness, 0 to 1), how opaque the colour
   * is (0 to 1), and the colour the panel opened with. Each is written on the
   * root by the binding from the value `@slotted/core/color` parsed; a colour
   * the reader picked is a fact about this instance, which no theme can hold.
   */
  '--slotted-color-picker-color',
  '--slotted-color-picker-opaque',
  '--slotted-color-picker-hue',
  '--slotted-color-picker-x',
  '--slotted-color-picker-y',
  '--slotted-color-picker-alpha',
  '--slotted-color-picker-previous',
  '--slotted-color-picker-preset',
  '--slotted-color-picker-contrast-with',
  /**
   * `navigation-menu` — the open panel's measured size, where the shared
   * surface stands under the row (or beside the column), where the arrow
   * points from, and how much room is left before the window's edge. Written
   * on the root by `@slotted/core/navigation-menu` from the open content and
   * its trigger; the family also owns theme tokens under the same prefix — its
   * column size, its offset, its radius — so each is named one by one.
   */
  '--slotted-navigation-menu-viewport-inline-size',
  '--slotted-navigation-menu-viewport-block-size',
  '--slotted-navigation-menu-viewport-inline-start',
  '--slotted-navigation-menu-viewport-block-start',
  '--slotted-navigation-menu-arrow-offset',
  '--slotted-navigation-menu-available-inline-size',
  /**
   * `media-viewer` — the box the picture takes at the current level and its
   * quarter turn, measured from the stage and the picture's own size by the
   * binding. The family also owns theme tokens under the same prefix, so each
   * is named one by one.
   */
  '--slotted-media-viewer-frame-inline-size',
  '--slotted-media-viewer-frame-block-size',
  '--slotted-media-viewer-media-inline-size',
  '--slotted-media-viewer-media-block-size',
  '--slotted-media-viewer-rotation',
];

/** Whether a custom property is written by script rather than by a theme. */
export function isRuntimeProperty(name) {
  return RUNTIME_PROPERTY_PREFIXES.some((prefix) => name.startsWith(prefix));
}
